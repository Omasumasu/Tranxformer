# 複数ファイルインポート & LEFT JOIN 結合 — 設計

## 概要

データインポート時に複数ファイルを追加し、LEFT JOINで結合してから変換する機能。結合キーはLLM自動生成または手動（JavaScript式）で定義。結合設定はインプットテンプレートとして保存・再利用可能。

## ユーザーフロー

```
1. テンプレート選択（出力定義）
2. データインポート
   - 「ファイルを追加」ボタンで1つずつファイル追加
   - 各ファイルのプレビュー確認
   - 基準テーブル（LEFT JOINの左側）を指定
3. 結合設定（2ファイル以上の場合のみ表示）
   - LLM自動: ヘッダー＋サンプルデータから結合コード生成
   - 手動: JavaScript式で結合キーを定義（rquickjs使用）
   - プレビュー: 結合結果のサンプル数行を表示
   - インプットテンプレートとして保存可能
4. コード生成＆レビュー（既存フロー）
5. 変換実行 → 結果
```

1ファイルの場合はステップ3をスキップし、従来通りの動作。

## 結合キーの定義方法

### モード1: LLM自動生成
- 全ファイルのヘッダーとサンプルデータ（最大5行）をLLMに渡す
- LLMが結合キーの対応関係と結合用JavaScript関数を生成
- 複合キー（姓+名 = 氏名 等）もLLMが判断
- ユーザーがプレビューで確認・承認

### モード2: 手動（JavaScript式）
- ユーザーがJavaScript式で結合キーを定義
- rquickjs（既存依存）で実行
- 例: `file1.顧客コード === file2.customer_id`
- 例: `file1.姓 + file1.名 === file2.氏名`
- LLM未ロードでも使える

## データ型

### インプットテンプレート

```typescript
interface InputTemplate {
  id: string;
  name: string;
  description: string;
  files: FileSlot[];
  joinType: 'left';
  joinExpression: string; // JavaScript式
  createdAt: string;
  updatedAt: string;
}

interface FileSlot {
  role: 'base' | 'join';
  label: string;
  expectedHeaders: string[];
}
```

```rust
// models.rs
struct InputTemplate {
    id: String,
    name: String,
    description: String,
    files: Vec<FileSlot>,
    join_type: JoinType,
    join_expression: String,
    created_at: String,
    updated_at: String,
}

struct FileSlot {
    role: FileRole,      // Base | Join
    label: String,
    expected_headers: Vec<String>,
}

enum JoinType {
    Left,
}

enum FileRole {
    Base,
    Join,
}
```

### ランタイムデータ（結合実行時）

```typescript
interface ImportedFile {
  path: string;
  role: 'base' | 'join';
  label: string;
  headers: string[];
  preview: DataPreview;
}
```

## 結合ロジック（Rust core/）

```rust
// core/join.rs — 純粋関数
pub fn left_join(
    base_rows: &[Vec<String>],
    base_headers: &[String],
    join_rows: &[Vec<String>],
    join_headers: &[String],
    base_key_indices: &[usize],
    join_key_indices: &[usize],
) -> (Vec<String>, Vec<Vec<String>>)
```

- 基準テーブルの全行を保持
- 結合テーブルにマッチする行があれば列を追加、なければ空文字
- ヘッダーは結合テーブルのカラムに接頭辞を付けて重複を回避

複合キー・式ベースの結合はrquickjsで結合キー値を計算してからこの関数に渡す。

## UI構成

### データインポート画面（変更）
- ファイルリスト: 追加済みファイルを一覧表示（ドラッグで並び替え or 基準テーブル指定ボタン）
- 各ファイル: ファイル名、ヘッダー数、行数、プレビュー展開、削除ボタン
- 「ファイルを追加」ボタン
- 2ファイル以上で「次へ（結合設定）」ボタン表示

### 結合設定画面（新規）
- モード切替: LLM自動 / 手動
- LLM自動: 「結合キーを推論」ボタン → 生成された式を表示
- 手動: JavaScript式の入力エリア
- プレビューテーブル: 結合結果のサンプル行
- 「インプットテンプレートとして保存」チェックボックス + 名前入力
- 「次へ」ボタン → 既存のコード生成フローへ

## アーキテクチャ

| レイヤー | 追加内容 |
|---------|---------|
| `core/join.rs` | LEFT JOIN 純粋関数 |
| `core/` | 結合キー推論用プロンプト生成（既存prompt.rsに追加 or 新規） |
| `infra/storage.rs` | インプットテンプレートのCRUD |
| `commands/` | `join_preview`, `save_input_template`, `list_input_templates` 等 |
| `hooks/` | `useJoin`, `useInputTemplates` |
| `components/transform/` | DataImport変更、JoinSettings新規 |

## スコープ外

- INNER JOIN, FULL JOIN（将来拡張）
- 3ファイル以上の連鎖結合（将来拡張、今回は2ファイルの結合）
- ファイルのドラッグ＆ドロップ
