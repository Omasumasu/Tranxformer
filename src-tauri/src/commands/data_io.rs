use std::path::PathBuf;

use crate::core::transform::{extract_sample_rows, records_to_string_rows, rows_to_records};
use crate::error::AppError;
use crate::infra::{csv_io, excel_io};
use crate::models::DataPreview;

#[derive(Debug, Clone, serde::Deserialize)]
pub enum ExportFormat {
    Csv,
    Tsv,
    Excel,
}

#[tauri::command]
pub async fn read_file_preview(
    path: String,
    max_rows: Option<usize>,
) -> Result<DataPreview, AppError> {
    let path = PathBuf::from(&path);
    let max = max_rows.unwrap_or(20);

    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    let (headers, raw_rows) = match ext.as_str() {
        "xlsx" | "xls" => excel_io::read_excel(&path)?,
        _ => csv_io::read_csv(&path)?,
    };

    let total_rows = raw_rows.len();
    let records = rows_to_records(&headers, &raw_rows);
    let sample = extract_sample_rows(&records, max);

    Ok(DataPreview {
        headers,
        rows: sample,
        total_rows,
    })
}

#[tauri::command]
pub async fn export_result(
    headers: Vec<String>,
    rows: Vec<crate::models::Record>,
    path: String,
    format: ExportFormat,
) -> Result<(), AppError> {
    let path = PathBuf::from(&path);
    let string_rows = records_to_string_rows(&rows, &headers);

    match format {
        ExportFormat::Csv => csv_io::write_csv(&path, &headers, &string_rows),
        ExportFormat::Tsv => csv_io::write_tsv(&path, &headers, &string_rows),
        ExportFormat::Excel => excel_io::write_excel(&path, &headers, &string_rows),
    }
}
