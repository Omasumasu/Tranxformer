use crate::core::safety;
use crate::error::AppError;
use crate::models::SafetyReport;

#[tauri::command]
pub async fn check_code_safety(code: String) -> Result<SafetyReport, AppError> {
    Ok(safety::check_code_safety(&code))
}

#[tauri::command]
pub async fn execute_transform(code: String, input_data: String) -> Result<String, AppError> {
    let report = safety::check_code_safety(&code);
    if !report.is_safe {
        return Err(AppError::SafetyViolation(report.violations.join(", ")));
    }

    if !safety::has_transform_function(&code) {
        return Err(AppError::Validation(
            "transform(rows) 関数が定義されていません".to_string(),
        ));
    }

    let js_code = format!(
        "{code}\n\
         const __input = JSON.parse(__INPUT_DATA);\n\
         const __result = transform(__input);\n\
         JSON.stringify(__result);"
    );

    run_in_quickjs(&js_code, &input_data)
}

fn run_in_quickjs(code: &str, input_data: &str) -> Result<String, AppError> {
    let rt = rquickjs::Runtime::new().map_err(|e| AppError::Internal(e.to_string()))?;

    // 命令数リミット（10万命令ごとにチェック、30秒タイムアウト相当）
    let start = std::time::Instant::now();
    let timeout = std::time::Duration::from_secs(30);
    rt.set_interrupt_handler(Some(Box::new(move || start.elapsed() > timeout)));

    let ctx = rquickjs::Context::full(&rt).map_err(|e| AppError::Internal(e.to_string()))?;

    ctx.with(|ctx| {
        // 入力データをグローバル変数として注入
        let globals = ctx.globals();
        globals
            .set("__INPUT_DATA", input_data)
            .map_err(|e| AppError::Internal(e.to_string()))?;

        // コード実行
        let result: rquickjs::Value = ctx
            .eval(code)
            .map_err(|e| AppError::Transform(format!("JavaScript実行エラー: {e}")))?;

        // 結果を文字列として取得
        let result_str: String = result
            .as_string()
            .ok_or_else(|| {
                AppError::Transform("transform() の戻り値がJSON文字列ではありません".to_string())
            })?
            .to_string()
            .map_err(|e| AppError::Transform(e.to_string()))?;

        Ok(result_str)
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn safe_transform_executes() {
        let code = r#"
            function transform(rows) {
                return rows.map(function(r) {
                    return { name: r.first + " " + r.last };
                });
            }
        "#;
        let input = r#"[{"first":"Alice","last":"Smith"}]"#;
        let result = run_in_quickjs(
            &format!(
                "{code}\nconst __input = JSON.parse(__INPUT_DATA);\nconst __result = transform(__input);\nJSON.stringify(__result);"
            ),
            input,
        )
        .unwrap();

        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        assert_eq!(parsed[0]["name"], "Alice Smith");
    }

    #[test]
    fn unsafe_code_is_rejected() {
        let code = r#"eval("bad"); function transform(rows) { return rows; }"#;
        let input = "[]";
        let result = execute_transform_sync(code, input);
        assert!(result.is_err());
    }

    #[test]
    fn missing_transform_function_errors() {
        let code = "function foo(rows) { return rows; }";
        let input = "[]";
        let result = execute_transform_sync(code, input);
        assert!(result.is_err());
    }

    fn execute_transform_sync(code: &str, input_data: &str) -> Result<String, AppError> {
        let report = safety::check_code_safety(code);
        if !report.is_safe {
            return Err(AppError::SafetyViolation(report.violations.join(", ")));
        }
        if !safety::has_transform_function(code) {
            return Err(AppError::Validation(
                "transform(rows) 関数が定義されていません".to_string(),
            ));
        }
        let js_code = format!(
            "{code}\nconst __input = JSON.parse(__INPUT_DATA);\nconst __result = transform(__input);\nJSON.stringify(__result);"
        );
        run_in_quickjs(&js_code, input_data)
    }
}
