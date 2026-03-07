use regex::Regex;

use crate::models::SafetyReport;

/// ブロック対象パターン
const BLOCKED_PATTERNS: &[(&str, &str)] = &[
    (r"\beval\s*\(", "eval() による動的コード実行"),
    (
        r"\bnew\s+Function\s*\(",
        "new Function() による動的コード実行",
    ),
    (r"\bfetch\s*\(", "fetch() によるネットワークアクセス"),
    (
        r"\bXMLHttpRequest\b",
        "XMLHttpRequest によるネットワークアクセス",
    ),
    (r"\bWebSocket\b", "WebSocket によるネットワークアクセス"),
    (r"\brequire\s*\(", "require() によるモジュール読み込み"),
    (r"\bimport\s+", "import によるモジュール読み込み"),
    (r"\bimport\s*\(", "動的 import() によるモジュール読み込み"),
    (r"\bprocess\.", "process API へのアクセス"),
    (r"\bDeno\.", "Deno ランタイム API へのアクセス"),
    (r"\bBun\.", "Bun ランタイム API へのアクセス"),
    (r"__proto__", "__proto__ によるプロトタイプ汚染"),
    (
        r"constructor\s*\.\s*constructor",
        "constructor.constructor によるプロトタイプ汚染",
    ),
    (
        r"\bwhile\s*\(\s*true\s*\)",
        "while(true) による無限ループの可能性",
    ),
    (
        r"\bfor\s*\(\s*;\s*;\s*\)",
        "for(;;) による無限ループの可能性",
    ),
];

/// JavaScriptコードの安全性チェック（純粋関数）
pub fn check_code_safety(code: &str) -> SafetyReport {
    let violations: Vec<String> = BLOCKED_PATTERNS
        .iter()
        .filter_map(|(pattern, message)| {
            let re = Regex::new(pattern).ok()?;
            if re.is_match(code) {
                Some(message.to_string())
            } else {
                None
            }
        })
        .collect();

    SafetyReport {
        is_safe: violations.is_empty(),
        violations,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn safe_code_passes() {
        let code = r#"
            function transform(rows) {
                return rows.map(row => ({
                    name: row["名前"],
                    age: Number(row["年齢"]),
                }));
            }
        "#;
        let report = check_code_safety(code);
        assert!(report.is_safe);
        assert!(report.violations.is_empty());
    }

    #[test]
    fn detects_eval() {
        let report = check_code_safety("eval('alert(1)')");
        assert!(!report.is_safe);
        assert!(report.violations.iter().any(|v| v.contains("eval")));
    }

    #[test]
    fn detects_new_function() {
        let report = check_code_safety("new Function('return 1')()");
        assert!(!report.is_safe);
    }

    #[test]
    fn detects_fetch() {
        let report = check_code_safety("fetch('http://evil.com')");
        assert!(!report.is_safe);
    }

    #[test]
    fn detects_require() {
        let report = check_code_safety("const fs = require('fs')");
        assert!(!report.is_safe);
    }

    #[test]
    fn detects_import_statement() {
        let report = check_code_safety("import fs from 'fs'");
        assert!(!report.is_safe);
    }

    #[test]
    fn detects_dynamic_import() {
        let report = check_code_safety("import('fs')");
        assert!(!report.is_safe);
    }

    #[test]
    fn detects_proto_pollution() {
        let report = check_code_safety("obj.__proto__.polluted = true");
        assert!(!report.is_safe);
    }

    #[test]
    fn detects_constructor_chain() {
        let report = check_code_safety("''.constructor.constructor('return this')()");
        assert!(!report.is_safe);
    }

    #[test]
    fn detects_infinite_loops() {
        let report = check_code_safety("while(true) {}");
        assert!(!report.is_safe);

        let report2 = check_code_safety("for(;;) {}");
        assert!(!report2.is_safe);
    }

    #[test]
    fn detects_process_access() {
        let report = check_code_safety("process.env.SECRET");
        assert!(!report.is_safe);
    }

    #[test]
    fn multiple_violations_reported() {
        let code = "eval('x'); fetch('http://evil.com'); require('fs')";
        let report = check_code_safety(code);
        assert!(!report.is_safe);
        assert!(report.violations.len() >= 3);
    }
}
