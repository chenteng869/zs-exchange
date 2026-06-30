# H12\-《DApp 浏览器 Part 12：审计日志 / 监控指标 / 后台管理》

# 《DApp 浏览器 Part 12：审计日志 / 监控指标 / 后台管理》



本章实现 DApp 浏览器生产运营侧能力，覆盖：



- DApp Audit Log

- Provider Request Audit

- Signing Audit 持久化

- Transaction Audit 持久化

- WalletConnect Audit

- Security Event 持久化

- Metrics Service

- Health Check

- Admin DApp Registry 管理

- Admin Security Rule 管理

- Admin Session 查询

- Admin WalletConnect 查询

- Admin Audit 查询

- Prometheus 指标

- P0 告警清单

    

核心目标：



```Plain Text
DApp 浏览器任何敏感行为必须可追踪、可审计、可报警、可后台处置。
```



---



# 1\. 本章目录结构



```Bash
src/modules/dapp-browser/
  core/
    audit/
      dapp-audit.types.ts
      dapp-audit-storage.service.ts
      dapp-audit.repository.ts
      dapp-audit.service.ts
      provider-audit.service.ts
      walletconnect-audit.service.ts

    monitoring/
      dapp-metrics.types.ts
      dapp-metrics.service.ts
      dapp-health.service.ts
      dapp-alert.service.ts

  admin/
    registry/
      dapp-registry-admin.service.ts
      dapp-registry-admin.controller.ts

    security/
      dapp-security-admin.service.ts
      dapp-security-admin.controller.ts

    sessions/
      dapp-session-admin.service.ts
      dapp-session-admin.controller.ts

    walletconnect/
      walletconnect-admin.service.ts
      walletconnect-admin.controller.ts

    audit/
      dapp-audit-admin.service.ts
      dapp-audit-admin.controller.ts

  dapp-browser.module.ts
```



---



# 2\. Prisma 数据库设计



## 2\.1 DApp Audit Log



```Plain Text
model DappAuditLog {
  id              BigInt   @id @default(autoincrement())
  auditNo         String   @unique @db.VarChar(64)

  action          String   @db.VarChar(128)
  result          String   @db.VarChar(32)

  source          String   @db.VarChar(32)
  origin          String?  @db.VarChar(512)
  hostname        String?  @db.VarChar(255)
  dappId          String?  @db.VarChar(64)

  userId          BigInt?
  accountId       String?  @db.VarChar(64)
  address         String?  @db.VarChar(64)
  chainId         String?  @db.VarChar(32)

  method          String?  @db.VarChar(128)
  requestId       String?  @db.VarChar(128)
  sessionId       String?  @db.VarChar(128)
  topic           String?  @db.VarChar(255)

  riskLevel       String?  @db.VarChar(32)
  riskReasons     Json?

  requestPayload  Json?
  responsePayload Json?
  metadata        Json?

  errorCode       String?  @db.VarChar(64)
  errorMessage    String?  @db.VarChar(1024)

  ip              String?  @db.VarChar(64)
  userAgent       String?  @db.VarChar(512)

  createdAt       DateTime @default(now())

  @@index([action])
  @@index([result])
  @@index([source])
  @@index([hostname])
  @@index([userId])
  @@index([address])
  @@index([chainId])
  @@index([method])
  @@index([riskLevel])
  @@index([createdAt])
  @@map("dapp_audit_logs")
}
```



---



## 2\.2 DApp Security Rule



```Plain Text
model DappSecurityRule {
  id          BigInt   @id @default(autoincrement())
  ruleId      String   @unique @db.VarChar(64)

  type        String   @db.VarChar(64)
  value       String   @db.VarChar(512)

  riskLevel   String   @db.VarChar(32)
  action      String   @db.VarChar(32)
  reason      String?  @db.VarChar(1024)

  enabled     Boolean  @default(true)
  source      String   @default("admin") @db.VarChar(32)

  createdBy   BigInt?
  updatedBy   BigInt?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([type])
  @@index([value])
  @@index([enabled])
  @@map("dapp_security_rules")
}
```



---



## 2\.3 DApp Security Event



```Plain Text
model DappSecurityEvent {
  id          BigInt   @id @default(autoincrement())
  eventNo     String   @unique @db.VarChar(64)

  type        String   @db.VarChar(64)
  riskLevel   String   @db.VarChar(32)
  action      String   @db.VarChar(32)

  url         String?  @db.VarChar(1024)
  origin      String?  @db.VarChar(512)
  hostname    String?  @db.VarChar(255)
  chainId     String?  @db.VarChar(32)
  address     String?  @db.VarChar(64)

  reasons     Json
  metadata    Json?

  createdAt   DateTime @default(now())

  @@index([type])
  @@index([riskLevel])
  @@index([hostname])
  @@index([address])
  @@index([createdAt])
  @@map("dapp_security_events")
}
```



---



## 2\.4 DApp Registry



```Plain Text
model DappRegistryItem {
  id           BigInt   @id @default(autoincrement())
  dappId       String   @unique @db.VarChar(64)

  name         String   @db.VarChar(128)
  description  String?  @db.VarChar(512)
  iconUrl      String?  @db.VarChar(1024)
  url          String   @db.VarChar(1024)
  origin       String   @db.VarChar(512)
  hostname     String   @db.VarChar(255)

  category     String   @db.VarChar(64)
  tags         Json
  chains       Json

  status       String   @default("active") @db.VarChar(32)
  riskLevel    String   @default("low") @db.VarChar(32)

  featured     Boolean  @default(false)
  verified     Boolean  @default(false)
  sortOrder    Int      @default(0)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([category])
  @@index([status])
  @@index([riskLevel])
  @@index([featured])
  @@index([hostname])
  @@map("dapp_registry_items")
}
```



---



# 3\. Audit 类型



## `core/audit/dapp-audit.types.ts`



```TypeScript
export type DappAuditAction =
  | 'dapp.open'
  | 'dapp.close'
  | 'dapp.connect.requested'
  | 'dapp.connect.approved'
  | 'dapp.connect.rejected'
  | 'dapp.permission.revoked'
  | 'dapp.rpc.requested'
  | 'dapp.rpc.succeeded'
  | 'dapp.rpc.failed'
  | 'dapp.sign.requested'
  | 'dapp.sign.approved'
  | 'dapp.sign.rejected'
  | 'dapp.sign.failed'
  | 'dapp.tx.requested'
  | 'dapp.tx.approved'
  | 'dapp.tx.rejected'
  | 'dapp.tx.blocked'
  | 'dapp.tx.broadcasted'
  | 'dapp.tx.failed'
  | 'walletconnect.session.proposed'
  | 'walletconnect.session.approved'
  | 'walletconnect.session.rejected'
  | 'walletconnect.session.deleted'
  | 'walletconnect.request.received'
  | 'walletconnect.request.responded'
  | 'security.url.blocked'
  | 'security.contract.blocked'
  | 'security.walletconnect.blocked';

export type DappAuditResult =
  | 'success'
  | 'rejected'
  | 'blocked'
  | 'failed'
  | 'pending';

export interface DappAuditRecord {
  auditNo: string;

  action: DappAuditAction;
  result: DappAuditResult;

  source: 'webview' | 'walletconnect' | 'deeplink' | 'internal';

  origin?: string;
  hostname?: string;
  dappId?: string;

  userId?: string;
  accountId?: string;
  address?: string;
  chainId?: string;

  method?: string;
  requestId?: string;
  sessionId?: string;
  topic?: string;

  riskLevel?: string;
  riskReasons?: string[];

  requestPayload?: unknown;
  responsePayload?: unknown;
  metadata?: unknown;

  errorCode?: string | number;
  errorMessage?: string;

  ip?: string;
  userAgent?: string;

  createdAt: number;
}

export interface DappAuditQuery {
  action?: DappAuditAction;
  result?: DappAuditResult;
  source?: string;
  origin?: string;
  hostname?: string;
  userId?: string;
  address?: string;
  chainId?: string;
  method?: string;
  riskLevel?: string;
  from?: number;
  to?: number;
  page?: number;
  pageSize?: number;
}
```



---



# 4\. Audit Storage



## `core/audit/dapp-audit-storage.service.ts`



```TypeScript
import {
  DappAuditQuery,
  DappAuditRecord,
} from './dapp-audit.types';

export interface DappAuditStorageService {
  create(record: DappAuditRecord): Promise;
  list(query?: DappAuditQuery): Promise;
}

export class InMemoryDappAuditStorageService
  implements DappAuditStorageService {
  private readonly records: DappAuditRecord[] = [];

  async create(record: DappAuditRecord): Promise {
    this.records.push(record);
  }

  async list(query: DappAuditQuery = {}) {
    const page = Math.max(query.page ?? 1, 1);
    const pageSize = Math.min(Math.max(query.pageSize ?? 20, 1), 200);

    let items = [...this.records];

    if (query.action) items = items.filter((x) => x.action === query.action);
    if (query.result) items = items.filter((x) => x.result === query.result);
    if (query.source) items = items.filter((x) => x.source === query.source);
    if (query.origin) items = items.filter((x) => x.origin === query.origin);
    if (query.hostname) items = items.filter((x) => x.hostname === query.hostname);
    if (query.userId) items = items.filter((x) => x.userId === query.userId);
    if (query.address) items = items.filter((x) => x.address?.toLowerCase() === query.address?.toLowerCase());
    if (query.chainId) items = items.filter((x) => x.chainId === query.chainId);
    if (query.method) items = items.filter((x) => x.method === query.method);
    if (query.riskLevel) items = items.filter((x) => x.riskLevel === query.riskLevel);
    if (query.from) items = items.filter((x) => x.createdAt >= query.from!);
    if (query.to) items = items.filter((x) => x.createdAt  b.createdAt - a.createdAt);

    return {
      items: items.slice((page - 1) * pageSize, page * pageSize),
      total: items.length,
      page,
      pageSize,
    };
  }
}
```



---



# 5\. Audit Repository



## `core/audit/dapp-audit.repository.ts`



```TypeScript
import {
  DappAuditQuery,
  DappAuditRecord,
} from './dapp-audit.types';
import { DappAuditStorageService } from './dapp-audit-storage.service';

export class DappAuditRepository {
  constructor(
    private readonly storage: DappAuditStorageService,
  ) {}

  create(record: DappAuditRecord): Promise {
    return this.storage.create(record);
  }

  list(query?: DappAuditQuery) {
    return this.storage.list(query);
  }
}
```



---



# 6\. Audit Service



## `core/audit/dapp-audit.service.ts`



```TypeScript
import {
  DappAuditAction,
  DappAuditRecord,
  DappAuditResult,
} from './dapp-audit.types';
import { DappAuditRepository } from './dapp-audit.repository';

export class DappAuditService {
  constructor(
    private readonly repo: DappAuditRepository,
  ) {}

  async record(input: Omit) {
    await this.repo.create({
      auditNo: this.newAuditNo(),
      ...input,
      createdAt: Date.now(),
    });
  }

  async success(
    action: DappAuditAction,
    input: Omit,
  ) {
    await this.record({
      action,
      result: 'success',
      ...input,
    });
  }

  async rejected(
    action: DappAuditAction,
    input: Omit,
  ) {
    await this.record({
      action,
      result: 'rejected',
      ...input,
    });
  }

  async blocked(
    action: DappAuditAction,
    input: Omit,
  ) {
    await this.record({
      action,
      result: 'blocked',
      ...input,
    });
  }

  async failed(
    action: DappAuditAction,
    input: Omit & {
      error?: unknown;
    },
  ) {
    const error = normalizeError(input.error);

    await this.record({
      action,
      result: 'failed',
      ...input,
      errorCode: error.code,
      errorMessage: error.message,
      metadata: {
        ...(typeof input.metadata === 'object' && input.metadata ? input.metadata as any : {}),
        errorDetails: error.details,
      },
    });
  }

  private newAuditNo(): string {
    return `DAUD-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

function normalizeError(error: unknown): {
  code?: string | number;
  message?: string;
  details?: unknown;
} {
  if (!error) return {};

  if (error instanceof Error) {
    return {
      message: error.message,
      details: error.stack,
    };
  }

  if (typeof error === 'object') {
    return {
      code: (error as any).code,
      message: (error as any).message,
      details: error,
    };
  }

  return {
    message: String(error),
  };
}
```



---



# 7\. Provider Request Audit



## `core/audit/provider-audit.service.ts`



```TypeScript
import { DappAuditService } from './dapp-audit.service';

export class ProviderAuditService {
  constructor(
    private readonly audit: DappAuditService,
  ) {}

  async requested(input: {
    origin: string;
    hostname: string;
    source: 'webview' | 'walletconnect' | 'deeplink' | 'internal';
    userId?: string;
    accountId?: string;
    address?: string;
    chainId?: string;
    method: string;
    requestId?: string;
    requestPayload?: unknown;
  }) {
    await this.audit.record({
      action: 'dapp.rpc.requested',
      result: 'pending',
      ...input,
    });
  }

  async succeeded(input: {
    origin: string;
    hostname: string;
    source: 'webview' | 'walletconnect' | 'deeplink' | 'internal';
    userId?: string;
    accountId?: string;
    address?: string;
    chainId?: string;
    method: string;
    requestId?: string;
    responsePayload?: unknown;
  }) {
    await this.audit.success('dapp.rpc.succeeded', input);
  }

  async failed(input: {
    origin: string;
    hostname: string;
    source: 'webview' | 'walletconnect' | 'deeplink' | 'internal';
    userId?: string;
    accountId?: string;
    address?: string;
    chainId?: string;
    method: string;
    requestId?: string;
    error: unknown;
  }) {
    await this.audit.failed('dapp.rpc.failed', input);
  }
}
```



---



# 8\. WalletConnect Audit



## `core/audit/walletconnect-audit.service.ts`



```TypeScript
import { DappAuditService } from './dapp-audit.service';

export class WalletConnectAuditService {
  constructor(
    private readonly audit: DappAuditService,
  ) {}

  async proposal(input: {
    topic?: string;
    origin?: string;
    hostname?: string;
    peer?: unknown;
    requiredNamespaces?: unknown;
  }) {
    await this.audit.record({
      action: 'walletconnect.session.proposed',
      result: 'pending',
      source: 'walletconnect',
      topic: input.topic,
      origin: input.origin,
      hostname: input.hostname,
      requestPayload: {
        peer: input.peer,
        requiredNamespaces: input.requiredNamespaces,
      },
    });
  }

  async approved(input: {
    topic: string;
    origin?: string;
    hostname?: string;
    namespaces?: unknown;
  }) {
    await this.audit.success('walletconnect.session.approved', {
      source: 'walletconnect',
      topic: input.topic,
      origin: input.origin,
      hostname: input.hostname,
      responsePayload: input.namespaces,
    });
  }

  async rejected(input: {
    topic?: string;
    origin?: string;
    hostname?: string;
    reason?: string;
  }) {
    await this.audit.rejected('walletconnect.session.rejected', {
      source: 'walletconnect',
      topic: input.topic,
      origin: input.origin,
      hostname: input.hostname,
      metadata: {
        reason: input.reason,
      },
    });
  }

  async deleted(input: {
    topic: string;
    reason?: string;
  }) {
    await this.audit.success('walletconnect.session.deleted', {
      source: 'walletconnect',
      topic: input.topic,
      metadata: {
        reason: input.reason,
      },
    });
  }

  async requestReceived(input: {
    topic: string;
    method: string;
    chainId?: string;
    requestPayload?: unknown;
  }) {
    await this.audit.record({
      action: 'walletconnect.request.received',
      result: 'pending',
      source: 'walletconnect',
      topic: input.topic,
      method: input.method,
      chainId: input.chainId,
      requestPayload: input.requestPayload,
    });
  }

  async requestResponded(input: {
    topic: string;
    method: string;
    chainId?: string;
    responsePayload?: unknown;
    error?: unknown;
  }) {
    if (input.error) {
      await this.audit.failed('walletconnect.request.responded', {
        source: 'walletconnect',
        topic: input.topic,
        method: input.method,
        chainId: input.chainId,
        error: input.error,
      });
      return;
    }

    await this.audit.success('walletconnect.request.responded', {
      source: 'walletconnect',
      topic: input.topic,
      method: input.method,
      chainId: input.chainId,
      responsePayload: input.responsePayload,
    });
  }
}
```



---



# 9\. Metrics 类型



## `core/monitoring/dapp-metrics.types.ts`



```TypeScript
export interface CounterMetric {
  name: string;
  labels?: Record;
  value: number;
}

export interface GaugeMetric {
  name: string;
  labels?: Record;
  value: number;
}

export interface HistogramMetric {
  name: string;
  labels?: Record;
  observations: number[];
}

export interface DappMetricsSnapshot {
  counters: CounterMetric[];
  gauges: GaugeMetric[];
  histograms: HistogramMetric[];
  ts: number;
}
```



---



# 10\. Metrics Service



## `core/monitoring/dapp-metrics.service.ts`



```TypeScript
import {
  CounterMetric,
  DappMetricsSnapshot,
  GaugeMetric,
  HistogramMetric,
} from './dapp-metrics.types';

function labelsKey(labels?: Record): string {
  if (!labels) return '';
  return Object.keys(labels)
    .sort()
    .map((key) => `${key}=${labels[key]}`)
    .join(',');
}

function metricKey(name: string, labels?: Record): string {
  return `${name}{${labelsKey(labels)}}`;
}

export class DappMetricsService {
  private readonly counters = new Map();
  private readonly gauges = new Map();
  private readonly histograms = new Map();

  inc(name: string, labels?: Record, value = 1) {
    const key = metricKey(name, labels);
    const existing = this.counters.get(key);

    this.counters.set(key, {
      name,
      labels,
      value: (existing?.value ?? 0) + value,
    });
  }

  setGauge(name: string, labels: Record | undefined, value: number) {
    this.gauges.set(metricKey(name, labels), {
      name,
      labels,
      value,
    });
  }

  observe(name: string, labels: Record | undefined, value: number) {
    const key = metricKey(name, labels);
    const existing = this.histograms.get(key);

    this.histograms.set(key, {
      name,
      labels,
      observations: [
        ...(existing?.observations ?? []),
        value,
      ].slice(-1000),
    });
  }

  snapshot(): DappMetricsSnapshot {
    return {
      counters: Array.from(this.counters.values()),
      gauges: Array.from(this.gauges.values()),
      histograms: Array.from(this.histograms.values()),
      ts: Date.now(),
    };
  }

  toPrometheus(): string {
    const lines: string[] = [];

    for (const metric of this.counters.values()) {
      lines.push(formatMetric(metric.name, metric.labels, metric.value));
    }

    for (const metric of this.gauges.values()) {
      lines.push(formatMetric(metric.name, metric.labels, metric.value));
    }

    for (const metric of this.histograms.values()) {
      const count = metric.observations.length;
      const sum = metric.observations.reduce((a, b) => a + b, 0);

      lines.push(formatMetric(`${metric.name}_count`, metric.labels, count));
      lines.push(formatMetric(`${metric.name}_sum`, metric.labels, sum));
    }

    return lines.join('\n');
  }
}

function formatMetric(
  name: string,
  labels?: Record,
  value?: number,
): string {
  const labelText = labels && Object.keys(labels).length
    ? `{${Object.entries(labels)
        .map(([k, v]) => `${k}="${String(v).replace(/"/g, '\\"')}"`)
        .join(',')}}`
    : '';

  return `${name}${labelText} ${value ?? 0}`;
}
```



---



# 11\. Health Service



## `core/monitoring/dapp-health.service.ts`



```TypeScript
export interface DappHealthCheckResult {
  status: 'ok' | 'degraded' | 'down';
  checks: Record;
  ts: number;
}

export class DappHealthService {
  private checks = new Map Promise>();

  register(
    name: string,
    check: () => Promise,
  ) {
    this.checks.set(name, check);
  }

  async check(): Promise {
    const result: DappHealthCheckResult = {
      status: 'ok',
      checks: {},
      ts: Date.now(),
    };

    for (const [name, check] of this.checks.entries()) {
      try {
        result.checks[name] = await check();
      } catch (error: any) {
        result.checks[name] = {
          status: 'down',
          message: error?.message ?? String(error),
        };
      }
    }

    const statuses = Object.values(result.checks).map((item) => item.status);

    if (statuses.includes('down')) {
      result.status = 'down';
    } else if (statuses.includes('degraded')) {
      result.status = 'degraded';
    }

    return result;
  }
}
```



---



# 12\. Alert Service



## `core/monitoring/dapp-alert.service.ts`



```TypeScript
export type DappAlertLevel = 'info' | 'warning' | 'critical';

export interface DappAlert {
  alertNo: string;
  level: DappAlertLevel;
  title: string;
  message: string;
  metadata?: unknown;
  createdAt: number;
}

export interface DappAlertSink {
  send(alert: DappAlert): Promise;
}

export class ConsoleDappAlertSink implements DappAlertSink {
  async send(alert: DappAlert): Promise {
    const method = alert.level === 'critical' ? 'error' : 'warn';
    console[method]('[DappAlert]', alert);
  }
}

export class DappAlertService {
  constructor(
    private readonly sink: DappAlertSink = new ConsoleDappAlertSink(),
  ) {}

  async critical(title: string, message: string, metadata?: unknown) {
    await this.send('critical', title, message, metadata);
  }

  async warning(title: string, message: string, metadata?: unknown) {
    await this.send('warning', title, message, metadata);
  }

  async info(title: string, message: string, metadata?: unknown) {
    await this.send('info', title, message, metadata);
  }

  private async send(
    level: DappAlertLevel,
    title: string,
    message: string,
    metadata?: unknown,
  ) {
    await this.sink.send({
      alertNo: `DALERT-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      level,
      title,
      message,
      metadata,
      createdAt: Date.now(),
    });
  }
}
```



---



# 13\. 把 Audit / Metrics 接入 Runtime



在 `create-dapp-router-runtime.ts` 中新增：



```TypeScript
import { InMemoryDappAuditStorageService } from '../audit/dapp-audit-storage.service';
import { DappAuditRepository } from '../audit/dapp-audit.repository';
import { DappAuditService } from '../audit/dapp-audit.service';
import { ProviderAuditService } from '../audit/provider-audit.service';
import { WalletConnectAuditService } from '../audit/walletconnect-audit.service';

import { DappMetricsService } from '../monitoring/dapp-metrics.service';
import { DappHealthService } from '../monitoring/dapp-health.service';
import { DappAlertService } from '../monitoring/dapp-alert.service';
```



工厂内部：



```TypeScript
const auditStorage = new InMemoryDappAuditStorageService();
const auditRepo = new DappAuditRepository(auditStorage);
const dappAudit = new DappAuditService(auditRepo);
const providerAudit = new ProviderAuditService(dappAudit);
const walletConnectAudit = new WalletConnectAuditService(dappAudit);

const metrics = new DappMetricsService();
const health = new DappHealthService();
const alerts = new DappAlertService();

health.register('dapp_registry', async () => ({
  status: 'ok',
  metadata: {
    dapps: (await dappRegistry.listDapps({ limit: 1000 })).length,
  },
}));

health.register('walletconnect', async () => ({
  status: walletConnectClient.getClient() ? 'ok' : 'degraded',
  message: walletConnectClient.getClient()
    ? 'WalletConnect initialized'
    : 'WalletConnect not initialized',
}));

health.register('rpc', async () => ({
  status: 'ok',
  metadata: {
    chains: (await chainRegistry.listEnabledChains()).length,
  },
}));
```



返回对象：



```TypeScript
return {
  ...

  auditStorage,
  auditRepo,
  dappAudit,
  providerAudit,
  walletConnectAudit,

  metrics,
  health,
  alerts,
};
```



---



# 14\. Provider Router 接入 Audit 和 Metrics



在 `DappRequestRouterService.handle` 中增加：



```TypeScript
const startedAt = Date.now();

await providerAudit?.requested({
  origin: input.context.origin,
  hostname: input.context.hostname,
  source: input.context.source,
  userId: input.context.userId,
  accountId: input.context.accountId,
  address: input.context.address,
  chainId: input.context.chainId,
  method: input.request.method,
  requestId: input.requestId,
  requestPayload: input.request,
});

metrics?.inc('dapp_provider_request_total', {
  method: input.request.method,
  source: input.context.source,
});
```



成功后：



```TypeScript
metrics?.inc('dapp_provider_request_success_total', {
  method: input.request.method,
  source: input.context.source,
});

metrics?.observe('dapp_provider_request_duration_ms', {
  method: input.request.method,
}, Date.now() - startedAt);

await providerAudit?.succeeded({
  origin: input.context.origin,
  hostname: input.context.hostname,
  source: input.context.source,
  userId: input.context.userId,
  accountId: input.context.accountId,
  address: input.context.address,
  chainId: input.context.chainId,
  method: input.request.method,
  requestId: input.requestId,
  responsePayload: result.result,
});
```



失败后：



```TypeScript
metrics?.inc('dapp_provider_request_failed_total', {
  method: input.request.method,
  source: input.context.source,
});

await providerAudit?.failed({
  origin: input.context.origin,
  hostname: input.context.hostname,
  source: input.context.source,
  userId: input.context.userId,
  accountId: input.context.accountId,
  address: input.context.address,
  chainId: input.context.chainId,
  method: input.request.method,
  requestId: input.requestId,
  error,
});
```



为了不破坏之前构造函数，可以扩展：



```TypeScript
export interface DappRequestRouterObservability {
  providerAudit?: ProviderAuditService;
  metrics?: DappMetricsService;
}
```



---



# 15\. Admin Registry Service



## `admin/registry/dapp-registry-admin.service.ts`



```TypeScript
import { DappRegistryService } from '../../core/registry/dapp-registry.service';
import {
  DappCategoryKey,
  DappRegistryItem,
  DappRegistryRiskLevel,
  DappRegistryStatus,
} from '../../core/registry/dapp-registry.types';

export class DappRegistryAdminService {
  constructor(
    private readonly registry: DappRegistryService,
  ) {}

  list(query?: {
    keyword?: string;
    category?: DappCategoryKey;
    status?: DappRegistryStatus;
  }) {
    return this.registry.listDapps({
      keyword: query?.keyword,
      category: query?.category,
      includeHidden: true,
      includeBlocked: true,
      limit: 500,
    });
  }

  get(dappId: string) {
    return this.registry.getDapp(dappId);
  }

  async upsert(input: {
    dappId: string;
    name: string;
    description?: string;
    iconUrl?: string;
    url: string;
    category: DappCategoryKey;
    tags?: string[];
    chains?: string[];
    status?: DappRegistryStatus;
    riskLevel?: DappRegistryRiskLevel;
    featured?: boolean;
    verified?: boolean;
    sortOrder?: number;
  }): Promise {
    return this.registry.upsertDapp({
      dappId: input.dappId,
      name: input.name,
      description: input.description,
      iconUrl: input.iconUrl,
      url: input.url,
      category: input.category,
      tags: input.tags ?? [],
      chains: input.chains ?? [],
      status: input.status ?? 'active',
      riskLevel: input.riskLevel ?? 'low',
      featured: input.featured ?? false,
      verified: input.verified ?? false,
      sortOrder: input.sortOrder ?? 0,
      metrics: {},
    });
  }

  async updateStatus(input: {
    dappId: string;
    status: DappRegistryStatus;
    riskLevel?: DappRegistryRiskLevel;
  }) {
    const existing = await this.registry.getDapp(input.dappId);
    if (!existing) throw new Error('DAPP_NOT_FOUND');

    return this.registry.upsertDapp({
      ...existing,
      status: input.status,
      riskLevel: input.riskLevel ?? existing.riskLevel,
    });
  }
}
```



---



# 16\. Admin Security Controller Service



Part 11 已有 `DappSecurityAdminService`，这里补充查询事件接口。



## `admin/security/dapp-security-admin.service.ts`



```TypeScript
import {
  DappSecurityRule,
  DappSecurityRuleType,
} from '../../core/security/security.types';
import { SecurityRuleStorageService } from '../../core/security/security-rule-storage.service';

export class DappSecurityAdminService {
  constructor(
    private readonly storage: SecurityRuleStorageService,
  ) {}

  async listRules(type?: DappSecurityRuleType) {
    return this.storage.listRules(type);
  }

  async upsertRule(input: {
    ruleId?: string;
    type: DappSecurityRuleType;
    value: string;
    riskLevel: DappSecurityRule['riskLevel'];
    action: DappSecurityRule['action'];
    reason?: string;
    enabled?: boolean;
    source?: DappSecurityRule['source'];
  }): Promise {
    const now = Date.now();

    const existingCreatedAt = now;

    const rule: DappSecurityRule = {
      ruleId: input.ruleId ?? this.newRuleId(),
      type: input.type,
      value: input.value.trim().toLowerCase(),
      riskLevel: input.riskLevel,
      action: input.action,
      reason: input.reason,
      enabled: input.enabled ?? true,
      source: input.source ?? 'admin',
      createdAt: existingCreatedAt,
      updatedAt: now,
    };

    await this.storage.upsertRule(rule);

    return rule;
  }

  async removeRule(ruleId: string) {
    await this.storage.removeRule(ruleId);

    return {
      removed: true,
      ruleId,
    };
  }

  private newRuleId(): string {
    return `DSR-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
```



---



# 17\. Admin Session Service



## `admin/sessions/dapp-session-admin.service.ts`



```TypeScript
import { DappSessionService } from '../../core/permissions/dapp-session.service';

export class DappSessionAdminService {
  constructor(
    private readonly sessions: DappSessionService,
  ) {}

  list(query?: {
    userId?: string;
    accountId?: string;
    origin?: string;
    includeRevoked?: boolean;
  }) {
    return this.sessions.listSessions(query);
  }

  revoke(sessionId: string) {
    return this.sessions.revokeSession(sessionId);
  }

  revokeOrigin(input: {
    origin: string;
    accountId?: string;
  }) {
    return this.sessions.revokeOrigin({
      origin: input.origin,
      accountId: input.accountId,
    });
  }
}
```



---



# 18\. Admin WalletConnect Service



## `admin/walletconnect/walletconnect-admin.service.ts`



```TypeScript
import { WalletConnectSessionService } from '../../core/walletconnect/walletconnect-session.service';
import { WalletConnectClientService } from '../../core/walletconnect/walletconnect-client.service';

export class WalletConnectAdminService {
  constructor(
    private readonly sessions: WalletConnectSessionService,
    private readonly client: WalletConnectClientService,
  ) {}

  listSessions() {
    return this.sessions.listSessions();
  }

  async disconnect(topic: string, reason?: string) {
    await this.client.disconnect({
      topic,
      reason,
    });

    await this.sessions.markDeleted(topic);

    return {
      disconnected: true,
      topic,
    };
  }
}
```



---



# 19\. Admin Audit Service



## `admin/audit/dapp-audit-admin.service.ts`



```TypeScript
import { DappAuditRepository } from '../../core/audit/dapp-audit.repository';
import { DappAuditQuery } from '../../core/audit/dapp-audit.types';

export class DappAuditAdminService {
  constructor(
    private readonly repo: DappAuditRepository,
  ) {}

  list(query: DappAuditQuery) {
    return this.repo.list(query);
  }
}
```



---



# 20\. NestJS Controller 示例



如果你的后台是 NestJS，可以这样接。



## `admin/registry/dapp-registry-admin.controller.ts`



```TypeScript
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { DappRegistryAdminService } from './dapp-registry-admin.service';

@Controller('admin/dapp/registry')
export class DappRegistryAdminController {
  constructor(
    private readonly service: DappRegistryAdminService,
  ) {}

  @Get()
  list(
    @Query('keyword') keyword?: string,
    @Query('category') category?: any,
  ) {
    return this.service.list({
      keyword,
      category,
    });
  }

  @Get(':dappId')
  get(@Param('dappId') dappId: string) {
    return this.service.get(dappId);
  }

  @Post()
  upsert(@Body() body: any) {
    return this.service.upsert(body);
  }

  @Post(':dappId/status')
  updateStatus(
    @Param('dappId') dappId: string,
    @Body() body: any,
  ) {
    return this.service.updateStatus({
      dappId,
      status: body.status,
      riskLevel: body.riskLevel,
    });
  }
}
```



---



## `admin/security/dapp-security-admin.controller.ts`



```TypeScript
import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { DappSecurityAdminService } from './dapp-security-admin.service';

@Controller('admin/dapp/security')
export class DappSecurityAdminController {
  constructor(
    private readonly service: DappSecurityAdminService,
  ) {}

  @Get('rules')
  listRules(@Query('type') type?: any) {
    return this.service.listRules(type);
  }

  @Post('rules')
  upsertRule(@Body() body: any) {
    return this.service.upsertRule(body);
  }

  @Delete('rules/:ruleId')
  removeRule(@Param('ruleId') ruleId: string) {
    return this.service.removeRule(ruleId);
  }
}
```



---



## `admin/sessions/dapp-session-admin.controller.ts`



```TypeScript
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { DappSessionAdminService } from './dapp-session-admin.service';

@Controller('admin/dapp/sessions')
export class DappSessionAdminController {
  constructor(
    private readonly service: DappSessionAdminService,
  ) {}

  @Get()
  list(
    @Query('userId') userId?: string,
    @Query('accountId') accountId?: string,
    @Query('origin') origin?: string,
    @Query('includeRevoked') includeRevoked?: string,
  ) {
    return this.service.list({
      userId,
      accountId,
      origin,
      includeRevoked: includeRevoked === 'true',
    });
  }

  @Post(':sessionId/revoke')
  revoke(@Param('sessionId') sessionId: string) {
    return this.service.revoke(sessionId);
  }

  @Post('revoke-origin')
  revokeOrigin(@Body() body: {
    origin: string;
    accountId?: string;
  }) {
    return this.service.revokeOrigin(body);
  }
}
```



---



## `admin/walletconnect/walletconnect-admin.controller.ts`



```TypeScript
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { WalletConnectAdminService } from './walletconnect-admin.service';

@Controller('admin/dapp/walletconnect')
export class WalletConnectAdminController {
  constructor(
    private readonly service: WalletConnectAdminService,
  ) {}

  @Get('sessions')
  listSessions() {
    return this.service.listSessions();
  }

  @Post('sessions/:topic/disconnect')
  disconnect(
    @Param('topic') topic: string,
    @Body() body: { reason?: string },
  ) {
    return this.service.disconnect(topic, body.reason);
  }
}
```



---



## `admin/audit/dapp-audit-admin.controller.ts`



```TypeScript
import { Controller, Get, Query } from '@nestjs/common';
import { DappAuditAdminService } from './dapp-audit-admin.service';

@Controller('admin/dapp/audits')
export class DappAuditAdminController {
  constructor(
    private readonly service: DappAuditAdminService,
  ) {}

  @Get()
  list(
    @Query('action') action?: any,
    @Query('result') result?: any,
    @Query('source') source?: string,
    @Query('hostname') hostname?: string,
    @Query('userId') userId?: string,
    @Query('address') address?: string,
    @Query('chainId') chainId?: string,
    @Query('method') method?: string,
    @Query('riskLevel') riskLevel?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.list({
      action,
      result,
      source,
      hostname,
      userId,
      address,
      chainId,
      method,
      riskLevel,
      from: from ? Number(from) : undefined,
      to: to ? Number(to) : undefined,
      page: Number(page ?? 1),
      pageSize: Number(pageSize ?? 20),
    });
  }
}
```



---



# 21\. Metrics Controller



## `admin/dapp-monitoring.controller.ts`



```TypeScript
import { Controller, Get } from '@nestjs/common';
import { DappMetricsService } from '../core/monitoring/dapp-metrics.service';
import { DappHealthService } from '../core/monitoring/dapp-health.service';

@Controller('admin/dapp/monitoring')
export class DappMonitoringController {
  constructor(
    private readonly metrics: DappMetricsService,
    private readonly health: DappHealthService,
  ) {}

  @Get('metrics')
  metricsSnapshot() {
    return this.metrics.snapshot();
  }

  @Get('metrics/prometheus')
  prometheus() {
    return this.metrics.toPrometheus();
  }

  @Get('health')
  healthCheck() {
    return this.health.check();
  }
}
```



---



# 22\. 关键指标清单



```Plain Text
dapp_browser_open_total
dapp_provider_request_total
dapp_provider_request_success_total
dapp_provider_request_failed_total
dapp_provider_request_duration_ms
dapp_connect_approved_total
dapp_connect_rejected_total
dapp_sign_requested_total
dapp_sign_rejected_total
dapp_tx_requested_total
dapp_tx_blocked_total
dapp_tx_broadcasted_total
dapp_security_block_total
dapp_walletconnect_session_total
dapp_walletconnect_request_total
dapp_webview_navigation_block_total
dapp_rpc_error_total
dapp_audit_write_failed_total
```



Labels：



```Plain Text
source
origin
hostname
method
chain_id
risk_level
result
```



---



# 23\. P0 告警清单



必须 P0：



```Plain Text
用户未确认但签名成功
用户未确认但交易广播
黑名单域名被打开
黑名单合约交易广播
WalletConnect 黑名单 peer 建立 session
审计日志写入失败持续超过阈值
交易失败率异常飙升
RPC 错误率异常飙升
Provider 请求大面积超时
WebView 崩溃率异常
```



---



# 24\. Admin 权限点



```Plain Text
dapp_registry:view
dapp_registry:manage
dapp_registry:block
dapp_security:view
dapp_security:manage
dapp_security:block_domain
dapp_security:block_contract
dapp_session:view
dapp_session:revoke
dapp_walletconnect:view
dapp_walletconnect:disconnect
dapp_audit:view
dapp_monitoring:view
```



高危操作必须 MFA \+ 审计：



```Plain Text
block domain
block contract
unblock domain
unblock contract
revoke user session
disconnect WalletConnect session
mark DApp active after blocked
```



---



# 25\. 本章完成内容



本章完成：



```Plain Text
DApp Audit Log 类型
Audit Storage
Audit Repository
Audit Service
Provider Audit
WalletConnect Audit
Metrics Service
Health Service
Alert Service
Runtime 接入 Audit / Metrics
Admin DApp Registry 管理
Admin Security Rule 管理
Admin DApp Session 管理
Admin WalletConnect 管理
Admin Audit 查询
Monitoring Controller
Prometheus 输出
P0 告警清单
Admin 权限点
```



至此 DApp 浏览器具备生产运营能力：



```Plain Text
可追踪
可审计
可查询
可监控
可后台封禁
可后台撤销
可告警
```



---



# 26\. 下一章继续



下一段最后建议写：



**《DApp 浏览器 Part 13：完整联调验收清单 / 性能测试 / 安全测试 / 上线 Checklist》**



覆盖：



```Plain Text
Provider 兼容性测试
WebView 安全测试
WalletConnect 联调
DApp 连接测试
签名测试
交易测试
钓鱼拦截测试
黑名单合约测试
Session 权限隔离测试
多账户切换测试
多链切换测试
性能指标
上线 Checklist
```



