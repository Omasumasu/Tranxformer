#![deny(clippy::all)]
#![warn(clippy::pedantic)]
#![allow(clippy::missing_errors_doc)]
#![allow(clippy::missing_panics_doc)]
#![allow(clippy::must_use_candidate)]

pub mod commands;
pub mod core;
pub mod error;
pub mod infra;
pub mod models;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            // デモ
            commands::greet::greet,
            // テンプレート
            commands::template::list_templates,
            commands::template::get_template,
            commands::template::save_template,
            commands::template::delete_template,
            commands::template::export_template,
            commands::template::import_template,
            // データI/O
            commands::data_io::read_file_preview,
            commands::data_io::export_result,
            // LLM
            commands::llm::load_model,
            commands::llm::get_model_status,
            commands::llm::generate_transform_code,
            // 変換
            commands::transform::check_code_safety,
            commands::transform::execute_transform,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tranxformer");
}
