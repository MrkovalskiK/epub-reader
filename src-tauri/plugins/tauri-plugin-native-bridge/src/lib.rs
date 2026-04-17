use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

pub use models::*;

#[cfg(desktop)]
mod desktop;
#[cfg(mobile)]
mod mobile;

mod commands;
mod error;
mod models;

pub use error::{Error, Result};

#[cfg(desktop)]
use desktop::NativeBridge;
#[cfg(mobile)]
use mobile::NativeBridge;

pub trait NativeBridgeExt<R: Runtime> {
    fn native_bridge(&self) -> &NativeBridge<R>;
}

impl<R: Runtime, T: Manager<R>> NativeBridgeExt<R> for T {
    fn native_bridge(&self) -> &NativeBridge<R> {
        self.state::<NativeBridge<R>>().inner()
    }
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("native-bridge")
        .invoke_handler(tauri::generate_handler![commands::copy_uri_to_path])
        .setup(|app, api| {
            #[cfg(mobile)]
            let bridge = mobile::init(app, api)?;
            #[cfg(desktop)]
            let bridge = desktop::init(app, api)?;
            app.manage(bridge);
            Ok(())
        })
        .build()
}
