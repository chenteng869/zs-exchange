import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const SRC_DIR = join(ROOT_DIR, 'src');

// ── 检查1: 萨摩亚合规 — 禁止词汇 (CRITICAL) ──
const FORBIDDEN_WORDS = ['中国-中东', 'China-Middle East', '中东合规', '中东框架'];

// ── 检查2: 品牌名称存在性 (REQUIRED) ──
const REQUIRED_BRAND_WORDS = ['中萨数字科技', 'SinoSamoa', 'ZS Exchange', '萨摩亚'];

// ── 检查3: 品牌色系 (允许的hex颜色) ──
const ALLOWED_COLORS = new Set([
  '#7C3AED', // 品牌主色 (purple)
  '#0B0F19', // 深色背景
  '#10B981', // 绿色 (涨/成功)
  '#D4AF37', // 金色
  '#3B82F6', // 蓝色
  '#F59E0B', // 琥珀/警告
  '#111827', // slate-900
  '#1E293B', // slate-800
  '#334155', // slate-700
  '#F1F5F9', // slate-100
  '#94A3B8', // slate-400
  '#64748B', // slate-500
  '#EF4444', // 红色 (跌/错误)
]);

// ── 工具函数 ──

/**
 * 递归收集 src/ 下所有 .ts / .tsx 文件
 */
function collectSourceFiles(dir, baseDir = dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.next') {
      files.push(...collectSourceFiles(fullPath, baseDir));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * 在文件内容中搜索关键词，返回 [{ file, line, match }] 列表
 */
function searchInFile(filePath, patterns) {
  const results = [];
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    for (const pattern of patterns) {
      const regex = new RegExp(
        pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'g'
      );
      lines.forEach((line, i) => {
        if (regex.test(line)) {
          results.push({
            file: relative(ROOT_DIR, filePath),
            line: i + 1,
            match: pattern,
            text: line.trim().slice(0, 100),
          });
        }
      });
    }
  } catch {
    // 跳过无法读取的文件
  }
  return results;
}

/**
 * 搜索 hex 颜色模式，排除品牌色系
 */
function auditHexColors(filePath) {
  const results = [];
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    // 匹配 #xxxxxx 或 #xxx 格式的颜色
    const hexRegex = /#[0-9a-fA-F]{3}\b|[0-9a-fA-F]{6}\b/g;
    lines.forEach((line, i) => {
      let m;
      while ((m = hexRegex.exec(line)) !== null) {
        const color = m[0].toUpperCase();
        // 标准化为6位
        const normalized = color.length === 4
          ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`.toUpperCase()
          : color;
        if (!ALLOWED_COLORS.has(normalized)) {
          results.push({
            file: relative(ROOT_DIR, filePath),
            line: i + 1,
            color: m[0],
            normalized,
            text: line.trim().slice(0, 120),
          });
        }
      }
    });
  } catch {
    // skip
  }
  return results;
}

// ── 主逻辑 ──

function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   ZS Exchange QA Gate v1.0                   ║');
  console.log('╠══════════════════════════════════════════════╣');

  const sourceFiles = collectSourceFiles(SRC_DIR);
  console.log(`║ 扫描文件数: ${sourceFiles.length.toString().padStart(4)}                           ║`);

  let overallPass = true;

  // ═══ 检查1: 合规性检查 (CRITICAL) ═══
  const complianceIssues = [];
  for (const file of sourceFiles) {
    const hits = searchInFile(file, FORBIDDEN_WORDS);
    complianceIssues.push(...hits);
  }

  if (complianceIssues.length === 0) {
    console.log('║ [CRITICAL] 合规性检查: PASS                  ║');
  } else {
    overallPass = false;
    console.log('║ [CRITICAL] 合规性检查: FAIL                  ║');
    for (const issue of complianceIssues) {
      console.log(`║   ✗ ${issue.file}:${issue.line} → "${issue.match}"`);
    }
  }

  // ═══ 检查2: 品牌名检查 (REQUIRED) ═══
  const brandResults = {};
  for (const word of REQUIRED_BRAND_WORDS) {
    brandResults[word] = [];
  }
  for (const file of sourceFiles) {
    for (const word of REQUIRED_BRAND_WORDS) {
      const hits = searchInFile(file, [word]);
      brandResults[word].push(...hits);
    }
  }

  const missingBrands = Object.entries(brandResults).filter(([, hits]) => hits.length === 0);
  if (missingBrands.length === 0) {
    console.log('║ [REQUIRED]  品牌名检查: PASS                  ║');
  } else {
    console.log('║ [REQUIRED]  品牌名检查: WARN                  ║');
    for (const [word] of missingBrands) {
      console.log(`║   ⚠ 缺少品牌词: "${word}" (0处出现)`);
    }
  }

  // ═══ 检查3: 颜色审计 (ADVISORY) ═══
  const colorWarnings = [];
  for (const file of sourceFiles) {
    const warnings = auditHexColors(file);
    colorWarnings.push(...warnings);
  }

  if (colorWarnings.length === 0) {
    console.log('║ [ADVISORY]  颜色审计:   CLEAN                ║');
  } else {
    console.log(`║ [ADVISORY]  颜色审计:   ${colorWarnings.length} warnings         ║`);
    // 只显示前20条避免刷屏
    const display = colorWarnings.slice(0, 20);
    for (const w of display) {
      console.log(`║   ⚠ ${w.file}:${w.line} → color=${w.color}`);
    }
    if (colorWarnings.length > 20) {
      console.log(`║   ... 及其他 ${colorWarnings.length - 20} 条警告`);
    }
  }

  // ═══ 最终结果 ═══
  console.log('╠══════════════════════════════════════════════╣');

  const finalStatus = overallPass ? 'PASS' : 'FAIL';
  const statusIcon = overallPass ? '✅' : '❌';
  console.log(`║ FINAL RESULT: ${finalStatus}                     ${statusIcon}  ║`);
  console.log('╚══════════════════════════════════════════════╝');

  process.exit(overallPass ? 0 : 1);
}

main();
