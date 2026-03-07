use std::fs;
use std::path::{Path, PathBuf};

use crate::error::AppError;
use crate::models::Template;

/// テンプレート保存ディレクトリのパスを取得
#[must_use]
pub fn templates_dir(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join("templates")
}

/// テンプレート保存ディレクトリを初期化（なければ作成）
pub fn ensure_templates_dir(app_data_dir: &Path) -> Result<PathBuf, AppError> {
    let dir = templates_dir(app_data_dir);
    if !dir.exists() {
        fs::create_dir_all(&dir)?;
    }
    Ok(dir)
}

/// テンプレート一覧を読み込み
pub fn load_all_templates(app_data_dir: &Path) -> Result<Vec<Template>, AppError> {
    let dir = ensure_templates_dir(app_data_dir)?;
    let mut templates = Vec::new();

    for entry in fs::read_dir(&dir)? {
        let entry = entry?;
        let path = entry.path();
        if path.extension().is_some_and(|ext| ext == "json") {
            let content = fs::read_to_string(&path)?;
            let template: Template = serde_json::from_str(&content)?;
            templates.push(template);
        }
    }

    templates.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(templates)
}

/// テンプレートをIDで読み込み
pub fn load_template(app_data_dir: &Path, id: &str) -> Result<Template, AppError> {
    let path = template_path(app_data_dir, id);
    if !path.exists() {
        return Err(AppError::TemplateNotFound(id.to_string()));
    }
    let content = fs::read_to_string(&path)?;
    let template: Template = serde_json::from_str(&content)?;
    Ok(template)
}

/// テンプレートを保存
pub fn save_template(app_data_dir: &Path, template: &Template) -> Result<(), AppError> {
    let dir = ensure_templates_dir(app_data_dir)?;
    let path = dir.join(format!("{}.json", template.id));
    let content = serde_json::to_string_pretty(template)?;
    fs::write(&path, content)?;
    Ok(())
}

/// テンプレートを削除
pub fn delete_template(app_data_dir: &Path, id: &str) -> Result<(), AppError> {
    let path = template_path(app_data_dir, id);
    if !path.exists() {
        return Err(AppError::TemplateNotFound(id.to_string()));
    }
    fs::remove_file(&path)?;
    Ok(())
}

/// 外部パスからテンプレートをインポート
pub fn import_template_from_file(file_path: &Path) -> Result<Template, AppError> {
    let content = fs::read_to_string(file_path)?;
    let template: Template = serde_json::from_str(&content)?;
    Ok(template)
}

/// テンプレートを外部パスへエクスポート
pub fn export_template_to_file(template: &Template, file_path: &Path) -> Result<(), AppError> {
    let content = serde_json::to_string_pretty(template)?;
    fs::write(file_path, content)?;
    Ok(())
}

fn template_path(app_data_dir: &Path, id: &str) -> PathBuf {
    templates_dir(app_data_dir).join(format!("{id}.json"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{ColumnDef, ColumnType};
    use tempfile::TempDir;

    fn make_template(id: &str, name: &str) -> Template {
        Template {
            id: id.to_string(),
            name: name.to_string(),
            description: String::new(),
            columns: vec![ColumnDef {
                name: "col1".to_string(),
                label: "カラム1".to_string(),
                data_type: ColumnType::Text,
                description: String::new(),
            }],
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: "2024-01-01T00:00:00Z".to_string(),
        }
    }

    #[test]
    fn save_and_load_template() {
        let tmp = TempDir::new().unwrap();
        let t = make_template("t1", "テスト");
        save_template(tmp.path(), &t).unwrap();
        let loaded = load_template(tmp.path(), "t1").unwrap();
        assert_eq!(loaded.name, "テスト");
    }

    #[test]
    fn list_templates() {
        let tmp = TempDir::new().unwrap();
        save_template(tmp.path(), &make_template("a", "A")).unwrap();
        save_template(tmp.path(), &make_template("b", "B")).unwrap();
        let all = load_all_templates(tmp.path()).unwrap();
        assert_eq!(all.len(), 2);
    }

    #[test]
    fn delete_removes_file() {
        let tmp = TempDir::new().unwrap();
        save_template(tmp.path(), &make_template("d", "D")).unwrap();
        delete_template(tmp.path(), "d").unwrap();
        assert!(load_template(tmp.path(), "d").is_err());
    }

    #[test]
    fn load_nonexistent_returns_error() {
        let tmp = TempDir::new().unwrap();
        assert!(load_template(tmp.path(), "nope").is_err());
    }

    #[test]
    fn export_and_import() {
        let tmp = TempDir::new().unwrap();
        let t = make_template("ex", "エクスポート");
        let path = tmp.path().join("export.json");
        export_template_to_file(&t, &path).unwrap();
        let imported = import_template_from_file(&path).unwrap();
        assert_eq!(imported.name, "エクスポート");
    }
}
