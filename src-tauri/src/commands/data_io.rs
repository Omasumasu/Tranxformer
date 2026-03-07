use crate::core::transform::rows_to_records;
use crate::error::AppError;
use crate::models::{DataPreview, Record};
use serde::Deserialize;
use std::path::PathBuf;

const PREVIEW_ROWS: usize = 20;

#[derive(Debug, Deserialize)]
pub enum ExportFormat {
    Csv,
    Tsv,
    Excel,
}

#[tauri::command]
pub async fn read_file_preview(path: String) -> Result<DataPreview, AppError> {
    let path = PathBuf::from(&path);
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    let (headers, rows) = match ext.as_str() {
        "csv" | "tsv" | "txt" => crate::infra::csv_io::read_csv(&path)?,
        "xlsx" | "xls" | "xlsm" | "xlsb" | "ods" => crate::infra::excel_io::read_excel(&path)?,
        _ => return Err(AppError::Validation(format!("未対応のファイル形式: {ext}"))),
    };

    let total_rows = rows.len();
    let preview_rows: Vec<Vec<String>> = rows.into_iter().take(PREVIEW_ROWS).collect();
    let records = rows_to_records(&headers, &preview_rows);

    Ok(DataPreview {
        headers,
        rows: records,
        total_rows,
    })
}

#[tauri::command]
pub async fn read_file_full(path: String) -> Result<(Vec<String>, Vec<Record>), AppError> {
    let path = PathBuf::from(&path);
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    let (headers, rows) = match ext.as_str() {
        "csv" | "tsv" | "txt" => crate::infra::csv_io::read_csv(&path)?,
        "xlsx" | "xls" | "xlsm" | "xlsb" | "ods" => crate::infra::excel_io::read_excel(&path)?,
        _ => return Err(AppError::Validation(format!("未対応のファイル形式: {ext}"))),
    };

    let records = rows_to_records(&headers, &rows);
    Ok((headers, records))
}

#[tauri::command]
pub async fn export_result(
    headers: Vec<String>,
    rows: Vec<Vec<String>>,
    path: String,
    format: ExportFormat,
) -> Result<(), AppError> {
    let path = PathBuf::from(&path);
    match format {
        ExportFormat::Csv => crate::infra::csv_io::write_csv(&path, &headers, &rows),
        ExportFormat::Tsv => crate::infra::csv_io::write_tsv(&path, &headers, &rows),
        ExportFormat::Excel => crate::infra::excel_io::write_excel(&path, &headers, &rows),
    }
}
