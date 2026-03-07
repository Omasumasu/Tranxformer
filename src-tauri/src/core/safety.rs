use crate::models::SafetyReport;
use regex::Regex;
use std::sync::LazyLock;

/// 危険なJSパターンの定義
struct DangerousPattern {
    regex: Regex,
    description: &'static str,
}

static DANGEROUS_PATTERNS: LazyLock<Vec<DangerousPattern>> = LazyLock::new(|| {
    vec![
        DangerousPattern {
            regex: Regex::new(r"\beval\s*\(").unwrap(),
            description: "eval() による動的コード実行",
        },
        DangerousPattern {
            regex: Regex::new(r"\bnew\s+Function\s*\(").unwrap(),
            description: "new Function() による動的コード実行",
        },
        DangerousPattern {
            regex: Regex::new(r"\bfetch\s*\(").unwrap(),
            description: "fetch() によるネットワークアクセス",
        },
        DangerousPattern {
            regex: Regex::new(r"\bXMLHttpRequest\b").unwrap(),
            description: "XMLHttpRequest によるネットワークアクセス",
        },
        DangerousPattern {
            regex: Regex::new(r"\bWebSocket\b").unwrap(),
            description: "WebSocket によるネットワークアクセス",
        },
        DangerousPattern {
            regex: Regex::new(r"\brequire\s*\(").unwrap(),
            description: "require() によるモジュール読み込み",
        },
        DangerousPattern {
            regex: Regex::new(r"\bimport\s").unwrap(),
            description: "import によるモジュール読み込み",
        },
        DangerousPattern {
            regex: Regex::new(r"\bprocess\s*\.").unwrap(),
            description: "process オブジェクトへのアクセス",
        },
        DangerousPattern {
            regex: Regex::new(r"\bDeno\s*\.").unwrap(),
            description: "Deno ランタイムAPIへのアクセス",
        },
        DangerousPattern {
            regex: Regex::new(r"\bBun\s*\.").unwrap(),
            description: "Bun ランタイムAPIへのアクセス",
        },
        DangerousPattern {
            regex: Regex::new(r"__proto__").unwrap(),
            description: "__proto__ によるプロトタイプ汚染",
        },
        DangerousPattern {
            regex: Regex::new(r"constructor\s*\.\s*constructor").unwrap(),
            description: "constructor.constructor によるプロトタイプ汚染",
        },
        DangerousPattern {
            regex: Regex::new(r"\bwhile\s*\(\s*true\s*\)").unwrap(),
            description: "while(true) による無限ループの可能性",
        },
        DangerousPattern {
            regex: Regex::new(r"\bfor\s*\(\s*;\s*;\s*\)").unwrap(),
            description: "for(;;) による無限ループの可能性",
        },
    ]
});

/// `JavaScript`コードの安全性をチェックする純粋関数
pub fn check_code_safety(code: &str) -> SafetyReport {
    let violations: Vec<String> = DANGEROUS_PATTERNS
        .iter()
        .filter(|p| p.regex.is_match(code))
        .map(|p| p.description.to_string())
        .collect();

    SafetyReport {
        is_safe: violations.is_empty(),
        violations,
    }
}

/// transform関数が定義されているかチェック
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
                    name: row.first_name + " " + row.last_name,
                    age: Number(row.age)
                }));
            }
        "#;
        let report = check_code_safety(code);
        assert!(report.is_safe);
        assert!(report.violations.is_empty());
    }

    #[test]
    fn eval_is_blocked() {
        let code = r#"function transform(rows) { return eval("rows"); }"#;
        let report = check_code_safety(code);
        assert!(!report.is_safe);
        assert!(report.violations.iter().any(|v| v.contains("eval")));
    }

    #[test]
    fn fetch_is_blocked() {
        let code = r#"function transform(rows) { fetch("http://evil.com"); return rows; }"#;
        let report = check_code_safety(code);
        assert!(!report.is_safe);
        assert!(report.violations.iter().any(|v| v.contains("fetch")));
    }

    #[test]
    fn require_is_blocked() {
        let code = r#"const fs = require("fs"); function transform(rows) { return rows; }"#;
        let report = check_code_safety(code);
        assert!(!report.is_safe);
        assert!(report.violations.iter().any(|v| v.contains("require")));
    }

    #[test]
    fn import_is_blocked() {
        let code = r#"import fs from "fs"; function transform(rows) { return rows; }"#;
        let report = check_code_safety(code);
        assert!(!report.is_safe);
    }

    #[test]
    fn proto_pollution_is_blocked() {
        let code = r#"function transform(rows) { rows.__proto__.x = 1; return rows; }"#;
        let report = check_code_safety(code);
        assert!(!report.is_safe);
        assert!(report.violations.iter().any(|v| v.contains("__proto__")));
    }

    #[test]
    fn infinite_loop_while_true_is_blocked() {
        let code = r#"function transform(rows) { while(true) {} return rows; }"#;
        let report = check_code_safety(code);
        assert!(!report.is_safe);
    }

    #[test]
    fn infinite_loop_for_is_blocked() {
        let code = r#"function transform(rows) { for(;;) {} return rows; }"#;
        let report = check_code_safety(code);
        assert!(!report.is_safe);
    }

    #[test]
    fn process_access_is_blocked() {
        let code = r#"function transform(rows) { process.exit(1); return rows; }"#;
        let report = check_code_safety(code);
        assert!(!report.is_safe);
    }

    #[test]
    fn has_transform_detects_function() {
        assert!(has_transform_function(
            "function transform(rows) { return rows; }"
        ));
        assert!(!has_transform_function(
            "function foo(rows) { return rows; }"
        ));
    }

    #[test]
    fn multiple_violations_reported() {
        let code = r#"
            function transform(rows) {
                eval("bad");
                fetch("http://evil.com");
                return rows;
            }
        "#;
        let report = check_code_safety(code);
        assert!(!report.is_safe);
        assert!(report.violations.len() >= 2);
    }
}
