// scan-institution-compliance.js
const fs = require('fs');
const path = require('path');

const ROOT = 'd:/3、系统项目开发/trae_projects/Stock Exchange dapp20260608-01';
const targets = [
  'src/components/portal-preview/PortalInstitution.tsx',
  'src/app/portal-preview/institution/page.tsx',
];

const FORBIDDEN = [
  '萨摩亚持牌', '萨摩亚牌照', '持牌交易所', '已取得监管', '已获得监管',
  'DSAEX-2024-001', 'MSA 监管', 'MSA 牌照', '持牌', '牌照',
  '承诺收益', '保本', '绝对安全', '资产保证', '零风险',
  '受监管保护', '已受监管', '受当地监管', '已获当地监管', '全球合法',
  '香港持牌', '新加坡持牌', '迪拜持牌', '马耳他持牌', '美国持牌',
  '已取得多国监管', '持牌身份', '监管许可', '已获许可',
];

const NEG_RE = /(不|无|避免|规避|严禁|拒绝|反对|不构成|不提供|不做|不含)/;

let hit = 0;
for (const rel of targets) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) { console.log('MISSING: ' + rel); continue; }
  const txt = fs.readFileSync(p, 'utf8');
  const lines = txt.split(/\r?\n/);
  console.log('=== ' + rel + ' total lines: ' + lines.length);
  lines.forEach((line, i) => {
    for (const word of FORBIDDEN) {
      if (line.includes(word)) {
        const ctx = line.trim();
        const isNeg = NEG_RE.test(ctx);
        if (!isNeg) {
          console.log('HIT  L' + (i + 1) + '  word="' + word + '"');
          console.log('     ' + ctx.substring(0, 200));
          hit++;
        } else {
          console.log('OK   L' + (i + 1) + '  (neg)  word="' + word + '"');
        }
      }
    }
  });
}
console.log('---');
console.log('TOTAL HITS: ' + hit);
process.exit(hit > 0 ? 1 : 0);
