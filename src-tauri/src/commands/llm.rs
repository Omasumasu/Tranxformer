use crate::error::AppError;

/// モデルのロード状態
#[derive(Debug, Clone, serde::Serialize)]
pub struct ModelStatus {
    pub loaded: bool,
    pub model_path: Option<String>,
}

#[tauri::command]
pub async fn load_model(_model_path: String) -> Result<(), AppError> {
    // Phase 4: llama-cpp-2によるモデルロード実装予定
    // 現在はスタブ
    Err(AppError::Internal(
        "LLMモデルのロードは未実装です（Phase 4で実装予定）".to_string(),
    ))
}

#[tauri::command]
pub async fn get_model_status() -> Result<ModelStatus, AppError> {
    // Phase 4: AppStateからモデル状態を取得
    Ok(ModelStatus {
        loaded: false,
        model_path: None,
    })
}

#[tauri::command]
pub async fn generate_transform_code(
    _input_sample: crate::models::DataPreview,
    _template: crate::models::Template,
) -> Result<String, AppError> {
    // Phase 4: llama-cpp-2によるコード生成実装予定
    Err(AppError::Internal(
        "コード生成は未実装です（Phase 4で実装予定）".to_string(),
    ))
}
