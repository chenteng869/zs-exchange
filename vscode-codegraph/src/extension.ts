/**
 * ZS CodeGraph - VSCode 插件主入口
 *
 * 中萨数字科技交易所
 * ZS Exchange - CodeGraph 集成
 */

import * as vscode from 'vscode';
import { CodeGraphCLI } from './cli';
import { SymbolSearchPanel } from './panels/SymbolSearchPanel';
import { ResultPanel } from './panels/ResultPanel';
import { ExplorerPanel } from './panels/ExplorerPanel';

let cli: CodeGraphCLI;
let statusBarItem: vscode.StatusBarItem;
let fileWatcher: vscode.FileSystemWatcher | undefined;

export function activate(context: vscode.ExtensionContext) {
  console.log('ZS CodeGraph 插件已激活');

  // 初始化 CLI 客户端
  const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspacePath) {
    vscode.window.showWarningMessage('ZS CodeGraph: 请先打开一个工作区');
    return;
  }

  cli = new CodeGraphCLI(workspacePath);

  // 创建状态栏
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.command = 'zsCodegraph.status';
  context.subscriptions.push(statusBarItem);
  updateStatusBar();

  // 注册命令
  context.subscriptions.push(
    vscode.commands.registerCommand('zsCodegraph.search', () => SymbolSearchPanel.createOrShow(context, cli)),
    vscode.commands.registerCommand('zsCodegraph.showDefinition', (uri?: vscode.Uri) => showDefinition(uri)),
    vscode.commands.registerCommand('zsCodegraph.showCallers', (uri?: vscode.Uri) => showCallers(uri)),
    vscode.commands.registerCommand('zsCodegraph.showCallees', (uri?: vscode.Uri) => showCallees(uri)),
    vscode.commands.registerCommand('zsCodegraph.showImpact', (uri?: vscode.Uri) => showImpact(uri)),
    vscode.commands.registerCommand('zsCodegraph.explore', () => ExplorerPanel.createOrShow(context, cli)),
    vscode.commands.registerCommand('zsCodegraph.status', () => showStatus()),
    vscode.commands.registerCommand('zsCodegraph.sync', () => syncIndex())
  );

  // 启动文件监听器（自动同步）
  startFileWatcher(context);

  // 启动时检查
  checkCodeGraphOnStartup();
}

export function deactivate() {
  fileWatcher?.dispose();
  statusBarItem?.dispose();
}

/**
 * 更新状态栏
 */
async function updateStatusBar() {
  try {
    const status = await cli.status();
    if (status.indexed) {
      statusBarItem.text = `$(graph) CodeGraph: ${status.files} 文件`;
      statusBarItem.tooltip = `${status.nodes} 节点 / ${status.edges} 边 - 点击查看详情`;
      statusBarItem.backgroundColor = undefined;
    } else {
      statusBarItem.text = `$(alert) CodeGraph: 未索引`;
      statusBarItem.tooltip = '点击初始化 CodeGraph';
    }
    statusBarItem.show();
  } catch (e) {
    statusBarItem.text = `$(alert) CodeGraph: 错误`;
    statusBarItem.tooltip = String(e);
    statusBarItem.show();
  }
}

/**
 * 启动文件监听器
 */
function startFileWatcher(context: vscode.ExtensionContext) {
  fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.{ts,tsx,js,jsx}');

  let syncTimer: NodeJS.Timeout | undefined;
  const debouncedSync = () => {
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(async () => {
      await syncIndex();
    }, 5000); // 5 秒防抖
  };

  fileWatcher.onDidChange(debouncedSync);
  fileWatcher.onDidCreate(debouncedSync);
  fileWatcher.onDidDelete(debouncedSync);

  context.subscriptions.push(fileWatcher);
}

/**
 * 显示定义
 */
async function showDefinition(uri?: vscode.Uri) {
  const symbol = getSelectedSymbol(uri);
  if (!symbol) {
    vscode.window.showInformationMessage('请先选中一个符号');
    return;
  }

  const node = await cli.node(symbol);
  ResultPanel.createOrShow(`📍 定义: ${symbol}`, node, 'definition');
}

/**
 * 显示调用者
 */
async function showCallers(uri?: vscode.Uri) {
  const symbol = getSelectedSymbol(uri);
  if (!symbol) {
    return;
  }

  const callers = await cli.callers(symbol);
  ResultPanel.createOrShow(`⬅️  ${symbol} 的调用者`, callers, 'callers');
}

/**
 * 显示被调者
 */
async function showCallees(uri?: vscode.Uri) {
  const symbol = getSelectedSymbol(uri);
  if (!symbol) {
    return;
  }

  const callees = await cli.callees(symbol);
  ResultPanel.createOrShow(`➡️  ${symbol} 调用了`, callees, 'callees');
}

/**
 * 显示影响分析
 */
async function showImpact(uri?: vscode.Uri) {
  const symbol = getSelectedSymbol(uri);
  if (!symbol) {
    return;
  }

  const impact = await cli.impact(symbol);
  ResultPanel.createOrShow(`💥  ${symbol} 的影响范围`, impact, 'impact');
}

/**
 * 显示状态
 */
async function showStatus() {
  const status = await cli.status();
  const msg = `CodeGraph 状态:
• 文件: ${status.files}
• 节点: ${status.nodes}
• 边: ${status.edges}
• 数据库: ${status.dbSize}
• 后端: ${status.backend}
• 语言: ${status.languages?.join(', ') || '-'}`;

  const action = await vscode.window.showInformationMessage(msg, '同步索引', '查看详情');
  if (action === '同步索引') {
    await syncIndex();
  } else if (action === '查看详情') {
    updateStatusBar();
  }
}

/**
 * 同步索引
 */
async function syncIndex() {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'CodeGraph 同步中...',
      cancellable: false,
    },
    async () => {
      try {
        const result = await cli.sync();
        vscode.window.showInformationMessage(`✅ 同步完成: ${result.filesIndexed} 文件`);
        await updateStatusBar();
      } catch (e: any) {
        vscode.window.showErrorMessage(`❌ 同步失败: ${e.message}`);
      }
    }
  );
}

/**
 * 获取选中的符号
 */
function getSelectedSymbol(uri?: vscode.Uri): string | undefined {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return undefined;

  const selection = editor.selection;
  if (selection.isEmpty) {
    // 尝试获取光标处的单词
    const wordRange = editor.document.getWordRangeAtPosition(selection.active);
    if (wordRange) {
      return editor.document.getText(wordRange);
    }
    return undefined;
  }
  return editor.document.getText(selection);
}

/**
 * 启动时检查
 */
async function checkCodeGraphOnStartup() {
  try {
    const status = await cli.status();
    if (!status.indexed) {
      const action = await vscode.window.showInformationMessage(
        'CodeGraph 索引未初始化,是否现在初始化?',
        '初始化',
        '稍后'
      );
      if (action === '初始化') {
        await vscode.window.withProgress(
          { location: vscode.ProgressLocation.Notification, title: '初始化 CodeGraph...' },
          async () => {
            await cli.init();
            await updateStatusBar();
            vscode.window.showInformationMessage('✅ CodeGraph 初始化完成');
          }
        );
      }
    }
  } catch (e) {
    // 静默失败,稍后由状态栏提示
  }
}
