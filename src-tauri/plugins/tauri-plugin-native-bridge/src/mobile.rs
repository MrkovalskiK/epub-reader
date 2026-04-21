use serde::de::DeserializeOwned;
use tauri::{
    plugin::{PluginApi, PluginHandle},
    AppHandle, Runtime,
};

use crate::models::*;

pub fn init<R: Runtime, C: DeserializeOwned>(
    _app: &AppHandle<R>,
    api: PluginApi<R, C>,
) -> crate::Result<NativeBridge<R>> {
    let handle =
        api.register_android_plugin("com.github.mrkovalskik.native_bridge", "NativeBridgePlugin")?;
    Ok(NativeBridge(handle))
}

pub struct NativeBridge<R: Runtime>(PluginHandle<R>);

impl<R: Runtime> NativeBridge<R> {
    pub fn copy_uri_to_path(&self, payload: CopyURIRequest) -> crate::Result<CopyURIResponse> {
        self.0
            .run_mobile_plugin("copy_uri_to_path", payload)
            .map_err(Into::into)
    }

    pub fn get_safe_area_insets(&self) -> crate::Result<SafeAreaInsetsResponse> {
        self.0.run_mobile_plugin("get_safe_area_insets", ()).map_err(Into::into)
    }
}
