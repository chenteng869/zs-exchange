# A07\-《DID 身份 Part 7：VC Status / Revocation：StatusList2021 / 链上撤销根 / 凭证生命周期》

# 《DID 身份 Part 7：VC Status / Revocation：StatusList2021 / 链上撤销根 / 凭证生命周期》



本章实现 DID 身份系统的凭证状态与撤销体系，覆盖：



- Credential Status Issuer

- StatusList2021 Credential

- Bitstring Revocation

- Suspension

- On\-chain Revocation Registry

- Revocation Root Anchor

- Credential Lifecycle

- `Issue / Active / Suspended / Revoked / Expired`

- 五大业务域撤销规则

- 萨摩亚公司证书撤销

- 博彩自我排除状态更新

- 金融资格吊销

- 交易所提现权限吊销

- 跨境电商商户 KYB 吊销

    

核心原则：



```Plain Text
VC 一旦签发，不代表永远有效。
工业级 DID 系统必须支持：
可撤销、可暂停、可过期、可审计、可链上锚定撤销根。
```



---



# 1\. 为什么撤销系统必须提前做



如果没有撤销机制，会导致：



```Plain Text
1. 已失效 KYC 继续使用
2. 被制裁用户继续提现
3. 博彩自我排除用户继续下注
4. 金融合格投资者资格失效后继续投资
5. 萨摩亚公司证书吊销后继续展示有效
6. 跨境电商商户 KYB 吊销后继续收款
```



因此：



```Plain Text
credentialStatus 必须成为所有高价值 VC 的必填字段。
```



---



# 2\. 状态模型



```Plain Text
draft
  -> issued
  -> active
  -> suspended
  -> revoked
  -> expired
```



状态规则：



```Plain Text
issued    已签发，但可等待链上锚定
active    当前有效
suspended 临时暂停，可恢复
revoked   永久撤销，不可恢复
expired   到期失效
```



---



# 3\. 本章目录



```Bash
src/modules/did/
  core/
    credential-lifecycle/
      credential-lifecycle.types.ts
      credential-lifecycle.repository.ts
      credential-lifecycle.service.ts
      credential-lifecycle-policy.service.ts
      credential-lifecycle-audit.service.ts

    revocation/
      credential-status.types.ts
      status-list2021.types.ts
      status-list2021-bitstring.service.ts
      status-list2021.repository.ts
      status-list2021.service.ts
      revocation-registry.repository.ts
      revocation.service.ts
      suspension.service.ts
      revocation-anchor.service.ts

    domains/
      exchange/
        exchange-revocation-policy.service.ts
      commerce/
        commerce-revocation-policy.service.ts
      gaming/
        gaming-revocation-policy.service.ts
      financial/
        financial-revocation-policy.service.ts
      samoa-enterprise/
        samoa-enterprise-revocation-policy.service.ts
```



---



# 4\. Credential Lifecycle 类型



## `core/credential-lifecycle/credential-lifecycle.types.ts`



```TypeScript
import { DIDString } from '../did/did.types';
import { DIDBusinessDomain } from '../domain/did-domain.types';
import { DomainCredentialType } from '../domain/did-domain-credential.types';

export type CredentialLifecycleStatus =
  | 'draft'
  | 'issued'
  | 'active'
  | 'suspended'
  | 'revoked'
  | 'expired';

export interface CredentialLifecycleRecord {
  credentialId: string;
  credentialHash: string;

  domain: DIDBusinessDomain;
  credentialType: DomainCredentialType;

  issuerDid: DIDString;
  subjectDid: DIDString;

  status: CredentialLifecycleStatus;

  issuanceDate: string;
  expirationDate?: string;

  statusListId?: string;
  statusListIndex?: number;

  anchor?: {
    chainId: string;
    registryAddress: string;
    txHash: string;
  };

  suspension?: {
    reason?: string;
    suspendedAt: number;
    suspendedBy?: string;
  };

  revocation?: {
    reason?: string;
    revokedAt: number;
    revokedBy?: string;
  };

  metadata?: Record;

  createdAt: number;
  updatedAt: number;
}

export interface CredentialStatusTransitionInput {
  credentialId: string;
  reason?: string;
  operatorId?: string;
  metadata?: Record;
}
```



---



# 5\. Lifecycle Repository



## `core/credential-lifecycle/credential-lifecycle.repository.ts`



```TypeScript
import {
  CredentialLifecycleRecord,
  CredentialLifecycleStatus,
} from './credential-lifecycle.types';

export interface CredentialLifecycleRepository {
  create(record: CredentialLifecycleRecord): Promise;
  update(record: CredentialLifecycleRecord): Promise;
  getById(credentialId: string): Promise;
  getByHash(credentialHash: string): Promise;
  list(query?: {
    domain?: string;
    credentialType?: string;
    issuerDid?: string;
    subjectDid?: string;
    status?: CredentialLifecycleStatus;
  }): Promise;
}

export class InMemoryCredentialLifecycleRepository
  implements CredentialLifecycleRepository {
  private readonly records = new Map();

  async create(record: CredentialLifecycleRecord): Promise {
    this.records.set(record.credentialId, record);
  }

  async update(record: CredentialLifecycleRecord): Promise {
    this.records.set(record.credentialId, record);
  }

  async getById(credentialId: string): Promise {
    return this.records.get(credentialId) ?? null;
  }

  async getByHash(credentialHash: string): Promise {
    return (
      Array.from(this.records.values()).find(
        (item) => item.credentialHash.toLowerCase() === credentialHash.toLowerCase(),
      ) ?? null
    );
  }

  async list(query: {
    domain?: string;
    credentialType?: string;
    issuerDid?: string;
    subjectDid?: string;
    status?: CredentialLifecycleStatus;
  } = {}): Promise {
    return Array.from(this.records.values())
      .filter((item) => !query.domain || item.domain === query.domain)
      .filter((item) => !query.credentialType || item.credentialType === query.credentialType)
      .filter((item) => !query.issuerDid || item.issuerDid === query.issuerDid)
      .filter((item) => !query.subjectDid || item.subjectDid === query.subjectDid)
      .filter((item) => !query.status || item.status === query.status)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }
}
```



---



# 6\. Lifecycle Audit



## `core/credential-lifecycle/credential-lifecycle-audit.service.ts`



```TypeScript
export interface CredentialLifecycleAuditRecord {
  auditNo: string;

  action:
    | 'credential.lifecycle.created'
    | 'credential.lifecycle.activated'
    | 'credential.lifecycle.suspended'
    | 'credential.lifecycle.resumed'
    | 'credential.lifecycle.revoked'
    | 'credential.lifecycle.expired'
    | 'credential.lifecycle.anchor_updated';

  result: 'success' | 'failed';

  credentialId?: string;
  credentialHash?: string;
  domain?: string;
  credentialType?: string;
  issuerDid?: string;
  subjectDid?: string;

  operatorId?: string;
  reason?: string;

  metadata?: unknown;
  error?: unknown;

  createdAt: number;
}

export interface CredentialLifecycleAuditSink {
  record(input: CredentialLifecycleAuditRecord): Promise;
}

export class ConsoleCredentialLifecycleAuditSink
  implements CredentialLifecycleAuditSink {
  async record(input: CredentialLifecycleAuditRecord): Promise {
    console.log('[CredentialLifecycleAudit]', input);
  }
}

export class CredentialLifecycleAuditService {
  constructor(
    private readonly sink: CredentialLifecycleAuditSink =
      new ConsoleCredentialLifecycleAuditSink(),
  ) {}

  async success(
    action: CredentialLifecycleAuditRecord['action'],
    input: Omit,
  ) {
    await this.record(action, 'success', input);
  }

  async failed(
    action: CredentialLifecycleAuditRecord['action'],
    input: Omit,
  ) {
    await this.record(action, 'failed', input);
  }

  private async record(
    action: CredentialLifecycleAuditRecord['action'],
    result: CredentialLifecycleAuditRecord['result'],
    input: Omit,
  ) {
    await this.sink.record({
      auditNo: `CLAUD-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`,
      action,
      result,
      ...input,
      createdAt: Date.now(),
    });
  }
}
```



---



# 7\. Lifecycle Policy



## `core/credential-lifecycle/credential-lifecycle-policy.service.ts`



```TypeScript
import { CredentialLifecycleRecord } from './credential-lifecycle.types';

export class CredentialLifecyclePolicyService {
  canSuspend(record: CredentialLifecycleRecord): boolean {
    return record.status === 'issued' || record.status === 'active';
  }

  canResume(record: CredentialLifecycleRecord): boolean {
    return record.status === 'suspended';
  }

  canRevoke(record: CredentialLifecycleRecord): boolean {
    return record.status !== 'revoked' && record.status !== 'expired';
  }

  canActivate(record: CredentialLifecycleRecord): boolean {
    return record.status === 'issued' || record.status === 'suspended';
  }

  isExpired(record: CredentialLifecycleRecord): boolean {
    if (!record.expirationDate) return false;
    return new Date(record.expirationDate).getTime() ) {
    const now = Date.now();

    const full: CredentialLifecycleRecord = {
      ...record,
      createdAt: now,
      updatedAt: now,
    };

    await this.repo.create(full);

    await this.audit.success('credential.lifecycle.created', {
      credentialId: full.credentialId,
      credentialHash: full.credentialHash,
      domain: full.domain,
      credentialType: full.credentialType,
      issuerDid: full.issuerDid,
      subjectDid: full.subjectDid,
      metadata: full,
    });

    return full;
  }

  async activate(input: CredentialStatusTransitionInput) {
    const record = await this.require(input.credentialId);

    if (!this.policy.canActivate(record)) {
      throw new Error(`CREDENTIAL_CANNOT_ACTIVATE_FROM_${record.status}`);
    }

    const updated: CredentialLifecycleRecord = {
      ...record,
      status: 'active',
      updatedAt: Date.now(),
    };

    await this.repo.update(updated);

    await this.audit.success('credential.lifecycle.activated', {
      credentialId: updated.credentialId,
      credentialHash: updated.credentialHash,
      operatorId: input.operatorId,
      reason: input.reason,
    });

    return updated;
  }

  async suspend(input: CredentialStatusTransitionInput) {
    const record = await this.require(input.credentialId);

    if (!this.policy.canSuspend(record)) {
      throw new Error(`CREDENTIAL_CANNOT_SUSPEND_FROM_${record.status}`);
    }

    const updated: CredentialLifecycleRecord = {
      ...record,
      status: 'suspended',
      suspension: {
        reason: input.reason,
        suspendedAt: Date.now(),
        suspendedBy: input.operatorId,
      },
      updatedAt: Date.now(),
    };

    await this.repo.update(updated);

    await this.audit.success('credential.lifecycle.suspended', {
      credentialId: updated.credentialId,
      credentialHash: updated.credentialHash,
      operatorId: input.operatorId,
      reason: input.reason,
      metadata: input.metadata,
    });

    return updated;
  }

  async resume(input: CredentialStatusTransitionInput) {
    const record = await this.require(input.credentialId);

    if (!this.policy.canResume(record)) {
      throw new Error(`CREDENTIAL_CANNOT_RESUME_FROM_${record.status}`);
    }

    const updated: CredentialLifecycleRecord = {
      ...record,
      status: 'active',
      suspension: undefined,
      updatedAt: Date.now(),
    };

    await this.repo.update(updated);

    await this.audit.success('credential.lifecycle.resumed', {
      credentialId: updated.credentialId,
      credentialHash: updated.credentialHash,
      operatorId: input.operatorId,
      reason: input.reason,
    });

    return updated;
  }

  async revoke(input: CredentialStatusTransitionInput) {
    const record = await this.require(input.credentialId);

    if (!this.policy.canRevoke(record)) {
      throw new Error(`CREDENTIAL_CANNOT_REVOKE_FROM_${record.status}`);
    }

    const updated: CredentialLifecycleRecord = {
      ...record,
      status: 'revoked',
      revocation: {
        reason: input.reason,
        revokedAt: Date.now(),
        revokedBy: input.operatorId,
      },
      updatedAt: Date.now(),
    };

    await this.repo.update(updated);

    await this.audit.success('credential.lifecycle.revoked', {
      credentialId: updated.credentialId,
      credentialHash: updated.credentialHash,
      operatorId: input.operatorId,
      reason: input.reason,
      metadata: input.metadata,
    });

    return updated;
  }

  async expire(credentialId: string) {
    const record = await this.require(credentialId);

    if (!this.policy.isExpired(record)) {
      return record;
    }

    const updated: CredentialLifecycleRecord = {
      ...record,
      status: 'expired',
      updatedAt: Date.now(),
    };

    await this.repo.update(updated);

    await this.audit.success('credential.lifecycle.expired', {
      credentialId: updated.credentialId,
      credentialHash: updated.credentialHash,
    });

    return updated;
  }

  async updateAnchor(input: {
    credentialId: string;
    anchor: CredentialLifecycleRecord['anchor'];
  }) {
    const record = await this.require(input.credentialId);

    const updated: CredentialLifecycleRecord = {
      ...record,
      anchor: input.anchor,
      updatedAt: Date.now(),
    };

    await this.repo.update(updated);

    await this.audit.success('credential.lifecycle.anchor_updated', {
      credentialId: updated.credentialId,
      credentialHash: updated.credentialHash,
      metadata: input.anchor,
    });

    return updated;
  }

  private async require(credentialId: string): Promise {
    const record = await this.repo.getById(credentialId);

    if (!record) {
      throw new Error(`CREDENTIAL_LIFECYCLE_NOT_FOUND:${credentialId}`);
    }

    return record;
  }
}
```



---



# 9\. StatusList2021 类型



## `core/revocation/status-list2021.types.ts`



```TypeScript
import { DIDString } from '../did/did.types';

export type StatusPurpose =
  | 'revocation'
  | 'suspension';

export interface StatusList2021Record {
  listId: string;
  issuerDid: DIDString;
  purpose: StatusPurpose;

  encodedList: string;
  size: number;

  rootHash?: string;

  anchor?: {
    chainId: string;
    registryAddress: string;
    txHash: string;
  };

  createdAt: number;
  updatedAt: number;
}

export interface StatusList2021EntryAllocation {
  listId: string;
  index: number;
  statusListCredentialUrl: string;
}
```



---



# 10\. StatusList Bitstring Service



生产 StatusList2021 使用压缩 bitstring。这里先实现可测试的二进制字符串版，再保留压缩接口。



## `core/revocation/status-list2021-bitstring.service.ts`



```TypeScript
export class StatusList2021BitstringService {
  create(size = 131072): string {
    return '0'.repeat(size);
  }

  getBit(encodedList: string, index: number): boolean {
    this.assertIndex(encodedList, index);
    return encodedList[index] === '1';
  }

  setBit(encodedList: string, index: number, value: boolean): string {
    this.assertIndex(encodedList, index);

    return (
      encodedList.slice(0, index) +
      (value ? '1' : '0') +
      encodedList.slice(index + 1)
    );
  }

  countUsed(encodedList: string): number {
    let count = 0;

    for (const item of encodedList) {
      if (item === '1') count++;
    }

    return count;
  }

  private assertIndex(encodedList: string, index: number) {
    if (!Number.isSafeInteger(index) || index = encodedList.length) {
      throw new Error(`STATUS_LIST_INDEX_OUT_OF_RANGE:${index}`);
    }
  }
}
```



---



# 11\. StatusList Repository



## `core/revocation/status-list2021.repository.ts`



```TypeScript
import { StatusList2021Record } from './status-list2021.types';

export interface StatusList2021Repository {
  create(record: StatusList2021Record): Promise;
  update(record: StatusList2021Record): Promise;
  get(listId: string): Promise;
  list(query?: {
    issuerDid?: string;
    purpose?: string;
  }): Promise;
}

export class InMemoryStatusList2021Repository
  implements StatusList2021Repository {
  private readonly lists = new Map();

  async create(record: StatusList2021Record): Promise {
    this.lists.set(record.listId, record);
  }

  async update(record: StatusList2021Record): Promise {
    this.lists.set(record.listId, record);
  }

  async get(listId: string): Promise {
    return this.lists.get(listId) ?? null;
  }

  async list(query: {
    issuerDid?: string;
    purpose?: string;
  } = {}): Promise {
    return Array.from(this.lists.values())
      .filter((item) => !query.issuerDid || item.issuerDid === query.issuerDid)
      .filter((item) => !query.purpose || item.purpose === query.purpose)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }
}
```



---



# 12\. StatusList2021 Service



## `core/revocation/status-list2021.service.ts`



```TypeScript
import { AnchorHashService } from '../anchor/anchor-hash.service';
import { DIDString } from '../did/did.types';
import {
  StatusList2021EntryAllocation,
  StatusList2021Record,
  StatusPurpose,
} from './status-list2021.types';
import { StatusList2021Repository } from './status-list2021.repository';
import { StatusList2021BitstringService } from './status-list2021-bitstring.service';

export class StatusList2021ManagementService {
  constructor(
    private readonly repo: StatusList2021Repository,
    private readonly bitstring: StatusList2021BitstringService,
    private readonly hash: AnchorHashService,
  ) {}

  async createList(input: {
    issuerDid: DIDString;
    purpose: StatusPurpose;
    size?: number;
  }): Promise {
    const now = Date.now();
    const size = input.size ?? 131072;
    const encodedList = this.bitstring.create(size);

    const record: StatusList2021Record = {
      listId: this.newListId(input.purpose),
      issuerDid: input.issuerDid,
      purpose: input.purpose,
      encodedList,
      size,
      rootHash: this.hash.hashString(encodedList),
      createdAt: now,
      updatedAt: now,
    };

    await this.repo.create(record);

    return record;
  }

  async allocateEntry(input: {
    issuerDid: DIDString;
    purpose: StatusPurpose;
    statusListBaseUrl: string;
  }): Promise {
    let list = (await this.repo.list({
      issuerDid: input.issuerDid,
      purpose: input.purpose,
    }))[0];

    if (!list) {
      list = await this.createList({
        issuerDid: input.issuerDid,
        purpose: input.purpose,
      });
    }

    const index = this.findFreeIndex(list.encodedList);

    return {
      listId: list.listId,
      index,
      statusListCredentialUrl: `${input.statusListBaseUrl}/${list.listId}`,
    };
  }

  async setStatus(input: {
    listId: string;
    index: number;
    value: boolean;
  }): Promise {
    const list = await this.require(input.listId);

    const encodedList = this.bitstring.setBit(
      list.encodedList,
      input.index,
      input.value,
    );

    const updated: StatusList2021Record = {
      ...list,
      encodedList,
      rootHash: this.hash.hashString(encodedList),
      updatedAt: Date.now(),
    };

    await this.repo.update(updated);

    return updated;
  }

  async isSet(input: {
    listId: string;
    index: number;
  }): Promise {
    const list = await this.require(input.listId);
    return this.bitstring.getBit(list.encodedList, input.index);
  }

  async getCredential(listId: string) {
    const list = await this.require(listId);

    return {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3id.org/vc/status-list/2021/v1',
      ],
      id: `urn:status-list:${list.listId}`,
      type: [
        'VerifiableCredential',
        'StatusList2021Credential',
      ],
      issuer: list.issuerDid,
      issuanceDate: new Date(list.createdAt).toISOString(),
      credentialSubject: {
        id: `urn:status-list:${list.listId}#list`,
        type: 'StatusList2021',
        statusPurpose: list.purpose,
        encodedList: list.encodedList,
      },
    };
  }

  private findFreeIndex(encodedList: string): number {
    const index = encodedList.indexOf('0');

    if (index === -1) {
      throw new Error('STATUS_LIST_FULL');
    }

    return index;
  }

  private async require(listId: string): Promise {
    const list = await this.repo.get(listId);

    if (!list) {
      throw new Error(`STATUS_LIST_NOT_FOUND:${listId}`);
    }

    return list;
  }

  private newListId(purpose: StatusPurpose): string {
    return `SL2021-${purpose}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
```



---



# 13\. Revocation Repository



## `core/revocation/revocation-registry.repository.ts`



```TypeScript
export interface RevokedCredentialRecord {
  credentialHash: string;
  credentialId?: string;
  reason?: string;
  revokedBy?: string;
  revokedAt: number;
}

export interface RevocationRegistryRepository {
  isRevoked(credentialHash: string): Promise;
  get(credentialHash: string): Promise;
  revoke(input: RevokedCredentialRecord): Promise;
}

export class InMemoryRevocationRegistryRepository
  implements RevocationRegistryRepository {
  private readonly revoked = new Map();

  async isRevoked(credentialHash: string): Promise {
    return this.revoked.has(credentialHash.toLowerCase());
  }

  async get(credentialHash: string): Promise {
    return this.revoked.get(credentialHash.toLowerCase()) ?? null;
  }

  async revoke(input: RevokedCredentialRecord): Promise {
    this.revoked.set(input.credentialHash.toLowerCase(), {
      ...input,
      credentialHash: input.credentialHash.toLowerCase(),
    });
  }
}
```



---



# 14\. Revocation Service



## `core/revocation/revocation.service.ts`



```TypeScript
import { CredentialLifecycleService } from '../credential-lifecycle/credential-lifecycle.service';
import { CredentialLifecycleRepository } from '../credential-lifecycle/credential-lifecycle.repository';
import { RevocationRegistryRepository } from './revocation-registry.repository';
import { StatusList2021ManagementService } from './status-list2021.service';

export class RevocationService {
  constructor(
    private readonly lifecycleRepo: CredentialLifecycleRepository,
    private readonly lifecycle: CredentialLifecycleService,
    private readonly revocationRepo: RevocationRegistryRepository,
    private readonly statusList: StatusList2021ManagementService,
  ) {}

  async revoke(input: {
    credentialId: string;
    reason?: string;
    operatorId?: string;
  }) {
    const record = await this.lifecycleRepo.getById(input.credentialId);

    if (!record) {
      throw new Error(`CREDENTIAL_NOT_FOUND:${input.credentialId}`);
    }

    await this.revocationRepo.revoke({
      credentialHash: record.credentialHash,
      credentialId: record.credentialId,
      reason: input.reason,
      revokedBy: input.operatorId,
      revokedAt: Date.now(),
    });

    if (
      record.statusListId &&
      record.statusListIndex !== undefined
    ) {
      await this.statusList.setStatus({
        listId: record.statusListId,
        index: record.statusListIndex,
        value: true,
      });
    }

    return this.lifecycle.revoke({
      credentialId: input.credentialId,
      reason: input.reason,
      operatorId: input.operatorId,
    });
  }
}
```



---



# 15\. Suspension Service



## `core/revocation/suspension.service.ts`



```TypeScript
import { CredentialLifecycleService } from '../credential-lifecycle/credential-lifecycle.service';
import { CredentialLifecycleRepository } from '../credential-lifecycle/credential-lifecycle.repository';
import { StatusList2021ManagementService } from './status-list2021.service';

export class SuspensionService {
  constructor(
    private readonly lifecycleRepo: CredentialLifecycleRepository,
    private readonly lifecycle: CredentialLifecycleService,
    private readonly statusList: StatusList2021ManagementService,
  ) {}

  async suspend(input: {
    credentialId: string;
    reason?: string;
    operatorId?: string;
  }) {
    const record = await this.lifecycleRepo.getById(input.credentialId);

    if (!record) {
      throw new Error(`CREDENTIAL_NOT_FOUND:${input.credentialId}`);
    }

    if (
      record.statusListId &&
      record.statusListIndex !== undefined
    ) {
      await this.statusList.setStatus({
        listId: record.statusListId,
        index: record.statusListIndex,
        value: true,
      });
    }

    return this.lifecycle.suspend(input);
  }

  async resume(input: {
    credentialId: string;
    reason?: string;
    operatorId?: string;
  }) {
    const record = await this.lifecycleRepo.getById(input.credentialId);

    if (!record) {
      throw new Error(`CREDENTIAL_NOT_FOUND:${input.credentialId}`);
    }

    if (
      record.statusListId &&
      record.statusListIndex !== undefined
    ) {
      await this.statusList.setStatus({
        listId: record.statusListId,
        index: record.statusListIndex,
        value: false,
      });
    }

    return this.lifecycle.resume(input);
  }
}
```



---



# 16\. Revocation Anchor Service



链上只锚定 root，不暴露撤销列表明文。



## `core/revocation/revocation-anchor.service.ts`



```TypeScript
import { StatusList2021Repository } from './status-list2021.repository';

export interface RevocationRootAnchorClient {
  anchorRoot(input: {
    listId: string;
    rootHash: string;
  }): Promise;
}

export class RevocationAnchorService {
  constructor(
    private readonly statusListRepo: StatusList2021Repository,
    private readonly client?: RevocationRootAnchorClient,
  ) {}

  async anchorStatusListRoot(listId: string) {
    if (!this.client) {
      throw new Error('REVOCATION_ANCHOR_CLIENT_NOT_CONFIGURED');
    }

    const list = await this.statusListRepo.get(listId);

    if (!list) {
      throw new Error(`STATUS_LIST_NOT_FOUND:${listId}`);
    }

    if (!list.rootHash) {
      throw new Error('STATUS_LIST_ROOT_HASH_MISSING');
    }

    const anchor = await this.client.anchorRoot({
      listId,
      rootHash: list.rootHash,
    });

    const updated = {
      ...list,
      anchor,
      updatedAt: Date.now(),
    };

    await this.statusListRepo.update(updated);

    return updated;
  }
}
```



---



# 17\. 交易所撤销策略



## `core/domains/exchange/exchange-revocation-policy.service.ts`



```TypeScript
export class ExchangeRevocationPolicyService {
  shouldRevoke(input: {
    credentialType: string;
    event:
      | 'sanctions_hit'
      | 'aml_high_risk'
      | 'kyc_expired'
      | 'wallet_compromised'
      | 'travel_rule_failed';
  }): boolean {
    if (input.event === 'sanctions_hit') return true;
    if (input.event === 'aml_high_risk') return true;
    if (input.event === 'wallet_compromised') {
      return [
        'WalletOwnership',
        'ExchangeWithdrawalPermission',
      ].includes(input.credentialType);
    }

    if (input.event === 'travel_rule_failed') {
      return input.credentialType === 'ExchangeTravelRuleCompliance';
    }

    if (input.event === 'kyc_expired') {
      return input.credentialType === 'ExchangeKYCLevel';
    }

    return false;
  }
}
```



---



# 18\. 博彩撤销策略



## `core/domains/gaming/gaming-revocation-policy.service.ts`



```TypeScript
export class GamingRevocationPolicyService {
  shouldRevokeOrSuspend(input: {
    credentialType: string;
    event:
      | 'self_exclusion'
      | 'geo_ineligible'
      | 'age_verification_failed'
      | 'responsible_limit_breach'
      | 'aml_high_risk';
  }): 'revoke' | 'suspend' | 'none' {
    if (input.event === 'self_exclusion') {
      if (
        [
          'GamingBettingPermission',
          'GamingResponsibleGamingLimit',
        ].includes(input.credentialType)
      ) {
        return 'revoke';
      }

      return 'suspend';
    }

    if (input.event === 'geo_ineligible') {
      return input.credentialType === 'GamingGeoEligibility'
        ? 'revoke'
        : 'none';
    }

    if (input.event === 'age_verification_failed') {
      return [
        'GamingAgeOver18',
        'GamingAgeOver21',
      ].includes(input.credentialType)
        ? 'revoke'
        : 'none';
    }

    if (input.event === 'responsible_limit_breach') {
      return input.credentialType === 'GamingBettingPermission'
        ? 'suspend'
        : 'none';
    }

    if (input.event === 'aml_high_risk') {
      return 'suspend';
    }

    return 'none';
  }
}
```



---



# 19\. 金融撤销策略



## `core/domains/financial/financial-revocation-policy.service.ts`



```TypeScript
export class FinancialRevocationPolicyService {
  shouldRevoke(input: {
    credentialType: string;
    event:
      | 'sanctions_hit'
      | 'pep_failed'
      | 'risk_suitability_expired'
      | 'accreditation_invalid'
      | 'income_proof_invalid'
      | 'credit_score_expired';
  }): boolean {
    if (input.event === 'sanctions_hit') return true;

    if (input.event === 'pep_failed') {
      return [
        'PEPScreening',
        'FinancialInvestmentPermission',
      ].includes(input.credentialType);
    }

    if (input.event === 'risk_suitability_expired') {
      return input.credentialType === 'FinancialRiskSuitability';
    }

    if (input.event === 'accreditation_invalid') {
      return input.credentialType === 'FinancialAccreditedInvestor';
    }

    if (input.event === 'income_proof_invalid') {
      return input.credentialType === 'FinancialIncomeProof';
    }

    if (input.event === 'credit_score_expired') {
      return input.credentialType === 'FinancialCreditScore';
    }

    return false;
  }
}
```



---



# 20\. 跨境电商撤销策略



## `core/domains/commerce/commerce-revocation-policy.service.ts`



```TypeScript
export class CommerceRevocationPolicyService {
  shouldRevokeOrSuspend(input: {
    credentialType: string;
    event:
      | 'merchant_fraud'
      | 'tax_identity_invalid'
      | 'product_compliance_failed'
      | 'high_dispute_rate'
      | 'sanctions_hit';
  }): 'revoke' | 'suspend' | 'none' {
    if (input.event === 'sanctions_hit') return 'revoke';

    if (input.event === 'merchant_fraud') {
      return [
        'CommerceMerchantKYB',
        'CommerceSellerIdentity',
      ].includes(input.credentialType)
        ? 'revoke'
        : 'suspend';
    }

    if (input.event === 'tax_identity_invalid') {
      return input.credentialType === 'CommerceTaxIdentity'
        ? 'revoke'
        : 'none';
    }

    if (input.event === 'product_compliance_failed') {
      return input.credentialType === 'CommerceProductCompliance'
        ? 'suspend'
        : 'none';
    }

    if (input.event === 'high_dispute_rate') {
      return input.credentialType === 'CommerceDisputeReputation'
        ? 'suspend'
        : 'none';
    }

    return 'none';
  }
}
```



---



# 21\. 萨摩亚企业撤销策略



## `core/domains/samoa-enterprise/samoa-enterprise-revocation-policy.service.ts`



```TypeScript
export class SamoaEnterpriseRevocationPolicyService {
  shouldRevokeOrSuspend(input: {
    credentialType: string;
    event:
      | 'identity_fraud'
      | 'sanctions_hit'
      | 'pep_failed'
      | 'company_dissolved'
      | 'company_struck_off'
      | 'registered_agent_revoked'
      | 'ubo_false_declaration'
      | 'good_standing_failed'
      | 'license_revoked';
  }): 'revoke' | 'suspend' | 'none' {
    if (input.event === 'identity_fraud') {
      return [
        'SamoaEntrepreneurIdentity',
        'SamoaFounderIdentity',
        'SamoaDirectorIdentity',
        'SamoaShareholderIdentity',
      ].includes(input.credentialType)
        ? 'revoke'
        : 'suspend';
    }

    if (input.event === 'sanctions_hit') return 'revoke';

    if (input.event === 'pep_failed') {
      return [
        'SamoaPEPScreening',
        'SamoaOfficialServiceAccess',
      ].includes(input.credentialType)
        ? 'revoke'
        : 'suspend';
    }

    if (
      input.event === 'company_dissolved' ||
      input.event === 'company_struck_off'
    ) {
      return [
        'SamoaCompanyIncorporationCertificate',
        'SamoaCompanyGoodStanding',
        'SamoaBusinessLicenseEligibility',
      ].includes(input.credentialType)
        ? 'revoke'
        : 'none';
    }

    if (input.event === 'registered_agent_revoked') {
      return input.credentialType === 'SamoaRegisteredAgent'
        ? 'revoke'
        : 'suspend';
    }

    if (input.event === 'ubo_false_declaration') {
      return input.credentialType === 'SamoaUBODeclaration'
        ? 'revoke'
        : 'suspend';
    }

    if (input.event === 'good_standing_failed') {
      return input.credentialType === 'SamoaCompanyGoodStanding'
        ? 'revoke'
        : 'none';
    }

    if (input.event === 'license_revoked') {
      return input.credentialType === 'SamoaBusinessLicenseEligibility'
        ? 'revoke'
        : 'none';
    }

    return 'none';
  }
}
```



---



# 22\. Revocation Runtime



## `core/revocation/create-revocation-runtime.ts`



```TypeScript
import {
  InMemoryCredentialLifecycleRepository,
} from '../credential-lifecycle/credential-lifecycle.repository';
import { CredentialLifecyclePolicyService } from '../credential-lifecycle/credential-lifecycle-policy.service';
import { CredentialLifecycleAuditService } from '../credential-lifecycle/credential-lifecycle-audit.service';
import { CredentialLifecycleService } from '../credential-lifecycle/credential-lifecycle.service';

import { AnchorHashService } from '../anchor/anchor-hash.service';
import { StatusList2021BitstringService } from './status-list2021-bitstring.service';
import {
  InMemoryStatusList2021Repository,
} from './status-list2021.repository';
import { StatusList2021ManagementService } from './status-list2021.service';
import {
  InMemoryRevocationRegistryRepository,
} from './revocation-registry.repository';
import { RevocationService } from './revocation.service';
import { SuspensionService } from './suspension.service';
import {
  RevocationAnchorService,
  RevocationRootAnchorClient,
} from './revocation-anchor.service';

export function createRevocationRuntime(input: {
  anchorClient?: RevocationRootAnchorClient;
} = {}) {
  const lifecycleRepo = new InMemoryCredentialLifecycleRepository();
  const lifecyclePolicy = new CredentialLifecyclePolicyService();
  const lifecycleAudit = new CredentialLifecycleAuditService();

  const lifecycle = new CredentialLifecycleService(
    lifecycleRepo,
    lifecyclePolicy,
    lifecycleAudit,
  );

  const hash = new AnchorHashService();

  const statusListRepo = new InMemoryStatusList2021Repository();
  const bitstring = new StatusList2021BitstringService();

  const statusList = new StatusList2021ManagementService(
    statusListRepo,
    bitstring,
    hash,
  );

  const revocationRepo = new InMemoryRevocationRegistryRepository();

  const revocation = new RevocationService(
    lifecycleRepo,
    lifecycle,
    revocationRepo,
    statusList,
  );

  const suspension = new SuspensionService(
    lifecycleRepo,
    lifecycle,
    statusList,
  );

  const revocationAnchor = new RevocationAnchorService(
    statusListRepo,
    input.anchorClient,
  );

  return {
    lifecycleRepo,
    lifecyclePolicy,
    lifecycleAudit,
    lifecycle,

    hash,
    statusListRepo,
    bitstring,
    statusList,

    revocationRepo,
    revocation,
    suspension,
    revocationAnchor,
  };
}
```



---



# 23\. 签发 VC 时分配 credentialStatus



签发前先分配 StatusList entry：



```TypeScript
const entry = await revocationRuntime.statusList.allocateEntry({
  issuerDid: 'did:web:identity.samoa.example',
  purpose: 'revocation',
  statusListBaseUrl: 'https://identity.samoa.example/status',
});
```



生成 credentialStatus：



```TypeScript
const credentialStatus = {
  id: `${entry.statusListCredentialUrl}#${entry.index}`,
  type: 'StatusList2021Entry',
  statusPurpose: 'revocation',
  statusListIndex: String(entry.index),
  statusListCredential: entry.statusListCredentialUrl,
};
```



然后传入 Part 5 的签发：



```TypeScript
const result = await vcRuntime.issuer.issue({
  context: {
    domain: 'samoa_enterprise',
    issuerDid: 'did:web:identity.samoa.example',
    issuerKeyRef: 'kms:samoa-official-key-1',
    subjectDid: entrepreneurDid,
    credentialType: 'SamoaEntrepreneurIdentity',
    schemaId: 'schema:samoa:entrepreneur-identity:v1',
    format: 'jsonld_vc',
    status: credentialStatus,
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



写入 lifecycle：



```TypeScript
await revocationRuntime.lifecycle.create({
  credentialId: result.credentialId,
  credentialHash: result.credentialHash,
  domain: 'samoa_enterprise',
  credentialType: 'SamoaEntrepreneurIdentity',
  issuerDid: 'did:web:identity.samoa.example',
  subjectDid: entrepreneurDid,
  status: 'active',
  issuanceDate: new Date().toISOString(),
  expirationDate: undefined,
  statusListId: entry.listId,
  statusListIndex: entry.index,
});
```



---



# 24\. 撤销交易所提现权限



```TypeScript
await revocationRuntime.revocation.revoke({
  credentialId: 'urn:vc:exchange-withdraw:...',
  reason: 'AML high risk detected',
  operatorId: 'risk-admin-1',
});
```



效果：



```Plain Text
1. 本地 revocation registry 记录 revoked
2. StatusList bit 置为 1
3. Lifecycle 状态变为 revoked
4. 审计记录 credential.lifecycle.revoked
```



---



# 25\. 暂停博彩投注权限



```TypeScript
await revocationRuntime.suspension.suspend({
  credentialId: 'urn:vc:gaming-betting-permission:...',
  reason: 'Responsible gaming limit breach',
  operatorId: 'gaming-risk-admin',
});
```



恢复：



```TypeScript
await revocationRuntime.suspension.resume({
  credentialId: 'urn:vc:gaming-betting-permission:...',
  reason: 'Review completed',
  operatorId: 'gaming-compliance-admin',
});
```



---



# 26\. 撤销萨摩亚公司注册证书



```TypeScript
await revocationRuntime.revocation.revoke({
  credentialId: 'urn:vc:samoa-incorporation:...',
  reason: 'Company struck off',
  operatorId: 'samoa-registry-admin',
});
```



必须导致：



```Plain Text
SamoaCompanyIncorporationCertificate revoked
SamoaCompanyGoodStanding revoked
相关 BusinessLicenseEligibility revoked
后续 request_good_standing 失败
```



---



# 27\. 锚定 StatusList Root



```TypeScript
const updatedList = await revocationRuntime.revocationAnchor.anchorStatusListRoot(
  'SL2021-revocation-...',
);
```



链上只存：



```Plain Text
listId hash
rootHash
updatedAt
```



不存：



```Plain Text
credentialId
subjectDid
身份信息
撤销原因
```



---



# 28\. 验证时撤销检查



Part 6 的 `VCStatusVerifierService` 会检查：



```Plain Text
Local Revocation Registry
StatusList2021Entry
OnChainRevocationStatus
```



如果 StatusList bit 为 `1`：



```JSON
{
  "valid": false,
  "reason": "STATUS_LIST_REVOKED"
}
```



---



# 29\. 五大业务域撤销触发器



## 29\.1 交易所



```Plain Text
sanctions_hit -> revoke all high-risk permissions
aml_high_risk -> revoke withdrawal / trading permission
wallet_compromised -> revoke WalletOwnership
travel_rule_failed -> revoke TravelRuleCompliance
kyc_expired -> revoke or expire ExchangeKYCLevel
```



---



## 29\.2 跨境电商



```Plain Text
merchant_fraud -> revoke MerchantKYB
tax_identity_invalid -> revoke TaxIdentity
product_compliance_failed -> suspend ProductCompliance
high_dispute_rate -> suspend DisputeReputation
sanctions_hit -> revoke merchant permissions
```



---



## 29\.3 博彩



```Plain Text
self_exclusion -> revoke BettingPermission
geo_ineligible -> revoke GeoEligibility
age_verification_failed -> revoke AgeOver18 / AgeOver21
responsible_limit_breach -> suspend BettingPermission
aml_high_risk -> suspend withdrawals
```



---



## 29\.4 金融



```Plain Text
sanctions_hit -> revoke all financial permissions
pep_failed -> revoke / suspend InvestmentPermission
risk_suitability_expired -> expire RiskSuitability
accreditation_invalid -> revoke AccreditedInvestor
income_proof_invalid -> revoke IncomeProof
credit_score_expired -> expire CreditScore
```



---



## 29\.5 萨摩亚企业



```Plain Text
identity_fraud -> revoke Entrepreneur / Founder / Director identity
sanctions_hit -> revoke official service access
pep_failed -> suspend official service access
company_dissolved -> revoke IncorporationCertificate / GoodStanding
company_struck_off -> revoke CompanyGoodStanding
registered_agent_revoked -> revoke RegisteredAgent
ubo_false_declaration -> revoke UBODeclaration
license_revoked -> revoke BusinessLicenseEligibility
```



---



# 30\. 生产数据库建议



## Credential Lifecycle



```Plain Text
model DIDCredentialLifecycle {
  id              BigInt   @id @default(autoincrement())
  credentialId    String   @unique @db.VarChar(255)
  credentialHash  String   @unique @db.VarChar(128)

  domain          String   @db.VarChar(64)
  credentialType  String   @db.VarChar(128)

  issuerDid       String   @db.VarChar(512)
  subjectDid      String   @db.VarChar(512)

  status          String   @db.VarChar(32)

  issuanceDate    DateTime
  expirationDate  DateTime?

  statusListId    String?  @db.VarChar(128)
  statusListIndex Int?

  anchor           Json?
  suspension       Json?
  revocation       Json?
  metadata         Json?

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([domain])
  @@index([credentialType])
  @@index([issuerDid])
  @@index([subjectDid])
  @@index([status])
  @@index([statusListId])
  @@map("did_credential_lifecycle")
}
```



---



## StatusList



```Plain Text
model DIDStatusList2021 {
  id          BigInt   @id @default(autoincrement())
  listId      String   @unique @db.VarChar(128)
  issuerDid   String   @db.VarChar(512)
  purpose     String   @db.VarChar(32)

  encodedList String   @db.Text
  size        Int

  rootHash    String?  @db.VarChar(128)
  anchor      Json?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([issuerDid])
  @@index([purpose])
  @@index([rootHash])
  @@map("did_status_list_2021")
}
```



---



## Revocation Records



```Plain Text
model DIDRevokedCredential {
  id              BigInt   @id @default(autoincrement())
  credentialHash  String   @unique @db.VarChar(128)
  credentialId    String?  @db.VarChar(255)

  reason          String?  @db.VarChar(1024)
  revokedBy       String?  @db.VarChar(128)
  revokedAt       DateTime @default(now())

  @@index([credentialId])
  @@index([revokedAt])
  @@map("did_revoked_credentials")
}
```



---



# 31\. 安全要求



撤销系统必须满足：



```Plain Text
1. 高价值 VC 必须有 credentialStatus
2. 撤销不可逆
3. 暂停可恢复
4. StatusList root 可链上锚定
5. 链上不得暴露 subjectDid / credentialId 明文
6. 撤销原因不上链
7. 撤销操作必须审计
8. 监管域操作必须保留 operatorId
9. 博彩 self-exclusion 必须立即生效
10. 萨摩亚公司吊销必须级联撤销 GoodStanding
11. 金融合格投资者撤销后不能继续投资
12. 交易所提现权限撤销后不能提现
```



---



# 32\. 本章完成内容



本章完成：



```Plain Text
Credential Lifecycle 类型
Lifecycle Repository
Lifecycle Policy
Lifecycle Audit
Lifecycle Service
StatusList2021 类型
Bitstring Service
StatusList Repository
StatusList Management Service
Revocation Registry
Revocation Service
Suspension Service
Revocation Root Anchor
五大业务域撤销策略
签发时 credentialStatus 分配
撤销 / 暂停 / 恢复流程
链上 Root 锚定规则
生产数据库设计
```



现在 DID 身份系统具备完整凭证生命周期：



```Plain Text
Issue
  -> Active
  -> Suspended / Resumed
  -> Revoked
  -> Expired
  -> StatusList
  -> Root Anchor
```



---



# 33\. 下一章继续



下一章：



# 《DID 身份 Part 8：链上 DID Registry / Anchor Contract / Credential Hash 上链规则》



将覆盖：



```Plain Text
DIDAnchorRegistry.sol
CredentialAnchorRegistry.sol
RevocationRootRegistry.sol
IssuerRegistry Anchor
Solidity 合约
链上事件
Hash-only 规则
隐私保护上链
链上查询 Client
EVM Anchor Service
五大业务域上链策略
萨摩亚公司证书上链
金融资格证明上链
交易所 KYC commitment 上链
博彩年龄证明 commitment 上链
跨境电商 KYB commitment 上链
```



