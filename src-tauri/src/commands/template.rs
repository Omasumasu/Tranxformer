use crate::error::AppError;
use crate::infra::storage;
use crate::models::Template;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

fn templates_dir(app: &AppHandle) -> Result<PathBuf, AppError> {
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Internal(e.to_string()))?;
    storage::ensure_templates_dir(&app_data)
}

#[tauri::command]
pub async fn list_templates(app: AppHandle) -> Result<Vec<Template>, AppError> {
    let dir = templates_dir(&app)?;
    storage::list_templates(&dir)
}

#[tauri::command]
pub async fn get_template(app: AppHandle, id: String) -> Result<Template, AppError> {
    let dir = templates_dir(&app)?;
    storage::get_template(&dir, &id)
}

#[tauri::command]
pub async fn save_template(app: AppHandle, template: Template) -> Result<(), AppError> {
    crate::core::template::validate_template(&template)
        .map_err(|errors| AppError::Validation(errors.join("; ")))?;

    let dir = templates_dir(&app)?;
    storage::save_template(&dir, &template)
}

#[tauri::command]
pub async fn delete_template(app: AppHandle, id: String) -> Result<(), AppError> {
    let dir = templates_dir(&app)?;
    storage::delete_template(&dir, &id)
}

#[tauri::command]
pub async fn export_template(app: AppHandle, id: String, path: String) -> Result<(), AppError> {
    let dir = templates_dir(&app)?;
    let template = storage::get_template(&dir, &id)?;
    storage::export_template_to_file(&template, &PathBuf::from(path))
}

#[tauri::command]
pub async fn import_template(app: AppHandle, path: String) -> Result<Template, AppError> {
    let mut template = storage::import_template_from_file(&PathBuf::from(path))?;
    // 新しいIDを付与してインポート
    template.id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    template.created_at.clone_from(&now);
    template.updated_at = now;

    let dir = templates_dir(&app)?;
    storage::save_template(&dir, &template)?;
    Ok(template)
}
