// Journal-file IO commands.
//
// We deliberately bypass tauri-plugin-fs for the journal directory: the
// folder is user-chosen at runtime, and granting plugin-fs scope to an
// arbitrary path is more ceremony than the four primitives we actually need.
// Every command takes an absolute path string and returns a String error so
// the frontend can surface it.

use std::fs;
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
}
