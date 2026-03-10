use crate::error::AppError;
use crate::models::{InputTemplate, Template};
use std::path::{Path, PathBuf};

/// テンプレートの保存先ディレクトリを取得する
pub fn templates_dir(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join("templates")
}

/// テンプレートファイルのパスを取得する
fn template_path(app_data_dir: &Path, id: &str) -> PathBuf {
    templates_dir(app_data_dir).join(format!("{id}.json"))
}

/// テンプレート一覧を読み込む
pub fn list_templates(app_data_dir: &Path) -> Result<Vec<Template>, AppError> {
    let dir = templates_dir(app_data_dir);
    if !dir.exists() {
        return Ok(Vec::new());
    }

    let mut templates = Vec::new();
    for entry in std::fs::read_dir(&dir)? {
        let entry = entry?;
        let path = entry.path();
        if path.extension().is_some_and(|e| e == "json") {
            let content = std::fs::read_to_string(&path)?;
            let template: Template = serde_json::from_str(&content)?;
            templates.push(template);
        }
    }

    templates.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(templates)
}

/// テンプレートを1件取得する
pub fn get_template(app_data_dir: &Path, id: &str) -> Result<Template, AppError> {
    let path = template_path(app_data_dir, id);
    if !path.exists() {
        return Err(AppError::TemplateNotFound(id.to_string()));
    }
    let content = std::fs::read_to_string(&path)?;
    let template: Template = serde_json::from_str(&content)?;
    Ok(template)
}

/// テンプレートを保存する
pub fn save_template(app_data_dir: &Path, template: &Template) -> Result<(), AppError> {
    let dir = templates_dir(app_data_dir);
    if !dir.exists() {
        std::fs::create_dir_all(&dir)?;
    }
    let path = template_path(app_data_dir, &template.id);
    let content = serde_json::to_string_pretty(template)?;
    std::fs::write(&path, content)?;
    Ok(())
}

/// テンプレートを削除する
pub fn delete_template(app_data_dir: &Path, id: &str) -> Result<(), AppError> {
    let path = template_path(app_data_dir, id);
    if !path.exists() {
        return Err(AppError::TemplateNotFound(id.to_string()));
    }
    std::fs::remove_file(&path)?;
    Ok(())
}

/// テンプレートを指定パスにエクスポートする
pub fn export_template(template: &Template, export_path: &Path) -> Result<(), AppError> {
    let content = serde_json::to_string_pretty(template)?;
    std::fs::write(export_path, content)?;
    Ok(())
}

// ── InputTemplate CRUD ──

/// インプットテンプレートの保存先ディレクトリを取得する
pub fn input_templates_dir(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join("input_templates")
}

/// インプットテンプレートファイルのパスを取得する
fn input_template_path(app_data_dir: &Path, id: &str) -> PathBuf {
    input_templates_dir(app_data_dir).join(format!("{id}.json"))
}

/// インプットテンプレート一覧を読み込む
pub fn list_input_templates(app_data_dir: &Path) -> Result<Vec<InputTemplate>, AppError> {
    let dir = input_templates_dir(app_data_dir);
    if !dir.exists() {
        return Ok(Vec::new());
    }

    let mut templates = Vec::new();
    for entry in std::fs::read_dir(&dir)? {
        let entry = entry?;
        let path = entry.path();
        if path.extension().is_some_and(|e| e == "json") {
            let content = std::fs::read_to_string(&path)?;
            let template: InputTemplate = serde_json::from_str(&content)?;
            templates.push(template);
        }
    }

    templates.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(templates)
}

/// インプットテンプレートを保存する
pub fn save_input_template(
    app_data_dir: &Path,
    template: &InputTemplate,
) -> Result<(), AppError> {
    let dir = input_templates_dir(app_data_dir);
    if !dir.exists() {
        std::fs::create_dir_all(&dir)?;
    }
    let path = input_template_path(app_data_dir, &template.id);
    let content = serde_json::to_string_pretty(template)?;
    std::fs::write(&path, content)?;
    Ok(())
}

/// インプットテンプレートを削除する
pub fn delete_input_template(app_data_dir: &Path, id: &str) -> Result<(), AppError> {
    let path = input_template_path(app_data_dir, id);
    if !path.exists() {
        return Err(AppError::TemplateNotFound(id.to_string()));
    }
    std::fs::remove_file(&path)?;
    Ok(())
}

/// 指定パスからテンプレートをインポートする
pub fn import_template(import_path: &Path) -> Result<Template, AppError> {
    let content = std::fs::read_to_string(import_path)?;
    let template: Template = serde_json::from_str(&content)?;
    Ok(template)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{ColumnDef, ColumnType};
    use std::fs;

    fn test_template(id: &str) -> Template {
        Template {
            id: id.to_string(),
            name: "テスト".to_string(),
            description: "テスト説明".to_string(),
            columns: vec![ColumnDef {
                name: "col1".to_string(),
                label: "カラム1".to_string(),
                data_type: ColumnType::Text,
                required: false,
                description: String::new(),
            }],
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: "2024-01-01T00:00:00Z".to_string(),
        }
    }

    #[test]
    fn save_and_get_template() {
        let tmp = std::env::temp_dir().join("tranxformer_test_save_get");
        let _ = fs::remove_dir_all(&tmp);

        let template = test_template("t1");
        save_template(&tmp, &template).unwrap();

        let loaded = get_template(&tmp, "t1").unwrap();
        assert_eq!(loaded.name, "テスト");

        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn list_templates_returns_all() {
        let tmp = std::env::temp_dir().join("tranxformer_test_list");
        let _ = fs::remove_dir_all(&tmp);

        save_template(&tmp, &test_template("a")).unwrap();
        save_template(&tmp, &test_template("b")).unwrap();

        let list = list_templates(&tmp).unwrap();
        assert_eq!(list.len(), 2);

        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn list_templates_empty_dir() {
        let tmp = std::env::temp_dir().join("tranxformer_test_empty");
        let _ = fs::remove_dir_all(&tmp);

        let list = list_templates(&tmp).unwrap();
        assert!(list.is_empty());
    }

    #[test]
    fn delete_template_removes_file() {
        let tmp = std::env::temp_dir().join("tranxformer_test_delete");
        let _ = fs::remove_dir_all(&tmp);

        save_template(&tmp, &test_template("del")).unwrap();
        delete_template(&tmp, "del").unwrap();

        assert!(get_template(&tmp, "del").is_err());

        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn get_nonexistent_template_returns_error() {
        let tmp = std::env::temp_dir().join("tranxformer_test_notfound");
        let _ = fs::remove_dir_all(&tmp);

        let result = get_template(&tmp, "nope");
        assert!(result.is_err());
    }

    #[test]
    fn export_and_import_template() {
        let tmp = std::env::temp_dir().join("tranxformer_test_export");
        let _ = fs::remove_dir_all(&tmp);
        fs::create_dir_all(&tmp).unwrap();

        let template = test_template("exp");
        let export_path = tmp.join("exported.json");
        export_template(&template, &export_path).unwrap();

        let imported = import_template(&export_path).unwrap();
        assert_eq!(imported.id, "exp");
        assert_eq!(imported.name, "テスト");

        let _ = fs::remove_dir_all(&tmp);
    }
}
