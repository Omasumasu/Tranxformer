use crate::core::join::left_join;
use crate::core::transform::rows_to_records;
use crate::error::AppError;
use crate::infra::join_executor::make_js_key_fn;
use crate::models::{InputTemplate, JoinPreview, Record};
use std::path::{Path, PathBuf};

const PREVIEW_ROWS: usize = 20;

fn read_file(path: &Path) -> Result<(Vec<String>, Vec<Vec<String>>), AppError> {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    match ext.as_str() {
        "csv" | "tsv" | "txt" => crate::infra::csv_io::read_csv(path),
        "xlsx" | "xls" | "xlsm" | "xlsb" | "ods" => crate::infra::excel_io::read_excel(path),
        _ => Err(AppError::Validation(format!("未対応のファイル形式: {ext}"))),
    }
}

#[tauri::command]
pub async fn join_preview(
    base_path: String,
    join_path: String,
    base_expression: String,
    join_expression: String,
    join_prefix: String,
) -> Result<JoinPreview, AppError> {
    let (base_headers, base_rows) = read_file(&PathBuf::from(&base_path))?;
    let (join_headers, join_rows) = read_file(&PathBuf::from(&join_path))?;

    let base_row_count = base_rows.len();
    let base_key_fn = make_js_key_fn(base_expression);
    let join_key_fn = make_js_key_fn(join_expression);

    let (merged_headers, merged_rows) = left_join(
        &base_headers,
        &base_rows,
        &join_headers,
        &join_rows,
        base_key_fn,
        join_key_fn,
        &join_prefix,
    );

    let joined_row_count = merged_rows.len();
    let preview_rows: Vec<Vec<String>> = merged_rows.into_iter().take(PREVIEW_ROWS).collect();
    let records = rows_to_records(&merged_headers, &preview_rows);

    Ok(JoinPreview {
        headers: merged_headers,
        rows: records,
        base_row_count,
        joined_row_count,
    })
}

#[tauri::command]
pub async fn join_and_read_full(
    base_path: String,
    join_path: String,
    base_expression: String,
    join_expression: String,
    join_prefix: String,
) -> Result<(Vec<String>, Vec<Record>), AppError> {
    let (base_headers, base_rows) = read_file(&PathBuf::from(&base_path))?;
    let (join_headers, join_rows) = read_file(&PathBuf::from(&join_path))?;

    let base_key_fn = make_js_key_fn(base_expression);
    let join_key_fn = make_js_key_fn(join_expression);

    let (merged_headers, merged_rows) = left_join(
        &base_headers,
        &base_rows,
        &join_headers,
        &join_rows,
        base_key_fn,
        join_key_fn,
        &join_prefix,
    );

    let records = rows_to_records(&merged_headers, &merged_rows);
    Ok((merged_headers, records))
}

#[tauri::command]
pub async fn list_input_templates(
    app_handle: tauri::AppHandle,
) -> Result<Vec<InputTemplate>, AppError> {
    let data_dir = app_data_dir(&app_handle)?;
    crate::infra::storage::list_input_templates(&data_dir)
}

#[tauri::command]
pub async fn save_input_template(
    app_handle: tauri::AppHandle,
    template: InputTemplate,
) -> Result<(), AppError> {
    let data_dir = app_data_dir(&app_handle)?;
    crate::infra::storage::save_input_template(&data_dir, &template)
}

#[tauri::command]
pub async fn delete_input_template(
    app_handle: tauri::AppHandle,
    id: String,
) -> Result<(), AppError> {
    let data_dir = app_data_dir(&app_handle)?;
    crate::infra::storage::delete_input_template(&data_dir, &id)
}

fn app_data_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, AppError> {
    use tauri::Manager;
    app_handle
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Internal(format!("アプリデータディレクトリが取得できません: {e}")))
}
