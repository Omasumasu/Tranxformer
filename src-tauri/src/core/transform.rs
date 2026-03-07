use crate::models::Record;
use serde_json::Value;

/// `CSV的な文字列行をRecordのベクタに変換`
#[must_use]
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

/// Recordから指定ヘッダ順で値を取り出し、文字列ベクタに変換
#[must_use]
pub fn record_to_row(record: &Record, headers: &[String]) -> Vec<String> {
    headers
        .iter()
        .map(|h| {
            record
                .get(h)
                .map(|v| match v {
                    Value::String(s) => s.clone(),
                    Value::Null => String::new(),
                    other => other.to_string(),
                })
                .unwrap_or_default()
        })
        .collect()
}

/// `TransformResult用のヘッダリストをRecordsから推定`
#[must_use]
pub fn extract_headers_from_records(records: &[Record]) -> Vec<String> {
    let Some(first) = records.first() else {
        return Vec::new();
    };
    first.keys().cloned().collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rows_to_records_creates_correct_map() {
        let headers = vec!["name".to_string(), "age".to_string()];
        let rows = vec![vec!["Alice".to_string(), "30".to_string()]];

        let records = rows_to_records(&headers, &rows);
        assert_eq!(records.len(), 1);
        assert_eq!(records[0]["name"], Value::String("Alice".to_string()));
        assert_eq!(records[0]["age"], Value::String("30".to_string()));
    }

    #[test]
    fn rows_to_records_handles_missing_columns() {
        let headers = vec!["a".to_string(), "b".to_string(), "c".to_string()];
        let rows = vec![vec!["1".to_string()]];

        let records = rows_to_records(&headers, &rows);
        assert_eq!(records[0]["a"], Value::String("1".to_string()));
        assert_eq!(records[0]["b"], Value::Null);
    }

    #[test]
    fn record_to_row_extracts_values_in_order() {
        let mut record = Record::new();
        record.insert("x".to_string(), Value::String("hello".to_string()));
        record.insert("y".to_string(), Value::String("world".to_string()));

        let headers = vec!["y".to_string(), "x".to_string()];
        let row = record_to_row(&record, &headers);
        assert_eq!(row, vec!["world", "hello"]);
    }

    #[test]
    fn extract_headers_empty_records() {
        let headers = extract_headers_from_records(&[]);
        assert!(headers.is_empty());
    }
}
