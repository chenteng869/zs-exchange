// gen-institution-step3.js - P3.47 注入 12 Tabs（从 tpl 文件读取，避免 Node 模板字符串解析）

const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'portal-preview', 'PortalInstitution.tsx');
const tplPath = path.join(process.cwd(), 'scripts', 'tpl-institution-tabs.txt');

const original = fs.readFileSync(filePath, 'utf8');
const tplContent = fs.readFileSync(tplPath, 'utf8');

const newContent = original + '\n' + tplContent;
fs.writeFileSync(filePath, newContent, 'utf8');

const bytes = Buffer.byteLength(newContent, 'utf8');
const lines = newContent.split('\n').length;
console.log('OK step3 written');
console.log('  Bytes:', bytes);
console.log('  Lines:', lines);
