# TypeScript / React コーディングルール

## 純粋関数 (`src/lib/`)

- Tauri IPC (`invoke`)、`fetch`、`localStorage`、`document.*` 禁止
- 入力 → 出力のみ。副作用なし
- Vitest でテスト可能であること

## コンポーネント (`src/components/`)

- 表示に徹する。ロジックは `lib/` へ切り出す
- `invoke()` を直接呼ばない → `hooks/` 経由
- `dangerouslySetInnerHTML` 禁止
- エラーは Error Boundary で一括処理

## フック (`src/hooks/`)

- Tauri IPC 呼び出しの唯一の境界
- `invoke()` はここにのみ存在する

## Biome

- `recommended` ルールセット
- `noExplicitAny: error` — `any` 型禁止
- シングルクォート、セミコロンあり
- import 自動ソート有効
