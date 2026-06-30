/**
 * 一键给所有动态路由页加 generateStaticParams stub
 *
 *  解决 output: 'export' 模式下没有 generateStaticParams 会失败
 *  用法：node scripts/inject-static-params.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOTS = ['src/app/h5', 'src/app/admin', 'src/app/trade'];

function findDynamicRoutes(rootDir) {
  const out = [];
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name.startsWith('[')) {
          // 找 page.tsx
          const pageFile = path.join(full, 'page.tsx');
          if (fs.existsSync(pageFile)) out.push(pageFile);
        }
        walk(full);
      }
    }
  }
  if (fs.existsSync(rootDir)) walk(rootDir);
  return out;
}

const STUB =
  "\n\n// 静态导出兼容：return 1 占位 ID，真实数据走客户端 fetch\nexport function generateStaticParams() {\n  return [{ id: 'demo' }];\n}\n";

let count = 0;
for (const root of ROOTS) {
  const pages = findDynamicRoutes(root);
  for (const p of pages) {
    const content = fs.readFileSync(p, 'utf8');
    if (content.includes('generateStaticParams')) continue;
    fs.appendFileSync(p, STUB);
    count++;
    console.log(`✓ ${p}`);
  }
}
console.log(`\n✅ ${count} 个动态路由已注入 generateStaticParams stub`);
