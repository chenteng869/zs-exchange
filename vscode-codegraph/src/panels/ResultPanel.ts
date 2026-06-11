/**
 * 结果展示面板
 * 在 WebView 中显示 CodeGraph 分析结果
 */

import * as vscode from 'vscode';

export class ResultPanel {
  public static currentPanel: ResultPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  public static createOrShow(title: string, data: any, kind: string) {
    const column = vscode.window.activeTextEditor?.viewColumn;
    if (ResultPanel.currentPanel) {
      ResultPanel.currentPanel.panel.reveal(column);
      ResultPanel.currentPanel.update(title, data, kind);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'codegraphResult',
      title,
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    ResultPanel.currentPanel = new ResultPanel(panel);
    ResultPanel.currentPanel.update(title, data, kind);
  }

  private constructor(panel: vscode.WebviewPanel) {
    this.panel = panel;
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  public update(title: string, data: any, kind: string) {
    this.panel.title = title;
    this.panel.webview.html = this.getHtml(title, data, kind);
  }

  private getHtml(title: string, data: any, kind: string): string {
    return `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: var(--vscode-font-family); padding: 16px; color: var(--vscode-foreground); background: var(--vscode-editor-background); }
  h1 { font-size: 16px; margin: 0 0 12px 0; }
  pre { background: var(--vscode-textBlockQuote-background); padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 12px; }
  .item { padding: 8px; border-left: 3px solid var(--vscode-textLink-foreground); margin: 4px 0; background: var(--vscode-editor-inactiveSelectionBackground); }
  .kind { color: var(--vscode-textLink-foreground); font-weight: 600; }
  .location { color: var(--vscode-textPreformat-foreground); font-family: var(--vscode-editor-font-family); font-size: 12px; }
  .actions { margin: 12px 0; }
  .actions button { margin-right: 8px; padding: 4px 12px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 4px; cursor: pointer; }
  .actions button:hover { background: var(--vscode-button-hoverBackground); }
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<div class="actions">
  <button onclick="exportResult()">导出 JSON</button>
  <button onclick="copyResult()">复制</button>
  <button onclick="shareResult()">分享</button>
</div>
<pre id="result">${escapeHtml(JSON.stringify(data, null, 2))}</pre>
<script>
  const data = ${JSON.stringify(data)};
  function exportResult() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'codegraph-result.json'; a.click();
  }
  function copyResult() {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  }
  function shareResult() {
    navigator.clipboard.writeText(window.location.href);
  }
</script>
</body>
</html>`;
  }

  public dispose() {
    ResultPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      this.disposables.pop()?.dispose();
    }
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]!));
}
