use crate::core::prompt::build_transform_prompt;
use crate::error::AppError;
use crate::infra::llm_engine::LlmEngine;
use crate::models::Template;
use serde::Serialize;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};

/// LLMエンジンの共有状態
pub struct LlmState {
    engine: Mutex<Option<LlmEngine>>,
}

impl Default for LlmState {
    fn default() -> Self {
        Self {
            engine: Mutex::new(None),
        }
    }
}

impl LlmState {
    pub fn new() -> Self {
        Self::default()
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct ModelStatus {
    pub loaded: bool,
    pub model_path: Option<String>,
}

/// GGUFモデルファイルをロードする
#[tauri::command]
pub async fn load_model(model_path: String, state: State<'_, LlmState>) -> Result<(), AppError> {
    let engine = tokio::task::spawn_blocking(move || LlmEngine::load(&model_path))
        .await
        .map_err(|e| AppError::Llm(format!("タスク実行失敗: {e}")))??;

    let mut guard = state
        .engine
        .lock()
        .map_err(|e| AppError::Llm(format!("ロック取得失敗: {e}")))?;
    *guard = Some(engine);
    Ok(())
}

/// モデルの読み込み状態を返す
#[tauri::command]
#[allow(clippy::needless_pass_by_value)]
pub fn get_model_status(state: State<'_, LlmState>) -> Result<ModelStatus, AppError> {
    let guard = state
        .engine
        .lock()
        .map_err(|e| AppError::Llm(format!("ロック取得失敗: {e}")))?;

    Ok(match guard.as_ref() {
        Some(engine) => ModelStatus {
            loaded: true,
            model_path: Some(engine.model_path().to_string()),
        },
        None => ModelStatus {
            loaded: false,
            model_path: None,
        },
    })
}

/// コード生成の進捗イベントペイロード
#[derive(Debug, Clone, Serialize)]
struct GenerateProgress {
    tokens_generated: u32,
    max_tokens: u32,
}

/// 入力データとテンプレートから変換コードを生成する
#[tauri::command]
pub async fn generate_transform_code(
    input_headers: Vec<String>,
    input_sample: Vec<Vec<String>>,
    template: Template,
    state: State<'_, LlmState>,
    app: AppHandle,
) -> Result<String, AppError> {
    let prompt = build_transform_prompt(&input_sample, &input_headers, &template);

    let guard = state
        .engine
        .lock()
        .map_err(|e| AppError::Llm(format!("ロック取得失敗: {e}")))?;

    let engine = guard
        .as_ref()
        .ok_or_else(|| AppError::Llm("モデルが読み込まれていません".to_string()))?;

    let max_tokens: u32 = 1024;
    let raw_output = engine.generate_with_callback(&prompt, max_tokens, |count, _| {
        let _ = app.emit(
            "llm-progress",
            GenerateProgress {
                tokens_generated: count,
                max_tokens,
            },
        );
    })?;
    let code = extract_code_block(&raw_output);
    Ok(code)
}

/// LLM出力からコードブロックを抽出する純粋関数
fn extract_code_block(output: &str) -> String {
    if let Some(start) = output.find("```") {
        let after_backticks = &output[start + 3..];
        let code_start = after_backticks.find('\n').map_or(0, |i| i + 1);
        let code_body = &after_backticks[code_start..];

        if let Some(end) = code_body.find("```") {
            return code_body[..end].trim().to_string();
        }
        return code_body.trim().to_string();
    }

    output.trim().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extract_code_from_markdown_block() {
        let output = "Here is the code:\n```javascript\nfunction transform(rows) {\n  return rows;\n}\n```\nDone.";
        let code = extract_code_block(output);
        assert_eq!(code, "function transform(rows) {\n  return rows;\n}");
    }

    #[test]
    fn extract_code_from_js_block() {
        let output = "```js\nconst x = 1;\n```";
        let code = extract_code_block(output);
        assert_eq!(code, "const x = 1;");
    }

    #[test]
    fn extract_code_without_block() {
        let output = "function transform(rows) { return rows; }";
        let code = extract_code_block(output);
        assert_eq!(code, "function transform(rows) { return rows; }");
    }

    #[test]
    fn extract_code_with_unclosed_block() {
        let output = "```javascript\nfunction transform(rows) {\n  return rows;\n}";
        let code = extract_code_block(output);
        assert_eq!(code, "function transform(rows) {\n  return rows;\n}");
    }
}
