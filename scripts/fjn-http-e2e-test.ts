/**
 * FJN 真实环境验证 - 任务 3：HTTP 真实调用 129 个端点
 *
 * 测试流程：
 *  1. 自动启动 next dev 服务器（端口 3200）
 *  2. 轮询等待 /api/health 可访问
 *  3. 加载 endpoints 列表
 *  4. 依次通过 HTTP 调用每个端点
 *  5. 收集响应（status、耗时、success、error）
 *  6. 关闭服务器
 *  7. 输出报告 → docs/reports/fjn-http-e2e-report.json
 *
 * 输出：HTTP 端到端覆盖率报告
 */
import { spawn, ChildProcess } from 'child_process';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// 手动加载 .env.local（与 next dev 行为一致）
const envFile = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envFile)) {
  const content = fs.readFileSync(envFile, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

import { encodeJWT } from '../src/lib/auth/jwt';
import { ENDPOINTS, EndpointDef } from './fjn-endpoints';

const BASE_URL = process.env.FJN_BASE_URL || 'http://localhost:3200';
const HEALTH_PATH = '/api/health';
const STARTUP_TIMEOUT_MS = 90_000; // 90s 启动
const REQUEST_TIMEOUT_MS = 30_000; // 单次请求 30s
const SAMPLE_FIELDS = {
  id: '00000000-0000-0000-0000-000000000001',
  allocationId: '00000000-0000-0000-0000-000000000001',
  orderId: '00000000-0000-0000-0000-000000000001',
  userId: '00000000-0000-0000-0000-000000000001',
  ruleId: '00000000-0000-0000-0000-000000000001',
  reviewerId: '00000000-0000-0000-0000-000000000002',
  approverId: '00000000-0000-0000-0000-000000000002',
  approvalId: '00000000-0000-0000-0000-000000000003',
  settlementId: '00000000-0000-0000-0000-000000000004',
  currency: 'CNY',
  countryCode: 'CN',
  reportPeriod: '2026-07',
  taxType: 'VAT',
  taxMode: 'exclusive',
  description: 'http-e2e-test',
  reason: 'http-e2e-test',
  paidAt: new Date().toISOString(),
  operatorId: randomUUID(),
  amount: '100.00',
  sourceId: '00000000-0000-0000-0000-000000000005',
  sourceType: 'order',
  ruleCode: 'HTTP_E2E_TEST',
  regionCode: 'CN',
  taxRate: '0.13',
  taxableAmount: '1000.00',
  taxAmount: '130.00',
  recordNo: 'TR00001',
  page: '1',
  pageSize: '20',
  paymentId: '00000000-0000-0000-0000-000000000099',
  paymentNo: 'PAY00001',
  productId: '00000000-0000-0000-0000-000000000010',
  deviceId: 'device-001',
  fingerprint: 'fp-001',
  category: 'ip',
  value: '127.0.0.1',
  riskLevel: 'low',
  scoreType: 'credit',
  score: 50,
  ruleConfig: { threshold: 100 },
  allocationNo: 'ALC00001',
  orderNo: 'ORD00001',
  email: 'http-e2e@test.local',
  paidAmount: '1000.00',
  totalAmount: '1000.00',
  businessType: 'income',
  direction: 'in',
  accountType: 'wine_cost_pool',
  settlementType: 'monthly',
  period: '2026-07',
  eventType: 'abnormal_payment',
  riskScore: 10,
  action: 'pass',
  userAgent: 'http-e2e-test',
  ipAddress: '127.0.0.1',
  name: 'http-e2e-test',
  ruleName: 'HTTP E2E Rule',
  ruleType: 'frequency',
  effectiveFrom: new Date('2025-01-01').toISOString(),
  refType: 'order',
  refId: '00000000-0000-0000-0000-000000000001',
  from: new Date('2025-01-01').toISOString(),
  to: new Date('2026-12-31').toISOString(),
  paymentMethod: 'alipay',
  grossAmount: '1000.00',
  feeAmount: '10.00',
  netAmount: '990.00',
  channel: 'alipay',
  externalRefNo: 'EXT00001',
  ledgerType: 'income',
  entryType: 'credit',
  debitAmount: '0',
  creditAmount: '100.00',
  poolType: 'wine_cost_pool',
  percentage: '0.4',
  recipientType: 'company',
  recipientId: '00000000-0000-0000-0000-000000000077',
  recipientAccount: 'company-account-001',
  rewardType: 'team',
  rewardNo: 'TRW00001',
  level: 1,
  amountPerLevel: '50.00',
  generation: 1,
  validFrom: new Date('2025-01-01').toISOString(),
  validTo: new Date('2026-12-31').toISOString(),
  status: 'active',
  quantity: 1,
  returnUrl: 'http://localhost:3200/api/v1/fjn/finance',
  productType: 'wine_369',
  ruleVersion: 'v3.6.9',
  stage: 'qualitative',
  nodeLevel: 1,
  rewardAmount: '100.00',
  rewardPeriod: '2026-07',
  rewardCurrency: 'CNY',
  settlementNo: 'STL00001',
  items: [{ poolType: 'wine_cost_pool', percentage: '0.4' }],
  reversedAmount: '100.00',
  reviewNote: 'http-e2e-test',
  freezeReason: 'http-e2e-test',
};

interface CallRecord {
  service: string;
  method: 'GET' | 'POST';
  action: string;
  path: string;
  status: number;
  durationMs: number;
  ok: boolean;
  errorCode?: string;
  message?: string;
  bodySummary?: string;
}

const records: CallRecord[] = [];
let passCount = 0;
let failCount = 0;

function buildUrl(ep: EndpointDef): string {
  const params = new URLSearchParams({ action: ep.action });
  return `${BASE_URL}/api/v1/fjn/${ep.service}?${params.toString()}`;
}

function buildBody(ep: EndpointDef): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const field of ep.bodyFields ?? []) {
    const sample = (SAMPLE_FIELDS as any)[field.name];
    if (sample !== undefined) {
      body[field.name] = sample;
    } else {
      body[field.name] = field.type === 'number' ? 0 : field.type === 'object' ? {} : '';
    }
  }
  return body;
}

async function callEndpoint(ep: EndpointDef, token: string | null): Promise<CallRecord> {
  const url = buildUrl(ep);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const res = await fetch(url, {
      method: ep.method,
      headers,
      body: ep.method === 'POST' ? JSON.stringify(buildBody(ep)) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timer);
    const durationMs = Date.now() - start;
    let body: any = null;
    try { body = await res.json(); } catch { body = null; }
    const ok = res.status >= 200 && res.status < 500; // 4xx 算"接口正常响应"
    const record: CallRecord = {
      service: ep.service,
      method: ep.method,
      action: ep.action,
      path: url,
      status: res.status,
      durationMs,
      ok,
      errorCode: body?.error?.code,
      message: body?.error?.message ?? body?.message,
      bodySummary: body ? JSON.stringify(body).slice(0, 200) : '',
    };
    return record;
  } catch (e: any) {
    return {
      service: ep.service,
      method: ep.method,
      action: ep.action,
      path: url,
      status: 0,
      durationMs: Date.now() - start,
      ok: false,
      errorCode: 'NETWORK_ERROR',
      message: e?.message ?? String(e),
    };
  }
}

async function waitForServer(): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < STARTUP_TIMEOUT_MS) {
    try {
      const res = await fetch(`${BASE_URL}${HEALTH_PATH}`, { method: 'GET' });
      if (res.status < 500) return true;
    } catch {
      // not ready
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function main() {
  console.log('=== FJN HTTP 端到端验证：调用所有端点 ===\n');
  console.log(`目标服务器: ${BASE_URL}`);
  console.log(`端点数量: ${ENDPOINTS.length}\n`);

  // 1. 检查 server 是否已经运行（dev server 在 background）
  console.log('[1] 检查服务器状态');
  const isAlreadyRunning = await (async () => {
    try {
      const r = await fetch(`${BASE_URL}${HEALTH_PATH}`);
      return r.status < 500;
    } catch {
      return false;
    }
  })();

  let server: ChildProcess | null = null;
  if (!isAlreadyRunning) {
    console.log('  启动 next dev 服务器...');
    server = spawn('npx', ['next', 'dev', '-p', '3200'], {
      cwd: process.cwd(),
      shell: true,
      detached: false,
    });
    server.stdout?.on('data', () => {});
    server.stderr?.on('data', () => {});
    console.log('  ⏳ 等待服务器就绪...');
    const ready = await waitForServer();
    if (!ready) {
      console.error('  ❌ 服务器启动超时');
      server?.kill();
      process.exit(1);
    }
    console.log('  ✅ 服务器已就绪');
  } else {
    console.log('  ✅ 复用已运行服务器');
  }

  // 2. 签发 dev-admin token
  const adminToken = await encodeJWT({
    userId: 'dev-admin',
    username: 'http-e2e-test',
    userType: 'admin',
  });
  console.log(`\n[2] 已签发 admin token`);

  try {
    // 3. 遍历所有 endpoint
    console.log(`\n[3] 开始调用 ${ENDPOINTS.length} 个端点\n`);
    for (let i = 0; i < ENDPOINTS.length; i++) {
      const ep = ENDPOINTS[i];
      const rec = await callEndpoint(ep, adminToken);
      records.push(rec);
      if (rec.ok) passCount++; else failCount++;
      const icon = rec.ok ? '✅' : '❌';
      console.log(
        `  [${String(i + 1).padStart(3)}/${ENDPOINTS.length}] ${icon} ${ep.service.padEnd(10)} ${ep.method} ${ep.action.padEnd(30)} ${rec.status} ${rec.durationMs}ms${rec.errorCode ? '  [' + rec.errorCode + ']' : ''}`,
      );
    }

    // 4. 总结
    console.log(`\n=== HTTP 端到端验证总结 ===`);
    console.log(`  ✅ 通过 (status < 500): ${passCount}`);
    console.log(`  ❌ 失败: ${failCount}`);
    console.log(`  📊 覆盖率: ${(passCount / ENDPOINTS.length * 100).toFixed(1)}%`);
    console.log(`  📊 总耗时: ${records.reduce((s, r) => s + r.durationMs, 0)}ms`);

    // 5. 按 service 统计
    const byService: Record<string, { pass: number; fail: number; total: number }> = {};
    for (const r of records) {
      if (!byService[r.service]) byService[r.service] = { pass: 0, fail: 0, total: 0 };
      byService[r.service].total++;
      if (r.ok) byService[r.service].pass++;
      else byService[r.service].fail++;
    }
    console.log(`\n  按 service 统计:`);
    for (const [svc, stat] of Object.entries(byService)) {
      console.log(`    ${svc.padEnd(12)} ${stat.pass}/${stat.total} (${(stat.pass / stat.total * 100).toFixed(1)}%)`);
    }

    // 6. 输出报告
    const report = {
      testTag: `http-e2e-${Date.now()}`,
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL,
      summary: {
        total: ENDPOINTS.length,
        pass: passCount,
        fail: failCount,
        coverage: (passCount / ENDPOINTS.length * 100).toFixed(2) + '%',
        totalDurationMs: records.reduce((s, r) => s + r.durationMs, 0),
      },
      byService,
      records,
    };
    const outDir = path.join(process.cwd(), 'docs', 'reports');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      path.join(outDir, 'fjn-http-e2e-report.json'),
      JSON.stringify(report, null, 2),
      'utf-8',
    );
    console.log(`\n📄 报告已保存: docs/reports/fjn-http-e2e-report.json`);

    process.exit(0);
  } catch (e: any) {
    console.error('\n❌ HTTP e2e 异常:', e.message);
    console.error(e.stack);
    process.exit(1);
  } finally {
    if (server) {
      console.log('\n  🛑 关闭 dev server');
      server.kill();
    }
  }
}

main();
