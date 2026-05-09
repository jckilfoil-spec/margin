mod config;
mod journal;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            config::get_journal_dir,
            config::set_journal_dir,
            journal::list_journal_files,
            journal::read_journal_file,
            journal::write_journal_file,
            journal::journal_file_exists,
            journal::ensure_journal_dir,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
