// scan-p5-compliance.js
// P5 阶段合规禁词扫描脚本
// 复用 P4 扫描器全部 FORBIDDEN 列表，扩展 P5 新增禁词
// 仅扫描 P5.0 新增文件，不触碰 P3 / P4 历史 dirty

const fs = require('fs');
const path = require('path');

const ROOT = 'd:/3、系统项目开发/trae_projects/Stock Exchange dapp20260608-01';

const TARGETS = [
  // P5.0 规划文档
  'docs/front-portal/q05/p5-core-product-matrix-plan.md',
  // P5.0 配置层
  'src/components/portal-preview/core/config/p5-core-pages.ts',
  'src/components/portal-preview/core/config/p5-navigation.ts',
  'src/components/portal-preview/core/config/index.ts',
  // 自身（扫描器本体）
  'scripts/scan-p5-compliance.js',
];

// 复用 P4 全部禁词
const P4_FORBIDDEN = [
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

// P5 新增禁词（6 类扩展）
const P5_FORBIDDEN_EXT = [
  // 1. 产品页收益承诺类
  '稳赚', '保本', '保收益', '收益保障', '固定收益', '零风险', '无风险',
  '必涨', '百倍', '千倍', '暴富',
  // 2. 英文版禁词
  'guaranteed return', 'risk-free', 'principal guaranteed',
  // 3. 监管误导类
  'licensed exchange', 'regulated exchange', 'Samoa licensed', 'MSA regulated',
  'guaranteed liquidity',
  // 4. 发币/认购/锁仓风险用语
  'official token sale', '内幕额度', '优先认购稳赚', '锁仓稳赚',
  '发行即涨', '上线即涨',
  // 5. 资产绝对化
  '资产绝对安全', '官方背书', '监管认可', '监管许可',
  // 6. 福建老酒369 P5 扩展
  '酒资产稳赚', '老酒投资稳赚', '369 发币收益', '认购即收益',
  '老酒保值增值承诺', '酒链金融产品', '酒类证券化收益', '酒票收益权',
  '酒资产固定回报', '保底回购收益', '代币化酒资产稳赚',
  '福建老酒369 监管背书', '福建老酒369 官方保收益',
  '福建老酒369 上线即涨', '福建老酒369 锁仓返利',
];

const FORBIDDEN = [...new Set([...P4_FORBIDDEN, ...P5_FORBIDDEN_EXT])];

const NEG_RE = /(不|无|避免|规避|严禁|拒绝|反对|不构成|不提供|不做|不含|禁止)/;

// 匹配 markdown 表格行：
// 1. 分隔符行 |---|...| 或 | --- | --- |
// 2. 表头/数据行：以 | 开头并含有 | 分隔（覆盖 | 类别 | 禁词示例 |、| 数字 | 文本 | 等）
// 要求行内至少含 2 个 | 才能算 markdown 表格，避免误判代码中单个 | 字符
const TABLE_ROW_RE = /^\s*\|(\s*:?-+:?\s*\|)+\s*$|^\s*\|(?:[^|\n]*\|){2,}/;

// 匹配 markdown 文档中以 / 分隔的禁词列表行
// 例：酒资产稳赚 / 老酒投资稳赚 / 369 发币收益 / 认购即收益 /
// 例：福建老酒369 上线即涨 / 福建老酒369 锁仓返利
// 特征：行内含至少 1 个 /，且不包含 |（避免与表格行冲突）
const SLASH_LIST_RE = /^\s*[^|\n]*\/[^|\n]*\/?\s*$/;

// 匹配 JS / TS 文件中的禁词字符串数组定义行
// 例：'全球合法运营', '已获得多国监管许可',
// 例：'guaranteed liquidity',
// 特征：整行主要由 'xxx', 组成，可能以 [ ] 包围
const JS_ARRAY_LINE_RE = /^\s*(?:'[^']*'\s*,\s*)*'[^']*'\s*,?\s*\]?\s*,\s*$/;

let hit = 0;
let totalLines = 0;
let tableRowSkips = 0;
let slashListSkips = 0;
let jsArrayLineSkips = 0;
let p4ForbidHits = 0;
let p5ForbidHits = 0;
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
    // 跳过 / 分隔的禁词列表行
    if (SLASH_LIST_RE.test(line)) {
      slashListSkips++;
      return;
    }
    // 跳过 JS / TS 文件中的禁词字符串数组定义行
    if (JS_ARRAY_LINE_RE.test(line)) {
      jsArrayLineSkips++;
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
          const tag = P5_FORBIDDEN_EXT.includes(word) ? 'P5' : 'P4';
          console.log('HIT [' + tag + '] L' + (i + 1) + '  word="' + word + '"');
          console.log('     ' + ctx.substring(0, 200));
          fileHit++;
          hit++;
          if (tag === 'P5') p5ForbidHits++;
          else p4ForbidHits++;
        }
      }
    }
  });
}
console.log('\n---');
console.log('Scanned files: ' + TARGETS.length);
console.log('Total lines: ' + totalLines);
console.log('Table-row skips (禁词清单表格，预期): ' + tableRowSkips);
console.log('Slash-list skips ( / 分隔禁词列表，预期): ' + slashListSkips);
console.log('JS-array line skips ( 禁词数组定义，预期): ' + jsArrayLineSkips);
console.log('P4-inherited forbidden hits: ' + p4ForbidHits);
console.log('P5-extended forbidden hits: ' + p5ForbidHits);
console.log('TOTAL HITS: ' + hit);
process.exit(hit > 0 ? 1 : 0);
