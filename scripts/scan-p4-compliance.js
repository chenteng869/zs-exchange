// scan-p4-compliance.js
// P4 阶段合规禁词扫描脚本
// 仅扫描 P4 新增文件，不触碰 P3 历史 dirty

const fs = require('fs');
const path = require('path');

const ROOT = 'd:/3、系统项目开发/trae_projects/Stock Exchange dapp20260608-01';

const TARGETS = [
  // 配置层
  'src/components/portal-preview/core/config/p4-core-pages.ts',
  'src/components/portal-preview/core/config/p4-navigation.ts',
  'src/components/portal-preview/core/config/index.ts',
  // 模板层
  'src/components/portal-preview/core/templates/PortalLandingTemplate.tsx',
  'src/components/portal-preview/core/templates/MarketEntryTemplate.tsx',
  'src/components/portal-preview/core/templates/ProductEntryTemplate.tsx',
  'src/components/portal-preview/core/templates/AccountEntryTemplate.tsx',
  'src/components/portal-preview/core/templates/AssetEntryTemplate.tsx',
  'src/components/portal-preview/core/templates/HelpCenterTemplate.tsx',
  'src/components/portal-preview/core/templates/AnnouncementTemplate.tsx',
  'src/components/portal-preview/core/templates/LegalDisclosureTemplate.tsx',
  'src/components/portal-preview/core/templates/IndustryAssetTemplate.tsx',
  'src/components/portal-preview/core/templates/ErrorStateTemplate.tsx',
  'src/components/portal-preview/core/templates/index.ts',
  'src/components/portal-preview/core/index.ts',
  // 骨架页面层
  'src/app/portal-preview/markets/page.tsx',
  'src/app/portal-preview/trade/page.tsx',
  'src/app/portal-preview/assets/page.tsx',
  'src/app/portal-preview/account/page.tsx',
  'src/app/portal-preview/help/page.tsx',
  'src/app/portal-preview/announcements/page.tsx',
  'src/app/portal-preview/legal/page.tsx',
  'src/app/portal-preview/industry/page.tsx',
  'src/app/portal-preview/industry/fujian-laojiu-369/page.tsx',
  'src/app/portal-preview/industry/fujian-laojiu-369/risk-disclosure/page.tsx',
  // 规划文档
  'docs/front-portal/q05/p4-core-portal-skeleton-plan.md',
];

const FORBIDDEN = [
  '萨摩亚持牌', '萨摩亚牌照', 'MSA 监管', '已获萨摩亚监管许可',
  'Samoa licensed exchange', 'licensed in Samoa', 'regulated by Samoa',
  '全球合法运营', '已获得多国监管许可',
  '收益保障', '保本收益', '稳定收益', '年化收益',
  '资产绝对安全', '零风险', '稳赚', '官方背书', '监管认可',
  '香港持牌', '新加坡持牌', '迪拜持牌', '马耳他持牌', '美国持牌',
  '已取得多国监管', '持牌身份', '监管许可', '已获许可',
  // 老酒369 强禁词
  '保收益', '分红承诺', '升值空间', '必然升值', '投资回报',
  '持牌发行', '合规发行保证', '发币即上市', '上线必涨', '平台兜底',
  '承诺回购', '无风险认购', '酒资产稳赚', '保证可交易', '保证可提现',
];

const NEG_RE = /(不|无|避免|规避|严禁|拒绝|反对|不构成|不提供|不做|不含|禁止)/;

// 匹配 markdown 表格行：| 数字 | 文本 | 或 |---|---|
const TABLE_ROW_RE = /^\s*\|(\s*-+\s*\|)+\s*$|^\s*\|\s*\d+\s*\|\s*[^|]+\s*\|?\s*$/;

let hit = 0;
let totalLines = 0;
let tableRowSkips = 0;
for (const rel of TARGETS) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) {
    console.log('MISSING: ' + rel);
    continue;
  }
  const txt = fs.readFileSync(p, 'utf8');
  const lines = txt.split(/\r?\n/);
  totalLines += lines.length;
  let fileHit = 0;
  lines.forEach((line, i) => {
    // 跳过 markdown 表格行（禁词清单表格预期内）
    if (TABLE_ROW_RE.test(line)) {
      tableRowSkips++;
      return;
    }
    for (const word of FORBIDDEN) {
      if (line.includes(word)) {
        const ctx = line.trim();
        const isNeg = NEG_RE.test(ctx);
        if (!isNeg) {
          if (fileHit === 0) {
            console.log('\n=== ' + rel + ' (' + lines.length + ' lines)');
          }
          console.log('HIT  L' + (i + 1) + '  word="' + word + '"');
          console.log('     ' + ctx.substring(0, 200));
          fileHit++;
          hit++;
        }
      }
    }
  });
}
console.log('\n---');
console.log('Scanned files: ' + TARGETS.length);
console.log('Total lines: ' + totalLines);
console.log('Table-row skips (禁词清单表格，预期): ' + tableRowSkips);
console.log('TOTAL HITS: ' + hit);
process.exit(hit > 0 ? 1 : 0);
