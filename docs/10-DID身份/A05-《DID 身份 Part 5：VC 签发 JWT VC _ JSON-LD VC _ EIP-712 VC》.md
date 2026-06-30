# A05\-《DID 身份 Part 5：VC 签发 JWT VC / JSON\-LD VC / EIP\-712 VC》

# 《DID 身份 Part 5：VC 签发 JWT VC / JSON\-LD VC / EIP\-712 VC》



本章实现 DID 身份系统的 **VC 签发核心流水线**，覆盖：



- VC Issue Pipeline

- 签发前 Issuer Permission 校验

- Schema 校验

- Credential Hash

- JWT VC 签发

- JSON\-LD VC 签发

- EIP\-712 VC 签发

- 五大业务域 VC 模板

- 萨摩亚公司设立 VC

- 交易所 KYC VC

- 博彩年龄证明 VC

- 金融合格投资者 VC

- 跨境电商商户 KYB VC

- 签发审计

- 可选链上锚定入口

    

核心原则：



```Plain Text
VC 签发不是生成一个 JSON。
VC 签发必须经过：
Issuer 授权校验
Schema 校验
Subject DID 校验
Claims 最小化
隐私策略检查
可撤销状态生成
签名
Hash
审计
可选链上锚定
```



---



# 1\. 本章目录



```Bash
src/modules/did/
  core/
    vc/
      vc.types.ts
      vc-issue.types.ts
      vc-issue.errors.ts
      vc-template.service.ts
      vc-credential-builder.service.ts
      vc-hash.service.ts
      vc-issue-pipeline.service.ts
      vc-jwt.service.ts
      vc-jsonld.service.ts
      vc-eip712.service.ts
      vc-issuer.service.ts
      vc-issue-audit.service.ts

    vc/templates/
      exchange-vc-templates.ts
      commerce-vc-templates.ts
      gaming-vc-templates.ts
      financial-vc-templates.ts
      samoa-enterprise-vc-templates.ts

    crypto/
      vc-signing.types.ts
      vc-signer.service.ts
      jwt-signer.adapter.ts
      eip712-signer.adapter.ts
```



---



# 2\. VC 签发增强类型



## `core/vc/vc-issue.types.ts`



```TypeScript
import { DIDString, DIDUrl } from '../did/did.types';
import { DIDBusinessDomain } from '../domain/did-domain.types';
import { DomainCredentialType } from '../domain/did-domain-credential.types';
import {
  CredentialSchema,
  CredentialStatus,
  VCFormat,
  VerifiableCredential,
} from './vc.types';

export interface VCIssueContext {
  requestId?: string;
  domain: DIDBusinessDomain;

  issuerDid: DIDString;
  issuerKeyId?: DIDUrl;
  issuerKeyRef: string;

  subjectDid: DIDString;

  credentialType: DomainCredentialType;
  schemaId?: string;

  format: VCFormat;

  audience?: string;
  challenge?: string;

  issuanceDate?: string;
  expirationDate?: string;

  status?: CredentialStatus;

  anchorOnChain?: boolean;

  metadata?: Record;
}

export interface VCIssueClaims {
  [key: string]: unknown;
}

export interface VCIssuePipelineInput {
  context: VCIssueContext;
  claims: VCIssueClaims;
}

export interface VCIssuePipelinePrepared {
  context: VCIssueContext;
  schema: CredentialSchema;
  credential: VerifiableCredential;
  credentialHash: string;
}

export interface VCIssuePipelineResult {
  credentialId: string;
  format: VCFormat;

  credential?: VerifiableCredential;
  jwt?: string;
  eip712?: {
    typedData: unknown;
    signature: string;
  };

  credentialHash: string;

  anchor?: {
    chainId: string;
    txHash: string;
    registryAddress: string;
  };

  issuedAt: number;
}

export interface VCTemplateInput {
  subjectDid: DIDString;
  issuerDid: DIDString;
  claims: Record;
  issuanceDate: string;
  expirationDate?: string;
  credentialId?: string;
  credentialSchema?: CredentialSchema;
  credentialStatus?: CredentialStatus;
}

export interface VCTemplateResult {
  credential: VerifiableCredential;
}
```



---



# 3\. VC 签发错误



## `core/vc/vc-issue.errors.ts`



```TypeScript
export class VCIssueError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'VCIssueError';
  }
}

export const VCIssueErrors = {
  UNSUPPORTED_FORMAT: (format?: string) =>
    new VCIssueError(
      'VC_ISSUE_UNSUPPORTED_FORMAT',
      'Unsupported VC issue format',
      { format },
    ),

  CLAIMS_INVALID: (details?: unknown) =>
    new VCIssueError(
      'VC_ISSUE_CLAIMS_INVALID',
      'Credential claims are invalid',
      details,
    ),

  TEMPLATE_NOT_FOUND: (details?: unknown) =>
    new VCIssueError(
      'VC_ISSUE_TEMPLATE_NOT_FOUND',
      'VC template not found',
      details,
    ),

  SIGNING_FAILED: (details?: unknown) =>
    new VCIssueError(
      'VC_ISSUE_SIGNING_FAILED',
      'VC signing failed',
      details,
    ),

  SUBJECT_DID_REQUIRED: () =>
    new VCIssueError(
      'VC_ISSUE_SUBJECT_DID_REQUIRED',
      'Subject DID is required',
    ),

  ISSUER_DID_REQUIRED: () =>
    new VCIssueError(
      'VC_ISSUE_ISSUER_DID_REQUIRED',
      'Issuer DID is required',
    ),
};
```



---



# 4\. VC Signing 类型



## `core/crypto/vc-signing.types.ts`



```TypeScript
import { DIDString, DIDUrl } from '../did/did.types';

export interface VCSignInput {
  issuerDid: DIDString;
  keyRef: string;
  verificationMethod?: DIDUrl;
  payload: Uint8Array;
  alg:
    | 'EdDSA'
    | 'ES256K'
    | 'ES256K-R'
    | 'RS256';
}

export interface VCSignResult {
  signature: Uint8Array;
  signatureBase64Url: string;
  verificationMethod?: DIDUrl;
}

export interface VCJwtSignInput {
  issuerDid: DIDString;
  keyRef: string;
  payload: Record;
  header?: Record;
}

export interface VCJwtSignResult {
  jwt: string;
}

export interface VCEip712SignInput {
  issuerDid: DIDString;
  keyRef: string;
  typedData: unknown;
}

export interface VCEip712SignResult {
  signature: string;
}
```



---



# 5\. VC Signer Service



业务层不接触私钥。这里定义签名适配层。



## `core/crypto/vc-signer.service.ts`



```TypeScript
import { KeyManagerService } from './key-manager.types';
import {
  VCJwtSignInput,
  VCJwtSignResult,
  VCEip712SignInput,
  VCEip712SignResult,
  VCSignInput,
  VCSignResult,
} from './vc-signing.types';

export interface VCSignerService {
  sign(input: VCSignInput): Promise;
  signJwt(input: VCJwtSignInput): Promise;
  signEip712(input: VCEip712SignInput): Promise;
}

export class DefaultVCSignerService implements VCSignerService {
  constructor(
    private readonly keyManager: KeyManagerService,
  ) {}

  async sign(input: VCSignInput): Promise {
    const signature = await this.keyManager.sign({
      keyRef: input.keyRef,
      data: input.payload,
      alg: input.alg,
      purpose: 'assertionMethod',
    });

    return {
      signature,
      signatureBase64Url: base64url(signature),
      verificationMethod: input.verificationMethod,
    };
  }

  async signJwt(input: VCJwtSignInput): Promise {
    throw new Error(
      'DefaultVCSignerService.signJwt requires JwtSignerAdapter implementation',
    );
  }

  async signEip712(input: VCEip712SignInput): Promise {
    throw new Error(
      'DefaultVCSignerService.signEip712 requires Eip712SignerAdapter implementation',
    );
  }
}

function base64url(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}
```



---



# 6\. JWT Signer Adapter



生产建议使用 `jose`。本章提供接口与可替换实现骨架。



## `core/crypto/jwt-signer.adapter.ts`



```TypeScript
import {
  VCJwtSignInput,
  VCJwtSignResult,
} from './vc-signing.types';
import { VCSignerService } from './vc-signer.service';
import { KeyManagerService } from './key-manager.types';

export class JwtSignerAdapter {
  constructor(
    private readonly keyManager: KeyManagerService,
  ) {}

  async sign(input: VCJwtSignInput): Promise {
    /**
     * 生产实现建议：
     * 1. 从 keyManager 获取 keyRef 对应 JWK/KMS key
     * 2. 使用 jose.SignJWT
     * 3. protectedHeader: typ=JWT, alg=EdDSA/ES256K, kid=verificationMethod
     *
     * 这里为了不让业务层接私钥，只给出签名边界。
     */
    throw new Error(
      'JwtSignerAdapter.sign must be implemented with jose + KMS/KeyManager',
    );
  }
}

export class VCJwtSignerService implements VCSignerService {
  constructor(
    private readonly base: VCSignerService,
    private readonly jwtSigner: JwtSignerAdapter,
  ) {}

  sign = this.base.sign.bind(this.base);

  async signJwt(input: VCJwtSignInput): Promise {
    return this.jwtSigner.sign(input);
  }

  async signEip712(): Promise {
    throw new Error('EIP712 signer not configured');
  }
}
```



---



# 7\. EIP\-712 Signer Adapter



用于 EVM 生态内可读 VC 签发。



## `core/crypto/eip712-signer.adapter.ts`



```TypeScript
import {
  VCEip712SignInput,
  VCEip712SignResult,
} from './vc-signing.types';
import { VCSignerService } from './vc-signer.service';

export interface Eip712SigningClient {
  signTypedData(input: {
    keyRef: string;
    typedData: unknown;
  }): Promise;
}

export class Eip712SignerAdapter {
  constructor(
    private readonly client: Eip712SigningClient,
  ) {}

  async sign(input: VCEip712SignInput): Promise {
    const signature = await this.client.signTypedData({
      keyRef: input.keyRef,
      typedData: input.typedData,
    });

    return {
      signature,
    };
  }
}

export class VCEip712SignerService implements VCSignerService {
  constructor(
    private readonly base: VCSignerService,
    private readonly eip712Signer: Eip712SignerAdapter,
  ) {}

  sign = this.base.sign.bind(this.base);

  async signJwt(): Promise {
    throw new Error('JWT signer not configured');
  }

  async signEip712(input: VCEip712SignInput): Promise {
    return this.eip712Signer.sign(input);
  }
}
```



---



# 8\. VC Hash Service



Hash 必须稳定，用于：



```Plain Text
审计
撤销
链上锚定
防篡改
```



## `core/vc/vc-hash.service.ts`



```TypeScript
import { AnchorHashService } from '../anchor/anchor-hash.service';
import { VerifiableCredential } from './vc.types';

export class VCHashService {
  constructor(
    private readonly hash = new AnchorHashService(),
  ) {}

  hashCredential(credential: VerifiableCredential): `0x${string}` {
    return this.hash.hashJson(stripProof(credential));
  }

  hashCredentialWithProof(credential: VerifiableCredential): `0x${string}` {
    return this.hash.hashJson(credential);
  }

  hashJwt(jwt: string): `0x${string}` {
    return this.hash.hashString(jwt);
  }

  hashEip712(input: unknown): `0x${string}` {
    return this.hash.hashJson(input);
  }
}

function stripProof(credential: VerifiableCredential): VerifiableCredential {
  const cloned = JSON.parse(JSON.stringify(credential));
  delete cloned.proof;
  return cloned;
}
```



---



# 9\. Credential Builder



## `core/vc/vc-credential-builder.service.ts`



```TypeScript
import {
  CredentialSchema,
  CredentialStatus,
  VerifiableCredential,
} from './vc.types';
import { DIDString } from '../did/did.types';
import { DomainCredentialType } from '../domain/did-domain-credential.types';

export class VCCredentialBuilderService {
  build(input: {
    credentialId: string;
    issuerDid: DIDString;
    subjectDid: DIDString;
    credentialType: DomainCredentialType;
    claims: Record;
    issuanceDate: string;
    expirationDate?: string;
    credentialSchema?: CredentialSchema;
    credentialStatus?: CredentialStatus;
    context?: string[];
  }): VerifiableCredential {
    return removeUndefined({
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        ...(input.context ?? []),
      ],
      id: input.credentialId,
      type: [
        'VerifiableCredential',
        `${input.credentialType}Credential`,
      ],
      issuer: input.issuerDid,
      issuanceDate: input.issuanceDate,
      expirationDate: input.expirationDate,
      credentialSubject: {
        id: input.subjectDid,
        ...input.claims,
      },
      credentialSchema: input.credentialSchema,
      credentialStatus: input.credentialStatus,
    });
  }
}

function removeUndefined(input: T): T {
  return JSON.parse(JSON.stringify(input));
}
```



---



# 10\. VC Template Service



模板用于五大业务域生成标准 VC。



## `core/vc/vc-template.service.ts`



```TypeScript
import { DIDBusinessDomain } from '../domain/did-domain.types';
import { DomainCredentialType } from '../domain/did-domain-credential.types';
import { VCCredentialBuilderService } from './vc-credential-builder.service';
import { VCTemplateInput, VCTemplateResult } from './vc-issue.types';
import { VCIssueErrors } from './vc-issue.errors';

export interface VCTemplate {
  domain: DIDBusinessDomain;
  credentialType: DomainCredentialType;
  build(input: VCTemplateInput): VCTemplateResult;
}

export class VCTemplateService {
  private readonly templates = new Map();

  register(template: VCTemplate) {
    this.templates.set(this.key(template.domain, template.credentialType), template);
  }

  build(input: {
    domain: DIDBusinessDomain;
    credentialType: DomainCredentialType;
    data: VCTemplateInput;
  }): VCTemplateResult {
    const template = this.templates.get(
      this.key(input.domain, input.credentialType),
    );

    if (!template) {
      throw VCIssueErrors.TEMPLATE_NOT_FOUND({
        domain: input.domain,
        credentialType: input.credentialType,
      });
    }

    return template.build(input.data);
  }

  private key(domain: DIDBusinessDomain, credentialType: DomainCredentialType) {
    return `${domain}:${credentialType}`;
  }
}

export abstract class BaseVCTemplate implements VCTemplate {
  abstract domain: DIDBusinessDomain;
  abstract credentialType: DomainCredentialType;

  protected builder = new VCCredentialBuilderService();

  abstract build(input: VCTemplateInput): VCTemplateResult;
}
```



---



# 11\. 交易所 VC 模板



## `core/vc/templates/exchange-vc-templates.ts`



```TypeScript
import { BaseVCTemplate } from '../vc-template.service';
import { VCTemplateInput, VCTemplateResult } from '../vc-issue.types';

export class ExchangeKYCLevelCredentialTemplate extends BaseVCTemplate {
  domain = 'exchange' as const;
  credentialType = 'ExchangeKYCLevel' as const;

  build(input: VCTemplateInput): VCTemplateResult {
    const claims = {
      domain: 'exchange',
      kycLevel: input.claims.kycLevel,
      verifiedAt: input.claims.verifiedAt,
      provider: input.claims.provider,
      countryCode: input.claims.countryCode,
      riskLevel: input.claims.riskLevel,
    };

    return {
      credential: this.builder.build({
        credentialId: input.credentialId ?? newCredentialId('exchange-kyc'),
        issuerDid: input.issuerDid,
        subjectDid: input.subjectDid,
        credentialType: this.credentialType,
        claims,
        issuanceDate: input.issuanceDate,
        expirationDate: input.expirationDate,
        credentialSchema: input.credentialSchema,
        credentialStatus: input.credentialStatus,
      }),
    };
  }
}

export class ExchangeWithdrawalPermissionCredentialTemplate extends BaseVCTemplate {
  domain = 'exchange' as const;
  credentialType = 'ExchangeWithdrawalPermission' as const;

  build(input: VCTemplateInput): VCTemplateResult {
    const claims = {
      domain: 'exchange',
      allowed: input.claims.allowed,
      limitDaily: input.claims.limitDaily,
      limitCurrency: input.claims.limitCurrency ?? 'USD',
      walletBindingRequired: true,
      issuedAt: input.claims.issuedAt,
    };

    return {
      credential: this.builder.build({
        credentialId: input.credentialId ?? newCredentialId('exchange-withdraw'),
        issuerDid: input.issuerDid,
        subjectDid: input.subjectDid,
        credentialType: this.credentialType,
        claims,
        issuanceDate: input.issuanceDate,
        expirationDate: input.expirationDate,
        credentialSchema: input.credentialSchema,
        credentialStatus: input.credentialStatus,
      }),
    };
  }
}

function newCredentialId(prefix: string): string {
  return `urn:vc:${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
}
```



---



# 12\. 跨境电商 VC 模板



## `core/vc/templates/commerce-vc-templates.ts`



```TypeScript
import { BaseVCTemplate } from '../vc-template.service';
import { VCTemplateInput, VCTemplateResult } from '../vc-issue.types';

export class CommerceMerchantKYBCredentialTemplate extends BaseVCTemplate {
  domain = 'cross_border_commerce' as const;
  credentialType = 'CommerceMerchantKYB' as const;

  build(input: VCTemplateInput): VCTemplateResult {
    const claims = {
      domain: 'cross_border_commerce',
      merchantId: input.claims.merchantId,
      kybLevel: input.claims.kybLevel,
      businessType: input.claims.businessType,
      verifiedAt: input.claims.verifiedAt,
      countryCode: input.claims.countryCode,
    };

    return {
      credential: this.builder.build({
        credentialId: input.credentialId ?? newCredentialId('commerce-merchant-kyb'),
        issuerDid: input.issuerDid,
        subjectDid: input.subjectDid,
        credentialType: this.credentialType,
        claims,
        issuanceDate: input.issuanceDate,
        expirationDate: input.expirationDate,
        credentialSchema: input.credentialSchema,
        credentialStatus: input.credentialStatus,
      }),
    };
  }
}

export class CommerceTaxIdentityCredentialTemplate extends BaseVCTemplate {
  domain = 'cross_border_commerce' as const;
  credentialType = 'CommerceTaxIdentity' as const;

  build(input: VCTemplateInput): VCTemplateResult {
    const claims = {
      domain: 'cross_border_commerce',
      taxResidency: input.claims.taxResidency,
      taxIdHash: input.claims.taxIdHash,
      verifiedAt: input.claims.verifiedAt,
    };

    return {
      credential: this.builder.build({
        credentialId: input.credentialId ?? newCredentialId('commerce-tax'),
        issuerDid: input.issuerDid,
        subjectDid: input.subjectDid,
        credentialType: this.credentialType,
        claims,
        issuanceDate: input.issuanceDate,
        expirationDate: input.expirationDate,
        credentialSchema: input.credentialSchema,
        credentialStatus: input.credentialStatus,
      }),
    };
  }
}

function newCredentialId(prefix: string): string {
  return `urn:vc:${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
}
```



---



# 13\. 博彩 VC 模板



## `core/vc/templates/gaming-vc-templates.ts`



```TypeScript
import { BaseVCTemplate } from '../vc-template.service';
import { VCTemplateInput, VCTemplateResult } from '../vc-issue.types';

export class GamingAgeOver18CredentialTemplate extends BaseVCTemplate {
  domain = 'gaming' as const;
  credentialType = 'GamingAgeOver18' as const;

  build(input: VCTemplateInput): VCTemplateResult {
    const claims = {
      domain: 'gaming',
      ageOver18: input.claims.ageOver18,
      verifiedAt: input.claims.verifiedAt,
      provider: input.claims.provider,
      jurisdiction: input.claims.jurisdiction,
    };

    return {
      credential: this.builder.build({
        credentialId: input.credentialId ?? newCredentialId('gaming-age18'),
        issuerDid: input.issuerDid,
        subjectDid: input.subjectDid,
        credentialType: this.credentialType,
        claims,
        issuanceDate: input.issuanceDate,
        expirationDate: input.expirationDate,
        credentialSchema: input.credentialSchema,
        credentialStatus: input.credentialStatus,
      }),
    };
  }
}

export class GamingGeoEligibilityCredentialTemplate extends BaseVCTemplate {
  domain = 'gaming' as const;
  credentialType = 'GamingGeoEligibility' as const;

  build(input: VCTemplateInput): VCTemplateResult {
    const claims = {
      domain: 'gaming',
      eligible: input.claims.eligible,
      jurisdiction: input.claims.jurisdiction,
      checkedAt: input.claims.checkedAt,
      countryCode: input.claims.countryCode,
    };

    return {
      credential: this.builder.build({
        credentialId: input.credentialId ?? newCredentialId('gaming-geo'),
        issuerDid: input.issuerDid,
        subjectDid: input.subjectDid,
        credentialType: this.credentialType,
        claims,
        issuanceDate: input.issuanceDate,
        expirationDate: input.expirationDate,
        credentialSchema: input.credentialSchema,
        credentialStatus: input.credentialStatus,
      }),
    };
  }
}

function newCredentialId(prefix: string): string {
  return `urn:vc:${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
}
```



---



# 14\. 金融 VC 模板



## `core/vc/templates/financial-vc-templates.ts`



```TypeScript
import { BaseVCTemplate } from '../vc-template.service';
import { VCTemplateInput, VCTemplateResult } from '../vc-issue.types';

export class FinancialKYCLevelCredentialTemplate extends BaseVCTemplate {
  domain = 'financial' as const;
  credentialType = 'FinancialKYCLevel' as const;

  build(input: VCTemplateInput): VCTemplateResult {
    const claims = {
      domain: 'financial',
      kycLevel: input.claims.kycLevel,
      verifiedAt: input.claims.verifiedAt,
      provider: input.claims.provider,
      jurisdiction: input.claims.jurisdiction,
    };

    return {
      credential: this.builder.build({
        credentialId: input.credentialId ?? newCredentialId('financial-kyc'),
        issuerDid: input.issuerDid,
        subjectDid: input.subjectDid,
        credentialType: this.credentialType,
        claims,
        issuanceDate: input.issuanceDate,
        expirationDate: input.expirationDate,
        credentialSchema: input.credentialSchema,
        credentialStatus: input.credentialStatus,
      }),
    };
  }
}

export class FinancialAccreditedInvestorCredentialTemplate extends BaseVCTemplate {
  domain = 'financial' as const;
  credentialType = 'FinancialAccreditedInvestor' as const;

  build(input: VCTemplateInput): VCTemplateResult {
    const claims = {
      domain: 'financial',
      accredited: input.claims.accredited,
      jurisdiction: input.claims.jurisdiction,
      verifiedAt: input.claims.verifiedAt,
      basis: input.claims.basis,
    };

    return {
      credential: this.builder.build({
        credentialId: input.credentialId ?? newCredentialId('financial-accredited'),
        issuerDid: input.issuerDid,
        subjectDid: input.subjectDid,
        credentialType: this.credentialType,
        claims,
        issuanceDate: input.issuanceDate,
        expirationDate: input.expirationDate,
        credentialSchema: input.credentialSchema,
        credentialStatus: input.credentialStatus,
      }),
    };
  }
}

function newCredentialId(prefix: string): string {
  return `urn:vc:${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
}
```



---



# 15\. 萨摩亚企业家 VC 模板



## `core/vc/templates/samoa-enterprise-vc-templates.ts`



```TypeScript
import { BaseVCTemplate } from '../vc-template.service';
import { VCTemplateInput, VCTemplateResult } from '../vc-issue.types';

export class SamoaEntrepreneurIdentityCredentialTemplate extends BaseVCTemplate {
  domain = 'samoa_enterprise' as const;
  credentialType = 'SamoaEntrepreneurIdentity' as const;

  build(input: VCTemplateInput): VCTemplateResult {
    const claims = {
      domain: 'samoa_enterprise',
      kycLevel: input.claims.kycLevel,
      identityVerified: input.claims.identityVerified,
      nationality: input.claims.nationality,
      countryOfResidence: input.claims.countryOfResidence,
      eligibleToFormCompany: input.claims.eligibleToFormCompany,
      verifiedAt: input.claims.verifiedAt,
    };

    return {
      credential: this.builder.build({
        credentialId: input.credentialId ?? newCredentialId('samoa-entrepreneur'),
        issuerDid: input.issuerDid,
        subjectDid: input.subjectDid,
        credentialType: this.credentialType,
        claims,
        issuanceDate: input.issuanceDate,
        expirationDate: input.expirationDate,
        credentialSchema: input.credentialSchema,
        credentialStatus: input.credentialStatus,
      }),
    };
  }
}

export class SamoaCompanyFormationApplicationCredentialTemplate extends BaseVCTemplate {
  domain = 'samoa_enterprise' as const;
  credentialType = 'SamoaCompanyFormationApplication' as const;

  build(input: VCTemplateInput): VCTemplateResult {
    const claims = {
      domain: 'samoa_enterprise',
      applicationId: input.claims.applicationId,
      companyType: input.claims.companyType,
      founderDid: input.claims.founderDid,
      applicationHash: input.claims.applicationHash,
      submittedAt: input.claims.submittedAt,
    };

    return {
      credential: this.builder.build({
        credentialId: input.credentialId ?? newCredentialId('samoa-formation-app'),
        issuerDid: input.issuerDid,
        subjectDid: input.subjectDid,
        credentialType: this.credentialType,
        claims,
        issuanceDate: input.issuanceDate,
        expirationDate: input.expirationDate,
        credentialSchema: input.credentialSchema,
        credentialStatus: input.credentialStatus,
      }),
    };
  }
}

export class SamoaCompanyIncorporationCertificateCredentialTemplate extends BaseVCTemplate {
  domain = 'samoa_enterprise' as const;
  credentialType = 'SamoaCompanyIncorporationCertificate' as const;

  build(input: VCTemplateInput): VCTemplateResult {
    const claims = {
      domain: 'samoa_enterprise',
      companyNumber: input.claims.companyNumber,
      companyNameHash: input.claims.companyNameHash,
      incorporationDate: input.claims.incorporationDate,
      companyType: input.claims.companyType,
      jurisdiction: 'WS',
    };

    return {
      credential: this.builder.build({
        credentialId: input.credentialId ?? newCredentialId('samoa-incorporation'),
        issuerDid: input.issuerDid,
        subjectDid: input.subjectDid,
        credentialType: this.credentialType,
        claims,
        issuanceDate: input.issuanceDate,
        expirationDate: input.expirationDate,
        credentialSchema: input.credentialSchema,
        credentialStatus: input.credentialStatus,
      }),
    };
  }
}

export class SamoaUBODeclarationCredentialTemplate extends BaseVCTemplate {
  domain = 'samoa_enterprise' as const;
  credentialType = 'SamoaUBODeclaration' as const;

  build(input: VCTemplateInput): VCTemplateResult {
    const claims = {
      domain: 'samoa_enterprise',
      uboDid: input.claims.uboDid,
      controlType: input.claims.controlType,
      ownershipPercentageBucket: input.claims.ownershipPercentageBucket,
      declarationDate: input.claims.declarationDate,
      declarationHash: input.claims.declarationHash,
    };

    return {
      credential: this.builder.build({
        credentialId: input.credentialId ?? newCredentialId('samoa-ubo'),
        issuerDid: input.issuerDid,
        subjectDid: input.subjectDid,
        credentialType: this.credentialType,
        claims,
        issuanceDate: input.issuanceDate,
        expirationDate: input.expirationDate,
        credentialSchema: input.credentialSchema,
        credentialStatus: input.credentialStatus,
      }),
    };
  }
}

function newCredentialId(prefix: string): string {
  return `urn:vc:${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
}
```



---



# 16\. 注册默认 VC 模板



## `core/vc/register-default-vc-templates.service.ts`



```TypeScript
import { VCTemplateService } from './vc-template.service';
import {
  ExchangeKYCLevelCredentialTemplate,
  ExchangeWithdrawalPermissionCredentialTemplate,
} from './templates/exchange-vc-templates';
import {
  CommerceMerchantKYBCredentialTemplate,
  CommerceTaxIdentityCredentialTemplate,
} from './templates/commerce-vc-templates';
import {
  GamingAgeOver18CredentialTemplate,
  GamingGeoEligibilityCredentialTemplate,
} from './templates/gaming-vc-templates';
import {
  FinancialAccreditedInvestorCredentialTemplate,
  FinancialKYCLevelCredentialTemplate,
} from './templates/financial-vc-templates';
import {
  SamoaCompanyFormationApplicationCredentialTemplate,
  SamoaCompanyIncorporationCertificateCredentialTemplate,
  SamoaEntrepreneurIdentityCredentialTemplate,
  SamoaUBODeclarationCredentialTemplate,
} from './templates/samoa-enterprise-vc-templates';

export class DefaultVCTemplateRegistrationService {
  constructor(
    private readonly templates: VCTemplateService,
  ) {}

  registerAll() {
    [
      new ExchangeKYCLevelCredentialTemplate(),
      new ExchangeWithdrawalPermissionCredentialTemplate(),

      new CommerceMerchantKYBCredentialTemplate(),
      new CommerceTaxIdentityCredentialTemplate(),

      new GamingAgeOver18CredentialTemplate(),
      new GamingGeoEligibilityCredentialTemplate(),

      new FinancialKYCLevelCredentialTemplate(),
      new FinancialAccreditedInvestorCredentialTemplate(),

      new SamoaEntrepreneurIdentityCredentialTemplate(),
      new SamoaCompanyFormationApplicationCredentialTemplate(),
      new SamoaCompanyIncorporationCertificateCredentialTemplate(),
      new SamoaUBODeclarationCredentialTemplate(),
    ].forEach((template) => this.templates.register(template));
  }
}
```



---



# 17\. JSON\-LD VC Service



Data Integrity Proof 版本。这里实现基础 `JsonWebSignature2020` 风格骨架。



## `core/vc/vc-jsonld.service.ts`



```TypeScript
import { DIDUrl } from '../did/did.types';
import { VCSignerService } from '../crypto/vc-signer.service';
import { VerifiableCredential } from './vc.types';
import { stableStringify } from '../anchor/anchor-hash.service';

export class VCJsonLdService {
  constructor(
    private readonly signer: VCSignerService,
  ) {}

  async sign(input: {
    credential: VerifiableCredential;
    issuerDid: string;
    keyRef: string;
    verificationMethod: DIDUrl;
  }): Promise {
    const unsigned = JSON.parse(JSON.stringify(input.credential));
    delete unsigned.proof;

    const payload = new TextEncoder().encode(stableStringify(unsigned));

    const signature = await this.signer.sign({
      issuerDid: input.issuerDid as any,
      keyRef: input.keyRef,
      verificationMethod: input.verificationMethod,
      payload,
      alg: 'EdDSA',
    });

    return {
      ...unsigned,
      proof: {
        type: 'JsonWebSignature2020',
        created: new Date().toISOString(),
        verificationMethod: input.verificationMethod,
        proofPurpose: 'assertionMethod',
        jws: signature.signatureBase64Url,
      },
    };
  }
}
```



---



# 18\. JWT VC Service



JWT VC Payload 按 W3C VC JWT 常用结构：



```JSON
{
  "iss": "did:web:issuer",
  "sub": "did:key:holder",
  "nbf": 1710000000,
  "exp": 1740000000,
  "jti": "urn:vc:...",
  "vc": { ... }
}
```



## `core/vc/vc-jwt.service.ts`



```TypeScript
import { VCSignerService } from '../crypto/vc-signer.service';
import { VerifiableCredential } from './vc.types';

export class VCJwtService {
  constructor(
    private readonly signer: VCSignerService,
  ) {}

  async sign(input: {
    credential: VerifiableCredential;
    issuerDid: string;
    subjectDid: string;
    keyRef: string;
    audience?: string;
  }): Promise {
    const issuanceTime = Math.floor(
      new Date(input.credential.issuanceDate).getTime() / 1000,
    );

    const expirationTime = input.credential.expirationDate
      ? Math.floor(new Date(input.credential.expirationDate).getTime() / 1000)
      : undefined;

    const payload = removeUndefined({
      iss: input.issuerDid,
      sub: input.subjectDid,
      nbf: issuanceTime,
      exp: expirationTime,
      jti: input.credential.id,
      aud: input.audience,
      vc: input.credential,
    });

    const result = await this.signer.signJwt({
      issuerDid: input.issuerDid as any,
      keyRef: input.keyRef,
      payload,
      header: {
        typ: 'JWT',
        cty: 'vc+json',
      },
    });

    return result.jwt;
  }
}

function removeUndefined(input: T): T {
  return JSON.parse(JSON.stringify(input));
}
```



---



# 19\. EIP\-712 VC Service



EIP\-712 适合 EVM 场景，优点是钱包可读签名结构。



## `core/vc/vc-eip712.service.ts`



```TypeScript
import { VCSignerService } from '../crypto/vc-signer.service';
import { VerifiableCredential } from './vc.types';

export class VCEip712Service {
  constructor(
    private readonly signer: VCSignerService,
  ) {}

  buildTypedData(input: {
    issuerDid: string;
    credential: VerifiableCredential;
    chainId?: number;
    verifyingContract?: string;
  }) {
    return {
      domain: {
        name: 'VerifiableCredential',
        version: '1',
        chainId: input.chainId ?? 1,
        verifyingContract:
          input.verifyingContract ??
          '0x0000000000000000000000000000000000000000',
      },
      primaryType: 'Credential',
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Credential: [
          { name: 'id', type: 'string' },
          { name: 'issuer', type: 'string' },
          { name: 'subject', type: 'string' },
          { name: 'credentialType', type: 'string' },
          { name: 'issuanceDate', type: 'string' },
          { name: 'expirationDate', type: 'string' },
          { name: 'claimsHash', type: 'bytes32' },
        ],
      },
      message: {
        id: input.credential.id ?? '',
        issuer:
          typeof input.credential.issuer === 'string'
            ? input.credential.issuer
            : input.credential.issuer.id,
        subject: Array.isArray(input.credential.credentialSubject)
          ? String(input.credential.credentialSubject[0]?.id ?? '')
          : String(input.credential.credentialSubject.id ?? ''),
        credentialType: input.credential.type.join(','),
        issuanceDate: input.credential.issuanceDate,
        expirationDate: input.credential.expirationDate ?? '',
        claimsHash: claimsHashPlaceholder(),
      },
    };
  }

  async sign(input: {
    issuerDid: string;
    keyRef: string;
    credential: VerifiableCredential;
    chainId?: number;
    verifyingContract?: string;
  }) {
    const typedData = this.buildTypedData(input);

    const result = await this.signer.signEip712({
      issuerDid: input.issuerDid as any,
      keyRef: input.keyRef,
      typedData,
    });

    return {
      typedData,
      signature: result.signature,
    };
  }
}

function claimsHashPlaceholder(): `0x${string}` {
  /**
   * 真实实现应使用 VCHashService 对 credentialSubject 做 stable hash。
   */
  return '0x0000000000000000000000000000000000000000000000000000000000000000';
}
```



---



# 20\. VC Issue Audit



## `core/vc/vc-issue-audit.service.ts`



```TypeScript
export interface VCIssueAuditRecord {
  auditNo: string;

  action:
    | 'vc.issue.requested'
    | 'vc.issue.schema_validated'
    | 'vc.issue.issuer_checked'
    | 'vc.issue.signed'
    | 'vc.issue.failed'
    | 'vc.issue.anchored';

  result: 'success' | 'failed' | 'denied';

  domain?: string;
  credentialType?: string;
  issuerDid?: string;
  subjectDid?: string;
  credentialId?: string;
  credentialHash?: string;
  format?: string;

  metadata?: unknown;
  error?: unknown;

  createdAt: number;
}

export interface VCIssueAuditSink {
  record(record: VCIssueAuditRecord): Promise;
}

export class ConsoleVCIssueAuditSink implements VCIssueAuditSink {
  async record(record: VCIssueAuditRecord): Promise {
    console.log('[VCIssueAudit]', record);
  }
}

export class VCIssueAuditService {
  constructor(
    private readonly sink: VCIssueAuditSink = new ConsoleVCIssueAuditSink(),
  ) {}

  async success(
    action: VCIssueAuditRecord['action'],
    input: Omit,
  ) {
    await this.record(action, 'success', input);
  }

  async failed(
    action: VCIssueAuditRecord['action'],
    input: Omit,
  ) {
    await this.record(action, 'failed', input);
  }

  async denied(
    action: VCIssueAuditRecord['action'],
    input: Omit,
  ) {
    await this.record(action, 'denied', input);
  }

  private async record(
    action: VCIssueAuditRecord['action'],
    result: VCIssueAuditRecord['result'],
    input: Omit,
  ) {
    await this.sink.record({
      auditNo: `VCIAUD-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`,
      action,
      result,
      ...input,
      createdAt: Date.now(),
    });
  }
}
```



---



# 21\. VC Issue Pipeline



## `core/vc/vc-issue-pipeline.service.ts`



```TypeScript
import { IssuerPermissionService } from '../issuer/issuer-permission.service';
import { DomainSchemaPolicyService } from '../schema/domain-schema-policy.service';
import { SchemaValidationService } from '../schema/schema-validation.service';
import { VCTemplateService } from './vc-template.service';
import { VCHashService } from './vc-hash.service';
import { VCIssueAuditService } from './vc-issue-audit.service';
import {
  VCIssuePipelineInput,
  VCIssuePipelinePrepared,
} from './vc-issue.types';
import { CredentialSchema } from './vc.types';
import { VCIssueErrors } from './vc-issue.errors';

export class VCIssuePipelineService {
  constructor(
    private readonly issuerPermission: IssuerPermissionService,
    private readonly schemaPolicy: DomainSchemaPolicyService,
    private readonly schemaValidation: SchemaValidationService,
    private readonly templates: VCTemplateService,
    private readonly hash: VCHashService,
    private readonly audit: VCIssueAuditService,
  ) {}

  async prepare(
    input: VCIssuePipelineInput,
  ): Promise {
    const { context, claims } = input;

    if (!context.issuerDid) {
      throw VCIssueErrors.ISSUER_DID_REQUIRED();
    }

    if (!context.subjectDid) {
      throw VCIssueErrors.SUBJECT_DID_REQUIRED();
    }

    await this.audit.success('vc.issue.requested', {
      domain: context.domain,
      credentialType: context.credentialType,
      issuerDid: context.issuerDid,
      subjectDid: context.subjectDid,
      format: context.format,
      metadata: {
        requestId: context.requestId,
      },
    });

    const schemaRecord = await this.schemaPolicy.resolveSchema({
      domain: context.domain,
      credentialType: context.credentialType,
      schemaId: context.schemaId,
    });

    this.schemaValidation.assertClaims({
      schema: schemaRecord,
      claims,
    });

    await this.audit.success('vc.issue.schema_validated', {
      domain: context.domain,
      credentialType: context.credentialType,
      issuerDid: context.issuerDid,
      subjectDid: context.subjectDid,
      metadata: {
        schemaId: schemaRecord.schemaId,
        schemaHash: schemaRecord.hash,
      },
    });

    await this.issuerPermission.assertCanIssue({
      issuerDid: context.issuerDid,
      domain: context.domain,
      credentialType: context.credentialType,
      schemaId: schemaRecord.schemaId,
    });

    await this.audit.success('vc.issue.issuer_checked', {
      domain: context.domain,
      credentialType: context.credentialType,
      issuerDid: context.issuerDid,
      subjectDid: context.subjectDid,
      metadata: {
        schemaId: schemaRecord.schemaId,
      },
    });

    const issuanceDate =
      context.issuanceDate ?? new Date().toISOString();

    const credentialSchema: CredentialSchema = {
      id: schemaRecord.schemaId,
      type: 'JsonSchema',
      digestSRI: schemaRecord.hash,
    };

    const credential = this.templates.build({
      domain: context.domain,
      credentialType: context.credentialType,
      data: {
        issuerDid: context.issuerDid,
        subjectDid: context.subjectDid,
        claims,
        issuanceDate,
        expirationDate: context.expirationDate,
        credentialSchema,
        credentialStatus: context.status,
      },
    }).credential;

    const credentialHash = this.hash.hashCredential(credential);

    return {
      context,
      schema: credentialSchema,
      credential,
      credentialHash,
    };
  }
}
```



---



# 22\. VC Issuer Service



统一签发入口。



## `core/vc/vc-issuer.service.ts`



```TypeScript
import { VCJsonLdService } from './vc-jsonld.service';
import { VCJwtService } from './vc-jwt.service';
import { VCEip712Service } from './vc-eip712.service';
import { VCHashService } from './vc-hash.service';
import { VCIssueAuditService } from './vc-issue-audit.service';
import { VCIssuePipelineService } from './vc-issue-pipeline.service';
import {
  VCIssuePipelineInput,
  VCIssuePipelineResult,
} from './vc-issue.types';
import { VCIssueErrors } from './vc-issue.errors';

export interface VCAnchorAdapter {
  anchorCredential(input: {
    domain: string;
    credentialType: string;
    issuerDid: string;
    subjectDid: string;
    credentialHash: string;
    schemaHash?: string;
    credential: unknown;
  }): Promise;
}

export class VCIssuerService {
  constructor(
    private readonly pipeline: VCIssuePipelineService,
    private readonly jsonLd: VCJsonLdService,
    private readonly jwt: VCJwtService,
    private readonly eip712: VCEip712Service,
    private readonly hash: VCHashService,
    private readonly audit: VCIssueAuditService,
    private readonly anchor?: VCAnchorAdapter,
  ) {}

  async issue(input: VCIssuePipelineInput): Promise {
    try {
      const prepared = await this.pipeline.prepare(input);
      const { context, credential } = prepared;

      let result: VCIssuePipelineResult;

      if (context.format === 'jsonld_vc') {
        const signed = await this.jsonLd.sign({
          credential,
          issuerDid: context.issuerDid,
          keyRef: context.issuerKeyRef,
          verificationMethod:
            context.issuerKeyId ??
            `${context.issuerDid}#key-1` as any,
        });

        result = {
          credentialId: credential.id!,
          format: context.format,
          credential: signed,
          credentialHash: this.hash.hashCredentialWithProof(signed),
          issuedAt: Date.now(),
        };
      } else if (context.format === 'jwt_vc') {
        const jwt = await this.jwt.sign({
          credential,
          issuerDid: context.issuerDid,
          subjectDid: context.subjectDid,
          keyRef: context.issuerKeyRef,
          audience: context.audience,
        });

        result = {
          credentialId: credential.id!,
          format: context.format,
          jwt,
          credentialHash: this.hash.hashJwt(jwt),
          issuedAt: Date.now(),
        };
      } else if (context.format === 'eip712_vc') {
        const eip712 = await this.eip712.sign({
          issuerDid: context.issuerDid,
          keyRef: context.issuerKeyRef,
          credential,
        });

        result = {
          credentialId: credential.id!,
          format: context.format,
          credential,
          eip712,
          credentialHash: this.hash.hashEip712(eip712.typedData),
          issuedAt: Date.now(),
        };
      } else {
        throw VCIssueErrors.UNSUPPORTED_FORMAT(context.format);
      }

      await this.audit.success('vc.issue.signed', {
        domain: context.domain,
        credentialType: context.credentialType,
        issuerDid: context.issuerDid,
        subjectDid: context.subjectDid,
        credentialId: result.credentialId,
        credentialHash: result.credentialHash,
        format: context.format,
      });

      if (context.anchorOnChain && this.anchor) {
        const anchor = await this.anchor.anchorCredential({
          domain: context.domain,
          credentialType: context.credentialType,
          issuerDid: context.issuerDid,
          subjectDid: context.subjectDid,
          credentialHash: result.credentialHash,
          schemaHash: prepared.schema.digestSRI,
          credential: result.credential ?? result.jwt ?? result.eip712,
        });

        result.anchor = anchor;

        await this.audit.success('vc.issue.anchored', {
          domain: context.domain,
          credentialType: context.credentialType,
          issuerDid: context.issuerDid,
          subjectDid: context.subjectDid,
          credentialId: result.credentialId,
          credentialHash: result.credentialHash,
          metadata: anchor,
        });
      }

      return result;
    } catch (error) {
      await this.audit.failed('vc.issue.failed', {
        domain: input.context.domain,
        credentialType: input.context.credentialType,
        issuerDid: input.context.issuerDid,
        subjectDid: input.context.subjectDid,
        format: input.context.format,
        error,
      });

      throw error;
    }
  }
}
```



---



# 23\. VC Issue Runtime



## `core/vc/create-vc-issue-runtime.ts`



```TypeScript
import { IssuerPermissionService } from '../issuer/issuer-permission.service';
import { DomainSchemaPolicyService } from '../schema/domain-schema-policy.service';
import { SchemaValidationService } from '../schema/schema-validation.service';
import { VCSignerService } from '../crypto/vc-signer.service';

import { VCTemplateService } from './vc-template.service';
import { DefaultVCTemplateRegistrationService } from './register-default-vc-templates.service';
import { VCHashService } from './vc-hash.service';
import { VCJsonLdService } from './vc-jsonld.service';
import { VCJwtService } from './vc-jwt.service';
import { VCEip712Service } from './vc-eip712.service';
import { VCIssueAuditService } from './vc-issue-audit.service';
import { VCIssuePipelineService } from './vc-issue-pipeline.service';
import { VCIssuerService, VCAnchorAdapter } from './vc-issuer.service';

export function createVCIssueRuntime(input: {
  issuerPermission: IssuerPermissionService;
  schemaPolicy: DomainSchemaPolicyService;
  schemaValidation: SchemaValidationService;
  signer: VCSignerService;
  anchor?: VCAnchorAdapter;
}) {
  const templates = new VCTemplateService();
  const defaultTemplates = new DefaultVCTemplateRegistrationService(templates);
  defaultTemplates.registerAll();

  const hash = new VCHashService();

  const audit = new VCIssueAuditService();

  const jsonLd = new VCJsonLdService(input.signer);
  const jwt = new VCJwtService(input.signer);
  const eip712 = new VCEip712Service(input.signer);

  const pipeline = new VCIssuePipelineService(
    input.issuerPermission,
    input.schemaPolicy,
    input.schemaValidation,
    templates,
    hash,
    audit,
  );

  const issuer = new VCIssuerService(
    pipeline,
    jsonLd,
    jwt,
    eip712,
    hash,
    audit,
    input.anchor,
  );

  return {
    templates,
    defaultTemplates,
    hash,
    audit,
    jsonLd,
    jwt,
    eip712,
    pipeline,
    issuer,
  };
}
```



---



# 24\. 签发交易所 KYC VC 示例



```TypeScript
const result = await vcRuntime.issuer.issue({
  context: {
    domain: 'exchange',
    issuerDid: 'did:web:identity.exchange.example',
    issuerKeyRef: 'kms:exchange-issuer-key-1',
    subjectDid: 'did:pkh:eip155:1:0x1234567890abcdef1234567890abcdef12345678',
    credentialType: 'ExchangeKYCLevel',
    schemaId: 'schema:exchange:kyc-level:v1',
    format: 'jsonld_vc',
    expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    anchorOnChain: true,
  },
  claims: {
    kycLevel: 2,
    verifiedAt: new Date().toISOString(),
    provider: 'ExchangeKYCProvider',
    countryCode: 'SG',
    riskLevel: 'low',
  },
});
```



---



# 25\. 签发博彩年龄证明 VC 示例



```TypeScript
const result = await vcRuntime.issuer.issue({
  context: {
    domain: 'gaming',
    issuerDid: 'did:web:compliance.gaming.example',
    issuerKeyRef: 'kms:gaming-compliance-key-1',
    subjectDid: 'did:key:z...',
    credentialType: 'GamingAgeOver18',
    schemaId: 'schema:gaming:age-over-18:v1',
    format: 'jwt_vc',
    expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  },
  claims: {
    ageOver18: true,
    verifiedAt: new Date().toISOString(),
    provider: 'AgeVerificationProvider',
    jurisdiction: 'GB',
  },
});
```



---



# 26\. 签发金融合格投资者 VC 示例



```TypeScript
const result = await vcRuntime.issuer.issue({
  context: {
    domain: 'financial',
    issuerDid: 'did:web:identity.financial.example',
    issuerKeyRef: 'kms:financial-issuer-key-1',
    subjectDid: 'did:key:z...',
    credentialType: 'FinancialAccreditedInvestor',
    schemaId: 'schema:financial:accredited-investor:v1',
    format: 'jsonld_vc',
  },
  claims: {
    accredited: true,
    jurisdiction: 'AE',
    verifiedAt: new Date().toISOString(),
    basis: 'asset_threshold',
  },
});
```



---



# 27\. 签发跨境电商商户 KYB VC 示例



```TypeScript
const result = await vcRuntime.issuer.issue({
  context: {
    domain: 'cross_border_commerce',
    issuerDid: 'did:web:merchant-id.commerce.example',
    issuerKeyRef: 'kms:commerce-issuer-key-1',
    subjectDid: 'did:key:z...',
    credentialType: 'CommerceMerchantKYB',
    schemaId: 'schema:commerce:merchant-kyb:v1',
    format: 'jsonld_vc',
  },
  claims: {
    merchantId: 'merchant-10001',
    kybLevel: 2,
    businessType: 'cross_border_seller',
    verifiedAt: new Date().toISOString(),
    countryCode: 'US',
  },
});
```



---



# 28\. 签发萨摩亚企业家身份 VC 示例



```TypeScript
const result = await vcRuntime.issuer.issue({
  context: {
    domain: 'samoa_enterprise',
    issuerDid: 'did:web:identity.samoa.example',
    issuerKeyRef: 'kms:samoa-official-key-1',
    subjectDid: 'did:key:z...',
    credentialType: 'SamoaEntrepreneurIdentity',
    schemaId: 'schema:samoa:entrepreneur-identity:v1',
    format: 'jsonld_vc',
    expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    anchorOnChain: true,
  },
  claims: {
    kycLevel: 2,
    identityVerified: true,
    nationality: 'WS',
    countryOfResidence: 'SG',
    eligibleToFormCompany: true,
    verifiedAt: new Date().toISOString(),
  },
});
```



---



# 29\. 签发萨摩亚公司注册证书 VC 示例



```TypeScript
const result = await vcRuntime.issuer.issue({
  context: {
    domain: 'samoa_enterprise',
    issuerDid: 'did:web:identity.samoa.example',
    issuerKeyRef: 'kms:samoa-official-key-1',
    subjectDid: 'did:key:z-company-controller',
    credentialType: 'SamoaCompanyIncorporationCertificate',
    schemaId: 'schema:samoa:incorporation-certificate:v1',
    format: 'jsonld_vc',
    anchorOnChain: true,
  },
  claims: {
    companyNumber: 'WS-IC-2026-000001',
    companyNameHash: '0x...',
    incorporationDate: new Date().toISOString(),
    companyType: 'international_company',
  },
});
```



---



# 30\. 签发前强制安全规则



所有 VC 签发必须遵守：



```Plain Text
1. issuerDid 必须存在
2. issuer 必须 active
3. issuer 必须被授权到 domain
4. issuer 必须被授权到 credentialType
5. issuer 必须被授权到 schemaId
6. schema 必须 active
7. claims 必须满足 schema.requiredClaims
8. credentialSubject.id 必须是 DID
9. 高隐私 claims 必须 hash / bucket / selective disclosure
10. 可撤销凭证必须带 credentialStatus
11. 高价值 VC 必须审计
12. 萨摩亚公司证书类 VC 必须可选链上锚定
13. 博彩年龄类 VC 不得暴露出生日期
14. 金融资产类 VC 不得暴露资产明细
15. 交易所 AML / Sanctions VC 不得暴露筛查明细
```



---



# 31\. 本章完成内容



本章完成：



```Plain Text
VC Issue 类型
VC Issue 错误体系
VC Signing 接口
JWT Signer Adapter 边界
EIP-712 Signer Adapter 边界
VC Hash Service
Credential Builder
VC Template Service
五大业务域 VC 模板
交易所 KYC / 提现权限 VC
跨境电商 Merchant KYB / Tax VC
博彩 Age / Geo VC
金融 KYC / Accredited Investor VC
萨摩亚 Entrepreneur / Formation / Incorporation / UBO VC
JSON-LD VC 签发
JWT VC 签发
EIP-712 VC 签发
VC Issue Pipeline
VC Issuer Service
签发审计
可选链上锚定入口
```



现在 DID 系统已经具备完整 VC 签发流水线：



```Plain Text
Issuer Permission
  -> Schema Resolve
  -> Claims Validation
  -> Template Build
  -> Credential Hash
  -> Sign JSON-LD / JWT / EIP-712
  -> Audit
  -> Optional Anchor
```



---



# 32\. 下一章继续



下一章：



# 《DID 身份 Part 6：VC 验证：签名、过期、撤销、Schema、Issuer Trust、链上锚定》



将覆盖：



```Plain Text
VC Verify Pipeline
JWT VC 验证
JSON-LD VC 验证
EIP-712 VC 验证
Issuer Trust 校验
Schema 校验
expirationDate / issuanceDate 校验
credentialStatus 校验
StatusList2021
On-chain Revocation
Anchor Hash 校验
Holder Binding 校验
五大业务域验证规则
萨摩亚公司证书验证
金融合格投资者验证
博彩年龄证明验证
交易所 KYC 验证
跨境电商 KYB 验证
```



