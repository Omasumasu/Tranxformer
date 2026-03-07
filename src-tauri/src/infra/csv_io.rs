use std::path::Path;

use crate::error::AppError;

/// CSVファイルを読み込み、ヘッダーと行データを返す
pub fn read_csv(path: &Path) -> Result<(Vec<String>, Vec<Vec<String>>), AppError> {
    let delimiter = detect_delimiter(path)?;
    let mut reader = csv::ReaderBuilder::new()
        .delimiter(delimiter)
        .has_headers(true)
        .from_path(path)?;

    let headers: Vec<String> = reader
        .headers()?
        .iter()
        .map(std::string::ToString::to_string)
        .collect();

    let mut rows = Vec::new();
    for result in reader.records() {
        let record = result?;
        let row: Vec<String> = record
            .iter()
            .map(std::string::ToString::to_string)
            .collect();
        rows.push(row);
    }

    Ok((headers, rows))
}

/// CSVファイルに書き出し
pub fn write_csv(path: &Path, headers: &[String], rows: &[Vec<String>]) -> Result<(), AppError> {
    let mut writer = csv::Writer::from_path(path)?;
    writer.write_record(headers)?;
    for row in rows {
        writer.write_record(row)?;
    }
    writer.flush()?;
    Ok(())
}

/// TSVファイルに書き出し
pub fn write_tsv(path: &Path, headers: &[String], rows: &[Vec<String>]) -> Result<(), AppError> {
    let mut writer = csv::WriterBuilder::new().delimiter(b'\t').from_path(path)?;
    writer.write_record(headers)?;
    for row in rows {
        writer.write_record(row)?;
    }
    writer.flush()?;
    Ok(())
}

/// 区切り文字を自動検出（先頭行からタブ or カンマを判定）
fn detect_delimiter(path: &Path) -> Result<u8, AppError> {
    let content = std::fs::read_to_string(path)?;
    let first_line = content.lines().next().unwrap_or("");

    let tab_count = first_line.matches('\t').count();
    let comma_count = first_line.matches(',').count();

    if tab_count > comma_count {
        Ok(b'\t')
    } else {
        Ok(b',')
    }
}

impl From<csv::Error> for AppError {
    fn from(e: csv::Error) -> Self {
        AppError::Internal(format!("CSV error: {e}"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn read_csv_basic() {
        let tmp = TempDir::new().unwrap();
        let path = tmp.path().join("test.csv");
        std::fs::write(&path, "name,age\nAlice,30\nBob,25\n").unwrap();

        let (headers, rows) = read_csv(&path).unwrap();
        assert_eq!(headers, vec!["name", "age"]);
        assert_eq!(rows.len(), 2);
        assert_eq!(rows[0], vec!["Alice", "30"]);
    }

    #[test]
    fn read_tsv_detected() {
        let tmp = TempDir::new().unwrap();
        let path = tmp.path().join("test.tsv");
        std::fs::write(&path, "name\tage\nAlice\t30\n").unwrap();

        let (headers, rows) = read_csv(&path).unwrap();
        assert_eq!(headers, vec!["name", "age"]);
        assert_eq!(rows.len(), 1);
    }

    #[test]
    fn write_and_read_csv() {
        let tmp = TempDir::new().unwrap();
        let path = tmp.path().join("out.csv");
        let headers = vec!["a".to_string(), "b".to_string()];
        let rows = vec![
            vec!["1".to_string(), "2".to_string()],
            vec!["3".to_string(), "4".to_string()],
        ];
        write_csv(&path, &headers, &rows).unwrap();

        let (h, r) = read_csv(&path).unwrap();
        assert_eq!(h, headers);
        assert_eq!(r, rows);
    }

    #[test]
    fn write_tsv_file() {
        let tmp = TempDir::new().unwrap();
        let path = tmp.path().join("out.tsv");
        let headers = vec!["x".to_string(), "y".to_string()];
        let rows = vec![vec!["hello".to_string(), "world".to_string()]];
        super::write_tsv(&path, &headers, &rows).unwrap();

        let content = std::fs::read_to_string(&path).unwrap();
        assert!(content.contains("x\ty"));
        assert!(content.contains("hello\tworld"));
    }
}
