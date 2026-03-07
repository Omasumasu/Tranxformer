use crate::models::{ColumnDef, ColumnType, Record, Template};

/// テンプレートのカラム定義をプロンプト用テキストに変換
#[must_use]
pub fn format_columns_for_prompt(columns: &[ColumnDef]) -> String {
    columns
        .iter()
        .map(|col| {
            let type_str = match col.data_type {
                ColumnType::Text => "文字列",
                ColumnType::Number => "数値",
                ColumnType::Date => "日付",
                ColumnType::Boolean => "真偽値",
            };
            format!(
                "- {name} ({label}): {type_str} — {desc}",
                name = col.name,
                label = col.label,
                desc = col.description,
            )
        })
        .collect::<Vec<_>>()
        .join("\n")
}

/// レコードのサンプルをプロンプト用テキストに変換
#[must_use]
pub fn format_sample_for_prompt(headers: &[String], rows: &[Record], max_rows: usize) -> String {
    let display_rows = rows.len().min(max_rows);
    let mut lines = Vec::with_capacity(display_rows + 1);

    lines.push(headers.join("\t"));

    for row in rows.iter().take(display_rows) {
        let values: Vec<String> = headers
            .iter()
            .map(|h| {
                row.get(h)
                    .map(|v| match v {
                        serde_json::Value::String(s) => s.clone(),
                        other => other.to_string(),
                    })
                    .unwrap_or_default()
            })
            .collect();
        lines.push(values.join("\t"));
    }

    lines.join("\n")
}

/// 変換コード生成用のプロンプトを構築
#[must_use]
pub fn build_transform_prompt(
    template: &Template,
    headers: &[String],
    sample_rows: &[Record],
) -> String {
    let columns_text = format_columns_for_prompt(&template.columns);
    let sample_text = format_sample_for_prompt(headers, sample_rows, 5);

    format!(
        r"あなたはデータ変換の専門家です。
以下の入力データサンプルを、指定されたテンプレートに従って変換するJavaScriptコードを生成してください。

## 入力データサンプル（先頭5行）
{sample_text}

## 出力テンプレート: {name}
{columns_text}

## 要件
- 関数 `transform(rows)` を定義してください
- rowsは配列で、各要素はオブジェクト（カラム名がキー）
- 戻り値は変換後の配列（各要素は出力テンプレートのカラム名をキーとするオブジェクト）
- 外部ライブラリは使用しないでください
- コードのみを出力してください（説明文は不要）",
        name = template.name,
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::ColumnDef;

    fn sample_columns() -> Vec<ColumnDef> {
        vec![
            ColumnDef {
                name: "full_name".to_string(),
                label: "氏名".to_string(),
                data_type: ColumnType::Text,
                description: "姓と名を結合".to_string(),
            },
            ColumnDef {
                name: "age".to_string(),
                label: "年齢".to_string(),
                data_type: ColumnType::Number,
                description: "整数".to_string(),
            },
        ]
    }

    #[test]
    fn format_columns_contains_all_fields() {
        let text = format_columns_for_prompt(&sample_columns());
        assert!(text.contains("full_name"));
        assert!(text.contains("氏名"));
        assert!(text.contains("文字列"));
        assert!(text.contains("age"));
        assert!(text.contains("数値"));
    }

    #[test]
    fn format_sample_limits_rows() {
        let headers = vec!["a".to_string(), "b".to_string()];
        let mut row = serde_json::Map::new();
        row.insert("a".to_string(), serde_json::Value::String("1".to_string()));
        row.insert("b".to_string(), serde_json::Value::String("2".to_string()));
        let rows = vec![row.clone(), row.clone(), row];

        let text = format_sample_for_prompt(&headers, &rows, 2);
        // header + 2 rows = 3 lines
        assert_eq!(text.lines().count(), 3);
    }

    #[test]
    fn build_prompt_contains_template_name() {
        let template = Template {
            id: "1".to_string(),
            name: "テスト変換".to_string(),
            description: "".to_string(),
            columns: sample_columns(),
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: "2024-01-01T00:00:00Z".to_string(),
        };
        let headers = vec!["first".to_string(), "last".to_string()];
        let prompt = build_transform_prompt(&template, &headers, &[]);

        assert!(prompt.contains("テスト変換"));
        assert!(prompt.contains("transform(rows)"));
    }
}
