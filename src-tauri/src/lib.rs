use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_fs::FsExt;
use log::LevelFilter;
use tauri_plugin_log::{Target, TargetKind};
use tauri_plugin_store::StoreExt;

#[tauri::command]
fn pick_epub_file(app: AppHandle) -> Result<Option<String>, String> {
    #[cfg(target_os = "android")]
    {
        return pick_epub_file_android();
    }

    #[cfg(not(target_os = "android"))]
    {
        let file = app
            .dialog()
            .file()
            .add_filter("EPUB", &["epub"])
            .blocking_pick_file();
        Ok(file.map(|f| f.to_string()))
    }
}

/// Android-only: launches ACTION_OPEN_DOCUMENT via MainActivity.launchEpubPicker(),
/// then blocks on the LinkedBlockingQueue until the user picks a file or cancels.
/// takePersistableUriPermission is called in Kotlin before the URI is enqueued.
#[cfg(target_os = "android")]
fn pick_epub_file_android() -> Result<Option<String>, String> {
    use jni::objects::{JObject, JString, JValue};

    let ctx = ndk_context::android_context();
    let vm = unsafe { jni::JavaVM::from_raw(ctx.vm().cast()) }.map_err(|e| e.to_string())?;
    let mut env = vm.attach_current_thread().map_err(|e| e.to_string())?;
    let activity = unsafe { JObject::from_raw(ctx.context().cast()) };

    // Get MainActivity.epubPickResult (LinkedBlockingQueue<String>)
    let main_class = env
        .find_class("com/github/mrkovalskik/MainActivity")
        .map_err(|e| e.to_string())?;
    let queue = env
        .get_static_field(
            &main_class,
            "epubPickResult",
            "Ljava/util/concurrent/LinkedBlockingQueue;",
        )
        .map_err(|e| e.to_string())?
        .l()
        .map_err(|e| e.to_string())?;

    // Drain any stale result from a previous (e.g. cancelled) call
    env.call_method(&queue, "clear", "()V", &[])
        .map_err(|e| e.to_string())?;

    // Ask MainActivity to launch the file picker on the UI thread
    env.call_method(&activity, "launchEpubPicker", "()V", &[])
        .map_err(|e| e.to_string())?;

    // Block for up to 120 s waiting for the activity result
    let time_unit_class = env
        .find_class("java/util/concurrent/TimeUnit")
        .map_err(|e| e.to_string())?;
    let seconds = env
        .get_static_field(
            &time_unit_class,
            "SECONDS",
            "Ljava/util/concurrent/TimeUnit;",
        )
        .map_err(|e| e.to_string())?
        .l()
        .map_err(|e| e.to_string())?;

    let result_obj = env
        .call_method(
            &queue,
            "poll",
            "(JLjava/util/concurrent/TimeUnit;)Ljava/lang/Object;",
            &[JValue::Long(120), JValue::Object(&seconds)],
        )
        .map_err(|e| e.to_string())?
        .l()
        .map_err(|e| e.to_string())?;

    if result_obj.is_null() {
        return Ok(None); // timed out
    }

    let uri_jstring = JString::from(result_obj);
    let uri: String = env
        .get_string(&uri_jstring)
        .map_err(|e| e.to_string())?
        .into();

    if uri.is_empty() {
        Ok(None) // user cancelled
    } else {
        Ok(Some(uri))
    }
}

#[tauri::command]
fn read_epub_file(app: AppHandle, path: String) -> Result<tauri::ipc::Response, String> {
    use tauri_plugin_fs::FilePath;
    let url = tauri::Url::parse(&path).map_err(|e| e.to_string())?;
    let bytes = app.fs().read(FilePath::from(url)).map_err(|e| e.to_string())?;
    Ok(tauri::ipc::Response::new(bytes))
}

#[tauri::command]
fn save_state(app: AppHandle, json: String) -> Result<(), String> {
    let store = app.store("app_state.json").map_err(|e| e.to_string())?;
    let value: serde_json::Value = serde_json::from_str(&json).map_err(|e| e.to_string())?;
    store.set("state", value);
    store.save().map_err(|e| e.to_string())
}

#[tauri::command]
fn load_state(app: AppHandle) -> Result<Option<String>, String> {
    let store = app.store("app_state.json").map_err(|e| e.to_string())?;
    let value = store.get("state");
    Ok(value.map(|v| v.to_string()))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(LevelFilter::Info)
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
