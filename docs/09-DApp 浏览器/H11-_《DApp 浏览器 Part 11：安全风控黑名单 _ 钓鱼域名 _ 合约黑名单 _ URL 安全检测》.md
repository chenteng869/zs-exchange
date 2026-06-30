# H11\-
《DApp 浏览器 Part 11：安全风控黑名单 / 钓鱼域名 / 合约黑名单 / URL 安全检测》

# 《DApp 浏览器 Part 11：安全风控黑名单 / 钓鱼域名 / 合约黑名单 / URL 安全检测》



本章实现 DApp 浏览器安全风控系统，覆盖：



- URL Security Engine

- Phishing Detector

- Domain Blacklist

- Homograph Attack 检测

- HTTP / file / data / javascript 拦截

- Redirect Chain 检测

- Contract Blacklist

- Risk Rule Storage

- DApp 风险事件

- WalletConnect Proposal 安全检测

- WebView Navigation 安全升级

- 交易合约安全升级

- Admin 风控数据结构

    

核心原则：



```Plain Text
DApp 浏览器安全系统必须在三个入口同时生效：

1. WebView 打开 URL
2. WalletConnect Session Proposal
3. eth_sendTransaction / 签名请求

任何一个入口绕过安全检测，都等于安全系统失效。
```



---



## 1\. 本章目录结构



```Bash
src/modules/dapp-browser/
  core/
    security/
      security.types.ts
      security-rule-storage.service.ts
      url-security.service.ts
      domain-blacklist.service.ts
      phishing-detector.service.ts
      homograph-detector.service.ts
      redirect-security.service.ts
      contract-blacklist.service.ts
      transaction-security.service.ts
      walletconnect-security.service.ts
      security-event.service.ts
      security-policy.service.ts

  admin/
    security/
      dapp-security-admin.types.ts
      dapp-security-admin.service.ts
      dapp-security-admin.controller.ts
```



---



## 2\. 安全类型



### `core/security/security.types.ts`



```TypeScript
export type DappSecurityRiskLevel =
  | 'none'
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'
  | 'blocked';

export type DappSecurityAction =
  | 'allow'
  | 'warn'
  | 'block'
  | 'require_extra_confirm';

export type DappSecurityRuleType =
  | 'domain_blacklist'
  | 'domain_warning'
  | 'contract_blacklist'
  | 'contract_warning'
  | 'url_scheme_block'
  | 'phishing_domain'
  | 'homograph_domain'
  | 'walletconnect_peer_block'
  | 'redirect_risk';

export interface DappSecurityDecision {
  allowed: boolean;
  action: DappSecurityAction;
  riskLevel: DappSecurityRiskLevel;
  reasons: string[];
  matchedRules?: DappSecurityRule[];
  metadata?: Record;
}

export interface DappSecurityRule {
  ruleId: string;
  type: DappSecurityRuleType;
  value: string;
  riskLevel: DappSecurityRiskLevel;
  action: DappSecurityAction;
  reason?: string;
  enabled: boolean;
  source: 'system' | 'admin' | 'remote' | 'community';
  createdAt: number;
  updatedAt: number;
}

export interface UrlSecurityInput {
  url: string;
  source: 'webview' | 'walletconnect' | 'deeplink' | 'manual';
}

export interface UrlSecurityResult extends DappSecurityDecision {
  url: string;
  origin?: string;
  hostname?: string;
  protocol?: string;
}

export interface ContractSecurityInput {
  chainId: string;
  address: string;
  origin?: string;
  source: 'transaction' | 'token' | 'nft' | 'approval';
}

export interface ContractSecurityResult extends DappSecurityDecision {
  chainId: string;
  address: string;
}

export interface WalletConnectSecurityInput {
  proposalId: number;
  peerUrl?: string;
  peerName?: string;
  peerDescription?: string;
  peerIcons?: string[];
  requiredNamespaces?: unknown;
  optionalNamespaces?: unknown;
}

export interface SecurityEventRecord {
  eventNo: string;
  type:
    | 'url_checked'
    | 'url_blocked'
    | 'domain_blocked'
    | 'phishing_detected'
    | 'homograph_detected'
    | 'contract_blocked'
    | 'walletconnect_blocked'
    | 'redirect_blocked';

  riskLevel: DappSecurityRiskLevel;
  action: DappSecurityAction;

  url?: string;
  origin?: string;
  hostname?: string;
  chainId?: string;
  address?: string;

  reasons: string[];
  metadata?: Record;

  createdAt: number;
}
```



---



## 3\. Security Rule Storage



生产中建议从后端拉规则，落本地缓存，并支持热更新。



### `core/security/security-rule-storage.service.ts`



```TypeScript
import {
  DappSecurityRule,
  DappSecurityRuleType,
} from './security.types';

export interface SecurityRuleStorageService {
  listRules(type?: DappSecurityRuleType): Promise;
  upsertRule(rule: DappSecurityRule): Promise;
  removeRule(ruleId: string): Promise;
}

export class InMemorySecurityRuleStorageService
  implements SecurityRuleStorageService {
  private readonly rules = new Map();

  constructor(initialRules: DappSecurityRule[] = []) {
    for (const rule of initialRules) {
      this.rules.set(rule.ruleId, rule);
    }
  }

  async listRules(type?: DappSecurityRuleType): Promise {
    return Array.from(this.rules.values())
      .filter((item) => item.enabled)
      .filter((item) => !type || item.type === type)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async upsertRule(rule: DappSecurityRule): Promise {
    this.rules.set(rule.ruleId, rule);
  }

  async removeRule(ruleId: string): Promise {
    this.rules.delete(ruleId);
  }
}
```



---



## 4\. 默认安全规则



### `core/security/default-security-rules.ts`



```TypeScript
import { DappSecurityRule } from './security.types';

const now = Date.now();

export const DEFAULT_SECURITY_RULES: DappSecurityRule[] = [
  {
    ruleId: 'scheme-javascript',
    type: 'url_scheme_block',
    value: 'javascript:',
    riskLevel: 'blocked',
    action: 'block',
    reason: 'JavaScript URL scheme is not allowed',
    enabled: true,
    source: 'system',
    createdAt: now,
    updatedAt: now,
  },
  {
    ruleId: 'scheme-file',
    type: 'url_scheme_block',
    value: 'file:',
    riskLevel: 'blocked',
    action: 'block',
    reason: 'File URL scheme is not allowed',
    enabled: true,
    source: 'system',
    createdAt: now,
    updatedAt: now,
  },
  {
    ruleId: 'scheme-data',
    type: 'url_scheme_block',
    value: 'data:',
    riskLevel: 'blocked',
    action: 'block',
    reason: 'Data URL scheme is not allowed',
    enabled: true,
    source: 'system',
    createdAt: now,
    updatedAt: now,
  },
  {
    ruleId: 'contract-dead',
    type: 'contract_blacklist',
    value: '0x000000000000000000000000000000000000dead',
    riskLevel: 'blocked',
    action: 'block',
    reason: 'Known blocked contract',
    enabled: true,
    source: 'system',
    createdAt: now,
    updatedAt: now,
  },
];
```



---



## 5\. Domain Blacklist Service



### `core/security/domain-blacklist.service.ts`



```TypeScript
import {
  DappSecurityDecision,
  DappSecurityRule,
} from './security.types';
import { SecurityRuleStorageService } from './security-rule-storage.service';

export class DomainBlacklistService {
  constructor(
    private readonly storage: SecurityRuleStorageService,
  ) {}

  async check(hostname: string): Promise {
    const normalized = normalizeHostname(hostname);

    const rules = [
      ...(await this.storage.listRules('domain_blacklist')),
      ...(await this.storage.listRules('domain_warning')),
      ...(await this.storage.listRules('phishing_domain')),
    ];

    const matched = rules.filter((rule) =>
      matchDomainRule(normalized, rule),
    );

    if (matched.length === 0) {
      return {
        allowed: true,
        action: 'allow',
        riskLevel: 'none',
        reasons: [],
      };
    }

    const blocked = matched.find((rule) => rule.action === 'block');

    if (blocked) {
      return {
        allowed: false,
        action: 'block',
        riskLevel: 'blocked',
        reasons: matched.map((item) => item.reason ?? `DOMAIN_RULE:${item.value}`),
        matchedRules: matched,
      };
    }

    return {
      allowed: true,
      action: 'warn',
      riskLevel: maxRisk(matched.map((item) => item.riskLevel)),
      reasons: matched.map((item) => item.reason ?? `DOMAIN_WARNING:${item.value}`),
      matchedRules: matched,
    };
  }
}

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.$/, '');
}

function matchDomainRule(hostname: string, rule: DappSecurityRule): boolean {
  const value = normalizeHostname(rule.value);

  if (hostname === value) return true;

  if (value.startsWith('*.')) {
    const suffix = value.slice(1);
    return hostname.endsWith(suffix);
  }

  return false;
}

function maxRisk(values: string[]): any {
  const order = ['none', 'low', 'medium', 'high', 'critical', 'blocked'];
  return values.reduce((max, item) =>
    order.indexOf(item) > order.indexOf(max) ? item : max,
  'none');
}
```



---



## 6\. Homograph Detector



检测同形字攻击，比如：



```Plain Text
uniswap.org
uníswap.org
unіswap.org   // 这里 i 可能是西里尔字符
```



### `core/security/homograph-detector.service.ts`



```TypeScript
import { DappSecurityDecision } from './security.types';

export class HomographDetectorService {
  private readonly protectedBrands = [
    'uniswap',
    'aave',
    'opensea',
    'pancakeswap',
    'curve',
    'compound',
    'lido',
    'blur',
    'snapshot',
  ];

  check(hostname: string): DappSecurityDecision {
    const normalized = hostname.toLowerCase();

    if (containsNonAscii(normalized)) {
      const asciiLike = stripSuspiciousChars(normalized);

      for (const brand of this.protectedBrands) {
        if (levenshtein(asciiLike, brand) 
    Array.from({ length: b.length + 1 }, () => 0),
  );

  for (let i = 0; i  0) {
      return {
        allowed: true,
        action: 'warn',
        riskLevel: 'high',
        reasons,
      };
    }

    return {
      allowed: true,
      action: 'allow',
      riskLevel: 'none',
      reasons: [],
    };
  }
}
```



---



## 8\. URL Security Service



统一 URL 安全检测。



### `core/security/url-security.service.ts`



```TypeScript
import {
  DappSecurityDecision,
  UrlSecurityInput,
  UrlSecurityResult,
} from './security.types';
import { DomainBlacklistService } from './domain-blacklist.service';
import { HomographDetectorService } from './homograph-detector.service';
import { PhishingDetectorService } from './phishing-detector.service';

const BLOCKED_PROTOCOLS = new Set([
  'file:',
  'data:',
  'javascript:',
  'vbscript:',
  'about:',
]);

const EXTERNAL_PROTOCOLS = new Set([
  'mailto:',
  'tel:',
  'sms:',
  'intent:',
  'market:',
  'itms-apps:',
  'wc:',
]);

export class UrlSecurityService {
  constructor(
    private readonly domainBlacklist: DomainBlacklistService,
    private readonly homograph: HomographDetectorService,
    private readonly phishing: PhishingDetectorService,
  ) {}

  async check(input: UrlSecurityInput): Promise {
    let parsed: URL;

    try {
      parsed = new URL(input.url);
    } catch {
      return {
        url: input.url,
        allowed: false,
        action: 'block',
        riskLevel: 'blocked',
        reasons: ['INVALID_URL'],
      };
    }

    if (BLOCKED_PROTOCOLS.has(parsed.protocol)) {
      return {
        url: input.url,
        origin: parsed.origin,
        hostname: parsed.hostname,
        protocol: parsed.protocol,
        allowed: false,
        action: 'block',
        riskLevel: 'blocked',
        reasons: [`BLOCKED_PROTOCOL:${parsed.protocol}`],
      };
    }

    if (EXTERNAL_PROTOCOLS.has(parsed.protocol)) {
      return {
        url: input.url,
        origin: parsed.origin,
        hostname: parsed.hostname,
        protocol: parsed.protocol,
        allowed: true,
        action: 'require_extra_confirm',
        riskLevel: 'medium',
        reasons: [`EXTERNAL_PROTOCOL:${parsed.protocol}`],
      };
    }

    if (parsed.protocol !== 'https:') {
      return {
        url: input.url,
        origin: parsed.origin,
        hostname: parsed.hostname,
        protocol: parsed.protocol,
        allowed: false,
        action: 'block',
        riskLevel: 'blocked',
        reasons: ['HTTPS_REQUIRED'],
      };
    }

    const decisions: DappSecurityDecision[] = [
      await this.domainBlacklist.check(parsed.hostname),
      this.homograph.check(parsed.hostname),
      this.phishing.check({
        url: input.url,
        hostname: parsed.hostname,
      }),
    ];

    return mergeUrlDecision({
      url: input.url,
      origin: parsed.origin,
      hostname: parsed.hostname,
      protocol: parsed.protocol,
      decisions,
    });
  }
}

function mergeUrlDecision(input: {
  url: string;
  origin: string;
  hostname: string;
  protocol: string;
  decisions: DappSecurityDecision[];
}): UrlSecurityResult {
  const blocked = input.decisions.find((item) => !item.allowed || item.action === 'block');

  if (blocked) {
    return {
      url: input.url,
      origin: input.origin,
      hostname: input.hostname,
      protocol: input.protocol,
      allowed: false,
      action: 'block',
      riskLevel: 'blocked',
      reasons: input.decisions.flatMap((item) => item.reasons),
      matchedRules: input.decisions.flatMap((item) => item.matchedRules ?? []),
      metadata: {
        decisions: input.decisions,
      },
    };
  }

  const warnings = input.decisions.filter((item) => item.action !== 'allow');

  if (warnings.length > 0) {
    return {
      url: input.url,
      origin: input.origin,
      hostname: input.hostname,
      protocol: input.protocol,
      allowed: true,
      action: 'warn',
      riskLevel: maxRisk(warnings.map((item) => item.riskLevel)),
      reasons: warnings.flatMap((item) => item.reasons),
      matchedRules: warnings.flatMap((item) => item.matchedRules ?? []),
      metadata: {
        decisions: input.decisions,
      },
    };
  }

  return {
    url: input.url,
    origin: input.origin,
    hostname: input.hostname,
    protocol: input.protocol,
    allowed: true,
    action: 'allow',
    riskLevel: 'none',
    reasons: [],
  };
}

function maxRisk(values: string[]): any {
  const order = ['none', 'low', 'medium', 'high', 'critical', 'blocked'];
  return values.reduce((max, item) =>
    order.indexOf(item) > order.indexOf(max) ? item : max,
  'none');
}
```



---



## 9\. Redirect Security Service



防止安全域名跳转到钓鱼域名。



### `core/security/redirect-security.service.ts`



```TypeScript
import { UrlSecurityService } from './url-security.service';
import { UrlSecurityResult } from './security.types';

export class RedirectSecurityService {
  constructor(
    private readonly urlSecurity: UrlSecurityService,
  ) {}

  async checkRedirectChain(input: {
    urls: string[];
  }): Promise {
    for (const url of input.urls) {
      const result = await this.urlSecurity.check({
        url,
        source: 'webview',
      });

      if (!result.allowed) {
        return {
          ...result,
          reasons: [
            'REDIRECT_CHAIN_BLOCKED',
            ...result.reasons,
          ],
          metadata: {
            ...(result.metadata ?? {}),
            redirectChain: input.urls,
          },
        };
      }
    }

    const last = input.urls[input.urls.length - 1];

    return this.urlSecurity.check({
      url: last,
      source: 'webview',
    });
  }
}
```



---



## 10\. Contract Blacklist Service



替换 Part 7 中较简单的 `ContractSecurityService`。



### `core/security/contract-blacklist.service.ts`



```TypeScript
import {
  ContractSecurityInput,
  ContractSecurityResult,
} from './security.types';
import { SecurityRuleStorageService } from './security-rule-storage.service';

export class ContractBlacklistService {
  constructor(
    private readonly storage: SecurityRuleStorageService,
  ) {}

  async check(input: ContractSecurityInput): Promise {
    const address = input.address.toLowerCase();

    const rules = [
      ...(await this.storage.listRules('contract_blacklist')),
      ...(await this.storage.listRules('contract_warning')),
    ];

    const matched = rules.filter(
      (rule) => rule.value.toLowerCase() === address,
    );

    if (matched.length === 0) {
      return {
        chainId: input.chainId,
        address,
        allowed: true,
        action: 'allow',
        riskLevel: 'none',
        reasons: [],
      };
    }

    const blocked = matched.find((rule) => rule.action === 'block');

    if (blocked) {
      return {
        chainId: input.chainId,
        address,
        allowed: false,
        action: 'block',
        riskLevel: 'blocked',
        reasons: matched.map((item) => item.reason ?? 'CONTRACT_BLOCKED'),
        matchedRules: matched,
      };
    }

    return {
      chainId: input.chainId,
      address,
      allowed: true,
      action: 'warn',
      riskLevel: maxRisk(matched.map((item) => item.riskLevel)),
      reasons: matched.map((item) => item.reason ?? 'CONTRACT_WARNING'),
      matchedRules: matched,
    };
  }
}

function maxRisk(values: string[]): any {
  const order = ['none', 'low', 'medium', 'high', 'critical', 'blocked'];
  return values.reduce((max, item) =>
    order.indexOf(item) > order.indexOf(max) ? item : max,
  'none');
}
```



---



## 11\. Transaction Security Service



给 Part 7 交易系统接入更强合约安全。



### `core/security/transaction-security.service.ts`



```TypeScript
import { ParsedTransactionIntent } from '../transaction/transaction.types';
import { ContractBlacklistService } from './contract-blacklist.service';
import { DappSecurityDecision } from './security.types';

export class TransactionSecurityService {
  constructor(
    private readonly contractBlacklist: ContractBlacklistService,
  ) {}

  async check(input: {
    chainId: string;
    origin: string;
    intent: ParsedTransactionIntent;
  }): Promise {
    const targets = [
      input.intent.contractAddress,
      input.intent.to,
      input.intent.spender,
      input.intent.operator,
    ].filter(Boolean) as string[];

    const results = [];

    for (const address of new Set(targets.map((item) => item.toLowerCase()))) {
      results.push(
        await this.contractBlacklist.check({
          chainId: input.chainId,
          address,
          origin: input.origin,
          source: 'transaction',
        }),
      );
    }

    const blocked = results.find((item) => !item.allowed);

    if (blocked) {
      return {
        allowed: false,
        action: 'block',
        riskLevel: 'blocked',
        reasons: results.flatMap((item) => item.reasons),
        matchedRules: results.flatMap((item) => item.matchedRules ?? []),
        metadata: {
          targets,
          results,
        },
      };
    }

    const warnings = results.filter((item) => item.action === 'warn');

    if (warnings.length > 0) {
      return {
        allowed: true,
        action: 'warn',
        riskLevel: 'high',
        reasons: warnings.flatMap((item) => item.reasons),
        matchedRules: warnings.flatMap((item) => item.matchedRules ?? []),
        metadata: {
          targets,
          results,
        },
      };
    }

    return {
      allowed: true,
      action: 'allow',
      riskLevel: 'none',
      reasons: [],
    };
  }
}
```



---



## 12\. WalletConnect Security Service



WalletConnect proposal 的 peer URL 也必须检测。



### `core/security/walletconnect-security.service.ts`



```TypeScript
import {
  WalletConnectSecurityInput,
  DappSecurityDecision,
} from './security.types';
import { UrlSecurityService } from './url-security.service';

export class WalletConnectSecurityService {
  constructor(
    private readonly urlSecurity: UrlSecurityService,
  ) {}

  async checkProposal(
    input: WalletConnectSecurityInput,
  ): Promise {
    if (!input.peerUrl) {
      return {
        allowed: true,
        action: 'warn',
        riskLevel: 'medium',
        reasons: ['WALLETCONNECT_PEER_URL_MISSING'],
      };
    }

    const result = await this.urlSecurity.check({
      url: input.peerUrl,
      source: 'walletconnect',
    });

    if (!result.allowed) {
      return {
        allowed: false,
        action: 'block',
        riskLevel: 'blocked',
        reasons: [
          'WALLETCONNECT_PEER_BLOCKED',
          ...result.reasons,
        ],
        metadata: {
          proposalId: input.proposalId,
          peerUrl: input.peerUrl,
          result,
        },
      };
    }

    return result;
  }
}
```



---



## 13\. Security Event Service



### `core/security/security-event.service.ts`



```TypeScript
import { SecurityEventRecord } from './security.types';

export interface SecurityEventSink {
  record(event: SecurityEventRecord): Promise;
}

export class ConsoleSecurityEventSink implements SecurityEventSink {
  async record(event: SecurityEventRecord): Promise {
    console.log('[DappSecurityEvent]', event);
  }
}

export class SecurityEventService {
  constructor(
    private readonly sink: SecurityEventSink = new ConsoleSecurityEventSink(),
  ) {}

  async record(input: Omit) {
    await this.sink.record({
      eventNo: this.newEventNo(),
      ...input,
      createdAt: Date.now(),
    });
  }

  async recordDecision(input: {
    type: SecurityEventRecord['type'];
    decision: {
      action: any;
      riskLevel: any;
      reasons: string[];
    };
    url?: string;
    origin?: string;
    hostname?: string;
    chainId?: string;
    address?: string;
    metadata?: Record;
  }) {
    await this.record({
      type: input.type,
      action: input.decision.action,
      riskLevel: input.decision.riskLevel,
      reasons: input.decision.reasons,
      url: input.url,
      origin: input.origin,
      hostname: input.hostname,
      chainId: input.chainId,
      address: input.address,
      metadata: input.metadata,
    });
  }

  private newEventNo(): string {
    return `DSEC-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }
}
```



---



## 14\. Security Policy Service



统一创建安全系统。



### `core/security/security-policy.service.ts`



```TypeScript
import { DEFAULT_SECURITY_RULES } from './default-security-rules';
import { InMemorySecurityRuleStorageService } from './security-rule-storage.service';
import { DomainBlacklistService } from './domain-blacklist.service';
import { HomographDetectorService } from './homograph-detector.service';
import { PhishingDetectorService } from './phishing-detector.service';
import { UrlSecurityService } from './url-security.service';
import { RedirectSecurityService } from './redirect-security.service';
import { ContractBlacklistService } from './contract-blacklist.service';
import { TransactionSecurityService } from './transaction-security.service';
import { WalletConnectSecurityService } from './walletconnect-security.service';
import { SecurityEventService } from './security-event.service';

export function createDappSecurityPolicyRuntime() {
  const securityRuleStorage =
    new InMemorySecurityRuleStorageService(DEFAULT_SECURITY_RULES);

  const domainBlacklist =
    new DomainBlacklistService(securityRuleStorage);

  const homographDetector =
    new HomographDetectorService();

  const phishingDetector =
    new PhishingDetectorService();

  const urlSecurity =
    new UrlSecurityService(
      domainBlacklist,
      homographDetector,
      phishingDetector,
    );

  const redirectSecurity =
    new RedirectSecurityService(urlSecurity);

  const contractBlacklist =
    new ContractBlacklistService(securityRuleStorage);

  const transactionSecurity =
    new TransactionSecurityService(contractBlacklist);

  const walletConnectSecurity =
    new WalletConnectSecurityService(urlSecurity);

  const securityEvent =
    new SecurityEventService();

  return {
    securityRuleStorage,
    domainBlacklist,
    homographDetector,
    phishingDetector,
    urlSecurity,
    redirectSecurity,
    contractBlacklist,
    transactionSecurity,
    walletConnectSecurity,
    securityEvent,
  };
}
```



---



## 15\. WebView Navigation 安全升级



Part 2 的 `WebViewNavigationGuard` 是静态规则。现在升级成使用 `UrlSecurityService`。



### `core/webview/webview-navigation-security.service.ts`



```TypeScript
import { WebViewNavigation } from 'react-native-webview';
import { UrlSecurityService } from '../security/url-security.service';
import { SecurityEventService } from '../security/security-event.service';
import { NavigationDecision } from './webview.types';

export class WebViewNavigationSecurityService {
  constructor(
    private readonly urlSecurity: UrlSecurityService,
    private readonly securityEvent: SecurityEventService,
  ) {}

  async decide(navigation: WebViewNavigation): Promise {
    const result = await this.urlSecurity.check({
      url: navigation.url,
      source: 'webview',
    });

    await this.securityEvent.recordDecision({
      type: result.allowed ? 'url_checked' : 'url_blocked',
      decision: result,
      url: result.url,
      origin: result.origin,
      hostname: result.hostname,
      metadata: {
        navigation,
      },
    });

    if (!result.allowed) {
      return {
        allow: false,
        action: 'block',
        url: navigation.url,
        reason: result.reasons.join(','),
      };
    }

    if (result.action === 'require_extra_confirm') {
      return {
        allow: false,
        action: 'external',
        url: navigation.url,
        reason: result.reasons.join(','),
      };
    }

    return {
      allow: true,
      action: result.action === 'warn' ? 'allow' : 'allow',
      url: navigation.url,
      reason: result.reasons.join(','),
    };
  }
}
```



React Native `onShouldStartLoadWithRequest` 通常要求同步返回 boolean。生产方案：



```Plain Text
1. 同步阻断明显危险 scheme
2. 异步安全检测在 load 前预检 URL
3. 地址栏 submit 时先 await urlSecurity
4. navigation 中再做同步兜底
```



也就是说：



```TypeScript
async function loadUrl(url: string) {
  const result = await runtime.urlSecurity.check({ url, source: 'manual' });

  if (!result.allowed) {
    showBlockedPage(result);
    return;
  }

  setWebViewUrl(url);
}
```



---



## 16\. WalletConnect Proposal 安全接入



升级 `WalletConnectProposalService.handleProposal`：



```TypeScript
const security = await this.walletConnectSecurity.checkProposal({
  proposalId: proposal.id,
  peerUrl: peer.url,
  peerName: peer.name,
  peerDescription: peer.description,
  peerIcons: peer.icons,
  requiredNamespaces: proposal.params?.requiredNamespaces,
  optionalNamespaces: proposal.params?.optionalNamespaces,
});

if (!security.allowed) {
  await this.securityEvent.recordDecision({
    type: 'walletconnect_blocked',
    decision: security,
    url: peer.url,
    hostname: safeHostname(peer.url),
    metadata: {
      proposal,
    },
  });

  await this.client.rejectSession(
    proposal.id,
    security.reasons.join(','),
  );

  return;
}
```



构造函数新增：



```TypeScript
private readonly walletConnectSecurity: WalletConnectSecurityService,
private readonly securityEvent: SecurityEventService,
```



---



## 17\. Transaction Risk 接入安全系统



Part 7 的 `TransactionRiskService` 中加入 `TransactionSecurityService`。



### 升级思路



```TypeScript
const security = await transactionSecurity.check({
  chainId,
  origin,
  intent,
});

if (!security.allowed) {
  risk.allowed = false;
  risk.riskLevel = 'blocked';
  risk.reasons.push(...security.reasons);
}
```



如果当前 `evaluate` 是同步函数，可以新增异步版本：



### `core/transaction/transaction-risk.service.ts` 新增



```TypeScript
import { TransactionSecurityService } from '../security/transaction-security.service';

export class TransactionRiskService {
  constructor(
    private readonly transactionSecurity?: TransactionSecurityService,
  ) {}

  async evaluateAsync(input: {
    chainId: string;
    origin: string;
    intent: ParsedTransactionIntent;
  }): Promise {
    const base = this.evaluate({
      chainId: input.chainId,
      intent: input.intent,
    });

    if (!this.transactionSecurity) return base;

    const security = await this.transactionSecurity.check({
      chainId: input.chainId,
      origin: input.origin,
      intent: input.intent,
    });

    if (!security.allowed) {
      return {
        ...base,
        allowed: false,
        riskLevel: 'blocked',
        reasons: [
          ...base.reasons,
          ...security.reasons,
        ],
        warnings: base.warnings,
        metadata: {
          ...(base.metadata ?? {}),
          security,
        },
      };
    }

    if (security.action === 'warn') {
      return {
        ...base,
        riskLevel: maxRisk(base.riskLevel, security.riskLevel as any),
        warnings: [
          ...base.warnings,
          ...security.reasons,
        ],
        metadata: {
          ...(base.metadata ?? {}),
          security,
        },
      };
    }

    return base;
  }
}
```



然后 `TransactionRequestService` 中：



```TypeScript
const risk = await this.riskService.evaluateAsync({
  chainId: input.chainId,
  origin: input.origin,
  intent,
});
```



---



## 18\. Runtime 工厂接入安全系统



在 `create-dapp-router-runtime.ts` 中：



```TypeScript
import { createDappSecurityPolicyRuntime } from '../security/security-policy.service';
```



工厂内部：



```TypeScript
const security = createDappSecurityPolicyRuntime();
```



交易风险：



```TypeScript
const transactionRisk = new TransactionRiskService(
  security.transactionSecurity,
);
```



WalletConnect proposal：



```TypeScript
walletConnectProposalService = new WalletConnectProposalService(
  walletConnectClient,
  chainRegistry,
  activeAccount,
  walletConnectNamespace,
  walletConnectSession,
  confirmationController,
  security.walletConnectSecurity,
  security.securityEvent,
);
```



返回对象：



```TypeScript
return {
  ...
  security,
};
```



---



## 19\. Admin 风控数据结构



### Prisma 建议



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



## 20\. Admin Service



### `admin/security/dapp-security-admin.service.ts`



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

    const rule: DappSecurityRule = {
      ruleId: input.ruleId ?? this.newRuleId(),
      type: input.type,
      value: input.value.trim().toLowerCase(),
      riskLevel: input.riskLevel,
      action: input.action,
      reason: input.reason,
      enabled: input.enabled ?? true,
      source: input.source ?? 'admin',
      createdAt: now,
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



## 21\. 测试用例



### 21\.1 URL Scheme



```Plain Text
https://app.uniswap.org        allow
http://app.uniswap.org         block
javascript:alert(1)            block
file:///etc/passwd             block
data:text/html;base64,...      block
wc:xxxx                        require_extra_confirm / walletconnect
```



---



### 21\.2 Domain Blacklist



加入规则：



```TypeScript
{
  type: 'domain_blacklist',
  value: 'fake-uniswap.com',
  action: 'block',
  riskLevel: 'blocked'
}
```



访问：



```Plain Text
https://fake-uniswap.com
```



预期：



```Plain Text
blocked
```



---



### 21\.3 Homograph



访问：



```Plain Text
https://unіswap.org
```



其中 `і` 是非 ASCII 字符。



预期：



```Plain Text
blocked / POSSIBLE_HOMOGRAPH_ATTACK
```



---



### 21\.4 Contract Blacklist



交易目标：



```Plain Text
0x000000000000000000000000000000000000dead
```



预期：



```Plain Text
eth_sendTransaction blocked
TransactionConfirmModal 不应允许确认
```



---



### 21\.5 WalletConnect Peer Block



WalletConnect peer URL：



```Plain Text
https://fake-airdrop-claim.xyz
```



预期：



```Plain Text
session_proposal rejected
security event recorded
```



---



## 22\. 本章完成内容



本章完成：



```Plain Text
Security Rule Storage
默认安全规则
Domain Blacklist
Phishing Detector
Homograph Detector
URL Security Engine
Redirect Security
Contract Blacklist
Transaction Security
WalletConnect Security
Security Event
Security Policy Runtime
WebView Navigation 安全升级方案
WalletConnect Proposal 安全接入
Transaction Risk 安全升级
Admin 风控规则 Service
Admin 数据结构建议
```



现在 DApp 浏览器已经具备工业级安全风控骨架：



```Plain Text
URL
Domain
WalletConnect Peer
Contract
Transaction
Security Event
Admin Rule
```



---



## 23\. 下一章继续



下一段继续：



**《DApp 浏览器 Part 12：审计日志 / 监控指标 / 后台管理》**



将覆盖：



```Plain Text
DApp Audit Log
Provider Request Audit
Signing Audit 持久化
Transaction Audit 持久化
WalletConnect Audit
Security Event 持久化
Metrics Service
Health Check
Admin DApp Registry 管理
Admin Security Rule 管理
Admin Session 查询
Admin WalletConnect 查询
Admin Audit 查询
Prometheus 指标
P0 告警清单
```



