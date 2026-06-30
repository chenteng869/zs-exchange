# A11\-《DID 身份 Part 11：后台管理 Issuer / Schema / Credential / Revocation / Audit》

# 《DID 身份 Part 11：后台管理 Issuer / Schema / Credential / Revocation / Audit》



本章实现 DID 身份系统后台管理能力，覆盖：



- Issuer Admin

- Schema Admin

- Credential Admin

- Revocation Admin

- Samoa Enterprise Admin

- Company Formation Review

- Credential Lifecycle Admin

- StatusList Admin

- Anchor Admin

- Audit Log

- RBAC 权限

- 高危操作 MFA

- Prisma 数据表

- NestJS Controller

    

核心目标：



```Plain Text
DID 身份系统不能只有用户端。
必须有后台对 Issuer、Schema、Credential、Revocation、Anchor、Audit 做治理。
尤其是金融、博彩、交易所、萨摩亚公司设立，必须支持审查、撤销、冻结、审计和监管查询。
```



---



# 1\. 后台管理总架构



```Plain Text
Admin Console
  -> RBAC / MFA
  -> Issuer Management
  -> Schema Management
  -> Credential Management
  -> Lifecycle / Revocation
  -> StatusList / Anchor
  -> Samoa Company Formation Review
  -> Audit Query
  -> Regulatory Export
```



后台高危操作必须满足：



```Plain Text
1. RBAC 权限校验
2. MFA 二次确认
3. 操作原因必填
4. 全量审计
5. 可追踪 operatorId
6. 不允许硬删除关键记录
```



---



# 2\. 目录结构



```Bash
src/modules/did/
  admin/
    common/
      admin-auth.types.ts
      admin-action-guard.service.ts
      admin-audit.service.ts

    issuer/
      issuer-admin.service.ts
      issuer-admin.controller.ts

    schema/
      schema-admin.service.ts
      schema-admin.controller.ts

    credential/
      credential-admin.service.ts
      credential-admin.controller.ts

    revocation/
      revocation-admin.service.ts
      revocation-admin.controller.ts

    status-list/
      status-list-admin.service.ts
      status-list-admin.controller.ts

    anchor/
      anchor-admin.service.ts
      anchor-admin.controller.ts

    samoa/
      samoa-enterprise-admin.types.ts
      samoa-enterprise-admin.service.ts
      samoa-enterprise-admin.controller.ts

    audit/
      did-admin-audit-query.service.ts
      did-admin-audit.controller.ts
```



---



# 3\. Admin Auth 类型



## `admin/common/admin-auth.types.ts`



```TypeScript
export type DIDAdminPermission =
  | 'did:issuer:view'
  | 'did:issuer:manage'
  | 'did:issuer:suspend'
  | 'did:issuer:revoke'
  | 'did:schema:view'
  | 'did:schema:manage'
  | 'did:credential:view'
  | 'did:credential:issue'
  | 'did:credential:suspend'
  | 'did:credential:revoke'
  | 'did:revocation:view'
  | 'did:revocation:manage'
  | 'did:anchor:view'
  | 'did:anchor:manage'
  | 'did:samoa:view'
  | 'did:samoa:review'
  | 'did:samoa:approve'
  | 'did:samoa:reject'
  | 'did:audit:view'
  | 'did:regulatory:export';

export interface DIDAdminOperator {
  operatorId: string;
  userId?: string;
  roleIds: string[];
  permissions: DIDAdminPermission[];
  mfaVerified: boolean;
  ip?: string;
  userAgent?: string;
}

export interface AdminActionContext {
  operator: DIDAdminOperator;
  requestId?: string;
  reason?: string;
  metadata?: Record;
}
```



---



# 4\. Admin Action Guard



## `admin/common/admin-action-guard.service.ts`



```TypeScript
import {
  AdminActionContext,
  DIDAdminPermission,
} from './admin-auth.types';

export class AdminActionGuardService {
  assertPermission(
    context: AdminActionContext,
    permission: DIDAdminPermission,
  ) {
    if (!context.operator.permissions.includes(permission)) {
      throw new Error(`ADMIN_PERMISSION_DENIED:${permission}`);
    }
  }

  assertMfa(context: AdminActionContext) {
    if (!context.operator.mfaVerified) {
      throw new Error('ADMIN_MFA_REQUIRED');
    }
  }

  assertReason(context: AdminActionContext) {
    if (!context.reason || context.reason.trim().length ;
}

export class ConsoleDIDAdminAuditSink implements DIDAdminAuditSink {
  async record(input: DIDAdminAuditRecord): Promise {
    console.log('[DIDAdminAudit]', input);
  }
}

export class DIDAdminAuditService {
  constructor(
    private readonly sink: DIDAdminAuditSink = new ConsoleDIDAdminAuditSink(),
  ) {}

  async success(
    action: string,
    context: AdminActionContext,
    input: {
      targetType?: string;
      targetId?: string;
      metadata?: unknown;
    } = {},
  ) {
    await this.record(action, 'success', context, input);
  }

  async failed(
    action: string,
    context: AdminActionContext,
    input: {
      targetType?: string;
      targetId?: string;
      metadata?: unknown;
      error?: unknown;
    } = {},
  ) {
    await this.record(action, 'failed', context, input);
  }

  async denied(
    action: string,
    context: AdminActionContext,
    input: {
      targetType?: string;
      targetId?: string;
      metadata?: unknown;
      error?: unknown;
    } = {},
  ) {
    await this.record(action, 'denied', context, input);
  }

  private async record(
    action: string,
    result: DIDAdminAuditRecord['result'],
    context: AdminActionContext,
    input: {
      targetType?: string;
      targetId?: string;
      metadata?: unknown;
      error?: unknown;
    },
  ) {
    await this.sink.record({
      auditNo: `DIDADM-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`,
      action,
      result,
      operatorId: context.operator.operatorId,
      userId: context.operator.userId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: context.reason,
      requestId: context.requestId,
      ip: context.operator.ip,
      userAgent: context.operator.userAgent,
      metadata: input.metadata,
      error: input.error,
      createdAt: Date.now(),
    });
  }
}
```



---



# 6\. Issuer Admin Service



## `admin/issuer/issuer-admin.service.ts`



```TypeScript
import { IssuerRegistryService } from '../../core/issuer/issuer-registry.service';
import { IssuerRepository } from '../../core/issuer/issuer.repository';
import { IssuerRegistrationInput } from '../../core/issuer/issuer.types';
import { AdminActionContext } from '../common/admin-auth.types';
import { AdminActionGuardService } from '../common/admin-action-guard.service';
import { DIDAdminAuditService } from '../common/admin-audit.service';

export class IssuerAdminService {
  constructor(
    private readonly repo: IssuerRepository,
    private readonly registry: IssuerRegistryService,
    private readonly guard: AdminActionGuardService,
    private readonly audit: DIDAdminAuditService,
  ) {}

  async list(
    context: AdminActionContext,
    query?: {
      status?: string;
      trustLevel?: string;
      domain?: string;
      credentialType?: string;
    },
  ) {
    this.guard.assertPermission(context, 'did:issuer:view');
    return this.repo.list(query);
  }

  async register(
    context: AdminActionContext,
    input: IssuerRegistrationInput,
  ) {
    this.guard.assertHighRisk(context, 'did:issuer:manage');

    try {
      const issuer = await this.registry.register(input);

      await this.audit.success('admin.issuer.registered', context, {
        targetType: 'issuer',
        targetId: issuer.did,
        metadata: issuer,
      });

      return issuer;
    } catch (error) {
      await this.audit.failed('admin.issuer.register.failed', context, {
        targetType: 'issuer',
        targetId: input.did,
        error,
      });
      throw error;
    }
  }

  async updatePermissions(
    context: AdminActionContext,
    input: {
      issuerDid: string;
      allowedDomains?: any[];
      allowedCredentialTypes?: any[];
      allowedSchemas?: string[];
    },
  ) {
    this.guard.assertHighRisk(context, 'did:issuer:manage');

    const result = await this.registry.updatePermissions(input);

    await this.audit.success('admin.issuer.permissions.updated', context, {
      targetType: 'issuer',
      targetId: input.issuerDid,
      metadata: input,
    });

    return result;
  }

  async suspend(
    context: AdminActionContext,
    issuerDid: string,
  ) {
    this.guard.assertHighRisk(context, 'did:issuer:suspend');

    const result = await this.registry.suspend({
      issuerDid,
      reason: context.reason,
    });

    await this.audit.success('admin.issuer.suspended', context, {
      targetType: 'issuer',
      targetId: issuerDid,
    });

    return result;
  }

  async revoke(
    context: AdminActionContext,
    issuerDid: string,
  ) {
    this.guard.assertHighRisk(context, 'did:issuer:revoke');

    const result = await this.registry.revoke({
      issuerDid,
      reason: context.reason,
    });

    await this.audit.success('admin.issuer.revoked', context, {
      targetType: 'issuer',
      targetId: issuerDid,
    });

    return result;
  }
}
```



---



# 7\. Schema Admin Service



## `admin/schema/schema-admin.service.ts`



```TypeScript
import { SchemaRegistryService } from '../../core/schema/schema-registry.service';
import { SchemaRepository } from '../../core/schema/schema.repository';
import { SchemaRegistrationInput } from '../../core/schema/schema.types';
import { AdminActionContext } from '../common/admin-auth.types';
import { AdminActionGuardService } from '../common/admin-action-guard.service';
import { DIDAdminAuditService } from '../common/admin-audit.service';

export class SchemaAdminService {
  constructor(
    private readonly repo: SchemaRepository,
    private readonly registry: SchemaRegistryService,
    private readonly guard: AdminActionGuardService,
    private readonly audit: DIDAdminAuditService,
  ) {}

  async list(context: AdminActionContext, query?: any) {
    this.guard.assertPermission(context, 'did:schema:view');
    return this.repo.list(query);
  }

  async register(
    context: AdminActionContext,
    input: SchemaRegistrationInput,
  ) {
    this.guard.assertHighRisk(context, 'did:schema:manage');

    const schema = await this.registry.register(input);

    await this.audit.success('admin.schema.registered', context, {
      targetType: 'schema',
      targetId: schema.schemaId,
      metadata: schema,
    });

    return schema;
  }

  async deprecate(
    context: AdminActionContext,
    schemaId: string,
  ) {
    this.guard.assertHighRisk(context, 'did:schema:manage');

    const result = await this.registry.deprecate(schemaId);

    await this.audit.success('admin.schema.deprecated', context, {
      targetType: 'schema',
      targetId: schemaId,
    });

    return result;
  }

  async disable(
    context: AdminActionContext,
    schemaId: string,
  ) {
    this.guard.assertHighRisk(context, 'did:schema:manage');

    const result = await this.registry.disable(schemaId);

    await this.audit.success('admin.schema.disabled', context, {
      targetType: 'schema',
      targetId: schemaId,
    });

    return result;
  }
}
```



---



# 8\. Credential Admin Service



## `admin/credential/credential-admin.service.ts`



```TypeScript
import { VCIssuerService } from '../../core/vc/vc-issuer.service';
import { VCIssuePipelineInput } from '../../core/vc/vc-issue.types';
import { CredentialLifecycleRepository } from '../../core/credential-lifecycle/credential-lifecycle.repository';
import { AdminActionContext } from '../common/admin-auth.types';
import { AdminActionGuardService } from '../common/admin-action-guard.service';
import { DIDAdminAuditService } from '../common/admin-audit.service';

export class CredentialAdminService {
  constructor(
    private readonly issuer: VCIssuerService,
    private readonly lifecycleRepo: CredentialLifecycleRepository,
    private readonly guard: AdminActionGuardService,
    private readonly audit: DIDAdminAuditService,
  ) {}

  async list(context: AdminActionContext, query?: {
    domain?: string;
    credentialType?: string;
    issuerDid?: string;
    subjectDid?: string;
    status?: any;
  }) {
    this.guard.assertPermission(context, 'did:credential:view');
    return this.lifecycleRepo.list(query);
  }

  async issue(
    context: AdminActionContext,
    input: VCIssuePipelineInput,
  ) {
    this.guard.assertHighRisk(context, 'did:credential:issue');

    const result = await this.issuer.issue(input);

    await this.audit.success('admin.credential.issued', context, {
      targetType: 'credential',
      targetId: result.credentialId,
      metadata: {
        domain: input.context.domain,
        credentialType: input.context.credentialType,
        issuerDid: input.context.issuerDid,
        subjectDid: input.context.subjectDid,
        credentialHash: result.credentialHash,
      },
    });

    return result;
  }

  async getLifecycle(
    context: AdminActionContext,
    credentialId: string,
  ) {
    this.guard.assertPermission(context, 'did:credential:view');
    return this.lifecycleRepo.getById(credentialId);
  }
}
```



---



# 9\. Revocation Admin Service



## `admin/revocation/revocation-admin.service.ts`



```TypeScript
import { RevocationService } from '../../core/revocation/revocation.service';
import { SuspensionService } from '../../core/revocation/suspension.service';
import { CredentialLifecycleRepository } from '../../core/credential-lifecycle/credential-lifecycle.repository';
import { AdminActionContext } from '../common/admin-auth.types';
import { AdminActionGuardService } from '../common/admin-action-guard.service';
import { DIDAdminAuditService } from '../common/admin-audit.service';

export class RevocationAdminService {
  constructor(
    private readonly lifecycleRepo: CredentialLifecycleRepository,
    private readonly revocation: RevocationService,
    private readonly suspension: SuspensionService,
    private readonly guard: AdminActionGuardService,
    private readonly audit: DIDAdminAuditService,
  ) {}

  async revoke(
    context: AdminActionContext,
    credentialId: string,
  ) {
    this.guard.assertHighRisk(context, 'did:credential:revoke');

    const result = await this.revocation.revoke({
      credentialId,
      reason: context.reason,
      operatorId: context.operator.operatorId,
    });

    await this.audit.success('admin.credential.revoked', context, {
      targetType: 'credential',
      targetId: credentialId,
      metadata: result,
    });

    return result;
  }

  async suspend(
    context: AdminActionContext,
    credentialId: string,
  ) {
    this.guard.assertHighRisk(context, 'did:credential:suspend');

    const result = await this.suspension.suspend({
      credentialId,
      reason: context.reason,
      operatorId: context.operator.operatorId,
    });

    await this.audit.success('admin.credential.suspended', context, {
      targetType: 'credential',
      targetId: credentialId,
      metadata: result,
    });

    return result;
  }

  async resume(
    context: AdminActionContext,
    credentialId: string,
  ) {
    this.guard.assertHighRisk(context, 'did:credential:suspend');

    const result = await this.suspension.resume({
      credentialId,
      reason: context.reason,
      operatorId: context.operator.operatorId,
    });

    await this.audit.success('admin.credential.resumed', context, {
      targetType: 'credential',
      targetId: credentialId,
      metadata: result,
    });

    return result;
  }

  async get(context: AdminActionContext, credentialId: string) {
    this.guard.assertPermission(context, 'did:revocation:view');
    return this.lifecycleRepo.getById(credentialId);
  }
}
```



---



# 10\. StatusList Admin Service



## `admin/status-list/status-list-admin.service.ts`



```TypeScript
import { StatusList2021Repository } from '../../core/revocation/status-list2021.repository';
import { StatusList2021ManagementService } from '../../core/revocation/status-list2021.service';
import { RevocationAnchorService } from '../../core/revocation/revocation-anchor.service';
import { AdminActionContext } from '../common/admin-auth.types';
import { AdminActionGuardService } from '../common/admin-action-guard.service';
import { DIDAdminAuditService } from '../common/admin-audit.service';

export class StatusListAdminService {
  constructor(
    private readonly repo: StatusList2021Repository,
    private readonly statusList: StatusList2021ManagementService,
    private readonly anchor: RevocationAnchorService,
    private readonly guard: AdminActionGuardService,
    private readonly audit: DIDAdminAuditService,
  ) {}

  async list(context: AdminActionContext, query?: {
    issuerDid?: string;
    purpose?: string;
  }) {
    this.guard.assertPermission(context, 'did:revocation:view');
    return this.repo.list(query);
  }

  async create(
    context: AdminActionContext,
    input: {
      issuerDid: string;
      purpose: 'revocation' | 'suspension';
      size?: number;
    },
  ) {
    this.guard.assertHighRisk(context, 'did:revocation:manage');

    const list = await this.statusList.createList(input);

    await this.audit.success('admin.status_list.created', context, {
      targetType: 'status_list',
      targetId: list.listId,
      metadata: list,
    });

    return list;
  }

  async getCredential(
    context: AdminActionContext,
    listId: string,
  ) {
    this.guard.assertPermission(context, 'did:revocation:view');
    return this.statusList.getCredential(listId);
  }

  async anchorRoot(
    context: AdminActionContext,
    listId: string,
  ) {
    this.guard.assertHighRisk(context, 'did:anchor:manage');

    const result = await this.anchor.anchorStatusListRoot(listId);

    await this.audit.success('admin.status_list.root_anchored', context, {
      targetType: 'status_list',
      targetId: listId,
      metadata: result.anchor,
    });

    return result;
  }
}
```



---



# 11\. Anchor Admin Service



## `admin/anchor/anchor-admin.service.ts`



```TypeScript
import { DIDAnchorService } from '../../core/anchor/did-anchor.service';
import { CredentialAnchorService } from '../../core/anchor/credential-anchor.service';
import { IssuerAnchorService } from '../../core/anchor/issuer-anchor.service';
import { RevocationRootAnchorService } from '../../core/anchor/revocation-root-anchor.service';
import {
  CredentialAnchorInput,
  DIDAnchorInput,
  IssuerAnchorInput,
  RevocationRootAnchorInput,
} from '../../core/anchor/anchor.types';
import { AdminActionContext } from '../common/admin-auth.types';
import { AdminActionGuardService } from '../common/admin-action-guard.service';
import { DIDAdminAuditService } from '../common/admin-audit.service';

export class AnchorAdminService {
  constructor(
    private readonly didAnchor: DIDAnchorService,
    private readonly credentialAnchor: CredentialAnchorService,
    private readonly issuerAnchor: IssuerAnchorService,
    private readonly revocationRootAnchor: RevocationRootAnchorService,
    private readonly guard: AdminActionGuardService,
    private readonly audit: DIDAdminAuditService,
  ) {}

  async anchorDID(context: AdminActionContext, input: DIDAnchorInput) {
    this.guard.assertHighRisk(context, 'did:anchor:manage');

    const result = await this.didAnchor.anchor(input);

    await this.audit.success('admin.anchor.did', context, {
      targetType: 'did',
      targetId: input.did,
      metadata: result,
    });

    return result;
  }

  async anchorCredential(
    context: AdminActionContext,
    input: CredentialAnchorInput & { sourcePayload?: unknown },
  ) {
    this.guard.assertHighRisk(context, 'did:anchor:manage');

    const result = await this.credentialAnchor.anchor(input);

    await this.audit.success('admin.anchor.credential', context, {
      targetType: 'credential_hash',
      targetId: input.credentialHash,
      metadata: result,
    });

    return result;
  }

  async anchorIssuer(context: AdminActionContext, input: IssuerAnchorInput) {
    this.guard.assertHighRisk(context, 'did:anchor:manage');

    const result = await this.issuerAnchor.anchor(input);

    await this.audit.success('admin.anchor.issuer', context, {
      targetType: 'issuer',
      targetId: input.issuerDid,
      metadata: result,
    });

    return result;
  }

  async anchorRevocationRoot(
    context: AdminActionContext,
    input: RevocationRootAnchorInput,
  ) {
    this.guard.assertHighRisk(context, 'did:anchor:manage');

    const result = await this.revocationRootAnchor.anchor(input);

    await this.audit.success('admin.anchor.revocation_root', context, {
      targetType: 'revocation_root',
      targetId: input.listId,
      metadata: result,
    });

    return result;
  }
}
```



---



# 12\. Samoa Enterprise Admin 类型



## `admin/samoa/samoa-enterprise-admin.types.ts`



```TypeScript
import { DIDString } from '../../core/did/did.types';

export type SamoaFormationReviewStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'incorporated'
  | 'struck_off';

export interface SamoaCompanyFormationReviewRecord {
  applicationId: string;

  applicantUserId: string;
  entrepreneurDid: DIDString;

  proposedCompanyName?: string;
  proposedCompanyNameHash?: string;

  companyType:
    | 'international_company'
    | 'limited_liability_company'
    | 'partnership'
    | 'foundation'
    | 'trust'
    | 'other';

  founderDid?: DIDString;
  directorDids: DIDString[];
  shareholderDids: DIDString[];
  uboDids: DIDString[];

  registeredAgentDid?: DIDString;
  registeredOfficeAddressHash?: string;

  status: SamoaFormationReviewStatus;

  requiredCredentialIds: string[];
  issuedCredentialIds: string[];

  reviewNotes?: string;
  rejectionReason?: string;

  incorporatedCompanyNumber?: string;
  incorporationCredentialId?: string;

  createdAt: number;
  updatedAt: number;
  submittedAt?: number;
  approvedAt?: number;
  rejectedAt?: number;
  incorporatedAt?: number;
}
```



---



# 13\. Samoa Enterprise Admin Service



## `admin/samoa/samoa-enterprise-admin.service.ts`



```TypeScript
import { SamoaCompanyFormationReviewRecord } from './samoa-enterprise-admin.types';
import { AdminActionContext } from '../common/admin-auth.types';
import { AdminActionGuardService } from '../common/admin-action-guard.service';
import { DIDAdminAuditService } from '../common/admin-audit.service';
import { CredentialLifecycleRepository } from '../../core/credential-lifecycle/credential-lifecycle.repository';

export interface SamoaFormationRepository {
  create(record: SamoaCompanyFormationReviewRecord): Promise;
  update(record: SamoaCompanyFormationReviewRecord): Promise;
  get(applicationId: string): Promise;
  list(query?: {
    status?: string;
    applicantUserId?: string;
    entrepreneurDid?: string;
  }): Promise;
}

export class InMemorySamoaFormationRepository
  implements SamoaFormationRepository {
  private readonly records = new Map();

  async create(record: SamoaCompanyFormationReviewRecord): Promise {
    this.records.set(record.applicationId, record);
  }

  async update(record: SamoaCompanyFormationReviewRecord): Promise {
    this.records.set(record.applicationId, record);
  }

  async get(applicationId: string): Promise {
    return this.records.get(applicationId) ?? null;
  }

  async list(query: {
    status?: string;
    applicantUserId?: string;
    entrepreneurDid?: string;
  } = {}): Promise {
    return Array.from(this.records.values())
      .filter((x) => !query.status || x.status === query.status)
      .filter((x) => !query.applicantUserId || x.applicantUserId === query.applicantUserId)
      .filter((x) => !query.entrepreneurDid || x.entrepreneurDid === query.entrepreneurDid)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }
}

export class SamoaEnterpriseAdminService {
  constructor(
    private readonly repo: SamoaFormationRepository,
    private readonly lifecycleRepo: CredentialLifecycleRepository,
    private readonly guard: AdminActionGuardService,
    private readonly audit: DIDAdminAuditService,
  ) {}

  async listApplications(
    context: AdminActionContext,
    query?: {
      status?: string;
      applicantUserId?: string;
      entrepreneurDid?: string;
    },
  ) {
    this.guard.assertPermission(context, 'did:samoa:view');
    return this.repo.list(query);
  }

  async submitApplication(
    context: AdminActionContext,
    input: Omit,
  ) {
    this.guard.assertPermission(context, 'did:samoa:review');

    const now = Date.now();

    const record: SamoaCompanyFormationReviewRecord = {
      ...input,
      status: 'submitted',
      createdAt: now,
      updatedAt: now,
      submittedAt: now,
    };

    await this.repo.create(record);

    await this.audit.success('admin.samoa.application.submitted', context, {
      targetType: 'samoa_application',
      targetId: record.applicationId,
      metadata: record,
    });

    return record;
  }

  async markUnderReview(
    context: AdminActionContext,
    applicationId: string,
  ) {
    this.guard.assertPermission(context, 'did:samoa:review');

    const record = await this.require(applicationId);

    const updated: SamoaCompanyFormationReviewRecord = {
      ...record,
      status: 'under_review',
      updatedAt: Date.now(),
    };

    await this.repo.update(updated);

    await this.audit.success('admin.samoa.application.under_review', context, {
      targetType: 'samoa_application',
      targetId: applicationId,
    });

    return updated;
  }

  async approve(
    context: AdminActionContext,
    applicationId: string,
  ) {
    this.guard.assertHighRisk(context, 'did:samoa:approve');

    const record = await this.require(applicationId);

    await this.assertRequiredCredentialsActive(record.requiredCredentialIds);

    const updated: SamoaCompanyFormationReviewRecord = {
      ...record,
      status: 'approved',
      approvedAt: Date.now(),
      updatedAt: Date.now(),
      reviewNotes: context.reason,
    };

    await this.repo.update(updated);

    await this.audit.success('admin.samoa.application.approved', context, {
      targetType: 'samoa_application',
      targetId: applicationId,
      metadata: updated,
    });

    return updated;
  }

  async reject(
    context: AdminActionContext,
    applicationId: string,
  ) {
    this.guard.assertHighRisk(context, 'did:samoa:reject');

    const record = await this.require(applicationId);

    const updated: SamoaCompanyFormationReviewRecord = {
      ...record,
      status: 'rejected',
      rejectedAt: Date.now(),
      updatedAt: Date.now(),
      rejectionReason: context.reason,
    };

    await this.repo.update(updated);

    await this.audit.success('admin.samoa.application.rejected', context, {
      targetType: 'samoa_application',
      targetId: applicationId,
      metadata: {
        reason: context.reason,
      },
    });

    return updated;
  }

  async markIncorporated(
    context: AdminActionContext,
    input: {
      applicationId: string;
      companyNumber: string;
      incorporationCredentialId: string;
    },
  ) {
    this.guard.assertHighRisk(context, 'did:samoa:approve');

    const record = await this.require(input.applicationId);

    if (record.status !== 'approved') {
      throw new Error(`SAMOA_APPLICATION_NOT_APPROVED:${record.status}`);
    }

    const updated: SamoaCompanyFormationReviewRecord = {
      ...record,
      status: 'incorporated',
      incorporatedAt: Date.now(),
      updatedAt: Date.now(),
      incorporatedCompanyNumber: input.companyNumber,
      incorporationCredentialId: input.incorporationCredentialId,
      issuedCredentialIds: [
        ...record.issuedCredentialIds,
        input.incorporationCredentialId,
      ],
    };

    await this.repo.update(updated);

    await this.audit.success('admin.samoa.company.incorporated', context, {
      targetType: 'samoa_application',
      targetId: input.applicationId,
      metadata: input,
    });

    return updated;
  }

  private async require(applicationId: string) {
    const record = await this.repo.get(applicationId);
    if (!record) throw new Error(`SAMOA_APPLICATION_NOT_FOUND:${applicationId}`);
    return record;
  }

  private async assertRequiredCredentialsActive(credentialIds: string[]) {
    for (const credentialId of credentialIds) {
      const life = await this.lifecycleRepo.getById(credentialId);

      if (!life) {
        throw new Error(`REQUIRED_CREDENTIAL_NOT_FOUND:${credentialId}`);
      }

      if (life.status !== 'active' && life.status !== 'issued') {
        throw new Error(`REQUIRED_CREDENTIAL_NOT_ACTIVE:${credentialId}:${life.status}`);
      }
    }
  }
}
```



---



# 14\. Admin Audit Query Service



## `admin/audit/did-admin-audit-query.service.ts`



```TypeScript
export interface DIDAdminAuditQuery {
  action?: string;
  result?: string;
  operatorId?: string;
  targetType?: string;
  targetId?: string;
  from?: number;
  to?: number;
  page?: number;
  pageSize?: number;
}

export interface DIDAdminAuditQueryStorage {
  list(query: DIDAdminAuditQuery): Promise;
}

export class DIDAdminAuditQueryService {
  constructor(
    private readonly storage: DIDAdminAuditQueryStorage,
  ) {}

  async list(query: DIDAdminAuditQuery) {
    return this.storage.list({
      page: query.page ?? 1,
      pageSize: Math.min(query.pageSize ?? 20, 200),
      ...query,
    });
  }
}
```



---



# 15\. NestJS Admin Context 装饰器示例



生产中应从 JWT / Session / RBAC 系统取 operator。



## `admin/common/admin-context.decorator.ts`



```TypeScript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AdminActionContext } from './admin-auth.types';

export const AdminContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AdminActionContext => {
    const request = ctx.switchToHttp().getRequest();

    return {
      operator: {
        operatorId: request.user?.operatorId ?? request.user?.id,
        userId: request.user?.id,
        roleIds: request.user?.roleIds ?? [],
        permissions: request.user?.permissions ?? [],
        mfaVerified: Boolean(request.user?.mfaVerified),
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      },
      requestId: request.headers['x-request-id'],
      reason: request.body?.reason,
      metadata: {
        path: request.url,
      },
    };
  },
);
```



---



# 16\. Issuer Admin Controller



## `admin/issuer/issuer-admin.controller.ts`



```TypeScript
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { IssuerAdminService } from './issuer-admin.service';
import { AdminContext } from '../common/admin-context.decorator';
import { AdminActionContext } from '../common/admin-auth.types';

@Controller('admin/did/issuers')
export class IssuerAdminController {
  constructor(
    private readonly service: IssuerAdminService,
  ) {}

  @Get()
  list(
    @AdminContext() ctx: AdminActionContext,
    @Query('status') status?: string,
    @Query('trustLevel') trustLevel?: string,
    @Query('domain') domain?: string,
    @Query('credentialType') credentialType?: string,
  ) {
    return this.service.list(ctx, {
      status,
      trustLevel,
      domain,
      credentialType,
    });
  }

  @Post()
  register(
    @AdminContext() ctx: AdminActionContext,
    @Body() body: any,
  ) {
    return this.service.register(ctx, body);
  }

  @Post(':issuerDid/permissions')
  updatePermissions(
    @AdminContext() ctx: AdminActionContext,
    @Param('issuerDid') issuerDid: string,
    @Body() body: any,
  ) {
    return this.service.updatePermissions(ctx, {
      issuerDid,
      ...body,
    });
  }

  @Post(':issuerDid/suspend')
  suspend(
    @AdminContext() ctx: AdminActionContext,
    @Param('issuerDid') issuerDid: string,
  ) {
    return this.service.suspend(ctx, issuerDid);
  }

  @Post(':issuerDid/revoke')
  revoke(
    @AdminContext() ctx: AdminActionContext,
    @Param('issuerDid') issuerDid: string,
  ) {
    return this.service.revoke(ctx, issuerDid);
  }
}
```



---



# 17\. Schema Admin Controller



## `admin/schema/schema-admin.controller.ts`



```TypeScript
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { SchemaAdminService } from './schema-admin.service';
import { AdminContext } from '../common/admin-context.decorator';
import { AdminActionContext } from '../common/admin-auth.types';

@Controller('admin/did/schemas')
export class SchemaAdminController {
  constructor(
    private readonly service: SchemaAdminService,
  ) {}

  @Get()
  list(
    @AdminContext() ctx: AdminActionContext,
    @Query('domain') domain?: any,
    @Query('credentialType') credentialType?: any,
    @Query('status') status?: any,
  ) {
    return this.service.list(ctx, {
      domain,
      credentialType,
      status,
    });
  }

  @Post()
  register(
    @AdminContext() ctx: AdminActionContext,
    @Body() body: any,
  ) {
    return this.service.register(ctx, body);
  }

  @Post(':schemaId/deprecate')
  deprecate(
    @AdminContext() ctx: AdminActionContext,
    @Param('schemaId') schemaId: string,
  ) {
    return this.service.deprecate(ctx, schemaId);
  }

  @Post(':schemaId/disable')
  disable(
    @AdminContext() ctx: AdminActionContext,
    @Param('schemaId') schemaId: string,
  ) {
    return this.service.disable(ctx, schemaId);
  }
}
```



---



# 18\. Credential Admin Controller



## `admin/credential/credential-admin.controller.ts`



```TypeScript
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CredentialAdminService } from './credential-admin.service';
import { AdminContext } from '../common/admin-context.decorator';
import { AdminActionContext } from '../common/admin-auth.types';

@Controller('admin/did/credentials')
export class CredentialAdminController {
  constructor(
    private readonly service: CredentialAdminService,
  ) {}

  @Get()
  list(
    @AdminContext() ctx: AdminActionContext,
    @Query('domain') domain?: string,
    @Query('credentialType') credentialType?: string,
    @Query('issuerDid') issuerDid?: string,
    @Query('subjectDid') subjectDid?: string,
    @Query('status') status?: any,
  ) {
    return this.service.list(ctx, {
      domain,
      credentialType,
      issuerDid,
      subjectDid,
      status,
    });
  }

  @Post('issue')
  issue(
    @AdminContext() ctx: AdminActionContext,
    @Body() body: any,
  ) {
    return this.service.issue(ctx, body);
  }

  @Get(':credentialId/lifecycle')
  getLifecycle(
    @AdminContext() ctx: AdminActionContext,
    @Param('credentialId') credentialId: string,
  ) {
    return this.service.getLifecycle(ctx, credentialId);
  }
}
```



---



# 19\. Revocation Admin Controller



## `admin/revocation/revocation-admin.controller.ts`



```TypeScript
import { Controller, Param, Post } from '@nestjs/common';
import { RevocationAdminService } from './revocation-admin.service';
import { AdminContext } from '../common/admin-context.decorator';
import { AdminActionContext } from '../common/admin-auth.types';

@Controller('admin/did/revocations')
export class RevocationAdminController {
  constructor(
    private readonly service: RevocationAdminService,
  ) {}

  @Post(':credentialId/revoke')
  revoke(
    @AdminContext() ctx: AdminActionContext,
    @Param('credentialId') credentialId: string,
  ) {
    return this.service.revoke(ctx, credentialId);
  }

  @Post(':credentialId/suspend')
  suspend(
    @AdminContext() ctx: AdminActionContext,
    @Param('credentialId') credentialId: string,
  ) {
    return this.service.suspend(ctx, credentialId);
  }

  @Post(':credentialId/resume')
  resume(
    @AdminContext() ctx: AdminActionContext,
    @Param('credentialId') credentialId: string,
  ) {
    return this.service.resume(ctx, credentialId);
  }

  @Post(':credentialId')
  get(
    @AdminContext() ctx: AdminActionContext,
    @Param('credentialId') credentialId: string,
  ) {
    return this.service.get(ctx, credentialId);
  }
}
```



---



# 20\. Samoa Admin Controller



## `admin/samoa/samoa-enterprise-admin.controller.ts`



```TypeScript
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { SamoaEnterpriseAdminService } from './samoa-enterprise-admin.service';
import { AdminContext } from '../common/admin-context.decorator';
import { AdminActionContext } from '../common/admin-auth.types';

@Controller('admin/did/samoa')
export class SamoaEnterpriseAdminController {
  constructor(
    private readonly service: SamoaEnterpriseAdminService,
  ) {}

  @Get('applications')
  listApplications(
    @AdminContext() ctx: AdminActionContext,
    @Query('status') status?: string,
    @Query('applicantUserId') applicantUserId?: string,
    @Query('entrepreneurDid') entrepreneurDid?: string,
  ) {
    return this.service.listApplications(ctx, {
      status,
      applicantUserId,
      entrepreneurDid,
    });
  }

  @Post('applications')
  submitApplication(
    @AdminContext() ctx: AdminActionContext,
    @Body() body: any,
  ) {
    return this.service.submitApplication(ctx, body);
  }

  @Post('applications/:applicationId/review')
  markUnderReview(
    @AdminContext() ctx: AdminActionContext,
    @Param('applicationId') applicationId: string,
  ) {
    return this.service.markUnderReview(ctx, applicationId);
  }

  @Post('applications/:applicationId/approve')
  approve(
    @AdminContext() ctx: AdminActionContext,
    @Param('applicationId') applicationId: string,
  ) {
    return this.service.approve(ctx, applicationId);
  }

  @Post('applications/:applicationId/reject')
  reject(
    @AdminContext() ctx: AdminActionContext,
    @Param('applicationId') applicationId: string,
  ) {
    return this.service.reject(ctx, applicationId);
  }

  @Post('applications/:applicationId/incorporated')
  markIncorporated(
    @AdminContext() ctx: AdminActionContext,
    @Param('applicationId') applicationId: string,
    @Body() body: {
      companyNumber: string;
      incorporationCredentialId: string;
    },
  ) {
    return this.service.markIncorporated(ctx, {
      applicationId,
      ...body,
    });
  }
}
```



---



# 21\. Prisma 数据表



## 21\.1 Admin Audit



```Plain Text
model DIDAdminAuditLog {
  id          BigInt   @id @default(autoincrement())
  auditNo     String   @unique @db.VarChar(64)

  action      String   @db.VarChar(128)
  result      String   @db.VarChar(32)

  operatorId  String   @db.VarChar(128)
  userId      String?  @db.VarChar(128)

  targetType  String?  @db.VarChar(64)
  targetId    String?  @db.VarChar(512)

  reason      String?  @db.VarChar(1024)
  requestId   String?  @db.VarChar(128)

  ip          String?  @db.VarChar(64)
  userAgent   String?  @db.VarChar(512)

  metadata    Json?
  error       Json?

  createdAt   DateTime @default(now())

  @@index([action])
  @@index([result])
  @@index([operatorId])
  @@index([targetType])
  @@index([targetId])
  @@index([createdAt])
  @@map("did_admin_audit_logs")
}
```



## 21\.2 Samoa Company Formation



```Plain Text
model SamoaCompanyFormationApplication {
  id                         BigInt   @id @default(autoincrement())
  applicationId              String   @unique @db.VarChar(128)

  applicantUserId            String   @db.VarChar(128)
  entrepreneurDid            String   @db.VarChar(512)

  proposedCompanyName        String?  @db.VarChar(255)
  proposedCompanyNameHash    String?  @db.VarChar(128)

  companyType                String   @db.VarChar(64)

  founderDid                 String?  @db.VarChar(512)
  directorDids               Json
  shareholderDids            Json
  uboDids                    Json

  registeredAgentDid         String?  @db.VarChar(512)
  registeredOfficeAddressHash String? @db.VarChar(128)

  status                     String   @db.VarChar(32)

  requiredCredentialIds      Json
  issuedCredentialIds        Json

  reviewNotes                String?  @db.VarChar(2048)
  rejectionReason            String?  @db.VarChar(2048)

  incorporatedCompanyNumber  String?  @db.VarChar(128)
  incorporationCredentialId  String?  @db.VarChar(255)

  createdAt                  DateTime @default(now())
  updatedAt                  DateTime @updatedAt
  submittedAt                DateTime?
  approvedAt                 DateTime?
  rejectedAt                 DateTime?
  incorporatedAt             DateTime?

  @@index([applicantUserId])
  @@index([entrepreneurDid])
  @@index([status])
  @@index([incorporatedCompanyNumber])
  @@map("samoa_company_formation_applications")
}
```



---



# 22\. RBAC 权限分配建议



```Plain Text
Super Admin:
  全部权限

Compliance Admin:
  did:issuer:view
  did:credential:view
  did:credential:suspend
  did:credential:revoke
  did:revocation:view
  did:revocation:manage
  did:audit:view

Issuer Admin:
  did:issuer:view
  did:issuer:manage
  did:schema:view
  did:credential:issue

Samoa Registry Officer:
  did:samoa:view
  did:samoa:review
  did:samoa:approve
  did:samoa:reject
  did:credential:view
  did:credential:issue
  did:audit:view

Auditor:
  did:audit:view
  did:issuer:view
  did:schema:view
  did:credential:view
  did:revocation:view

Regulator:
  did:audit:view
  did:regulatory:export
  did:samoa:view
  did:credential:view
```



---



# 23\. 高危操作清单



必须 MFA \+ Reason：



```Plain Text
Issuer 注册
Issuer 权限变更
Issuer 暂停
Issuer 撤销
Schema 注册
Schema 禁用
Credential 签发
Credential 暂停
Credential 撤销
StatusList Root 上链
DID Anchor
Credential Anchor
Samoa 公司申请批准
Samoa 公司申请拒绝
Samoa 公司注册证书签发
```



---



# 24\. Samoa 公司设立后台流程



```Plain Text
1. 用户提交公司设立申请
2. 后台进入 submitted
3. 审核员标记 under_review
4. 系统校验 requiredCredentialIds 全部 active
5. 审核员批准 approve
6. 系统签发 SamoaCompanyIncorporationCertificate
7. 后台 markIncorporated
8. 可选 Credential Hash 上链
9. 后续签发 SamoaCompanyGoodStanding
```



---



# 25\. 本章完成内容



本章完成：



```Plain Text
Admin Auth 类型
Admin Action Guard
Admin Audit
Issuer Admin
Schema Admin
Credential Admin
Revocation Admin
StatusList Admin
Anchor Admin
Samoa Enterprise Admin
NestJS Controllers
Prisma Admin Audit 表
Prisma Samoa Formation 表
RBAC 权限建议
高危操作 MFA 规则
Samoa 公司设立后台流程
```



现在 DID 系统具备完整后台治理能力：



```Plain Text
Issuer Governance
Schema Governance
Credential Governance
Revocation Governance
Anchor Governance
Samoa Formation Review
Audit / RBAC / MFA
```



---



# 26\. 下一章继续



下一章：



# 《DID 身份 Part 12：完整联调验收 / 安全测试 / 上线 Checklist》



将覆盖：



```Plain Text
DID 生成验收
钱包绑定验收
Issuer Trust 验收
Schema 验收
VC 签发验收
VC 验证验收
撤销验收
链上 Anchor 验收
隐私保护验收
五大业务域验收
萨摩亚公司设立验收
后台管理验收
安全测试
性能测试
上线 Checklist
P0 回滚方案
```



