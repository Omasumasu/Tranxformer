use crate::models::{ColumnDef, ColumnType, Record, Template};

/// LLMに送るプロンプトを構築（純粋関数）
pub fn build_transform_prompt(template: &Template, sample_rows: &[Record]) -> String {
    let input_sample = format_sample_rows(sample_rows);
    let template_def = format_template_definition(template);

    format!(
        "あなたはデータ変換の専門家です。\n\
以下の入力データサンプルを、指定されたテンプレートに従って変換するJavaScriptコードを生成してください。\n\
\n\
## 入力データサンプル（先頭{row_count}行）\n\
{input_sample}\n\
\n\
## 出力テンプレート\n\
{template_def}\n\
\n\
## 要件\n\
- 関数 `transform(rows)` を定義してください\n\
- rowsは配列で、各要素はオブジェクト（カラム名がキー）\n\
- 戻り値は変換後の配列\n\
- 各要素は出力テンプレートのカラム名をキーとするオブジェクト\n\
- 外部ライブラリは使用しないでください\n\
- eval, Function, fetch, require, import は使用禁止です\n\
\n\
```javascript\n\
function transform(rows) {{\n\
  // ここにコードを書いてください\n\
}}\n\
```",
        row_count = sample_rows.len(),
    )
}

/// サンプル行をフォーマット
fn format_sample_rows(rows: &[Record]) -> String {
    if rows.is_empty() {
        return "(データなし)".to_string();
    }

    let headers: Vec<&String> = rows[0].keys().collect();
    let mut lines = vec![format!(
        "| {} |",
        headers
            .iter()
            .map(|h| h.as_str())
            .collect::<Vec<_>>()
            .join(" | ")
    )];
    lines.push(format!(
        "| {} |",
        headers
            .iter()
            .map(|_| "---")
            .collect::<Vec<_>>()
            .join(" | ")
    ));

    for row in rows {
        let values: Vec<String> = headers
            .iter()
            .map(|h| match row.get(*h) {
                Some(serde_json::Value::String(s)) => s.clone(),
                Some(v) => v.to_string(),
                None => String::new(),
            })
            .collect();
        lines.push(format!("| {} |", values.join(" | ")));
    }

    lines.join("\n")
}

/// テンプレート定義をフォーマット
fn format_template_definition(template: &Template) -> String {
    let mut lines = vec![format!("テンプレート名: {}", template.name)];
    if !template.description.is_empty() {
        lines.push(format!("説明: {}", template.description));
    }
    lines.push(String::new());
    lines.push("| カラム名 | ラベル | データ型 | 説明 |".to_string());
    lines.push("| --- | --- | --- | --- |".to_string());

    for col in &template.columns {
        lines.push(format!(
            "| {} | {} | {} | {} |",
            col.name,
            col.label,
            format_column_type(&col.data_type),
            col.description,
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

/// カラム定義からサンプル出力のスキーマを生成
pub fn build_output_schema(columns: &[ColumnDef]) -> String {
    let fields: Vec<String> = columns
        .iter()
        .map(|c| format!("  {}: {}", c.name, format_column_type(&c.data_type)))
        .collect();
    format!("{{\n{}\n}}", fields.join(",\n"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::ColumnDef;
    use serde_json::json;

    fn make_template() -> Template {
        Template {
            id: "t1".to_string(),
            name: "社員情報".to_string(),
            description: "社員データ変換用".to_string(),
            columns: vec![
                ColumnDef {
                    name: "employee_name".to_string(),
                    label: "氏名".to_string(),
                    data_type: ColumnType::Text,
                    description: "フルネーム".to_string(),
                },
                ColumnDef {
                    name: "age".to_string(),
                    label: "年齢".to_string(),
                    data_type: ColumnType::Number,
                    description: "".to_string(),
                },
            ],
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: "2024-01-01T00:00:00Z".to_string(),
        }
    }

    fn make_sample_rows() -> Vec<Record> {
        vec![{
            let mut m = serde_json::Map::new();
            m.insert("名前".to_string(), json!("田中太郎"));
            m.insert("年齢".to_string(), json!(30));
            m
        }]
    }

    #[test]
    fn prompt_contains_template_name() {
        let prompt = build_transform_prompt(&make_template(), &make_sample_rows());
        assert!(prompt.contains("社員情報"));
    }

    #[test]
    fn prompt_contains_sample_data() {
        let prompt = build_transform_prompt(&make_template(), &make_sample_rows());
        assert!(prompt.contains("田中太郎"));
    }

    #[test]
    fn prompt_contains_column_definitions() {
        let prompt = build_transform_prompt(&make_template(), &make_sample_rows());
        assert!(prompt.contains("employee_name"));
        assert!(prompt.contains("氏名"));
    }

    #[test]
    fn prompt_contains_transform_function() {
        let prompt = build_transform_prompt(&make_template(), &make_sample_rows());
        assert!(prompt.contains("function transform(rows)"));
    }

    #[test]
    fn empty_rows_handled() {
        let prompt = build_transform_prompt(&make_template(), &[]);
        assert!(prompt.contains("データなし"));
    }

    #[test]
    fn output_schema_format() {
        let schema = build_output_schema(&make_template().columns);
        assert!(schema.contains("employee_name: テキスト"));
        assert!(schema.contains("age: 数値"));
    }
}
