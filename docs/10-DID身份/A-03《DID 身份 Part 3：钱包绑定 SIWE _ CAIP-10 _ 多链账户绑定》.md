# A\-03《DID 身份 Part 3：钱包绑定 SIWE / CAIP\-10 / 多链账户绑定》

# 《DID 身份 Part 3：钱包绑定 SIWE / CAIP\-10 / 多链账户绑定》



本章实现 DID 身份系统的钱包绑定模块，覆盖：



- EIP\-4361 SIWE

- 绑定挑战生成

- nonce 防重放

- domain 防重放

- expiration 防重放

- 签名验证

- CAIP\-10 多链账户绑定

- `did:pkh` 自动生成

- `WalletBindingRecord`

- 绑定撤销

- 五大业务域钱包绑定规则：

    - 交易所提现钱包绑定

    - 萨摩亚官方文件签署钱包绑定

    - 金融账户强绑定

    - 博彩提现绑定

    - 跨境电商卖家收款钱包绑定

        

---



# 1\. 设计原则



钱包绑定不是简单保存：



```Plain Text
did + walletAddress
```



必须证明：



```Plain Text
1. DID 持有人主动发起绑定
2. 钱包地址持有人签署挑战
3. challenge 没过期
4. nonce 没复用
5. domain / uri / chainId 正确
6. 签名可以恢复出地址
7. 绑定记录可撤销
8. 业务域能要求特定绑定强度
```



---



# 2\. 本章目录



```Bash
src/modules/did/
  core/
    wallet-binding/
      wallet-binding.types.ts
      wallet-binding.errors.ts
      wallet-binding-challenge.repository.ts
      wallet-binding.repository.ts
      wallet-binding-challenge.service.ts
      siwe-message.service.ts
      siwe-verify.service.ts
      wallet-binding.service.ts
      wallet-binding-policy.service.ts

    utils/
      nonce.ts
      time.ts
      caip10.ts
```



---



# 3\. 钱包绑定错误



## `core/wallet-binding/wallet-binding.errors.ts`



```TypeScript
export class WalletBindingError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'WalletBindingError';
  }
}

export const WalletBindingErrors = {
  INVALID_CHALLENGE: (details?: unknown) =>
    new WalletBindingError(
      'WALLET_BINDING_INVALID_CHALLENGE',
      'Invalid wallet binding challenge',
      details,
    ),

  CHALLENGE_NOT_FOUND: (challengeId?: string) =>
    new WalletBindingError(
      'WALLET_BINDING_CHALLENGE_NOT_FOUND',
      'Wallet binding challenge not found',
      { challengeId },
    ),

  CHALLENGE_EXPIRED: (challengeId?: string) =>
    new WalletBindingError(
      'WALLET_BINDING_CHALLENGE_EXPIRED',
      'Wallet binding challenge expired',
      { challengeId },
    ),

  CHALLENGE_ALREADY_USED: (challengeId?: string) =>
    new WalletBindingError(
      'WALLET_BINDING_CHALLENGE_ALREADY_USED',
      'Wallet binding challenge already used',
      { challengeId },
    ),

  SIGNATURE_INVALID: (details?: unknown) =>
    new WalletBindingError(
      'WALLET_BINDING_SIGNATURE_INVALID',
      'Wallet binding signature invalid',
      details,
    ),

  ADDRESS_MISMATCH: (details?: unknown) =>
    new WalletBindingError(
      'WALLET_BINDING_ADDRESS_MISMATCH',
      'Wallet binding address mismatch',
      details,
    ),

  DOMAIN_MISMATCH: (details?: unknown) =>
    new WalletBindingError(
      'WALLET_BINDING_DOMAIN_MISMATCH',
      'Wallet binding domain mismatch',
      details,
    ),

  CHAIN_MISMATCH: (details?: unknown) =>
    new WalletBindingError(
      'WALLET_BINDING_CHAIN_MISMATCH',
      'Wallet binding chain mismatch',
      details,
    ),

  BINDING_NOT_FOUND: (bindingId?: string) =>
    new WalletBindingError(
      'WALLET_BINDING_NOT_FOUND',
      'Wallet binding not found',
      { bindingId },
    ),
};
```



---



# 4\. 工具：nonce 和时间



## `core/utils/nonce.ts`



```TypeScript
import { randomBytes } from '@noble/hashes/utils';

export function generateNonce(bytes = 16): string {
  return Array.from(randomBytes(bytes))
    .map((item) => item.toString(16).padStart(2, '0'))
    .join('');
}
```



## `core/utils/time.ts`



```TypeScript
export function nowIso(): string {
  return new Date().toISOString();
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function isExpired(timestampMs: number): boolean {
  return timestampMs ;
  get(challengeId: string): Promise;
  markUsed(challengeId: string): Promise;
}

export class InMemoryWalletBindingChallengeRepository
  implements WalletBindingChallengeRepository {
  private readonly challenges = new Map();

  async create(challenge: WalletBindingChallenge): Promise {
    this.challenges.set(challenge.challengeId, challenge);
  }

  async get(challengeId: string): Promise {
    return this.challenges.get(challengeId) ?? null;
  }

  async markUsed(challengeId: string): Promise {
    const existing = this.challenges.get(challengeId);

    if (!existing) {
      throw new Error('CHALLENGE_NOT_FOUND');
    }

    const updated: WalletBindingChallenge = {
      ...existing,
      usedAt: Date.now(),
    };

    this.challenges.set(challengeId, updated);

    return updated;
  }
}
```



---



# 6\. Binding Repository



## `core/wallet-binding/wallet-binding.repository.ts`



```TypeScript
import { WalletBindingRecord } from './wallet-binding.types';

export interface WalletBindingRepository {
  create(record: WalletBindingRecord): Promise;
  get(bindingId: string): Promise;
  listByDid(did: string): Promise;
  listByAccountId(accountId: string): Promise;
  findActive(input: {
    did: string;
    accountId: string;
  }): Promise;
  revoke(bindingId: string): Promise;
}

export class InMemoryWalletBindingRepository
  implements WalletBindingRepository {
  private readonly records = new Map();

  async create(record: WalletBindingRecord): Promise {
    this.records.set(record.bindingId, record);
  }

  async get(bindingId: string): Promise {
    return this.records.get(bindingId) ?? null;
  }

  async listByDid(did: string): Promise {
    return Array.from(this.records.values())
      .filter((item) => item.did === did)
      .filter((item) => !item.revokedAt)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async listByAccountId(accountId: string): Promise {
    return Array.from(this.records.values())
      .filter((item) => item.accountId === accountId)
      .filter((item) => !item.revokedAt)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async findActive(input: {
    did: string;
    accountId: string;
  }): Promise {
    return (
      Array.from(this.records.values()).find(
        (item) =>
          item.did === input.did &&
          item.accountId === input.accountId &&
          !item.revokedAt &&
          item.verified,
      ) ?? null
    );
  }

  async revoke(bindingId: string): Promise {
    const existing = this.records.get(bindingId);

    if (!existing) {
      throw new Error('BINDING_NOT_FOUND');
    }

    const updated: WalletBindingRecord = {
      ...existing,
      revokedAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.records.set(bindingId, updated);

    return updated;
  }
}
```



---



# 7\. SIWE Message Service



EIP\-4361 标准消息结构：



```Plain Text
domain wants you to sign in with your Ethereum account:
address

statement

URI: uri
Version: 1
Chain ID: chainId
Nonce: nonce
Issued At: issuedAt
Expiration Time: expirationTime
Resources:
- did
```



## `core/wallet-binding/siwe-message.service.ts`



```TypeScript
export interface SIWEMessageInput {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: string;
  nonce: string;
  issuedAt: string;
  expirationTime: string;
  resources?: string[];
}

export class SIWEMessageService {
  build(input: SIWEMessageInput): string {
    const lines = [
      `${input.domain} wants you to sign in with your Ethereum account:`,
      input.address,
      '',
      input.statement,
      '',
      `URI: ${input.uri}`,
      `Version: ${input.version}`,
      `Chain ID: ${input.chainId}`,
      `Nonce: ${input.nonce}`,
      `Issued At: ${input.issuedAt}`,
      `Expiration Time: ${input.expirationTime}`,
    ];

    if (input.resources?.length) {
      lines.push('Resources:');
      for (const resource of input.resources) {
        lines.push(`- ${resource}`);
      }
    }

    return lines.join('\n');
  }

  parse(message: string): {
    domain: string;
    address: string;
    statement: string;
    uri: string;
    version: string;
    chainId: string;
    nonce: string;
    issuedAt: string;
    expirationTime: string;
    resources: string[];
  } {
    const lines = message.split('\n');

    const first = lines[0];
    const domain = first.replace(' wants you to sign in with your Ethereum account:', '');

    const address = lines[1];

    const uri = findValue(lines, 'URI: ');
    const version = findValue(lines, 'Version: ');
    const chainId = findValue(lines, 'Chain ID: ');
    const nonce = findValue(lines, 'Nonce: ');
    const issuedAt = findValue(lines, 'Issued At: ');
    const expirationTime = findValue(lines, 'Expiration Time: ');

    const statementStart = 3;
    const statementEnd = lines.findIndex((line) => line.startsWith('URI: '));
    const statement = lines
      .slice(statementStart, statementEnd === -1 ? statementStart : statementEnd - 1)
      .join('\n')
      .trim();

    const resourceIndex = lines.findIndex((line) => line === 'Resources:');
    const resources =
      resourceIndex >= 0
        ? lines.slice(resourceIndex + 1)
            .filter((line) => line.startsWith('- '))
            .map((line) => line.slice(2))
        : [];

    return {
      domain,
      address,
      statement,
      uri,
      version,
      chainId,
      nonce,
      issuedAt,
      expirationTime,
      resources,
    };
  }
}

function findValue(lines: string[], prefix: string): string {
  const line = lines.find((item) => item.startsWith(prefix));

  if (!line) {
    throw new Error(`SIWE_FIELD_MISSING:${prefix}`);
  }

  return line.slice(prefix.length);
}
```



---



# 8\. Challenge Service



## `core/wallet-binding/wallet-binding-challenge.service.ts`



```TypeScript
import { getAddress, isAddress } from 'viem';
import { DIDString } from '../did/did.types';
import { buildCAIP10, evmChainIdToCAIPReference } from '../utils/caip10';
import { generateNonce } from '../utils/nonce';
import { addMinutes } from '../utils/time';
import { WalletBindingChallenge } from './wallet-binding.types';
import { WalletBindingChallengeRepository } from './wallet-binding-challenge.repository';
import { SIWEMessageService } from './siwe-message.service';

export class WalletBindingChallengeService {
  constructor(
    private readonly repo: WalletBindingChallengeRepository,
    private readonly siwe: SIWEMessageService,
  ) {}

  async createEvmChallenge(input: {
    did: DIDString;
    address: string;
    chainId: string;
    domain: string;
    uri: string;
    ttlMinutes?: number;
    statement?: string;
  }): Promise {
    if (!isAddress(input.address)) {
      throw new Error(`INVALID_EVM_ADDRESS:${input.address}`);
    }

    const address = getAddress(input.address);
    const reference = evmChainIdToCAIPReference(input.chainId);

    const accountId = buildCAIP10({
      namespace: 'eip155',
      reference,
      accountAddress: address,
    });

    const now = new Date();
    const expires = addMinutes(now, input.ttlMinutes ?? 10);
    const nonce = generateNonce();

    const message = this.siwe.build({
      domain: input.domain,
      address,
      statement:
        input.statement ??
        `Bind wallet ${address} to DID ${input.did}. This request will not trigger a blockchain transaction.`,
      uri: input.uri,
      version: '1',
      chainId: reference,
      nonce,
      issuedAt: now.toISOString(),
      expirationTime: expires.toISOString(),
      resources: [
        input.did,
        accountId,
      ],
    });

    const challenge: WalletBindingChallenge = {
      challengeId: this.newChallengeId(),
      did: input.did,
      accountId,
      address,
      chainId: reference,
      domain: input.domain,
      nonce,
      statement:
        input.statement ??
        `Bind wallet ${address} to DID ${input.did}. This request will not trigger a blockchain transaction.`,
      uri: input.uri,
      version: '1',
      issuedAt: now.toISOString(),
      expirationTime: expires.toISOString(),
      message,
      createdAt: now.getTime(),
      expiresAt: expires.getTime(),
    };

    await this.repo.create(challenge);

    return challenge;
  }

  private newChallengeId(): string {
    return `WBCH-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }
}
```



---



# 9\. SIWE Verify Service



用 `viem` 恢复签名地址。



## `core/wallet-binding/siwe-verify.service.ts`



```TypeScript
import {
  getAddress,
  verifyMessage,
} from 'viem';
import { WalletBindingErrors } from './wallet-binding.errors';
import { SIWEMessageService } from './siwe-message.service';

export class SIWEVerifyService {
  constructor(
    private readonly siwe = new SIWEMessageService(),
  ) {}

  async verify(input: {
    message: string;
    signature: string;
    expectedAddress: string;
    expectedDomain: string;
    expectedChainId: string;
    expectedNonce: string;
    expectedUri?: string;
  }): Promise {
    const parsed = this.siwe.parse(input.message);

    if (parsed.domain !== input.expectedDomain) {
      throw WalletBindingErrors.DOMAIN_MISMATCH({
        expected: input.expectedDomain,
        actual: parsed.domain,
      });
    }

    if (parsed.chainId !== String(input.expectedChainId)) {
      throw WalletBindingErrors.CHAIN_MISMATCH({
        expected: input.expectedChainId,
        actual: parsed.chainId,
      });
    }

    if (parsed.nonce !== input.expectedNonce) {
      throw WalletBindingErrors.INVALID_CHALLENGE({
        reason: 'NONCE_MISMATCH',
      });
    }

    if (input.expectedUri && parsed.uri !== input.expectedUri) {
      throw WalletBindingErrors.INVALID_CHALLENGE({
        reason: 'URI_MISMATCH',
        expected: input.expectedUri,
        actual: parsed.uri,
      });
    }

    if (new Date(parsed.expirationTime).getTime()  {
    const challenge = await this.challengeRepo.get(input.challengeId);

    if (!challenge) {
      throw WalletBindingErrors.CHALLENGE_NOT_FOUND(input.challengeId);
    }

    if (challenge.usedAt) {
      throw WalletBindingErrors.CHALLENGE_ALREADY_USED(input.challengeId);
    }

    if (challenge.expiresAt  {
    return this.bindingRepo.listByDid(did);
  }

  async revokeBinding(bindingId: string): Promise {
    return this.bindingRepo.revoke(bindingId);
  }

  async hasActiveBinding(input: {
    did: string;
    accountId: string;
  }): Promise {
    return Boolean(await this.bindingRepo.findActive(input));
  }

  private newBindingId(): string {
    return `WBND-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }
}
```



---



# 11\. Wallet Binding Policy



五大业务域对钱包绑定强度要求不同。



## `core/wallet-binding/wallet-binding-policy.service.ts`



```TypeScript
import { DIDBusinessDomain } from '../domain/did-domain.types';

export type WalletBindingRequirementLevel =
  | 'none'
  | 'optional'
  | 'required'
  | 'strong_required';

export interface WalletBindingPolicy {
  domain: DIDBusinessDomain;
  action: string;
  level: WalletBindingRequirementLevel;
  allowedNamespaces: string[];
  allowedChains?: string[];
  requireFreshBindingWithinDays?: number;
}

export class WalletBindingPolicyService {
  private readonly policies: WalletBindingPolicy[] = [
    {
      domain: 'exchange',
      action: 'withdraw',
      level: 'strong_required',
      allowedNamespaces: ['eip155'],
      requireFreshBindingWithinDays: 365,
    },
    {
      domain: 'exchange',
      action: 'trade',
      level: 'optional',
      allowedNamespaces: ['eip155'],
    },
    {
      domain: 'cross_border_commerce',
      action: 'seller_payout',
      level: 'required',
      allowedNamespaces: ['eip155'],
      requireFreshBindingWithinDays: 365,
    },
    {
      domain: 'gaming',
      action: 'withdraw_winnings',
      level: 'strong_required',
      allowedNamespaces: ['eip155'],
      requireFreshBindingWithinDays: 180,
    },
    {
      domain: 'financial',
      action: 'withdraw',
      level: 'strong_required',
      allowedNamespaces: ['eip155'],
      requireFreshBindingWithinDays: 180,
    },
    {
      domain: 'financial',
      action: 'invest',
      level: 'required',
      allowedNamespaces: ['eip155'],
      requireFreshBindingWithinDays: 365,
    },
    {
      domain: 'samoa_enterprise',
      action: 'sign_company_documents',
      level: 'strong_required',
      allowedNamespaces: ['eip155'],
      requireFreshBindingWithinDays: 365,
    },
    {
      domain: 'samoa_enterprise',
      action: 'start_company_formation',
      level: 'required',
      allowedNamespaces: ['eip155'],
      requireFreshBindingWithinDays: 365,
    },
  ];

  getPolicy(input: {
    domain: DIDBusinessDomain;
    action: string;
  }): WalletBindingPolicy {
    return (
      this.policies.find(
        (item) =>
          item.domain === input.domain &&
          item.action === input.action,
      ) ?? {
        domain: input.domain,
        action: input.action,
        level: 'optional',
        allowedNamespaces: ['eip155'],
      }
    );
  }
}
```



---



# 12\. Domain Wallet Binding Guard



业务执行前调用。



## `core/wallet-binding/domain-wallet-binding-guard.service.ts`



```TypeScript
import { parseCAIP10 } from '../utils/caip10';
import { DIDBusinessDomain } from '../domain/did-domain.types';
import { WalletBindingRepository } from './wallet-binding.repository';
import { WalletBindingPolicyService } from './wallet-binding-policy.service';

export class DomainWalletBindingGuardService {
  constructor(
    private readonly policy: WalletBindingPolicyService,
    private readonly bindingRepo: WalletBindingRepository,
  ) {}

  async check(input: {
    domain: DIDBusinessDomain;
    action: string;
    did: string;
    accountId?: string;
  }): Promise {
    const policy = this.policy.getPolicy({
      domain: input.domain,
      action: input.action,
    });

    if (policy.level === 'none' || policy.level === 'optional') {
      return { allowed: true };
    }

    if (!input.accountId) {
      return {
        allowed: false,
        reason: 'WALLET_ACCOUNT_REQUIRED',
      };
    }

    const parsed = parseCAIP10(input.accountId);

    if (!policy.allowedNamespaces.includes(parsed.namespace)) {
      return {
        allowed: false,
        reason: 'WALLET_NAMESPACE_NOT_ALLOWED',
      };
    }

    if (
      policy.allowedChains &&
      !policy.allowedChains.includes(parsed.reference)
    ) {
      return {
        allowed: false,
        reason: 'WALLET_CHAIN_NOT_ALLOWED',
      };
    }

    const binding = await this.bindingRepo.findActive({
      did: input.did,
      accountId: input.accountId,
    });

    if (!binding) {
      return {
        allowed: false,
        reason: 'ACTIVE_WALLET_BINDING_REQUIRED',
      };
    }

    if (policy.requireFreshBindingWithinDays) {
      const maxAge =
        policy.requireFreshBindingWithinDays * 24 * 60 * 60 * 1000;

      if (Date.now() - binding.createdAt > maxAge) {
        return {
          allowed: false,
          reason: 'WALLET_BINDING_REVERIFICATION_REQUIRED',
        };
      }
    }

    return {
      allowed: true,
    };
  }
}
```



---



# 13\. Runtime 组装



## `core/wallet-binding/create-wallet-binding-runtime.ts`



```TypeScript
import {
  InMemoryWalletBindingChallengeRepository,
} from './wallet-binding-challenge.repository';
import {
  InMemoryWalletBindingRepository,
} from './wallet-binding.repository';
import { SIWEMessageService } from './siwe-message.service';
import { SIWEVerifyService } from './siwe-verify.service';
import { WalletBindingChallengeService } from './wallet-binding-challenge.service';
import { WalletBindingService } from './wallet-binding.service';
import { WalletBindingPolicyService } from './wallet-binding-policy.service';
import { DomainWalletBindingGuardService } from './domain-wallet-binding-guard.service';

export function createWalletBindingRuntime() {
  const challengeRepo = new InMemoryWalletBindingChallengeRepository();
  const bindingRepo = new InMemoryWalletBindingRepository();

  const siwe = new SIWEMessageService();
  const siweVerifier = new SIWEVerifyService(siwe);

  const challengeService = new WalletBindingChallengeService(
    challengeRepo,
    siwe,
  );

  const bindingService = new WalletBindingService(
    challengeRepo,
    bindingRepo,
    siweVerifier,
  );

  const bindingPolicy = new WalletBindingPolicyService();

  const bindingGuard = new DomainWalletBindingGuardService(
    bindingPolicy,
    bindingRepo,
  );

  return {
    challengeRepo,
    bindingRepo,
    siwe,
    siweVerifier,
    challengeService,
    bindingService,
    bindingPolicy,
    bindingGuard,
  };
}

export type WalletBindingRuntime =
  ReturnType;
```



---



# 14\. 绑定流程：前端 / App 调用



## 14\.1 生成挑战



```TypeScript
const challenge = await walletBinding.challengeService.createEvmChallenge({
  did: 'did:key:z...',
  address: '0x1234567890abcdef1234567890abcdef12345678',
  chainId: '1',
  domain: 'app.example.com',
  uri: 'https://app.example.com/identity/wallet-binding',
});
```



返回：



```JSON
{
  "challengeId": "WBCH-...",
  "message": "app.example.com wants you to sign in with your Ethereum account:\n0x1234...\n..."
}
```



---



## 14\.2 钱包签名



DApp Browser / WalletCore 调：



```TypeScript
const signature = await walletCore.signMessage({
  accountId: 'account-1',
  namespace: 'eip155',
  chainId: '0x1',
  address,
  message: challenge.message,
});
```



---



## 14\.3 验证并绑定



```TypeScript
const result = await walletBinding.bindingService.verifyAndBindEvm({
  challengeId: challenge.challengeId,
  signature,
});

console.log(result.binding);
console.log(result.walletDid);
```



输出：



```Plain Text
WalletBindingRecord
did:pkh:eip155:1:0x...
```



---



# 15\. 交易所提现前校验



```TypeScript
const decision = await walletBinding.bindingGuard.check({
  domain: 'exchange',
  action: 'withdraw',
  did: userDid,
  accountId: 'eip155:1:0x1234567890abcdef1234567890abcdef12345678',
});

if (!decision.allowed) {
  throw new Error(`WITHDRAW_WALLET_BINDING_REQUIRED:${decision.reason}`);
}
```



---



# 16\. 萨摩亚官方文件签署前校验



```TypeScript
const decision = await walletBinding.bindingGuard.check({
  domain: 'samoa_enterprise',
  action: 'sign_company_documents',
  did: entrepreneurDid,
  accountId: 'eip155:1:0x1234567890abcdef1234567890abcdef12345678',
});

if (!decision.allowed) {
  throw new Error(`SAMOA_DOCUMENT_SIGNING_WALLET_BINDING_REQUIRED:${decision.reason}`);
}
```



---



# 17\. 博彩提现前校验



```TypeScript
const decision = await walletBinding.bindingGuard.check({
  domain: 'gaming',
  action: 'withdraw_winnings',
  did: playerDid,
  accountId: 'eip155:1:0x1234567890abcdef1234567890abcdef12345678',
});
```



必须：



```Plain Text
strong_required
180 天内绑定
active binding
未撤销
```



---



# 18\. 金融投资前校验



```TypeScript
const decision = await walletBinding.bindingGuard.check({
  domain: 'financial',
  action: 'invest',
  did: investorDid,
  accountId,
});
```



必须：



```Plain Text
required
365 天内绑定
```



---



# 19\. 跨境电商卖家收款钱包校验



```TypeScript
const decision = await walletBinding.bindingGuard.check({
  domain: 'cross_border_commerce',
  action: 'seller_payout',
  did: sellerDid,
  accountId,
});
```



必须：



```Plain Text
required
active binding
```



---



# 20\. 安全要求



钱包绑定必须满足：



```Plain Text
1. challenge 只能使用一次
2. challenge 必须有过期时间
3. nonce 必须随机
4. domain 必须匹配
5. uri 必须匹配
6. chainId 必须匹配
7. 签名地址必须匹配
8. 绑定记录必须可撤销
9. 高风险动作必须检查绑定新鲜度
10. 钱包绑定 VC 后续必须可签发
```



---



# 21\. 链上规则



钱包绑定一般不需要明文上链。



可以上链：



```Plain Text
hash(did + caip10AccountId + bindingId)
```



不能上链：



```Plain Text
SIWE message 原文
signature 原文
IP
设备指纹
用户实名信息
```



建议 anchor payload：



```TypeScript
{
  domain,
  didHash,
  accountIdHash,
  bindingHash,
  issuedAt
}
```



---



# 22\. 本章完成内容



本章完成：



```Plain Text
Wallet Binding 错误体系
Nonce 工具
SIWE Message 构建
SIWE Message 解析
Challenge Repository
Binding Repository
Challenge Service
SIWE 签名验证
Wallet Binding Service
did:pkh 自动生成
Wallet Binding Policy
Domain Wallet Binding Guard
五大业务域绑定策略
Runtime 组装
交易所提现绑定校验
萨摩亚文件签署绑定校验
博彩提现绑定校验
金融投资绑定校验
跨境电商卖家收款绑定校验
```



---



# 23\. 下一章继续



下一章：



# 《DID 身份 Part 4：Issuer 签发者体系 / Trust Registry / Schema Registry》



将覆盖：



```Plain Text
Issuer DID 注册
Issuer Trust Level
Issuer Domain Scope
Issuer Credential Permission
Issuer Key Rotation
Issuer Suspension / Revocation
Schema Registry
五大业务域 Schema 绑定
萨摩亚官方 Issuer
金融 Issuer
交易所 Issuer
博彩合规 Issuer
跨境电商 Issuer
Issuer 审计
```



