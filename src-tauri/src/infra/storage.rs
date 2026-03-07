use crate::error::AppError;
use crate::models::Template;
use std::path::{Path, PathBuf};

/// テンプレート保存ディレクトリのパスを取得・作成
pub fn ensure_templates_dir(app_data_dir: &Path) -> Result<PathBuf, AppError> {
    let templates_dir = app_data_dir.join("templates");
    if !templates_dir.exists() {
        std::fs::create_dir_all(&templates_dir)?;
    }
    Ok(templates_dir)
}

/// テンプレートファイルパスを生成
fn template_path(templates_dir: &Path, id: &str) -> PathBuf {
    templates_dir.join(format!("{id}.json"))
}

/// テンプレート一覧を読み込み
pub fn list_templates(templates_dir: &Path) -> Result<Vec<Template>, AppError> {
    if !templates_dir.exists() {
        return Ok(Vec::new());
    }

    let mut templates = Vec::new();
    for entry in std::fs::read_dir(templates_dir)? {
        let entry = entry?;
        let path = entry.path();
        if path.extension().is_some_and(|ext| ext == "json") {
            let content = std::fs::read_to_string(&path)?;
            let template: Template = serde_json::from_str(&content)?;
            templates.push(template);
        }
    }

    templates.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(templates)
}

/// テンプレートを1件取得
pub fn get_template(templates_dir: &Path, id: &str) -> Result<Template, AppError> {
    let path = template_path(templates_dir, id);
    if !path.exists() {
        return Err(AppError::TemplateNotFound(id.to_string()));
    }
    let content = std::fs::read_to_string(&path)?;
    let template: Template = serde_json::from_str(&content)?;
    Ok(template)
}

/// テンプレートを保存（新規・更新共通）
pub fn save_template(templates_dir: &Path, template: &Template) -> Result<(), AppError> {
    let path = template_path(templates_dir, &template.id);
    let content = serde_json::to_string_pretty(template)?;
    std::fs::write(&path, content)?;
    Ok(())
}

/// テンプレートを削除
pub fn delete_template(templates_dir: &Path, id: &str) -> Result<(), AppError> {
    let path = template_path(templates_dir, id);
    if !path.exists() {
        return Err(AppError::TemplateNotFound(id.to_string()));
    }
    std::fs::remove_file(&path)?;
    Ok(())
}

/// テンプレートを指定パスにエクスポート
pub fn export_template_to_file(template: &Template, path: &Path) -> Result<(), AppError> {
    let content = serde_json::to_string_pretty(template)?;
    std::fs::write(path, content)?;
    Ok(())
}

/// 指定パスからテンプレートをインポート
pub fn import_template_from_file(path: &Path) -> Result<Template, AppError> {
    let content = std::fs::read_to_string(path)?;
    let template: Template = serde_json::from_str(&content)?;
    Ok(template)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{ColumnDef, ColumnType};

    fn make_template(id: &str, name: &str) -> Template {
        Template {
            id: id.to_string(),
            name: name.to_string(),
            description: "test".to_string(),
            columns: vec![ColumnDef {
                name: "col1".to_string(),
                label: "Column 1".to_string(),
                data_type: ColumnType::Text,
                description: "test column".to_string(),
            }],
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: "2024-01-01T00:00:00Z".to_string(),
        }
    }

    #[test]
    fn crud_operations() {
        let dir = std::env::temp_dir().join(format!("tranxformer_test_{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();
        let templates_dir = ensure_templates_dir(&dir).unwrap();

        // List empty
        let list = list_templates(&templates_dir).unwrap();
        assert!(list.is_empty());

        // Save
        let tmpl = make_template("t1", "Test Template");
        save_template(&templates_dir, &tmpl).unwrap();

        // Get
        let loaded = get_template(&templates_dir, "t1").unwrap();
        assert_eq!(loaded.name, "Test Template");

        // List
        let list = list_templates(&templates_dir).unwrap();
        assert_eq!(list.len(), 1);

        // Delete
        delete_template(&templates_dir, "t1").unwrap();
        let list = list_templates(&templates_dir).unwrap();
        assert!(list.is_empty());

        // Cleanup
        std::fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn get_nonexistent_returns_error() {
        let dir = std::env::temp_dir().join(format!("tranxformer_test_{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();

        let result = get_template(&dir, "nonexistent");
        assert!(result.is_err());

        std::fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn export_import_roundtrip() {
        let dir = std::env::temp_dir().join(format!("tranxformer_test_{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();

        let tmpl = make_template("export1", "Export Test");
        let export_path = dir.join("exported.json");

        export_template_to_file(&tmpl, &export_path).unwrap();
        let imported = import_template_from_file(&export_path).unwrap();

        assert_eq!(imported.id, "export1");
        assert_eq!(imported.name, "Export Test");

        std::fs::remove_dir_all(&dir).unwrap();
    }
}
