/**
 * mock-cleanup-rule（2026-07-18 真实化底座）
 *
 * 目标：为后续真实化批次提供 mock / placeholder 检测 helper
 *   - 提供禁词清单
 *   - 提供 detectInSource() 检测函数
 *   - 提供 scanFiles() 扫描入口（不自动运行）
 *   - 提供 generateReport() 输出报告
 *
 * ⚠️ 重要约束（Q04-3.11.b）：
 *   - 不接入 eslint
 *   - 不接入 pre-commit
 *   - 不阻断 build
 *   - 不全仓自动扫描
 *   - 仅作为 helper 存在，由真实化批次手动调用
 *
 * 硬约束（Q04-3.11.b 范围）：
 *   - 不引入新依赖
 *   - 不修改既有 lint/pre-commit 配置
 *   - 不强制任何 page 检测
 */

// =============================================================================
// 禁词清单
// =============================================================================

/**
 * 真实化禁词：检测到时表示该 page.tsx 仍处于 mock / placeholder 状态
 */
export const MOCK_FORBIDDEN_PATTERNS = {
  /**
   * 随机数 / 假数据源
   */
  randomData: {
    patterns: [
      /Math\.random\s*\(/,
      /Math\.floor\s*\(\s*Math\.random/,
    ],
    category: 'random-data',
    severity: 'high',
    description: '使用 Math.random() 生成数据，应改为真实 API/DB',
  },
  timestampRandom: {
    patterns: [
      /Date\.now\s*\(\s*\)/,
      /new Date\(\)\.getTime/,
    ],
    category: 'time-source',
    severity: 'medium',
    description: '使用 Date.now() 作为数据源，可能导致 hydration 不一致',
  },
  setDataEmpty: {
    patterns: [
      /setData\s*\(\s*\[\s*\]\s*\)/,
      /setData\s*\(\s*null\s*\)/,
    ],
    category: 'placeholder',
    severity: 'high',
    description: 'setData([]) 初始化空数据，应使用 useEffect 加载真实数据',
  },
  /**
   * 消息占位
   */
  messageInfoPlaceholder: {
    patterns: [
      /message\.info\s*\(\s*['"`][^'"`]*?(占位|开发中|TODO|todo|待实现|敬请期待|占位实现|mock)['"`]/i,
      /antdMessage\.info\s*\(\s*['"`][^'"`]*?(占位|开发中|TODO|todo|待实现|敬请期待|占位实现|mock)['"`]/i,
    ],
    category: 'message-placeholder',
    severity: 'medium',
    description: 'message.info 占位文案，应移除或改为真实业务提示',
  },
  /**
   * 硬编码 mock 标识
   */
  mockIdentifer: {
    patterns: [
      /\bmock[_-]?(data|user|order|product|list|response|response|api)\b/i,
      /\bfake[_-]?(data|user|order|product|list|response|api)\b/i,
      /\bsample[_-]?(data|user|order|product|list|response|api)\b/i,
      /\bdemo[_-]?(data|user|order|product|list|response|api)\b/i,
    ],
    category: 'mock-identifier',
    severity: 'high',
    description: '硬编码 mock/fake/sample/demo 标识符',
  },
  /**
   * 待办标识
   */
  todoMarker: {
    patterns: [
      /\bTODO\b/,
      /\bFIXME\b/,
      /\bXXX\b/,
      /待补全/,
      /待完善/,
    ],
    category: 'todo-marker',
    severity: 'low',
    description: 'TODO/FIXME 标记',
  },
} as const;

export type MockForbiddenKey = keyof typeof MOCK_FORBIDDEN_PATTERNS;
export type MockSeverity = 'low' | 'medium' | 'high';

export interface MockViolation {
  key: MockForbiddenKey;
  category: string;
  severity: MockSeverity;
  description: string;
  /** 命中的行号（1-based） */
  line: number;
  /** 命中的代码片段 */
  snippet: string;
}

export interface MockScanResult {
  /** 文件路径 */
  filePath: string;
  /** 是否命中（有任何违规） */
  hasViolation: boolean;
  /** 违规列表 */
  violations: MockViolation[];
  /** 按严重度统计 */
  counts: {
    high: number;
    medium: number;
    low: number;
    total: number;
  };
}

// =============================================================================
// 检测函数
// =============================================================================

/**
 * 检测单个源码字符串的 mock / placeholder 违规
 *
 * 使用示例：
 * ```ts
 * const violations = detectInSource(sourceCode, 'admin/users/kyc/page.tsx');
 * if (violations.length > 0) console.log(violations);
 * ```
 */
export function detectInSource(
  source: string,
  filePath: string = '<inline>',
): MockViolation[] {
  const violations: MockViolation[] = [];
  const lines = source.split('\n');

  for (const [key, rule] of Object.entries(MOCK_FORBIDDEN_PATTERNS)) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pattern of rule.patterns) {
        if (pattern.test(line)) {
          violations.push({
            key: key as MockForbiddenKey,
            category: rule.category,
            severity: rule.severity as MockSeverity,
            description: rule.description,
            line: i + 1,
            snippet: line.trim().slice(0, 200),
          });
          break; // 一行只记录一次（同 key）
        }
      }
    }
  }

  return violations;
}

/**
 * 扫描单个文件（Node fs 路径，不在浏览器环境运行）
 */
export function scanFile(filePath: string): MockScanResult {
  // 浏览器环境直接返回空
  if (typeof window !== 'undefined') {
    return emptyResult(filePath);
  }
  try {
    // 使用 require 避免在 build 时强制依赖 fs 类型
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('fs');
    const source = fs.readFileSync(filePath, 'utf-8');
    return scanFromSource(filePath, source);
  } catch (e) {
    return emptyResult(filePath);
  }
}

/**
 * 从源码字符串扫描（不读文件）
 */
export function scanFromSource(filePath: string, source: string): MockScanResult {
  const violations = detectInSource(source, filePath);
  return {
    filePath,
    hasViolation: violations.length > 0,
    violations,
    counts: countBySeverity(violations),
  };
}

/**
 * 扫描多个文件（仅在 Node 环境，由调用方控制 filePaths）
 *
 * 注：本函数不自动扫描目录，由真实化批次手动指定要扫描的 page 列表
 */
export function scanFiles(filePaths: string[]): MockScanResult[] {
  return filePaths.map((p) => scanFile(p));
}

// =============================================================================
// 报告生成
// =============================================================================

export interface MockReportSummary {
  totalFiles: number;
  cleanFiles: number;
  dirtyFiles: number;
  totalViolations: number;
  bySeverity: { high: number; medium: number; low: number };
  byCategory: Record<string, number>;
}

export interface MockReport {
  summary: MockReportSummary;
  results: MockScanResult[];
  generatedAt: string;
}

function countBySeverity(violations: MockViolation[]): MockScanResult['counts'] {
  const counts = { high: 0, medium: 0, low: 0, total: violations.length };
  for (const v of violations) counts[v.severity] += 1;
  return counts;
}

function emptyResult(filePath: string): MockScanResult {
  return {
    filePath,
    hasViolation: false,
    violations: [],
    counts: { high: 0, medium: 0, low: 0, total: 0 },
  };
}

/**
 * 生成汇总报告
 */
export function generateReport(results: MockScanResult[]): MockReport {
  const summary: MockReportSummary = {
    totalFiles: results.length,
    cleanFiles: results.filter((r) => !r.hasViolation).length,
    dirtyFiles: results.filter((r) => r.hasViolation).length,
    totalViolations: results.reduce((sum, r) => sum + r.violations.length, 0),
    bySeverity: { high: 0, medium: 0, low: 0 },
    byCategory: {},
  };

  for (const r of results) {
    summary.bySeverity.high += r.counts.high;
    summary.bySeverity.medium += r.counts.medium;
    summary.bySeverity.low += r.counts.low;
    for (const v of r.violations) {
      summary.byCategory[v.category] = (summary.byCategory[v.category] || 0) + 1;
    }
  }

  return {
    summary,
    results,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * 打印报告到 console（开发期辅助）
 */
export function printReport(report: MockReport): void {
  // eslint-disable-next-line no-console
  console.log('\n========== Mock Cleanup Report ==========');
  // eslint-disable-next-line no-console
  console.log(`Generated at: ${report.generatedAt}`);
  // eslint-disable-next-line no-console
  console.log(`Total files: ${report.summary.totalFiles}`);
  // eslint-disable-next-line no-console
  console.log(`Clean files: ${report.summary.cleanFiles}`);
  // eslint-disable-next-line no-console
  console.log(`Dirty files: ${report.summary.dirtyFiles}`);
  // eslint-disable-next-line no-console
  console.log(`Total violations: ${report.summary.totalViolations}`);
  // eslint-disable-next-line no-console
  console.log(`  HIGH: ${report.summary.bySeverity.high}`);
  // eslint-disable-next-line no-console
  console.log(`  MEDIUM: ${report.summary.bySeverity.medium}`);
  // eslint-disable-next-line no-console
  console.log(`  LOW: ${report.summary.bySeverity.low}`);
  // eslint-disable-next-line no-console
  console.log(`By category:`);
  for (const [k, v] of Object.entries(report.summary.byCategory)) {
    // eslint-disable-next-line no-console
    console.log(`  ${k}: ${v}`);
  }
  // eslint-disable-next-line no-console
  console.log('==========================================\n');
}
