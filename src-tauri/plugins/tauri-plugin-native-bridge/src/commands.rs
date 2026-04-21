use tauri::{command, AppHandle, Runtime};

use crate::models::*;
use crate::NativeBridgeExt;
use crate::Result;

#[command]
pub(crate) async fn copy_uri_to_path<R: Runtime>(
    app: AppHandle<R>,
    uri: String,
    dst: String,
) -> Result<CopyURIResponse> {
    app.native_bridge().copy_uri_to_path(CopyURIRequest { uri, dst })
}

#[command]
pub(crate) async fn get_safe_area_insets<R: Runtime>(
    app: AppHandle<R>,
) -> Result<SafeAreaInsetsResponse> {
    app.native_bridge().get_safe_area_insets()
}

#[command]
pub(crate) async fn open_url<R: Runtime>(
    app: AppHandle<R>,
    url: String,
) -> Result<OpenUrlResponse> {
    app.native_bridge().open_url(OpenUrlRequest { url })
}
