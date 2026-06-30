# A04\-《DID 身份 Part 4：Issuer 签发者体系 / Trust Registry / Schema Registry》

# 《DID 身份 Part 4：Issuer 签发者体系 / Trust Registry / Schema Registry》



本章实现 DID 身份系统的签发者与 Schema 治理层，覆盖：



- Issuer DID 注册

- Issuer Trust Registry

- Issuer Trust Level

- Issuer Domain Scope

- Issuer Credential Permission

- Issuer Key Rotation

- Issuer Suspension / Revocation

- Schema Registry

- 五大业务域 Schema 绑定

- 萨摩亚官方 Issuer

- 金融 Issuer

- 交易所 Issuer

- 博彩合规 Issuer

- 跨境电商 Issuer

- Issuer 审计

    

核心目标：



```Plain Text
不是任何 DID 都可以签发任何 VC。
Issuer 必须被注册、被信任、被授权到具体业务域和具体 Credential Type。
Schema 必须注册、版本化、可停用、可验证。
```



---



# 1\. 本章目录



```Bash
src/modules/did/
  core/
    issuer/
      issuer.types.ts
      issuer.errors.ts
      issuer.repository.ts
      issuer-registry.service.ts
      issuer-trust.service.ts
      issuer-permission.service.ts
      issuer-key-rotation.service.ts
      issuer-audit.service.ts

    schema/
      schema.types.ts
      schema.errors.ts
      schema.repository.ts
      schema-hash.service.ts
      schema-registry.service.ts
      schema-validation.service.ts
      domain-schema-policy.service.ts

    domain/
      default-domain-schema-bindings.ts
```



---



# 2\. Issuer 类型增强



## `core/issuer/issuer.types.ts`



```TypeScript
import { DIDString, DIDUrl } from '../did/did.types';
import { DIDBusinessDomain } from '../domain/did-domain.types';
import { DomainCredentialType } from '../domain/did-domain-credential.types';

export type IssuerStatus =
  | 'active'
  | 'suspended'
  | 'revoked'
  | 'pending_review';

export type IssuerTrustLevel =
  | 'system'
  | 'government'
  | 'regulated_financial_institution'
  | 'licensed_operator'
  | 'verified_partner'
  | 'community'
  | 'unknown';

export type IssuerKeyStatus =
  | 'active'
  | 'rotated'
  | 'revoked'
  | 'compromised';

export interface IssuerVerificationMethod {
  keyId: DIDUrl;
  type: string;
  status: IssuerKeyStatus;
  publicKeyJwk?: JsonWebKey;
  publicKeyMultibase?: string;
  addedAt: number;
  rotatedAt?: number;
  revokedAt?: number;
}

export interface TrustedIssuer {
  issuerId: string;

  did: DIDString;
  name: string;
  legalName?: string;
  description?: string;

  domain?: string;
  website?: string;
  logoUrl?: string;

  trustLevel: IssuerTrustLevel;
  status: IssuerStatus;

  allowedDomains: DIDBusinessDomain[];
  allowedCredentialTypes: DomainCredentialType[];
  allowedSchemas: string[];

  verificationMethods: IssuerVerificationMethod[];

  jurisdiction?: string;
  countryCode?: string;
  licenseNumber?: string;
  regulatorName?: string;

  metadata?: Record;

  createdAt: number;
  updatedAt: number;
  suspendedAt?: number;
  revokedAt?: number;
}

export interface IssuerRegistrationInput {
  did: DIDString;
  name: string;
  legalName?: string;
  description?: string;

  domain?: string;
  website?: string;
  logoUrl?: string;

  trustLevel: IssuerTrustLevel;

  allowedDomains: DIDBusinessDomain[];
  allowedCredentialTypes: DomainCredentialType[];
  allowedSchemas: string[];

  verificationMethods?: IssuerVerificationMethod[];

  jurisdiction?: string;
  countryCode?: string;
  licenseNumber?: string;
  regulatorName?: string;

  metadata?: Record;
}

export interface IssuerCheckInput {
  issuerDid: DIDString;
  domain: DIDBusinessDomain;
  credentialType: DomainCredentialType;
  schemaId?: string;
}

export interface IssuerCheckResult {
  trusted: boolean;
  reason?: string;
  issuer?: TrustedIssuer;
}

export interface JsonWebKey {
  kty: string;
  crv?: string;
  x?: string;
  y?: string;
  e?: string;
  n?: string;
  kid?: string;
  alg?: string;
  use?: string;
  key_ops?: string[];
}
```



---



# 3\. Issuer 错误体系



## `core/issuer/issuer.errors.ts`



```TypeScript
export class IssuerError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'IssuerError';
  }
}

export const IssuerErrors = {
  ISSUER_NOT_FOUND: (did?: string) =>
    new IssuerError(
      'ISSUER_NOT_FOUND',
      'Issuer not found',
      { did },
    ),

  ISSUER_NOT_ACTIVE: (did?: string, status?: string) =>
    new IssuerError(
      'ISSUER_NOT_ACTIVE',
      'Issuer is not active',
      { did, status },
    ),

  ISSUER_DOMAIN_NOT_ALLOWED: (details?: unknown) =>
    new IssuerError(
      'ISSUER_DOMAIN_NOT_ALLOWED',
      'Issuer is not allowed for this domain',
      details,
    ),

  ISSUER_CREDENTIAL_NOT_ALLOWED: (details?: unknown) =>
    new IssuerError(
      'ISSUER_CREDENTIAL_NOT_ALLOWED',
      'Issuer is not allowed to issue this credential type',
      details,
    ),

  ISSUER_SCHEMA_NOT_ALLOWED: (details?: unknown) =>
    new IssuerError(
      'ISSUER_SCHEMA_NOT_ALLOWED',
      'Issuer is not allowed to use this schema',
      details,
    ),

  ISSUER_KEY_NOT_ACTIVE: (details?: unknown) =>
    new IssuerError(
      'ISSUER_KEY_NOT_ACTIVE',
      'Issuer verification method is not active',
      details,
    ),

  ISSUER_REVOKED: (did?: string) =>
    new IssuerError(
      'ISSUER_REVOKED',
      'Issuer has been revoked',
      { did },
    ),
};
```



---



# 4\. Issuer Repository



## `core/issuer/issuer.repository.ts`



```TypeScript
import {
  IssuerRegistrationInput,
  TrustedIssuer,
} from './issuer.types';

export interface IssuerRepository {
  create(input: TrustedIssuer): Promise;
  update(input: TrustedIssuer): Promise;
  getByDid(did: string): Promise;
  getById(issuerId: string): Promise;
  list(query?: {
    status?: string;
    trustLevel?: string;
    domain?: string;
    credentialType?: string;
  }): Promise;
}

export class InMemoryIssuerRepository implements IssuerRepository {
  private readonly issuers = new Map();

  async create(input: TrustedIssuer): Promise {
    this.issuers.set(input.did, input);
  }

  async update(input: TrustedIssuer): Promise {
    this.issuers.set(input.did, input);
  }

  async getByDid(did: string): Promise {
    return this.issuers.get(did) ?? null;
  }

  async getById(issuerId: string): Promise {
    return (
      Array.from(this.issuers.values()).find(
        (item) => item.issuerId === issuerId,
      ) ?? null
    );
  }

  async list(query: {
    status?: string;
    trustLevel?: string;
    domain?: string;
    credentialType?: string;
  } = {}): Promise {
    return Array.from(this.issuers.values())
      .filter((item) => !query.status || item.status === query.status)
      .filter((item) => !query.trustLevel || item.trustLevel === query.trustLevel)
      .filter((item) => !query.domain || item.allowedDomains.includes(query.domain as any))
      .filter((item) => !query.credentialType || item.allowedCredentialTypes.includes(query.credentialType as any))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }
}

export function buildTrustedIssuer(
  input: IssuerRegistrationInput,
): TrustedIssuer {
  const now = Date.now();

  return {
    issuerId: `ISS-${now}-${Math.random().toString(36).slice(2, 12)}`,
    did: input.did,
    name: input.name,
    legalName: input.legalName,
    description: input.description,
    domain: input.domain,
    website: input.website,
    logoUrl: input.logoUrl,
    trustLevel: input.trustLevel,
    status: 'active',
    allowedDomains: input.allowedDomains,
    allowedCredentialTypes: input.allowedCredentialTypes,
    allowedSchemas: input.allowedSchemas,
    verificationMethods: input.verificationMethods ?? [],
    jurisdiction: input.jurisdiction,
    countryCode: input.countryCode,
    licenseNumber: input.licenseNumber,
    regulatorName: input.regulatorName,
    metadata: input.metadata,
    createdAt: now,
    updatedAt: now,
  };
}
```



---



# 5\. Issuer Audit Service



## `core/issuer/issuer-audit.service.ts`



```TypeScript
export type IssuerAuditAction =
  | 'issuer.registered'
  | 'issuer.updated'
  | 'issuer.suspended'
  | 'issuer.reactivated'
  | 'issuer.revoked'
  | 'issuer.key.added'
  | 'issuer.key.rotated'
  | 'issuer.key.revoked'
  | 'issuer.permission.checked';

export interface IssuerAuditRecord {
  auditNo: string;
  action: IssuerAuditAction;
  result: 'success' | 'failed' | 'denied';

  issuerDid?: string;
  issuerId?: string;
  domain?: string;
  credentialType?: string;
  schemaId?: string;

  metadata?: unknown;
  error?: unknown;

  createdAt: number;
}

export interface IssuerAuditSink {
  record(input: IssuerAuditRecord): Promise;
}

export class ConsoleIssuerAuditSink implements IssuerAuditSink {
  async record(input: IssuerAuditRecord): Promise {
    console.log('[IssuerAudit]', input);
  }
}

export class IssuerAuditService {
  constructor(
    private readonly sink: IssuerAuditSink = new ConsoleIssuerAuditSink(),
  ) {}

  async success(
    action: IssuerAuditAction,
    input: Omit,
  ) {
    await this.record(action, 'success', input);
  }

  async denied(
    action: IssuerAuditAction,
    input: Omit,
  ) {
    await this.record(action, 'denied', input);
  }

  async failed(
    action: IssuerAuditAction,
    input: Omit,
  ) {
    await this.record(action, 'failed', input);
  }

  private async record(
    action: IssuerAuditAction,
    result: IssuerAuditRecord['result'],
    input: Omit,
  ) {
    await this.sink.record({
      auditNo: `IAUD-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`,
      action,
      result,
      ...input,
      createdAt: Date.now(),
    });
  }
}
```



---



# 6\. Issuer Registry Service



## `core/issuer/issuer-registry.service.ts`



```TypeScript
import {
  IssuerRegistrationInput,
  IssuerVerificationMethod,
  TrustedIssuer,
} from './issuer.types';
import {
  buildTrustedIssuer,
  IssuerRepository,
} from './issuer.repository';
import { IssuerErrors } from './issuer.errors';
import { IssuerAuditService } from './issuer-audit.service';

export class IssuerRegistryService {
  constructor(
    private readonly repo: IssuerRepository,
    private readonly audit: IssuerAuditService,
  ) {}

  async register(input: IssuerRegistrationInput): Promise {
    const existing = await this.repo.getByDid(input.did);

    if (existing && existing.status !== 'revoked') {
      throw new Error(`ISSUER_ALREADY_EXISTS:${input.did}`);
    }

    const issuer = buildTrustedIssuer(input);

    await this.repo.create(issuer);

    await this.audit.success('issuer.registered', {
      issuerDid: issuer.did,
      issuerId: issuer.issuerId,
      metadata: issuer,
    });

    return issuer;
  }

  async getByDid(did: string): Promise {
    return this.repo.getByDid(did);
  }

  async requireActiveIssuer(did: string): Promise {
    const issuer = await this.repo.getByDid(did);

    if (!issuer) {
      throw IssuerErrors.ISSUER_NOT_FOUND(did);
    }

    if (issuer.status === 'revoked') {
      throw IssuerErrors.ISSUER_REVOKED(did);
    }

    if (issuer.status !== 'active') {
      throw IssuerErrors.ISSUER_NOT_ACTIVE(did, issuer.status);
    }

    return issuer;
  }

  async updatePermissions(input: {
    issuerDid: string;
    allowedDomains?: TrustedIssuer['allowedDomains'];
    allowedCredentialTypes?: TrustedIssuer['allowedCredentialTypes'];
    allowedSchemas?: string[];
  }): Promise {
    const issuer = await this.requireActiveIssuer(input.issuerDid);

    const updated: TrustedIssuer = {
      ...issuer,
      allowedDomains: input.allowedDomains ?? issuer.allowedDomains,
      allowedCredentialTypes:
        input.allowedCredentialTypes ?? issuer.allowedCredentialTypes,
      allowedSchemas: input.allowedSchemas ?? issuer.allowedSchemas,
      updatedAt: Date.now(),
    };

    await this.repo.update(updated);

    await this.audit.success('issuer.updated', {
      issuerDid: updated.did,
      issuerId: updated.issuerId,
      metadata: {
        allowedDomains: updated.allowedDomains,
        allowedCredentialTypes: updated.allowedCredentialTypes,
        allowedSchemas: updated.allowedSchemas,
      },
    });

    return updated;
  }

  async suspend(input: {
    issuerDid: string;
    reason?: string;
  }): Promise {
    const issuer = await this.requireActiveIssuer(input.issuerDid);

    const updated: TrustedIssuer = {
      ...issuer,
      status: 'suspended',
      suspendedAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {
        ...(issuer.metadata ?? {}),
        suspensionReason: input.reason,
      },
    };

    await this.repo.update(updated);

    await this.audit.success('issuer.suspended', {
      issuerDid: issuer.did,
      issuerId: issuer.issuerId,
      metadata: {
        reason: input.reason,
      },
    });

    return updated;
  }

  async reactivate(issuerDid: string): Promise {
    const issuer = await this.repo.getByDid(issuerDid);

    if (!issuer) throw IssuerErrors.ISSUER_NOT_FOUND(issuerDid);
    if (issuer.status === 'revoked') throw IssuerErrors.ISSUER_REVOKED(issuerDid);

    const updated: TrustedIssuer = {
      ...issuer,
      status: 'active',
      updatedAt: Date.now(),
    };

    await this.repo.update(updated);

    await this.audit.success('issuer.reactivated', {
      issuerDid: updated.did,
      issuerId: updated.issuerId,
    });

    return updated;
  }

  async revoke(input: {
    issuerDid: string;
    reason?: string;
  }): Promise {
    const issuer = await this.repo.getByDid(input.issuerDid);

    if (!issuer) throw IssuerErrors.ISSUER_NOT_FOUND(input.issuerDid);

    const updated: TrustedIssuer = {
      ...issuer,
      status: 'revoked',
      revokedAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {
        ...(issuer.metadata ?? {}),
        revocationReason: input.reason,
      },
    };

    await this.repo.update(updated);

    await this.audit.success('issuer.revoked', {
      issuerDid: updated.did,
      issuerId: updated.issuerId,
      metadata: {
        reason: input.reason,
      },
    });

    return updated;
  }

  async addVerificationMethod(input: {
    issuerDid: string;
    method: IssuerVerificationMethod;
  }): Promise {
    const issuer = await this.requireActiveIssuer(input.issuerDid);

    const updated: TrustedIssuer = {
      ...issuer,
      verificationMethods: [
        ...issuer.verificationMethods,
        input.method,
      ],
      updatedAt: Date.now(),
    };

    await this.repo.update(updated);

    await this.audit.success('issuer.key.added', {
      issuerDid: issuer.did,
      issuerId: issuer.issuerId,
      metadata: input.method,
    });

    return updated;
  }
}
```



---



# 7\. Issuer Permission Service



签发 VC 前必须调用。



## `core/issuer/issuer-permission.service.ts`



```TypeScript
import { DIDBusinessDomain } from '../domain/did-domain.types';
import { DomainCredentialType } from '../domain/did-domain-credential.types';
import { IssuerRegistryService } from './issuer-registry.service';
import { IssuerErrors } from './issuer.errors';
import { IssuerAuditService } from './issuer-audit.service';

export class IssuerPermissionService {
  constructor(
    private readonly registry: IssuerRegistryService,
    private readonly audit: IssuerAuditService,
  ) {}

  async assertCanIssue(input: {
    issuerDid: string;
    domain: DIDBusinessDomain;
    credentialType: DomainCredentialType;
    schemaId?: string;
  }) {
    try {
      const issuer = await this.registry.requireActiveIssuer(input.issuerDid);

      if (!issuer.allowedDomains.includes(input.domain)) {
        await this.audit.denied('issuer.permission.checked', {
          issuerDid: input.issuerDid,
          domain: input.domain,
          credentialType: input.credentialType,
          schemaId: input.schemaId,
          metadata: {
            reason: 'DOMAIN_NOT_ALLOWED',
            allowedDomains: issuer.allowedDomains,
          },
        });

        throw IssuerErrors.ISSUER_DOMAIN_NOT_ALLOWED(input);
      }

      if (!issuer.allowedCredentialTypes.includes(input.credentialType)) {
        await this.audit.denied('issuer.permission.checked', {
          issuerDid: input.issuerDid,
          domain: input.domain,
          credentialType: input.credentialType,
          schemaId: input.schemaId,
          metadata: {
            reason: 'CREDENTIAL_TYPE_NOT_ALLOWED',
            allowedCredentialTypes: issuer.allowedCredentialTypes,
          },
        });

        throw IssuerErrors.ISSUER_CREDENTIAL_NOT_ALLOWED(input);
      }

      if (
        input.schemaId &&
        issuer.allowedSchemas.length > 0 &&
        !issuer.allowedSchemas.includes(input.schemaId)
      ) {
        await this.audit.denied('issuer.permission.checked', {
          issuerDid: input.issuerDid,
          domain: input.domain,
          credentialType: input.credentialType,
          schemaId: input.schemaId,
          metadata: {
            reason: 'SCHEMA_NOT_ALLOWED',
            allowedSchemas: issuer.allowedSchemas,
          },
        });

        throw IssuerErrors.ISSUER_SCHEMA_NOT_ALLOWED(input);
      }

      await this.audit.success('issuer.permission.checked', {
        issuerDid: input.issuerDid,
        issuerId: issuer.issuerId,
        domain: input.domain,
        credentialType: input.credentialType,
        schemaId: input.schemaId,
      });

      return issuer;
    } catch (error) {
      if (error instanceof Error && error.name === 'IssuerError') {
        throw error;
      }

      await this.audit.failed('issuer.permission.checked', {
        issuerDid: input.issuerDid,
        domain: input.domain,
        credentialType: input.credentialType,
        schemaId: input.schemaId,
        error,
      });

      throw error;
    }
  }
}
```



---



# 8\. Issuer Trust Service



验证 VC 时使用。



## `core/issuer/issuer-trust.service.ts`



```TypeScript
import { IssuerCheckInput, IssuerCheckResult } from './issuer.types';
import { IssuerRegistryService } from './issuer-registry.service';

export class IssuerTrustService {
  constructor(
    private readonly registry: IssuerRegistryService,
  ) {}

  async check(input: IssuerCheckInput): Promise {
    const issuer = await this.registry.getByDid(input.issuerDid);

    if (!issuer) {
      return {
        trusted: false,
        reason: 'ISSUER_NOT_FOUND',
      };
    }

    if (issuer.status !== 'active') {
      return {
        trusted: false,
        reason: `ISSUER_STATUS_${issuer.status.toUpperCase()}`,
        issuer,
      };
    }

    if (!issuer.allowedDomains.includes(input.domain)) {
      return {
        trusted: false,
        reason: 'DOMAIN_NOT_ALLOWED',
        issuer,
      };
    }

    if (!issuer.allowedCredentialTypes.includes(input.credentialType)) {
      return {
        trusted: false,
        reason: 'CREDENTIAL_TYPE_NOT_ALLOWED',
        issuer,
      };
    }

    if (
      input.schemaId &&
      issuer.allowedSchemas.length > 0 &&
      !issuer.allowedSchemas.includes(input.schemaId)
    ) {
      return {
        trusted: false,
        reason: 'SCHEMA_NOT_ALLOWED',
        issuer,
      };
    }

    return {
      trusted: true,
      issuer,
    };
  }
}
```



---



# 9\. Issuer Key Rotation Service



## `core/issuer/issuer-key-rotation.service.ts`



```TypeScript
import { DIDUrl } from '../did/did.types';
import { IssuerRegistryService } from './issuer-registry.service';
import { IssuerRepository } from './issuer.repository';
import { IssuerErrors } from './issuer.errors';
import { IssuerAuditService } from './issuer-audit.service';

export class IssuerKeyRotationService {
  constructor(
    private readonly registry: IssuerRegistryService,
    private readonly repo: IssuerRepository,
    private readonly audit: IssuerAuditService,
  ) {}

  async rotateKey(input: {
    issuerDid: string;
    oldKeyId: DIDUrl;
    newKey: {
      keyId: DIDUrl;
      type: string;
      publicKeyJwk?: unknown;
      publicKeyMultibase?: string;
    };
  }) {
    const issuer = await this.registry.requireActiveIssuer(input.issuerDid);

    const existing = issuer.verificationMethods.find(
      (item) => item.keyId === input.oldKeyId,
    );

    if (!existing) {
      throw IssuerErrors.ISSUER_KEY_NOT_ACTIVE({
        oldKeyId: input.oldKeyId,
      });
    }

    if (existing.status !== 'active') {
      throw IssuerErrors.ISSUER_KEY_NOT_ACTIVE({
        oldKeyId: input.oldKeyId,
        status: existing.status,
      });
    }

    const now = Date.now();

    const updated = {
      ...issuer,
      verificationMethods: issuer.verificationMethods.map((item) =>
        item.keyId === input.oldKeyId
          ? {
              ...item,
              status: 'rotated' as const,
              rotatedAt: now,
            }
          : item,
      ).concat({
        keyId: input.newKey.keyId,
        type: input.newKey.type,
        status: 'active' as const,
        publicKeyJwk: input.newKey.publicKeyJwk as any,
        publicKeyMultibase: input.newKey.publicKeyMultibase,
        addedAt: now,
      }),
      updatedAt: now,
    };

    await this.repo.update(updated);

    await this.audit.success('issuer.key.rotated', {
      issuerDid: issuer.did,
      issuerId: issuer.issuerId,
      metadata: {
        oldKeyId: input.oldKeyId,
        newKeyId: input.newKey.keyId,
      },
    });

    return updated;
  }

  async revokeKey(input: {
    issuerDid: string;
    keyId: DIDUrl;
    reason?: string;
  }) {
    const issuer = await this.registry.requireActiveIssuer(input.issuerDid);

    const now = Date.now();

    const updated = {
      ...issuer,
      verificationMethods: issuer.verificationMethods.map((item) =>
        item.keyId === input.keyId
          ? {
              ...item,
              status: 'revoked' as const,
              revokedAt: now,
            }
          : item,
      ),
      updatedAt: now,
      metadata: {
        ...(issuer.metadata ?? {}),
        revokedKeyReason: input.reason,
      },
    };

    await this.repo.update(updated);

    await this.audit.success('issuer.key.revoked', {
      issuerDid: issuer.did,
      issuerId: issuer.issuerId,
      metadata: {
        keyId: input.keyId,
        reason: input.reason,
      },
    });

    return updated;
  }
}
```



---



# 10\. Schema 类型



## `core/schema/schema.types.ts`



```TypeScript
import { DIDBusinessDomain } from '../domain/did-domain.types';
import { DomainCredentialType } from '../domain/did-domain-credential.types';

export type SchemaStatus =
  | 'active'
  | 'deprecated'
  | 'disabled'
  | 'draft';

export interface CredentialSchemaRecord {
  schemaId: string;
  name: string;
  version: string;
  description?: string;

  domain: DIDBusinessDomain;
  credentialType: DomainCredentialType;

  jsonSchema: Record;
  hash: string;

  requiredClaims: string[];

  privacyLevel:
    | 'public'
    | 'private'
    | 'selective_disclosure'
    | 'zero_knowledge';

  status: SchemaStatus;

  authorDid?: string;

  createdAt: number;
  updatedAt: number;
}

export interface SchemaRegistrationInput {
  schemaId?: string;
  name: string;
  version: string;
  description?: string;

  domain: DIDBusinessDomain;
  credentialType: DomainCredentialType;

  jsonSchema: Record;
  requiredClaims: string[];

  privacyLevel:
    | 'public'
    | 'private'
    | 'selective_disclosure'
    | 'zero_knowledge';

  authorDid?: string;
}

export interface SchemaQuery {
  domain?: DIDBusinessDomain;
  credentialType?: DomainCredentialType;
  status?: SchemaStatus;
}
```



---



# 11\. Schema 错误体系



## `core/schema/schema.errors.ts`



```TypeScript
export class SchemaError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'SchemaError';
  }
}

export const SchemaErrors = {
  SCHEMA_NOT_FOUND: (schemaId?: string) =>
    new SchemaError(
      'SCHEMA_NOT_FOUND',
      'Credential schema not found',
      { schemaId },
    ),

  SCHEMA_DISABLED: (schemaId?: string) =>
    new SchemaError(
      'SCHEMA_DISABLED',
      'Credential schema is disabled',
      { schemaId },
    ),

  SCHEMA_DEPRECATED: (schemaId?: string) =>
    new SchemaError(
      'SCHEMA_DEPRECATED',
      'Credential schema is deprecated',
      { schemaId },
    ),

  SCHEMA_INVALID: (details?: unknown) =>
    new SchemaError(
      'SCHEMA_INVALID',
      'Credential schema invalid',
      details,
    ),

  CLAIMS_NOT_MATCH_SCHEMA: (details?: unknown) =>
    new SchemaError(
      'CLAIMS_NOT_MATCH_SCHEMA',
      'Credential claims do not match schema',
      details,
    ),
};
```



---



# 12\. Schema Hash Service



## `core/schema/schema-hash.service.ts`



```TypeScript
import { AnchorHashService } from '../anchor/anchor-hash.service';

export class SchemaHashService {
  constructor(
    private readonly hash = new AnchorHashService(),
  ) {}

  hashSchema(input: {
    jsonSchema: Record;
    domain: string;
    credentialType: string;
    version: string;
  }): string {
    return this.hash.hashJson({
      domain: input.domain,
      credentialType: input.credentialType,
      version: input.version,
      jsonSchema: input.jsonSchema,
    });
  }
}
```



---



# 13\. Schema Repository



## `core/schema/schema.repository.ts`



```TypeScript
import {
  CredentialSchemaRecord,
  SchemaQuery,
} from './schema.types';

export interface SchemaRepository {
  create(schema: CredentialSchemaRecord): Promise;
  update(schema: CredentialSchemaRecord): Promise;
  get(schemaId: string): Promise;
  list(query?: SchemaQuery): Promise;
}

export class InMemorySchemaRepository implements SchemaRepository {
  private readonly schemas = new Map();

  async create(schema: CredentialSchemaRecord): Promise {
    this.schemas.set(schema.schemaId, schema);
  }

  async update(schema: CredentialSchemaRecord): Promise {
    this.schemas.set(schema.schemaId, schema);
  }

  async get(schemaId: string): Promise {
    return this.schemas.get(schemaId) ?? null;
  }

  async list(query: SchemaQuery = {}): Promise {
    return Array.from(this.schemas.values())
      .filter((item) => !query.domain || item.domain === query.domain)
      .filter((item) => !query.credentialType || item.credentialType === query.credentialType)
      .filter((item) => !query.status || item.status === query.status)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }
}
```



---



# 14\. Schema Registry Service



## `core/schema/schema-registry.service.ts`



```TypeScript
import {
  CredentialSchemaRecord,
  SchemaRegistrationInput,
} from './schema.types';
import { SchemaRepository } from './schema.repository';
import { SchemaHashService } from './schema-hash.service';
import { SchemaErrors } from './schema.errors';

export class SchemaRegistryService {
  constructor(
    private readonly repo: SchemaRepository,
    private readonly hashService: SchemaHashService,
  ) {}

  async register(input: SchemaRegistrationInput): Promise {
    const now = Date.now();

    const schemaId =
      input.schemaId ??
      `schema:${input.domain}:${input.credentialType}:${input.version}`;

    const schema: CredentialSchemaRecord = {
      schemaId,
      name: input.name,
      version: input.version,
      description: input.description,
      domain: input.domain,
      credentialType: input.credentialType,
      jsonSchema: input.jsonSchema,
      hash: this.hashService.hashSchema({
        jsonSchema: input.jsonSchema,
        domain: input.domain,
        credentialType: input.credentialType,
        version: input.version,
      }),
      requiredClaims: input.requiredClaims,
      privacyLevel: input.privacyLevel,
      status: 'active',
      authorDid: input.authorDid,
      createdAt: now,
      updatedAt: now,
    };

    await this.repo.create(schema);

    return schema;
  }

  async requireActive(schemaId: string): Promise {
    const schema = await this.repo.get(schemaId);

    if (!schema) {
      throw SchemaErrors.SCHEMA_NOT_FOUND(schemaId);
    }

    if (schema.status === 'disabled') {
      throw SchemaErrors.SCHEMA_DISABLED(schemaId);
    }

    if (schema.status === 'deprecated') {
      throw SchemaErrors.SCHEMA_DEPRECATED(schemaId);
    }

    if (schema.status !== 'active') {
      throw SchemaErrors.SCHEMA_INVALID({
        schemaId,
        status: schema.status,
      });
    }

    return schema;
  }

  async deprecate(schemaId: string): Promise {
    const schema = await this.requireExisting(schemaId);

    const updated: CredentialSchemaRecord = {
      ...schema,
      status: 'deprecated',
      updatedAt: Date.now(),
    };

    await this.repo.update(updated);

    return updated;
  }

  async disable(schemaId: string): Promise {
    const schema = await this.requireExisting(schemaId);

    const updated: CredentialSchemaRecord = {
      ...schema,
      status: 'disabled',
      updatedAt: Date.now(),
    };

    await this.repo.update(updated);

    return updated;
  }

  async list(query?: Parameters[0]) {
    return this.repo.list(query);
  }

  private async requireExisting(schemaId: string): Promise {
    const schema = await this.repo.get(schemaId);

    if (!schema) {
      throw SchemaErrors.SCHEMA_NOT_FOUND(schemaId);
    }

    return schema;
  }
}
```



---



# 15\. Schema Validation Service



轻量 JSON Schema 校验器。生产建议接 `ajv`：



```Bash
npm install ajv
```



这里先给不依赖外部库的强制字段校验。



## `core/schema/schema-validation.service.ts`



```TypeScript
import { CredentialSchemaRecord } from './schema.types';
import { SchemaErrors } from './schema.errors';

export class SchemaValidationService {
  validateClaims(input: {
    schema: CredentialSchemaRecord;
    claims: Record;
  }): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const claim of input.schema.requiredClaims) {
      if (!(claim in input.claims)) {
        errors.push(`REQUIRED_CLAIM_MISSING:${claim}`);
      }
    }

    const schemaProperties =
      (input.schema.jsonSchema.properties ?? {}) as Record;

    for (const key of Object.keys(input.claims)) {
      if (
        Object.keys(schemaProperties).length > 0 &&
        !(key in schemaProperties)
      ) {
        warnings.push(`CLAIM_NOT_IN_SCHEMA:${key}`);
      }
    }

    if (errors.length > 0) {
      return {
        valid: false,
        errors,
        warnings,
      };
    }

    return {
      valid: true,
      errors,
      warnings,
    };
  }

  assertClaims(input: {
    schema: CredentialSchemaRecord;
    claims: Record;
  }) {
    const result = this.validateClaims(input);

    if (!result.valid) {
      throw SchemaErrors.CLAIMS_NOT_MATCH_SCHEMA(result);
    }

    return result;
  }
}
```



---



# 16\. Domain Schema Policy Service



业务域 \+ Credential Type 必须找到 Schema。



## `core/schema/domain-schema-policy.service.ts`



```TypeScript
import { DIDBusinessDomain } from '../domain/did-domain.types';
import { DomainCredentialType } from '../domain/did-domain-credential.types';
import { SchemaRegistryService } from './schema-registry.service';

export class DomainSchemaPolicyService {
  constructor(
    private readonly schemaRegistry: SchemaRegistryService,
  ) {}

  async resolveSchema(input: {
    domain: DIDBusinessDomain;
    credentialType: DomainCredentialType;
    schemaId?: string;
  }) {
    if (input.schemaId) {
      return this.schemaRegistry.requireActive(input.schemaId);
    }

    const schemas = await this.schemaRegistry.list({
      domain: input.domain,
      credentialType: input.credentialType,
      status: 'active',
    });

    if (schemas.length === 0) {
      throw new Error(
        `NO_ACTIVE_SCHEMA:${input.domain}:${input.credentialType}`,
      );
    }

    return schemas[0];
  }
}
```



---



# 17\. 五大业务域默认 Schema Bindings



## `core/domain/default-domain-schema-bindings.ts`



```TypeScript
import { DomainCredentialSchemaBinding } from './did-domain-credential.types';
import { SAMOA_ENTERPRISE_SCHEMA_BINDINGS } from '../domains/samoa-enterprise/samoa-enterprise-schema.service';

export const DEFAULT_DOMAIN_SCHEMA_BINDINGS: DomainCredentialSchemaBinding[] = [
  {
    domain: 'exchange',
    credentialType: 'ExchangeKYCLevel',
    schemaId: 'schema:exchange:kyc-level:v1',
    schemaVersion: '1.0.0',
    requiredClaims: ['kycLevel', 'verifiedAt', 'provider'],
    privacyLevel: 'selective_disclosure',
  },
  {
    domain: 'exchange',
    credentialType: 'ExchangeWithdrawalPermission',
    schemaId: 'schema:exchange:withdrawal-permission:v1',
    schemaVersion: '1.0.0',
    requiredClaims: ['allowed', 'limitDaily', 'issuedAt'],
    privacyLevel: 'private',
  },
  {
    domain: 'exchange',
    credentialType: 'ExchangeTravelRuleCompliance',
    schemaId: 'schema:exchange:travel-rule:v1',
    schemaVersion: '1.0.0',
    requiredClaims: ['vaspId', 'complianceStatus', 'checkedAt'],
    privacyLevel: 'private',
  },
  {
    domain: 'cross_border_commerce',
    credentialType: 'CommerceMerchantKYB',
    schemaId: 'schema:commerce:merchant-kyb:v1',
    schemaVersion: '1.0.0',
    requiredClaims: ['merchantId', 'kybLevel', 'verifiedAt'],
    privacyLevel: 'selective_disclosure',
  },
  {
    domain: 'cross_border_commerce',
    credentialType: 'CommerceTaxIdentity',
    schemaId: 'schema:commerce:tax-identity:v1',
    schemaVersion: '1.0.0',
    requiredClaims: ['taxResidency', 'taxIdHash', 'verifiedAt'],
    privacyLevel: 'private',
  },
  {
    domain: 'gaming',
    credentialType: 'GamingAgeOver18',
    schemaId: 'schema:gaming:age-over-18:v1',
    schemaVersion: '1.0.0',
    requiredClaims: ['ageOver18', 'verifiedAt', 'provider'],
    privacyLevel: 'zero_knowledge',
  },
  {
    domain: 'gaming',
    credentialType: 'GamingGeoEligibility',
    schemaId: 'schema:gaming:geo-eligibility:v1',
    schemaVersion: '1.0.0',
    requiredClaims: ['eligible', 'jurisdiction', 'checkedAt'],
    privacyLevel: 'private',
  },
  {
    domain: 'financial',
    credentialType: 'FinancialKYCLevel',
    schemaId: 'schema:financial:kyc-level:v1',
    schemaVersion: '1.0.0',
    requiredClaims: ['kycLevel', 'verifiedAt', 'provider'],
    privacyLevel: 'selective_disclosure',
  },
  {
    domain: 'financial',
    credentialType: 'FinancialRiskSuitability',
    schemaId: 'schema:financial:risk-suitability:v1',
    schemaVersion: '1.0.0',
    requiredClaims: ['riskLevel', 'assessmentDate', 'validUntil'],
    privacyLevel: 'private',
  },
  {
    domain: 'financial',
    credentialType: 'FinancialAccreditedInvestor',
    schemaId: 'schema:financial:accredited-investor:v1',
    schemaVersion: '1.0.0',
    requiredClaims: ['accredited', 'jurisdiction', 'verifiedAt'],
    privacyLevel: 'selective_disclosure',
  },
  ...SAMOA_ENTERPRISE_SCHEMA_BINDINGS,
];
```



---



# 18\. 默认 Schema 注册器



## `core/schema/register-default-schemas.service.ts`



```TypeScript
import { DEFAULT_DOMAIN_SCHEMA_BINDINGS } from '../domain/default-domain-schema-bindings';
import { SchemaRegistryService } from './schema-registry.service';

export class DefaultSchemaRegistrationService {
  constructor(
    private readonly registry: SchemaRegistryService,
  ) {}

  async registerAll() {
    const result = [];

    for (const binding of DEFAULT_DOMAIN_SCHEMA_BINDINGS) {
      result.push(
        await this.registry.register({
          schemaId: binding.schemaId,
          name: `${binding.domain}:${binding.credentialType}`,
          version: binding.schemaVersion,
          domain: binding.domain,
          credentialType: binding.credentialType,
          requiredClaims: binding.requiredClaims,
          privacyLevel: binding.privacyLevel,
          jsonSchema: {
            type: 'object',
            required: binding.requiredClaims,
            properties: Object.fromEntries(
              binding.requiredClaims.map((claim) => [
                claim,
                { type: ['string', 'number', 'boolean', 'object', 'array'] },
              ]),
            ),
            additionalProperties: true,
          },
        }),
      );
    }

    return result;
  }
}
```



---



# 19\. 默认 Issuer 注册示例



## `core/issuer/register-default-issuers.service.ts`



```TypeScript
import { IssuerRegistryService } from './issuer-registry.service';

export class DefaultIssuerRegistrationService {
  constructor(
    private readonly registry: IssuerRegistryService,
  ) {}

  async registerSystemIssuers() {
    const issuers = [];

    issuers.push(
      await this.registry.register({
        did: 'did:web:identity.exchange.example',
        name: 'Exchange Identity Issuer',
        legalName: 'Exchange Identity Services Ltd',
        trustLevel: 'licensed_operator',
        allowedDomains: ['exchange'],
        allowedCredentialTypes: [
          'ExchangeKYCLevel',
          'ExchangeTradingPermission',
          'ExchangeWithdrawalPermission',
          'ExchangeVIPLevel',
          'ExchangeTravelRuleCompliance',
          'AMLScreening',
          'SanctionsScreening',
          'WalletOwnership',
        ],
        allowedSchemas: [
          'schema:exchange:kyc-level:v1',
          'schema:exchange:withdrawal-permission:v1',
          'schema:exchange:travel-rule:v1',
        ],
        jurisdiction: 'SG',
        countryCode: 'SG',
        regulatorName: 'Example Regulator',
      }),
    );

    issuers.push(
      await this.registry.register({
        did: 'did:web:merchant-id.commerce.example',
        name: 'Commerce Merchant Identity Issuer',
        trustLevel: 'verified_partner',
        allowedDomains: ['cross_border_commerce'],
        allowedCredentialTypes: [
          'CommerceBuyerIdentity',
          'CommerceSellerIdentity',
          'CommerceMerchantKYB',
          'CommerceTaxIdentity',
          'CommerceShippingAddressProof',
          'CommerceProductCompliance',
          'CommerceDisputeReputation',
          'SanctionsScreening',
          'AMLScreening',
        ],
        allowedSchemas: [
          'schema:commerce:merchant-kyb:v1',
          'schema:commerce:tax-identity:v1',
        ],
        jurisdiction: 'GLOBAL',
      }),
    );

    issuers.push(
      await this.registry.register({
        did: 'did:web:compliance.gaming.example',
        name: 'Gaming Compliance Issuer',
        trustLevel: 'licensed_operator',
        allowedDomains: ['gaming'],
        allowedCredentialTypes: [
          'GamingAgeOver18',
          'GamingAgeOver21',
          'GamingGeoEligibility',
          'GamingSelfExclusionStatus',
          'GamingResponsibleGamingLimit',
          'GamingAMLCheck',
          'GamingBettingPermission',
          'SanctionsScreening',
        ],
        allowedSchemas: [
          'schema:gaming:age-over-18:v1',
          'schema:gaming:geo-eligibility:v1',
        ],
        jurisdiction: 'GB',
        countryCode: 'GB',
        regulatorName: 'Gaming Commission',
      }),
    );

    issuers.push(
      await this.registry.register({
        did: 'did:web:identity.financial.example',
        name: 'Financial Identity Issuer',
        trustLevel: 'regulated_financial_institution',
        allowedDomains: ['financial'],
        allowedCredentialTypes: [
          'FinancialKYCLevel',
          'FinancialKYBLevel',
          'FinancialAccreditedInvestor',
          'FinancialRiskSuitability',
          'FinancialIncomeProof',
          'FinancialAssetProof',
          'FinancialCreditScore',
          'FinancialUBODeclaration',
          'FinancialInvestmentPermission',
          'FinancialLoanEligibility',
          'PEPScreening',
          'SanctionsScreening',
        ],
        allowedSchemas: [
          'schema:financial:kyc-level:v1',
          'schema:financial:risk-suitability:v1',
          'schema:financial:accredited-investor:v1',
        ],
        jurisdiction: 'AE',
        countryCode: 'AE',
        regulatorName: 'Financial Services Regulator',
      }),
    );

    issuers.push(
      await this.registry.register({
        did: 'did:web:identity.samoa.example',
        name: 'Samoa Official Enterprise Identity Issuer',
        legalName: 'Samoa Enterprise Digital Registry',
        trustLevel: 'government',
        allowedDomains: ['samoa_enterprise'],
        allowedCredentialTypes: [
          'SamoaEntrepreneurIdentity',
          'SamoaFounderIdentity',
          'SamoaDirectorIdentity',
          'SamoaShareholderIdentity',
          'SamoaUBODeclaration',
          'SamoaCompanyNameReservation',
          'SamoaCompanyFormationApplication',
          'SamoaCompanyIncorporationCertificate',
          'SamoaRegisteredAgent',
          'SamoaRegisteredOfficeAddress',
          'SamoaBusinessPurposeDeclaration',
          'SamoaSourceOfFundsDeclaration',
          'SamoaAMLScreening',
          'SamoaSanctionsScreening',
          'SamoaPEPScreening',
          'SamoaTaxResidencyDeclaration',
          'SamoaEconomicSubstanceDeclaration',
          'SamoaBusinessLicenseEligibility',
          'SamoaCompanyGoodStanding',
          'SamoaOfficialServiceAccess',
        ],
        allowedSchemas: [
          'schema:samoa:entrepreneur-identity:v1',
          'schema:samoa:founder-identity:v1',
          'schema:samoa:director-identity:v1',
          'schema:samoa:shareholder-identity:v1',
          'schema:samoa:ubo-declaration:v1',
          'schema:samoa:company-name-reservation:v1',
          'schema:samoa:company-formation-application:v1',
          'schema:samoa:incorporation-certificate:v1',
          'schema:samoa:registered-agent:v1',
          'schema:samoa:registered-office-address:v1',
          'schema:samoa:source-of-funds:v1',
          'schema:samoa:aml-screening:v1',
          'schema:samoa:sanctions-screening:v1',
          'schema:samoa:pep-screening:v1',
          'schema:samoa:company-good-standing:v1',
        ],
        jurisdiction: 'WS',
        countryCode: 'WS',
        regulatorName: 'Samoa Digital Registry',
        metadata: {
          official: true,
          governmentService: true,
        },
      }),
    );

    return issuers;
  }
}
```



---



# 20\. Issuer \+ Schema Runtime



## `core/issuer/create-issuer-schema-runtime.ts`



```TypeScript
import { InMemoryIssuerRepository } from './issuer.repository';
import { IssuerAuditService } from './issuer-audit.service';
import { IssuerRegistryService } from './issuer-registry.service';
import { IssuerPermissionService } from './issuer-permission.service';
import { IssuerTrustService } from './issuer-trust.service';
import { IssuerKeyRotationService } from './issuer-key-rotation.service';
import { DefaultIssuerRegistrationService } from './register-default-issuers.service';

import { InMemorySchemaRepository } from '../schema/schema.repository';
import { SchemaHashService } from '../schema/schema-hash.service';
import { SchemaRegistryService } from '../schema/schema-registry.service';
import { SchemaValidationService } from '../schema/schema-validation.service';
import { DomainSchemaPolicyService } from '../schema/domain-schema-policy.service';
import { DefaultSchemaRegistrationService } from '../schema/register-default-schemas.service';

export function createIssuerSchemaRuntime() {
  const issuerRepo = new InMemoryIssuerRepository();
  const issuerAudit = new IssuerAuditService();

  const issuerRegistry = new IssuerRegistryService(
    issuerRepo,
    issuerAudit,
  );

  const issuerPermission = new IssuerPermissionService(
    issuerRegistry,
    issuerAudit,
  );

  const issuerTrust = new IssuerTrustService(
    issuerRegistry,
  );

  const issuerKeyRotation = new IssuerKeyRotationService(
    issuerRegistry,
    issuerRepo,
    issuerAudit,
  );

  const schemaRepo = new InMemorySchemaRepository();
  const schemaHash = new SchemaHashService();

  const schemaRegistry = new SchemaRegistryService(
    schemaRepo,
    schemaHash,
  );

  const schemaValidation = new SchemaValidationService();

  const domainSchemaPolicy = new DomainSchemaPolicyService(
    schemaRegistry,
  );

  const defaultSchemas = new DefaultSchemaRegistrationService(
    schemaRegistry,
  );

  const defaultIssuers = new DefaultIssuerRegistrationService(
    issuerRegistry,
  );

  return {
    issuerRepo,
    issuerAudit,
    issuerRegistry,
    issuerPermission,
    issuerTrust,
    issuerKeyRotation,

    schemaRepo,
    schemaHash,
    schemaRegistry,
    schemaValidation,
    domainSchemaPolicy,

    defaultSchemas,
    defaultIssuers,
  };
}

export type IssuerSchemaRuntime =
  ReturnType;
```



---



# 21\. 初始化默认 Issuer / Schema



```TypeScript
const runtime = createIssuerSchemaRuntime();

await runtime.defaultSchemas.registerAll();
await runtime.defaultIssuers.registerSystemIssuers();
```



---



# 22\. 签发前完整校验示例



```TypeScript
const schema = await runtime.domainSchemaPolicy.resolveSchema({
  domain: 'samoa_enterprise',
  credentialType: 'SamoaEntrepreneurIdentity',
});

runtime.schemaValidation.assertClaims({
  schema,
  claims: {
    kycLevel: 2,
    identityVerified: true,
    nationality: 'WS',
    countryOfResidence: 'SG',
  },
});

await runtime.issuerPermission.assertCanIssue({
  issuerDid: 'did:web:identity.samoa.example',
  domain: 'samoa_enterprise',
  credentialType: 'SamoaEntrepreneurIdentity',
  schemaId: schema.schemaId,
});
```



---



# 23\. 验证 VC 时 Issuer Trust 示例



```TypeScript
const trust = await runtime.issuerTrust.check({
  issuerDid: 'did:web:identity.samoa.example',
  domain: 'samoa_enterprise',
  credentialType: 'SamoaCompanyIncorporationCertificate',
  schemaId: 'schema:samoa:incorporation-certificate:v1',
});

if (!trust.trusted) {
  throw new Error(`ISSUER_NOT_TRUSTED:${trust.reason}`);
}
```



---



# 24\. 五大业务域 Issuer 规则



## 24\.1 交易所



允许签发：



```Plain Text
ExchangeKYCLevel
ExchangeTradingPermission
ExchangeWithdrawalPermission
ExchangeTravelRuleCompliance
WalletOwnership
AMLScreening
SanctionsScreening
```



必须：



```Plain Text
licensed_operator / regulated entity
```



---



## 24\.2 跨境电商



允许签发：



```Plain Text
CommerceMerchantKYB
CommerceTaxIdentity
CommerceShippingAddressProof
CommerceProductCompliance
CommerceDisputeReputation
```



必须：



```Plain Text
verified_partner / platform operator / tax partner
```



---



## 24\.3 博彩



允许签发：



```Plain Text
GamingAgeOver18
GamingGeoEligibility
GamingSelfExclusionStatus
GamingResponsibleGamingLimit
GamingBettingPermission
GamingAMLCheck
```



必须：



```Plain Text
licensed_operator / compliance provider
```



---



## 24\.4 金融



允许签发：



```Plain Text
FinancialKYCLevel
FinancialAccreditedInvestor
FinancialRiskSuitability
FinancialIncomeProof
FinancialAssetProof
FinancialCreditScore
FinancialUBODeclaration
```



必须：



```Plain Text
regulated_financial_institution
```



---



## 24\.5 萨摩亚企业家 / 公司设立



允许签发：



```Plain Text
SamoaEntrepreneurIdentity
SamoaFounderIdentity
SamoaDirectorIdentity
SamoaShareholderIdentity
SamoaUBODeclaration
SamoaCompanyNameReservation
SamoaCompanyFormationApplication
SamoaCompanyIncorporationCertificate
SamoaRegisteredAgent
SamoaRegisteredOfficeAddress
SamoaCompanyGoodStanding
```



必须：



```Plain Text
government / official registry / authorized registered agent
```



---



# 25\. 生产数据库建议



## Issuer



```Plain Text
model DIDTrustedIssuer {
  id                     BigInt   @id @default(autoincrement())
  issuerId               String   @unique @db.VarChar(64)
  did                    String   @unique @db.VarChar(512)

  name                   String   @db.VarChar(128)
  legalName              String?  @db.VarChar(255)
  description            String?  @db.VarChar(1024)

  domain                 String?  @db.VarChar(255)
  website                String?  @db.VarChar(512)
  logoUrl                String?  @db.VarChar(1024)

  trustLevel             String   @db.VarChar(64)
  status                 String   @db.VarChar(32)

  allowedDomains         Json
  allowedCredentialTypes Json
  allowedSchemas         Json
  verificationMethods    Json

  jurisdiction           String?  @db.VarChar(64)
  countryCode            String?  @db.VarChar(8)
  licenseNumber          String?  @db.VarChar(128)
  regulatorName          String?  @db.VarChar(255)

  metadata               Json?

  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
  suspendedAt            DateTime?
  revokedAt              DateTime?

  @@index([status])
  @@index([trustLevel])
  @@index([countryCode])
  @@map("did_trusted_issuers")
}
```



## Schema



```Plain Text
model DIDCredentialSchema {
  id              BigInt   @id @default(autoincrement())
  schemaId        String   @unique @db.VarChar(255)

  name            String   @db.VarChar(255)
  version         String   @db.VarChar(32)
  description     String?  @db.VarChar(1024)

  domain          String   @db.VarChar(64)
  credentialType  String   @db.VarChar(128)

  jsonSchema      Json
  hash            String   @db.VarChar(128)

  requiredClaims  Json
  privacyLevel    String   @db.VarChar(64)
  status          String   @db.VarChar(32)

  authorDid       String?  @db.VarChar(512)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([domain])
  @@index([credentialType])
  @@index([status])
  @@index([hash])
  @@map("did_credential_schemas")
}
```



---



# 26\. 本章完成内容



本章完成：



```Plain Text
Issuer 类型增强
Issuer 错误体系
Issuer Repository
Issuer Registry
Issuer Trust Service
Issuer Permission Service
Issuer Key Rotation
Issuer Audit
Schema 类型
Schema 错误体系
Schema Hash
Schema Repository
Schema Registry
Schema Validation
Domain Schema Policy
五大业务域默认 Schema
五大业务域默认 Issuer
Issuer + Schema Runtime
签发前校验流程
验证时 Issuer Trust 流程
生产数据库设计
```



现在 DID 系统已经具备：



```Plain Text
谁能签发
能签发哪个业务域
能签发哪种凭证
能使用哪个 Schema
Issuer 是否可信
Schema 是否有效
Issuer key 是否可用
```



---



# 27\. 下一章继续



下一章：



# 《DID 身份 Part 5：VC 签发 JWT VC / JSON\-LD VC / EIP\-712 VC》



将覆盖：



```Plain Text
VC Issue Pipeline
签发前 Issuer Permission 校验
Schema 校验
Credential Hash
JWT VC 签发
JSON-LD VC 签发
EIP-712 VC 签发
五大业务域 VC 模板
萨摩亚公司设立 VC
交易所 KYC VC
博彩年龄证明 VC
金融合格投资者 VC
跨境电商商户 KYB VC
签发审计
可选链上锚定入口
```



