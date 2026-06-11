# ZS CodeGraph VSCode 插件

> 中萨数字科技交易所 - CodeGraph 集成

在 VSCode / Cursor / Trae IDE 中直接使用 CodeGraph 强大的代码分析能力。

## ✨ 功能特性

- 🔍 **符号搜索** - 全工作区快速搜索符号
- 📍 **查看定义** - 一键跳转到符号完整定义
- ⬅️ **调用者追踪** - 查看谁在调用当前符号
- ➡️ **被调者追踪** - 查看当前符号调用了什么
- 💥 **影响分析** - 改动前的爆炸半径评估
- 💡 **Q&A 探索** - 自然语言提问，自动分析
- 🔄 **自动同步** - 文件变更 5 秒后自动同步索引
- 📊 **状态栏** - 实时显示索引状态

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Shift+G` | 符号搜索 |
| `Ctrl+Shift+D` | 查看定义 |
| `Ctrl+Shift+I` | 影响分析 |

（Mac: `Cmd+Shift+...`）

## 📦 安装

### 从源码构建

```bash
cd vscode-codegraph
npm install
npm run compile
npm run package
# 生成的 .vsix 文件通过 VSCode "扩展 → 从 VSIX 安装"
```

### 在开发模式下调试

1. 用 VSCode 打开 `vscode-codegraph` 目录
2. 按 F5 启动"扩展开发主机"窗口
3. 在新窗口中打开 ZS Exchange 项目即可使用

## ⚙️ 前置条件

需要全局安装 `codegraph` CLI:

```bash
npm install -g codegraph
```

## 🚀 使用示例

### 1. 搜索符号
- 按 `Ctrl+Shift+G` 或右键 → "CodeGraph: 搜索符号"
- 输入 `useTicker` → 查看所有相关定义

### 2. 查看影响范围
- 选中 `AdminLayout`
- 按 `Ctrl+Shift+I` 或右键 → "影响分析"
- 显示修改 AdminLayout 会影响的 148 个位置

### 3. Q&A 探索
- 打开 Q&A 探索面板
- 输入: "useTicker 如何工作?"
- 自动获得完整调用链和源码

## 📂 项目结构

```
vscode-codegraph/
├── package.json          # 扩展清单
├── tsconfig.json
├── src/
│   ├── extension.ts      # 主入口
│   ├── cli.ts            # CodeGraph CLI 客户端
│   └── panels/
│       ├── SymbolSearchPanel.ts
│       ├── ResultPanel.ts
│       └── ExplorerPanel.ts
└── README.md
```

## 🔧 配置

在 VSCode 设置中:

```json
{
  "zsCodegraph.autoSync": true,
  "zsCodegraph.syncDebounce": 5000
}
```

## 📜 许可证

MIT © 中萨数字科技集团
