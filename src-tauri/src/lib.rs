use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_fs::FsExt;
use tauri_plugin_log::{Target, TargetKind};
use tauri_plugin_store::StoreExt;

#[tauri::command]
fn pick_epub_file(app: AppHandle) -> Result<Option<String>, String> {
    let file = app
        .dialog()
        .file()
        .add_filter("EPUB", &["epub"])
        .blocking_pick_file();
    Ok(file.map(|f| f.to_string()))
}

#[tauri::command]
fn read_epub_file(app: AppHandle, path: String) -> Result<Vec<u8>, String> {
    use tauri_plugin_fs::FilePath;
    let url = tauri::Url::parse(&path).map_err(|e| e.to_string())?;
    app.fs().read(FilePath::from(url)).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_state(app: AppHandle, json: String) -> Result<(), String> {
    let store = app.store("app_state.json").map_err(|e| e.to_string())?;
    store.set("state", serde_json::Value::String(json));
    store.save().map_err(|e| e.to_string())
}

#[tauri::command]
fn load_state(app: AppHandle) -> Result<Option<String>, String> {
    let store = app.store("app_state.json").map_err(|e| e.to_string())?;
    let value = store.get("state");
    Ok(value.and_then(|v| v.as_str().map(String::from)))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::Webview),
                ])
                .build(),
        )
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            pick_epub_file,
            read_epub_file,
            save_state,
            load_state,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
