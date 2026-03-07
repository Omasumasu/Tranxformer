---
name: arch-check
description: Validates Functional Core / Imperative Shell architecture - ensures pure functions stay pure and side effects stay at boundaries.
allowed-tools: Read, Grep, Glob, Bash
context: fork
agent: Explore
---

# Architecture Check Skill

Validate that the codebase follows the **Functional Core / Imperative Shell** pattern as defined in `docs/IMPLEMENTATION_PLAN.md`.

## Rules to Check

### Rust Side

#### core/ must be pure (NO I/O)
Search `src-tauri/src/core/` for violations:
- `std::fs::` - ファイル I/O
- `std::net::` - ネットワーク
- `tokio::` - 非同期ランタイム
- `std::io::` - I/O 操作
- `println!` / `eprintln!` - 標準出力（`log::` は許可）
- `Mutex` / `RwLock` - 状態変更
- `static` mutable 変数

#### core/ functions should be pure
- `&self` を取らず、引数と戻り値のみで完結する `pub fn` であること
- `Result<T, E>` で返すこと（パニックしない）

#### commands/ should be thin
- `commands/` 内のロジック行数が 20 行を超えていないか（I/O の橋渡しのみ）
- ロジックは `core/` に委譲されているか

#### infra/ handles all I/O
- ファイル操作、LLM エンジン、外部サービスは `infra/` に閉じ込められているか

### TypeScript Side

#### lib/ must be pure
Search `src/lib/` for violations:
- `invoke(` - Tauri IPC 呼び出し
- `fetch(` - ネットワーク
- `localStorage` / `sessionStorage` - ブラウザストレージ
- `document.` / `window.` - DOM 操作

#### components/ should not call invoke()
- `src/components/` 内に `invoke(` が直接使われていないか
- IPC 呼び出しは `src/hooks/` 経由であること

#### hooks/ is the side-effect boundary
- `invoke()` 呼び出しは `src/hooks/` にのみ存在すること

## Output Format

```
## Architecture Check Results

### Rust: core/ purity
- ✅/❌ (violations listed)

### Rust: commands/ thinness
- ✅/❌ (thick commands listed)

### Rust: infra/ I/O containment
- ✅/❌

### TypeScript: lib/ purity
- ✅/❌ (violations listed)

### TypeScript: components/ invoke isolation
- ✅/❌ (violations listed)

Overall: ✅ Architecture compliant / ❌ N violations found
```
