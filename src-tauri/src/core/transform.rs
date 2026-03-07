use crate::models::Record;
use serde_json::Value;

/// ヘッダー付きの行データをRecordのベクタに変換する純粋関数
pub fn rows_to_records(headers: &[String], rows: &[Vec<String>]) -> Vec<Record> {
    rows.iter()
        .map(|row| {
            let mut record = Record::new();
            for (i, header) in headers.iter().enumerate() {
                let value = row.get(i).map_or(Value::Null, |v| Value::String(v.clone()));
                record.insert(header.clone(), value);
            }
            record
        })
        .collect()
}

/// Recordのベクタからヘッダー行を抽出する
pub fn extract_headers(records: &[Record]) -> Vec<String> {
    let Some(first) = records.first() else {
        return Vec::new();
    };
    first.keys().cloned().collect()
}

/// Recordのベクタをフラットな文字列行列に変換する
pub fn records_to_rows(headers: &[String], records: &[Record]) -> Vec<Vec<String>> {
    records
        .iter()
        .map(|record| {
            headers
                .iter()
                .map(|h| record.get(h).map_or(String::new(), value_to_string))
                .collect()
        })
        .collect()
}

fn value_to_string(v: &Value) -> String {
    match v {
        Value::String(s) => s.clone(),
        Value::Number(n) => n.to_string(),
        Value::Bool(b) => b.to_string(),
        Value::Null => String::new(),
        _ => v.to_string(),
    }
}

/// プレビュー用に先頭N行を抽出する
pub fn take_sample(rows: &[Vec<String>], n: usize) -> Vec<Vec<String>> {
    rows.iter().take(n).cloned().collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rows_to_records_basic() {
        let headers = vec!["name".to_string(), "age".to_string()];
        let rows = vec![vec!["Alice".to_string(), "30".to_string()]];
        let records = rows_to_records(&headers, &rows);

        assert_eq!(records.len(), 1);
        assert_eq!(records[0].get("name").unwrap(), "Alice");
        assert_eq!(records[0].get("age").unwrap(), "30");
    }

    #[test]
    fn rows_to_records_missing_values() {
        let headers = vec!["a".to_string(), "b".to_string(), "c".to_string()];
        let rows = vec![vec!["1".to_string()]];
        let records = rows_to_records(&headers, &rows);

        assert_eq!(records[0].get("a").unwrap(), "1");
        assert_eq!(records[0].get("b").unwrap(), &Value::Null);
    }

    #[test]
    fn extract_headers_from_records() {
        let headers = vec!["x".to_string(), "y".to_string()];
        let rows = vec![vec!["1".to_string(), "2".to_string()]];
        let records = rows_to_records(&headers, &rows);
        let extracted = extract_headers(&records);

        assert_eq!(extracted.len(), 2);
    }

    #[test]
    fn extract_headers_empty() {
        let result = extract_headers(&[]);
        assert!(result.is_empty());
    }

    #[test]
    fn records_to_rows_roundtrip() {
        let headers = vec!["name".to_string(), "val".to_string()];
        let rows = vec![
            vec!["Alice".to_string(), "10".to_string()],
            vec!["Bob".to_string(), "20".to_string()],
        ];
        let records = rows_to_records(&headers, &rows);
        let result = records_to_rows(&headers, &records);

        assert_eq!(result, rows);
    }

    #[test]
    fn take_sample_limits_rows() {
        let rows: Vec<Vec<String>> = (0..100).map(|i| vec![i.to_string()]).collect();
        let sample = take_sample(&rows, 5);
        assert_eq!(sample.len(), 5);
        assert_eq!(sample[0][0], "0");
        assert_eq!(sample[4][0], "4");
    }

    #[test]
    fn take_sample_fewer_than_n() {
        let rows = vec![vec!["only".to_string()]];
        let sample = take_sample(&rows, 10);
        assert_eq!(sample.len(), 1);
    }

    #[test]
    fn value_to_string_formats_correctly() {
        assert_eq!(value_to_string(&Value::String("hi".into())), "hi");
        assert_eq!(value_to_string(&Value::Number(42.into())), "42");
        assert_eq!(value_to_string(&Value::Bool(true)), "true");
        assert_eq!(value_to_string(&Value::Null), "");
    }
}
