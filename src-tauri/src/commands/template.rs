use crate::error::AppError;
use crate::models::Template;
use crate::{core, infra};
use std::path::PathBuf;

#[tauri::command]
pub async fn list_templates(app_handle: tauri::AppHandle) -> Result<Vec<Template>, AppError> {
    let data_dir = app_data_dir(&app_handle)?;
    infra::storage::list_templates(&data_dir)
}

#[tauri::command]
pub async fn get_template(app_handle: tauri::AppHandle, id: String) -> Result<Template, AppError> {
    let data_dir = app_data_dir(&app_handle)?;
    infra::storage::get_template(&data_dir, &id)
}

#[tauri::command]
pub async fn save_template(
    app_handle: tauri::AppHandle,
    template: Template,
) -> Result<(), AppError> {
    core::template::validate_template(&template)
        .map_err(|errors| AppError::Validation(errors.join(", ")))?;
    let data_dir = app_data_dir(&app_handle)?;
    infra::storage::save_template(&data_dir, &template)
}

#[tauri::command]
pub async fn delete_template(app_handle: tauri::AppHandle, id: String) -> Result<(), AppError> {
    let data_dir = app_data_dir(&app_handle)?;
    infra::storage::delete_template(&data_dir, &id)
}

#[tauri::command]
pub async fn export_template(
    app_handle: tauri::AppHandle,
    id: String,
    path: String,
) -> Result<(), AppError> {
    let data_dir = app_data_dir(&app_handle)?;
    let template = infra::storage::get_template(&data_dir, &id)?;
    infra::storage::export_template(&template, &PathBuf::from(path))
}

#[tauri::command]
pub async fn import_template(
    app_handle: tauri::AppHandle,
    path: String,
) -> Result<Template, AppError> {
    let mut template = infra::storage::import_template(&PathBuf::from(path))?;
    template.id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    template.updated_at.clone_from(&now);
    template.created_at = now;

    let data_dir = app_data_dir(&app_handle)?;
    infra::storage::save_template(&data_dir, &template)?;
    Ok(template)
}

fn app_data_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, AppError> {
    use tauri::Manager;
    app_handle
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Internal(format!("アプリデータディレクトリが取得できません: {e}")))
}
