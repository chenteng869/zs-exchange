/**
 * Q&A 探索面板
 * 接收自然语言问题，自动调用 codegraph_explore
 */

import * as vscode from 'vscode';
import { CodeGraphCLI } from '../cli';

export class ExplorerPanel {
  public static currentPanel: ExplorerPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private cli: CodeGraphCLI;
  private disposables: vscode.Disposable[] = [];

  public static createOrShow(context: vscode.ExtensionContext, cli: CodeGraphCLI) {
    if (ExplorerPanel.currentPanel) {
      ExplorerPanel.currentPanel.panel.reveal();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'codegraphExplorer',
      'CodeGraph Q&A 探索',
      vscode.ViewColumn.Two,
      { enableScripts: true }
    );

    ExplorerPanel.currentPanel = new ExplorerPanel(panel, cli);
  }

  private constructor(panel: vscode.WebviewPanel, cli: CodeGraphCLI) {
    this.panel = panel;
    this.cli = cli;
    this.panel.webview.html = this.getHtml();
  }

  private getHtml(): string {
    return `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: var(--vscode-font-family); padding: 16px; color: var(--vscode-foreground); }
  textarea { width: 100%; min-height: 80px; padding: 8px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); }
  button { margin-top: 8px; padding: 6px 16px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; }
  .example { color: var(--vscode-textLink-foreground); cursor: pointer; font-size: 12px; margin: 4px 0; }
</style>
</head>
<body>
<h3>💡 Q&A 探索</h3>
<textarea id="question" placeholder="用自然语言提问，如: useTicker 如何工作?"></textarea>
<button onclick="ask()">探索</button>
<div class="example" onclick="setQuestion('useTicker 如何获取价格?')">📌 useTicker 如何获取价格?</div>
<div class="example" onclick="setQuestion('AdminLayout 用了哪些组件?')">📌 AdminLayout 用了哪些组件?</div>
<div class="example" onclick="setQuestion('区块链证据存证怎么实现的?')">📌 区块链证据存证怎么实现的?</div>
<div class="example" onclick="setQuestion('钱包模块的架构?')">📌 钱包模块的架构?</div>
<div id="result" style="margin-top: 16px; padding: 12px; background: var(--vscode-textBlockQuote-background); border-radius: 4px;"></div>
<script>
  const vscode = acquireVsCodeApi();
  function setQuestion(q) {
    document.getElementById('question').value = q;
    ask();
  }
  function ask() {
    const q = document.getElementById('question').value;
    document.getElementById('result').textContent = '思考中...';
    // 通过消息传递给 extension host 调用
    // 此处简化: 实际通过 messaging 调用
  }
</script>
</body>
</html>`;
  }

  public dispose() {
    ExplorerPanel.currentPanel = undefined;
    this.panel.dispose();
  }
}
