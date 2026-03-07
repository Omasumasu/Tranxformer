# Tranxformer - 実装計画

## Context

あらゆるデータを構造化データに変換するデスクトップアプリを新規構築する。ローカルLLM（llama.cpp組み込み）がインプットデータとテンプレートを分析し、JavaScript変換コードを生成。そのコードをサンドボックス内で安全に実行して変換結果を出力する。

## 技術スタック

| レイヤー | 技術 | バージョン/クレート |
|---------|------|-------------------|
| デスクトップ | Tauri v2 | `tauri` v2.x |
| フロントエンド | React + TypeScript + Vite | React 19 |
| UIライブラリ | shadcn/ui + Tailwind CSS | |
| Linter/Formatter | Biome | v1.x |
| ユニットテスト (TS) | Vitest | v3.x |
| E2Eテスト | Playwright | v1.x |
| ユニットテスト (Rust) | cargo test (標準) | |
| LLM | llama.cpp組み込み | `llama-cpp-2` クレート |
| JSサンドボックス | QuickJS | `rquickjs` クレート |
| Excel読み込み | calamine | v0.33 |
| Excel書き込み | rust_xlsxwriter | v0.93 |
| CSV | csv クレート | |
| テンプレート保存 | JSON ファイルベース | serde_json |

## プロジェクト構造

```
Tranxformer/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── index.html
├── src/                          # React フロントエンド
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx       # ナビゲーション
│   │   │   └── Header.tsx
│   │   ├── template/
│   │   │   ├── TemplateEditor.tsx    # テンプレート定義UI
│   │   │   ├── ColumnEditor.tsx      # カラム編集
│   │   │   └── TemplateList.tsx      # テンプレート一覧
│   │   ├── transform/
│   │   │   ├── DataImport.tsx        # ファイル取り込み＆プレビュー
│   │   │   ├── MappingView.tsx       # マッピング構造表示
│   │   │   ├── CodePreview.tsx       # 生成コードプレビュー
│   │   │   └── ResultView.tsx        # 変換結果＆エクスポート
│   │   └── settings/
│   │       └── ModelSettings.tsx     # LLMモデル設定
│   ├── hooks/
│   │   └── useTauri.ts              # Tauriコマンド呼び出しフック
│   ├── lib/
│   │   ├── types.ts                 # 共通型定義
│   │   └── tauri-commands.ts        # Tauriコマンドラッパー
│   └── styles/
│       └── globals.css
├── e2e/                          # Playwright E2Eテスト
│   ├── fixtures/                 # テスト用データファイル
│   ├── template.spec.ts
│   ├── data-import.spec.ts
│   └── transform-flow.spec.ts
├── biome.json                    # Biome設定
├── vitest.config.ts
├── playwright.config.ts
└── src-tauri/                    # Rust バックエンド
    ├── Cargo.toml
    ├── build.rs
    ├── tauri.conf.json
    ├── rustfmt.toml
    ├── capabilities/
    │   └── default.json
    └── src/
        ├── main.rs               # エントリポイント
        ├── lib.rs                # Tauriアプリ設定
        ├── models.rs             # 共通型定義
        ├── error.rs              # エラー型定義（thiserror）
        ├── commands/             # Imperative Shell — Tauriコマンド（IPC境界）
        │   ├── mod.rs
        │   ├── template.rs       # テンプレートCRUD
        │   ├── data_io.rs        # ファイル読み書き
        │   ├── llm.rs            # LLM推論
        │   └── transform.rs      # コード生成＆実行
        ├── core/                 # Functional Core — 純粋関数のみ
        │   ├── mod.rs
        │   ├── template.rs       # テンプレートバリデーション
        │   ├── prompt.rs         # プロンプト構築
        │   ├── safety.rs         # コード安全性チェック
        │   └── transform.rs      # データ整形ロジック
        └── infra/                # Imperative Shell — 外部I/O
            ├── mod.rs
            ├── storage.rs        # JSON保存/読み込み
            ├── csv_io.rs         # CSV/TSV読み書き
            ├── excel_io.rs       # Excel読み書き
            └── llm_engine.rs     # llama.cpp ラッパー
```

## アーキテクチャ: Functional Core / Imperative Shell

副作用を最小化し、テスタビリティを最大化するために **Functional Core / Imperative Shell** パターンを採用する。

### 原則

```
┌─────────────────────────────────────────────┐
│           Imperative Shell (薄い)            │
│  ・Tauriコマンド（IPC境界）                   │
│  ・ファイルI/O                                │
│  ・LLMエンジン初期化/呼び出し                  │
│  ・AppState管理                               │
│                                              │
│  ┌─────────────────────────────────────┐     │
│  │       Functional Core (厚い)         │     │
│  │  ・テンプレートバリデーション          │     │
│  │  ・プロンプト構築（純粋関数）          │     │
│  │  ・コード安全性チェック（純粋関数）     │     │
│  │  ・データ変換ロジック                  │     │
│  │  ・CSV/Excelパース結果の整形           │     │
│  │                                       │     │
│  │  入力 → 出力 のみ。I/O なし。          │     │
│  │  すべて #[cfg(test)] でテスト可能       │     │
│  └─────────────────────────────────────┘     │
└─────────────────────────────────────────────┘
```

### Rust側の実践ルール

1. **Functional Core**: `pub fn` は `&self` を取らず、引数と戻り値のみで完結する純粋関数。ファイルI/O・ネットワーク・状態変更を行わない
2. **Imperative Shell**: Tauriコマンドハンドラとストレージ層のみ。ロジックは Core に委譲し、Shell は I/O の橋渡しだけを行う
3. **エラー型**: `thiserror` で定義した専用エラー型を使い、`Result<T, E>` で返す。パニックしない
4. **ネストを避ける**: `?` 演算子とearly returnで処理をフラットに保つ。`match` のネストは関数分割で対処
5. **無意味な try-catch 禁止**: Rust側は `?` で呼び出し元に伝播。Tauriコマンド境界でのみエラーをシリアライズ

### React側の実践ルール

1. **純粋関数でロジック分離**: UIコンポーネントは表示に徹する。データ変換・バリデーションは `lib/` 配下の純粋関数に切り出す
2. **Hooks は副作用の境界**: `useTauri.ts` 等のカスタムフックがTauri IPC呼び出しを担当。コンポーネント内に直接 `invoke()` を書かない
3. **早期リターンパターン**: ネストした条件分岐の代わりにガード句で早期リターン
4. **不要な try-catch 禁止**: エラーバウンダリで一括処理。個別コンポーネントでの意味のない catch は書かない

### ディレクトリ構造への反映

```
src-tauri/src/
├── commands/          # Imperative Shell — Tauriコマンド（I/O境界）
├── core/              # Functional Core — 純粋関数のみ
│   ├── template.rs    # テンプレートバリデーション・変換
│   ├── prompt.rs      # プロンプト構築
│   ├── safety.rs      # コード安全性チェック
│   └── transform.rs   # データ整形ロジック
├── infra/             # Imperative Shell — 外部I/O
│   ├── storage.rs     # ファイル保存/読み込み
│   ├── csv_io.rs      # CSV読み書き
│   ├── excel_io.rs    # Excel読み書き
│   └── llm_engine.rs  # llama.cpp ラッパー
└── models.rs          # 共通型定義
```

## コードスタイル方針

### 全体

- **副作用の最小化**: ビジネスロジックは純粋関数。I/Oは境界層に押し出す
- **フラットなコード**: ネスト2段以上は関数分割またはearly returnで解消する
- **無意味な try-catch / unwrap 禁止**: エラーは型で表現し、適切な境界でのみハンドリングする
- **明示的なデータフロー**: グローバル状態やシングルトンを避ける。依存は引数で渡す

### Biome設定方針

- ESLint + Prettier の代替として **Biome** を単一ツールで採用
- フォーマット: インデント2スペース、セミコロンあり、ダブルクォート不使用（シングルクォート）
- Lint: `recommended` ルールセットをベースに、`noExplicitAny` を error に設定
- import の自動ソート有効化
- CI / pre-commit で `biome check` を実行

### Rust (rustfmt + clippy)

- `rustfmt`: デフォルト設定（edition 2021）
- `clippy`: `#![deny(clippy::all)]` + `#![warn(clippy::pedantic)]`
- `unwrap()` 禁止（テストコード内を除く）

## テスト戦略

### ユニットテスト

**Rust (`cargo test`)**:
- Functional Core の純粋関数を中心にテスト
- テンプレートバリデーション、プロンプト構築、安全性チェック、データ整形
- I/Oを含むテストは `tempfile` クレートで一時ディレクトリを使用
- `#[cfg(test)]` モジュールをソースファイルと同居

**TypeScript (`vitest`)**:
- `lib/` 配下の純粋関数をテスト
- React コンポーネントは `@testing-library/react` でテスト
- Tauri IPC はモックして UI ロジックのみ検証
- カバレッジ目標: Core ロジック 80%以上

### E2Eテスト (`Playwright`)

- Tauri ウィンドウを起動し、実際のアプリケーションフローをテスト
- テスト対象フロー:
  1. テンプレート作成 → 保存 → 一覧表示
  2. CSVファイル読み込み → プレビュー表示
  3. 変換パイプライン全体（LLMモック使用）
- CI 環境ではヘッドレスモードで実行

### テストの配置

```
src/
├── __tests__/                # React コンポーネントテスト
│   ├── components/
│   └── lib/                  # 純粋関数テスト
├── lib/
│   └── *.test.ts             # or colocated tests
e2e/
├── fixtures/                 # テスト用CSV/Excelファイル
├── template.spec.ts
├── data-import.spec.ts
└── transform-flow.spec.ts
src-tauri/src/
├── core/
│   └── *.rs                  # 各ファイル内に #[cfg(test)] mod tests
```

## データフロー

```
[ユーザー] → テンプレート定義（カラム名、型、ラベル）
                ↓
[ユーザー] → 入力ファイル選択（CSV/Excel）
                ↓
[Rust] → ファイル読み込み → 先頭N行サンプル抽出
                ↓
[Rust/LLM] → プロンプト構築（サンプル + テンプレート定義）
                ↓
[llama.cpp] → JavaScriptコード生成
                ↓
[Rust/Validator] → 静的解析（危険パターン検出）
                ↓
[ユーザー] → コードプレビュー確認
                ↓
[Rust/QuickJS] → サンドボックスでJS実行
                ↓
[Rust] → 結果をCSV/Excelとして出力
```

## 実装フェーズ（順序）

### Phase 1: プロジェクトセットアップ
- Tauri v2 + React + TypeScript + Vite のプロジェクト初期化
- Tailwind CSS + shadcn/ui セットアップ
- **Biome セットアップ** (`biome.json` 設定、npm scripts 追加)
- **Vitest セットアップ** (`vitest.config.ts`、`@testing-library/react` 導入)
- **Playwright セットアップ** (`playwright.config.ts`、E2E ディレクトリ構成)
- **rustfmt + clippy 設定** (`rustfmt.toml`、`clippy.toml`)
- Cargo.toml に依存クレート追加
- Rust側の `core/` + `infra/` ディレクトリ構造作成
- 基本的なアプリシェル（サイドバー + メインエリア）

### Phase 2: テンプレートシステム
- テンプレートの型定義（Rust側 `serde` + TS側）
  ```rust
  struct Template {
      id: String,
      name: String,
      columns: Vec<Column>,
      created_at: String,
      updated_at: String,
  }
  struct Column {
      name: String,
      label: String,
      data_type: DataType, // String, Number, Boolean, Date
      required: bool,
      description: String,
  }
  ```
- テンプレートのCRUD（JSON ファイル保存、`app_data_dir`使用）
- テンプレートエディタUI（カラム追加/削除/並び替え）
- テンプレートのエクスポート/インポート（JSONファイル）

### Phase 3: データI/O
- CSV/TSV読み込み（`csv` クレート、区切り文字自動検出）
- Excel読み込み（`calamine`、シート選択対応）
- データプレビューUI（先頭20行表示、テーブルコンポーネント）
- CSV/TSV書き出し（`csv` クレート）
- Excel書き出し（`rust_xlsxwriter`）

### Phase 4: LLM統合
- llama.cpp初期化（`llama-cpp-2`クレート）
- モデルファイル選択UI（GGUFファイルパス指定）
- プロンプトテンプレート設計：
  ```
  あなたはデータ変換の専門家です。
  以下の入力データサンプルを、指定されたテンプレートに従って変換する
  JavaScriptコードを生成してください。

  ## 入力データサンプル（先頭5行）
  {input_sample}

  ## 出力テンプレート
  {template_definition}

  ## 要件
  - 関数 `transform(rows)` を定義してください
  - rowsは配列で、各要素はオブジェクト（カラム名がキー）
  - 戻り値は変換後の配列
  - 外部ライブラリは使用しないでください
  ```
- ストリーミング推論（進捗表示用）

### Phase 5: サンドボックス実行
- rquickjsでQuickJSランタイム初期化
- JS静的バリデーター実装（ブロック対象：`eval`, `Function`, `fetch`, `import`, `require`, `XMLHttpRequest`, `WebSocket`, `process`, `__proto__`, `constructor`の不正使用）
- 生成コードをサンドボックスで実行：
  1. 入力データをJSON文字列としてQuickJSに注入
  2. `transform(rows)` 関数を実行
  3. 結果をJSONとして取得
- 実行タイムアウト設定（30秒）
- エラーハンドリング（構文エラー、ランタイムエラー）

### Phase 6: 変換パイプライン統合
- 全フローの結合（テンプレート選択 → ファイル読込 → LLM生成 → プレビュー → 実行 → 出力）
- マッピングビューUI（入力カラム ↔ 出力カラムの対応表示）
- コードプレビューUI（シンタックスハイライト付き）
- 結果プレビュー + エクスポートUI
- エラー表示とリトライ機能

## 主要Tauriコマンド（IPC）

```rust
// テンプレート
#[tauri::command] async fn list_templates() -> Result<Vec<Template>>
#[tauri::command] async fn save_template(template: Template) -> Result<()>
#[tauri::command] async fn delete_template(id: String) -> Result<()>
#[tauri::command] async fn export_template(id: String, path: String) -> Result<()>
#[tauri::command] async fn import_template(path: String) -> Result<Template>

// データI/O
#[tauri::command] async fn read_file_preview(path: String) -> Result<DataPreview>
#[tauri::command] async fn export_result(data: TransformResult, path: String, format: ExportFormat) -> Result<()>

// LLM
#[tauri::command] async fn load_model(model_path: String) -> Result<()>
#[tauri::command] async fn generate_transform_code(input_sample: DataSample, template: Template) -> Result<String>

// 変換
#[tauri::command] async fn validate_code(code: String) -> Result<ValidationResult>
#[tauri::command] async fn execute_transform(code: String, input_data: Vec<Record>) -> Result<TransformResult>
```

## 安全性チェック（バリデーター）

ブロックするパターン：
- `eval(`, `new Function(`  — 動的コード実行
- `fetch(`, `XMLHttpRequest`, `WebSocket` — ネットワークアクセス
- `require(`, `import ` — モジュール読み込み
- `process.`, `Deno.`, `Bun.` — ランタイムAPI
- `__proto__`, `constructor.constructor` — プロトタイプ汚染
- `while(true)`, 無限ループパターン — DoS防止（タイムアウトでもカバー）

QuickJSはデフォルトでファイルシステムやネットワークAPIが存在しないため、追加の安全層として機能する。

## 並列実装タスク分割

Phase 1完了後、以下のタスクは**独立して並列実装可能**。依存関係を明確にし、インターフェース（型定義）を先に合意することで並列作業を可能にする。

### 前提: 共通型定義（最初に合意）
- `src/lib/types.ts` — フロントエンド型
- `src-tauri/src/commands/mod.rs` — Rust側の共通型（Template, Column, DataType, DataPreview, TransformResult 等）
- これらを先に定義しておけば、各モジュールは独立して実装可能

### 並列レーン

```
             Phase 1: セットアップ + 共通型定義
                    ↓（完了後、4レーン並列開始）
    ┌───────────────┼───────────────┼───────────────┐
    ▼               ▼               ▼               ▼
  Lane A          Lane B          Lane C          Lane D
  テンプレート     データI/O       LLMエンジン     サンドボックス
  (Rust+UI)       (Rust+UI)       (Rust)          (Rust)
    │               │               │               │
    └───────────────┴───────────────┴───────────────┘
                    ↓（全レーン完了後）
             Phase 6: 統合 + 変換パイプラインUI
```

### Lane A: テンプレートシステム（担当者1人）
**Rustバックエンド:**
- `src-tauri/src/template/storage.rs` — JSON保存・読み込み
- `src-tauri/src/commands/template.rs` — list/save/delete/export/import コマンド

**フロントエンド:**
- `src/components/template/TemplateEditor.tsx`
- `src/components/template/ColumnEditor.tsx`
- `src/components/template/TemplateList.tsx`

**依存:** 共通型定義のみ。他レーンへの依存なし。
**成果物:** テンプレートの作成・編集・一覧・エクスポート・インポートが単体で動作

### Lane B: データI/O（担当者1人）
**Rustバックエンド:**
- `src-tauri/src/data/csv_handler.rs` — CSV/TSV読み書き
- `src-tauri/src/data/excel_handler.rs` — Excel読み書き（calamine + rust_xlsxwriter）
- `src-tauri/src/commands/data_io.rs` — read_file_preview, export_result コマンド

**フロントエンド:**
- `src/components/transform/DataImport.tsx` — ファイル選択＆プレビュー
- `src/components/transform/ResultView.tsx` — 結果表示＆エクスポート

**依存:** 共通型定義のみ。他レーンへの依存なし。
**成果物:** ファイル読み込みプレビューと結果エクスポートが単体で動作

### Lane C: LLMエンジン（担当者1人）
**Rustバックエンド:**
- `src-tauri/src/llm/engine.rs` — llama-cpp-2によるモデル読み込み・推論
- `src-tauri/src/llm/prompts.rs` — プロンプトテンプレート
- `src-tauri/src/commands/llm.rs` — load_model, generate_transform_code コマンド

**フロントエンド:**
- `src/components/settings/ModelSettings.tsx` — モデルファイル選択UI

**依存:** 共通型定義のみ。テスト時はサンプルデータとテンプレートをハードコードで渡して検証可能。
**成果物:** GGUFモデルをロードし、テキスト入力からJS変換コードを生成できる

### Lane D: サンドボックス実行（担当者1人）
**Rustバックエンド:**
- `src-tauri/src/sandbox/executor.rs` — rquickjsによるJS実行
- `src-tauri/src/sandbox/validator.rs` — 静的安全性チェック
- `src-tauri/src/commands/transform.rs` — validate_code, execute_transform コマンド

**フロントエンド:**
- `src/components/transform/CodePreview.tsx` — コード表示＆安全性表示

**依存:** 共通型定義のみ。テスト時は手書きJSコードで検証可能。
**成果物:** JSコードの安全性チェック＆サンドボックス実行が単体で動作

### 統合フェーズ（全レーン完了後）
- `src/components/transform/MappingView.tsx` — マッピング可視化
- `src/App.tsx` — メインフロー（テンプレ選択→読込→生成→プレビュー→実行→出力）
- `src-tauri/src/lib.rs` — 全コマンド登録
- E2Eテスト

### レーン間インターフェース契約

```typescript
// 全レーンで共有する型（Phase 1で先に定義）
interface Template { id: string; name: string; columns: Column[]; ... }
interface Column { name: string; label: string; dataType: DataType; ... }
interface DataPreview { headers: string[]; rows: string[][]; totalRows: number; }
interface TransformResult { headers: string[]; rows: Record<string, string>[]; }
interface ValidationResult { isValid: boolean; errors: string[]; }
```

## 具体的な依存関係

### `src-tauri/Cargo.toml`

```toml
[package]
name = "tranxformer"
version = "0.1.0"
edition = "2021"

[lib]
name = "tranxformer_lib"
crate-type = ["lib", "cdylib", "staticlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = ["devtools"] }
tauri-plugin-dialog = "2"           # ネイティブファイルピッカー
tauri-plugin-fs = "2"               # フロントエンドからのFS操作
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }

# LLM
llama-cpp-2 = "0.1"                 # llama.cpp バインディング

# JavaScript サンドボックス
rquickjs = { version = "0.6", features = ["bindgen", "classes", "properties"] }

# データI/O
csv = "1.3"
calamine = "0.26"                    # Excel読み込み
rust_xlsxwriter = "0.79"            # Excel書き込み

# ユーティリティ
uuid = { version = "1", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
thiserror = "2"
log = "0.4"
env_logger = "0.11"
dirs = "6"                           # アプリデータディレクトリ
regex = "1"                          # 安全性チェッカー用
```

### `package.json`

```json
{
  "name": "tranxformer",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "tauri": "tauri"
  },
  "dependencies": {
    "@tauri-apps/api": "^2",
    "@tauri-apps/plugin-dialog": "^2",
    "@tauri-apps/plugin-fs": "^2",
    "react": "^19",
    "react-dom": "^19",
    "@tanstack/react-table": "^8",
    "lucide-react": "^0.400"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5.6",
    "vite": "^6",
    "@vitejs/plugin-react": "^4",
    "@biomejs/biome": "^1",
    "vitest": "^3",
    "@testing-library/react": "^16",
    "@testing-library/jest-dom": "^6",
    "jsdom": "^25",
    "@playwright/test": "^1"
  }
}
```

## AppState設計（Rust管理状態）

```rust
// lib.rs
pub struct AppState {
    pub llm_engine: Arc<Mutex<Option<LlmEngine>>>,
    pub template_store: Arc<TemplateStore>,
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            commands::template::list_templates,
            commands::template::get_template,
            commands::template::save_template,
            commands::template::delete_template,
            commands::template::export_template,
            commands::template::import_template,
            commands::data_io::read_file,
            commands::data_io::write_file,
            commands::llm::load_model,
            commands::llm::get_model_status,
            commands::llm::generate_transform_code,
            commands::transform::check_code_safety,
            commands::transform::execute_transform,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tranxformer");
}
```

LLMエンジンは `Arc<Mutex<Option<LlmEngine>>>` で管理。llama.cppはシングルスレッドのため `Mutex` が必要。

## 共通型定義の詳細（models.rs）

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Template {
    pub id: String,
    pub name: String,
    pub description: String,
    pub columns: Vec<ColumnDef>,
    pub created_at: String,   // ISO 8601
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColumnDef {
    pub name: String,         // マシン名（snake_case）
    pub label: String,        // 表示用ラベル
    pub data_type: ColumnType,
    pub description: String,  // LLMへのヒント
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ColumnType { Text, Number, Date, Boolean }

/// 1レコード = カラム名→値のマップ
pub type Record = serde_json::Map<String, serde_json::Value>;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataPreview {
    pub headers: Vec<String>,
    pub rows: Vec<Record>,
    pub total_rows: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransformResult {
    pub code: String,
    pub output: Vec<Record>,
    pub row_count: usize,
    pub errors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SafetyReport {
    pub is_safe: bool,
    pub violations: Vec<String>,
}
```

## UIワークフロー（ステップベース）

```
TEMPLATE → IMPORT → GENERATE → REVIEW → EXECUTE → RESULTS
```

ルーターではなくステートマシンでステップを管理。各ステップの出力が検証されてから次に進める。

## 推奨LLMモデル（ユーザー提供、アプリには同梱しない）

- **Qwen3.5-9B-GGUF** — 2026年3月リリース。コーディング特化instruct-tuned、現時点でローカルコーディングLLMの最高性能
- **Qwen2.5-Coder-7B-GGUF** — コード生成に強い実績ある安定モデル、8GB VRAM環境向け
- **Gemma-3n-8B-GGUF** — Google製。4B相当のメモリで動作する省メモリ設計、軽量環境のユーザー向け

いずれもGGUF形式（Q4_K_M量子化推奨）で配布されており、llama-cpp-2で動作確認済みのアーキテクチャ。

### 必要スペック

**最低スペック（動作可能）:**

| 項目 | スペック |
|------|---------|
| CPU | 4コア以上（AVX2対応必須） |
| RAM | 8 GB |
| GPU | なしでもCPU推論可（約5〜10 tok/s） |
| ストレージ | SSD 10 GB空き |

**推奨スペック（快適動作）:**

| 項目 | スペック |
|------|---------|
| CPU | 8コア以上 |
| RAM | 16 GB |
| GPU | NVIDIA RTX 3060（12GB）以上 |
| ストレージ | SSD 20 GB空き |

**Q4_K_M量子化時のモデルサイズと推論速度:**

| モデル | サイズ | 必要VRAM/RAM | GPU推論速度 |
|--------|--------|-------------|------------|
| Qwen3.5-9B | ~5.5 GB | 8 GB | ~40 tok/s |
| Qwen2.5-Coder-7B | ~4.5 GB | 6 GB | ~50 tok/s |
| Gemma-3n-8B | ~4.5 GB | 4〜6 GB | ~55 tok/s |

**プラットフォーム別の目安:**

| 環境 | 快適度 | 備考 |
|------|--------|------|
| Mac M1/M2（16GB） | 快適 | ユニファイドメモリでGPU並の速度 |
| Mac M3/M4（24GB+） | 非常に快適 | 9Bモデルが余裕で動作 |
| Windows + RTX 3060 12GB | 快適 | CUDA対応で高速 |
| Windows CPUのみ（16GB RAM） | 動くが遅い | ~5〜10 tok/s |

※ Tranxformerの用途（データ→構造化変換）では出力が短い（数百トークン）ため、CPU推論でも実用的に使用可能。

## 設計判断の理由

| 判断 | 理由 |
|------|------|
| JSON保存 > SQLite | テンプレートは小さく少数。JSONなら保存ファイル=エクスポートファイルで一石二鳥 |
| rquickjs > deno_core | QuickJSはV8よりバイナリが小さく、デフォルトでI/O APIなしの天然サンドボックス |
| llama-cpp-2 > 高レベルクレート | upstream追従が速く、サンプリングパラメータ等を細かく制御可能 |
| ステップベースUI > 自由ナビ | 正しい順序を強制しUIをシンプルに保つ |
| 安全チェッカーを実行前に分離 | UX機能としてユーザーに危険性を見せてから実行判断させる。真のセキュリティはQuickJSサンドボックス |

## 既知の課題・リスク

1. **llama-cpp-2ビルド**: CMakeとC++コンパイラが必要。Windows環境ではMSVCが必要になる場合がある
2. **LLM出力品質**: 小型ローカルモデルは不完全なコードを生成する可能性。対策：構造化プロンプト + ユーザーによるコード編集 + エラー表示でイテレーション
3. **大ファイルのメモリ**: 100万行ExcelをVec<Record>に読むとメモリを大量消費。MVPでは許容し、将来ストリーミング/チャンク処理に最適化
4. **QuickJS命令制限**: `Runtime::set_interrupt_handler` で10,000命令ごとにチェック、30秒でタイムアウト

## 検証方法

1. **プロジェクトビルド**: `cd src-tauri && cargo build` + `npm run build`
2. **テンプレート操作**: テンプレート作成→保存→エクスポート→インポートの一連の流れ
3. **データ読み込み**: CSV/Excelファイルの読み込みとプレビュー表示
4. **LLM推論**: GGUFモデルをロードしてコード生成（手動テスト）
5. **サンドボックス**: 安全なコード実行と、危険コードのブロック確認
6. **E2Eフロー**: CSV入力 → テンプレート選択 → コード生成 → 実行 → Excel出力
