#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {name}! Welcome to Tranxformer.")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn greet_returns_message() {
        let result = greet("World");
        assert_eq!(result, "Hello, World! Welcome to Tranxformer.");
    }
}
