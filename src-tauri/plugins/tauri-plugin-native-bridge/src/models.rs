use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CopyURIRequest {
    pub uri: String,
    pub dst: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CopyURIResponse {
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SafeAreaInsetsResponse {
    pub top: f64,
    pub bottom: f64,
    pub left: f64,
    pub right: f64,
}
