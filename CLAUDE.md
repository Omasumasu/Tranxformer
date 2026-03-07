# Tranxformer - Claude Code ガイド

## プロジェクト概要

ローカルLLMを使ってあらゆるデータを構造化データに変換するデスクトップアプリ（Tauri v2 + React + llama.cpp）。

## 技術スタック

- **デスクトップ**: Tauri v2
- **フロントエンド**: React 19 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Linter/Formatter**: Biome
- **テスト**: Vitest (ユニット) + Playwright (E2E) + cargo test (Rust)
- **バックエンド**: Rust (llama-cpp-2, rquickjs, calamine, rust_xlsxwriter)

## アーキテクチャ

**Functional Core / Imperative Shell** パターンを採用。

- `src-tauri/src/core/` — 純粋関数のみ。I/Oなし。テスト容易
- `src-tauri/src/infra/` — 外部I/O（ファイル、LLMエンジン）
- `src-tauri/src/commands/` — Tauriコマンド（IPC境界、薄いシェル）
- `src/lib/` — フロントエンド側の純粋関数
- `src/hooks/` — Tauri IPC呼び出し等の副作用フック
- `src/components/` — UIコンポーネント（表示に徹する）

## コマンド

```bash
# 開発
npm run dev            # Vite dev server
npm run tauri dev      # Tauri開発モード（フロント + Rust）

# ビルド
npm run build          # フロントエンドビルド
npm run tauri build    # 本番ビルド

# Lint / Format
npx biome check .      # Lint + Format チェック
npx biome check --write . # 自動修正

# テスト
npx vitest             # フロントエンドユニットテスト
npx vitest run         # CI用（watchなし）
cd src-tauri && cargo test  # Rustユニットテスト
npx playwright test    # E2Eテスト

# Rust
cd src-tauri && cargo clippy  # Rust lint
cd src-tauri && cargo fmt     # Rust format
```

## コードスタイル規約

### 必須ルール

1. **副作用を分離する**: ビジネスロジックは純粋関数。I/Oは `infra/` と `commands/` に閉じ込める
2. **ネストを浅く保つ**: 2段以上のネストは関数分割またはearly returnで解消
3. **無意味なtry-catch禁止**: エラーは型で表現し、適切な境界でのみハンドリング
4. **明示的なデータフロー**: グローバル状態を避け、依存は引数で渡す

詳細ルール: `.claude/rules/rust.md`, `.claude/rules/typescript.md`, `.claude/rules/workflow.md`

### やらないこと

- 使われていないコードへのコメント追加
- 不要な抽象化やヘルパー関数の作成
- 将来の拡張を見越した過剰設計
- 意味のないエラーラップ（catchして同じエラーをthrowし直す等）

## カスタムスキル（スラッシュコマンド）

プロジェクト固有のスキルが `.claude/skills/` に定義されている。

| コマンド | 説明 |
|---------|------|
| `/review [file]` | コードレビュー（アーキテクチャ整合性、Lint、テスト、セキュリティ） |
| `/test-all` | 全テスト＋品質チェック並列実行（Biome, knip, Vitest, cargo test, clippy, tsc） |
| `/arch-check` | Functional Core / Imperative Shell パターンの違反検出 |
| `/simplify` | 変更コードの簡素化・品質改善（ビルトイン） |

## Hooks（自動実行）

`.claude/settings.json` で以下のフックが設定されている。

| フック | タイミング | 動作 |
|-------|----------|------|
| SessionStart | セッション開始時 | システム依存、npm、cargo のセットアップ |
| PostToolUse (Write/Edit) | ファイル編集後 | Biome / rustfmt による自動フォーマット |
| PreToolUse (Write/Edit) | ファイル編集前 | `.env` 等の機密ファイルへの書き込みブロック |

## Claude Code Web での開発フロー

1. セッション開始 → SessionStart hook が自動で環境構築
2. 実装 → PostToolUse で自動フォーマット
3. `/test-all` → 全テスト並列実行で品質確認
4. `/review` → 変更のコードレビュー
5. `/arch-check` → アーキテクチャ違反がないか確認
6. コミット＆プッシュ

## ディレクトリ構造

詳細は `docs/IMPLEMENTATION_PLAN.md` を参照。

## 参考資料

- 実装計画: `docs/IMPLEMENTATION_PLAN.md`
