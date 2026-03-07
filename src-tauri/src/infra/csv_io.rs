use crate::core::transform::rows_to_records;
use crate::error::AppError;
use crate::models::{DataPreview, Record};
use std::path::Path;

const PREVIEW_ROW_LIMIT: usize = 20;

/// 区切り文字を自動検出（先頭行ベース）
fn detect_delimiter(first_line: &str) -> u8 {
    let tab_count = first_line.matches('\t').count();
    let comma_count = first_line.matches(',').count();

    if tab_count > comma_count {
        b'\t'
    } else {
        b','
    }
}

/// CSV/TSVファイルを読み込んでプレビュー用データを返す
pub fn read_csv_preview(path: &Path) -> Result<DataPreview, AppError> {
    let content = std::fs::read_to_string(path).map_err(|e| AppError::Csv(e.to_string()))?;
    let first_line = content.lines().next().unwrap_or_default();
    let delimiter = detect_delimiter(first_line);

    let mut reader = csv::ReaderBuilder::new()
        .delimiter(delimiter)
        .has_headers(true)
        .from_path(path)
        .map_err(|e| AppError::Csv(e.to_string()))?;

    let headers: Vec<String> = reader
        .headers()
        .map_err(|e| AppError::Csv(e.to_string()))?
        .iter()
        .map(String::from)
        .collect();

    let mut string_rows = Vec::new();
    let mut total_rows = 0;

    for result in reader.records() {
        let record = result.map_err(|e| AppError::Csv(e.to_string()))?;
        total_rows += 1;
        if string_rows.len() < PREVIEW_ROW_LIMIT {
            let row: Vec<String> = record.iter().map(String::from).collect();
            string_rows.push(row);
        }
    }

    let rows = rows_to_records(&headers, &string_rows);

    Ok(DataPreview {
        headers,
        rows,
        total_rows,
    })
}

/// CSV/TSVファイルの全行を読み込み
pub fn read_csv_all(path: &Path) -> Result<(Vec<String>, Vec<Record>), AppError> {
    let content = std::fs::read_to_string(path).map_err(|e| AppError::Csv(e.to_string()))?;
    let first_line = content.lines().next().unwrap_or_default();
    let delimiter = detect_delimiter(first_line);

    let mut reader = csv::ReaderBuilder::new()
        .delimiter(delimiter)
        .has_headers(true)
        .from_path(path)
        .map_err(|e| AppError::Csv(e.to_string()))?;

    let headers: Vec<String> = reader
        .headers()
        .map_err(|e| AppError::Csv(e.to_string()))?
        .iter()
        .map(String::from)
        .collect();

    let mut string_rows = Vec::new();
    for result in reader.records() {
        let record = result.map_err(|e| AppError::Csv(e.to_string()))?;
        let row: Vec<String> = record.iter().map(String::from).collect();
        string_rows.push(row);
    }

    let records = rows_to_records(&headers, &string_rows);
    Ok((headers, records))
}

/// RecordsをCSV/TSVとして書き出し
pub fn write_csv(
    path: &Path,
    headers: &[String],
    records: &[Record],
    delimiter: u8,
) -> Result<(), AppError> {
    let mut writer = csv::WriterBuilder::new()
        .delimiter(delimiter)
        .from_path(path)
        .map_err(|e| AppError::Csv(e.to_string()))?;

    writer
        .write_record(headers)
        .map_err(|e| AppError::Csv(e.to_string()))?;

    for record in records {
        let row: Vec<String> = headers
            .iter()
            .map(|h| {
                record
                    .get(h)
                    .map(|v| match v {
                        serde_json::Value::String(s) => s.clone(),
                        serde_json::Value::Null => String::new(),
                        other => other.to_string(),
                    })
                    .unwrap_or_default()
            })
            .collect();
        writer
            .write_record(&row)
            .map_err(|e| AppError::Csv(e.to_string()))?;
    }

    writer.flush().map_err(|e| AppError::Csv(e.to_string()))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detect_delimiter_csv() {
        assert_eq!(detect_delimiter("a,b,c"), b',');
    }

    #[test]
    fn detect_delimiter_tsv() {
        assert_eq!(detect_delimiter("a\tb\tc"), b'\t');
    }

    #[test]
    fn read_write_csv_roundtrip() {
        let dir = std::env::temp_dir().join(format!("tranxformer_csv_{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();

        let csv_path = dir.join("test.csv");
        std::fs::write(&csv_path, "name,age\nAlice,30\nBob,25\n").unwrap();

        let preview = read_csv_preview(&csv_path).unwrap();
        assert_eq!(preview.headers, vec!["name", "age"]);
        assert_eq!(preview.total_rows, 2);
        assert_eq!(preview.rows.len(), 2);

        // Write back
        let out_path = dir.join("output.csv");
        write_csv(&out_path, &preview.headers, &preview.rows, b',').unwrap();

        let re_read = read_csv_preview(&out_path).unwrap();
        assert_eq!(re_read.headers, vec!["name", "age"]);
        assert_eq!(re_read.total_rows, 2);

        std::fs::remove_dir_all(&dir).unwrap();
    }
}
