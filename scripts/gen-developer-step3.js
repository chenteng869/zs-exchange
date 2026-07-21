// gen-developer-step3.js
// 把 tpl-developer-tabs.txt 注入到 PortalDeveloper.tsx 的 export function PortalDeveloper 之前
const fs = require('fs');
const path = require('path');

const ROOT = 'd:/3、系统项目开发/trae_projects/Stock Exchange dapp20260608-01';
const filePath = path.join(ROOT, 'src/components/portal-preview/PortalDeveloper.tsx');
const tplPath = path.join(ROOT, 'scripts/tpl-developer-tabs.txt');

const original = fs.readFileSync(filePath, 'utf8');
const tabs = fs.readFileSync(tplPath, 'utf8');

const anchor = 'export function PortalDeveloper()';
if (!original.includes(anchor)) {
  console.error('anchor not found');
  process.exit(1);
}

const idx = original.indexOf(anchor);
const header = original.substring(0, idx);
const body = original.substring(idx);

const merged = header + tabs + '\n\n' + body;

fs.writeFileSync(filePath, merged, 'utf8');
console.log('OK tabs - injected ' + tabs.length + ' bytes');
console.log('before: ' + original.length);
console.log('after:  ' + merged.length);
