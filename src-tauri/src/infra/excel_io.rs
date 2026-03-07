use crate::core::transform::rows_to_records;
use crate::error::AppError;
use crate::models::{DataPreview, Record};
use calamine::{Data, Reader, Xlsx};
use std::path::Path;

const PREVIEW_ROW_LIMIT: usize = 20;

fn open_xlsx(path: &Path) -> Result<Xlsx<std::io::BufReader<std::fs::File>>, AppError> {
    let result: Result<Xlsx<std::io::BufReader<std::fs::File>>, calamine::XlsxError> =
        calamine::open_workbook(path);
    result.map_err(|e| AppError::Excel(e.to_string()))
}

fn read_range(
    workbook: &mut Xlsx<std::io::BufReader<std::fs::File>>,
) -> Result<calamine::Range<Data>, AppError> {
    let sheet_name = workbook
        .sheet_names()
        .first()
        .cloned()
        .ok_or_else(|| AppError::Excel("シートが見つかりません".to_string()))?;

    workbook
        .worksheet_range(&sheet_name)
        .map_err(|e| AppError::Excel(e.to_string()))
}

fn cell_to_string(cell: &Data) -> String {
    match cell {
        Data::Int(i) => i.to_string(),
        Data::Float(f) => f.to_string(),
        Data::String(s) | Data::DateTimeIso(s) | Data::DurationIso(s) => s.clone(),
        Data::Bool(b) => b.to_string(),
        Data::DateTime(dt) => dt.to_string(),
        Data::Error(e) => format!("#{e:?}"),
        Data::Empty => String::new(),
    }
}

/// Excelファイルを読み込んでプレビュー用データを返す（先頭シート使用）
pub fn read_excel_preview(path: &Path) -> Result<DataPreview, AppError> {
    let mut workbook = open_xlsx(path)?;
    let range = read_range(&mut workbook)?;
    let mut row_iter = range.rows();

    let header_row = row_iter
        .next()
        .ok_or_else(|| AppError::Excel("ヘッダー行が見つかりません".to_string()))?;

    let headers: Vec<String> = header_row.iter().map(cell_to_string).collect();

    let mut string_rows = Vec::new();
    let mut total_rows = 0;

    for row in row_iter {
        total_rows += 1;
        if string_rows.len() < PREVIEW_ROW_LIMIT {
            let values: Vec<String> = row.iter().map(cell_to_string).collect();
            string_rows.push(values);
        }
    }

    let rows = rows_to_records(&headers, &string_rows);

    Ok(DataPreview {
        headers,
        rows,
        total_rows,
    })
}

/// Excelファイルの全行を読み込み
pub fn read_excel_all(path: &Path) -> Result<(Vec<String>, Vec<Record>), AppError> {
    let mut workbook = open_xlsx(path)?;
    let range = read_range(&mut workbook)?;
    let mut row_iter = range.rows();

    let header_row = row_iter
        .next()
        .ok_or_else(|| AppError::Excel("ヘッダー行が見つかりません".to_string()))?;

    let headers: Vec<String> = header_row.iter().map(cell_to_string).collect();

    let mut string_rows = Vec::new();
    for row in row_iter {
        let values: Vec<String> = row.iter().map(cell_to_string).collect();
        string_rows.push(values);
    }

    let records = rows_to_records(&headers, &string_rows);
    Ok((headers, records))
}

/// `RecordsをExcelとして書き出し`
pub fn write_excel(path: &Path, headers: &[String], records: &[Record]) -> Result<(), AppError> {
    let mut workbook = rust_xlsxwriter::Workbook::new();
    let worksheet = workbook.add_worksheet();

    for (col, header) in headers.iter().enumerate() {
        worksheet
            .write_string(0, col.try_into().unwrap_or(0), header)
            .map_err(|e| AppError::Excel(e.to_string()))?;
    }

    for (row_idx, record) in records.iter().enumerate() {
        let excel_row: u32 = (row_idx + 1).try_into().unwrap_or(0);
        for (col_idx, header) in headers.iter().enumerate() {
            let excel_col: u16 = col_idx.try_into().unwrap_or(0);
            let value = record
                .get(header)
                .map(|v| match v {
                    serde_json::Value::String(s) => s.clone(),
                    serde_json::Value::Null => String::new(),
                    other => other.to_string(),
                })
                .unwrap_or_default();
            worksheet
                .write_string(excel_row, excel_col, &value)
                .map_err(|e| AppError::Excel(e.to_string()))?;
        }
    }

    workbook
        .save(path)
        .map_err(|e| AppError::Excel(e.to_string()))?;
    Ok(())
}
