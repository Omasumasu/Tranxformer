# Tranxformer - 実装計画

## Context

あらゆるデータを構造化データに変換するデスクトップアプリを新規構築する。ローカルLLM（llama.cpp組み込み）がインプットデータとテンプレートを分析し、JavaScript変換コードを生成。そのコードをサンドボックス内で安全に実行して変換結果を出力する。

## 技術スタック

| レイヤー | 技術 | バージョン/クレート |
|---------|------|-------------------|
| デスクトップ | Tauri v2 | `tauri` v2.x |
| フロントエンド | React + TypeScript + Vite | React 19 |
| UIライブラリ | shadcn/ui + Tailwind CSS | |
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
└── src-tauri/                    # Rust バックエンド
    ├── Cargo.toml
    ├── build.rs
    ├── tauri.conf.json
    ├── capabilities/
    │   └── default.json
    └── src/
        ├── main.rs               # エントリポイント
        ├── lib.rs                # Tauriアプリ設定
        ├── commands/             # Tauriコマンド（IPC）
        │   ├── mod.rs
        │   ├── template.rs       # テンプレートCRUD
        │   ├── data_io.rs        # ファイル読み書き
        │   ├── llm.rs            # LLM推論
        │   └── transform.rs      # コード生成＆実行
        ├── llm/                  # LLMモジュール
        │   ├── mod.rs
        │   ├── engine.rs         # llama.cpp ラッパー
        │   └── prompts.rs        # プロンプトテンプレート
        ├── sandbox/              # JS実行サンドボックス
        │   ├── mod.rs
        │   ├── executor.rs       # rquickjs実行エンジン
        │   └── validator.rs      # コード安全性チェック
        ├── data/                 # データI/O
        │   ├── mod.rs
        │   ├── csv_handler.rs    # CSV/TSV読み書き
        │   └── excel_handler.rs  # Excel読み書き
        └── template/             # テンプレート管理
            ├── mod.rs
            └── storage.rs        # JSON保存/読み込み
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
- Cargo.toml に依存クレート追加
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

## 検証方法

1. **プロジェクトビルド**: `cd src-tauri && cargo build` + `npm run build`
2. **テンプレート操作**: テンプレート作成→保存→エクスポート→インポートの一連の流れ
3. **データ読み込み**: CSV/Excelファイルの読み込みとプレビュー表示
4. **LLM推論**: GGUFモデルをロードしてコード生成（手動テスト）
5. **サンドボックス**: 安全なコード実行と、危険コードのブロック確認
6. **E2Eフロー**: CSV入力 → テンプレート選択 → コード生成 → 実行 → Excel出力
