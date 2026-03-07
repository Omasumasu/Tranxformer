use crate::error::AppError;
use crate::infra::{csv_io, excel_io};
use crate::models::{DataPreview, ExportFormat, Record};
use std::path::Path;

#[tauri::command]
pub async fn read_file_preview(path: String) -> Result<DataPreview, AppError> {
    let path = Path::new(&path);
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    match ext.as_str() {
        "csv" | "tsv" | "txt" => csv_io::read_csv_preview(path),
        "xlsx" | "xls" => excel_io::read_excel_preview(path),
        _ => Err(AppError::Validation(format!(
            "未対応のファイル形式: .{ext}"
        ))),
    }
}

#[tauri::command]
pub async fn export_result(
    headers: Vec<String>,
    records: Vec<Record>,
    path: String,
    format: ExportFormat,
) -> Result<(), AppError> {
    let path = Path::new(&path);

    match format {
        ExportFormat::Csv => csv_io::write_csv(path, &headers, &records, b','),
        ExportFormat::Tsv => csv_io::write_csv(path, &headers, &records, b'\t'),
        ExportFormat::Xlsx => excel_io::write_excel(path, &headers, &records),
    }
}
