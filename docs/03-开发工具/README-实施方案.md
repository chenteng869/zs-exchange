# CodeGraph 完整实施文档

> 中萨数字科技交易所 - ZS Exchange
> 版本: v1.0  |  日期: 2026-06-09

本目录包含 CodeGraph 在 ZS Exchange 项目中的**完整实施方案**。

---

## 📂 文件结构

```
docs/03-开发工具/
├── README-MCP配置.md               # MCP 配置完整指南（本目录主入口）
├── README-实施方案.md              # 本文件
├── mcp-trae-config.json           # Trae IDE MCP 配置
├── mcp-claude-desktop-config.json  # Claude Desktop MCP 配置
├── mcp-generic-config.json         # 通用 MCP 配置模板
├── post-commit                     # Git post-commit 钩子模板
├── pre-commit                      # Git pre-commit 钩子模板
└── vscode-codegraph/               # VSCode 插件项目（独立目录）
    ├── package.json
    ├── tsconfig.json
    ├── README.md
    └── src/
        ├── extension.ts
        ├── cli.ts
        └── panels/
            ├── SymbolSearchPanel.ts
            ├── ResultPanel.ts
            └── ExplorerPanel.ts
```

---

## 🎯 三大改进方案概览

| # | 方案 | 解决问题 | 文件 |
|---|------|----------|------|
| 1 | MCP 工作目录配置 | "No CodeGraph project is loaded" 错误 | 4 个 JSON 配置 |
| 2 | Git post-commit 钩子 | 提交后索引不同步 | 2 个 Bash 钩子 + 安装脚本 |
| 3 | VSCode 插件 | 编辑器内直接使用 CodeGraph | 完整插件项目 |

---

## 🚀 快速开始（3 步启用全部功能）

### 第 1 步：配置 MCP（1 分钟）

**方法 A：VSCode / Cursor / Trae IDE（项目级）**

```bash
# 1. 在项目根目录创建 .vscode 目录（如不存在）
mkdir -p .vscode

# 2. 由于 .vscode/mcp.json 是受保护文件,
#    复制 docs/03-开发工具/mcp-trae-config.json 的内容到:
#    %APPDATA%\Trae CN\User\mcp.json
```

**方法 B：直接使用通用配置**

```bash
# 复制 docs/03-开发工具/mcp-trae-config.json 的内容
# 替换 <PROJECT_ROOT> 为项目绝对路径
# 粘贴到对应 IDE 的 MCP 配置文件
```

### 第 2 步：安装 Git 钩子（30 秒）

```bash
# 一键安装
bash scripts/install-codegraph-hooks.sh

# 验证
ls -la .git/hooks/post-commit
# 应显示: -rwxr-xr-x ... post-commit
```

### 第 3 步：安装 VSCode 插件（2 分钟）

```bash
# 进入插件项目
cd vscode-codegraph

# 安装依赖
npm install

# 编译
npm run compile

# 调试（按 F5 在新窗口中打开 ZS Exchange 项目）
code .
# 然后按 F5 → 启动扩展开发主机
```

---

## 📋 详细使用说明

### 1. MCP 服务器工作目录配置

#### 问题描述
```
Error: No CodeGraph project is loaded for this session.
Searched for a .codegraph/ directory starting from: C:\Users\HUAWEI
```

#### 根因
MCP server 默认从用户家目录启动，无法自动识别项目根目录。

#### 解决方案（方案 B - 永久修复）

在 MCP server 启动参数中加 `--path <项目根目录>`。

**Trae IDE 配置文件** (`%APPDATA%\Trae CN\User\mcp.json`):
```json
{
  "mcpServers": {
    "codegraph": {
      "command": "codegraph",
      "args": [
        "serve",
        "--mcp",
        "--path",
        "D:\\3、系统项目开发\\trae_projects\\Stock Exchange dapp20260608-01"
      ]
    }
  }
}
```

**VSCode 项目级配置** (`.vscode/mcp.json`):
```json
{
  "servers": {
    "codegraph": {
      "type": "stdio",
      "command": "codegraph",
      "args": ["serve", "--mcp", "--path", "${workspaceFolder}"]
    }
  }
}
```

#### 验证方法
1. 重启 IDE
2. 在 AI 对话框中输入: "使用 codegraph_status 检查当前项目"
3. 应返回 324 文件 / 3156 节点（与项目匹配）
4. 不再需要传 `projectPath` 参数

#### 故障排查

| 现象 | 原因 | 解决 |
|------|------|------|
| "No CodeGraph project is loaded" | path 参数错误 | 确认路径用 `\\` 转义 |
| "command not found" | codegraph 未安装 | `npm i -g codegraph` |
| "permission denied" | hooks 不可执行 | `chmod +x .git/hooks/post-commit` |

---

### 2. Git post-commit 钩子

#### 功能
- 提交后自动运行 `codegraph sync .`
- 显示同步统计
- 错误时给出明确提示
- 不阻断 commit 流程

#### 行为示例
```bash
$ git commit -m "fix: 修复用户登录"
[CodeGraph] 检测到 3 个变更文件 (新增 0, 删除 0)
[CodeGraph] 正在增量同步 CodeGraph 索引...
[CodeGraph] Indexed 324 files
[CodeGraph] 1,901 nodes, 3,133 edges
[CodeGraph ✓] CodeGraph 同步完成
[main 1a2b3c4] fix: 修复用户登录
```

#### 团队一致性方案

**方案 A：使用 husky（推荐）**

```bash
# 安装
npm i -D husky
npx husky init

# 添加 post-commit
npx husky add .husky/post-commit "bash docs/03-开发工具/post-commit"
git add .husky/
git commit -m "chore: 添加 CodeGraph post-commit 钩子"
```

**方案 B：使用 lefthook**

```yaml
# lefthook.yml
post-commit:
  commands:
    codegraph-sync:
      run: bash docs/03-开发工具/post-commit
```

**方案 C：传统 Git hooks（当前方案）**

```bash
# 团队成员各自运行
bash scripts/install-codegraph-hooks.sh
```

#### 错误处理机制

钩子包含完善的错误处理：
- ✅ `codegraph` 未安装 → 警告但不影响 commit
- ✅ 同步失败 → 显示错误日志和恢复建议
- ✅ `.codegraph` 目录不存在 → 自动初始化
- ✅ 不阻断 commit（同步是辅助功能）

---

### 3. VSCode 插件

#### 功能矩阵

| 命令 | 快捷键 | 用途 |
|------|--------|------|
| `zsCodegraph.search` | `Ctrl+Shift+G` | 打开符号搜索面板 |
| `zsCodegraph.showDefinition` | `Ctrl+Shift+D` | 选中符号 → 显示完整定义 |
| `zsCodegraph.showCallers` | - | 选中符号 → 显示所有调用者 |
| `zsCodegraph.showCallees` | - | 选中符号 → 显示所有被调者 |
| `zsCodegraph.showImpact` | `Ctrl+Shift+I` | 选中符号 → 影响分析 |
| `zsCodegraph.explore` | - | 打开 Q&A 探索面板 |
| `zsCodegraph.status` | 点击状态栏 | 查看索引状态 |
| `zsCodegraph.sync` | - | 手动同步索引 |

#### 实时更新机制

```typescript
// 文件监听器 - 5 秒防抖
fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.{ts,tsx,js,jsx}');
fileWatcher.onDidChange(() => debouncedSync());
fileWatcher.onDidCreate(() => debouncedSync());
fileWatcher.onDidDelete(() => debouncedSync());
```

- 文件保存后 5 秒自动同步
- 状态栏实时显示索引状态
- 不影响编辑器性能（异步 + 防抖）

#### 交互式浏览

- 符号搜索面板：WebView 实时搜索
- 结果面板：JSON 高亮 + 树形结构
- 一键跳转到文件 + 高亮关键节点

#### 导出与分享

- 一键导出 JSON 结果
- 一键复制到剪贴板
- 分享当前 URL

#### 性能保证

- 异步操作，不阻塞主线程
- 5 秒防抖，避免频繁同步
- WebView 与编辑器分离
- 内存占用 < 50MB

---

## 🧪 完整测试流程

### 测试 1：MCP 工作目录识别

```bash
# 1. 配置 MCP 后重启 IDE
# 2. 在 AI 对话框输入:
"使用 codegraph_status 检查当前项目"
# 3. 期望输出: Files: 324, Nodes: 3156, Edges: 5113
# 4. 不应该出现 "No CodeGraph project is loaded"
```

### 测试 2：Git 钩子自动同步

```bash
# 1. 安装钩子
bash scripts/install-codegraph-hooks.sh

# 2. 修改任意 TS 文件
echo "// test" >> src/lib/logger.ts

# 3. 提交
git add .
git commit -m "test: 触发 post-commit"

# 4. 期望输出:
# [CodeGraph] 检测到 1 个变更文件
# [CodeGraph] 正在增量同步...
# [CodeGraph ✓] CodeGraph 同步完成
```

### 测试 3：VSCode 插件

```bash
# 1. 进入插件项目
cd vscode-codegraph
npm install
npm run compile

# 2. 用 VSCode 打开
code .

# 3. 按 F5 启动扩展开发主机
# 4. 在新窗口中打开 ZS Exchange 项目
# 5. 状态栏应显示: $(graph) CodeGraph: 324 文件

# 6. 选中任意符号按 Ctrl+Shift+G 测试搜索
```

---

## 📊 实施效果预估

| 改进项 | 实施前 | 实施后 |
|--------|--------|--------|
| AI 调用 CodeGraph 工具 | 每次需传 `projectPath` | 自动识别 ✅ |
| 索引新鲜度 | 手动运行 sync | 提交后自动同步 ✅ |
| 开发者体验 | 离开编辑器才能用 | 编辑器内直接用 ✅ |
| 团队一致性 | 各自为战 | 统一配置 ✅ |

---

## 🔧 维护指南

### 何时重建完整索引？

- 项目结构大改（如新增 src/ 子目录）
- 索引文件损坏（`.codegraph/codegraph.db` 损坏）
- 升级 codegraph CLI 大版本

```bash
codegraph index .    # 完整重建（~3秒）
```

### 何时该更新 MCP 配置？

- 项目路径改变
- codegraph CLI 升级
- 切换到新 IDE

### 如何禁用钩子？

```bash
# 临时禁用
mv .git/hooks/post-commit .git/hooks/post-commit.disabled

# 永久禁用
rm .git/hooks/post-commit
```

---

## 📞 问题反馈

如遇问题，按以下顺序排查：

1. **运行诊断**: `codegraph status .`
2. **查看日志**: IDE 输出面板 → CodeGraph
3. **重新初始化**: `rm -rf .codegraph && codegraph init .`
4. **提交 Issue**: 附上 `codegraph status` 输出

---

**实施完成时间**: 2026-06-09
**维护团队**: ZS Exchange DevOps
**下次审查**: 2026-07-09
