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
    let report = safety::check_code_safety(&code);
    if !report.is_safe {
        return Err(AppError::UnsafeCode(report.violations.join("; ")));
    }

    if !safety::has_transform_function(&code) {
        return Err(AppError::Validation(
            "transform(rows) 関数が定義されていません".to_string(),
        ));
    }

    let input_json =
        serde_json::to_string(&input_data).map_err(|e| AppError::Sandbox(e.to_string()))?;

    let full_code = format!(
        r"{code}

var __input = JSON.parse(__input_json);
var __result = transform(__input);
JSON.stringify(__result);
"
    );

    let output_json = run_in_quickjs(&full_code, &input_json)?;

    let output: Vec<Record> =
        serde_json::from_str(&output_json).map_err(|e| AppError::Sandbox(e.to_string()))?;

    let row_count = output.len();
    Ok(TransformResult {
        code,
        output,
        row_count,
        errors: Vec::new(),
    })
}

fn run_in_quickjs(code: &str, input_json: &str) -> Result<String, AppError> {
    let rt = rquickjs::Runtime::new().map_err(|e| AppError::Sandbox(e.to_string()))?;

    // 命令数制限: 10,000命令ごとにチェック、最大1億命令
    let max_instructions = std::sync::atomic::AtomicU64::new(0);
    rt.set_interrupt_handler(Some(Box::new(move || {
        let count = max_instructions.fetch_add(10_000, std::sync::atomic::Ordering::Relaxed);
        count > 100_000_000
    })));

    // メモリ制限: 64MB
    rt.set_memory_limit(64 * 1024 * 1024);

    let ctx = rquickjs::Context::full(&rt).map_err(|e| AppError::Sandbox(e.to_string()))?;

    ctx.with(|ctx| {
        // 入力データをグローバル変数として注入
        let globals = ctx.globals();
        globals
            .set("__input_json", input_json)
            .map_err(|e| AppError::Sandbox(e.to_string()))?;

        // コード実行
        let result: rquickjs::Value = ctx
            .eval(code)
            .map_err(|e| AppError::Sandbox(format!("JavaScript実行エラー: {e}")))?;

        // 結果をJSON文字列として取得
        result
            .as_string()
            .map(rquickjs::String::to_string)
            .ok_or_else(|| AppError::Sandbox("変換結果がJSON文字列ではありません".to_string()))?
            .map_err(|e| AppError::Sandbox(e.to_string()))
    })
}
