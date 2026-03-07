#!/bin/bash
set -euo pipefail

# Claude Code Web セッション開始時の自動セットアップ
# ローカル環境では実行しない
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-/home/user/Tranxformer}"
cd "$PROJECT_DIR"

echo "## Tranxformer - セッション初期化"
echo ""

# 1. システム依存ライブラリ（GTK/WebKit - Tauri v2 ビルドに必要）
if ! pkg-config --exists gdk-3.0 2>/dev/null; then
  echo "### システム依存ライブラリをインストール中..."
  apt-get update -qq 2>/dev/null
  apt-get install -y -qq \
    libgtk-3-dev libwebkit2gtk-4.1-dev libjavascriptcoregtk-4.1-dev \
    libsoup-3.0-dev libayatana-appindicator3-dev librsvg2-dev 2>/dev/null
  echo "- GTK/WebKit: installed"
else
  echo "- GTK/WebKit: already installed"
fi

# 2. Node.js 依存パッケージ
if [ ! -d "node_modules" ]; then
  echo "### npm install..."
  npm install --silent 2>/dev/null
  echo "- node_modules: installed"
else
  echo "- node_modules: already installed"
fi

# 3. Rust 依存クレート（フェッチのみ）
echo "### cargo fetch..."
cd "$PROJECT_DIR/src-tauri"
cargo fetch --quiet 2>/dev/null || true
echo "- cargo deps: fetched"
cd "$PROJECT_DIR"

# 4. 環境情報
echo ""
echo "## Environment"
echo "- Node: $(node --version)"
echo "- Rust: $(rustc --version 2>/dev/null | cut -d' ' -f2 || echo 'N/A')"
echo "- Branch: $(git branch --show-current)"

# 5. Git 状態
CHANGES=$(git status --short | wc -l)
if [ "$CHANGES" -gt 0 ]; then
  echo "- Uncommitted changes: ${CHANGES}"
  git status --short | head -10
fi

echo ""
echo "Ready."
