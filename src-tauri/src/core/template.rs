use crate::models::Template;

/// テンプレート名のバリデーション
pub fn validate_template_name(name: &str) -> Result<(), String> {
    if name.trim().is_empty() {
        return Err("テンプレート名は空にできません".to_string());
    }
    if name.len() > 100 {
        return Err("テンプレート名は100文字以内にしてください".to_string());
    }
    Ok(())
}

/// テンプレート全体のバリデーション
pub fn validate_template(template: &Template) -> Result<(), Vec<String>> {
    let mut errors = Vec::new();

    if let Err(e) = validate_template_name(&template.name) {
        errors.push(e);
    }

    if template.columns.is_empty() {
        errors.push("カラムが1つ以上必要です".to_string());
    }

    for (i, col) in template.columns.iter().enumerate() {
        if col.name.trim().is_empty() {
            errors.push(format!("カラム{}の名前が空です", i + 1));
        }
        if col.label.trim().is_empty() {
            errors.push(format!("カラム{}のラベルが空です", i + 1));
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{ColumnDef, ColumnType};

    #[test]
    fn valid_template_name() {
        assert!(validate_template_name("テスト").is_ok());
    }

    #[test]
    fn empty_template_name_is_invalid() {
        assert!(validate_template_name("").is_err());
        assert!(validate_template_name("   ").is_err());
    }

    #[test]
    fn valid_template() {
        let template = Template {
            id: "1".to_string(),
            name: "テスト".to_string(),
            description: "説明".to_string(),
            columns: vec![ColumnDef {
                name: "col1".to_string(),
                label: "カラム1".to_string(),
                data_type: ColumnType::Text,
                description: "テスト用".to_string(),
            }],
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: "2024-01-01T00:00:00Z".to_string(),
        };
        assert!(validate_template(&template).is_ok());
    }

    #[test]
    fn template_without_columns_is_invalid() {
        let template = Template {
            id: "1".to_string(),
            name: "テスト".to_string(),
            description: "".to_string(),
            columns: vec![],
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: "2024-01-01T00:00:00Z".to_string(),
        };
        assert!(validate_template(&template).is_err());
    }
}
