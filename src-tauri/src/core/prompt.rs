use crate::models::{ColumnDef, ColumnType, Template};

/// LLMへ送るプロンプトを構築する純粋関数
pub fn build_transform_prompt(
    input_sample: &[Vec<String>],
    input_headers: &[String],
    template: &Template,
) -> String {
    let sample_text = format_input_sample(input_headers, input_sample);
    let template_text = format_template_definition(template);

    format!(
        "あなたはデータ変換の専門家です。\n\
         以下の入力データサンプルを、指定されたテンプレートに従って変換する\n\
         JavaScriptコードを生成してください。\n\n\
         ## 入力データサンプル（先頭行）\n\
         {sample_text}\n\n\
         ## 出力テンプレート\n\
         {template_text}\n\n\
         ## 要件\n\
         - 関数 `transform(rows)` を定義してください\n\
         - rowsは配列で、各要素はオブジェクト（カラム名がキー）\n\
         - 戻り値は変換後の配列\n\
         - 外部ライブラリは使用しないでください\n\
         - JavaScriptコードのみ出力してください（説明不要）"
    )
}

fn format_input_sample(headers: &[String], rows: &[Vec<String>]) -> String {
    if headers.is_empty() {
        return "(データなし)".to_string();
    }

    let mut lines = Vec::with_capacity(rows.len() + 1);
    lines.push(headers.join("\t"));
    for row in rows {
        lines.push(row.join("\t"));
    }
    lines.join("\n")
}

fn format_template_definition(template: &Template) -> String {
    let mut lines = Vec::with_capacity(template.columns.len() + 1);
    lines.push(format!("テンプレート名: {}", template.name));

    for col in &template.columns {
        let type_str = format_column_type(&col.data_type);
        let desc = if col.description.is_empty() {
            String::new()
        } else {
            format!(" — {}", col.description)
        };
        lines.push(format!(
            "- {} ({}): {}{}",
            col.name, type_str, col.label, desc
        ));
    }
    lines.join("\n")
}

fn format_column_type(ct: &ColumnType) -> &'static str {
    match ct {
        ColumnType::Text => "テキスト",
        ColumnType::Number => "数値",
        ColumnType::Date => "日付",
        ColumnType::Boolean => "真偽値",
    }
}

/// テンプレートの出力カラム定義をJSONスキーマ風に表現する
pub fn build_output_schema(columns: &[ColumnDef]) -> String {
    let fields: Vec<String> = columns
        .iter()
        .map(|c| {
            let ts = match c.data_type {
                ColumnType::Text => "string",
                ColumnType::Number => "number",
                ColumnType::Date => "string (ISO 8601)",
                ColumnType::Boolean => "boolean",
            };
            format!("  \"{}\": {}", c.name, ts)
        })
        .collect();

    format!("{{\n{}\n}}", fields.join(",\n"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{ColumnDef, ColumnType, Template};

    fn sample_template() -> Template {
        Template {
            id: "t1".to_string(),
            name: "顧客リスト".to_string(),
            description: "顧客情報を整理する".to_string(),
            columns: vec![
                ColumnDef {
                    name: "name".to_string(),
                    label: "氏名".to_string(),
                    data_type: ColumnType::Text,
                    description: "フルネーム".to_string(),
                },
                ColumnDef {
                    name: "age".to_string(),
                    label: "年齢".to_string(),
                    data_type: ColumnType::Number,
                    description: String::new(),
                },
            ],
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: "2024-01-01T00:00:00Z".to_string(),
        }
    }

    #[test]
    fn prompt_contains_template_name() {
        let headers = vec!["col_a".to_string(), "col_b".to_string()];
        let rows = vec![vec!["val1".to_string(), "val2".to_string()]];
        let template = sample_template();
        let prompt = build_transform_prompt(&rows, &headers, &template);

        assert!(prompt.contains("顧客リスト"));
        assert!(prompt.contains("transform(rows)"));
    }

    #[test]
    fn prompt_includes_sample_data() {
        let headers = vec!["A".to_string(), "B".to_string()];
        let rows = vec![vec!["1".to_string(), "2".to_string()]];
        let template = sample_template();
        let prompt = build_transform_prompt(&rows, &headers, &template);

        assert!(prompt.contains("A\tB"));
        assert!(prompt.contains("1\t2"));
    }

    #[test]
    fn output_schema_format() {
        let columns = vec![ColumnDef {
            name: "email".to_string(),
            label: "メール".to_string(),
            data_type: ColumnType::Text,
            description: String::new(),
        }];
        let schema = build_output_schema(&columns);
        assert!(schema.contains("\"email\": string"));
    }

    #[test]
    fn empty_sample_shows_placeholder() {
        let result = format_input_sample(&[], &[]);
        assert_eq!(result, "(データなし)");
    }
}
