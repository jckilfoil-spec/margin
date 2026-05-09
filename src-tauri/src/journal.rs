// Journal-file IO commands.
//
// We deliberately bypass tauri-plugin-fs for the journal directory: the
// folder is user-chosen at runtime, and granting plugin-fs scope to an
// arbitrary path is more ceremony than the four primitives we actually need.
// Every command takes an absolute path string and returns a String error so
// the frontend can surface it.

use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::Path;

#[tauri::command]
pub fn list_journal_files(dir: String) -> Result<Vec<String>, String> {
    let path = Path::new(&dir);
    if !path.is_dir() {
        return Ok(vec![]);
    }
    let mut files: Vec<String> = Vec::new();
    for entry in fs::read_dir(path).map_err(|e| format!("read_dir failed: {e}"))? {
        let entry = entry.map_err(|e| format!("read_dir entry failed: {e}"))?;
        let file_type = entry
            .file_type()
            .map_err(|e| format!("file_type failed: {e}"))?;
        if !file_type.is_file() {
            continue;
        }
        if let Some(name) = entry.file_name().to_str() {
            if name.ends_with(".md") {
                files.push(name.to_string());
            }
        }
    }
    files.sort();
    Ok(files)
}

#[tauri::command]
pub fn read_journal_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("read_to_string failed: {e}"))
}

#[tauri::command]
pub fn write_journal_file(path: String, contents: String) -> Result<(), String> {
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent).map_err(|e| format!("create_dir_all failed: {e}"))?;
    }
    fs::write(&path, contents).map_err(|e| format!("write failed: {e}"))
}

#[tauri::command]
pub fn journal_file_exists(path: String) -> Result<bool, String> {
    Ok(Path::new(&path).exists())
}

#[tauri::command]
pub fn ensure_journal_dir(path: String) -> Result<(), String> {
    fs::create_dir_all(&path).map_err(|e| format!("create_dir_all failed: {e}"))
}

#[tauri::command]
pub fn delete_journal_file(path: String) -> Result<(), String> {
    // Idempotent: a NotFound error means the goal state (file gone) is
    // already met, so we report success. Any other error (permissions,
    // IO) bubbles up.
    match fs::remove_file(&path) {
        Ok(()) => Ok(()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(e) => Err(format!("remove_file failed: {e}")),
    }
}

/// Atomically allocate the next "_NN" page for `date` inside `dir` and
/// return its filename.
///
/// The whole allocation lives in Rust so concurrent clicks can't collide:
/// `OpenOptions::create_new(true)` maps to `O_CREAT | O_EXCL` on POSIX and
/// `CREATE_NEW` on Windows — both OS-level atomic. If two callers compute
/// the same next suffix, only one's create succeeds; the other catches
/// `AlreadyExists` and bumps. We start the search at (max-existing-suffix
/// + 1) so callers always go *past* the highest seen page rather than
/// filling in gaps.
#[tauri::command]
pub fn append_today_page(dir: String, date: String) -> Result<String, String> {
    let dir_path = Path::new(&dir);
    if !dir_path.is_dir() {
        return Err(format!("dir does not exist: {dir}"));
    }

    let prefix = format!("{date}_");

    let mut max_suffix: u32 = 0;
    for entry in fs::read_dir(dir_path).map_err(|e| format!("read_dir failed: {e}"))? {
        let entry = entry.map_err(|e| format!("read_dir entry failed: {e}"))?;
        let file_type = entry
            .file_type()
            .map_err(|e| format!("file_type failed: {e}"))?;
        if !file_type.is_file() {
            continue;
        }
        if let Some(name) = entry.file_name().to_str() {
            if !name.ends_with(".md") || !name.starts_with(&prefix) {
                continue;
            }
            let middle = &name[prefix.len()..name.len() - 3];
            if let Ok(n) = middle.parse::<u32>() {
                if n > max_suffix {
                    max_suffix = n;
                }
            }
        }
    }

    let mut next = max_suffix.saturating_add(1);
    for _ in 0..1000u32 {
        let stem = format!("{date}_{:02}", next);
        let name = format!("{stem}.md");
        let path = dir_path.join(&name);
        match OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&path)
        {
            Ok(mut file) => {
                let header = format!("# {stem}\n\n");
                if let Err(e) = file.write_all(header.as_bytes()) {
                    drop(file);
                    let _ = fs::remove_file(&path);
                    return Err(format!("write failed: {e}"));
                }
                return Ok(name);
            }
            Err(e) if e.kind() == std::io::ErrorKind::AlreadyExists => {
                next = next.saturating_add(1);
                continue;
            }
            Err(e) => return Err(format!("create_new failed: {e}")),
        }
    }
    Err("ran out of attempts to allocate a new page suffix".into())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn list_returns_only_md_files_sorted() {
        let tmp = tempfile::tempdir().unwrap();
        fs::write(tmp.path().join("2026-05-08.md"), "x").unwrap();
        fs::write(tmp.path().join("2026-05-07.md"), "x").unwrap();
        fs::write(tmp.path().join("note.txt"), "y").unwrap();
        fs::create_dir(tmp.path().join("nested")).unwrap();

        let files = list_journal_files(tmp.path().to_string_lossy().into()).unwrap();
        assert_eq!(
            files,
            vec!["2026-05-07.md".to_string(), "2026-05-08.md".to_string()]
        );
    }

    #[test]
    fn list_missing_dir_returns_empty() {
        let files = list_journal_files("C:/nope/this/does/not/exist".into()).unwrap();
        assert!(files.is_empty());
    }

    #[test]
    fn write_creates_parent_dirs_then_round_trips() {
        let tmp = tempfile::tempdir().unwrap();
        let nested = tmp.path().join("a").join("b").join("2026-05-09.md");
        let body = "# 2026-05-09\n\n- [ ] hello\n".to_string();

        write_journal_file(nested.to_string_lossy().into(), body.clone()).unwrap();
        let read_back = read_journal_file(nested.to_string_lossy().into()).unwrap();
        assert_eq!(read_back, body);
    }

    #[test]
    fn exists_reports_correctly() {
        let tmp = tempfile::tempdir().unwrap();
        let path = tmp.path().join("x.md");
        assert!(!journal_file_exists(path.to_string_lossy().into()).unwrap());
        fs::write(&path, "x").unwrap();
        assert!(journal_file_exists(path.to_string_lossy().into()).unwrap());
    }

    #[test]
    fn ensure_dir_is_idempotent() {
        let tmp = tempfile::tempdir().unwrap();
        let target = tmp.path().join("journal");
        ensure_journal_dir(target.to_string_lossy().into()).unwrap();
        ensure_journal_dir(target.to_string_lossy().into()).unwrap();
        assert!(target.is_dir());
    }

    #[test]
    fn delete_removes_file() {
        let tmp = tempfile::tempdir().unwrap();
        let path = tmp.path().join("x.md");
        fs::write(&path, "x").unwrap();
        delete_journal_file(path.to_string_lossy().into()).unwrap();
        assert!(!path.exists());
    }

    #[test]
    fn delete_missing_file_is_a_no_op() {
        let tmp = tempfile::tempdir().unwrap();
        let path = tmp.path().join("nope.md");
        // Already-gone is a valid post-state — must not error.
        delete_journal_file(path.to_string_lossy().into()).unwrap();
    }

    #[test]
    fn append_creates_first_page_as_01() {
        let tmp = tempfile::tempdir().unwrap();
        let name = append_today_page(
            tmp.path().to_string_lossy().into(),
            "2026-05-09".into(),
        )
        .unwrap();
        assert_eq!(name, "2026-05-09_01.md");
        let body = fs::read_to_string(tmp.path().join(&name)).unwrap();
        assert_eq!(body, "# 2026-05-09_01\n\n");
    }

    #[test]
    fn append_increments_past_existing_max() {
        let tmp = tempfile::tempdir().unwrap();
        fs::write(tmp.path().join("2026-05-09_01.md"), "x").unwrap();
        fs::write(tmp.path().join("2026-05-09_02.md"), "x").unwrap();
        let name = append_today_page(
            tmp.path().to_string_lossy().into(),
            "2026-05-09".into(),
        )
        .unwrap();
        assert_eq!(name, "2026-05-09_03.md");
    }

    #[test]
    fn append_goes_past_max_even_with_gaps() {
        let tmp = tempfile::tempdir().unwrap();
        fs::write(tmp.path().join("2026-05-09_05.md"), "x").unwrap();
        let name = append_today_page(
            tmp.path().to_string_lossy().into(),
            "2026-05-09".into(),
        )
        .unwrap();
        assert_eq!(name, "2026-05-09_06.md");
    }

    #[test]
    fn append_ignores_other_dates_and_the_base_file() {
        let tmp = tempfile::tempdir().unwrap();
        fs::write(tmp.path().join("2026-05-09.md"), "x").unwrap();
        fs::write(tmp.path().join("2026-05-08_05.md"), "x").unwrap();
        let name = append_today_page(
            tmp.path().to_string_lossy().into(),
            "2026-05-09".into(),
        )
        .unwrap();
        assert_eq!(name, "2026-05-09_01.md");
    }

    #[test]
    fn append_errors_when_dir_missing() {
        let err = append_today_page(
            "C:/definitely/not/a/real/path/append_today_page".into(),
            "2026-05-09".into(),
        )
        .unwrap_err();
        assert!(err.contains("dir does not exist"));
    }

    #[test]
    fn concurrent_appends_produce_distinct_filenames() {
        use std::collections::HashSet;
        use std::thread;

        let tmp = tempfile::tempdir().unwrap();
        let dir: String = tmp.path().to_string_lossy().into();
        let n_threads = 8;

        let handles: Vec<_> = (0..n_threads)
            .map(|_| {
                let dir = dir.clone();
                thread::spawn(move || {
                    append_today_page(dir, "2026-05-09".into()).unwrap()
                })
            })
            .collect();

        let names: Vec<String> =
            handles.into_iter().map(|h| h.join().unwrap()).collect();
        let unique: HashSet<_> = names.iter().cloned().collect();
        assert_eq!(unique.len(), n_threads, "got duplicates: {names:?}");
    }
}
