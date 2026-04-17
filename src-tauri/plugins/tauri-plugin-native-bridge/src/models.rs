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
