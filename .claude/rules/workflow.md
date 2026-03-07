# 開発ワークフロールール

## コンテキスト管理

- 調査・検索は Agent (subagent) に委譲してメインコンテキストを節約する
- `/compact` を50%あたりで手動実行
- タスク切り替え時は `/clear` を使う

## コード変更時の検証

- 変更後は必ず関連テストを実行して確認する
- Rust: `cd src-tauri && cargo test`
- TypeScript: `npx vitest run`
- 全体: `/test-all` スキルを使用

## コミット前チェック

- `npx biome check .` — lint/format
- `npx knip` — 未使用コード検出
- `cd src-tauri && cargo clippy -- -D warnings` — Rust lint
- または `/test-all` で一括実行

## ファイル作成のルール

- 既存ファイルの編集を優先。新規作成は必要最小限
- `src/components/ui/` (shadcn/ui) は変更しない
- テストは対応するソースと同居: `src/__tests__/` or `#[cfg(test)] mod tests`
