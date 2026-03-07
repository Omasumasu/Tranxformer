use crate::models::Record;

/// サンプル行を抽出（先頭N行）
pub fn extract_sample_rows(rows: &[Record], max_rows: usize) -> Vec<Record> {
    rows.iter().take(max_rows).cloned().collect()
}

/// ヘッダー行を抽出（最初のレコードのキー一覧）
pub fn extract_headers(rows: &[Record]) -> Vec<String> {
    match rows.first() {
        Some(row) => row.keys().cloned().collect(),
        None => Vec::new(),
    }
}

/// 文字列の二次元配列をRecord配列に変換
pub fn rows_to_records(headers: &[String], rows: &[Vec<String>]) -> Vec<Record> {
    rows.iter()
        .map(|row| {
            let mut record = serde_json::Map::new();
            for (i, header) in headers.iter().enumerate() {
                let value = row.get(i).cloned().unwrap_or_default();
                record.insert(header.clone(), serde_json::Value::String(value));
            }
            record
        })
        .collect()
}

/// Record配列から指定カラムの値を文字列として抽出
pub fn extract_column_values(rows: &[Record], column: &str) -> Vec<String> {
    rows.iter()
        .map(|row| match row.get(column) {
            Some(serde_json::Value::String(s)) => s.clone(),
            Some(v) => v.to_string(),
            None => String::new(),
        })
        .collect()
}

/// Record配列を文字列二次元配列に変換（CSV/Excel出力用）
pub fn records_to_string_rows(records: &[Record], headers: &[String]) -> Vec<Vec<String>> {
    records
        .iter()
        .map(|record| {
            headers
                .iter()
                .map(|h| match record.get(h) {
                    Some(serde_json::Value::String(s)) => s.clone(),
                    Some(serde_json::Value::Null) | None => String::new(),
                    Some(v) => v.to_string(),
                })
                .collect()
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn sample_records() -> Vec<Record> {
        vec![
            {
                let mut m = serde_json::Map::new();
                m.insert("name".to_string(), json!("Alice"));
                m.insert("age".to_string(), json!(30));
                m
            },
            {
                let mut m = serde_json::Map::new();
                m.insert("name".to_string(), json!("Bob"));
                m.insert("age".to_string(), json!(25));
                m
            },
            {
                let mut m = serde_json::Map::new();
                m.insert("name".to_string(), json!("Charlie"));
                m.insert("age".to_string(), json!(35));
                m
            },
        ]
    }

    #[test]
    fn extract_sample_limits_rows() {
        let rows = sample_records();
        let sample = extract_sample_rows(&rows, 2);
        assert_eq!(sample.len(), 2);
    }

    #[test]
    fn extract_sample_handles_fewer_rows() {
        let rows = sample_records();
        let sample = extract_sample_rows(&rows, 100);
        assert_eq!(sample.len(), 3);
    }

    #[test]
    fn extract_headers_from_records() {
        let rows = sample_records();
        let headers = extract_headers(&rows);
        assert!(headers.contains(&"name".to_string()));
        assert!(headers.contains(&"age".to_string()));
    }

    #[test]
    fn extract_headers_empty() {
        let headers = extract_headers(&[]);
        assert!(headers.is_empty());
    }

    #[test]
    fn rows_to_records_conversion() {
        let headers = vec!["name".to_string(), "city".to_string()];
        let rows = vec![
            vec!["Alice".to_string(), "Tokyo".to_string()],
            vec!["Bob".to_string(), "Osaka".to_string()],
        ];
        let records = rows_to_records(&headers, &rows);
        assert_eq!(records.len(), 2);
        assert_eq!(records[0]["name"], json!("Alice"));
        assert_eq!(records[1]["city"], json!("Osaka"));
    }

    #[test]
    fn extract_column_values_works() {
        let rows = sample_records();
        let names = extract_column_values(&rows, "name");
        assert_eq!(names, vec!["Alice", "Bob", "Charlie"]);
    }

    #[test]
    fn records_to_string_rows_works() {
        let rows = sample_records();
        let headers = vec!["name".to_string(), "age".to_string()];
        let string_rows = records_to_string_rows(&rows, &headers);
        assert_eq!(string_rows.len(), 3);
        assert_eq!(string_rows[0][0], "Alice");
        assert_eq!(string_rows[0][1], "30");
    }
}
