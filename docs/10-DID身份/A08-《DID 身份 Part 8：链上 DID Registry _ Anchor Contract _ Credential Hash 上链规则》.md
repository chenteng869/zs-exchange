# A08\-《DID 身份 Part 8：链上 DID Registry / Anchor Contract / Credential Hash 上链规则》

# 《DID 身份 Part 8：链上 DID Registry / Anchor Contract / Credential Hash 上链规则》



本章实现 DID 身份系统的链上锚定层，覆盖：



- `DIDAnchorRegistry.sol`

- `CredentialAnchorRegistry.sol`

- `RevocationRootRegistry.sol`

- `IssuerRegistryAnchor.sol`

- Solidity 合约

- 链上事件

- Hash\-only 规则

- 隐私保护上链

- 链上查询 Client

- EVM Anchor Service

- 五大业务域上链策略

- 萨摩亚公司证书上链

- 金融资格证明上链

- 交易所 KYC commitment 上链

- 博彩年龄证明 commitment 上链

- 跨境电商 KYB commitment 上链

    

核心原则：



```Plain Text
链上只保存 hash / commitment / root。
链上绝不保存身份明文、VC 明文、DID Document 明文、KYC 信息、UBO 信息、博彩记录、金融资产明细。
```



---



# 1\. 上链边界



## 1\.1 允许上链



```Plain Text
didHash
didDocumentHash
credentialHash
schemaHash
issuerDidHash
subjectDidHash
statusListRoot
revocationRoot
walletBindingHash
companyNumberHash
applicationIdHash
```



## 1\.2 禁止上链



```Plain Text
姓名
身份证
护照号
出生日期
真实地址
手机号
邮箱
完整 DID
完整 VC
完整 DID Document
公司文件原文
UBO 明文
AML / PEP / Sanctions 详情
博彩记录
金融资产明细
电商税号明文
```



---



# 2\. 链上架构



```Plain Text
DIDAnchorRegistry
  - DID Document Hash

CredentialAnchorRegistry
  - VC Hash / Commitment

RevocationRootRegistry
  - StatusList Root / Revocation Root

IssuerRegistryAnchor
  - Trusted Issuer Hash / Status Hash
```



---



# 3\. 本章目录



```Bash
src/modules/did/
  contracts/
    access/
      DIDAccessControl.sol
    registry/
      DIDAnchorRegistry.sol
      CredentialAnchorRegistry.sol
      RevocationRootRegistry.sol
      IssuerRegistryAnchor.sol

  core/
    anchor/
      anchor.types.ts
      anchor-policy.types.ts
      anchor-privacy-policy.service.ts
      anchor-payload-builder.service.ts
      evm-anchor-client.types.ts
      evm-anchor-client.service.ts
      did-anchor.service.ts
      credential-anchor.service.ts
      revocation-root-anchor.service.ts
      issuer-anchor.service.ts
      domain-anchor-policy.service.ts
```



---



# 4\. Solidity：Access Control



## `contracts/access/DIDAccessControl.sol`



```Solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DIDAccessControl {
    address public owner;

    mapping(address => bool) public anchors;
    mapping(address => bool) public issuers;
    mapping(address => bool) public revokers;

    event OwnerTransferred(address indexed previousOwner, address indexed newOwner);
    event AnchorUpdated(address indexed account, bool enabled);
    event IssuerUpdated(address indexed account, bool enabled);
    event RevokerUpdated(address indexed account, bool enabled);

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    modifier onlyAnchor() {
        require(anchors[msg.sender] || msg.sender == owner, "NOT_ANCHOR");
        _;
    }

    modifier onlyIssuer() {
        require(issuers[msg.sender] || msg.sender == owner, "NOT_ISSUER");
        _;
    }

    modifier onlyRevoker() {
        require(revokers[msg.sender] || msg.sender == owner, "NOT_REVOKER");
        _;
    }

    constructor(address initialOwner) {
        require(initialOwner != address(0), "INVALID_OWNER");
        owner = initialOwner;
        emit OwnerTransferred(address(0), initialOwner);
    }

    function transferOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "INVALID_OWNER");
        emit OwnerTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setAnchor(address account, bool enabled) external onlyOwner {
        anchors[account] = enabled;
        emit AnchorUpdated(account, enabled);
    }

    function setIssuer(address account, bool enabled) external onlyOwner {
        issuers[account] = enabled;
        emit IssuerUpdated(account, enabled);
    }

    function setRevoker(address account, bool enabled) external onlyOwner {
        revokers[account] = enabled;
        emit RevokerUpdated(account, enabled);
    }
}
```



---



# 5\. DID Anchor Registry



只存：



```Plain Text
didHash
documentHash
controller
updatedAt
```



## `contracts/registry/DIDAnchorRegistry.sol`



```Solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../access/DIDAccessControl.sol";

contract DIDAnchorRegistry is DIDAccessControl {
    struct DIDAnchorRecord {
        bytes32 documentHash;
        address controller;
        uint256 updatedAt;
        bool active;
    }

    mapping(bytes32 => DIDAnchorRecord) private records;

    event DIDAnchored(
        bytes32 indexed didHash,
        bytes32 indexed documentHash,
        address indexed controller,
        uint256 updatedAt
    );

    event DIDDeactivated(
        bytes32 indexed didHash,
        address indexed controller,
        uint256 updatedAt
    );

    constructor(address initialOwner) DIDAccessControl(initialOwner) {}

    function anchorDID(
        bytes32 didHash,
        bytes32 documentHash,
        address controller
    ) external onlyAnchor {
        require(didHash != bytes32(0), "INVALID_DID_HASH");
        require(documentHash != bytes32(0), "INVALID_DOCUMENT_HASH");
        require(controller != address(0), "INVALID_CONTROLLER");

        records[didHash] = DIDAnchorRecord({
            documentHash: documentHash,
            controller: controller,
            updatedAt: block.timestamp,
            active: true
        });

        emit DIDAnchored(
            didHash,
            documentHash,
            controller,
            block.timestamp
        );
    }

    function deactivateDID(bytes32 didHash) external onlyAnchor {
        DIDAnchorRecord storage record = records[didHash];
        require(record.active, "DID_NOT_ACTIVE");

        record.active = false;
        record.updatedAt = block.timestamp;

        emit DIDDeactivated(
            didHash,
            record.controller,
            block.timestamp
        );
    }

    function getDIDAnchor(bytes32 didHash)
        external
        view
        returns (
            bytes32 documentHash,
            address controller,
            uint256 updatedAt,
            bool active
        )
    {
        DIDAnchorRecord memory record = records[didHash];

        return (
            record.documentHash,
            record.controller,
            record.updatedAt,
            record.active
        );
    }
}
```



---



# 6\. Credential Anchor Registry



只存 VC hash / commitment。



## `contracts/registry/CredentialAnchorRegistry.sol`



```Solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../access/DIDAccessControl.sol";

contract CredentialAnchorRegistry is DIDAccessControl {
    struct CredentialAnchorRecord {
        bytes32 issuerHash;
        bytes32 subjectHash;
        bytes32 schemaHash;
        bytes32 domainHash;
        uint256 issuedAt;
        uint256 anchoredAt;
        bool active;
    }

    mapping(bytes32 => CredentialAnchorRecord) private records;

    event CredentialAnchored(
        bytes32 indexed credentialHash,
        bytes32 indexed issuerHash,
        bytes32 indexed subjectHash,
        bytes32 schemaHash,
        bytes32 domainHash,
        uint256 issuedAt,
        uint256 anchoredAt
    );

    event CredentialAnchorDeactivated(
        bytes32 indexed credentialHash,
        uint256 updatedAt
    );

    constructor(address initialOwner) DIDAccessControl(initialOwner) {}

    function anchorCredential(
        bytes32 credentialHash,
        bytes32 issuerHash,
        bytes32 subjectHash,
        bytes32 schemaHash,
        bytes32 domainHash,
        uint256 issuedAt
    ) external onlyIssuer {
        require(credentialHash != bytes32(0), "INVALID_CREDENTIAL_HASH");
        require(issuerHash != bytes32(0), "INVALID_ISSUER_HASH");
        require(subjectHash != bytes32(0), "INVALID_SUBJECT_HASH");
        require(schemaHash != bytes32(0), "INVALID_SCHEMA_HASH");
        require(domainHash != bytes32(0), "INVALID_DOMAIN_HASH");
        require(issuedAt > 0, "INVALID_ISSUED_AT");

        records[credentialHash] = CredentialAnchorRecord({
            issuerHash: issuerHash,
            subjectHash: subjectHash,
            schemaHash: schemaHash,
            domainHash: domainHash,
            issuedAt: issuedAt,
            anchoredAt: block.timestamp,
            active: true
        });

        emit CredentialAnchored(
            credentialHash,
            issuerHash,
            subjectHash,
            schemaHash,
            domainHash,
            issuedAt,
            block.timestamp
        );
    }

    function deactivateCredentialAnchor(bytes32 credentialHash)
        external
        onlyIssuer
    {
        CredentialAnchorRecord storage record = records[credentialHash];
        require(record.active, "CREDENTIAL_ANCHOR_NOT_ACTIVE");

        record.active = false;

        emit CredentialAnchorDeactivated(
            credentialHash,
            block.timestamp
        );
    }

    function getCredentialAnchor(bytes32 credentialHash)
        external
        view
        returns (
            bytes32 issuerHash,
            bytes32 subjectHash,
            bytes32 schemaHash,
            bytes32 domainHash,
            uint256 issuedAt,
            uint256 anchoredAt,
            bool active
        )
    {
        CredentialAnchorRecord memory record = records[credentialHash];

        return (
            record.issuerHash,
            record.subjectHash,
            record.schemaHash,
            record.domainHash,
            record.issuedAt,
            record.anchoredAt,
            record.active
        );
    }
}
```



---



# 7\. Revocation Root Registry



只存 StatusList root。



## `contracts/registry/RevocationRootRegistry.sol`



```Solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../access/DIDAccessControl.sol";

contract RevocationRootRegistry is DIDAccessControl {
    struct RevocationRootRecord {
        bytes32 rootHash;
        bytes32 issuerHash;
        uint256 updatedAt;
        bool active;
    }

    mapping(bytes32 => RevocationRootRecord) private roots;

    event RevocationRootUpdated(
        bytes32 indexed listIdHash,
        bytes32 indexed rootHash,
        bytes32 indexed issuerHash,
        uint256 updatedAt
    );

    event RevocationRootDeactivated(
        bytes32 indexed listIdHash,
        uint256 updatedAt
    );

    constructor(address initialOwner) DIDAccessControl(initialOwner) {}

    function updateRoot(
        bytes32 listIdHash,
        bytes32 rootHash,
        bytes32 issuerHash
    ) external onlyRevoker {
        require(listIdHash != bytes32(0), "INVALID_LIST_ID_HASH");
        require(rootHash != bytes32(0), "INVALID_ROOT_HASH");
        require(issuerHash != bytes32(0), "INVALID_ISSUER_HASH");

        roots[listIdHash] = RevocationRootRecord({
            rootHash: rootHash,
            issuerHash: issuerHash,
            updatedAt: block.timestamp,
            active: true
        });

        emit RevocationRootUpdated(
            listIdHash,
            rootHash,
            issuerHash,
            block.timestamp
        );
    }

    function deactivateRoot(bytes32 listIdHash) external onlyRevoker {
        RevocationRootRecord storage record = roots[listIdHash];
        require(record.active, "ROOT_NOT_ACTIVE");

        record.active = false;
        record.updatedAt = block.timestamp;

        emit RevocationRootDeactivated(
            listIdHash,
            block.timestamp
        );
    }

    function getRoot(bytes32 listIdHash)
        external
        view
        returns (
            bytes32 rootHash,
            bytes32 issuerHash,
            uint256 updatedAt,
            bool active
        )
    {
        RevocationRootRecord memory record = roots[listIdHash];

        return (
            record.rootHash,
            record.issuerHash,
            record.updatedAt,
            record.active
        );
    }
}
```



---



# 8\. Issuer Registry Anchor



链上只存 Issuer 状态 hash。



## `contracts/registry/IssuerRegistryAnchor.sol`



```Solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../access/DIDAccessControl.sol";

contract IssuerRegistryAnchor is DIDAccessControl {
    struct IssuerAnchorRecord {
        bytes32 metadataHash;
        bytes32 permissionHash;
        bytes32 statusHash;
        uint256 updatedAt;
        bool active;
    }

    mapping(bytes32 => IssuerAnchorRecord) private issuers;

    event IssuerAnchored(
        bytes32 indexed issuerHash,
        bytes32 metadataHash,
        bytes32 permissionHash,
        bytes32 statusHash,
        uint256 updatedAt
    );

    event IssuerAnchorDeactivated(
        bytes32 indexed issuerHash,
        uint256 updatedAt
    );

    constructor(address initialOwner) DIDAccessControl(initialOwner) {}

    function anchorIssuer(
        bytes32 issuerHash,
        bytes32 metadataHash,
        bytes32 permissionHash,
        bytes32 statusHash
    ) external onlyAnchor {
        require(issuerHash != bytes32(0), "INVALID_ISSUER_HASH");
        require(metadataHash != bytes32(0), "INVALID_METADATA_HASH");
        require(permissionHash != bytes32(0), "INVALID_PERMISSION_HASH");
        require(statusHash != bytes32(0), "INVALID_STATUS_HASH");

        issuers[issuerHash] = IssuerAnchorRecord({
            metadataHash: metadataHash,
            permissionHash: permissionHash,
            statusHash: statusHash,
            updatedAt: block.timestamp,
            active: true
        });

        emit IssuerAnchored(
            issuerHash,
            metadataHash,
            permissionHash,
            statusHash,
            block.timestamp
        );
    }

    function deactivateIssuerAnchor(bytes32 issuerHash) external onlyAnchor {
        IssuerAnchorRecord storage record = issuers[issuerHash];
        require(record.active, "ISSUER_ANCHOR_NOT_ACTIVE");

        record.active = false;
        record.updatedAt = block.timestamp;

        emit IssuerAnchorDeactivated(
            issuerHash,
            block.timestamp
        );
    }

    function getIssuerAnchor(bytes32 issuerHash)
        external
        view
        returns (
            bytes32 metadataHash,
            bytes32 permissionHash,
            bytes32 statusHash,
            uint256 updatedAt,
            bool active
        )
    {
        IssuerAnchorRecord memory record = issuers[issuerHash];

        return (
            record.metadataHash,
            record.permissionHash,
            record.statusHash,
            record.updatedAt,
            record.active
        );
    }
}
```



---



# 9\. Anchor 类型增强



## `core/anchor/anchor.types.ts`



```TypeScript
import { DIDString } from '../did/did.types';
import { DIDBusinessDomain } from '../domain/did-domain.types';
import { DomainCredentialType } from '../domain/did-domain-credential.types';

export type AnchorType =
  | 'did_document'
  | 'credential'
  | 'revocation_root'
  | 'issuer';

export interface ChainAnchorTarget {
  chainId: string;
  registryAddress: string;
}

export interface DIDAnchorInput {
  did: DIDString;
  didDocument: unknown;
  controllerAddress: string;
  target: ChainAnchorTarget;
}

export interface CredentialAnchorInput {
  domain: DIDBusinessDomain;
  credentialType: DomainCredentialType;

  credentialHash: string;
  issuerDid: DIDString;
  subjectDid: DIDString;
  schemaHash: string;
  issuedAt: number;

  target: ChainAnchorTarget;
}

export interface RevocationRootAnchorInput {
  listId: string;
  rootHash: string;
  issuerDid: DIDString;
  target: ChainAnchorTarget;
}

export interface IssuerAnchorInput {
  issuerDid: DIDString;
  metadata: unknown;
  permissions: unknown;
  status: unknown;
  target: ChainAnchorTarget;
}

export interface AnchorResult {
  anchorId: string;
  type: AnchorType;
  chainId: string;
  registryAddress: string;
  txHash: string;
  blockNumber?: string;
  transactionIndex?: number;
  logIndex?: number;
  anchoredAt: number;
}

export interface AnchorVerificationResult {
  valid: boolean;
  reason?: string;
  onChainValue?: string;
  expectedValue?: string;
  txHash?: string;
  metadata?: Record;
}
```



---



# 10\. Anchor Policy 类型



## `core/anchor/anchor-policy.types.ts`



```TypeScript
import { DIDBusinessDomain } from '../domain/did-domain.types';
import { DomainCredentialType } from '../domain/did-domain-credential.types';

export type AnchorRequirement =
  | 'never'
  | 'optional'
  | 'recommended'
  | 'required';

export interface CredentialAnchorPolicy {
  domain: DIDBusinessDomain;
  credentialType: DomainCredentialType;
  requirement: AnchorRequirement;
  privacyMode:
    | 'hash_only'
    | 'commitment'
    | 'root_only';

  reason?: string;
}
```



---



# 11\. Anchor Privacy Policy



## `core/anchor/anchor-privacy-policy.service.ts`



```TypeScript
import { CredentialAnchorPolicy } from './anchor-policy.types';

export class AnchorPrivacyPolicyService {
  private readonly forbiddenPlaintextFields = [
    'name',
    'fullName',
    'firstName',
    'lastName',
    'passportNumber',
    'nationalId',
    'dateOfBirth',
    'address',
    'phone',
    'email',
    'taxId',
    'uboName',
    'income',
    'assetDetails',
    'bettingHistory',
    'amlReport',
    'pepReport',
    'sanctionsDetails',
  ];

  assertNoPlaintextPII(input: unknown) {
    const found: string[] = [];

    this.scan(input, '', found);

    if (found.length > 0) {
      throw new Error(`ANCHOR_PAYLOAD_CONTAINS_FORBIDDEN_PII:${found.join(',')}`);
    }
  }

  assertPolicy(input: {
    policy: CredentialAnchorPolicy;
    payload: unknown;
  }) {
    if (input.policy.privacyMode !== 'hash_only' && input.policy.privacyMode !== 'commitment') {
      return;
    }

    this.assertNoPlaintextPII(input.payload);
  }

  private scan(value: unknown, path: string, found: string[]) {
    if (!value || typeof value !== 'object') return;

    if (Array.isArray(value)) {
      value.forEach((item, index) => this.scan(item, `${path}[${index}]`, found));
      return;
    }

    for (const [key, child] of Object.entries(value as Record)) {
      if (this.forbiddenPlaintextFields.includes(key)) {
        found.push(path ? `${path}.${key}` : key);
      }

      this.scan(child, path ? `${path}.${key}` : key, found);
    }
  }
}
```



---



# 12\. Anchor Payload Builder



统一 hash 生成。



## `core/anchor/anchor-payload-builder.service.ts`



```TypeScript
import { AnchorHashService } from './anchor-hash.service';
import {
  CredentialAnchorInput,
  DIDAnchorInput,
  IssuerAnchorInput,
  RevocationRootAnchorInput,
} from './anchor.types';

export class AnchorPayloadBuilderService {
  constructor(
    private readonly hash = new AnchorHashService(),
  ) {}

  buildDIDAnchor(input: DIDAnchorInput) {
    return {
      didHash: this.hash.hashString(input.did),
      documentHash: this.hash.hashJson(input.didDocument),
      controller: input.controllerAddress,
    };
  }

  buildCredentialAnchor(input: CredentialAnchorInput) {
    return {
      credentialHash: asBytes32(input.credentialHash),
      issuerHash: this.hash.hashString(input.issuerDid),
      subjectHash: this.hash.hashString(input.subjectDid),
      schemaHash: asBytes32(input.schemaHash),
      domainHash: this.hash.hashString(input.domain),
      issuedAt: input.issuedAt,
    };
  }

  buildRevocationRoot(input: RevocationRootAnchorInput) {
    return {
      listIdHash: this.hash.hashString(input.listId),
      rootHash: asBytes32(input.rootHash),
      issuerHash: this.hash.hashString(input.issuerDid),
    };
  }

  buildIssuerAnchor(input: IssuerAnchorInput) {
    return {
      issuerHash: this.hash.hashString(input.issuerDid),
      metadataHash: this.hash.hashJson(input.metadata),
      permissionHash: this.hash.hashJson(input.permissions),
      statusHash: this.hash.hashJson(input.status),
    };
  }
}

function asBytes32(value: string): `0x${string}` {
  if (!/^0x[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error(`INVALID_BYTES32:${value}`);
  }

  return value.toLowerCase() as `0x${string}`;
}
```



---



# 13\. Domain Anchor Policy



## `core/anchor/domain-anchor-policy.service.ts`



```TypeScript
import { DIDBusinessDomain } from '../domain/did-domain.types';
import { DomainCredentialType } from '../domain/did-domain-credential.types';
import { CredentialAnchorPolicy } from './anchor-policy.types';

export class DomainAnchorPolicyService {
  private readonly policies: CredentialAnchorPolicy[] = [
    {
      domain: 'exchange',
      credentialType: 'ExchangeKYCLevel',
      requirement: 'recommended',
      privacyMode: 'commitment',
      reason: 'KYC level commitment for audit',
    },
    {
      domain: 'exchange',
      credentialType: 'ExchangeTravelRuleCompliance',
      requirement: 'recommended',
      privacyMode: 'hash_only',
    },
    {
      domain: 'cross_border_commerce',
      credentialType: 'CommerceMerchantKYB',
      requirement: 'recommended',
      privacyMode: 'commitment',
    },
    {
      domain: 'cross_border_commerce',
      credentialType: 'CommerceTaxIdentity',
      requirement: 'optional',
      privacyMode: 'commitment',
    },
    {
      domain: 'gaming',
      credentialType: 'GamingAgeOver18',
      requirement: 'recommended',
      privacyMode: 'commitment',
    },
    {
      domain: 'gaming',
      credentialType: 'GamingSelfExclusionStatus',
      requirement: 'required',
      privacyMode: 'root_only',
    },
    {
      domain: 'financial',
      credentialType: 'FinancialAccreditedInvestor',
      requirement: 'required',
      privacyMode: 'commitment',
    },
    {
      domain: 'financial',
      credentialType: 'FinancialRiskSuitability',
      requirement: 'recommended',
      privacyMode: 'commitment',
    },
    {
      domain: 'samoa_enterprise',
      credentialType: 'SamoaCompanyIncorporationCertificate',
      requirement: 'required',
      privacyMode: 'hash_only',
    },
    {
      domain: 'samoa_enterprise',
      credentialType: 'SamoaCompanyGoodStanding',
      requirement: 'required',
      privacyMode: 'hash_only',
    },
    {
      domain: 'samoa_enterprise',
      credentialType: 'SamoaUBODeclaration',
      requirement: 'recommended',
      privacyMode: 'commitment',
    },
    {
      domain: 'samoa_enterprise',
      credentialType: 'SamoaEntrepreneurIdentity',
      requirement: 'recommended',
      privacyMode: 'commitment',
    },
  ];

  getPolicy(input: {
    domain: DIDBusinessDomain;
    credentialType: DomainCredentialType;
  }): CredentialAnchorPolicy {
    return (
      this.policies.find(
        (item) =>
          item.domain === input.domain &&
          item.credentialType === input.credentialType,
      ) ?? {
        domain: input.domain,
        credentialType: input.credentialType,
        requirement: 'optional',
        privacyMode: 'hash_only',
      }
    );
  }

  assertCanSkipAnchor(input: {
    domain: DIDBusinessDomain;
    credentialType: DomainCredentialType;
  }) {
    const policy = this.getPolicy(input);

    if (policy.requirement === 'required') {
      throw new Error(
        `ANCHOR_REQUIRED:${input.domain}:${input.credentialType}`,
      );
    }
  }
}
```



---



# 14\. EVM Anchor Client 类型



## `core/anchor/evm-anchor-client.types.ts`



```TypeScript
export interface EvmAnchorTransactionResult {
  txHash: string;
  blockNumber?: string;
  transactionIndex?: number;
  logIndex?: number;
}

export interface EvmDIDAnchorClient {
  anchorDID(input: {
    registryAddress: string;
    didHash: string;
    documentHash: string;
    controller: string;
  }): Promise;

  getDIDAnchor(input: {
    registryAddress: string;
    didHash: string;
  }): Promise;
}

export interface EvmCredentialAnchorClient {
  anchorCredential(input: {
    registryAddress: string;
    credentialHash: string;
    issuerHash: string;
    subjectHash: string;
    schemaHash: string;
    domainHash: string;
    issuedAt: number;
  }): Promise;

  getCredentialAnchor(input: {
    registryAddress: string;
    credentialHash: string;
  }): Promise;
}

export interface EvmRevocationRootClient {
  updateRoot(input: {
    registryAddress: string;
    listIdHash: string;
    rootHash: string;
    issuerHash: string;
  }): Promise;

  getRoot(input: {
    registryAddress: string;
    listIdHash: string;
  }): Promise;
}

export interface EvmIssuerAnchorClient {
  anchorIssuer(input: {
    registryAddress: string;
    issuerHash: string;
    metadataHash: string;
    permissionHash: string;
    statusHash: string;
  }): Promise;

  getIssuerAnchor(input: {
    registryAddress: string;
    issuerHash: string;
  }): Promise;
}
```



---



# 15\. EVM Anchor Client Service



这里定义 viem/ethers 适配边界。生产实现接 WalletCore / RPC。



## `core/anchor/evm-anchor-client.service.ts`



```TypeScript
import {
  EvmCredentialAnchorClient,
  EvmDIDAnchorClient,
  EvmIssuerAnchorClient,
  EvmRevocationRootClient,
} from './evm-anchor-client.types';

export class UnsupportedEvmAnchorClient
  implements
    EvmDIDAnchorClient,
    EvmCredentialAnchorClient,
    EvmRevocationRootClient,
    EvmIssuerAnchorClient {
  async anchorDID(): Promise {
    throw new Error('EVM_DID_ANCHOR_CLIENT_NOT_CONFIGURED');
  }

  async getDIDAnchor(): Promise {
    throw new Error('EVM_DID_ANCHOR_CLIENT_NOT_CONFIGURED');
  }

  async anchorCredential(): Promise {
    throw new Error('EVM_CREDENTIAL_ANCHOR_CLIENT_NOT_CONFIGURED');
  }

  async getCredentialAnchor(): Promise {
    throw new Error('EVM_CREDENTIAL_ANCHOR_CLIENT_NOT_CONFIGURED');
  }

  async updateRoot(): Promise {
    throw new Error('EVM_REVOCATION_ROOT_CLIENT_NOT_CONFIGURED');
  }

  async getRoot(): Promise {
    throw new Error('EVM_REVOCATION_ROOT_CLIENT_NOT_CONFIGURED');
  }

  async anchorIssuer(): Promise {
    throw new Error('EVM_ISSUER_ANCHOR_CLIENT_NOT_CONFIGURED');
  }

  async getIssuerAnchor(): Promise {
    throw new Error('EVM_ISSUER_ANCHOR_CLIENT_NOT_CONFIGURED');
  }
}
```



---



# 16\. DID Anchor Service



## `core/anchor/did-anchor.service.ts`



```TypeScript
import { AnchorPayloadBuilderService } from './anchor-payload-builder.service';
import {
  AnchorResult,
  AnchorVerificationResult,
  DIDAnchorInput,
} from './anchor.types';
import { EvmDIDAnchorClient } from './evm-anchor-client.types';

export class DIDAnchorService {
  constructor(
    private readonly payloadBuilder: AnchorPayloadBuilderService,
    private readonly client: EvmDIDAnchorClient,
  ) {}

  async anchor(input: DIDAnchorInput): Promise {
    const payload = this.payloadBuilder.buildDIDAnchor(input);

    const tx = await this.client.anchorDID({
      registryAddress: input.target.registryAddress,
      didHash: payload.didHash,
      documentHash: payload.documentHash,
      controller: payload.controller,
    });

    return {
      anchorId: `ANCHOR-DID-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      type: 'did_document',
      chainId: input.target.chainId,
      registryAddress: input.target.registryAddress,
      txHash: tx.txHash,
      blockNumber: tx.blockNumber,
      transactionIndex: tx.transactionIndex,
      logIndex: tx.logIndex,
      anchoredAt: Date.now(),
    };
  }

  async verify(input: DIDAnchorInput): Promise {
    const payload = this.payloadBuilder.buildDIDAnchor(input);

    const onChain = await this.client.getDIDAnchor({
      registryAddress: input.target.registryAddress,
      didHash: payload.didHash,
    });

    const valid =
      onChain.active &&
      onChain.documentHash.toLowerCase() === payload.documentHash.toLowerCase();

    return {
      valid,
      reason: valid ? undefined : 'DID_DOCUMENT_HASH_MISMATCH',
      onChainValue: onChain.documentHash,
      expectedValue: payload.documentHash,
      metadata: {
        onChain,
      },
    };
  }
}
```



---



# 17\. Credential Anchor Service



## `core/anchor/credential-anchor.service.ts`



```TypeScript
import { AnchorPayloadBuilderService } from './anchor-payload-builder.service';
import { AnchorPrivacyPolicyService } from './anchor-privacy-policy.service';
import { DomainAnchorPolicyService } from './domain-anchor-policy.service';
import {
  AnchorResult,
  AnchorVerificationResult,
  CredentialAnchorInput,
} from './anchor.types';
import { EvmCredentialAnchorClient } from './evm-anchor-client.types';

export class CredentialAnchorService {
  constructor(
    private readonly payloadBuilder: AnchorPayloadBuilderService,
    private readonly domainPolicy: DomainAnchorPolicyService,
    private readonly privacyPolicy: AnchorPrivacyPolicyService,
    private readonly client: EvmCredentialAnchorClient,
  ) {}

  async anchor(input: CredentialAnchorInput & {
    sourcePayload?: unknown;
  }): Promise {
    const policy = this.domainPolicy.getPolicy({
      domain: input.domain,
      credentialType: input.credentialType,
    });

    if (input.sourcePayload) {
      this.privacyPolicy.assertPolicy({
        policy,
        payload: input.sourcePayload,
      });
    }

    const payload = this.payloadBuilder.buildCredentialAnchor(input);

    const tx = await this.client.anchorCredential({
      registryAddress: input.target.registryAddress,
      credentialHash: payload.credentialHash,
      issuerHash: payload.issuerHash,
      subjectHash: payload.subjectHash,
      schemaHash: payload.schemaHash,
      domainHash: payload.domainHash,
      issuedAt: payload.issuedAt,
    });

    return {
      anchorId: `ANCHOR-VC-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      type: 'credential',
      chainId: input.target.chainId,
      registryAddress: input.target.registryAddress,
      txHash: tx.txHash,
      blockNumber: tx.blockNumber,
      transactionIndex: tx.transactionIndex,
      logIndex: tx.logIndex,
      anchoredAt: Date.now(),
    };
  }

  async verify(input: CredentialAnchorInput): Promise {
    const payload = this.payloadBuilder.buildCredentialAnchor(input);

    const onChain = await this.client.getCredentialAnchor({
      registryAddress: input.target.registryAddress,
      credentialHash: payload.credentialHash,
    });

    const valid =
      onChain.active &&
      onChain.issuerHash.toLowerCase() === payload.issuerHash.toLowerCase() &&
      onChain.subjectHash.toLowerCase() === payload.subjectHash.toLowerCase() &&
      onChain.schemaHash.toLowerCase() === payload.schemaHash.toLowerCase() &&
      onChain.domainHash.toLowerCase() === payload.domainHash.toLowerCase();

    return {
      valid,
      reason: valid ? undefined : 'CREDENTIAL_ANCHOR_MISMATCH',
      expectedValue: payload.credentialHash,
      onChainValue: JSON.stringify(onChain),
      metadata: {
        onChain,
      },
    };
  }
}
```



---



# 18\. Revocation Root Anchor Service



## `core/anchor/revocation-root-anchor.service.ts`



```TypeScript
import { AnchorPayloadBuilderService } from './anchor-payload-builder.service';
import {
  AnchorResult,
  AnchorVerificationResult,
  RevocationRootAnchorInput,
} from './anchor.types';
import { EvmRevocationRootClient } from './evm-anchor-client.types';

export class RevocationRootAnchorService {
  constructor(
    private readonly payloadBuilder: AnchorPayloadBuilderService,
    private readonly client: EvmRevocationRootClient,
  ) {}

  async anchor(input: RevocationRootAnchorInput): Promise {
    const payload = this.payloadBuilder.buildRevocationRoot(input);

    const tx = await this.client.updateRoot({
      registryAddress: input.target.registryAddress,
      listIdHash: payload.listIdHash,
      rootHash: payload.rootHash,
      issuerHash: payload.issuerHash,
    });

    return {
      anchorId: `ANCHOR-REV-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      type: 'revocation_root',
      chainId: input.target.chainId,
      registryAddress: input.target.registryAddress,
      txHash: tx.txHash,
      blockNumber: tx.blockNumber,
      transactionIndex: tx.transactionIndex,
      logIndex: tx.logIndex,
      anchoredAt: Date.now(),
    };
  }

  async verify(input: RevocationRootAnchorInput): Promise {
    const payload = this.payloadBuilder.buildRevocationRoot(input);

    const onChain = await this.client.getRoot({
      registryAddress: input.target.registryAddress,
      listIdHash: payload.listIdHash,
    });

    const valid =
      onChain.active &&
      onChain.rootHash.toLowerCase() === payload.rootHash.toLowerCase() &&
      onChain.issuerHash.toLowerCase() === payload.issuerHash.toLowerCase();

    return {
      valid,
      reason: valid ? undefined : 'REVOCATION_ROOT_MISMATCH',
      expectedValue: payload.rootHash,
      onChainValue: onChain.rootHash,
      metadata: {
        onChain,
      },
    };
  }
}
```



---



# 19\. Issuer Anchor Service



## `core/anchor/issuer-anchor.service.ts`



```TypeScript
import { AnchorPayloadBuilderService } from './anchor-payload-builder.service';
import {
  AnchorResult,
  AnchorVerificationResult,
  IssuerAnchorInput,
} from './anchor.types';
import { EvmIssuerAnchorClient } from './evm-anchor-client.types';

export class IssuerAnchorService {
  constructor(
    private readonly payloadBuilder: AnchorPayloadBuilderService,
    private readonly client: EvmIssuerAnchorClient,
  ) {}

  async anchor(input: IssuerAnchorInput): Promise {
    const payload = this.payloadBuilder.buildIssuerAnchor(input);

    const tx = await this.client.anchorIssuer({
      registryAddress: input.target.registryAddress,
      issuerHash: payload.issuerHash,
      metadataHash: payload.metadataHash,
      permissionHash: payload.permissionHash,
      statusHash: payload.statusHash,
    });

    return {
      anchorId: `ANCHOR-ISS-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      type: 'issuer',
      chainId: input.target.chainId,
      registryAddress: input.target.registryAddress,
      txHash: tx.txHash,
      blockNumber: tx.blockNumber,
      transactionIndex: tx.transactionIndex,
      logIndex: tx.logIndex,
      anchoredAt: Date.now(),
    };
  }

  async verify(input: IssuerAnchorInput): Promise {
    const payload = this.payloadBuilder.buildIssuerAnchor(input);

    const onChain = await this.client.getIssuerAnchor({
      registryAddress: input.target.registryAddress,
      issuerHash: payload.issuerHash,
    });

    const valid =
      onChain.active &&
      onChain.metadataHash.toLowerCase() === payload.metadataHash.toLowerCase() &&
      onChain.permissionHash.toLowerCase() === payload.permissionHash.toLowerCase() &&
      onChain.statusHash.toLowerCase() === payload.statusHash.toLowerCase();

    return {
      valid,
      reason: valid ? undefined : 'ISSUER_ANCHOR_MISMATCH',
      expectedValue: payload.issuerHash,
      onChainValue: JSON.stringify(onChain),
      metadata: {
        onChain,
      },
    };
  }
}
```



---



# 20\. Anchor Runtime



## `core/anchor/create-anchor-runtime.ts`



```TypeScript
import { AnchorPayloadBuilderService } from './anchor-payload-builder.service';
import { AnchorPrivacyPolicyService } from './anchor-privacy-policy.service';
import { DomainAnchorPolicyService } from './domain-anchor-policy.service';
import { UnsupportedEvmAnchorClient } from './evm-anchor-client.service';
import {
  EvmCredentialAnchorClient,
  EvmDIDAnchorClient,
  EvmIssuerAnchorClient,
  EvmRevocationRootClient,
} from './evm-anchor-client.types';
import { DIDAnchorService } from './did-anchor.service';
import { CredentialAnchorService } from './credential-anchor.service';
import { RevocationRootAnchorService } from './revocation-root-anchor.service';
import { IssuerAnchorService } from './issuer-anchor.service';

export function createAnchorRuntime(input: {
  didClient?: EvmDIDAnchorClient;
  credentialClient?: EvmCredentialAnchorClient;
  revocationClient?: EvmRevocationRootClient;
  issuerClient?: EvmIssuerAnchorClient;
} = {}) {
  const fallback = new UnsupportedEvmAnchorClient();

  const payloadBuilder = new AnchorPayloadBuilderService();
  const privacyPolicy = new AnchorPrivacyPolicyService();
  const domainPolicy = new DomainAnchorPolicyService();

  const didAnchor = new DIDAnchorService(
    payloadBuilder,
    input.didClient ?? fallback,
  );

  const credentialAnchor = new CredentialAnchorService(
    payloadBuilder,
    domainPolicy,
    privacyPolicy,
    input.credentialClient ?? fallback,
  );

  const revocationRootAnchor = new RevocationRootAnchorService(
    payloadBuilder,
    input.revocationClient ?? fallback,
  );

  const issuerAnchor = new IssuerAnchorService(
    payloadBuilder,
    input.issuerClient ?? fallback,
  );

  return {
    payloadBuilder,
    privacyPolicy,
    domainPolicy,
    didAnchor,
    credentialAnchor,
    revocationRootAnchor,
    issuerAnchor,
  };
}
```



---



# 21\. 萨摩亚公司证书上链



```TypeScript
await anchorRuntime.credentialAnchor.anchor({
  domain: 'samoa_enterprise',
  credentialType: 'SamoaCompanyIncorporationCertificate',
  credentialHash: result.credentialHash,
  issuerDid: 'did:web:identity.samoa.example',
  subjectDid: companyControllerDid,
  schemaHash: '0x...',
  issuedAt: Date.now(),
  target: {
    chainId: '0x1',
    registryAddress: '0xCredentialAnchorRegistry...',
  },
  sourcePayload: {
    credentialHash: result.credentialHash,
    companyNumberHash: '0x...',
    companyNameHash: '0x...',
  },
});
```



注意：



```Plain Text
companyNumberHash 可以上链
companyNumber 明文不要上链
companyNameHash 可以上链
companyName 明文不要上链
```



---



# 22\. 金融合格投资者上链



```TypeScript
await anchorRuntime.credentialAnchor.anchor({
  domain: 'financial',
  credentialType: 'FinancialAccreditedInvestor',
  credentialHash,
  issuerDid: 'did:web:identity.financial.example',
  subjectDid: investorDid,
  schemaHash,
  issuedAt,
  target,
  sourcePayload: {
    credentialHash,
    accreditedCommitment: '0x...',
    jurisdictionHash: '0x...',
  },
});
```



禁止：



```Plain Text
资产金额明文
收入明文
银行账户
资产证明原文
```



---



# 23\. 交易所 KYC Commitment 上链



```TypeScript
await anchorRuntime.credentialAnchor.anchor({
  domain: 'exchange',
  credentialType: 'ExchangeKYCLevel',
  credentialHash,
  issuerDid: 'did:web:identity.exchange.example',
  subjectDid: userDid,
  schemaHash,
  issuedAt,
  target,
  sourcePayload: {
    credentialHash,
    kycLevelCommitment: '0x...',
    countryBucketHash: '0x...',
  },
});
```



禁止：



```Plain Text
真实姓名
证件号
KYC 文件
AML 详情
```



---



# 24\. 博彩年龄证明 Commitment 上链



```TypeScript
await anchorRuntime.credentialAnchor.anchor({
  domain: 'gaming',
  credentialType: 'GamingAgeOver18',
  credentialHash,
  issuerDid: 'did:web:compliance.gaming.example',
  subjectDid: playerDid,
  schemaHash,
  issuedAt,
  target,
  sourcePayload: {
    credentialHash,
    ageOver18Commitment: '0x...',
    jurisdictionHash: '0x...',
  },
});
```



禁止：



```Plain Text
出生日期
身份证号
投注数据
```



---



# 25\. 跨境电商 KYB Commitment 上链



```TypeScript
await anchorRuntime.credentialAnchor.anchor({
  domain: 'cross_border_commerce',
  credentialType: 'CommerceMerchantKYB',
  credentialHash,
  issuerDid: 'did:web:merchant-id.commerce.example',
  subjectDid: merchantDid,
  schemaHash,
  issuedAt,
  target,
  sourcePayload: {
    credentialHash,
    merchantKybCommitment: '0x...',
    taxResidencyHash: '0x...',
  },
});
```



禁止：



```Plain Text
税号明文
营业执照明文
企业地址明文
联系人信息
```



---



# 26\. Revocation Root 上链



```TypeScript
await anchorRuntime.revocationRootAnchor.anchor({
  listId: 'SL2021-revocation-...',
  rootHash: '0x...',
  issuerDid: 'did:web:identity.samoa.example',
  target: {
    chainId: '0x1',
    registryAddress: '0xRevocationRootRegistry...',
  },
});
```



链上只出现：



```Plain Text
listIdHash
rootHash
issuerHash
```



---



# 27\. DID Document Hash 上链



```TypeScript
await anchorRuntime.didAnchor.anchor({
  did: 'did:web:identity.samoa.example',
  didDocument,
  controllerAddress: '0xController...',
  target: {
    chainId: '0x1',
    registryAddress: '0xDIDAnchorRegistry...',
  },
});
```



链上不保存 DID Document 明文，只保存：



```Plain Text
didHash
documentHash
controller
```



---



# 28\. VC 验证时链上 Anchor 校验



Part 6 的 `VCAnchorVerifierService` 可接：



```TypeScript
const anchorClient = {
  async verifyCredentialAnchor(input) {
    const result = await anchorRuntime.credentialAnchor.verify({
      domain,
      credentialType,
      credentialHash: input.credentialHash,
      issuerDid: input.issuerDid,
      subjectDid: input.subjectDid,
      schemaHash: input.schemaHash,
      issuedAt,
      target,
    });

    return {
      valid: result.valid,
      reason: result.reason,
      txHash: result.txHash,
      chainId: target.chainId,
      registryAddress: target.registryAddress,
    };
  },
};
```



---



# 29\. 部署建议



## 29\.1 合约部署顺序



```Plain Text
1. DIDAnchorRegistry
2. CredentialAnchorRegistry
3. RevocationRootRegistry
4. IssuerRegistryAnchor
```



每个合约 constructor：



```Solidity
constructor(address initialOwner)
```



---



## 29\.2 权限配置



```Plain Text
owner:
  多签钱包

anchors:
  DID Anchor Operator
  Issuer Anchor Operator

issuers:
  官方 Issuer / Credential Anchor Operator

revokers:
  Revocation Operator
```



生产必须：



```Plain Text
owner = multisig
issuer/revoker = role account
不允许 EOA 单点控制全部权限
```



---



# 30\. 生产安全要求



```Plain Text
1. 合约 owner 必须多签
2. Anchor operator 必须可轮换
3. Issuer operator 必须可吊销
4. Revoker 必须独立权限
5. 所有上链 payload 必须 PII 扫描
6. 所有上链内容必须 hash-only
7. 不允许用户端直接 anchor 高价值身份
8. Anchor 请求必须审计
9. Anchor txHash 必须写回 VC lifecycle
10. Revocation root 必须周期性上链
11. Samoa 公司证书必须 anchor
12. 金融合格投资者 VC 推荐 anchor
13. 博彩 self-exclusion 推荐 root anchor
14. 交易所 KYC 不上明文，只上 commitment
```



---



# 31\. 本章完成内容



本章完成：



```Plain Text
DIDAccessControl.sol
DIDAnchorRegistry.sol
CredentialAnchorRegistry.sol
RevocationRootRegistry.sol
IssuerRegistryAnchor.sol
Anchor 类型增强
Anchor Policy
Privacy Policy
Payload Builder
Domain Anchor Policy
EVM Client 边界
DID Anchor Service
Credential Anchor Service
Revocation Root Anchor Service
Issuer Anchor Service
Anchor Runtime
五大业务域上链策略
萨摩亚公司证书上链规则
金融资格证明上链规则
交易所 KYC commitment 上链规则
博彩年龄证明 commitment 上链规则
跨境电商 KYB commitment 上链规则
```



现在 DID 系统已经具备链上可信锚定能力：



```Plain Text
DID Document Hash
VC Hash / Commitment
Revocation Root
Issuer Status Hash
```



---



# 32\. 下一章继续



下一章：



# 《DID 身份 Part 9：隐私保护 Hash Commitment / Selective Disclosure / ZK 预留》



将覆盖：



```Plain Text
PII 最小化
Hash Commitment
Salt / Pepper
Claim-level Commitment
Selective Disclosure VC
BBS+ 预留
ZK Proof Interface
Age Over 18 ZK
Accredited Investor ZK
KYC Level ZK
Samoa UBO 隐私证明
Commerce KYB 选择性披露
Gaming Geo Eligibility 隐私证明
```



