use crate::core::safety;
use crate::error::AppError;
use crate::models::{Record, SafetyReport, TransformResult};

#[tauri::command]
pub async fn check_code_safety(code: String) -> Result<SafetyReport, AppError> {
    Ok(safety::check_code_safety(&code))
}

#[tauri::command]
pub async fn execute_transform(
    code: String,
    input_data: Vec<Record>,
) -> Result<TransformResult, AppError> {
    // 実行前に安全性チェック
    let report = safety::check_code_safety(&code);
    if !report.is_safe {
        return Err(AppError::Validation(format!(
            "安全性チェック違反: {}",
            report.violations.join(", ")
        )));
    }

    let input_json = serde_json::to_string(&input_data)
        .map_err(|e| AppError::Internal(format!("入力データのシリアライズに失敗: {e}")))?;

    let result = execute_in_sandbox(&code, &input_json)?;
    let output: Vec<Record> = serde_json::from_str(&result)
        .map_err(|e| AppError::Internal(format!("変換結果のパースに失敗: {e}")))?;

    let row_count = output.len();
    Ok(TransformResult {
        code,
        output,
        row_count,
        errors: Vec::new(),
    })
}

/// `QuickJS` サンドボックスで `JavaScript` を実行
fn execute_in_sandbox(code: &str, input_json: &str) -> Result<String, AppError> {
    let rt = rquickjs::Runtime::new()
        .map_err(|e| AppError::Internal(format!("QuickJSランタイム初期化エラー: {e}")))?;

    // 30秒タイムアウト（10,000命令ごとにチェック）
    let start = std::time::Instant::now();
    let timeout = std::time::Duration::from_secs(30);
    rt.set_interrupt_handler(Some(Box::new(move || start.elapsed() > timeout)));

    let ctx = rquickjs::Context::full(&rt)
        .map_err(|e| AppError::Internal(format!("QuickJSコンテキスト初期化エラー: {e}")))?;

    ctx.with(|ctx| {
        let script = format!(
            "
{code}

var __input = JSON.parse(__inputJson);
var __result = transform(__input);
JSON.stringify(__result);
",
        );

        // 入力データをグローバル変数として設定
        let globals = ctx.globals();
        globals
            .set("__inputJson", input_json)
            .map_err(|e| AppError::Internal(format!("入力データの設定に失敗: {e}")))?;

        let result: String = ctx
            .eval(script)
            .map_err(|e| AppError::Internal(format!("JavaScript実行エラー: {e}")))?;

        Ok(result)
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn sandbox_executes_simple_transform() {
        let code = r#"
            function transform(rows) {
                return rows.map(function(row) {
                    return { upper_name: row.name.toUpperCase() };
                });
            }
        "#;
        let input = json!([{"name": "alice"}, {"name": "bob"}]);
        let input_json = serde_json::to_string(&input).unwrap();

        let result = execute_in_sandbox(code, &input_json).unwrap();
        let output: Vec<serde_json::Value> = serde_json::from_str(&result).unwrap();
        assert_eq!(output.len(), 2);
        assert_eq!(output[0]["upper_name"], "ALICE");
    }

    #[test]
    fn sandbox_rejects_invalid_js() {
        let code = "function transform(rows) { invalid syntax }}}";
        let result = execute_in_sandbox(code, "[]");
        assert!(result.is_err());
    }

    #[test]
    fn sandbox_handles_empty_input() {
        let code = "function transform(rows) { return rows; }";
        let result = execute_in_sandbox(code, "[]").unwrap();
        let output: Vec<serde_json::Value> = serde_json::from_str(&result).unwrap();
        assert!(output.is_empty());
    }
}
