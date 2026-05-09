// Journal-file IO commands.
//
// Sections are subdirectories under journalDir; pages are .md files inside
// either the journal root (the virtual "Daily" group) or a section. Every
// command takes absolute path strings and returns String errors so the
// frontend can surface them.

use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::Path;

// Names entered by the user (sections, pages) must be safe to use as
// filesystem names: no separators, no traversal, not hidden, length-bounded.
fn validate_name(name: &str) -> Result<&str, String> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err("name cannot be empty".into());
    }
    if trimmed.chars().count() > 100 {
        return Err("name is too long (max 100 characters)".into());
    }
    if trimmed.contains('/') || trimmed.contains('\\') {
        return Err("name cannot contain '/' or '\\\\'".into());
    }
    if trimmed.starts_with('.') {
        return Err("name cannot start with '.'".into());
    }
    if trimmed == "." || trimmed == ".." {
        return Err("name cannot be '.' or '..'".into());
    }
    // Reject control characters and Windows-illegal chars.
    if trimmed
        .chars()
        .any(|c| c.is_control() || matches!(c, '<' | '>' | ':' | '"' | '|' | '?' | '*'))
    {
        return Err("name contains an illegal character".into());
    }
    Ok(trimmed)
}

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
pub fn list_sections(dir: String) -> Result<Vec<String>, String> {
    let path = Path::new(&dir);
    if !path.is_dir() {
        return Ok(vec![]);
    }
    let mut sections: Vec<String> = Vec::new();
    for entry in fs::read_dir(path).map_err(|e| format!("read_dir failed: {e}"))? {
        let entry = entry.map_err(|e| format!("read_dir entry failed: {e}"))?;
        let file_type = entry
            .file_type()
            .map_err(|e| format!("file_type failed: {e}"))?;
        if !file_type.is_dir() {
            continue;
        }
        if let Some(name) = entry.file_name().to_str() {
            // Hidden directories (".margin", ".git", etc.) aren't sections.
            if name.starts_with('.') {
                continue;
            }
            sections.push(name.to_string());
        }
    }
    sections.sort();
    Ok(sections)
}

#[tauri::command]
pub fn create_section(dir: String, name: String) -> Result<(), String> {
    let clean = validate_name(&name)?;
    let path = Path::new(&dir).join(clean);
    if path.exists() {
        return Err(format!("section already exists: {clean}"));
    }
    fs::create_dir(&path).map_err(|e| format!("create_dir failed: {e}"))
}

#[tauri::command]
pub fn rename_section(
    dir: String,
    old_name: String,
    new_name: String,
) -> Result<(), String> {
    let clean_new = validate_name(&new_name)?;
    let dir_path = Path::new(&dir);
    let old_path = dir_path.join(old_name.trim());
    let new_path = dir_path.join(clean_new);
    if !old_path.is_dir() {
        return Err(format!("section does not exist: {}", old_name.trim()));
    }
    if old_path == new_path {
        return Ok(());
    }
    if new_path.exists() {
        return Err(format!("section already exists: {clean_new}"));
    }
    fs::rename(&old_path, &new_path).map_err(|e| format!("rename failed: {e}"))
}

#[tauri::command]
pub fn delete_section(section_path: String) -> Result<(), String> {
    let path = Path::new(&section_path);
    if !path.is_dir() {
        // Idempotent: already gone is the desired post-state.
        return Ok(());
    }
    fs::remove_dir_all(path).map_err(|e| format!("remove_dir_all failed: {e}"))
}

#[tauri::command]
pub fn rename_journal_file(
    old_path: String,
    new_path: String,
) -> Result<(), String> {
    let old = Path::new(&old_path);
    let new = Path::new(&new_path);
    if !old.is_file() {
        return Err(format!("not a file: {old_path}"));
    }
    if old == new {
        return Ok(());
    }
    if new.exists() {
        return Err(format!("destination already exists: {new_path}"));
    }
    fs::rename(old, new).map_err(|e| format!("rename failed: {e}"))
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
    // Idempotent: NotFound is success.
    match fs::remove_file(&path) {
        Ok(()) => Ok(()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(e) => Err(format!("remove_file failed: {e}")),
    }
}

/// Atomically allocate the next page named with `base` inside `dir`.
///
/// Tries to create `<base>.md` first; if that exists, finds the highest
/// existing `<base>_NN.md` suffix and creates `<base>_<NN+1>.md`.
/// `OpenOptions::create_new(true)` is the OS-level atomic primitive
/// (`O_CREAT | O_EXCL` on POSIX, `CREATE_NEW` on Windows), so concurrent
/// callers can never land on the same filename — the loser sees
/// `AlreadyExists`, bumps, and retries.
#[tauri::command]
pub fn append_page(dir: String, base: String) -> Result<String, String> {
    let dir_path = Path::new(&dir);
    if !dir_path.is_dir() {
        return Err(format!("dir does not exist: {dir}"));
    }

    // First try `<base>.md` itself.
    let base_filename = format!("{base}.md");
    let base_path = dir_path.join(&base_filename);
    match OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&base_path)
    {
        Ok(mut file) => {
            let header = format!("# {base}\n\n");
            if let Err(e) = file.write_all(header.as_bytes()) {
                drop(file);
                let _ = fs::remove_file(&base_path);
                return Err(format!("write failed: {e}"));
            }
            return Ok(base_filename);
        }
        Err(e) if e.kind() == std::io::ErrorKind::AlreadyExists => {
            // Fall through to suffix logic.
        }
        Err(e) => return Err(format!("create_new failed: {e}")),
    }

    // Find the max existing `<base>_NN` suffix.
    let prefix = format!("{base}_");
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
        let stem = format!("{base}_{:02}", next);
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
    Err("ran out of attempts to allocate a new page".into())
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
        delete_journal_file(path.to_string_lossy().into()).unwrap();
    }

    #[test]
    fn list_sections_returns_subdir_names_sorted() {
        let tmp = tempfile::tempdir().unwrap();
        fs::create_dir(tmp.path().join("Projects")).unwrap();
        fs::create_dir(tmp.path().join("Recipes")).unwrap();
        fs::create_dir(tmp.path().join(".hidden")).unwrap();
        fs::write(tmp.path().join("loose.md"), "x").unwrap();

        let sections = list_sections(tmp.path().to_string_lossy().into()).unwrap();
        assert_eq!(sections, vec!["Projects".to_string(), "Recipes".to_string()]);
    }

    #[test]
    fn create_section_makes_directory() {
        let tmp = tempfile::tempdir().unwrap();
        create_section(
            tmp.path().to_string_lossy().into(),
            "Projects".into(),
        )
        .unwrap();
        assert!(tmp.path().join("Projects").is_dir());
    }

    #[test]
    fn create_section_errors_when_exists() {
        let tmp = tempfile::tempdir().unwrap();
        fs::create_dir(tmp.path().join("Projects")).unwrap();
        let err = create_section(
            tmp.path().to_string_lossy().into(),
            "Projects".into(),
        )
        .unwrap_err();
        assert!(err.contains("already exists"));
    }

    #[test]
    fn create_section_rejects_path_separators() {
        let tmp = tempfile::tempdir().unwrap();
        let err = create_section(
            tmp.path().to_string_lossy().into(),
            "../escape".into(),
        )
        .unwrap_err();
        assert!(err.contains("'.'") || err.contains("'/'"));
    }

    #[test]
    fn rename_section_renames_directory() {
        let tmp = tempfile::tempdir().unwrap();
        fs::create_dir(tmp.path().join("Old")).unwrap();
        fs::write(tmp.path().join("Old").join("page.md"), "x").unwrap();

        rename_section(
            tmp.path().to_string_lossy().into(),
            "Old".into(),
            "New".into(),
        )
        .unwrap();

        assert!(!tmp.path().join("Old").exists());
        assert!(tmp.path().join("New").join("page.md").is_file());
    }

    #[test]
    fn rename_section_errors_when_target_exists() {
        let tmp = tempfile::tempdir().unwrap();
        fs::create_dir(tmp.path().join("A")).unwrap();
        fs::create_dir(tmp.path().join("B")).unwrap();
        let err = rename_section(
            tmp.path().to_string_lossy().into(),
            "A".into(),
            "B".into(),
        )
        .unwrap_err();
        assert!(err.contains("already exists"));
    }

    #[test]
    fn delete_section_removes_recursively() {
        let tmp = tempfile::tempdir().unwrap();
        let section = tmp.path().join("Doomed");
        fs::create_dir(&section).unwrap();
        fs::write(section.join("a.md"), "x").unwrap();
        fs::write(section.join("b.md"), "y").unwrap();

        delete_section(section.to_string_lossy().into()).unwrap();
        assert!(!section.exists());
    }

    #[test]
    fn delete_section_missing_is_a_no_op() {
        let tmp = tempfile::tempdir().unwrap();
        delete_section(tmp.path().join("nope").to_string_lossy().into()).unwrap();
    }

    #[test]
    fn rename_journal_file_moves_the_file() {
        let tmp = tempfile::tempdir().unwrap();
        let old = tmp.path().join("old.md");
        let new = tmp.path().join("new.md");
        fs::write(&old, "body").unwrap();

        rename_journal_file(
            old.to_string_lossy().into(),
            new.to_string_lossy().into(),
        )
        .unwrap();

        assert!(!old.exists());
        assert_eq!(fs::read_to_string(&new).unwrap(), "body");
    }

    #[test]
    fn rename_journal_file_errors_if_destination_exists() {
        let tmp = tempfile::tempdir().unwrap();
        let a = tmp.path().join("a.md");
        let b = tmp.path().join("b.md");
        fs::write(&a, "x").unwrap();
        fs::write(&b, "y").unwrap();
        let err = rename_journal_file(
            a.to_string_lossy().into(),
            b.to_string_lossy().into(),
        )
        .unwrap_err();
        assert!(err.contains("already exists"));
    }

    #[test]
    fn rename_journal_file_errors_if_source_missing() {
        let tmp = tempfile::tempdir().unwrap();
        let err = rename_journal_file(
            tmp.path().join("nope.md").to_string_lossy().into(),
            tmp.path().join("dest.md").to_string_lossy().into(),
        )
        .unwrap_err();
        assert!(err.contains("not a file"));
    }

    #[test]
    fn append_creates_base_when_absent() {
        let tmp = tempfile::tempdir().unwrap();
        let name = append_page(
            tmp.path().to_string_lossy().into(),
            "untitled".into(),
        )
        .unwrap();
        assert_eq!(name, "untitled.md");
        let body = fs::read_to_string(tmp.path().join(&name)).unwrap();
        assert_eq!(body, "# untitled\n\n");
    }

    #[test]
    fn append_creates_01_when_base_exists() {
        let tmp = tempfile::tempdir().unwrap();
        fs::write(tmp.path().join("2026-05-09.md"), "x").unwrap();
        let name = append_page(
            tmp.path().to_string_lossy().into(),
            "2026-05-09".into(),
        )
        .unwrap();
        assert_eq!(name, "2026-05-09_01.md");
    }

    #[test]
    fn append_increments_past_existing_max_suffix() {
        let tmp = tempfile::tempdir().unwrap();
        fs::write(tmp.path().join("2026-05-09.md"), "x").unwrap();
        fs::write(tmp.path().join("2026-05-09_01.md"), "x").unwrap();
        fs::write(tmp.path().join("2026-05-09_02.md"), "x").unwrap();
        let name = append_page(
            tmp.path().to_string_lossy().into(),
            "2026-05-09".into(),
        )
        .unwrap();
        assert_eq!(name, "2026-05-09_03.md");
    }

    #[test]
    fn append_goes_past_max_even_with_gaps() {
        let tmp = tempfile::tempdir().unwrap();
        fs::write(tmp.path().join("2026-05-09.md"), "x").unwrap();
        fs::write(tmp.path().join("2026-05-09_05.md"), "x").unwrap();
        let name = append_page(
            tmp.path().to_string_lossy().into(),
            "2026-05-09".into(),
        )
        .unwrap();
        assert_eq!(name, "2026-05-09_06.md");
    }

    #[test]
    fn append_ignores_other_bases() {
        let tmp = tempfile::tempdir().unwrap();
        fs::write(tmp.path().join("2026-05-08_05.md"), "x").unwrap();
        let name = append_page(
            tmp.path().to_string_lossy().into(),
            "2026-05-09".into(),
        )
        .unwrap();
        assert_eq!(name, "2026-05-09.md");
    }

    #[test]
    fn append_errors_when_dir_missing() {
        let err = append_page(
            "C:/definitely/not/a/real/path/append_page".into(),
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
                    append_page(dir, "2026-05-09".into()).unwrap()
                })
            })
            .collect();

        let names: Vec<String> =
            handles.into_iter().map(|h| h.join().unwrap()).collect();
        let unique: HashSet<_> = names.iter().cloned().collect();
        assert_eq!(unique.len(), n_threads, "got duplicates: {names:?}");
    }
}
