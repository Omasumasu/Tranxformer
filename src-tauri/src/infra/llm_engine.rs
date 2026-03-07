use crate::error::AppError;
use llama_cpp_2::context::params::LlamaContextParams;
use llama_cpp_2::llama_backend::LlamaBackend;
use llama_cpp_2::llama_batch::LlamaBatch;
use llama_cpp_2::model::params::LlamaModelParams;
use llama_cpp_2::model::LlamaModel;
use llama_cpp_2::sampling::LlamaSampler;
use std::path::Path;

/// LLMエンジン: llama.cppのモデルを管理し、推論を実行する
pub struct LlmEngine {
    backend: LlamaBackend,
    model: LlamaModel,
    model_path: String,
}

impl LlmEngine {
    /// GGUFモデルファイルを読み込んでエンジンを初期化する
    pub fn load(model_path: &str) -> Result<Self, AppError> {
        let path = Path::new(model_path);
        if !path.exists() {
            return Err(AppError::Llm(format!(
                "モデルファイルが見つかりません: {model_path}"
            )));
        }

        let backend = LlamaBackend::init()
            .map_err(|e| AppError::Llm(format!("バックエンド初期化失敗: {e}")))?;

        let model_params = LlamaModelParams::default();
        let model = LlamaModel::load_from_file(&backend, path, &model_params)
            .map_err(|e| AppError::Llm(format!("モデル読み込み失敗: {e}")))?;

        log::info!("LLMモデルをロードしました: {model_path}");

        Ok(Self {
            backend,
            model,
            model_path: model_path.to_string(),
        })
    }

    /// モデルファイルパスを返す
    pub fn model_path(&self) -> &str {
        &self.model_path
    }

    /// プロンプトを送信してテキスト生成を行う
    pub fn generate(&self, prompt: &str, max_tokens: u32) -> Result<String, AppError> {
        self.generate_with_callback(prompt, max_tokens, |_, _| {})
    }

    /// プロンプトを送信してテキスト生成を行い、トークンごとにコールバックを呼ぶ
    pub fn generate_with_callback<F>(
        &self,
        prompt: &str,
        max_tokens: u32,
        on_token: F,
    ) -> Result<String, AppError>
    where
        F: Fn(u32, &str),
    {
        let ctx_params = LlamaContextParams::default().with_n_ctx(std::num::NonZero::new(2048));

        let mut ctx = self
            .model
            .new_context(&self.backend, ctx_params)
            .map_err(|e| AppError::Llm(format!("コンテキスト作成失敗: {e}")))?;

        let tokens = self
            .model
            .str_to_token(prompt, llama_cpp_2::model::AddBos::Always)
            .map_err(|e| AppError::Llm(format!("トークン化失敗: {e}")))?;

        if tokens.is_empty() {
            return Err(AppError::Llm("プロンプトが空です".to_string()));
        }

        let mut batch = LlamaBatch::new(2048, 1);

        let last_idx = tokens.len() - 1;
        for (i, &token) in tokens.iter().enumerate() {
            let is_last = i == last_idx;
            let pos = i32::try_from(i)
                .map_err(|_| AppError::Llm("トークン位置がi32の範囲外です".to_string()))?;
            batch
                .add(token, pos, &[0], is_last)
                .map_err(|e| AppError::Llm(format!("バッチ追加失敗: {e}")))?;
        }

        ctx.decode(&mut batch)
            .map_err(|e| AppError::Llm(format!("デコード失敗: {e}")))?;

        let mut sampler = LlamaSampler::chain_simple([
            LlamaSampler::temp(0.2),
            LlamaSampler::top_p(0.9, 1),
            LlamaSampler::dist(42),
        ]);

        let mut output = String::new();
        let mut n_cur = i32::try_from(tokens.len())
            .map_err(|_| AppError::Llm("トークン数がi32の範囲外です".to_string()))?;
        let mut decoder = encoding_rs::UTF_8.new_decoder();
        let mut token_count: u32 = 0;

        for _ in 0..max_tokens {
            let token = sampler.sample(&ctx, batch.n_tokens() - 1);

            if self.model.is_eog_token(token) {
                break;
            }

            let piece = self
                .model
                .token_to_piece(token, &mut decoder, true, None)
                .map_err(|e| AppError::Llm(format!("トークン→文字列変換失敗: {e}")))?;
            output.push_str(&piece);
            token_count += 1;

            on_token(token_count, &output);

            batch.clear();
            batch
                .add(token, n_cur, &[0], true)
                .map_err(|e| AppError::Llm(format!("バッチ追加失敗: {e}")))?;
            n_cur += 1;

            ctx.decode(&mut batch)
                .map_err(|e| AppError::Llm(format!("デコード失敗: {e}")))?;
        }

        Ok(output)
    }
}
