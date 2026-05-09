use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

#[derive(Debug, Default, Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub journal_dir: Option<String>,
}

fn config_path_in(dir: &Path) -> PathBuf {
    dir.join("config.json")
}

fn config_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Could not resolve app_config_dir: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| format!("Could not create config dir: {e}"))?;
    Ok(dir)
}

fn load_from(dir: &Path) -> Result<AppConfig, String> {
    let path = config_path_in(dir);
    if !path.exists() {
        return Ok(AppConfig::default());
    }
    let raw = fs::read_to_string(&path).map_err(|e| format!("Read config failed: {e}"))?;
    if raw.trim().is_empty() {
        return Ok(AppConfig::default());
    }
    serde_json::from_str(&raw).map_err(|e| format!("Parse config failed: {e}"))
}

fn save_to(dir: &Path, cfg: &AppConfig) -> Result<(), String> {
    let path = config_path_in(dir);
    let raw = serde_json::to_string_pretty(cfg)
        .map_err(|e| format!("Serialize config failed: {e}"))?;
    fs::write(&path, raw).map_err(|e| format!("Write config failed: {e}"))
}

#[tauri::command]
pub fn get_journal_dir(app: AppHandle) -> Result<Option<String>, String> {
    let dir = config_dir(&app)?;
    Ok(load_from(&dir)?.journal_dir)
}

#[tauri::command]
pub fn set_journal_dir(app: AppHandle, path: String) -> Result<(), String> {
    let dir = config_dir(&app)?;
    let mut cfg = load_from(&dir)?;
    cfg.journal_dir = Some(path);
    save_to(&dir, &cfg)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn missing_config_yields_default() {
        let tmp = tempfile::tempdir().unwrap();
        let cfg = load_from(tmp.path()).unwrap();
        assert_eq!(cfg.journal_dir, None);
    }

    #[test]
    fn round_trip_journal_dir() {
        let tmp = tempfile::tempdir().unwrap();
        let cfg = AppConfig {
            journal_dir: Some("C:/users/johnk/Documents/margin".into()),
        };
        save_to(tmp.path(), &cfg).unwrap();
        let read_back = load_from(tmp.path()).unwrap();
        assert_eq!(read_back.journal_dir, cfg.journal_dir);
    }

    #[test]
    fn empty_file_yields_default() {
        let tmp = tempfile::tempdir().unwrap();
        fs::write(config_path_in(tmp.path()), "").unwrap();
        let cfg = load_from(tmp.path()).unwrap();
        assert_eq!(cfg.journal_dir, None);
    }
}
