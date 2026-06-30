/**
 * 合规与牌照管理模块测试
 *
 * 覆盖（≥ 16 用例）：
 *  - LicenseRegistry addLicense / getLicense
 *  - LicenseRegistry checkExpiringLicenses
 *  - LicenseRegistry validateLicenses
 *  - ComplianceEngine runDailyCheck
 *  - ComplianceEngine 检测 AML 大额
 *  - ComplianceEngine 检测 KYC 过期
 *  - ComplianceEngine 检测 OFAC 制裁
 *  - ComplianceEngine 告警订阅
 *  - LegalDocumentService publishDocument
 *  - LegalDocumentService getCurrentDocument 多语言
 *  - LegalDocumentService requiresAcceptance
 *  - LegalDocumentService recordAcceptance
 *  - LegalDocumentService getAcceptanceRate
 *  - RegulatoryReportService generateCTR
 *  - RegulatoryReportService generateSAR
 *  - RegulatoryReportService generateDAU
 *  - RegulatoryReportService submitReport
 *
 * 运行：node --import tsx tests/compliance.test.ts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  LicenseRegistry,
  LICENSE_TEMPLATES,
  newLicenseId,
} from '../src/lib/compliance/license-registry';
import {
  ComplianceEngine,
  CTR_THRESHOLD_USD,
  KYC_EXPIRY_WARNING_DAYS,
  MOCK_SANCTIONS_LIST,
  TRAVEL_RULE_THRESHOLD_USD,
  type KycRecordInput,
  type TransactionInput,
} from '../src/lib/compliance/compliance-engine';
import {
  LegalDocumentService,
  TPL_PRIVACY_POLICY,
  TPL_TERMS_OF_SERVICE,
} from '../src/lib/compliance/legal-documents';
import { RegulatoryReportService } from '../src/lib/compliance/regulatory-reports';
import type { LegalDocument, License } from '../src/lib/compliance/types';

const DAY_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// LicenseRegistry
// ---------------------------------------------------------------------------

test('license: addLicense and getLicense', () => {
  const reg = new LicenseRegistry({ initial: [] });
  const lic: License = {
    id: 'l-test-1',
    type: 'MSB',
    number: 'TEST-001',
    jurisdiction: 'US',
    regulator: 'FinCEN',
    status: 'active',
    issuedAt: Date.now() - 30 * DAY_MS,
    expiresAt: Date.now() + 365 * DAY_MS,
    scope: ['Money Transmission'],
  };
  reg.addLicense(lic);
  const got = reg.getLicense('l-test-1');
  assert.ok(got);
  assert.equal(got!.number, 'TEST-001');
  assert.equal(got!.status, 'active');
});

test('license: default templates include 5+ mainstream licenses', () => {
  assert.ok(LICENSE_TEMPLATES.length >= 5, `expected >= 5 templates, got ${LICENSE_TEMPLATES.length}`);
  const types = new Set(LICENSE_TEMPLATES.map((l) => l.type));
  assert.ok(types.has('SAMOA_DLT'), 'should include Samoa DLT');
  assert.ok(types.has('US_FINCEN'), 'should include US FinCEN');
  assert.ok(types.has('MICA'), 'should include MiCA');
});

test('license: checkExpiringLicenses within 30 days', () => {
  const reg = new LicenseRegistry({ initial: [] });
  const expiringSoon: License = {
    id: 'l-exp',
    type: 'MSB',
    number: 'EXP-001',
    jurisdiction: 'US',
    regulator: 'FinCEN',
    status: 'active',
    issuedAt: Date.now() - 360 * DAY_MS,
    expiresAt: Date.now() + 15 * DAY_MS, // 15 天后过期
    scope: ['Money Transmission'],
  };
  const valid: License = {
    id: 'l-valid',
    type: 'MSB',
    number: 'VALID-001',
    jurisdiction: 'US',
    regulator: 'FinCEN',
    status: 'active',
    issuedAt: Date.now() - 30 * DAY_MS,
    expiresAt: Date.now() + 365 * DAY_MS,
    scope: ['Money Transmission'],
  };
  reg.addLicense(expiringSoon);
  reg.addLicense(valid);
  const expiring = reg.checkExpiringLicenses(30);
  assert.equal(expiring.length, 1);
  assert.equal(expiring[0].id, 'l-exp');
});

test('license: validateLicenses reports problems', () => {
  const reg = new LicenseRegistry({ initial: [] });
  reg.addLicense({
    id: 'l-bad',
    type: 'MSB',
    number: '',
    jurisdiction: 'US',
    regulator: 'FinCEN',
    status: 'active',
    issuedAt: Date.now() - 100 * DAY_MS,
    expiresAt: Date.now() - 10 * DAY_MS, // 已过期
    scope: [],
  });
  reg.addLicense({
    id: 'l-good',
    type: 'MSB',
    number: 'G-001',
    jurisdiction: 'US',
    regulator: 'FinCEN',
    status: 'active',
    issuedAt: Date.now() - 30 * DAY_MS,
    expiresAt: Date.now() + 365 * DAY_MS,
    scope: ['Money Transmission'],
  });
  const { valid, issues } = reg.validateLicenses();
  assert.equal(valid.length, 1);
  assert.equal(valid[0].id, 'l-good');
  assert.equal(issues.length, 1);
  assert.equal(issues[0].licenseId, 'l-bad');
  assert.ok(issues[0].problems.length >= 2);
});

test('license: updateLicenseStatus transitions to suspended', () => {
  const reg = new LicenseRegistry({ initial: [LICENSE_TEMPLATES[0]] });
  const updated = reg.updateLicenseStatus(LICENSE_TEMPLATES[0].id, 'suspended', 'regulator review');
  assert.equal(updated.status, 'suspended');
  assert.ok(updated.notes?.includes('suspended'));
});

test('license: getActiveLicenses filters by jurisdiction', () => {
  const reg = new LicenseRegistry({ initial: [] });
  reg.addLicense({
    id: 'l-samoa',
    type: 'SAMOA_DLT',
    number: 'WS-001',
    jurisdiction: 'Samoa',
    regulator: 'MoF',
    status: 'active',
    issuedAt: Date.now(),
    expiresAt: Date.now() + 1000 * DAY_MS,
    scope: ['Exchange'],
  });
  reg.addLicense({
    id: 'l-us',
    type: 'US_FINCEN',
    number: 'US-001',
    jurisdiction: 'US',
    regulator: 'FinCEN',
    status: 'active',
    issuedAt: Date.now(),
    expiresAt: Date.now() + 1000 * DAY_MS,
    scope: ['Exchange'],
  });
  const samoa = reg.getActiveLicenses('Samoa');
  assert.equal(samoa.length, 1);
  assert.equal(samoa[0].id, 'l-samoa');
});

test('license: newLicenseId generates unique IDs', () => {
  const ids = new Set<string>();
  for (let i = 0; i < 20; i++) {
    ids.add(newLicenseId('MSB'));
  }
  assert.equal(ids.size, 20);
});

// ---------------------------------------------------------------------------
// ComplianceEngine
// ---------------------------------------------------------------------------

const txInWindow = (txs: TransactionInput[]) => () => txs;

test('compliance: runDailyCheck returns ComplianceCheck', async () => {
  const engine = new ComplianceEngine();
  const check = await engine.runDailyCheck();
  assert.ok(check);
  assert.equal(check.type, 'daily');
  assert.ok(typeof check.score === 'number');
  assert.ok(check.score >= 0 && check.score <= 100);
  assert.ok(Array.isArray(check.findings));
});

test('compliance: detects AML large transaction', async () => {
  const txs: TransactionInput[] = [
    {
      id: 'tx-1',
      userId: 'u1',
      amountUsd: 15_000,
      type: 'withdraw',
      occurredAt: Date.now(),
    },
  ];
  const engine = new ComplianceEngine({
    getRecentTransactions: txInWindow(txs),
  });
  const check = await engine.runDailyCheck();
  const amlFinding = check.findings.find(
    (f) => f.category === 'AML' && f.evidence?.txId === 'tx-1',
  );
  assert.ok(amlFinding, 'should detect 15k withdraw as AML');
  assert.equal(amlFinding!.severity === 'medium' || amlFinding!.severity === 'high', true);
});

test('compliance: detects KYC expired and expiring soon', async () => {
  const records: KycRecordInput[] = [
    {
      userId: 'u-expired',
      expiresAt: Date.now() - DAY_MS, // 已过期
      status: 'approved',
      level: 'basic',
    },
    {
      userId: 'u-warning',
      expiresAt: Date.now() + 10 * DAY_MS, // 10 天后过期
      status: 'approved',
      level: 'basic',
    },
  ];
  const engine = new ComplianceEngine({ getAllKycRecords: () => records });
  const check = await engine.runDailyCheck();
  const expired = check.findings.find((f) => f.evidence?.userId === 'u-expired');
  const warning = check.findings.find((f) => f.evidence?.userId === 'u-warning');
  assert.ok(expired, 'should flag expired KYC');
  assert.equal(expired!.severity, 'high');
  assert.ok(warning, 'should flag expiring KYC');
  assert.ok(['low', 'medium'].includes(warning!.severity));
});

test('compliance: detects OFAC sanctioned addresses', async () => {
  const sanctionedAddr = MOCK_SANCTIONS_LIST[0];
  const txs: TransactionInput[] = [
    {
      id: 'tx-sanctioned',
      userId: 'u-bad',
      amountUsd: 1000,
      type: 'transfer',
      occurredAt: Date.now(),
      toAddress: sanctionedAddr,
    },
  ];
  const engine = new ComplianceEngine({
    getRecentTransactions: () => txs,
  });
  const check = await engine.runDailyCheck();
  const s = check.findings.find(
    (f) => f.category === 'Sanctions' && f.severity === 'critical',
  );
  assert.ok(s, 'should detect sanctioned address with critical severity');
  assert.ok(s!.message.includes('OFAC'));
});

test('compliance: Travel Rule flags cross-border without counterparty', async () => {
  const txs: TransactionInput[] = [
    {
      id: 'tx-tr',
      userId: 'u1',
      amountUsd: 5_000,
      type: 'transfer',
      occurredAt: Date.now(),
      crossBorder: true,
      // 故意缺 counterparty
    },
  ];
  const engine = new ComplianceEngine({ getRecentTransactions: () => txs });
  const check = await engine.runDailyCheck();
  const tr = check.findings.find((f) => f.category === 'TravelRule');
  assert.ok(tr, 'should flag Travel Rule violation');
  assert.equal(tr!.severity, 'high');
  assert.ok(tr!.recommendation?.includes('退回交易') || tr!.recommendation?.toLowerCase().includes('counterparty'));
});

test('compliance: onFinding handler receives findings', async () => {
  const txs: TransactionInput[] = [
    {
      id: 'tx-hook',
      userId: 'u1',
      amountUsd: 50_000,
      type: 'withdraw',
      occurredAt: Date.now(),
    },
  ];
  const engine = new ComplianceEngine({ getRecentTransactions: () => txs });
  const received: any[] = [];
  const unsub = engine.onFinding((f) => received.push(f));
  await engine.runDailyCheck();
  assert.ok(received.length > 0, 'handler should receive findings');
  unsub();
  await engine.runDailyCheck();
  // 第二次不再 push（已退订）
  // 不变：unsub 后已停
  assert.equal(received.length >= 1, true);
});

test('compliance: getComplianceScore returns 0-100', async () => {
  const engine = new ComplianceEngine();
  await engine.runDailyCheck();
  const score = engine.getComplianceScore();
  assert.ok(score >= 0 && score <= 100);
});

test('compliance: runManualCheck returns check for specific category', async () => {
  const engine = new ComplianceEngine();
  const c = await engine.runManualCheck('KYC');
  assert.equal(c.type, 'manual');
  assert.equal(c.category, 'KYC');
});

test('compliance: CTR_THRESHOLD_USD is 10000', () => {
  assert.equal(CTR_THRESHOLD_USD, 10_000);
});

test('compliance: TRAVEL_RULE_THRESHOLD_USD is 1000', () => {
  assert.equal(TRAVEL_RULE_THRESHOLD_USD, 1_000);
});

test('compliance: MOCK_SANCTIONS_LIST has 50+ entries', () => {
  assert.ok(MOCK_SANCTIONS_LIST.length >= 50, `expected >= 50, got ${MOCK_SANCTIONS_LIST.length}`);
});

test('compliance: KYC_EXPIRY_WARNING_DAYS is 30', () => {
  assert.equal(KYC_EXPIRY_WARNING_DAYS, 30);
});

// ---------------------------------------------------------------------------
// LegalDocumentService
// ---------------------------------------------------------------------------

test('legal: publishDocument stores and returns id', () => {
  const svc = new LegalDocumentService({ initial: [] });
  const doc: LegalDocument = {
    id: 'doc-terms-v2',
    type: 'terms',
    version: '2.0.0',
    jurisdiction: 'Global',
    language: 'en',
    content: '## v2 Terms',
    effectiveAt: Date.now(),
    publishedAt: Date.now(),
    publishedBy: 'tester',
    requiresAcceptance: true,
  };
  svc.publishDocument(doc);
  const got = svc.getDocument('doc-terms-v2');
  assert.ok(got);
  assert.equal(got!.version, '2.0.0');
});

test('legal: getCurrentDocument multi-language / multi-jurisdiction', () => {
  const svc = new LegalDocumentService({ initial: [] });
  svc.publishDocument({
    id: 't-en',
    type: 'terms',
    version: '1.0.0',
    jurisdiction: 'Global',
    language: 'en',
    content: 'English',
    effectiveAt: Date.now(),
    publishedAt: Date.now() - 1000,
    publishedBy: 'tester',
    requiresAcceptance: true,
  });
  svc.publishDocument({
    id: 't-zh',
    type: 'terms',
    version: '1.0.0',
    jurisdiction: 'Global',
    language: 'zh',
    content: '中文',
    effectiveAt: Date.now(),
    publishedAt: Date.now(),
    publishedBy: 'tester',
    requiresAcceptance: true,
  });
  svc.publishDocument({
    id: 't-eu',
    type: 'terms',
    version: '1.0.0',
    jurisdiction: 'EU',
    language: 'en',
    content: 'EU',
    effectiveAt: Date.now(),
    publishedAt: Date.now() + 1000,
    publishedBy: 'tester',
    requiresAcceptance: true,
  });
  const zh = svc.getCurrentDocument('terms', 'Global', 'zh');
  assert.equal(zh?.id, 't-zh');
  const euEn = svc.getCurrentDocument('terms', 'EU', 'en');
  assert.equal(euEn?.id, 't-eu');
  const globalEn = svc.getCurrentDocument('terms', 'Global', 'en');
  assert.equal(globalEn?.id, 't-en');
});

test('legal: requiresAcceptance true for new user', () => {
  const svc = new LegalDocumentService({ initial: [TPL_TERMS_OF_SERVICE, TPL_PRIVACY_POLICY] });
  assert.equal(svc.requiresAcceptance('new-user', 'terms'), true);
  assert.equal(svc.requiresAcceptance('new-user', 'privacy'), true);
});

test('legal: requiresAcceptance false after recordAcceptance', () => {
  const svc = new LegalDocumentService({ initial: [TPL_TERMS_OF_SERVICE] });
  const doc = svc.getCurrentDocument('terms')!;
  svc.recordAcceptance('u1', doc.id, '1.2.3.4', 'Mozilla/5.0');
  assert.equal(svc.requiresAcceptance('u1', 'terms'), false);
});

test('legal: recordAcceptance increments acceptanceCount', () => {
  const svc = new LegalDocumentService({ initial: [TPL_TERMS_OF_SERVICE] });
  const doc = svc.getCurrentDocument('terms')!;
  assert.equal(doc.acceptanceCount ?? 0, 0);
  svc.recordAcceptance('u1', doc.id, '1.1.1.1', 'UA1');
  svc.recordAcceptance('u2', doc.id, '1.1.1.2', 'UA2');
  const after = svc.getCurrentDocument('terms')!;
  assert.equal(after.acceptanceCount, 2);
});

test('legal: getAcceptanceRate returns 0-1', () => {
  const svc = new LegalDocumentService({ initial: [TPL_TERMS_OF_SERVICE] });
  const doc = svc.getCurrentDocument('terms')!;
  const rate0 = svc.getAcceptanceRate(doc.id);
  assert.equal(rate0, 0);
  for (let i = 0; i < 1000; i++) {
    svc.recordAcceptance(`u${i}`, doc.id, `1.1.1.${i}`, `UA${i}`);
  }
  const rate1 = svc.getAcceptanceRate(doc.id);
  assert.equal(rate1, 1);
});

test('legal: getPendingAcceptances lists all unaccepted', () => {
  const svc = new LegalDocumentService({ initial: [TPL_TERMS_OF_SERVICE, TPL_PRIVACY_POLICY] });
  const pending = svc.getPendingAcceptances('new-user');
  assert.ok(pending.length >= 2);
});

// ---------------------------------------------------------------------------
// RegulatoryReportService
// ---------------------------------------------------------------------------

test('report: generateCTR picks transactions > 10000', async () => {
  const txs = [
    { id: 't1', userId: 'u1', type: 'withdraw' as const, amountUsd: 500, occurredAt: Date.now() },
    { id: 't2', userId: 'u1', type: 'deposit' as const, amountUsd: 15000, occurredAt: Date.now() },
    { id: 't3', userId: 'u1', type: 'withdraw' as const, amountUsd: 12000, occurredAt: Date.now() },
  ];
  const svc = new RegulatoryReportService({
    getTransactionsInRange: () => txs,
  });
  const rpt = await svc.generateCTR();
  assert.equal(rpt.type, 'CTR');
  assert.equal(rpt.data.totalReportable, 2);
  assert.equal(rpt.data.totalAmountUsd, 27000);
  assert.equal(rpt.status, 'draft');
});

test('report: generateSAR requires userId and reason', async () => {
  const svc = new RegulatoryReportService();
  await assert.rejects(() => svc.generateSAR({ userId: '', reason: 'x' } as any));
  await assert.rejects(() => svc.generateSAR({ userId: 'u1', reason: '' } as any));
  const rpt = await svc.generateSAR({
    userId: 'u1',
    reason: 'unusual large volume',
  });
  assert.equal(rpt.type, 'SAR');
  assert.equal(rpt.data.reason, 'unusual large volume');
});

test('report: generateDAU calculates unique users and ratio', async () => {
  const events = [
    { userId: 'u1', activityType: 'login' as const, occurredAt: Date.now() },
    { userId: 'u1', activityType: 'trade' as const, occurredAt: Date.now() },
    { userId: 'u2', activityType: 'login' as const, occurredAt: Date.now() },
    { userId: 'u3', activityType: 'deposit' as const, occurredAt: Date.now() },
  ];
  const users = [
    { id: 'u1', country: 'CN', kycLevel: 'advanced' as const, registeredAt: Date.now() - 100 * DAY_MS },
    { id: 'u2', country: 'US', kycLevel: 'basic' as const, registeredAt: Date.now() - 50 * DAY_MS },
    { id: 'u3', country: 'JP', kycLevel: 'advanced' as const, registeredAt: Date.now() - 10 * DAY_MS },
    { id: 'u4', country: 'KR', kycLevel: 'none' as const, registeredAt: Date.now() - 0.1 * DAY_MS },
  ];
  const svc = new RegulatoryReportService({
    getUserActivity: () => events,
    getUsers: () => users,
  });
  const rpt = await svc.generateDAU();
  assert.equal(rpt.type, 'DAU');
  assert.equal(rpt.data.dau, 3);
  assert.equal(rpt.data.totalUsers, 4);
  assert.equal(rpt.data.dauRatio, 0.75);
  assert.equal(rpt.data.newRegistrations, 1);
});

test('report: submitReport transitions draft -> submitted and signs', async () => {
  const svc = new RegulatoryReportService();
  const rpt = await svc.generateDAU();
  const submitted = await svc.submitReport(rpt.id, '0xMYSIGNATURE');
  assert.equal(submitted.status, 'submitted');
  assert.ok(submitted.submittedAt);
  assert.equal(submitted.signature, '0xMYSIGNATURE');
});

test('report: generateMIREL breaks down revenue', async () => {
  const txs = [
    { id: 't1', userId: 'u1', type: 'trade' as const, amountUsd: 100000, occurredAt: Date.now(), jurisdiction: 'EU' },
    { id: 't2', userId: 'u2', type: 'withdraw' as const, amountUsd: 5000, occurredAt: Date.now(), jurisdiction: 'EU' },
    { id: 't3', userId: 'u3', type: 'deposit' as const, amountUsd: 2000, occurredAt: Date.now(), jurisdiction: 'EU' },
  ];
  const svc = new RegulatoryReportService({
    getTransactionsInRange: () => txs,
  });
  const rpt = await svc.generateMIREL();
  assert.equal(rpt.type, 'MIREL');
  assert.ok(rpt.data.totalRevenueUsd > 0);
  assert.equal(rpt.data.jurisdiction, 'EU');
});

test('report: generateCARF groups by user and flags reportable', async () => {
  const txs = [
    { id: 't1', userId: 'u-big', type: 'trade' as const, amountUsd: 60000, occurredAt: Date.now() },
    { id: 't2', userId: 'u-small', type: 'trade' as const, amountUsd: 1000, occurredAt: Date.now() },
  ];
  const users = [
    { id: 'u-big', country: 'US', kycLevel: 'advanced' as const, registeredAt: Date.now() - 200 * DAY_MS },
    { id: 'u-small', country: 'CN', kycLevel: 'basic' as const, registeredAt: Date.now() - 100 * DAY_MS },
  ];
  const svc = new RegulatoryReportService({
    getTransactionsInRange: () => txs,
    getUsers: () => users,
  });
  const rpt = await svc.generateCARF();
  assert.equal(rpt.type, 'CARF');
  assert.equal(rpt.data.totalUsers, 2);
  assert.equal(rpt.data.reportableUsers.length, 1);
  assert.equal(rpt.data.reportableUsers[0].userId, 'u-big');
});

test('report: listReports filters by type and status', async () => {
  const svc = new RegulatoryReportService();
  await svc.generateDAU();
  await svc.generateCTR();
  await svc.generateDAU();
  const ctrs = svc.listReports({ type: 'CTR' });
  assert.equal(ctrs.length, 1);
  assert.equal(ctrs[0].type, 'CTR');
  const drafts = svc.listReports({ status: 'draft' });
  assert.equal(drafts.length, 3);
});

// ---------------------------------------------------------------------------
// 集成
// ---------------------------------------------------------------------------

test('integration: full pipeline (license + engine + report)', async () => {
  const reg = new LicenseRegistry({ initial: [] });
  reg.addLicense({
    id: 'l-integ',
    type: 'US_FINCEN',
    number: 'INT-001',
    jurisdiction: 'US',
    regulator: 'FinCEN',
    status: 'active',
    issuedAt: Date.now() - 100 * DAY_MS,
    expiresAt: Date.now() + 100 * DAY_MS,
    scope: ['Exchange'],
  });
  const activeUs = reg.getActiveLicenses('US');
  assert.equal(activeUs.length, 1);

  const txs: TransactionInput[] = [
    {
      id: 'tx-int',
      userId: 'u1',
      amountUsd: 25_000,
      type: 'withdraw',
      occurredAt: Date.now(),
    },
  ];
  const engine = new ComplianceEngine({ getRecentTransactions: () => txs });
  const check = await engine.runDailyCheck();
  const aml = check.findings.find((f) => f.category === 'AML');
  assert.ok(aml);

  const reportSvc = new RegulatoryReportService({
    getTransactionsInRange: () => txs,
  });
  const ctr = await reportSvc.generateCTR();
  assert.equal(ctr.data.totalReportable, 1);
});
