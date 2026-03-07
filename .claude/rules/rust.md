# Rust コーディングルール

## Functional Core (`src-tauri/src/core/`)

- `pub fn` は `&self` を取らず、引数と戻り値のみで完結する純粋関数
- 以下は禁止: `std::fs`, `std::net`, `std::io`, `tokio::`, `Mutex`, `RwLock`, `println!`, `eprintln!`
- ログは `log::` クレートを使用
- `Result<T, E>` で返す。パニックしない

## Imperative Shell (`commands/`, `infra/`)

- `commands/` は薄いシェル。ロジック20行以内。`core/` に委譲
- `infra/` にすべての I/O を閉じ込める
- `AppState` からの依存取得のみ行い、ビジネスロジックは書かない

## エラー処理

- `thiserror` で専用エラー型を定義
- `?` 演算子と early return でフラットに
- `unwrap()` 禁止（`#[cfg(test)]` 内のみ許可）
- Tauri コマンド境界でのみエラーをシリアライズ

## Clippy

- `#![deny(clippy::all)]` + `#![warn(clippy::pedantic)]`
- ネスト2段以上 → 関数分割または early return で解消
