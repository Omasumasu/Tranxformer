use crate::models::SafetyReport;
use regex::Regex;
use std::sync::LazyLock;

struct BlockedPattern {
    regex: Regex,
    description: &'static str,
}

static BLOCKED_PATTERNS: LazyLock<Vec<BlockedPattern>> = LazyLock::new(|| {
    vec![
        BlockedPattern {
            regex: Regex::new(r"\beval\s*\(").unwrap(),
            description: "eval() — 動的コード実行",
        },
        BlockedPattern {
            regex: Regex::new(r"\bnew\s+Function\s*\(").unwrap(),
            description: "new Function() — 動的コード実行",
        },
        BlockedPattern {
            regex: Regex::new(r"\bfetch\s*\(").unwrap(),
            description: "fetch() — ネットワークアクセス",
        },
        BlockedPattern {
            regex: Regex::new(r"\bXMLHttpRequest\b").unwrap(),
            description: "XMLHttpRequest — ネットワークアクセス",
        },
        BlockedPattern {
            regex: Regex::new(r"\bWebSocket\b").unwrap(),
            description: "WebSocket — ネットワークアクセス",
        },
        BlockedPattern {
            regex: Regex::new(r"\brequire\s*\(").unwrap(),
            description: "require() — モジュール読み込み",
        },
        BlockedPattern {
            regex: Regex::new(r"\bimport\s+").unwrap(),
            description: "import — モジュール読み込み",
        },
        BlockedPattern {
            regex: Regex::new(r"\bprocess\.").unwrap(),
            description: "process.* — ランタイムAPI",
        },
        BlockedPattern {
            regex: Regex::new(r"\bDeno\.").unwrap(),
            description: "Deno.* — ランタイムAPI",
        },
        BlockedPattern {
            regex: Regex::new(r"\bBun\.").unwrap(),
            description: "Bun.* — ランタイムAPI",
        },
        BlockedPattern {
            regex: Regex::new(r"__proto__").unwrap(),
            description: "__proto__ — プロトタイプ汚染",
        },
        BlockedPattern {
            regex: Regex::new(r"constructor\s*\.\s*constructor").unwrap(),
            description: "constructor.constructor — プロトタイプ汚染",
        },
        BlockedPattern {
            regex: Regex::new(r"\bwhile\s*\(\s*true\s*\)").unwrap(),
            description: "while(true) — 無限ループ",
        },
        BlockedPattern {
            regex: Regex::new(r"\bfor\s*\(\s*;\s*;\s*\)").unwrap(),
            description: "for(;;) — 無限ループ",
        },
    ]
});

/// `JavaScriptコードの安全性を静的チェック`
pub fn check_code_safety(code: &str) -> SafetyReport {
    let violations: Vec<String> = BLOCKED_PATTERNS
        .iter()
        .filter(|p| p.regex.is_match(code))
        .map(|p| p.description.to_string())
        .collect();

    SafetyReport {
        is_safe: violations.is_empty(),
        violations,
    }
}

/// transform関数が定義されているか確認
#[must_use]
pub fn has_transform_function(code: &str) -> bool {
    let re = Regex::new(r"function\s+transform\s*\(").unwrap();
    re.is_match(code)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn safe_code_passes() {
        let code = r#"
            function transform(rows) {
                return rows.map(row => ({
                    name: row.first + " " + row.last,
                    age: Number(row.age),
                }));
            }
        "#;
        let report = check_code_safety(code);
        assert!(report.is_safe);
        assert!(report.violations.is_empty());
    }

    #[test]
    fn eval_is_blocked() {
        let code = r#"eval("alert(1)")"#;
        let report = check_code_safety(code);
        assert!(!report.is_safe);
        assert!(report.violations.iter().any(|v| v.contains("eval")));
    }

    #[test]
    fn fetch_is_blocked() {
        let code = r#"fetch("https://example.com")"#;
        let report = check_code_safety(code);
        assert!(!report.is_safe);
        assert!(report.violations.iter().any(|v| v.contains("fetch")));
    }

    #[test]
    fn require_is_blocked() {
        let code = r#"const fs = require("fs")"#;
        let report = check_code_safety(code);
        assert!(!report.is_safe);
    }

    #[test]
    fn proto_pollution_is_blocked() {
        let code = r#"obj.__proto__.polluted = true"#;
        let report = check_code_safety(code);
        assert!(!report.is_safe);
    }

    #[test]
    fn infinite_loop_is_blocked() {
        let code = "while(true) { }";
        let report = check_code_safety(code);
        assert!(!report.is_safe);
    }

    #[test]
    fn multiple_violations_reported() {
        let code = r#"eval("x"); fetch("/api"); process.exit(1);"#;
        let report = check_code_safety(code);
        assert!(!report.is_safe);
        assert!(report.violations.len() >= 3);
    }

    #[test]
    fn has_transform_function_detects_correctly() {
        assert!(has_transform_function("function transform(rows) { }"));
        assert!(!has_transform_function("function other(rows) { }"));
    }
}
