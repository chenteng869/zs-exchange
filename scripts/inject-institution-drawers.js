// inject-institution-drawers.js
// 把 tpl-institution-drawers.txt 注入到 PortalInstitution.tsx 的 export function PortalInstitution 之前
const fs = require('fs');
const path = require('path');

const ROOT = 'd:/3、系统项目开发/trae_projects/Stock Exchange dapp20260608-01';
const filePath = path.join(ROOT, 'src/components/portal-preview/PortalInstitution.tsx');
const tplPath = path.join(ROOT, 'scripts/tpl-institution-drawers.txt');

const original = fs.readFileSync(filePath, 'utf8');
const drawers = fs.readFileSync(tplPath, 'utf8');

const anchor = 'export function PortalInstitution()';
if (!original.includes(anchor)) {
  console.error('anchor not found: ' + anchor);
  process.exit(1);
}

// 切分：header + body
const idx = original.indexOf(anchor);
const header = original.substring(0, idx);
const body = original.substring(idx);

// 注入 drawers + 紧跟 anchor
const merged = header + drawers + '\n\n' + body;

fs.writeFileSync(filePath, merged, 'utf8');
console.log('OK - injected ' + drawers.length + ' bytes');
console.log('before size: ' + original.length);
console.log('after  size: ' + merged.length);
