const COMMANDS: &[&str] = &["copy_uri_to_path"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .build();
}
