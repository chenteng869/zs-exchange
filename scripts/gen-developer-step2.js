// gen-developer-step2.js
// 把 tpl-developer-data.txt 注入到 PortalDeveloper.tsx 的 MOCK_PLACEHOLDER 处
const fs = require('fs');
const path = require('path');

const ROOT = 'd:/3、系统项目开发/trae_projects/Stock Exchange dapp20260608-01';
const filePath = path.join(ROOT, 'src/components/portal-preview/PortalDeveloper.tsx');
const tplPath = path.join(ROOT, 'scripts/tpl-developer-data.txt');

const original = fs.readFileSync(filePath, 'utf8');
const data = fs.readFileSync(tplPath, 'utf8');

const anchor = "const MOCK_PLACEHOLDER = '__MOCK_DATA_PLACEHOLDER__';";
if (!original.includes(anchor)) {
  console.error('anchor not found');
  process.exit(1);
}

const merged = original.replace(anchor, data);

fs.writeFileSync(filePath, merged, 'utf8');
console.log('OK - injected ' + data.length + ' bytes');
console.log('before: ' + original.length);
console.log('after:  ' + merged.length);
