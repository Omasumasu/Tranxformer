---
name: test-all
description: Runs all project tests in parallel - Vitest frontend tests, Rust cargo tests, Biome lint, clippy, and knip unused code detection.
allowed-tools: Bash, Read, Agent
---

# Test All Skill

Run the full test suite and quality checks for the project. Execute independent checks in parallel.

## Execution Plan

Run these in parallel:

### Group 1: Fast checks (parallel)
1. **Biome**: `npx biome check .`
2. **knip**: `npx knip`
3. **Rust format**: `cd src-tauri && cargo fmt -- --check`

### Group 2: Tests (parallel)
4. **Vitest**: `npx vitest run --reporter=verbose`
5. **Cargo test**: `cd src-tauri && cargo test`
6. **Clippy**: `cd src-tauri && cargo clippy -- -D warnings`

### Group 3: Build verification (after tests pass)
7. **TypeScript build**: `npx tsc --noEmit`

## Output Format

Report results as a table:

```
## Test Results

| Check          | Status | Duration | Details        |
|----------------|--------|----------|----------------|
| Biome          | ✅/❌  | Xs       | N issues       |
| knip           | ✅/❌  | Xs       | N unused items |
| rustfmt        | ✅/❌  | Xs       |                |
| Vitest         | ✅/❌  | Xs       | N/N passed     |
| cargo test     | ✅/❌  | Xs       | N/N passed     |
| clippy         | ✅/❌  | Xs       | N warnings     |
| tsc            | ✅/❌  | Xs       | N errors       |

Overall: ✅ ALL PASSED / ❌ N FAILED
```

If any check fails, show the relevant error output below the table.
