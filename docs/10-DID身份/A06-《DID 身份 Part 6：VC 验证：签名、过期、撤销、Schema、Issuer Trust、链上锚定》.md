# A06\-《DID 身份 Part 6：VC 验证：签名、过期、撤销、Schema、Issuer Trust、链上锚定》

# 《DID 身份 Part 6：VC 验证：签名、过期、撤销、Schema、Issuer Trust、链上锚定》



本章实现 DID 身份系统的 **VC 验证核心流水线**，覆盖：



- VC Verify Pipeline

- JWT VC 验证

- JSON\-LD VC 验证

- EIP\-712 VC 验证

- Issuer Trust 校验

- Schema 校验

- `expirationDate` / `issuanceDate` 校验

- `credentialStatus` 校验

- StatusList2021

- On\-chain Revocation

- Anchor Hash 校验

- Holder Binding 校验

- 五大业务域验证规则

- 萨摩亚公司证书验证

- 金融合格投资者验证

- 博彩年龄证明验证

- 交易所 KYC 验证

- 跨境电商 KYB 验证

    

核心原则：



```Plain Text
VC 验证不能只验签。
必须同时验证：
格式、签名、Issuer 信任、Schema、时间、撤销状态、Holder 绑定、链上锚定、业务域策略。
```



---



# 1\. 验证总流程



完整验证顺序：



```Plain Text
1. Parse Credential
2. Detect Format
3. Validate Basic VC Structure
4. Extract Issuer / Subject / Type / Schema / Status
5. Resolve Issuer DID Document
6. Verify Signature / Proof / JWT / EIP-712
7. Check Issuer Trust Registry
8. Check Schema Registry
9. Validate Claims Against Schema
10. Check issuanceDate / expirationDate
11. Check credentialStatus / Revocation
12. Check On-chain Anchor
13. Check Holder Binding
14. Apply Domain Verification Policy
15. Return Verification Result
```



---



# 2\. 本章目录



```Bash
src/modules/did/
  core/
    vc-verify/
      vc-verify.types.ts
      vc-verify.errors.ts
      vc-parser.service.ts
      vc-basic-validator.service.ts
      vc-time-validator.service.ts
      vc-proof-verifier.service.ts
      vc-jwt-verifier.service.ts
      vc-jsonld-verifier.service.ts
      vc-eip712-verifier.service.ts
      vc-status-verifier.service.ts
      vc-anchor-verifier.service.ts
      vc-holder-binding-verifier.service.ts
      vc-domain-policy-verifier.service.ts
      vc-verify-pipeline.service.ts
      vc-verify-audit.service.ts

    revocation/
      credential-status.types.ts
      status-list2021.service.ts
      onchain-revocation.service.ts
      revocation-registry.repository.ts

    anchor/
      vc-anchor-verifier.service.ts
```



---



# 3\. VC Verify 类型



## `core/vc-verify/vc-verify.types.ts`



```TypeScript
import { DIDString } from '../did/did.types';
import { DIDBusinessDomain } from '../domain/did-domain.types';
import { DomainCredentialType } from '../domain/did-domain-credential.types';
import {
  VCFormat,
  VerifiableCredential,
} from '../vc/vc.types';

export interface VCVerifyContext {
  requestId?: string;

  domain?: DIDBusinessDomain;
  credentialType?: DomainCredentialType;

  expectedIssuerDid?: DIDString;
  expectedSubjectDid?: DIDString;

  expectedAudience?: string;
  challenge?: string;
  domainBinding?: string;

  verifySignature?: boolean;
  verifyIssuerTrust?: boolean;
  verifySchema?: boolean;
  verifyStatus?: boolean;
  verifyAnchor?: boolean;
  verifyHolderBinding?: boolean;
  verifyDomainPolicy?: boolean;

  now?: number;

  metadata?: Record;
}

export interface VCVerifyInput {
  credential: VerifiableCredential | string | {
    typedData: unknown;
    signature: string;
    credential?: VerifiableCredential;
  };

  format?: VCFormat;

  context: VCVerifyContext;
}

export interface ParsedCredentialEnvelope {
  format: VCFormat;
  credential?: VerifiableCredential;
  jwt?: string;
  eip712?: {
    typedData: unknown;
    signature: string;
    credential?: VerifiableCredential;
  };

  issuerDid?: DIDString;
  subjectDid?: DIDString;
  credentialId?: string;
  credentialTypes: string[];
  schemaId?: string;
  credentialHash?: string;
}

export interface VCVerifyCheckResult {
  name:
    | 'format'
    | 'structure'
    | 'signature'
    | 'issuer_trust'
    | 'schema'
    | 'time'
    | 'status'
    | 'anchor'
    | 'holder_binding'
    | 'domain_policy';

  passed: boolean;
  skipped?: boolean;
  reason?: string;
  metadata?: Record;
}

export interface VCVerifyPipelineResult {
  valid: boolean;

  format: VCFormat;

  issuerDid?: DIDString;
  subjectDid?: DIDString;
  credentialId?: string;
  credentialHash?: string;

  domain?: DIDBusinessDomain;
  credentialType?: DomainCredentialType;

  errors: string[];
  warnings: string[];

  checks: VCVerifyCheckResult[];

  credential?: VerifiableCredential;

  metadata?: Record;
}
```



---



# 4\. VC Verify 错误



## `core/vc-verify/vc-verify.errors.ts`



```TypeScript
export class VCVerifyError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'VCVerifyError';
  }
}

export const VCVerifyErrors = {
  INVALID_FORMAT: (details?: unknown) =>
    new VCVerifyError(
      'VC_VERIFY_INVALID_FORMAT',
      'Invalid credential format',
      details,
    ),

  INVALID_STRUCTURE: (details?: unknown) =>
    new VCVerifyError(
      'VC_VERIFY_INVALID_STRUCTURE',
      'Invalid credential structure',
      details,
    ),

  SIGNATURE_INVALID: (details?: unknown) =>
    new VCVerifyError(
      'VC_VERIFY_SIGNATURE_INVALID',
      'Credential signature invalid',
      details,
    ),

  ISSUER_NOT_TRUSTED: (details?: unknown) =>
    new VCVerifyError(
      'VC_VERIFY_ISSUER_NOT_TRUSTED',
      'Credential issuer is not trusted',
      details,
    ),

  SCHEMA_INVALID: (details?: unknown) =>
    new VCVerifyError(
      'VC_VERIFY_SCHEMA_INVALID',
      'Credential does not match schema',
      details,
    ),

  EXPIRED: (details?: unknown) =>
    new VCVerifyError(
      'VC_VERIFY_EXPIRED',
      'Credential expired',
      details,
    ),

  NOT_YET_VALID: (details?: unknown) =>
    new VCVerifyError(
      'VC_VERIFY_NOT_YET_VALID',
      'Credential is not yet valid',
      details,
    ),

  REVOKED: (details?: unknown) =>
    new VCVerifyError(
      'VC_VERIFY_REVOKED',
      'Credential has been revoked',
      details,
    ),

  ANCHOR_MISMATCH: (details?: unknown) =>
    new VCVerifyError(
      'VC_VERIFY_ANCHOR_MISMATCH',
      'Credential anchor mismatch',
      details,
    ),

  HOLDER_BINDING_FAILED: (details?: unknown) =>
    new VCVerifyError(
      'VC_VERIFY_HOLDER_BINDING_FAILED',
      'Credential holder binding failed',
      details,
    ),
};
```



---



# 5\. Credential Parser



## `core/vc-verify/vc-parser.service.ts`



```TypeScript
import { VCHashService } from '../vc/vc-hash.service';
import {
  VCFormat,
  VerifiableCredential,
} from '../vc/vc.types';
import {
  ParsedCredentialEnvelope,
  VCVerifyInput,
} from './vc-verify.types';
import { VCVerifyErrors } from './vc-verify.errors';

export class VCParserService {
  constructor(
    private readonly hash = new VCHashService(),
  ) {}

  parse(input: VCVerifyInput): ParsedCredentialEnvelope {
    const format = input.format ?? this.detectFormat(input.credential);

    if (format === 'jsonld_vc') {
      const credential = input.credential as VerifiableCredential;

      return this.fromCredential(format, credential);
    }

    if (format === 'jwt_vc') {
      if (typeof input.credential !== 'string') {
        throw VCVerifyErrors.INVALID_FORMAT('JWT VC must be a string');
      }

      const payload = decodeJwtPayload(input.credential);
      const vc = payload.vc as VerifiableCredential | undefined;

      if (!vc) {
        throw VCVerifyErrors.INVALID_FORMAT('JWT payload missing vc');
      }

      return {
        ...this.fromCredential(format, vc),
        jwt: input.credential,
      };
    }

    if (format === 'eip712_vc') {
      if (
        !input.credential ||
        typeof input.credential !== 'object' ||
        !('typedData' in input.credential) ||
        !('signature' in input.credential)
      ) {
        throw VCVerifyErrors.INVALID_FORMAT('EIP712 VC requires typedData and signature');
      }

      const eip712 = input.credential as {
        typedData: unknown;
        signature: string;
        credential?: VerifiableCredential;
      };

      const credential =
        eip712.credential ??
        extractCredentialFromTypedData(eip712.typedData);

      return {
        ...this.fromCredential(format, credential),
        eip712,
      };
    }

    throw VCVerifyErrors.INVALID_FORMAT({
      format,
    });
  }

  private detectFormat(value: unknown): VCFormat {
    if (typeof value === 'string' && value.split('.').length === 3) {
      return 'jwt_vc';
    }

    if (
      value &&
      typeof value === 'object' &&
      'typedData' in value &&
      'signature' in value
    ) {
      return 'eip712_vc';
    }

    if (
      value &&
      typeof value === 'object' &&
      '@context' in value &&
      'credentialSubject' in value
    ) {
      return 'jsonld_vc';
    }

    throw VCVerifyErrors.INVALID_FORMAT('Unable to detect VC format');
  }

  private fromCredential(
    format: VCFormat,
    credential: VerifiableCredential,
  ): ParsedCredentialEnvelope {
    const issuerDid =
      typeof credential.issuer === 'string'
        ? credential.issuer
        : credential.issuer.id;

    const subject = Array.isArray(credential.credentialSubject)
      ? credential.credentialSubject[0]
      : credential.credentialSubject;

    const subjectDid = subject?.id;

    const schema = Array.isArray(credential.credentialSchema)
      ? credential.credentialSchema[0]
      : credential.credentialSchema;

    return {
      format,
      credential,
      issuerDid: issuerDid as any,
      subjectDid: subjectDid as any,
      credentialId: credential.id,
      credentialTypes: credential.type ?? [],
      schemaId: schema?.id,
      credentialHash: this.hash.hashCredential(credential),
    };
  }
}

function decodeJwtPayload(jwt: string): Record {
  const parts = jwt.split('.');

  if (parts.length !== 3) {
    throw VCVerifyErrors.INVALID_FORMAT('Invalid JWT structure');
  }

  const payload = parts[1]
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const padded = payload.padEnd(
    payload.length + (4 - payload.length % 4) % 4,
    '=',
  );

  return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
}

function extractCredentialFromTypedData(typedData: any): VerifiableCredential {
  /**
   * EIP-712 VC 在 Part 5 中推荐同时携带 credential。
   * 如果只给 typedData，只能恢复有限字段，不能完整验证 Schema / Status。
   */
  if (typedData?.credential) {
    return typedData.credential;
  }

  throw VCVerifyErrors.INVALID_FORMAT(
    'EIP712 VC verification requires original credential for full validation',
  );
}
```



---



# 6\. Basic Structure Validator



## `core/vc-verify/vc-basic-validator.service.ts`



```TypeScript
import { VerifiableCredential } from '../vc/vc.types';

export class VCBasicValidatorService {
  validate(credential: VerifiableCredential): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!credential['@context']) {
      errors.push('CONTEXT_REQUIRED');
    }

    if (!Array.isArray(credential.type) || credential.type.length === 0) {
      errors.push('TYPE_REQUIRED');
    }

    if (!credential.type.includes('VerifiableCredential')) {
      errors.push('TYPE_MUST_INCLUDE_VERIFIABLE_CREDENTIAL');
    }

    if (!credential.issuer) {
      errors.push('ISSUER_REQUIRED');
    }

    if (!credential.issuanceDate) {
      errors.push('ISSUANCE_DATE_REQUIRED');
    }

    if (!credential.credentialSubject) {
      errors.push('CREDENTIAL_SUBJECT_REQUIRED');
    }

    const subject = Array.isArray(credential.credentialSubject)
      ? credential.credentialSubject[0]
      : credential.credentialSubject;

    if (!subject?.id) {
      warnings.push('SUBJECT_DID_MISSING');
    }

    if (!credential.credentialSchema) {
      warnings.push('CREDENTIAL_SCHEMA_MISSING');
    }

    if (!credential.credentialStatus) {
      warnings.push('CREDENTIAL_STATUS_MISSING');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
```



---



# 7\. Time Validator



## `core/vc-verify/vc-time-validator.service.ts`



```TypeScript
export class VCTimeValidatorService {
  validate(input: {
    issuanceDate?: string;
    expirationDate?: string;
    now?: number;
    maxFutureSkewMs?: number;
  }): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const now = input.now ?? Date.now();
    const maxFutureSkewMs = input.maxFutureSkewMs ?? 5 * 60_000;

    const errors: string[] = [];
    const warnings: string[] = [];

    if (input.issuanceDate) {
      const issuedAt = new Date(input.issuanceDate).getTime();

      if (!Number.isFinite(issuedAt)) {
        errors.push('ISSUANCE_DATE_INVALID');
      } else if (issuedAt > now + maxFutureSkewMs) {
        errors.push('ISSUANCE_DATE_IN_FUTURE');
      }
    }

    if (input.expirationDate) {
      const expiresAt = new Date(input.expirationDate).getTime();

      if (!Number.isFinite(expiresAt)) {
        errors.push('EXPIRATION_DATE_INVALID');
      } else if (expiresAt ;
}

export interface ProofVerifier {
  verify(input: {
    credential: VerifiableCredential;
    resolver: DIDResolverService;
  }): Promise;
}
```



---



# 9\. JSON\-LD VC Verifier



这里验证逻辑包含：



```Plain Text
1. proof 存在
2. verificationMethod 存在
3. issuer DID 可解析
4. verificationMethod 属于 DID Document
5. proofPurpose 是 assertionMethod
6. 签名验证由 crypto adapter 完成
```



本章先给严格结构与 DID Document 关系校验，签名 crypto adapter 可在生产接 Ed25519 / JWS。



## `core/vc-verify/vc-jsonld-verifier.service.ts`



```TypeScript
import { DIDResolverService } from '../did/did-resolver.service';
import { VerifiableCredential } from '../vc/vc.types';
import { stableStringify } from '../anchor/anchor-hash.service';

export interface JsonLdProofCryptoVerifier {
  verify(input: {
    verificationMethod: string;
    payload: Uint8Array;
    proofValue?: string;
    jws?: string;
    publicKeyMultibase?: string;
    publicKeyJwk?: unknown;
  }): Promise;
}

export class VCJsonLdVerifierService {
  constructor(
    private readonly resolver: DIDResolverService,
    private readonly cryptoVerifier?: JsonLdProofCryptoVerifier,
  ) {}

  async verify(input: {
    credential: VerifiableCredential;
  }): Promise;
  }> {
    const proof = Array.isArray(input.credential.proof)
      ? input.credential.proof[0]
      : input.credential.proof;

    if (!proof) {
      return {
        valid: false,
        reason: 'PROOF_MISSING',
      };
    }

    if (!proof.verificationMethod) {
      return {
        valid: false,
        reason: 'PROOF_VERIFICATION_METHOD_MISSING',
      };
    }

    if (proof.proofPurpose !== 'assertionMethod') {
      return {
        valid: false,
        reason: 'PROOF_PURPOSE_NOT_ASSERTION_METHOD',
      };
    }

    const issuerDid =
      typeof input.credential.issuer === 'string'
        ? input.credential.issuer
        : input.credential.issuer.id;

    const resolution = await this.resolver.resolve(issuerDid as any);

    if (!resolution.didDocument) {
      return {
        valid: false,
        reason: 'ISSUER_DID_RESOLUTION_FAILED',
        metadata: {
          didResolutionMetadata: resolution.didResolutionMetadata,
        },
      };
    }

    const methods = resolution.didDocument.verificationMethod ?? [];
    const method = methods.find((item) => item.id === proof.verificationMethod);

    if (!method) {
      return {
        valid: false,
        reason: 'VERIFICATION_METHOD_NOT_FOUND_IN_DID_DOCUMENT',
      };
    }

    const assertion = resolution.didDocument.assertionMethod ?? [];
    const allowed = assertion.some((item) =>
      typeof item === 'string'
        ? item === proof.verificationMethod
        : item.id === proof.verificationMethod,
    );

    if (!allowed) {
      return {
        valid: false,
        reason: 'VERIFICATION_METHOD_NOT_ALLOWED_FOR_ASSERTION',
      };
    }

    if (!this.cryptoVerifier) {
      return {
        valid: true,
        reason: 'CRYPTO_VERIFIER_NOT_CONFIGURED_STRUCTURE_ONLY',
        metadata: {
          structureOnly: true,
        },
      };
    }

    const unsigned = JSON.parse(JSON.stringify(input.credential));
    delete unsigned.proof;

    const payload = new TextEncoder().encode(stableStringify(unsigned));

    const ok = await this.cryptoVerifier.verify({
      verificationMethod: proof.verificationMethod,
      payload,
      proofValue: proof.proofValue,
      jws: proof.jws,
      publicKeyJwk: method.publicKeyJwk,
      publicKeyMultibase: method.publicKeyMultibase,
    });

    return {
      valid: ok,
      reason: ok ? undefined : 'PROOF_SIGNATURE_INVALID',
    };
  }
}
```



---



# 10\. JWT VC Verifier



生产建议用 `jose.jwtVerify` \+ DID key resolver。这里保持签名边界严谨。



## `core/vc-verify/vc-jwt-verifier.service.ts`



```TypeScript
import { DIDResolverService } from '../did/did-resolver.service';

export interface JwtCryptoVerifier {
  verify(input: {
    jwt: string;
    issuerDid: string;
    resolver: DIDResolverService;
    audience?: string;
  }): Promise;
    reason?: string;
  }>;
}

export class VCJwtVerifierService {
  constructor(
    private readonly resolver: DIDResolverService,
    private readonly cryptoVerifier?: JwtCryptoVerifier,
  ) {}

  async verify(input: {
    jwt: string;
    expectedAudience?: string;
  }): Promise;
    metadata?: Record;
  }> {
    const payload = decodeJwtPayload(input.jwt);

    const issuerDid = payload.iss as string | undefined;

    if (!issuerDid) {
      return {
        valid: false,
        reason: 'JWT_ISS_MISSING',
      };
    }

    const resolution = await this.resolver.resolve(issuerDid as any);

    if (!resolution.didDocument) {
      return {
        valid: false,
        reason: 'JWT_ISSUER_DID_RESOLUTION_FAILED',
        metadata: {
          didResolutionMetadata: resolution.didResolutionMetadata,
        },
      };
    }

    if (!this.cryptoVerifier) {
      return {
        valid: true,
        reason: 'CRYPTO_VERIFIER_NOT_CONFIGURED_STRUCTURE_ONLY',
        payload,
        metadata: {
          structureOnly: true,
        },
      };
    }

    const verified = await this.cryptoVerifier.verify({
      jwt: input.jwt,
      issuerDid,
      resolver: this.resolver,
      audience: input.expectedAudience,
    });

    return {
      valid: verified.valid,
      reason: verified.reason,
      payload: verified.payload,
    };
  }
}

function decodeJwtPayload(jwt: string): Record {
  const parts = jwt.split('.');

  if (parts.length !== 3) {
    throw new Error('INVALID_JWT');
  }

  const payload = parts[1]
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const padded = payload.padEnd(
    payload.length + (4 - payload.length % 4) % 4,
    '=',
  );

  return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
}
```



---



# 11\. EIP\-712 VC Verifier



## `core/vc-verify/vc-eip712-verifier.service.ts`



```TypeScript
export interface Eip712CryptoVerifier {
  verifyTypedData(input: {
    typedData: unknown;
    signature: string;
    expectedSigner?: string;
  }): Promise;
}

export class VCEip712VerifierService {
  constructor(
    private readonly cryptoVerifier?: Eip712CryptoVerifier,
  ) {}

  async verify(input: {
    typedData: unknown;
    signature: string;
    expectedSigner?: string;
  }): Promise;
  }> {
    if (!input.typedData || !input.signature) {
      return {
        valid: false,
        reason: 'EIP712_TYPED_DATA_OR_SIGNATURE_MISSING',
      };
    }

    if (!this.cryptoVerifier) {
      return {
        valid: true,
        reason: 'CRYPTO_VERIFIER_NOT_CONFIGURED_STRUCTURE_ONLY',
        metadata: {
          structureOnly: true,
        },
      };
    }

    const result = await this.cryptoVerifier.verifyTypedData({
      typedData: input.typedData,
      signature: input.signature,
      expectedSigner: input.expectedSigner,
    });

    return result;
  }
}
```



---



# 12\. Revocation 类型



## `core/revocation/credential-status.types.ts`



```TypeScript
export interface StatusList2021Entry {
  id: string;
  type: 'StatusList2021Entry';
  statusPurpose: 'revocation' | 'suspension';
  statusListIndex: string;
  statusListCredential: string;
}

export interface OnChainRevocationStatus {
  id: string;
  type: 'OnChainRevocationStatus';
  chainId: string;
  registryAddress: string;
  credentialHash: string;
}

export interface RevocationCheckResult {
  revoked: boolean;
  suspended?: boolean;
  reason?: string;
  metadata?: Record;
}
```



---



# 13\. Revocation Repository



## `core/revocation/revocation-registry.repository.ts`



```TypeScript
export interface RevocationRegistryRepository {
  isRevoked(credentialHash: string): Promise;
  revoke(input: {
    credentialHash: string;
    reason?: string;
  }): Promise;
}

export class InMemoryRevocationRegistryRepository
  implements RevocationRegistryRepository {
  private readonly revoked = new Map();

  async isRevoked(credentialHash: string): Promise {
    return this.revoked.has(credentialHash.toLowerCase());
  }

  async revoke(input: {
    credentialHash: string;
    reason?: string;
  }): Promise {
    this.revoked.set(input.credentialHash.toLowerCase(), {
      reason: input.reason,
      revokedAt: Date.now(),
    });
  }
}
```



---



# 14\. StatusList2021 Service



StatusList2021 本质是 bitstring。这里先定义接口，真实压缩 bitstring 可后续实现。



## `core/revocation/status-list2021.service.ts`



```TypeScript
import { RevocationCheckResult } from './credential-status.types';

export interface StatusListCredentialFetcher {
  fetch(url: string): Promise;
}

export class StatusList2021Service {
  constructor(
    private readonly fetcher?: StatusListCredentialFetcher,
  ) {}

  async check(input: {
    statusListCredential: string;
    statusListIndex: string;
  }): Promise {
    if (!this.fetcher) {
      return {
        revoked: false,
        reason: 'STATUS_LIST_FETCHER_NOT_CONFIGURED_ASSUME_NOT_REVOKED',
      };
    }

    const list = await this.fetcher.fetch(input.statusListCredential);
    const index = Number(input.statusListIndex);

    if (!Number.isSafeInteger(index) || index ;
}

export class OnChainRevocationService {
  constructor(
    private readonly client?: OnChainRevocationClient,
  ) {}

  async check(input: {
    chainId: string;
    registryAddress: string;
    credentialHash: string;
  }): Promise {
    if (!this.client) {
      return {
        revoked: false,
        reason: 'ONCHAIN_REVOCATION_CLIENT_NOT_CONFIGURED_ASSUME_NOT_REVOKED',
      };
    }

    const revoked = await this.client.isRevoked(input);

    return {
      revoked,
      reason: revoked ? 'ONCHAIN_REVOKED' : undefined,
      metadata: input,
    };
  }
}
```



---



# 16\. VC Status Verifier



## `core/vc-verify/vc-status-verifier.service.ts`



```TypeScript
import { CredentialStatus } from '../vc/vc.types';
import { StatusList2021Service } from '../revocation/status-list2021.service';
import { OnChainRevocationService } from '../revocation/onchain-revocation.service';
import { RevocationRegistryRepository } from '../revocation/revocation-registry.repository';

export class VCStatusVerifierService {
  constructor(
    private readonly localRevocation: RevocationRegistryRepository,
    private readonly statusList2021: StatusList2021Service,
    private readonly onChain: OnChainRevocationService,
  ) {}

  async verify(input: {
    credentialHash: string;
    credentialStatus?: CredentialStatus | CredentialStatus[];
  }): Promise;
  }> {
    if (await this.localRevocation.isRevoked(input.credentialHash)) {
      return {
        valid: false,
        reason: 'LOCAL_REVOCATION_REGISTRY_REVOKED',
      };
    }

    if (!input.credentialStatus) {
      return {
        valid: true,
        reason: 'CREDENTIAL_STATUS_MISSING_SKIPPED',
      };
    }

    const statuses = Array.isArray(input.credentialStatus)
      ? input.credentialStatus
      : [input.credentialStatus];

    for (const status of statuses) {
      if (status.type === 'StatusList2021Entry') {
        const result = await this.statusList2021.check({
          statusListCredential: status.statusListCredential!,
          statusListIndex: status.statusListIndex!,
        });

        if (result.revoked || result.suspended) {
          return {
            valid: false,
            reason: result.reason ?? 'STATUS_LIST_REVOKED',
            metadata: result.metadata,
          };
        }
      }

      if (status.type === 'OnChainRevocationStatus') {
        const result = await this.onChain.check({
          chainId: status.chainId!,
          registryAddress: status.registryAddress!,
          credentialHash: status.credentialHash ?? input.credentialHash,
        });

        if (result.revoked) {
          return {
            valid: false,
            reason: result.reason ?? 'ONCHAIN_REVOKED',
            metadata: result.metadata,
          };
        }
      }
    }

    return {
      valid: true,
    };
  }
}
```



---



# 17\. Anchor Verifier



## `core/vc-verify/vc-anchor-verifier.service.ts`



```TypeScript
export interface VCAnchorClient {
  verifyCredentialAnchor(input: {
    credentialHash: string;
    issuerDid?: string;
    subjectDid?: string;
    schemaHash?: string;
  }): Promise;
}

export class VCAnchorVerifierService {
  constructor(
    private readonly client?: VCAnchorClient,
  ) {}

  async verify(input: {
    credentialHash: string;
    issuerDid?: string;
    subjectDid?: string;
    schemaHash?: string;
  }): Promise;
  }> {
    if (!this.client) {
      return {
        valid: true,
        skipped: true,
        reason: 'ANCHOR_CLIENT_NOT_CONFIGURED',
      };
    }

    const result = await this.client.verifyCredentialAnchor(input);

    return {
      valid: result.valid,
      reason: result.reason,
      metadata: {
        txHash: result.txHash,
        chainId: result.chainId,
        registryAddress: result.registryAddress,
      },
    };
  }
}
```



---



# 18\. Holder Binding Verifier



用于确认 VC subject 与当前 holder DID / 钱包绑定一致。



## `core/vc-verify/vc-holder-binding-verifier.service.ts`



```TypeScript
import { WalletBindingRepository } from '../wallet-binding/wallet-binding.repository';

export class VCHolderBindingVerifierService {
  constructor(
    private readonly walletBindings?: WalletBindingRepository,
  ) {}

  async verify(input: {
    subjectDid?: string;
    expectedSubjectDid?: string;
    expectedAccountId?: string;
  }): Promise {
    if (!input.subjectDid) {
      return {
        valid: false,
        reason: 'SUBJECT_DID_MISSING',
      };
    }

    if (
      input.expectedSubjectDid &&
      input.subjectDid !== input.expectedSubjectDid
    ) {
      return {
        valid: false,
        reason: 'SUBJECT_DID_MISMATCH',
      };
    }

    if (!input.expectedAccountId) {
      return {
        valid: true,
        skipped: true,
        reason: 'EXPECTED_ACCOUNT_ID_NOT_PROVIDED',
      };
    }

    if (!this.walletBindings) {
      return {
        valid: false,
        reason: 'WALLET_BINDING_REPOSITORY_NOT_CONFIGURED',
      };
    }

    const binding = await this.walletBindings.findActive({
      did: input.subjectDid,
      accountId: input.expectedAccountId,
    });

    if (!binding) {
      return {
        valid: false,
        reason: 'ACTIVE_WALLET_BINDING_NOT_FOUND',
      };
    }

    return {
      valid: true,
    };
  }
}
```



---



# 19\. Domain Policy Verifier



将 VC 业务域、Credential Type、Schema 绑定起来。



## `core/vc-verify/vc-domain-policy-verifier.service.ts`



```TypeScript
import { DIDBusinessDomain } from '../domain/did-domain.types';
import { DomainCredentialType } from '../domain/did-domain-credential.types';
import { VerifiableCredential } from '../vc/vc.types';

export class VCDomainPolicyVerifierService {
  verify(input: {
    credential: VerifiableCredential;
    expectedDomain?: DIDBusinessDomain;
    expectedCredentialType?: DomainCredentialType;
  }): {
    valid: boolean;
    reason?: string;
    domain?: DIDBusinessDomain;
    credentialType?: DomainCredentialType;
  } {
    const subject = Array.isArray(input.credential.credentialSubject)
      ? input.credential.credentialSubject[0]
      : input.credential.credentialSubject;

    const domain = subject?.domain as DIDBusinessDomain | undefined;

    const credentialType = extractDomainCredentialType(
      input.credential.type,
    );

    if (input.expectedDomain && domain !== input.expectedDomain) {
      return {
        valid: false,
        reason: 'DOMAIN_MISMATCH',
        domain,
        credentialType,
      };
    }

    if (
      input.expectedCredentialType &&
      credentialType !== input.expectedCredentialType
    ) {
      return {
        valid: false,
        reason: 'CREDENTIAL_TYPE_MISMATCH',
        domain,
        credentialType,
      };
    }

    return {
      valid: true,
      domain,
      credentialType,
    };
  }
}

function extractDomainCredentialType(types: string[]): DomainCredentialType | undefined {
  const type = types.find(
    (item) =>
      item !== 'VerifiableCredential' &&
      item.endsWith('Credential'),
  );

  if (!type) return undefined;

  return type.replace(/Credential$/, '') as DomainCredentialType;
}
```



---



# 20\. Verification Audit



## `core/vc-verify/vc-verify-audit.service.ts`



```TypeScript
export interface VCVerifyAuditRecord {
  auditNo: string;

  action:
    | 'vc.verify.requested'
    | 'vc.verify.succeeded'
    | 'vc.verify.failed'
    | 'vc.verify.revoked'
    | 'vc.verify.anchor_checked';

  result: 'success' | 'failed' | 'revoked' | 'warning';

  domain?: string;
  credentialType?: string;
  issuerDid?: string;
  subjectDid?: string;
  credentialId?: string;
  credentialHash?: string;

  errors?: string[];
  warnings?: string[];
  metadata?: unknown;

  createdAt: number;
}

export interface VCVerifyAuditSink {
  record(record: VCVerifyAuditRecord): Promise;
}

export class ConsoleVCVerifyAuditSink implements VCVerifyAuditSink {
  async record(record: VCVerifyAuditRecord): Promise {
    console.log('[VCVerifyAudit]', record);
  }
}

export class VCVerifyAuditService {
  constructor(
    private readonly sink: VCVerifyAuditSink = new ConsoleVCVerifyAuditSink(),
  ) {}

  async record(
    action: VCVerifyAuditRecord['action'],
    result: VCVerifyAuditRecord['result'],
    input: Omit,
  ) {
    await this.sink.record({
      auditNo: `VCVAUD-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`,
      action,
      result,
      ...input,
      createdAt: Date.now(),
    });
  }
}
```



---



# 21\. Verify Pipeline



## `core/vc-verify/vc-verify-pipeline.service.ts`



```TypeScript
import { IssuerTrustService } from '../issuer/issuer-trust.service';
import { DomainSchemaPolicyService } from '../schema/domain-schema-policy.service';
import { SchemaValidationService } from '../schema/schema-validation.service';
import { VCParserService } from './vc-parser.service';
import { VCBasicValidatorService } from './vc-basic-validator.service';
import { VCTimeValidatorService } from './vc-time-validator.service';
import { VCJsonLdVerifierService } from './vc-jsonld-verifier.service';
import { VCJwtVerifierService } from './vc-jwt-verifier.service';
import { VCEip712VerifierService } from './vc-eip712-verifier.service';
import { VCStatusVerifierService } from './vc-status-verifier.service';
import { VCAnchorVerifierService } from './vc-anchor-verifier.service';
import { VCHolderBindingVerifierService } from './vc-holder-binding-verifier.service';
import { VCDomainPolicyVerifierService } from './vc-domain-policy-verifier.service';
import { VCVerifyAuditService } from './vc-verify-audit.service';
import {
  VCVerifyCheckResult,
  VCVerifyInput,
  VCVerifyPipelineResult,
} from './vc-verify.types';

export class VCVerifyPipelineService {
  constructor(
    private readonly parser: VCParserService,
    private readonly basic: VCBasicValidatorService,
    private readonly time: VCTimeValidatorService,
    private readonly jsonLdVerifier: VCJsonLdVerifierService,
    private readonly jwtVerifier: VCJwtVerifierService,
    private readonly eip712Verifier: VCEip712VerifierService,
    private readonly issuerTrust: IssuerTrustService,
    private readonly schemaPolicy: DomainSchemaPolicyService,
    private readonly schemaValidation: SchemaValidationService,
    private readonly statusVerifier: VCStatusVerifierService,
    private readonly anchorVerifier: VCAnchorVerifierService,
    private readonly holderBindingVerifier: VCHolderBindingVerifierService,
    private readonly domainPolicyVerifier: VCDomainPolicyVerifierService,
    private readonly audit: VCVerifyAuditService,
  ) {}

  async verify(input: VCVerifyInput): Promise {
    const errors: string[] = [];
    const warnings: string[] = [];
    const checks: VCVerifyCheckResult[] = [];

    const parsed = this.parser.parse(input);

    await this.audit.record('vc.verify.requested', 'success', {
      issuerDid: parsed.issuerDid,
      subjectDid: parsed.subjectDid,
      credentialId: parsed.credentialId,
      credentialHash: parsed.credentialHash,
      metadata: {
        format: parsed.format,
        requestId: input.context.requestId,
      },
    });

    const credential = parsed.credential;

    if (!credential) {
      errors.push('CREDENTIAL_NOT_AVAILABLE');
      return finish(false);
    }

    const basic = this.basic.validate(credential);
    checks.push({
      name: 'structure',
      passed: basic.valid,
      metadata: {
        warnings: basic.warnings,
      },
    });
    errors.push(...basic.errors);
    warnings.push(...basic.warnings);

    if (!basic.valid) return finish(false);

    const domainCheck = this.domainPolicyVerifier.verify({
      credential,
      expectedDomain: input.context.domain,
      expectedCredentialType: input.context.credentialType,
    });

    checks.push({
      name: 'domain_policy',
      passed: domainCheck.valid,
      reason: domainCheck.reason,
    });

    if (!domainCheck.valid) {
      errors.push(domainCheck.reason ?? 'DOMAIN_POLICY_FAILED');
      return finish(false);
    }

    if (input.context.verifySignature !== false) {
      const sig = await this.verifySignature(input, parsed.format, parsed);
      checks.push(sig);

      if (!sig.passed) {
        errors.push(sig.reason ?? 'SIGNATURE_INVALID');
        return finish(false);
      }
    }

    const time = this.time.validate({
      issuanceDate: credential.issuanceDate,
      expirationDate: credential.expirationDate,
      now: input.context.now,
    });

    checks.push({
      name: 'time',
      passed: time.valid,
      metadata: {
        warnings: time.warnings,
      },
    });

    errors.push(...time.errors);
    warnings.push(...time.warnings);

    if (!time.valid) return finish(false);

    const schemaRecord = await this.schemaPolicy.resolveSchema({
      domain: domainCheck.domain!,
      credentialType: domainCheck.credentialType!,
      schemaId: parsed.schemaId,
    });

    if (input.context.verifySchema !== false) {
      const subject = Array.isArray(credential.credentialSubject)
        ? credential.credentialSubject[0]
        : credential.credentialSubject;

      const schema = this.schemaValidation.validateClaims({
        schema: schemaRecord,
        claims: subject as Record,
      });

      checks.push({
        name: 'schema',
        passed: schema.valid,
        metadata: {
          warnings: schema.warnings,
          schemaId: schemaRecord.schemaId,
        },
      });

      errors.push(...schema.errors);
      warnings.push(...schema.warnings);

      if (!schema.valid) return finish(false);
    }

    if (input.context.verifyIssuerTrust !== false) {
      const trust = await this.issuerTrust.check({
        issuerDid: parsed.issuerDid!,
        domain: domainCheck.domain!,
        credentialType: domainCheck.credentialType!,
        schemaId: schemaRecord.schemaId,
      });

      checks.push({
        name: 'issuer_trust',
        passed: trust.trusted,
        reason: trust.reason,
        metadata: {
          issuer: trust.issuer,
        },
      });

      if (!trust.trusted) {
        errors.push(trust.reason ?? 'ISSUER_NOT_TRUSTED');
        return finish(false);
      }
    }

    if (input.context.verifyStatus !== false) {
      const status = await this.statusVerifier.verify({
        credentialHash: parsed.credentialHash!,
        credentialStatus: credential.credentialStatus as any,
      });

      checks.push({
        name: 'status',
        passed: status.valid,
        reason: status.reason,
        metadata: status.metadata,
      });

      if (!status.valid) {
        errors.push(status.reason ?? 'CREDENTIAL_REVOKED');

        await this.audit.record('vc.verify.revoked', 'revoked', {
          issuerDid: parsed.issuerDid,
          subjectDid: parsed.subjectDid,
          credentialId: parsed.credentialId,
          credentialHash: parsed.credentialHash,
          errors,
          warnings,
        });

        return finish(false);
      }
    }

    if (input.context.verifyAnchor) {
      const anchor = await this.anchorVerifier.verify({
        credentialHash: parsed.credentialHash!,
        issuerDid: parsed.issuerDid,
        subjectDid: parsed.subjectDid,
        schemaHash: schemaRecord.hash,
      });

      checks.push({
        name: 'anchor',
        passed: anchor.valid,
        skipped: anchor.skipped,
        reason: anchor.reason,
        metadata: anchor.metadata,
      });

      await this.audit.record('vc.verify.anchor_checked', anchor.valid ? 'success' : 'failed', {
        issuerDid: parsed.issuerDid,
        subjectDid: parsed.subjectDid,
        credentialId: parsed.credentialId,
        credentialHash: parsed.credentialHash,
        metadata: anchor.metadata,
      });

      if (!anchor.valid) {
        errors.push(anchor.reason ?? 'ANCHOR_INVALID');
        return finish(false);
      }
    }

    if (input.context.verifyHolderBinding) {
      const holder = await this.holderBindingVerifier.verify({
        subjectDid: parsed.subjectDid,
        expectedSubjectDid: input.context.expectedSubjectDid,
        expectedAccountId: input.context.metadata?.accountId as string | undefined,
      });

      checks.push({
        name: 'holder_binding',
        passed: holder.valid,
        skipped: holder.skipped,
        reason: holder.reason,
      });

      if (!holder.valid) {
        errors.push(holder.reason ?? 'HOLDER_BINDING_FAILED');
        return finish(false);
      }
    }

    return finish(errors.length === 0);

    async function finish(valid: boolean): Promise {
      const result: VCVerifyPipelineResult = {
        valid,
        format: parsed.format,
        issuerDid: parsed.issuerDid,
        subjectDid: parsed.subjectDid,
        credentialId: parsed.credentialId,
        credentialHash: parsed.credentialHash,
        domain: domainCheck?.domain,
        credentialType: domainCheck?.credentialType,
        errors,
        warnings,
        checks,
        credential,
      };

      await inputAudit(result);

      return result;
    }

    async function inputAudit(result: VCVerifyPipelineResult) {
      await thisAudit.record(
        result.valid ? 'vc.verify.succeeded' : 'vc.verify.failed',
        result.valid ? 'success' : 'failed',
        {
          domain: result.domain,
          credentialType: result.credentialType,
          issuerDid: result.issuerDid,
          subjectDid: result.subjectDid,
          credentialId: result.credentialId,
          credentialHash: result.credentialHash,
          errors: result.errors,
          warnings: result.warnings,
          metadata: {
            checks: result.checks,
          },
        },
      );
    }
  }

  private async verifySignature(
    input: VCVerifyInput,
    format: string,
    parsed: any,
  ): Promise {
    if (format === 'jsonld_vc') {
      const result = await this.jsonLdVerifier.verify({
        credential: parsed.credential,
      });

      return {
        name: 'signature',
        passed: result.valid,
        reason: result.reason,
        metadata: result.metadata,
      };
    }

    if (format === 'jwt_vc') {
      const result = await this.jwtVerifier.verify({
        jwt: parsed.jwt,
        expectedAudience: input.context.expectedAudience,
      });

      return {
        name: 'signature',
        passed: result.valid,
        reason: result.reason,
        metadata: result.metadata,
      };
    }

    if (format === 'eip712_vc') {
      const result = await this.eip712Verifier.verify({
        typedData: parsed.eip712.typedData,
        signature: parsed.eip712.signature,
      });

      return {
        name: 'signature',
        passed: result.valid,
        reason: result.reason,
        metadata: {
          recoveredAddress: result.recoveredAddress,
          ...result.metadata,
        },
      };
    }

    return {
      name: 'signature',
      passed: false,
      reason: 'UNSUPPORTED_SIGNATURE_FORMAT',
    };
  }
}

const thisAuditProxy = Symbol('thisAuditProxy');

/**
 * TS 闭包内 this 处理辅助。
 * 如果你直接复制到工程中，可以把 finish/inputAudit 改为 class private method。
 */
function thisAudit(): never {
  throw new Error('unreachable');
}
```



> 上面为了展示流程把 `finish` 写在函数内部。实际工程中建议把 `finish` 提为私有方法，避免 `this` 闭包问题。下面给可直接替换的修正版核心片段。
> 
> 



## `finish` 修正版建议



将 `finish` 改为：



```TypeScript
private async finish(input: {
  valid: boolean;
  parsed: any;
  domain?: any;
  credentialType?: any;
  errors: string[];
  warnings: string[];
  checks: VCVerifyCheckResult[];
  credential?: any;
}): Promise {
  const result: VCVerifyPipelineResult = {
    valid: input.valid,
    format: input.parsed.format,
    issuerDid: input.parsed.issuerDid,
    subjectDid: input.parsed.subjectDid,
    credentialId: input.parsed.credentialId,
    credentialHash: input.parsed.credentialHash,
    domain: input.domain,
    credentialType: input.credentialType,
    errors: input.errors,
    warnings: input.warnings,
    checks: input.checks,
    credential: input.credential,
  };

  await this.audit.record(
    result.valid ? 'vc.verify.succeeded' : 'vc.verify.failed',
    result.valid ? 'success' : 'failed',
    {
      domain: result.domain,
      credentialType: result.credentialType,
      issuerDid: result.issuerDid,
      subjectDid: result.subjectDid,
      credentialId: result.credentialId,
      credentialHash: result.credentialHash,
      errors: result.errors,
      warnings: result.warnings,
      metadata: {
        checks: result.checks,
      },
    },
  );

  return result;
}
```



然后在 `verify` 内用：



```TypeScript
return this.finish({
  valid: false,
  parsed,
  domain: domainCheck.domain,
  credentialType: domainCheck.credentialType,
  errors,
  warnings,
  checks,
  credential,
});
```



---



# 22\. Runtime 组装



## `core/vc-verify/create-vc-verify-runtime.ts`



```TypeScript
import { DIDResolverService } from '../did/did-resolver.service';
import { IssuerTrustService } from '../issuer/issuer-trust.service';
import { DomainSchemaPolicyService } from '../schema/domain-schema-policy.service';
import { SchemaValidationService } from '../schema/schema-validation.service';
import {
  InMemoryRevocationRegistryRepository,
} from '../revocation/revocation-registry.repository';
import { StatusList2021Service } from '../revocation/status-list2021.service';
import { OnChainRevocationService } from '../revocation/onchain-revocation.service';
import { WalletBindingRepository } from '../wallet-binding/wallet-binding.repository';

import { VCParserService } from './vc-parser.service';
import { VCBasicValidatorService } from './vc-basic-validator.service';
import { VCTimeValidatorService } from './vc-time-validator.service';
import { VCJsonLdVerifierService, JsonLdProofCryptoVerifier } from './vc-jsonld-verifier.service';
import { VCJwtVerifierService, JwtCryptoVerifier } from './vc-jwt-verifier.service';
import { VCEip712VerifierService, Eip712CryptoVerifier } from './vc-eip712-verifier.service';
import { VCStatusVerifierService } from './vc-status-verifier.service';
import { VCAnchorVerifierService, VCAnchorClient } from './vc-anchor-verifier.service';
import { VCHolderBindingVerifierService } from './vc-holder-binding-verifier.service';
import { VCDomainPolicyVerifierService } from './vc-domain-policy-verifier.service';
import { VCVerifyAuditService } from './vc-verify-audit.service';
import { VCVerifyPipelineService } from './vc-verify-pipeline.service';

export function createVCVerifyRuntime(input: {
  didResolver: DIDResolverService;
  issuerTrust: IssuerTrustService;
  schemaPolicy: DomainSchemaPolicyService;
  schemaValidation: SchemaValidationService;
  walletBindings?: WalletBindingRepository;

  jsonLdCryptoVerifier?: JsonLdProofCryptoVerifier;
  jwtCryptoVerifier?: JwtCryptoVerifier;
  eip712CryptoVerifier?: Eip712CryptoVerifier;
  anchorClient?: VCAnchorClient;
}) {
  const parser = new VCParserService();
  const basic = new VCBasicValidatorService();
  const time = new VCTimeValidatorService();

  const localRevocation = new InMemoryRevocationRegistryRepository();
  const statusList2021 = new StatusList2021Service();
  const onChainRevocation = new OnChainRevocationService();

  const statusVerifier = new VCStatusVerifierService(
    localRevocation,
    statusList2021,
    onChainRevocation,
  );

  const jsonLdVerifier = new VCJsonLdVerifierService(
    input.didResolver,
    input.jsonLdCryptoVerifier,
  );

  const jwtVerifier = new VCJwtVerifierService(
    input.didResolver,
    input.jwtCryptoVerifier,
  );

  const eip712Verifier = new VCEip712VerifierService(
    input.eip712CryptoVerifier,
  );

  const anchorVerifier = new VCAnchorVerifierService(
    input.anchorClient,
  );

  const holderBindingVerifier = new VCHolderBindingVerifierService(
    input.walletBindings,
  );

  const domainPolicyVerifier = new VCDomainPolicyVerifierService();

  const audit = new VCVerifyAuditService();

  const pipeline = new VCVerifyPipelineService(
    parser,
    basic,
    time,
    jsonLdVerifier,
    jwtVerifier,
    eip712Verifier,
    input.issuerTrust,
    input.schemaPolicy,
    input.schemaValidation,
    statusVerifier,
    anchorVerifier,
    holderBindingVerifier,
    domainPolicyVerifier,
    audit,
  );

  return {
    parser,
    basic,
    time,

    localRevocation,
    statusList2021,
    onChainRevocation,
    statusVerifier,

    jsonLdVerifier,
    jwtVerifier,
    eip712Verifier,

    anchorVerifier,
    holderBindingVerifier,
    domainPolicyVerifier,

    audit,
    pipeline,
  };
}
```



---



# 23\. 验证交易所 KYC VC



```TypeScript
const result = await vcVerify.pipeline.verify({
  credential: exchangeKycCredential,
  format: 'jsonld_vc',
  context: {
    domain: 'exchange',
    credentialType: 'ExchangeKYCLevel',
    expectedSubjectDid: 'did:pkh:eip155:1:0x1234...',
    verifySignature: true,
    verifyIssuerTrust: true,
    verifySchema: true,
    verifyStatus: true,
    verifyAnchor: true,
  },
});

if (!result.valid) {
  throw new Error(`EXCHANGE_KYC_VC_INVALID:${result.errors.join(',')}`);
}
```



---



# 24\. 验证博彩年龄证明



```TypeScript
const result = await vcVerify.pipeline.verify({
  credential: gamingAgeJwt,
  format: 'jwt_vc',
  context: {
    domain: 'gaming',
    credentialType: 'GamingAgeOver18',
    verifySignature: true,
    verifyIssuerTrust: true,
    verifySchema: true,
    verifyStatus: true,
  },
});

if (!result.valid) {
  throw new Error(`GAMING_AGE_VC_INVALID:${result.errors.join(',')}`);
}
```



关键要求：



```Plain Text
不得要求 VC 暴露出生日期
只验证 ageOver18 = true
Issuer 必须为博彩合规 Issuer
Schema privacyLevel 应为 zero_knowledge 或 selective_disclosure
```



---



# 25\. 验证金融合格投资者 VC



```TypeScript
const result = await vcVerify.pipeline.verify({
  credential: accreditedInvestorCredential,
  format: 'jsonld_vc',
  context: {
    domain: 'financial',
    credentialType: 'FinancialAccreditedInvestor',
    expectedSubjectDid: investorDid,
    verifySignature: true,
    verifyIssuerTrust: true,
    verifySchema: true,
    verifyStatus: true,
    verifyAnchor: true,
  },
});
```



必须检查：



```Plain Text
Issuer Trust Level = regulated_financial_institution
credentialType = FinancialAccreditedInvestor
schemaId = schema:financial:accredited-investor:v1
expirationDate 未过期
status 未撤销
```



---



# 26\. 验证跨境电商 Merchant KYB VC



```TypeScript
const result = await vcVerify.pipeline.verify({
  credential: merchantKybCredential,
  format: 'jsonld_vc',
  context: {
    domain: 'cross_border_commerce',
    credentialType: 'CommerceMerchantKYB',
    expectedSubjectDid: merchantDid,
    verifySignature: true,
    verifyIssuerTrust: true,
    verifySchema: true,
    verifyStatus: true,
  },
});
```



通过后可用于：



```Plain Text
merchant_onboard
seller_payout
cross_border_shipping
tax_invoice
```



---



# 27\. 验证萨摩亚企业家身份 VC



```TypeScript
const result = await vcVerify.pipeline.verify({
  credential: samoaEntrepreneurCredential,
  format: 'jsonld_vc',
  context: {
    domain: 'samoa_enterprise',
    credentialType: 'SamoaEntrepreneurIdentity',
    expectedSubjectDid: entrepreneurDid,
    verifySignature: true,
    verifyIssuerTrust: true,
    verifySchema: true,
    verifyStatus: true,
    verifyAnchor: true,
  },
});

if (!result.valid) {
  throw new Error(`SAMOA_ENTREPRENEUR_VC_INVALID:${result.errors.join(',')}`);
}
```



必须满足：



```Plain Text
issuer = did:web:identity.samoa.example 或官方授权 Issuer
schema = schema:samoa:entrepreneur-identity:v1
claims 包含 kycLevel / identityVerified / nationality / countryOfResidence
VC 未撤销
可选链上 anchor hash 匹配
```



---



# 28\. 验证萨摩亚公司注册证书 VC



```TypeScript
const result = await vcVerify.pipeline.verify({
  credential: incorporationCertificate,
  format: 'jsonld_vc',
  context: {
    domain: 'samoa_enterprise',
    credentialType: 'SamoaCompanyIncorporationCertificate',
    verifySignature: true,
    verifyIssuerTrust: true,
    verifySchema: true,
    verifyStatus: true,
    verifyAnchor: true,
  },
});

if (!result.valid) {
  throw new Error(`SAMOA_COMPANY_CERTIFICATE_INVALID:${result.errors.join(',')}`);
}
```



必须满足：



```Plain Text
issuer trustLevel = government
schema = schema:samoa:incorporation-certificate:v1
companyNumber 存在
companyNameHash 存在
incorporationDate 合理
credentialStatus 未撤销
credentialHash 链上锚定匹配
```



---



# 29\. 验证结果示例



```JSON
{
  "valid": true,
  "format": "jsonld_vc",
  "issuerDid": "did:web:identity.samoa.example",
  "subjectDid": "did:key:z...",
  "credentialId": "urn:vc:samoa-incorporation:...",
  "credentialHash": "0xabc...",
  "domain": "samoa_enterprise",
  "credentialType": "SamoaCompanyIncorporationCertificate",
  "errors": [],
  "warnings": [],
  "checks": [
    { "name": "structure", "passed": true },
    { "name": "domain_policy", "passed": true },
    { "name": "signature", "passed": true },
    { "name": "time", "passed": true },
    { "name": "schema", "passed": true },
    { "name": "issuer_trust", "passed": true },
    { "name": "status", "passed": true },
    { "name": "anchor", "passed": true }
  ]
}
```



---



# 30\. 业务动作前验证组合



## 30\.1 交易所提现



提现前必须验证：



```Plain Text
ExchangeKYCLevel
ExchangeWithdrawalPermission
WalletOwnership
ExchangeTravelRuleCompliance
SanctionsScreening
AMLScreening
```



---



## 30\.2 跨境电商卖家入驻



必须验证：



```Plain Text
CommerceMerchantKYB
CommerceTaxIdentity
SanctionsScreening
AddressProof / Registered Business Address
```



---



## 30\.3 博彩下注



必须验证：



```Plain Text
GamingAgeOver18 / GamingAgeOver21
GamingGeoEligibility
GamingSelfExclusionStatus
GamingResponsibleGamingLimit
GamingBettingPermission
```



---



## 30\.4 金融投资



必须验证：



```Plain Text
FinancialKYCLevel
FinancialRiskSuitability
FinancialAccreditedInvestor 或 FinancialInvestmentPermission
SanctionsScreening
PEPScreening
```



---



## 30\.5 萨摩亚公司设立



必须验证：



```Plain Text
SamoaEntrepreneurIdentity
SamoaFounderIdentity
SamoaDirectorIdentity
SamoaShareholderIdentity
SamoaUBODeclaration
SamoaRegisteredAgent
SamoaRegisteredOfficeAddress
SamoaAMLScreening
SamoaSanctionsScreening
SamoaPEPScreening
SamoaSourceOfFundsDeclaration
SamoaCompanyNameReservation
```



---



# 31\. 安全要求



VC 验证上线前必须满足：



```Plain Text
1. 不允许只验签就通过
2. Issuer 必须在 Trust Registry
3. Issuer 必须允许该 domain
4. Issuer 必须允许该 credentialType
5. Schema 必须 active
6. Claims 必须满足 requiredClaims
7. 过期 VC 必须失败
8. 已撤销 VC 必须失败
9. 高价值 VC 必须验证 anchor
10. Holder DID 必须匹配业务主体
11. 钱包绑定场景必须验证 active binding
12. 博彩年龄 VC 不得暴露 DOB
13. 金融资产 VC 不得暴露资产明细
14. 萨摩亚 UBO VC 不得明文上链
15. 验证结果必须审计
```



---



# 32\. 本章完成内容



本章完成：



```Plain Text
VC Verify 类型系统
VC Verify 错误体系
Credential Parser
Basic Structure Validator
Time Validator
JSON-LD VC Verifier
JWT VC Verifier
EIP-712 VC Verifier
StatusList2021 Service
On-chain Revocation Service
VC Status Verifier
VC Anchor Verifier
Holder Binding Verifier
Domain Policy Verifier
VC Verify Audit
VC Verify Pipeline
VC Verify Runtime
五大业务域验证示例
萨摩亚企业家 VC 验证
萨摩亚公司注册证书 VC 验证
```



现在 DID 系统具备完整 VC 验证能力：



```Plain Text
Parse
  -> Structure
  -> Signature
  -> Time
  -> Schema
  -> Issuer Trust
  -> Revocation
  -> Anchor
  -> Holder Binding
  -> Domain Policy
  -> Audit
```



---



# 33\. 下一章继续



下一章：



# 《DID 身份 Part 7：VC Status / Revocation：StatusList2021 / 链上撤销根 / 凭证生命周期》



将覆盖：



```Plain Text
Credential Status Issuer
StatusList2021 Credential
Bitstring Revocation
Suspension
On-chain Revocation Registry
Revocation Root Anchor
Credential Lifecycle
Issue / Active / Suspended / Revoked / Expired
五大业务域撤销规则
萨摩亚公司证书撤销
博彩自我排除状态更新
金融资格吊销
交易所提现权限吊销
跨境电商商户 KYB 吊销
```



