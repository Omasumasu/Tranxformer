use crate::models::{ColumnType, InferredColumn};

/// ヘッダー名を `snake_case` に変換
fn to_snake_case(s: &str) -> String {
    let mut result = String::with_capacity(s.len());
    let mut prev_was_separator = false;

    for (i, ch) in s.chars().enumerate() {
        if ch == ' ' || ch == '-' || ch == '_' {
            if !result.is_empty() && !prev_was_separator {
                result.push('_');
            }
            prev_was_separator = true;
        } else if ch.is_ascii_uppercase() {
            // Insert underscore before uppercase if previous char was lowercase
            if i > 0 && !prev_was_separator && !result.is_empty() {
                let prev_ch = s.chars().nth(i - 1);
                if let Some(p) = prev_ch {
                    if p.is_ascii_lowercase() {
                        result.push('_');
                    }
                }
            }
            result.push(ch.to_ascii_lowercase());
            prev_was_separator = false;
        } else {
            result.push(ch);
            prev_was_separator = false;
        }
    }

    result
}

/// 単一の値の型を推論
fn infer_value_type(value: &str) -> Option<ColumnType> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return None;
    }

    // Boolean: true/false/yes/no/1/0 (case-insensitive)
    let lower = trimmed.to_lowercase();
    if matches!(lower.as_str(), "true" | "false" | "yes" | "no" | "1" | "0") {
        return Some(ColumnType::Boolean);
    }

    // Date patterns
    if is_date(trimmed) {
        return Some(ColumnType::Date);
    }

    // Number: integers, decimals, comma-separated (e.g. "1,234.56", "1234")
    if is_number(trimmed) {
        return Some(ColumnType::Number);
    }

    Some(ColumnType::Text)
}

/// Check if a string matches a date pattern
fn is_date(s: &str) -> bool {
    // YYYY-MM-DD
    if matches_date_pattern(s, '-', true) {
        return true;
    }
    // YYYY/MM/DD
    if matches_date_pattern(s, '/', true) {
        return true;
    }
    // MM/DD/YYYY or DD/MM/YYYY (ambiguous, but accept both as date)
    if matches_mdy_or_dmy(s, '/') {
        return true;
    }
    // YYYY年MM月DD日
    if matches_japanese_date(s) {
        return true;
    }
    false
}

fn matches_date_pattern(s: &str, sep: char, year_first: bool) -> bool {
    let parts: Vec<&str> = s.split(sep).collect();
    if parts.len() != 3 {
        return false;
    }
    if year_first {
        // YYYY-MM-DD or YYYY/MM/DD
        let year = parts[0].parse::<u32>();
        let month = parts[1].parse::<u32>();
        let day = parts[2].parse::<u32>();
        matches!((year, month, day), (Ok(y), Ok(m), Ok(d)) if (1000..=9999).contains(&y) && (1..=12).contains(&m) && (1..=31).contains(&d))
    } else {
        false
    }
}

fn matches_mdy_or_dmy(s: &str, sep: char) -> bool {
    let parts: Vec<&str> = s.split(sep).collect();
    if parts.len() != 3 {
        return false;
    }
    let a = parts[0].parse::<u32>();
    let b = parts[1].parse::<u32>();
    let c = parts[2].parse::<u32>();
    match (a, b, c) {
        (Ok(first), Ok(second), Ok(year)) if (1000..=9999).contains(&year) => {
            // MM/DD/YYYY or DD/MM/YYYY
            ((1..=12).contains(&first) && (1..=31).contains(&second))
                || ((1..=31).contains(&first) && (1..=12).contains(&second))
        }
        _ => false,
    }
}

fn matches_japanese_date(s: &str) -> bool {
    // Pattern: YYYY年MM月DD日
    if let Some(year_end) = s.find('\u{5e74}') {
        // 年
        let rest = &s[year_end + '\u{5e74}'.len_utf8()..];
        if let Some(month_end) = rest.find('\u{6708}') {
            // 月
            let rest2 = &rest[month_end + '\u{6708}'.len_utf8()..];
            if rest2.ends_with('\u{65e5}') {
                // 日
                let year_str = &s[..year_end];
                let month_str = &rest[..month_end];
                let day_str = &rest2[..rest2.len() - '\u{65e5}'.len_utf8()];
                if let (Ok(y), Ok(m), Ok(d)) = (
                    year_str.parse::<u32>(),
                    month_str.parse::<u32>(),
                    day_str.parse::<u32>(),
                ) {
                    return (1000..=9999).contains(&y)
                        && (1..=12).contains(&m)
                        && (1..=31).contains(&d);
                }
            }
        }
    }
    false
}

fn is_number(s: &str) -> bool {
    // Remove commas and try to parse
    let cleaned = s.replace(',', "");
    if cleaned.is_empty() {
        return false;
    }
    cleaned.parse::<f64>().is_ok()
}

/// 列のすべての値から型を推論（空値はスキップ、混在はText）
fn infer_column_type(values: &[&str]) -> ColumnType {
    let mut detected_type: Option<ColumnType> = None;

    for value in values {
        if let Some(vtype) = infer_value_type(value) {
            match &detected_type {
                None => detected_type = Some(vtype),
                Some(existing) => {
                    if *existing != vtype {
                        return ColumnType::Text;
                    }
                }
            }
        }
    }

    detected_type.unwrap_or(ColumnType::Text)
}

/// ヘッダーと行データからスキーマを推論
pub fn infer_schema(headers: &[String], rows: &[Vec<String>]) -> Vec<InferredColumn> {
    headers
        .iter()
        .enumerate()
        .map(|(col_idx, header)| {
            let values: Vec<&str> = rows
                .iter()
                .filter_map(|row| row.get(col_idx).map(String::as_str))
                .collect();

            let sample_values: Vec<String> = rows
                .iter()
                .take(5)
                .filter_map(|row| row.get(col_idx).cloned())
                .collect();

            InferredColumn {
                name: to_snake_case(header),
                label: header.clone(),
                data_type: infer_column_type(&values),
                sample_values,
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn infer_number_column() {
        let headers = vec!["price".to_string()];
        let rows = vec![
            vec!["100".to_string()],
            vec!["200.5".to_string()],
            vec!["1,234".to_string()],
        ];
        let result = infer_schema(&headers, &rows);
        assert_eq!(result[0].data_type, ColumnType::Number);
    }

    #[test]
    fn infer_boolean_column() {
        let headers = vec!["active".to_string()];
        let rows = vec![
            vec!["true".to_string()],
            vec!["false".to_string()],
            vec!["True".to_string()],
        ];
        let result = infer_schema(&headers, &rows);
        assert_eq!(result[0].data_type, ColumnType::Boolean);
    }

    #[test]
    fn infer_date_column() {
        let headers = vec!["created".to_string()];
        let rows = vec![
            vec!["2024-01-15".to_string()],
            vec!["2024-02-20".to_string()],
        ];
        let result = infer_schema(&headers, &rows);
        assert_eq!(result[0].data_type, ColumnType::Date);
    }

    #[test]
    fn mixed_types_fallback_to_text() {
        let headers = vec!["data".to_string()];
        let rows = vec![vec!["hello".to_string()], vec!["123".to_string()]];
        let result = infer_schema(&headers, &rows);
        assert_eq!(result[0].data_type, ColumnType::Text);
    }

    #[test]
    fn empty_values_skipped() {
        let headers = vec!["count".to_string()];
        let rows = vec![
            vec!["10".to_string()],
            vec!["".to_string()],
            vec!["20".to_string()],
        ];
        let result = infer_schema(&headers, &rows);
        assert_eq!(result[0].data_type, ColumnType::Number);
    }

    #[test]
    fn all_empty_is_text() {
        let headers = vec!["empty".to_string()];
        let rows = vec![vec!["".to_string()], vec!["".to_string()]];
        let result = infer_schema(&headers, &rows);
        assert_eq!(result[0].data_type, ColumnType::Text);
    }

    #[test]
    fn snake_case_conversion() {
        let headers = vec!["First Name".to_string(), "created-at".to_string()];
        let rows = vec![vec!["Alice".to_string(), "2024-01-01".to_string()]];
        let result = infer_schema(&headers, &rows);
        assert_eq!(result[0].name, "first_name");
        assert_eq!(result[0].label, "First Name");
        assert_eq!(result[1].name, "created_at");
    }

    #[test]
    fn sample_values_limited_to_five() {
        let headers = vec!["x".to_string()];
        let rows: Vec<Vec<String>> = (0..20).map(|i| vec![i.to_string()]).collect();
        let result = infer_schema(&headers, &rows);
        assert_eq!(result[0].sample_values.len(), 5);
    }

    #[test]
    fn yes_no_is_boolean() {
        let headers = vec!["flag".to_string()];
        let rows = vec![
            vec!["Yes".to_string()],
            vec!["No".to_string()],
            vec!["yes".to_string()],
        ];
        let result = infer_schema(&headers, &rows);
        assert_eq!(result[0].data_type, ColumnType::Boolean);
    }

    #[test]
    fn date_slash_format() {
        let headers = vec!["date".to_string()];
        let rows = vec![
            vec!["2024/01/15".to_string()],
            vec!["2024/12/31".to_string()],
        ];
        let result = infer_schema(&headers, &rows);
        assert_eq!(result[0].data_type, ColumnType::Date);
    }
}
