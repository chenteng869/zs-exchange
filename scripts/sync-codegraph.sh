#!/usr/bin/env bash
# CodeGraph 一键同步脚本
# 用途：检测代码变更后增量更新 CodeGraph 索引
# 用法：./scripts/sync-codegraph.sh

set -e

echo "🔄 CodeGraph 同步检查..."
echo ""

# 检查 .codegraph 目录是否存在
if [ ! -d ".codegraph" ]; then
  echo "❌ .codegraph 目录不存在，正在初始化..."
  codegraph init .
  echo "✅ 初始化完成"
  exit 0
fi

# 显示当前状态
echo "📊 当前状态："
codegraph status . | head -10
echo ""

# 增量同步
echo "⚡ 增量同步中..."
codegraph sync .
echo ""

# 显示同步后状态
echo "📊 同步后状态："
codegraph status . | head -10
echo ""

echo "✅ CodeGraph 同步完成！"
