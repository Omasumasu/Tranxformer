use crate::error::AppError;

/// JavaScript 式を使って行から結合キーを計算する。
///
/// # Arguments
///
/// * `expression` - JavaScript 式文字列（例: `"file.姓 + file.名"`）。
///   `file` オブジェクトに行のカラム値が入る。
/// * `headers` - カラム名の配列
/// * `row` - 値の配列
///
/// # Returns
///
/// 式の評価結果（文字列）
pub fn eval_join_key(
    expression: &str,
    headers: &[String],
    row: &[String],
) -> Result<String, AppError> {
    let rt = rquickjs::Runtime::new()
        .map_err(|e| AppError::Transform(format!("JS runtime error: {e}")))?;
    let ctx = rquickjs::Context::full(&rt)
        .map_err(|e| AppError::Transform(format!("JS context error: {e}")))?;

    ctx.with(|ctx| {
        let globals = ctx.globals();

        let file_obj = rquickjs::Object::new(ctx.clone())
            .map_err(|e| AppError::Transform(format!("JS object error: {e}")))?;

        for (i, header) in headers.iter().enumerate() {
            let val = row.get(i).map_or("", String::as_str);
            file_obj
                .set(header.as_str(), val)
                .map_err(|e| AppError::Transform(format!("JS set error: {e}")))?;
        }

        globals
            .set("file", file_obj)
            .map_err(|e| AppError::Transform(format!("JS global error: {e}")))?;

        let result: rquickjs::Value = ctx
            .eval(expression)
            .map_err(|e| AppError::Transform(format!("結合キー式の評価エラー: {e}")))?;

        match result.type_of() {
            rquickjs::Type::String => {
                let s: String =
                    result.get().map_err(|e| AppError::Transform(format!("{e}")))?;
                Ok(s)
            }
            rquickjs::Type::Int | rquickjs::Type::Float => {
                let n: f64 =
                    result.get().map_err(|e| AppError::Transform(format!("{e}")))?;
                Ok(n.to_string())
            }
            rquickjs::Type::Bool => {
                let b: bool =
                    result.get().map_err(|e| AppError::Transform(format!("{e}")))?;
                Ok(b.to_string())
            }
            _ => Ok(String::new()),
        }
    })
}

/// Create a closure from a JS expression for use with `left_join`.
pub fn make_js_key_fn(expression: String) -> impl Fn(&[String], &[String]) -> String {
    move |headers: &[String], row: &[String]| {
        eval_join_key(&expression, headers, row).unwrap_or_default()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_eval_simple_concat() {
        let headers = vec!["姓".to_string(), "名".to_string()];
        let row = vec!["田中".to_string(), "太郎".to_string()];
        let result = eval_join_key("file.姓 + file.名", &headers, &row).unwrap();
        assert_eq!(result, "田中太郎");
    }

    #[test]
    fn test_eval_single_column() {
        let headers = vec!["id".to_string(), "name".to_string()];
        let row = vec!["42".to_string(), "test".to_string()];
        let result = eval_join_key("file.id", &headers, &row).unwrap();
        assert_eq!(result, "42");
    }

    #[test]
    fn test_eval_numeric_expression() {
        let headers = vec!["a".to_string(), "b".to_string()];
        let row = vec!["3".to_string(), "4".to_string()];
        let result = eval_join_key("Number(file.a) + Number(file.b)", &headers, &row).unwrap();
        assert_eq!(result, "7");
    }

    #[test]
    fn test_eval_missing_column() {
        let headers = vec!["x".to_string()];
        let row = vec!["hello".to_string()];
        let result = eval_join_key("file.x", &headers, &row).unwrap();
        assert_eq!(result, "hello");
    }

    #[test]
    fn test_make_js_key_fn() {
        let key_fn = make_js_key_fn("file.a + '-' + file.b".to_string());
        let headers = vec!["a".to_string(), "b".to_string()];
        let row = vec!["foo".to_string(), "bar".to_string()];
        assert_eq!(key_fn(&headers, &row), "foo-bar");
    }
}
