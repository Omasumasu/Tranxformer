use crate::error::AppError;
use std::path::Path;

/// CSVファイルを読み込み、ヘッダーと行データを返す
pub fn read_csv(path: &Path) -> Result<(Vec<String>, Vec<Vec<String>>), AppError> {
    let delimiter = detect_delimiter(path)?;
    let mut reader = csv::ReaderBuilder::new()
        .delimiter(delimiter)
        .has_headers(true)
        .from_path(path)?;

    let headers: Vec<String> = reader.headers()?.iter().map(ToString::to_string).collect();

    let mut rows = Vec::new();
    for result in reader.records() {
        let record = result?;
        let row: Vec<String> = record.iter().map(ToString::to_string).collect();
        rows.push(row);
    }

    Ok((headers, rows))
}

/// 区切り文字を自動検出する（タブ or カンマ）
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

/// データをCSVファイルとして書き出す
pub fn write_csv(path: &Path, headers: &[String], rows: &[Vec<String>]) -> Result<(), AppError> {
    let mut writer = csv::Writer::from_path(path)?;
    writer.write_record(headers)?;
    for row in rows {
        writer.write_record(row)?;
    }
    writer.flush()?;
    Ok(())
}

/// データをTSVファイルとして書き出す
pub fn write_tsv(path: &Path, headers: &[String], rows: &[Vec<String>]) -> Result<(), AppError> {
    let mut writer = csv::WriterBuilder::new().delimiter(b'\t').from_path(path)?;
    writer.write_record(headers)?;
    for row in rows {
        writer.write_record(row)?;
    }
    writer.flush()?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn read_csv_basic() {
        let tmp = std::env::temp_dir().join("tranxformer_test_csv_read.csv");
        fs::write(&tmp, "name,age\nAlice,30\nBob,25\n").unwrap();

        let (headers, rows) = read_csv(&tmp).unwrap();
        assert_eq!(headers, vec!["name", "age"]);
        assert_eq!(rows.len(), 2);
        assert_eq!(rows[0], vec!["Alice", "30"]);

        let _ = fs::remove_file(&tmp);
    }

    #[test]
    fn read_tsv_auto_detect() {
        let tmp = std::env::temp_dir().join("tranxformer_test_tsv_read.tsv");
        fs::write(&tmp, "name\tage\nAlice\t30\n").unwrap();

        let (headers, rows) = read_csv(&tmp).unwrap();
        assert_eq!(headers, vec!["name", "age"]);
        assert_eq!(rows.len(), 1);

        let _ = fs::remove_file(&tmp);
    }

    #[test]
    fn write_csv_and_read_back() {
        let tmp = std::env::temp_dir().join("tranxformer_test_csv_write.csv");
        let headers = vec!["x".to_string(), "y".to_string()];
        let rows = vec![vec!["1".to_string(), "2".to_string()]];

        write_csv(&tmp, &headers, &rows).unwrap();
        let (h, r) = read_csv(&tmp).unwrap();
        assert_eq!(h, headers);
        assert_eq!(r, rows);

        let _ = fs::remove_file(&tmp);
    }

    #[test]
    fn write_tsv_creates_tab_separated() {
        let tmp = std::env::temp_dir().join("tranxformer_test_tsv_write.tsv");
        let headers = vec!["a".to_string(), "b".to_string()];
        let rows = vec![vec!["1".to_string(), "2".to_string()]];

        write_tsv(&tmp, &headers, &rows).unwrap();
        let content = fs::read_to_string(&tmp).unwrap();
        assert!(content.contains("a\tb"));

        let _ = fs::remove_file(&tmp);
    }
}
