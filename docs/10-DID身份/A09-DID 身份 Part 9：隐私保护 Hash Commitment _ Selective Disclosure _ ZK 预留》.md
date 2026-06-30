# A09\-DID 身份 Part 9：隐私保护 Hash Commitment / Selective Disclosure / ZK 预留》

# 《DID 身份 Part 9：隐私保护 Hash Commitment / Selective Disclosure / ZK 预留》



本章实现 DID 身份系统的隐私保护层，覆盖：



- PII 最小化

- Hash Commitment

- Salt / Pepper

- Claim\-level Commitment

- Credential\-level Commitment

- Selective Disclosure VC

- BBS\+ 预留

- ZK Proof Interface

- Age Over 18 ZK

- Accredited Investor ZK

- KYC Level ZK

- Samoa UBO 隐私证明

- Commerce KYB 选择性披露

- Gaming Geo Eligibility 隐私证明

- 金融资产证明隐私化

- 链上 Anchor 隐私规则

    

核心原则：



```Plain Text
DID / VC 系统不能把“可信身份”变成“永久公开隐私档案”。

高安全 DID 身份系统必须默认：
1. 最小化披露
2. 敏感字段不上链
3. 高敏感 claims 用 commitment
4. 能用布尔证明就不用明文字段
5. 能用区间证明就不用精确数值
6. 能用 ZK 就不用明文
```



---



# 1\. 为什么 Part 9 必须做隐私层



前面 Part 1\-8 已经完成：



```Plain Text
DID
Wallet Binding
Issuer Trust
VC Issue
VC Verify
Revocation
On-chain Anchor
```



但如果没有隐私层，会出现严重问题：



```Plain Text
KYC VC 泄露国家、姓名、证件信息
博彩 Age VC 泄露出生日期
金融 VC 泄露资产、收入、信用分
萨摩亚 UBO VC 泄露最终受益人结构
跨境电商 KYB VC 泄露税号、注册地址
链上 hash 如果无盐，可能被字典攻击
```



因此，本章要把 VC 从：



```JSON
{
  "dateOfBirth": "1990-01-01",
  "passportNumber": "P123456"
}
```



升级为：



```JSON
{
  "ageOver18": true,
  "ageCommitment": "0x...",
  "proofType": "zk_age_over_18"
}
```



---



# 2\. 隐私分级



## 2\.1 Claim Privacy Level



```Plain Text
public
  可公开展示，例如 companyType、credential status

internal
  平台内部可见，但不上链，例如 riskLevel bucket

private
  只在授权情况下披露，例如 nationality

sensitive
  高敏感，必须 hash / commitment，例如 taxId、passportNumber

zero_knowledge
  只允许证明，不允许披露原值，例如 age、income、asset
```



---



# 3\. 本章目录



```Bash
src/modules/did/
  core/
    privacy/
      privacy.types.ts
      privacy.errors.ts
      pii-classifier.service.ts
      claim-minimization.service.ts
      commitment.types.ts
      commitment.service.ts
      salt.service.ts
      pepper.service.ts
      selective-disclosure.types.ts
      selective-disclosure.service.ts
      disclosure-policy.service.ts
      vc-privacy-transform.service.ts
      privacy-audit.service.ts

    zk/
      zk.types.ts
      zk-proof.service.ts
      zk-verifier.service.ts
      age-over18-zk.service.ts
      kyc-level-zk.service.ts
      accredited-investor-zk.service.ts
      samoa-ubo-zk.service.ts

    domains/
      exchange/
        exchange-privacy-policy.service.ts
      commerce/
        commerce-privacy-policy.service.ts
      gaming/
        gaming-privacy-policy.service.ts
      financial/
        financial-privacy-policy.service.ts
      samoa-enterprise/
        samoa-enterprise-privacy-policy.service.ts
```



---



# 4\. Privacy 类型



## `core/privacy/privacy.types.ts`



```TypeScript
import { DIDBusinessDomain } from '../domain/did-domain.types';
import { DomainCredentialType } from '../domain/did-domain-credential.types';

export type ClaimPrivacyLevel =
  | 'public'
  | 'internal'
  | 'private'
  | 'sensitive'
  | 'zero_knowledge';

export type PrivacyTransformMode =
  | 'keep'
  | 'remove'
  | 'hash'
  | 'commitment'
  | 'bucket'
  | 'boolean'
  | 'zero_knowledge';

export interface ClaimPrivacyRule {
  domain: DIDBusinessDomain;
  credentialType: DomainCredentialType;
  claim: string;
  privacyLevel: ClaimPrivacyLevel;
  transform: PrivacyTransformMode;
  required?: boolean;
  exposeToHolder?: boolean;
  exposeToVerifier?: boolean;
  allowOnChain?: boolean;
  reason?: string;
}

export interface PrivacyTransformInput {
  domain: DIDBusinessDomain;
  credentialType: DomainCredentialType;
  claims: Record;
  purpose:
    | 'issue'
    | 'present'
    | 'verify'
    | 'anchor'
    | 'audit'
    | 'admin';
  verifierDid?: string;
  holderDid?: string;
  metadata?: Record;
}

export interface PrivacyTransformResult {
  claims: Record;
  commitments: Record;
  removedClaims: string[];
  transformedClaims: string[];
  warnings: string[];
  metadata?: Record;
}

export interface PIIDetectionResult {
  containsPII: boolean;
  fields: Array;
}
```



---



# 5\. Privacy Errors



## `core/privacy/privacy.errors.ts`



```TypeScript
export class PrivacyError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'PrivacyError';
  }
}

export const PrivacyErrors = {
  PII_ONCHAIN_FORBIDDEN: (details?: unknown) =>
    new PrivacyError(
      'PRIVACY_PII_ONCHAIN_FORBIDDEN',
      'PII or sensitive data cannot be anchored on-chain',
      details,
    ),

  CLAIM_DISCLOSURE_NOT_ALLOWED: (details?: unknown) =>
    new PrivacyError(
      'PRIVACY_CLAIM_DISCLOSURE_NOT_ALLOWED',
      'Claim disclosure is not allowed by privacy policy',
      details,
    ),

  COMMITMENT_SALT_REQUIRED: (details?: unknown) =>
    new PrivacyError(
      'PRIVACY_COMMITMENT_SALT_REQUIRED',
      'Commitment salt is required',
      details,
    ),

  PEPPER_NOT_AVAILABLE: () =>
    new PrivacyError(
      'PRIVACY_PEPPER_NOT_AVAILABLE',
      'Server-side pepper is not available',
    ),

  ZK_PROOF_REQUIRED: (details?: unknown) =>
    new PrivacyError(
      'PRIVACY_ZK_PROOF_REQUIRED',
      'Zero-knowledge proof is required',
      details,
    ),
};
```



---



# 6\. PII Classifier



用于检查：



```Plain Text
是否误把敏感字段传入上链 payload
是否在 VC 中暴露了不该暴露的字段
```



## `core/privacy/pii-classifier.service.ts`



```TypeScript
import { PIIDetectionResult } from './privacy.types';

export class PIIClassifierService {
  private readonly patterns: Array = [
    {
      keyPattern: /^(name|fullName|firstName|lastName)$/i,
      category: 'name',
      severity: 'high',
    },
    {
      keyPattern: /(passport|nationalId|identityNumber|idNumber|ssn|driverLicense)/i,
      category: 'government_id',
      severity: 'critical',
    },
    {
      keyPattern: /(dateOfBirth|dob|birthDate)/i,
      category: 'date_of_birth',
      severity: 'critical',
    },
    {
      keyPattern: /(address|street|postalCode|zipCode|registeredOffice)/i,
      category: 'address',
      severity: 'high',
    },
    {
      keyPattern: /(email|phone|mobile|telegram|whatsapp)/i,
      category: 'contact',
      severity: 'high',
    },
    {
      keyPattern: /(income|salary|asset|bank|iban|accountNumber|creditScore)/i,
      category: 'financial',
      severity: 'critical',
    },
    {
      keyPattern: /(taxId|tin|vat|taxNumber)/i,
      category: 'tax',
      severity: 'critical',
    },
    {
      keyPattern: /(face|biometric|liveness|fingerprint)/i,
      category: 'biometric',
      severity: 'critical',
    },
    {
      keyPattern: /(bettingHistory|lossLimit|gambling|selfExclusionReason)/i,
      category: 'gaming',
      severity: 'critical',
    },
  ];

  detect(input: unknown): PIIDetectionResult {
    const fields: PIIDetectionResult['fields'] = [];

    this.scan(input, '', fields);

    return {
      containsPII: fields.length > 0,
      fields,
    };
  }

  assertNoCriticalPII(input: unknown) {
    const result = this.detect(input);

    const critical = result.fields.filter((item) => item.severity === 'critical');

    if (critical.length > 0) {
      throw new Error(
        `CRITICAL_PII_DETECTED:${critical.map((x) => x.path).join(',')}`,
      );
    }
  }

  private scan(
    value: unknown,
    path: string,
    fields: PIIDetectionResult['fields'],
  ) {
    if (!value || typeof value !== 'object') return;

    if (Array.isArray(value)) {
      value.forEach((item, index) =>
        this.scan(item, `${path}[${index}]`, fields),
      );
      return;
    }

    for (const [key, child] of Object.entries(value as Record)) {
      const fullPath = path ? `${path}.${key}` : key;

      for (const pattern of this.patterns) {
        if (pattern.keyPattern.test(key)) {
          fields.push({
            path: fullPath,
            category: pattern.category,
            severity: pattern.severity,
          });
        }
      }

      this.scan(child, fullPath, fields);
    }
  }
}
```



---



# 7\. Salt Service



每个 claim commitment 必须使用 salt。



Salt 规则：



```Plain Text
1. 每个 credential 每个 claim 独立 salt
2. salt 不上链
3. salt 可由 holder 保存
4. issuer 可保存审计副本或加密托管
```



## `core/privacy/salt.service.ts`



```TypeScript
import { randomBytes } from '@noble/hashes/utils';

export interface ClaimSaltRecord {
  saltId: string;
  credentialId?: string;
  claim: string;
  salt: string;
  createdAt: number;
}

export interface SaltRepository {
  save(record: ClaimSaltRecord): Promise;
  get(saltId: string): Promise;
}

export class InMemorySaltRepository implements SaltRepository {
  private readonly salts = new Map();

  async save(record: ClaimSaltRecord): Promise {
    this.salts.set(record.saltId, record);
  }

  async get(saltId: string): Promise {
    return this.salts.get(saltId) ?? null;
  }
}

export class SaltService {
  constructor(
    private readonly repo: SaltRepository = new InMemorySaltRepository(),
  ) {}

  async createSalt(input: {
    credentialId?: string;
    claim: string;
  }): Promise {
    const record: ClaimSaltRecord = {
      saltId: `SALT-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`,
      credentialId: input.credentialId,
      claim: input.claim,
      salt: bytesToHex(randomBytes(32)),
      createdAt: Date.now(),
    };

    await this.repo.save(record);

    return record;
  }

  async getSalt(saltId: string): Promise {
    const record = await this.repo.get(saltId);

    if (!record) {
      throw new Error(`SALT_NOT_FOUND:${saltId}`);
    }

    return record;
  }
}

function bytesToHex(bytes: Uint8Array): string {
  return `0x${Array.from(bytes)
    .map((item) => item.toString(16).padStart(2, '0'))
    .join('')}`;
}
```



---



# 8\. Pepper Service



Pepper 是服务端密钥材料，不给用户，不上链。



用于增强 commitment 防字典攻击。



```Plain Text
commitment = H(domain | credentialType | claim | value | salt | pepper)
```



## `core/privacy/pepper.service.ts`



```TypeScript
import { PrivacyErrors } from './privacy.errors';

export interface PepperProvider {
  getPepper(scope: string): Promise;
}

export class StaticDevPepperProvider implements PepperProvider {
  constructor(
    private readonly pepper = 'DEV_ONLY_PEPPER_DO_NOT_USE_IN_PRODUCTION',
  ) {}

  async getPepper(): Promise {
    return this.pepper;
  }
}

export class PepperService {
  constructor(
    private readonly provider?: PepperProvider,
  ) {}

  async requirePepper(scope: string): Promise {
    if (!this.provider) {
      throw PrivacyErrors.PEPPER_NOT_AVAILABLE();
    }

    return this.provider.getPepper(scope);
  }
}
```



生产必须：



```Plain Text
Pepper 存 KMS / HSM / Secret Manager
不能硬编码
不能进入前端
不能写日志
```



---



# 9\. Commitment 类型



## `core/privacy/commitment.types.ts`



```TypeScript
import { DIDBusinessDomain } from '../domain/did-domain.types';
import { DomainCredentialType } from '../domain/did-domain-credential.types';

export interface ClaimCommitmentInput {
  domain: DIDBusinessDomain;
  credentialType: DomainCredentialType;
  credentialId?: string;
  subjectDid?: string;
  claim: string;
  value: unknown;
  salt: string;
  pepper?: string;
}

export interface ClaimCommitmentResult {
  claim: string;
  commitment: string;
  saltId?: string;
  algorithm: 'sha256-domain-separated-v1';
  disclosureHint?: string;
}

export interface CredentialCommitmentInput {
  domain: DIDBusinessDomain;
  credentialType: DomainCredentialType;
  credentialId?: string;
  claims: Record;
  subjectDid?: string;
}
```



---



# 10\. Commitment Service



## `core/privacy/commitment.service.ts`



```TypeScript
import { sha256 } from '@noble/hashes/sha256';
import {
  ClaimCommitmentInput,
  ClaimCommitmentResult,
  CredentialCommitmentInput,
} from './commitment.types';
import { stableStringify } from '../anchor/anchor-hash.service';
import { SaltService } from './salt.service';
import { PepperService } from './pepper.service';

export class CommitmentService {
  constructor(
    private readonly saltService: SaltService,
    private readonly pepperService?: PepperService,
  ) {}

  async commitClaim(input: ClaimCommitmentInput): Promise {
    const payload = {
      version: 'claim-commitment-v1',
      domain: input.domain,
      credentialType: input.credentialType,
      credentialId: input.credentialId,
      subjectDid: input.subjectDid,
      claim: input.claim,
      value: input.value,
      salt: input.salt,
      pepper: input.pepper,
    };

    return {
      claim: input.claim,
      commitment: sha256Hex(stableStringify(payload)),
      algorithm: 'sha256-domain-separated-v1',
    };
  }

  async commitClaimWithManagedSalt(input: Omit & {
    usePepper?: boolean;
  }): Promise {
    const salt = await this.saltService.createSalt({
      credentialId: input.credentialId,
      claim: input.claim,
    });

    const pepper = input.usePepper && this.pepperService
      ? await this.pepperService.requirePepper(`${input.domain}:${input.credentialType}`)
      : undefined;

    const result = await this.commitClaim({
      ...input,
      salt: salt.salt,
      pepper,
    });

    return {
      ...result,
      saltId: salt.saltId,
    };
  }

  async commitCredential(input: CredentialCommitmentInput): Promise;
  }> {
    const claimCommitments: Record = {};

    for (const [claim, value] of Object.entries(input.claims)) {
      const commitment = await this.commitClaimWithManagedSalt({
        domain: input.domain,
        credentialType: input.credentialType,
        credentialId: input.credentialId,
        subjectDid: input.subjectDid,
        claim,
        value,
        usePepper: true,
      });

      claimCommitments[claim] = commitment.commitment;
    }

    const credentialCommitment = sha256Hex(stableStringify({
      version: 'credential-commitment-v1',
      domain: input.domain,
      credentialType: input.credentialType,
      credentialId: input.credentialId,
      subjectDid: input.subjectDid,
      claimCommitments,
    }));

    return {
      credentialCommitment,
      claimCommitments,
    };
  }
}

function sha256Hex(input: string): `0x${string}` {
  const bytes = sha256(new TextEncoder().encode(input));
  return `0x${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}`;
}
```



---



# 11\. Claim Minimization Service



将敏感原值转为最小披露值。



例如：



```Plain Text
dateOfBirth -> ageOver18: true
incomeAmount -> incomeBucket: "100k_plus"
creditScore -> creditScoreBucket: "700_749"
ownershipPercentage -> ownershipPercentageBucket: "25_50"
```



## `core/privacy/claim-minimization.service.ts`



```TypeScript
export class ClaimMinimizationService {
  minimize(input: {
    claim: string;
    value: unknown;
  }): {
    claim: string;
    value: unknown;
    transformed?: boolean;
  } {
    const claim = input.claim;

    if (claim === 'dateOfBirth' || claim === 'dob') {
      return {
        claim: 'ageOver18',
        value: isAgeAtLeast(input.value, 18),
        transformed: true,
      };
    }

    if (claim === 'income' || claim === 'annualIncome') {
      return {
        claim: 'incomeBucket',
        value: incomeBucket(input.value),
        transformed: true,
      };
    }

    if (claim === 'assetValue' || claim === 'netWorth') {
      return {
        claim: 'assetBucket',
        value: assetBucket(input.value),
        transformed: true,
      };
    }

    if (claim === 'creditScore') {
      return {
        claim: 'creditScoreBucket',
        value: creditScoreBucket(input.value),
        transformed: true,
      };
    }

    if (claim === 'ownershipPercentage') {
      return {
        claim: 'ownershipPercentageBucket',
        value: ownershipBucket(input.value),
        transformed: true,
      };
    }

    return {
      claim,
      value: input.value,
      transformed: false,
    };
  }
}

function isAgeAtLeast(value: unknown, age: number): boolean {
  if (typeof value !== 'string') return false;

  const dob = new Date(value).getTime();
  if (!Number.isFinite(dob)) return false;

  const now = new Date();
  const threshold = new Date(
    now.getFullYear() - age,
    now.getMonth(),
    now.getDate(),
  ).getTime();

  return dob ;
  challenge?: string;
  domain?: string;
  createdAt: number;
}

export interface DisclosureDecision {
  allowed: boolean;
  deniedClaims: string[];
  allowedClaims: string[];
  reason?: string;
}
```



---



# 13\. Disclosure Policy Service



## `core/privacy/disclosure-policy.service.ts`



```TypeScript
import { DIDBusinessDomain } from '../domain/did-domain.types';
import { DomainCredentialType } from '../domain/did-domain-credential.types';
import { ClaimPrivacyRule } from './privacy.types';
import { DisclosureDecision } from './selective-disclosure.types';

export class DisclosurePolicyService {
  constructor(
    private readonly rules: ClaimPrivacyRule[],
  ) {}

  decide(input: {
    domain: DIDBusinessDomain;
    credentialType: DomainCredentialType;
    requestedClaims: string[];
    purpose: string;
  }): DisclosureDecision {
    const deniedClaims: string[] = [];
    const allowedClaims: string[] = [];

    for (const claim of input.requestedClaims) {
      const rule = this.rules.find(
        (item) =>
          item.domain === input.domain &&
          item.credentialType === input.credentialType &&
          item.claim === claim,
      );

      if (!rule) {
        allowedClaims.push(claim);
        continue;
      }

      if (rule.privacyLevel === 'zero_knowledge') {
        deniedClaims.push(claim);
        continue;
      }

      if (rule.privacyLevel === 'sensitive' && !rule.exposeToVerifier) {
        deniedClaims.push(claim);
        continue;
      }

      if (rule.transform === 'remove') {
        deniedClaims.push(claim);
        continue;
      }

      allowedClaims.push(claim);
    }

    return {
      allowed: deniedClaims.length === 0,
      deniedClaims,
      allowedClaims,
      reason: deniedClaims.length
        ? 'SOME_CLAIMS_NOT_DISCLOSABLE'
        : undefined,
    };
  }
}
```



---



# 14\. Selective Disclosure Service



注意：这不是完整 BBS\+ cryptographic selective disclosure，只是 **应用层选择性披露表示**。真正 BBS\+ 会在后面通过接口替换。



## `core/privacy/selective-disclosure.service.ts`



```TypeScript
import { VerifiableCredential } from '../vc/vc.types';
import {
  SelectiveDisclosurePresentation,
  SelectiveDisclosureRequest,
} from './selective-disclosure.types';
import { DisclosurePolicyService } from './disclosure-policy.service';
import { CommitmentService } from './commitment.service';
import { DIDBusinessDomain } from '../domain/did-domain.types';
import { DomainCredentialType } from '../domain/did-domain-credential.types';

export class SelectiveDisclosureService {
  constructor(
    private readonly disclosurePolicy: DisclosurePolicyService,
    private readonly commitment: CommitmentService,
  ) {}

  async createPresentation(input: {
    credential: VerifiableCredential;
    domain: DIDBusinessDomain;
    credentialType: DomainCredentialType;
    request: SelectiveDisclosureRequest;
  }): Promise {
    if (input.request.expiresAt  = {
      id: subject.id,
    };

    const commitments: Record = {};
    const hiddenClaims: string[] = [];

    for (const [claim, value] of Object.entries(subject)) {
      if (claim === 'id') continue;

      if (decision.allowedClaims.includes(claim)) {
        disclosedSubject[claim] = value;
      } else {
        hiddenClaims.push(claim);

        const c = await this.commitment.commitClaimWithManagedSalt({
          domain: input.domain,
          credentialType: input.credentialType,
          credentialId: input.credential.id,
          subjectDid: subject.id,
          claim,
          value,
          usePepper: true,
        });

        commitments[claim] = c.commitment;
      }
    }

    const disclosedCredential: VerifiableCredential = {
      ...input.credential,
      credentialSubject: disclosedSubject,
      proof: undefined,
    };

    return {
      presentationId: `SDP-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`,
      originalCredentialId: input.credential.id,
      disclosedCredential,
      disclosedClaims: Object.keys(disclosedSubject).filter((x) => x !== 'id'),
      hiddenClaims,
      commitments,
      challenge: input.request.challenge,
      domain: input.request.domain,
      createdAt: Date.now(),
    };
  }
}
```



---



# 15\. VC Privacy Transform Service



签发前 / 上链前统一做隐私转换。



## `core/privacy/vc-privacy-transform.service.ts`



```TypeScript
import { ClaimMinimizationService } from './claim-minimization.service';
import { CommitmentService } from './commitment.service';
import { PIIClassifierService } from './pii-classifier.service';
import {
  ClaimPrivacyRule,
  PrivacyTransformInput,
  PrivacyTransformResult,
} from './privacy.types';
import { PrivacyErrors } from './privacy.errors';

export class VCPrivacyTransformService {
  constructor(
    private readonly rules: ClaimPrivacyRule[],
    private readonly minimizer: ClaimMinimizationService,
    private readonly commitment: CommitmentService,
    private readonly pii: PIIClassifierService,
  ) {}

  async transform(input: PrivacyTransformInput): Promise {
    const output: Record = {};
    const commitments: Record = {};
    const removedClaims: string[] = [];
    const transformedClaims: string[] = [];
    const warnings: string[] = [];

    if (input.purpose === 'anchor') {
      const pii = this.pii.detect(input.claims);

      if (pii.containsPII) {
        throw PrivacyErrors.PII_ONCHAIN_FORBIDDEN(pii);
      }
    }

    for (const [claim, value] of Object.entries(input.claims)) {
      const rule = this.findRule(input, claim);

      if (!rule) {
        output[claim] = value;
        continue;
      }

      if (input.purpose === 'anchor' && !rule.allowOnChain) {
        removedClaims.push(claim);
        continue;
      }

      switch (rule.transform) {
        case 'keep':
          output[claim] = value;
          break;

        case 'remove':
          removedClaims.push(claim);
          break;

        case 'bucket': {
          const minimized = this.minimizer.minimize({
            claim,
            value,
          });

          output[minimized.claim] = minimized.value;
          transformedClaims.push(claim);
          break;
        }

        case 'boolean': {
          const minimized = this.minimizer.minimize({
            claim,
            value,
          });

          output[minimized.claim] = minimized.value;
          transformedClaims.push(claim);
          break;
        }

        case 'hash':
        case 'commitment': {
          const c = await this.commitment.commitClaimWithManagedSalt({
            domain: input.domain,
            credentialType: input.credentialType,
            claim,
            value,
            usePepper: true,
          });

          output[`${claim}Commitment`] = c.commitment;
          commitments[claim] = c.commitment;
          transformedClaims.push(claim);
          break;
        }

        case 'zero_knowledge':
          removedClaims.push(claim);
          warnings.push(`ZK_PROOF_REQUIRED_FOR:${claim}`);
          break;

        default:
          output[claim] = value;
      }
    }

    return {
      claims: output,
      commitments,
      removedClaims,
      transformedClaims,
      warnings,
    };
  }

  private findRule(input: PrivacyTransformInput, claim: string): ClaimPrivacyRule | undefined {
    return this.rules.find(
      (item) =>
        item.domain === input.domain &&
        item.credentialType === input.credentialType &&
        item.claim === claim,
    );
  }
}
```



---



# 16\. 五大业务域 Privacy Rules



## 16\.1 Exchange Privacy Policy



### `core/domains/exchange/exchange-privacy-policy.service.ts`



```TypeScript
import { ClaimPrivacyRule } from '../../privacy/privacy.types';

export const EXCHANGE_PRIVACY_RULES: ClaimPrivacyRule[] = [
  {
    domain: 'exchange',
    credentialType: 'ExchangeKYCLevel',
    claim: 'fullName',
    privacyLevel: 'sensitive',
    transform: 'commitment',
    allowOnChain: false,
  },
  {
    domain: 'exchange',
    credentialType: 'ExchangeKYCLevel',
    claim: 'passportNumber',
    privacyLevel: 'sensitive',
    transform: 'commitment',
    allowOnChain: false,
  },
  {
    domain: 'exchange',
    credentialType: 'ExchangeKYCLevel',
    claim: 'countryCode',
    privacyLevel: 'private',
    transform: 'keep',
    allowOnChain: false,
  },
  {
    domain: 'exchange',
    credentialType: 'ExchangeKYCLevel',
    claim: 'kycLevel',
    privacyLevel: 'internal',
    transform: 'keep',
    allowOnChain: true,
  },
  {
    domain: 'exchange',
    credentialType: 'AMLScreening',
    claim: 'amlReport',
    privacyLevel: 'sensitive',
    transform: 'commitment',
    allowOnChain: false,
  },
];
```



---



## 16\.2 Commerce Privacy Policy



### `core/domains/commerce/commerce-privacy-policy.service.ts`



```TypeScript
import { ClaimPrivacyRule } from '../../privacy/privacy.types';

export const COMMERCE_PRIVACY_RULES: ClaimPrivacyRule[] = [
  {
    domain: 'cross_border_commerce',
    credentialType: 'CommerceMerchantKYB',
    claim: 'businessRegistrationNumber',
    privacyLevel: 'sensitive',
    transform: 'commitment',
    allowOnChain: false,
  },
  {
    domain: 'cross_border_commerce',
    credentialType: 'CommerceTaxIdentity',
    claim: 'taxId',
    privacyLevel: 'sensitive',
    transform: 'commitment',
    allowOnChain: false,
  },
  {
    domain: 'cross_border_commerce',
    credentialType: 'CommerceShippingAddressProof',
    claim: 'address',
    privacyLevel: 'sensitive',
    transform: 'commitment',
    allowOnChain: false,
  },
];
```



---



## 16\.3 Gaming Privacy Policy



### `core/domains/gaming/gaming-privacy-policy.service.ts`



```TypeScript
import { ClaimPrivacyRule } from '../../privacy/privacy.types';

export const GAMING_PRIVACY_RULES: ClaimPrivacyRule[] = [
  {
    domain: 'gaming',
    credentialType: 'GamingAgeOver18',
    claim: 'dateOfBirth',
    privacyLevel: 'zero_knowledge',
    transform: 'boolean',
    allowOnChain: false,
    reason: 'Only disclose ageOver18, never disclose DOB',
  },
  {
    domain: 'gaming',
    credentialType: 'GamingGeoEligibility',
    claim: 'preciseLocation',
    privacyLevel: 'sensitive',
    transform: 'remove',
    allowOnChain: false,
  },
  {
    domain: 'gaming',
    credentialType: 'GamingSelfExclusionStatus',
    claim: 'selfExclusionReason',
    privacyLevel: 'sensitive',
    transform: 'commitment',
    allowOnChain: false,
  },
];
```



---



## 16\.4 Financial Privacy Policy



### `core/domains/financial/financial-privacy-policy.service.ts`



```TypeScript
import { ClaimPrivacyRule } from '../../privacy/privacy.types';

export const FINANCIAL_PRIVACY_RULES: ClaimPrivacyRule[] = [
  {
    domain: 'financial',
    credentialType: 'FinancialIncomeProof',
    claim: 'income',
    privacyLevel: 'zero_knowledge',
    transform: 'bucket',
    allowOnChain: false,
  },
  {
    domain: 'financial',
    credentialType: 'FinancialAssetProof',
    claim: 'assetValue',
    privacyLevel: 'zero_knowledge',
    transform: 'bucket',
    allowOnChain: false,
  },
  {
    domain: 'financial',
    credentialType: 'FinancialCreditScore',
    claim: 'creditScore',
    privacyLevel: 'private',
    transform: 'bucket',
    allowOnChain: false,
  },
  {
    domain: 'financial',
    credentialType: 'FinancialAccreditedInvestor',
    claim: 'accredited',
    privacyLevel: 'private',
    transform: 'keep',
    allowOnChain: true,
  },
];
```



---



## 16\.5 Samoa Enterprise Privacy Policy



### `core/domains/samoa-enterprise/samoa-enterprise-privacy-policy.service.ts`



```TypeScript
import { ClaimPrivacyRule } from '../../privacy/privacy.types';

export const SAMOA_ENTERPRISE_PRIVACY_RULES: ClaimPrivacyRule[] = [
  {
    domain: 'samoa_enterprise',
    credentialType: 'SamoaEntrepreneurIdentity',
    claim: 'passportNumber',
    privacyLevel: 'sensitive',
    transform: 'commitment',
    allowOnChain: false,
  },
  {
    domain: 'samoa_enterprise',
    credentialType: 'SamoaEntrepreneurIdentity',
    claim: 'dateOfBirth',
    privacyLevel: 'zero_knowledge',
    transform: 'boolean',
    allowOnChain: false,
  },
  {
    domain: 'samoa_enterprise',
    credentialType: 'SamoaUBODeclaration',
    claim: 'uboName',
    privacyLevel: 'sensitive',
    transform: 'commitment',
    allowOnChain: false,
  },
  {
    domain: 'samoa_enterprise',
    credentialType: 'SamoaUBODeclaration',
    claim: 'ownershipPercentage',
    privacyLevel: 'private',
    transform: 'bucket',
    allowOnChain: false,
  },
  {
    domain: 'samoa_enterprise',
    credentialType: 'SamoaRegisteredOfficeAddress',
    claim: 'address',
    privacyLevel: 'sensitive',
    transform: 'commitment',
    allowOnChain: false,
  },
  {
    domain: 'samoa_enterprise',
    credentialType: 'SamoaCompanyIncorporationCertificate',
    claim: 'companyName',
    privacyLevel: 'private',
    transform: 'commitment',
    allowOnChain: false,
  },
  {
    domain: 'samoa_enterprise',
    credentialType: 'SamoaCompanyIncorporationCertificate',
    claim: 'companyNumber',
    privacyLevel: 'private',
    transform: 'commitment',
    allowOnChain: false,
  },
];
```



---



# 17\. Default Privacy Rules



## `core/privacy/default-privacy-rules.ts`



```TypeScript
import { ClaimPrivacyRule } from './privacy.types';
import { EXCHANGE_PRIVACY_RULES } from '../domains/exchange/exchange-privacy-policy.service';
import { COMMERCE_PRIVACY_RULES } from '../domains/commerce/commerce-privacy-policy.service';
import { GAMING_PRIVACY_RULES } from '../domains/gaming/gaming-privacy-policy.service';
import { FINANCIAL_PRIVACY_RULES } from '../domains/financial/financial-privacy-policy.service';
import { SAMOA_ENTERPRISE_PRIVACY_RULES } from '../domains/samoa-enterprise/samoa-enterprise-privacy-policy.service';

export const DEFAULT_PRIVACY_RULES: ClaimPrivacyRule[] = [
  ...EXCHANGE_PRIVACY_RULES,
  ...COMMERCE_PRIVACY_RULES,
  ...GAMING_PRIVACY_RULES,
  ...FINANCIAL_PRIVACY_RULES,
  ...SAMOA_ENTERPRISE_PRIVACY_RULES,
];
```



---



# 18\. Privacy Audit



## `core/privacy/privacy-audit.service.ts`



```TypeScript
export interface PrivacyAuditRecord {
  auditNo: string;
  action:
    | 'privacy.pii.detected'
    | 'privacy.claim.transformed'
    | 'privacy.commitment.created'
    | 'privacy.disclosure.created'
    | 'privacy.disclosure.denied'
    | 'privacy.zk.proof.created'
    | 'privacy.zk.proof.verified';

  result: 'success' | 'failed' | 'denied';

  domain?: string;
  credentialType?: string;
  credentialId?: string;
  subjectDid?: string;

  claims?: string[];
  metadata?: unknown;
  error?: unknown;

  createdAt: number;
}

export interface PrivacyAuditSink {
  record(input: PrivacyAuditRecord): Promise;
}

export class ConsolePrivacyAuditSink implements PrivacyAuditSink {
  async record(input: PrivacyAuditRecord): Promise {
    console.log('[PrivacyAudit]', input);
  }
}

export class PrivacyAuditService {
  constructor(
    private readonly sink: PrivacyAuditSink = new ConsolePrivacyAuditSink(),
  ) {}

  async record(
    action: PrivacyAuditRecord['action'],
    result: PrivacyAuditRecord['result'],
    input: Omit,
  ) {
    await this.sink.record({
      auditNo: `PRAUD-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`,
      action,
      result,
      ...input,
      createdAt: Date.now(),
    });
  }
}
```



---



# 19\. ZK 类型



本章先定义 ZK 抽象，不绑定具体 proving system。



未来可以接：



```Plain Text
circom / snarkjs
halo2
noir
plonk
risc0
sp1
zkVM
Semaphore
Polygon ID
zk-SNARK based KYC
```



## `core/zk/zk.types.ts`



```TypeScript
import { DIDBusinessDomain } from '../domain/did-domain.types';
import { DomainCredentialType } from '../domain/did-domain-credential.types';

export type ZKProofType =
  | 'age_over_18'
  | 'age_over_21'
  | 'kyc_level_at_least'
  | 'accredited_investor'
  | 'income_bucket'
  | 'asset_bucket'
  | 'geo_eligibility'
  | 'samoa_ubo_control'
  | 'custom';

export interface ZKProofRequest {
  proofType: ZKProofType;
  domain: DIDBusinessDomain;
  credentialType: DomainCredentialType;
  subjectDid: string;
  publicInputs: Record;
  privateInputsRef?: string;
  challenge?: string;
  expiresAt?: number;
}

export interface ZKProofResult {
  proofId: string;
  proofType: ZKProofType;
  proof: unknown;
  publicSignals: Record;
  createdAt: number;
  expiresAt?: number;
}

export interface ZKVerifyResult {
  valid: boolean;
  reason?: string;
  metadata?: Record;
}

export interface ZKProverAdapter {
  prove(input: ZKProofRequest): Promise;
}

export interface ZKVerifierAdapter {
  verify(input: {
    proofType: ZKProofType;
    proof: unknown;
    publicSignals: Record;
  }): Promise;
}
```



---



# 20\. ZK Proof Service



## `core/zk/zk-proof.service.ts`



```TypeScript
import {
  ZKProofRequest,
  ZKProofResult,
  ZKProverAdapter,
} from './zk.types';

export class UnsupportedZKProverAdapter implements ZKProverAdapter {
  async prove(): Promise {
    throw new Error('ZK_PROVER_NOT_CONFIGURED');
  }
}

export class ZKProofService {
  constructor(
    private readonly prover: ZKProverAdapter = new UnsupportedZKProverAdapter(),
  ) {}

  async prove(input: ZKProofRequest): Promise {
    return this.prover.prove(input);
  }
}
```



---



# 21\. ZK Verifier Service



## `core/zk/zk-verifier.service.ts`



```TypeScript
import {
  ZKVerifierAdapter,
  ZKVerifyResult,
  ZKProofType,
} from './zk.types';

export class UnsupportedZKVerifierAdapter implements ZKVerifierAdapter {
  async verify(): Promise {
    throw new Error('ZK_VERIFIER_NOT_CONFIGURED');
  }
}

export class ZKVerifierService {
  constructor(
    private readonly verifier: ZKVerifierAdapter = new UnsupportedZKVerifierAdapter(),
  ) {}

  async verify(input: {
    proofType: ZKProofType;
    proof: unknown;
    publicSignals: Record;
  }): Promise {
    return this.verifier.verify(input);
  }
}
```



---



# 22\. Age Over 18 ZK Service



## `core/zk/age-over18-zk.service.ts`



```TypeScript
import { ZKProofService } from './zk-proof.service';
import { ZKVerifierService } from './zk-verifier.service';
import { ZKProofResult, ZKVerifyResult } from './zk.types';

export class AgeOver18ZKService {
  constructor(
    private readonly prover: ZKProofService,
    private readonly verifier: ZKVerifierService,
  ) {}

  async prove(input: {
    subjectDid: string;
    ageCommitment: string;
    challenge?: string;
  }): Promise {
    return this.prover.prove({
      proofType: 'age_over_18',
      domain: 'gaming',
      credentialType: 'GamingAgeOver18',
      subjectDid: input.subjectDid,
      publicInputs: {
        ageCommitment: input.ageCommitment,
        statement: 'age >= 18',
      },
      challenge: input.challenge,
    });
  }

  async verify(input: {
    proof: unknown;
    publicSignals: Record;
  }): Promise {
    return this.verifier.verify({
      proofType: 'age_over_18',
      proof: input.proof,
      publicSignals: input.publicSignals,
    });
  }
}
```



---



# 23\. KYC Level ZK Service



## `core/zk/kyc-level-zk.service.ts`



```TypeScript
import { ZKProofService } from './zk-proof.service';
import { ZKVerifierService } from './zk-verifier.service';

export class KYCLevelZKService {
  constructor(
    private readonly prover: ZKProofService,
    private readonly verifier: ZKVerifierService,
  ) {}

  async proveAtLeast(input: {
    subjectDid: string;
    domain: 'exchange' | 'financial' | 'samoa_enterprise';
    credentialType: 'ExchangeKYCLevel' | 'FinancialKYCLevel' | 'SamoaEntrepreneurIdentity';
    kycLevelCommitment: string;
    minLevel: number;
    challenge?: string;
  }) {
    return this.prover.prove({
      proofType: 'kyc_level_at_least',
      domain: input.domain,
      credentialType: input.credentialType,
      subjectDid: input.subjectDid,
      publicInputs: {
        kycLevelCommitment: input.kycLevelCommitment,
        minLevel: input.minLevel,
      },
      challenge: input.challenge,
    });
  }

  async verify(input: {
    proof: unknown;
    publicSignals: Record;
  }) {
    return this.verifier.verify({
      proofType: 'kyc_level_at_least',
      proof: input.proof,
      publicSignals: input.publicSignals,
    });
  }
}
```



---



# 24\. Accredited Investor ZK Service



## `core/zk/accredited-investor-zk.service.ts`



```TypeScript
import { ZKProofService } from './zk-proof.service';
import { ZKVerifierService } from './zk-verifier.service';

export class AccreditedInvestorZKService {
  constructor(
    private readonly prover: ZKProofService,
    private readonly verifier: ZKVerifierService,
  ) {}

  async prove(input: {
    subjectDid: string;
    accreditedCommitment: string;
    jurisdictionHash: string;
    challenge?: string;
  }) {
    return this.prover.prove({
      proofType: 'accredited_investor',
      domain: 'financial',
      credentialType: 'FinancialAccreditedInvestor',
      subjectDid: input.subjectDid,
      publicInputs: {
        accreditedCommitment: input.accreditedCommitment,
        jurisdictionHash: input.jurisdictionHash,
        statement: 'is accredited investor',
      },
      challenge: input.challenge,
    });
  }

  async verify(input: {
    proof: unknown;
    publicSignals: Record;
  }) {
    return this.verifier.verify({
      proofType: 'accredited_investor',
      proof: input.proof,
      publicSignals: input.publicSignals,
    });
  }
}
```



---



# 25\. Samoa UBO ZK Service



## `core/zk/samoa-ubo-zk.service.ts`



```TypeScript
import { ZKProofService } from './zk-proof.service';
import { ZKVerifierService } from './zk-verifier.service';

export class SamoaUBOZKService {
  constructor(
    private readonly prover: ZKProofService,
    private readonly verifier: ZKVerifierService,
  ) {}

  async proveControl(input: {
    subjectDid: string;
    uboCommitment: string;
    ownershipBucketCommitment: string;
    companyNumberHash: string;
    challenge?: string;
  }) {
    return this.prover.prove({
      proofType: 'samoa_ubo_control',
      domain: 'samoa_enterprise',
      credentialType: 'SamoaUBODeclaration',
      subjectDid: input.subjectDid,
      publicInputs: {
        uboCommitment: input.uboCommitment,
        ownershipBucketCommitment: input.ownershipBucketCommitment,
        companyNumberHash: input.companyNumberHash,
        statement: 'subject has declared UBO control without revealing identity details',
      },
      challenge: input.challenge,
    });
  }

  async verify(input: {
    proof: unknown;
    publicSignals: Record;
  }) {
    return this.verifier.verify({
      proofType: 'samoa_ubo_control',
      proof: input.proof,
      publicSignals: input.publicSignals,
    });
  }
}
```



---



# 26\. Privacy Runtime



## `core/privacy/create-privacy-runtime.ts`



```TypeScript
import { DEFAULT_PRIVACY_RULES } from './default-privacy-rules';
import { PIIClassifierService } from './pii-classifier.service';
import { SaltService } from './salt.service';
import { PepperService, PepperProvider } from './pepper.service';
import { CommitmentService } from './commitment.service';
import { ClaimMinimizationService } from './claim-minimization.service';
import { DisclosurePolicyService } from './disclosure-policy.service';
import { SelectiveDisclosureService } from './selective-disclosure.service';
import { VCPrivacyTransformService } from './vc-privacy-transform.service';
import { PrivacyAuditService } from './privacy-audit.service';

import { ZKProofService } from '../zk/zk-proof.service';
import { ZKVerifierService } from '../zk/zk-verifier.service';
import { AgeOver18ZKService } from '../zk/age-over18-zk.service';
import { KYCLevelZKService } from '../zk/kyc-level-zk.service';
import { AccreditedInvestorZKService } from '../zk/accredited-investor-zk.service';
import { SamoaUBOZKService } from '../zk/samoa-ubo-zk.service';
import { ZKProverAdapter, ZKVerifierAdapter } from '../zk/zk.types';

export function createPrivacyRuntime(input: {
  pepperProvider?: PepperProvider;
  zkProver?: ZKProverAdapter;
  zkVerifier?: ZKVerifierAdapter;
} = {}) {
  const pii = new PIIClassifierService();

  const salt = new SaltService();
  const pepper = new PepperService(input.pepperProvider);

  const commitment = new CommitmentService(
    salt,
    pepper,
  );

  const minimizer = new ClaimMinimizationService();

  const disclosurePolicy = new DisclosurePolicyService(
    DEFAULT_PRIVACY_RULES,
  );

  const selectiveDisclosure = new SelectiveDisclosureService(
    disclosurePolicy,
    commitment,
  );

  const transform = new VCPrivacyTransformService(
    DEFAULT_PRIVACY_RULES,
    minimizer,
    commitment,
    pii,
  );

  const audit = new PrivacyAuditService();

  const zkProof = new ZKProofService(input.zkProver);
  const zkVerifier = new ZKVerifierService(input.zkVerifier);

  const ageOver18Zk = new AgeOver18ZKService(zkProof, zkVerifier);
  const kycLevelZk = new KYCLevelZKService(zkProof, zkVerifier);
  const accreditedInvestorZk = new AccreditedInvestorZKService(zkProof, zkVerifier);
  const samoaUboZk = new SamoaUBOZKService(zkProof, zkVerifier);

  return {
    rules: DEFAULT_PRIVACY_RULES,

    pii,
    salt,
    pepper,
    commitment,
    minimizer,
    disclosurePolicy,
    selectiveDisclosure,
    transform,
    audit,

    zkProof,
    zkVerifier,
    ageOver18Zk,
    kycLevelZk,
    accreditedInvestorZk,
    samoaUboZk,
  };
}
```



---



# 27\. 签发前隐私转换示例



## 27\.1 博彩年龄证明



原始输入：



```TypeScript
const rawClaims = {
  dateOfBirth: '1990-01-01',
  provider: 'AgeVerificationProvider',
  jurisdiction: 'GB',
};
```



转换：



```TypeScript
const privacy = createPrivacyRuntime({
  pepperProvider: kmsPepperProvider,
});

const transformed = await privacy.transform.transform({
  domain: 'gaming',
  credentialType: 'GamingAgeOver18',
  claims: rawClaims,
  purpose: 'issue',
});

console.log(transformed.claims);
```



输出：



```JSON
{
  "ageOver18": true,
  "provider": "AgeVerificationProvider",
  "jurisdiction": "GB"
}
```



不会签发：



```JSON
{
  "dateOfBirth": "1990-01-01"
}
```



---



## 27\.2 金融资产证明



```TypeScript
const transformed = await privacy.transform.transform({
  domain: 'financial',
  credentialType: 'FinancialAssetProof',
  claims: {
    assetValue: 1200000,
    assetDetails: [
      {
        bank: 'Bank A',
        accountNumber: '123456'
      }
    ]
  },
  purpose: 'issue',
});
```



期望：



```JSON
{
  "assetBucket": "1m_5m",
  "assetDetailsCommitment": "0x..."
}
```



---



## 27\.3 萨摩亚 UBO



```TypeScript
const transformed = await privacy.transform.transform({
  domain: 'samoa_enterprise',
  credentialType: 'SamoaUBODeclaration',
  claims: {
    uboName: 'Alice Example',
    ownershipPercentage: 37,
    controlType: 'direct_ownership',
    declarationDate: '2026-01-01'
  },
  purpose: 'issue',
});
```



期望：



```JSON
{
  "uboNameCommitment": "0x...",
  "ownershipPercentageBucket": "25_50",
  "controlType": "direct_ownership",
  "declarationDate": "2026-01-01"
}
```



---



# 28\. 上链前隐私检查



```TypeScript
await privacy.transform.transform({
  domain: 'samoa_enterprise',
  credentialType: 'SamoaUBODeclaration',
  claims: {
    uboName: 'Alice Example',
    passportNumber: 'P123456'
  },
  purpose: 'anchor',
});
```



必须失败：



```Plain Text
PRIVACY_PII_ONCHAIN_FORBIDDEN
```



正确做法：



```TypeScript
await anchorRuntime.credentialAnchor.anchor({
  domain: 'samoa_enterprise',
  credentialType: 'SamoaUBODeclaration',
  credentialHash,
  issuerDid,
  subjectDid,
  schemaHash,
  issuedAt,
  target,
  sourcePayload: {
    credentialHash,
    uboCommitment: '0x...',
    ownershipBucketCommitment: '0x...'
  },
});
```



---



# 29\. 选择性披露示例



## 29\.1 Verifier 请求



```TypeScript
const request = {
  requestId: 'REQ-1',
  verifierDid: 'did:web:verifier.example',
  purpose: 'merchant_onboard',
  requestedClaims: [
    'merchantId',
    'kybLevel',
    'businessRegistrationNumber',
    'taxId',
  ],
  requiredClaims: [
    'merchantId',
    'kybLevel',
  ],
  challenge: 'random-challenge',
  domain: 'commerce.example',
  createdAt: Date.now(),
  expiresAt: Date.now() + 10 * 60_000,
};
```



## 29\.2 Holder 生成披露



```TypeScript
const presentation = await privacy.selectiveDisclosure.createPresentation({
  credential: merchantKybCredential,
  domain: 'cross_border_commerce',
  credentialType: 'CommerceMerchantKYB',
  request,
});
```



结果：



```JSON
{
  "disclosedClaims": ["merchantId", "kybLevel"],
  "hiddenClaims": ["businessRegistrationNumber", "taxId"],
  "commitments": {
    "businessRegistrationNumber": "0x...",
    "taxId": "0x..."
  }
}
```



---



# 30\. ZK 使用示例



## 30\.1 博彩证明年龄大于 18



```TypeScript
const proof = await privacy.ageOver18Zk.prove({
  subjectDid: playerDid,
  ageCommitment: '0x...',
  challenge: 'verifier-challenge',
});
```



Verifier：



```TypeScript
const result = await privacy.ageOver18Zk.verify({
  proof: proof.proof,
  publicSignals: proof.publicSignals,
});
```



---



## 30\.2 金融合格投资者证明



```TypeScript
const proof = await privacy.accreditedInvestorZk.prove({
  subjectDid: investorDid,
  accreditedCommitment: '0x...',
  jurisdictionHash: '0x...',
});
```



---



## 30\.3 萨摩亚 UBO 控制证明



```TypeScript
const proof = await privacy.samoaUboZk.proveControl({
  subjectDid: uboDid,
  uboCommitment: '0x...',
  ownershipBucketCommitment: '0x...',
  companyNumberHash: '0x...',
});
```



---



# 31\. 五大业务域隐私策略总结



## 31\.1 交易所



```Plain Text
KYC Level 可披露等级
姓名 / 证件 / AML 报告不可披露
提现权限可披露 true/false
Travel Rule 只披露合规状态，不披露对手方信息
```



---



## 31\.2 跨境电商



```Plain Text
商户 KYB level 可披露
税号必须 hash/commitment
注册地址必须 commitment
履约评级可 bucket 化
纠纷率可区间化
```



---



## 31\.3 博彩



```Plain Text
只披露 ageOver18 / ageOver21
不披露出生日期
只披露 geoEligible
不披露精确位置
自我排除状态必须受严格访问控制
```



---



## 31\.4 金融



```Plain Text
合格投资者 true/false 可披露
收入/资产只披露 bucket 或 ZK
信用分只披露 bucket
PEP / Sanctions 只披露 passed/failed
不披露报告详情
```



---



## 31\.5 萨摩亚企业家 / 公司设立



```Plain Text
企业家身份只披露 verified / kycLevel
护照号不可披露
UBO 只披露 commitment / bucket
注册地址只披露 hash
公司证书可披露编号 hash / 名称 hash
GoodStanding 可披露 true/false
```



---



# 32\. 安全要求



隐私系统必须满足：



```Plain Text
1. 敏感字段默认不披露
2. 上链前必须 PII 扫描
3. commitment 必须 domain-separated
4. commitment 必须使用 per-claim salt
5. 高敏感 commitment 必须使用 server pepper
6. salt 不上链
7. pepper 不进前端
8. 博彩年龄不得暴露 DOB
9. 金融资产不得暴露明细
10. 萨摩亚 UBO 不得明文上链
11. 选择性披露必须带 challenge
12. ZK proof 必须绑定 challenge / domain 防重放
13. 隐私转换必须审计
```



---



# 33\. 本章完成内容



本章完成：



```Plain Text
Privacy 类型系统
Privacy 错误体系
PII Classifier
Salt Service
Pepper Service
Claim Commitment
Credential Commitment
Claim Minimization
Disclosure Policy
Selective Disclosure
VC Privacy Transform
Privacy Audit
ZK Proof Interface
ZK Verifier Interface
AgeOver18 ZK 预留
KYC Level ZK 预留
Accredited Investor ZK 预留
Samoa UBO ZK 预留
五大业务域隐私规则
Privacy Runtime
```



现在 DID 身份系统具备工业级隐私保护基础：



```Plain Text
Raw Claim
  -> Privacy Policy
  -> Minimize / Commitment / Bucket / ZK
  -> VC Issue
  -> Selective Disclosure
  -> Anchor Hash-only
```



---



# 34\. 下一章继续



下一章：



# 《DID 身份 Part 10：身份管理页面 DID Profile / Wallet Binding / VC Wallet》



将覆盖：



```Plain Text
Identity Home
DID Profile
Wallet Binding UI
VC Wallet
Credential List
Credential Detail
Credential Verification
Selective Disclosure Modal
Samoa Enterprise Identity Page
Company Formation VC Page
Exchange KYC VC Page
Gaming Age VC Page
Financial Investor VC Page
Commerce Merchant KYB Page
隐私展示规则
撤销 / 过期 / 链上锚定状态展示
```



