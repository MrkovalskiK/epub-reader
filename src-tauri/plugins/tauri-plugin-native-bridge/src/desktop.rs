use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};

use crate::models::*;

pub fn init<R: Runtime, C: DeserializeOwned>(
    app: &AppHandle<R>,
    _api: PluginApi<R, C>,
) -> crate::Result<NativeBridge<R>> {
    Ok(NativeBridge(app.clone()))
}

pub struct NativeBridge<R: Runtime>(AppHandle<R>);

impl<R: Runtime> NativeBridge<R> {
    pub fn copy_uri_to_path(&self, _payload: CopyURIRequest) -> crate::Result<CopyURIResponse> {
        Err(crate::Error::UnsupportedPlatform)
    }

    pub fn get_safe_area_insets(&self) -> crate::Result<SafeAreaInsetsResponse> {
        Ok(SafeAreaInsetsResponse { top: 0.0, bottom: 0.0, left: 0.0, right: 0.0 })
    }
}
