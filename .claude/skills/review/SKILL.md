---
name: review
description: Runs comprehensive code review on changed files - checks architecture compliance, code style, type safety, and test coverage.
allowed-tools: Read, Grep, Glob, Bash, Agent
context: fork
argument-hint: "[file-or-branch]"
---

# Code Review Skill

Review code changes for quality, architecture compliance, and potential issues.

## What to Review

If `$ARGUMENTS` is provided, review the specified file or compare against the specified branch.
Otherwise, review all uncommitted changes (`git diff` + `git diff --staged`).

## Review Checklist

Run these checks in parallel using subagents where possible:

### 1. Architecture Compliance (Functional Core / Imperative Shell)
- `src-tauri/src/core/` に I/O や副作用がないか
- `src-tauri/src/commands/` がロジックを持ちすぎていないか（薄いシェルか）
- `src/components/` 内に直接 `invoke()` がないか（`hooks/` 経由か）
- `src/lib/` が純粋関数のみか

### 2. Rust Quality
- `unwrap()` が非テストコードにないか
- `clippy::all` / `clippy::pedantic` の警告確認: `cd src-tauri && cargo clippy -- -D warnings`
- `thiserror` ベースのエラー型を使っているか
- ネスト2段以上の箇所がないか

### 3. TypeScript Quality
- `biome check .` を実行して lint/format 違反を報告
- `any` 型の使用がないか
- コンポーネントが表示に徹しているか（ロジックは `lib/` にあるか）

### 4. Test Coverage
- 変更されたファイルに対応するテストがあるか
- `npx vitest run` が通るか
- `cd src-tauri && cargo test` が通るか

### 5. Security
- Rust 側で SQL インジェクション、パス トラバーサル等がないか
- フロントエンドで XSS の可能性がないか
- `dangerouslySetInnerHTML` が使われていないか

## Output Format

```
## Code Review Summary

### ✅ Passed
- (passed items)

### ⚠️ Warnings
- (warnings with file:line references)

### ❌ Issues
- (blocking issues with file:line references and fix suggestions)

### 📊 Stats
- Files reviewed: N
- Issues found: N
- Test status: PASS/FAIL
```
