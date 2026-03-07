#![deny(clippy::all)]
#![warn(clippy::pedantic)]

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
        .invoke_handler(tauri::generate_handler![commands::greet::greet,])
        .run(tauri::generate_context!())
        .expect("error while running Tranxformer");
}
