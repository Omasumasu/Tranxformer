use std::path::PathBuf;

use tauri::Manager;

use crate::error::AppError;
use crate::models::Template;
use crate::{core, infra};

fn app_data_dir(app: &tauri::AppHandle) -> Result<PathBuf, AppError> {
    app.path()
        .app_data_dir()
        .map_err(|e| AppError::Internal(format!("アプリデータディレクトリの取得に失敗: {e}")))
}

#[tauri::command]
pub async fn list_templates(app: tauri::AppHandle) -> Result<Vec<Template>, AppError> {
    let dir = app_data_dir(&app)?;
    infra::storage::load_all_templates(&dir)
}

#[tauri::command]
pub async fn get_template(app: tauri::AppHandle, id: String) -> Result<Template, AppError> {
    let dir = app_data_dir(&app)?;
    infra::storage::load_template(&dir, &id)
}

#[tauri::command]
pub async fn save_template(
    app: tauri::AppHandle,
    template: Template,
) -> Result<Template, AppError> {
    core::template::validate_template(&template)
        .map_err(|errors| AppError::Validation(errors.join(", ")))?;

    let now = chrono::Utc::now().to_rfc3339();
    let template = Template {
        id: if template.id.is_empty() {
            uuid::Uuid::new_v4().to_string()
        } else {
            template.id
        },
        created_at: if template.created_at.is_empty() {
            now.clone()
        } else {
            template.created_at
        },
        updated_at: now,
        ..template
    };

    let dir = app_data_dir(&app)?;
    infra::storage::save_template(&dir, &template)?;
    Ok(template)
}

#[tauri::command]
pub async fn delete_template(app: tauri::AppHandle, id: String) -> Result<(), AppError> {
    let dir = app_data_dir(&app)?;
    infra::storage::delete_template(&dir, &id)
}

#[tauri::command]
pub async fn export_template(
    app: tauri::AppHandle,
    id: String,
    path: String,
) -> Result<(), AppError> {
    let dir = app_data_dir(&app)?;
    let template = infra::storage::load_template(&dir, &id)?;
    infra::storage::export_template_to_file(&template, &PathBuf::from(path))
}

#[tauri::command]
pub async fn import_template(app: tauri::AppHandle, path: String) -> Result<Template, AppError> {
    let mut template = infra::storage::import_template_from_file(&PathBuf::from(path))?;

    // インポート時に新しいIDを付与
    template.id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    template.updated_at = now;

    let dir = app_data_dir(&app)?;
    infra::storage::save_template(&dir, &template)?;
    Ok(template)
}
