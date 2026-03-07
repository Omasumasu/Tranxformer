#!/bin/bash
# 個別チェックを実行し結果をJSON形式で返す
# Usage: run-checks.sh <check-name>

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-/home/user/Tranxformer}"
cd "$PROJECT_DIR"

CHECK="${1:-all}"

case "$CHECK" in
  biome)
    npx biome check . 2>&1
    ;;
  knip)
    npx knip 2>&1
    ;;
  rustfmt)
    cd src-tauri && cargo fmt -- --check 2>&1
    ;;
  vitest)
    npx vitest run --reporter=verbose 2>&1
    ;;
  cargo-test)
    cd src-tauri && cargo test 2>&1
    ;;
  clippy)
    cd src-tauri && cargo clippy -- -D warnings 2>&1
    ;;
  tsc)
    npx tsc --noEmit 2>&1
    ;;
  *)
    echo "Unknown check: $CHECK"
    echo "Available: biome, knip, rustfmt, vitest, cargo-test, clippy, tsc"
    exit 1
    ;;
esac
