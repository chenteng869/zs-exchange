/**
 * 符号搜索面板
 * 提供一个搜索输入框，实时显示 CodeGraph 搜索结果
 */

import * as vscode from 'vscode';
import { CodeGraphCLI } from '../cli';

export class SymbolSearchPanel {
  public static currentPanel: SymbolSearchPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private cli: CodeGraphCLI;
  private disposables: vscode.Disposable[] = [];

  public static createOrShow(context: vscode.ExtensionContext, cli: CodeGraphCLI) {
    if (SymbolSearchPanel.currentPanel) {
      SymbolSearchPanel.currentPanel.panel.reveal();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'codegraphSearch',
      'CodeGraph 符号搜索',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    SymbolSearchPanel.currentPanel = new SymbolSearchPanel(panel, cli);
  }

  private constructor(panel: vscode.WebviewPanel, cli: CodeGraphCLI) {
    this.panel = panel;
    this.cli = cli;
    this.panel.webview.html = this.getHtml();
    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        if (message.type === 'search') {
          await this.search(message.query);
        } else if (message.type === 'openFile') {
          const { file, line } = message;
          const doc = await vscode.workspace.openTextDocument(file);
          const editor = await vscode.window.showTextDocument(doc);
          const position = new vscode.Position(line - 1, 0);
          editor.revealRange(new vscode.Range(position, position));
        }
      },
      null,
      this.disposables
    );
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  private async search(query: string) {
    if (!query) return;
    try {
      const result = await this.cli.query(query);
      this.panel.webview.postMessage({
        type: 'searchResult',
        query,
        data: result,
      });
    } catch (e: any) {
      this.panel.webview.postMessage({
        type: 'error',
        message: e.message,
      });
    }
  }

  private getHtml(): string {
    return `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: var(--vscode-font-family); padding: 16px; color: var(--vscode-foreground); background: var(--vscode-editor-background); }
  input { width: 100%; padding: 8px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 4px; }
  .result { margin: 8px 0; padding: 8px; border-left: 3px solid var(--vscode-textLink-foreground); background: var(--vscode-editor-inactiveSelectionBackground); cursor: pointer; }
  .result:hover { background: var(--vscode-list-hoverBackground); }
  .kind { color: var(--vscode-textLink-foreground); font-weight: 600; font-size: 12px; }
  .name { font-family: var(--vscode-editor-font-family); font-size: 14px; }
  .location { color: var(--vscode-descriptionForeground); font-size: 11px; margin-top: 4px; }
  .empty { color: var(--vscode-descriptionForeground); text-align: center; padding: 20px; }
</style>
</head>
<body>
<h3>🔍 符号搜索</h3>
<input type="text" id="searchBox" placeholder="输入符号名称..." autofocus />
<div id="results"></div>
<script>
  const vscode = acquireVsCodeApi();
  let debounceTimer;
  
  document.getElementById('searchBox').addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value;
    debounceTimer = setTimeout(() => {
      vscode.postMessage({ type: 'search', query });
    }, 200);
  });

  window.addEventListener('message', (e) => {
    const msg = e.data;
    const div = document.getElementById('results');
    if (msg.type === 'searchResult') {
      if (msg.data.items.length === 0) {
        div.innerHTML = '<div class="empty">未找到匹配符号</div>';
        return;
      }
      div.innerHTML = msg.data.items.map((item) => \`
        <div class="result" onclick="openFile('\${item.location.file}', \${item.location.line})">
          <div class="kind">\${item.kind}</div>
          <div class="name">\${item.name}</div>
          <div class="location">\${item.location.file}:\${item.location.line}</div>
        </div>
      \`).join('');
    } else if (msg.type === 'error') {
      div.innerHTML = '<div class="empty">错误: ' + msg.message + '</div>';
    }
  });

  function openFile(file, line) {
    vscode.postMessage({ type: 'openFile', file, line });
  }
</script>
</body>
</html>`;
  }

  public dispose() {
    SymbolSearchPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      this.disposables.pop()?.dispose();
    }
  }
}
