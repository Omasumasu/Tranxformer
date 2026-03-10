#![deny(clippy::all)]
#![warn(clippy::pedantic)]
#![allow(
    clippy::missing_errors_doc,
    clippy::missing_panics_doc,
    clippy::must_use_candidate,
    clippy::module_name_repetitions
)]

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
        .manage(commands::llm::LlmState::new())
        .invoke_handler(tauri::generate_handler![
            commands::template::list_templates,
            commands::template::get_template,
            commands::template::save_template,
            commands::template::delete_template,
            commands::template::export_template,
            commands::template::import_template,
            commands::data_io::read_file_preview,
            commands::data_io::read_file_full,
            commands::data_io::list_sheets,
            commands::data_io::read_file_preview_sheet,
            commands::data_io::export_result,
            commands::data_io::infer_schema_from_file,
            commands::transform::check_code_safety,
            commands::transform::execute_transform,
            commands::llm::load_model,
            commands::llm::get_model_status,
            commands::llm::generate_transform_code,
            commands::join::join_preview,
            commands::join::join_and_read_full,
            commands::join::list_input_templates,
            commands::join::save_input_template,
            commands::join::delete_input_template,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tranxformer");
}
