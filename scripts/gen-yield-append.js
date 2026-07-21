// gen-yield-append.js - 追加 Tab/Drawer 组件到 PortalYield.tsx
const fs = require('fs');
const path = require('path');

const ROOT = 'd:/3、系统项目开发/trae_projects/Stock Exchange dapp20260608-01';
const target = path.join(ROOT, 'src/components/portal-preview/PortalYield.tsx');

const files = [
  'scripts/tpl-yield-tabs1.txt',
  'scripts/tpl-yield-tabs2.txt',
  'scripts/tpl-yield-tabs3.txt',
  'scripts/tpl-yield-drawers.txt',
];

let src = fs.readFileSync(target, 'utf8');

// 移除已存在的 PortalYield 主组件后的所有额外内容（仅保留到 PortalYield 的结束 `}`）
// 找到 `export function PortalYield` 之后的最后 `}\n}` 闭合位置
const portalExportIdx = src.indexOf('export function PortalYield()');
if (portalExportIdx === -1) {
  console.log('ERR: cannot find PortalYield');
  process.exit(1);
}

// 找到 PortalYield 闭合
let depth = 0;
let endIdx = -1;
let started = false;
for (let i = portalExportIdx; i < src.length; i++) {
  const c = src[i];
  if (c === '{') { depth++; started = true; }
  else if (c === '}') {
    depth--;
    if (started && depth === 0) { endIdx = i + 1; break; }
  }
}

if (endIdx === -1) {
  console.log('ERR: cannot find PortalYield end');
  process.exit(1);
}

const portalPart = src.substring(0, endIdx);
let tail = src.substring(endIdx);

// 如果 tail 已有追加内容（包含 Tab / Drawer），则去掉
if (tail.includes('function OverviewTab') || tail.includes('function FarmDrawer')) {
  // 截断 tail 到第一个 `function ` 之前（保留末尾换行）
  const fnIdx = tail.indexOf('function ');
  if (fnIdx > 0) tail = tail.substring(0, fnIdx);
  console.log('CLEAN: removed existing appended functions');
}

let appended = '';
for (const rel of files) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) { console.log('MISSING: ' + rel); continue; }
  const txt = fs.readFileSync(p, 'utf8');
  appended += '\n' + txt + '\n';
}

const final = portalPart + '\n' + tail + appended;
fs.writeFileSync(target, final, 'utf8');

const size = fs.statSync(target).size;
const lines = final.split('\n').length;
console.log('OK: appended ' + files.length + ' template files');
console.log('Total lines: ' + lines);
console.log('Total size: ' + (size / 1024).toFixed(1) + ' KB');
