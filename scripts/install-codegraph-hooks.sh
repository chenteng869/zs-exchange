#!/usr/bin/env bash
# =============================================================
# 一键安装 CodeGraph Git Hooks
# =============================================================
# 用法: ./scripts/install-codegraph-hooks.sh
# =============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOOKS_DIR="$PROJECT_ROOT/.git/hooks"
TEMPLATES_DIR="$PROJECT_ROOT/docs/03-开发工具"

echo "================================================"
echo "  CodeGraph Git Hooks 安装程序"
echo "================================================"
echo ""

# 检查 .git 目录
if [ ! -d "$PROJECT_ROOT/.git" ]; then
  echo "❌ 错误: 未找到 .git 目录"
  echo "请先初始化 Git 仓库: git init"
  exit 1
fi

# 安装 post-commit
if [ -f "$TEMPLATES_DIR/post-commit" ]; then
  cp "$TEMPLATES_DIR/post-commit" "$HOOKS_DIR/post-commit"
  chmod +x "$HOOKS_DIR/post-commit"
  echo "✅ post-commit 已安装"
else
  echo "❌ 模板文件不存在: $TEMPLATES_DIR/post-commit"
  exit 1
fi

# 安装 pre-commit
if [ -f "$TEMPLATES_DIR/pre-commit" ]; then
  cp "$TEMPLATES_DIR/pre-commit" "$HOOKS_DIR/pre-commit"
  chmod +x "$HOOKS_DIR/pre-commit"
  echo "✅ pre-commit 已安装"
else
  echo "❌ 模板文件不存在: $TEMPLATES_DIR/pre-commit"
  exit 1
fi

echo ""
echo "================================================"
echo "  🎉 安装完成！"
echo "================================================"
echo ""
echo "已安装的钩子:"
echo "  - post-commit:  commit 后自动 codegraph sync"
echo "  - pre-commit:   commit 前检查受影响测试"
echo ""
echo "验证方法:"
echo "  git commit -m 'test'  # 触发 post-commit"
echo ""
echo "卸载方法:"
echo "  rm $HOOKS_DIR/post-commit"
echo "  rm $HOOKS_DIR/pre-commit"
echo ""
echo "团队一致性方案 (推荐):"
echo "  1. 使用 husky:  npm i -D husky && npx husky init"
echo "  2. 使用 lefthook:  https://github.com/evilmartians/lefthook"
echo "  3. 文档同步: 把 docs/03-开发工具/{post,pre}-commit 提交到仓库"
echo ""
