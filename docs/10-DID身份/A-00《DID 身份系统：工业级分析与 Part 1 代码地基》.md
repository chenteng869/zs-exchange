# A\-00《DID 身份系统：工业级分析与 Part 1 代码地基》

# 《DID 身份系统：工业级分析与 Part 1 代码地基》



你要的 DID 身份模块不能按普通“生成一个 DID \+ 发一个 JSON 证书”来做。那种东西在生产环境里风险极高，尤其涉及：



- 钱包绑定

- 身份凭证

- VC 签发

- VC 验证

- 链上锚定

- 隐私保护

- 凭证撤销

- 用户身份页面

- 机构签发者管理

- KYC / 资格 / 成就 / 会员 / 资产证明等身份场景

    

所以这一套必须严格基于国际标准和链上约束来设计。



本回答先做 **系统级分析**，然后开始写 **Part 1：类型系统、错误体系、DID 核心接口、链上锚定规则代码地基**。



后续会继续分段写：



```Plain Text
Part 1：类型系统 / 错误体系 / DID Core / DID Document
Part 2：DID 生成：did:key / did:pkh / did:web / did:ethr
Part 3：钱包绑定：SIWE / CAIP-10 / 多链账户绑定
Part 4：Issuer 签发者体系 / Issuer Trust Registry
Part 5：VC 签发：JWT VC / JSON-LD VC / EIP-712 VC
Part 6：VC 验证：签名、过期、撤销、Schema、Issuer 信任
Part 7：VC Status / Revocation：StatusList2021 / 链上撤销根
Part 8：链上 DID Registry / Anchor Contract 规则
Part 9：隐私保护：Hash Commitment / Selective Disclosure / ZK 预留
Part 10：身份管理页面：DID Profile / Wallet Binding / VC Wallet
Part 11：后台管理：Issuer、Schema、Credential、Revocation、Audit
Part 12：安全测试 / 联调 / 上线 Checklist
```



---



# 一、工业级 DID 身份系统分析



## 1\. 采用标准



必须参考并兼容：



```Plain Text
W3C DID Core
W3C Verifiable Credentials Data Model v1.1 / v2.0
W3C VC Data Integrity
W3C StatusList2021
DID Resolution
DID URL Dereferencing
JSON-LD Proof
JWT VC
EIP-191
EIP-4361 SIWE
EIP-712 Typed Data
CAIP-10 Account ID
did:key
did:web
did:pkh
did:ethr
```



---



## 2\. 系统目标



DID 身份系统要实现：



```Plain Text
用户可以生成 DID
用户可以绑定钱包
机构可以签发 VC
用户可以保存 VC
第三方可以验证 VC
VC 可以撤销
VC 可以链上锚定
DID Document 可以解析
Issuer 可以被信任注册
身份页面可以展示 DID、钱包、凭证
```



---



## 3\. 关键设计原则



### 3\.1 链上不能放隐私数据



禁止上链：



```Plain Text
姓名
身份证
护照号
手机号
邮箱
KYC 原文
VC 明文
用户画像
完整 DID Document 中的隐私字段
```



允许上链：



```Plain Text
DID Document Hash
VC Hash Commitment
Issuer Registry
Revocation Registry Root
Status List Root
Public Key Fingerprint
Wallet Binding Hash
Schema Hash
```



---



### 3\.2 DID 私钥不进入业务层



禁止：



```TypeScript
user.privateKey
issuer.privateKey
mnemonic
seed
```



允许：



```TypeScript
keyManager.sign(...)
walletCore.signMessage(...)
kms.signDigest(...)
mpc.sign(...)
hardware.sign(...)
```



---



### 3\.3 VC 验证不能只验签



完整验证必须包括：



```Plain Text
1. VC 格式合法
2. issuer DID 可解析
3. proof / JWT 签名正确
4. issuer 在信任注册表中
5. credentialSchema 合法
6. expirationDate 未过期
7. issuanceDate 合理
8. credentialStatus 未撤销
9. holder 绑定关系正确
10. challenge / domain 防重放
11. 链上锚定 hash 一致，可选
```



---



### 3\.4 钱包绑定必须防重放



钱包绑定不能只是让用户签：



```Plain Text
bind wallet
```



必须签结构化挑战：



```Plain Text
domain
did
wallet
chainId
nonce
issuedAt
expirationTime
audience
statement
```



推荐：



```Plain Text
EIP-4361 SIWE
```



---



### 3\.5 DID 方法选择



不同角色使用不同 DID 方法。



|场景|DID Method|
|---|---|
|用户本地身份|`did:key`|
|钱包身份|`did:pkh`|
|机构签发者|`did:web`|
|链上可旋转身份|`did:ethr` 或自定义 Registry|
|多链账户绑定|CAIP\-10 \+ `did:pkh`|



---



## 4\. 推荐身份模型



```Plain Text
User Identity
  ├─ primaryDID
  │   ├─ did:key:z...
  │   ├─ DID Document
  │   └─ verificationMethod
  │
  ├─ wallets
  │   ├─ eip155:1:0xabc...
  │   ├─ eip155:56:0xabc...
  │   └─ solana:mainnet:...
  │
  ├─ credentials
  │   ├─ KYC Credential
  │   ├─ VIP Credential
  │   ├─ Membership Credential
  │   ├─ Achievement Credential
  │   └─ Proof-of-Asset Credential
  │
  └─ revocation / status
```



---



## 5\. VC 生命周期



```Plain Text
Credential Schema Created
  -> Issuer Registered
  -> Holder DID Created
  -> Wallet Bound
  -> VC Issued
  -> VC Stored in Wallet
  -> Optional VC Hash Anchored On-chain
  -> VC Presented
  -> VC Verified
  -> VC Revoked / Expired
```



---



## 6\. 链上规则设计



### 6\.1 DID Anchor Registry



链上只记录：



```Solidity
didHash
documentHash
controller
updatedAt
```



不记录 DID Document 明文。



事件：



```Solidity
event DIDAnchored(
  bytes32 indexed didHash,
  bytes32 documentHash,
  address indexed controller,
  uint256 updatedAt
);
```



---



### 6\.2 VC Anchor Registry



链上只记录 VC Hash：



```Solidity
credentialHash
issuerHash
subjectHash
schemaHash
issuedAt
```



事件：



```Solidity
event CredentialAnchored(
  bytes32 indexed credentialHash,
  bytes32 indexed issuerHash,
  bytes32 indexed subjectHash,
  bytes32 schemaHash,
  uint256 issuedAt
);
```



---



### 6\.3 Revocation Registry



链上不建议逐条撤销大量 VC，成本太高。



推荐两种：



#### 方案 A：链上单条撤销



适合高价值凭证。



```Solidity
mapping(bytes32 => bool) revokedCredentials;
```



#### 方案 B：StatusList Root



适合海量凭证。



```Solidity
event StatusListRootUpdated(
  bytes32 indexed listId,
  bytes32 root,
  uint256 updatedAt
);
```



链下保存 StatusList2021，链上保存 root。



---



## 7\. 威胁模型



必须防：



```Plain Text
伪造 VC
伪造 Issuer
过期 VC 继续使用
已撤销 VC 继续使用
钱包绑定重放
跨域签名重放
恶意 DApp 偷签身份挑战
链上隐私泄露
DID Document 被篡改
Issuer 私钥泄露
前端伪造验证结果
```



---



## 8\. 技术栈建议



### 前端 / 移动端



```Plain Text
React Native
TypeScript
Secure Storage
WalletCore
DApp Browser 已有 Provider
```



### 后端



```Plain Text
NestJS
Prisma
PostgreSQL
Redis
KMS / HSM / MPC
```



### Crypto Libraries



推荐：



```Bash
npm install jose
npm install did-jwt
npm install did-resolver
npm install key-did-resolver
npm install web-did-resolver
npm install ethr-did-resolver
npm install multiformats
npm install @noble/curves
npm install @noble/hashes
npm install viem
```



VC JSON\-LD 可选：



```Bash
npm install jsonld
npm install @digitalbazaar/vc
```



---



# 二、工程目录设计



```Bash
src/modules/did/
  core/
    did/
      did.types.ts
      did-document.types.ts
      did-method.types.ts
      did-generator.service.ts
      did-resolver.service.ts
      did-document-builder.service.ts

    methods/
      did-key.service.ts
      did-pkh.service.ts
      did-web.service.ts
      did-ethr.service.ts

    wallet-binding/
      wallet-binding.types.ts
      wallet-binding-challenge.service.ts
      siwe.service.ts
      wallet-binding.service.ts
      wallet-binding.repository.ts

    vc/
      vc.types.ts
      vc-schema.types.ts
      vc-proof.types.ts
      vc-issuer.service.ts
      vc-verifier.service.ts
      vc-jwt.service.ts
      vc-jsonld.service.ts
      vc-status.service.ts
      vc-revocation.service.ts

    issuer/
      issuer.types.ts
      issuer-registry.service.ts
      issuer-trust.service.ts

    anchor/
      anchor.types.ts
      did-anchor.service.ts
      vc-anchor.service.ts
      revocation-anchor.service.ts
      anchor-hash.service.ts

    crypto/
      key-manager.types.ts
      key-manager.service.ts
      signer.types.ts
      kms-signer.adapter.ts
      wallet-signer.adapter.ts
      local-dev-signer.adapter.ts

    identity/
      identity.types.ts
      identity-profile.service.ts
      identity-wallet.service.ts
      identity-credential.service.ts

    audit/
      did-audit.types.ts
      did-audit.service.ts

  contracts/
    DIDAnchorRegistry.sol
    CredentialAnchorRegistry.sol
    RevocationRegistry.sol

  ui/
    screens/
      IdentityHomeScreen.tsx
      DIDProfileScreen.tsx
      WalletBindingScreen.tsx
      CredentialListScreen.tsx
      CredentialDetailScreen.tsx
      CredentialVerifyScreen.tsx

    components/
      DIDCard.tsx
      WalletBindingCard.tsx
      CredentialCard.tsx
      VerificationResultView.tsx

  admin/
    issuer-admin.controller.ts
    vc-schema-admin.controller.ts
    credential-admin.controller.ts
    revocation-admin.controller.ts

  did.module.ts
```



---



# 三、Part 1：类型系统、错误体系、DID Core 代码



---



# 1\. DID 基础类型



## `core/did/did.types.ts`



```TypeScript
export type DIDMethod =
  | 'key'
  | 'pkh'
  | 'web'
  | 'ethr'
  | 'ion'
  | 'custom';

export type DIDString = `did:${string}:${string}`;

export type DIDUrl = `${DIDString}${string}`;

export interface DIDParsed {
  did: DIDString;
  method: DIDMethod | string;
  methodSpecificId: string;
  path?: string;
  query?: string;
  fragment?: string;
}

export interface DIDCreateInput {
  method: DIDMethod;
  controller?: DIDString;
  network?: string;
  chainId?: string;
  accountAddress?: string;
  keyType?: DIDKeyType;
  metadata?: Record;
}

export type DIDKeyType =
  | 'Ed25519'
  | 'secp256k1'
  | 'P-256'
  | 'RSA';

export interface DIDCreateResult {
  did: DIDString;
  document: DIDDocument;
  keyRef?: string;
  createdAt: number;
}

export interface DIDResolutionResult {
  didDocument: DIDDocument | null;
  didResolutionMetadata: DIDResolutionMetadata;
  didDocumentMetadata: DIDDocumentMetadata;
}

export interface DIDResolutionMetadata {
  contentType?: string;
  error?:
    | 'invalidDid'
    | 'notFound'
    | 'representationNotSupported'
    | 'methodNotSupported'
    | 'internalError';
  message?: string;
}

export interface DIDDocumentMetadata {
  created?: string;
  updated?: string;
  deactivated?: boolean;
  versionId?: string;
  nextUpdate?: string;
  equivalentId?: string[];
  canonicalId?: string;
}

/**
 * Re-export 解决循环引用时可拆。
 */
export interface DIDDocument {
  '@context': string | string[];
  id: DIDString;
  controller?: DIDString | DIDString[];
  alsoKnownAs?: string[];

  verificationMethod?: VerificationMethod[];

  authentication?: VerificationRelationship[];
  assertionMethod?: VerificationRelationship[];
  keyAgreement?: VerificationRelationship[];
  capabilityInvocation?: VerificationRelationship[];
  capabilityDelegation?: VerificationRelationship[];

  service?: DIDService[];

  created?: string;
  updated?: string;
}

export interface VerificationMethod {
  id: DIDUrl;
  type: string;
  controller: DIDString;
  publicKeyMultibase?: string;
  publicKeyJwk?: JsonWebKey;
  blockchainAccountId?: string;
}

export type VerificationRelationship =
  | DIDUrl
  | VerificationMethod;

export interface DIDService {
  id: DIDUrl;
  type: string | string[];
  serviceEndpoint: string | string[] | Record;
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



# 2\. DID Document 类型增强



## `core/did/did-document.types.ts`



```TypeScript
import {
  DIDDocument,
  DIDString,
  DIDUrl,
  VerificationMethod,
} from './did.types';

export interface DIDDocumentBuildInput {
  did: DIDString;
  controller?: DIDString;
  verificationMethods: VerificationMethod[];
  services?: Array;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DIDDocumentValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DIDDocumentHashInput {
  document: DIDDocument;
  canonicalization:
    | 'json-stable'
    | 'json-ld-urdna2015';
}
```



---



# 3\. VC 类型系统



## `core/vc/vc.types.ts`



```TypeScript
import { DIDString, DIDUrl } from '../did/did.types';

export type VCFormat =
  | 'jwt_vc'
  | 'jsonld_vc'
  | 'eip712_vc';

export type CredentialId = string;

export interface VerifiableCredential {
  '@context': string | string[];

  id?: CredentialId;

  type: string[];

  issuer:
    | DIDString
    | {
        id: DIDString;
        name?: string;
      };

  issuanceDate: string;
  expirationDate?: string;

  credentialSubject:
    | CredentialSubject
    | CredentialSubject[];

  credentialSchema?: CredentialSchema | CredentialSchema[];

  credentialStatus?: CredentialStatus | CredentialStatus[];

  evidence?: unknown;

  termsOfUse?: unknown;

  refreshService?: unknown;

  proof?: Proof | Proof[];
}

export interface CredentialSubject {
  id?: DIDString;
  [key: string]: unknown;
}

export interface CredentialSchema {
  id: string;
  type: string;
  digestSRI?: string;
}

export interface CredentialStatus {
  id: string;
  type:
    | 'StatusList2021Entry'
    | 'RevocationList2020Status'
    | 'OnChainRevocationStatus'
    | string;

  statusPurpose?: 'revocation' | 'suspension';
  statusListIndex?: string;
  statusListCredential?: string;

  chainId?: string;
  registryAddress?: string;
  credentialHash?: string;
}

export interface Proof {
  type: string;
  created?: string;
  verificationMethod: DIDUrl;
  proofPurpose:
    | 'assertionMethod'
    | 'authentication'
    | 'capabilityInvocation'
    | string;

  challenge?: string;
  domain?: string;
  jws?: string;
  proofValue?: string;

  [key: string]: unknown;
}

export interface VCJwtEnvelope {
  format: 'jwt_vc';
  jwt: string;
}

export interface VCJsonLdEnvelope {
  format: 'jsonld_vc';
  credential: VerifiableCredential;
}

export interface VCIssueInput {
  issuerDid: DIDString;
  issuerKeyRef: string;

  subjectDid: DIDString;

  type: string[];
  claims: Record;

  schema?: CredentialSchema;
  expirationDate?: string;

  status?: CredentialStatus;

  format: VCFormat;

  anchorOnChain?: boolean;
  metadata?: Record;
}

export interface VCIssueResult {
  credentialId: string;
  format: VCFormat;
  credential?: VerifiableCredential;
  jwt?: string;
  credentialHash: string;
  anchor?: {
    chainId: string;
    txHash: string;
    registryAddress: string;
  };
  issuedAt: number;
}

export interface VCVerifyInput {
  credential: VerifiableCredential | string;
  format: VCFormat;
  expectedSubjectDid?: DIDString;
  expectedIssuerDid?: DIDString;
  challenge?: string;
  domain?: string;
  verifyStatus?: boolean;
  verifyAnchor?: boolean;
}

export interface VCVerifyResult {
  valid: boolean;
  errors: string[];
  warnings: string[];

  issuer?: DIDString;
  subject?: DIDString;
  credentialId?: string;
  credentialHash?: string;

  checks: {
    format: boolean;
    signature: boolean;
    issuerTrusted: boolean;
    expiration: boolean;
    schema: boolean;
    status: boolean;
    anchor: boolean;
    holderBinding: boolean;
  };

  metadata?: Record;
}
```



---



# 4\. VC Schema 类型



## `core/vc/vc-schema.types.ts`



```TypeScript
export interface VCSchemaDefinition {
  schemaId: string;
  name: string;
  version: string;
  description?: string;
  jsonSchema: Record;
  hash: string;
  authorDid?: string;
  status: 'active' | 'deprecated' | 'disabled';
  createdAt: number;
  updatedAt: number;
}

export interface VCSchemaValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```



---



# 5\. Issuer 类型



## `core/issuer/issuer.types.ts`



```TypeScript
import { DIDString } from '../did/did.types';

export type IssuerStatus =
  | 'active'
  | 'suspended'
  | 'revoked'
  | 'pending_review';

export type IssuerTrustLevel =
  | 'system'
  | 'verified'
  | 'partner'
  | 'community'
  | 'unknown';

export interface TrustedIssuer {
  issuerId: string;
  did: DIDString;
  name: string;
  description?: string;
  domain?: string;
  logoUrl?: string;

  trustLevel: IssuerTrustLevel;
  status: IssuerStatus;

  allowedCredentialTypes: string[];
  allowedSchemas: string[];

  createdAt: number;
  updatedAt: number;
}

export interface IssuerCheckResult {
  trusted: boolean;
  reason?: string;
  issuer?: TrustedIssuer;
}
```



---



# 6\. 钱包绑定类型



## `core/wallet-binding/wallet-binding.types.ts`



```TypeScript
import { DIDString } from '../did/did.types';

export type WalletNamespace =
  | 'eip155'
  | 'solana'
  | 'tron'
  | 'bitcoin';

export interface CAIP10AccountId {
  namespace: WalletNamespace;
  reference: string;
  accountAddress: string;
  accountId: string;
}

export interface WalletBindingChallenge {
  challengeId: string;

  did: DIDString;
  accountId: string;
  address: string;
  chainId: string;
  domain: string;
  nonce: string;

  statement: string;
  uri: string;
  version: string;
  issuedAt: string;
  expirationTime: string;

  message: string;

  usedAt?: number;
  createdAt: number;
  expiresAt: number;
}

export interface WalletBindingRecord {
  bindingId: string;

  did: DIDString;

  namespace: WalletNamespace;
  chainId: string;
  accountId: string;
  address: string;

  proofType:
    | 'eip4361'
    | 'eip191'
    | 'eip712'
    | 'solana-sign-message'
    | 'tron-sign-message';

  signature: string;
  message: string;

  verified: boolean;
  revokedAt?: number;

  createdAt: number;
  updatedAt: number;
}

export interface WalletBindingVerifyInput {
  did: DIDString;
  accountId: string;
  address: string;
  chainId: string;
  message: string;
  signature: string;
  domain: string;
}
```



---



# 7\. 链上锚定类型



## `core/anchor/anchor.types.ts`



```TypeScript
import { DIDString } from '../did/did.types';

export type AnchorType =
  | 'did_document'
  | 'credential'
  | 'revocation_root'
  | 'schema'
  | 'issuer';

export interface ChainAnchorTarget {
  chainId: string;
  registryAddress: string;
}

export interface DIDAnchorInput {
  did: DIDString;
  didDocumentHash: string;
  controllerAddress: string;
  target: ChainAnchorTarget;
}

export interface CredentialAnchorInput {
  credentialHash: string;
  issuerDid: DIDString;
  subjectDid: DIDString;
  schemaHash?: string;
  target: ChainAnchorTarget;
}

export interface RevocationRootAnchorInput {
  listId: string;
  root: string;
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
}
```



---



# 8\. Key Manager 类型



## `core/crypto/key-manager.types.ts`



```TypeScript
import { DIDKeyType } from '../did/did.types';

export type KeyUsage =
  | 'authentication'
  | 'assertionMethod'
  | 'keyAgreement'
  | 'capabilityInvocation'
  | 'capabilityDelegation';

export interface ManagedKey {
  keyRef: string;
  type: DIDKeyType;
  publicKeyMultibase?: string;
  publicKeyJwk?: JsonWebKey;
  controller?: string;
  usages: KeyUsage[];
  createdAt: number;
}

export interface KeyCreateInput {
  type: DIDKeyType;
  usages: KeyUsage[];
  controller?: string;
}

export interface KeyManagerService {
  createKey(input: KeyCreateInput): Promise;

  getKey(keyRef: string): Promise;

  sign(input: {
    keyRef: string;
    data: Uint8Array;
    alg?: string;
    purpose?: KeyUsage;
  }): Promise;

  verify(input: {
    publicKey: ManagedKey;
    data: Uint8Array;
    signature: Uint8Array;
    alg?: string;
  }): Promise;
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



# 9\. DID 错误体系



## `core/did/did.errors.ts`



```TypeScript
export class DIDError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'DIDError';
  }
}

export const DIDErrors = {
  INVALID_DID: (did?: string) =>
    new DIDError('DID_INVALID_DID', 'Invalid DID', { did }),

  UNSUPPORTED_METHOD: (method?: string) =>
    new DIDError('DID_UNSUPPORTED_METHOD', 'Unsupported DID method', { method }),

  DOCUMENT_NOT_FOUND: (did?: string) =>
    new DIDError('DID_DOCUMENT_NOT_FOUND', 'DID document not found', { did }),

  DOCUMENT_INVALID: (errors?: string[]) =>
    new DIDError('DID_DOCUMENT_INVALID', 'DID document invalid', { errors }),

  KEY_NOT_FOUND: (keyRef?: string) =>
    new DIDError('DID_KEY_NOT_FOUND', 'DID key not found', { keyRef }),

  SIGN_FAILED: (reason?: unknown) =>
    new DIDError('DID_SIGN_FAILED', 'DID signing failed', reason),

  VERIFY_FAILED: (reason?: unknown) =>
    new DIDError('DID_VERIFY_FAILED', 'DID verification failed', reason),

  ANCHOR_FAILED: (reason?: unknown) =>
    new DIDError('DID_ANCHOR_FAILED', 'DID anchor failed', reason),
};
```



---



# 10\. VC 错误体系



## `core/vc/vc.errors.ts`



```TypeScript
export class VCError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'VCError';
  }
}

export const VCErrors = {
  INVALID_CREDENTIAL: (details?: unknown) =>
    new VCError('VC_INVALID_CREDENTIAL', 'Invalid credential', details),

  INVALID_ISSUER: (issuer?: string) =>
    new VCError('VC_INVALID_ISSUER', 'Invalid issuer', { issuer }),

  ISSUER_NOT_TRUSTED: (issuer?: string) =>
    new VCError('VC_ISSUER_NOT_TRUSTED', 'Issuer is not trusted', { issuer }),

  SUBJECT_MISMATCH: (details?: unknown) =>
    new VCError('VC_SUBJECT_MISMATCH', 'Credential subject mismatch', details),

  EXPIRED: (expirationDate?: string) =>
    new VCError('VC_EXPIRED', 'Credential expired', { expirationDate }),

  NOT_YET_VALID: (issuanceDate?: string) =>
    new VCError('VC_NOT_YET_VALID', 'Credential not yet valid', { issuanceDate }),

  SIGNATURE_INVALID: (details?: unknown) =>
    new VCError('VC_SIGNATURE_INVALID', 'Credential signature invalid', details),

  STATUS_REVOKED: (details?: unknown) =>
    new VCError('VC_STATUS_REVOKED', 'Credential has been revoked', details),

  STATUS_CHECK_FAILED: (details?: unknown) =>
    new VCError('VC_STATUS_CHECK_FAILED', 'Credential status check failed', details),

  SCHEMA_INVALID: (details?: unknown) =>
    new VCError('VC_SCHEMA_INVALID', 'Credential schema invalid', details),

  ANCHOR_MISMATCH: (details?: unknown) =>
    new VCError('VC_ANCHOR_MISMATCH', 'Credential anchor mismatch', details),
};
```



---



# 11\. DID Parser



## `core/did/did-parser.service.ts`



```TypeScript
import {
  DIDParsed,
  DIDString,
} from './did.types';
import { DIDErrors } from './did.errors';

export class DIDParserService {
  parse(didUrl: string): DIDParsed {
    if (!didUrl.startsWith('did:')) {
      throw DIDErrors.INVALID_DID(didUrl);
    }

    const match = didUrl.match(
      /^(did:([a-z0-9]+):([^/?#]+))([^?#]*)?(\?[^#]*)?(#.*)?$/i,
    );

    if (!match) {
      throw DIDErrors.INVALID_DID(didUrl);
    }

    const did = match[1] as DIDString;
    const method = match[2];
    const methodSpecificId = match[3];

    return {
      did,
      method,
      methodSpecificId,
      path: match[4] || undefined,
      query: match[5] || undefined,
      fragment: match[6]?.slice(1),
    };
  }

  isValid(did: string): did is DIDString {
    try {
      this.parse(did);
      return true;
    } catch {
      return false;
    }
  }
}
```



---



# 12\. DID Document Builder



## `core/did/did-document-builder.service.ts`



```TypeScript
import {
  DIDDocument,
  DIDUrl,
  VerificationMethod,
} from './did.types';
import {
  DIDDocumentBuildInput,
  DIDDocumentValidationResult,
} from './did-document.types';

export class DIDDocumentBuilderService {
  build(input: DIDDocumentBuildInput): DIDDocument {
    const created = input.createdAt?.toISOString() ?? new Date().toISOString();
    const updated = input.updatedAt?.toISOString() ?? created;

    const methods = input.verificationMethods;

    const authentication = methods
      .filter((m) => isUsage(m, 'authentication'))
      .map((m) => m.id);

    const assertionMethod = methods
      .filter((m) => isUsage(m, 'assertionMethod'))
      .map((m) => m.id);

    const capabilityInvocation = methods
      .filter((m) => isUsage(m, 'capabilityInvocation'))
      .map((m) => m.id);

    const doc: DIDDocument = {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/jws-2020/v1',
      ],
      id: input.did,
      controller: input.controller,
      verificationMethod: methods,
      authentication,
      assertionMethod,
      capabilityInvocation,
      service: input.services,
      created,
      updated,
    };

    return removeUndefined(doc);
  }

  validate(document: DIDDocument): DIDDocumentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!document['@context']) {
      errors.push('DID_DOCUMENT_CONTEXT_REQUIRED');
    }

    if (!document.id || !document.id.startsWith('did:')) {
      errors.push('DID_DOCUMENT_ID_INVALID');
    }

    if (!document.verificationMethod || document.verificationMethod.length === 0) {
      warnings.push('DID_DOCUMENT_NO_VERIFICATION_METHOD');
    }

    const methodIds = new Set(
      document.verificationMethod?.map((m) => m.id) ?? [],
    );

    for (const rel of [
      ...(document.authentication ?? []),
      ...(document.assertionMethod ?? []),
      ...(document.capabilityInvocation ?? []),
    ]) {
      if (typeof rel === 'string' && !methodIds.has(rel as DIDUrl)) {
        warnings.push(`DID_RELATIONSHIP_REFERENCES_UNKNOWN_METHOD:${rel}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

function isUsage(method: VerificationMethod, usage: string): boolean {
  const id = method.id.toLowerCase();

  if (usage === 'authentication') {
    return id.includes('auth') || id.includes('#key-1');
  }

  if (usage === 'assertionMethod') {
    return id.includes('assert') || id.includes('#key-1');
  }

  if (usage === 'capabilityInvocation') {
    return id.includes('capability') || id.includes('#key-1');
  }

  return false;
}

function removeUndefined(input: T): T {
  return JSON.parse(JSON.stringify(input));
}
```



---



# 13\. 稳定 JSON Hash



VC / DID 上链必须 hash 稳定。



不能直接：



```TypeScript
JSON.stringify(obj)
```



因为字段顺序不稳定。



## `core/anchor/anchor-hash.service.ts`



```TypeScript
import { sha256 } from '@noble/hashes/sha256';

export class AnchorHashService {
  hashJson(input: unknown): `0x${string}` {
    const canonical = stableStringify(input);
    return bytesToHex(sha256(new TextEncoder().encode(canonical)));
  }

  hashString(input: string): `0x${string}` {
    return bytesToHex(sha256(new TextEncoder().encode(input)));
  }

  hashBytes(input: Uint8Array): `0x${string}` {
    return bytesToHex(sha256(input));
  }
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  const obj = value as Record;

  return `{${Object.keys(obj)
    .sort()
    .filter((key) => obj[key] !== undefined)
    .map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`)
    .join(',')}}`;
}

function bytesToHex(bytes: Uint8Array): `0x${string}` {
  return `0x${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}`;
}
```



---



# 14\. Key Manager 本地开发实现



生产必须换 KMS / MPC / Secure Enclave。



## `core/crypto/key-manager.service.ts`



```TypeScript
import {
  KeyCreateInput,
  KeyManagerService,
  ManagedKey,
} from './key-manager.types';
import { DIDErrors } from '../did/did.errors';

export class InMemoryDevKeyManagerService implements KeyManagerService {
  private readonly keys = new Map();
  private readonly privateKeys = new Map();

  async createKey(input: KeyCreateInput): Promise {
    const keyRef = this.newKeyRef();

    /**
     * 这里先不生成真实密钥。
     * Part 2 did:key 会接 noble/viem 生成 Ed25519/secp256k1。
     */
    const key: ManagedKey = {
      keyRef,
      type: input.type,
      controller: input.controller,
      usages: input.usages,
      createdAt: Date.now(),
    };

    this.keys.set(keyRef, key);

    return key;
  }

  async importDevKey(input: {
    keyRef?: string;
    key: ManagedKey;
    privateKey: Uint8Array;
  }): Promise {
    const keyRef = input.keyRef ?? input.key.keyRef ?? this.newKeyRef();

    const key: ManagedKey = {
      ...input.key,
      keyRef,
    };

    this.keys.set(keyRef, key);
    this.privateKeys.set(keyRef, input.privateKey);

    return key;
  }

  async getKey(keyRef: string): Promise {
    return this.keys.get(keyRef) ?? null;
  }

  async sign(input: {
    keyRef: string;
    data: Uint8Array;
  }): Promise {
    const key = this.keys.get(input.keyRef);
    if (!key) throw DIDErrors.KEY_NOT_FOUND(input.keyRef);

    throw DIDErrors.SIGN_FAILED(
      'InMemoryDevKeyManagerService.sign not implemented until Part 2 crypto adapters',
    );
  }

  async verify(): Promise {
    throw DIDErrors.VERIFY_FAILED(
      'InMemoryDevKeyManagerService.verify not implemented until Part 2 crypto adapters',
    );
  }

  private newKeyRef(): string {
    return `KEY-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }
}
```



---



# 15\. DID Generator 接口



## `core/did/did-generator.service.ts`



```TypeScript
import {
  DIDCreateInput,
  DIDCreateResult,
  DIDMethod,
} from './did.types';
import { DIDErrors } from './did.errors';

export interface DIDMethodGenerator {
  method: DIDMethod | string;
  create(input: DIDCreateInput): Promise;
}

export class DIDGeneratorService {
  private readonly generators = new Map();

  register(generator: DIDMethodGenerator) {
    this.generators.set(generator.method, generator);
  }

  async create(input: DIDCreateInput): Promise {
    const generator = this.generators.get(input.method);

    if (!generator) {
      throw DIDErrors.UNSUPPORTED_METHOD(input.method);
    }

    return generator.create(input);
  }
}
```



---



# 16\. DID Resolver 接口



## `core/did/did-resolver.service.ts`



```TypeScript
import {
  DIDResolutionResult,
  DIDString,
} from './did.types';
import { DIDParserService } from './did-parser.service';

export interface DIDMethodResolver {
  method: string;
  resolve(did: DIDString): Promise;
}

export class DIDResolverService {
  private readonly resolvers = new Map();

  constructor(
    private readonly parser: DIDParserService,
  ) {}

  register(resolver: DIDMethodResolver) {
    this.resolvers.set(resolver.method, resolver);
  }

  async resolve(did: DIDString): Promise {
    const parsed = this.parser.parse(did);
    const resolver = this.resolvers.get(parsed.method);

    if (!resolver) {
      return {
        didDocument: null,
        didResolutionMetadata: {
          error: 'methodNotSupported',
          message: `Unsupported DID method: ${parsed.method}`,
        },
        didDocumentMetadata: {},
      };
    }

    return resolver.resolve(did);
  }
}
```



---



# 17\. Identity 类型



## `core/identity/identity.types.ts`



```TypeScript
import { DIDString } from '../did/did.types';
import { WalletBindingRecord } from '../wallet-binding/wallet-binding.types';
import { VerifiableCredential } from '../vc/vc.types';

export interface IdentityProfile {
  identityId: string;
  userId: string;

  primaryDid: DIDString;

  displayName?: string;
  avatarUrl?: string;

  wallets: WalletBindingRecord[];

  credentials: Array;

  createdAt: number;
  updatedAt: number;
}

export interface IdentityCreateInput {
  userId: string;
  didMethod?: 'key' | 'pkh' | 'web' | 'ethr';
  displayName?: string;
}
```



---



# 18\. DID Audit 类型



## `core/audit/did-audit.types.ts`



```TypeScript
export type DIDIdentityAuditAction =
  | 'did.created'
  | 'did.resolved'
  | 'did.document.anchored'
  | 'wallet.binding.challenge.created'
  | 'wallet.binding.verified'
  | 'wallet.binding.revoked'
  | 'vc.issued'
  | 'vc.verified'
  | 'vc.revoked'
  | 'vc.anchored'
  | 'issuer.registered'
  | 'issuer.suspended'
  | 'issuer.revoked';

export interface DIDIdentityAuditRecord {
  auditNo: string;
  action: DIDIdentityAuditAction;
  result: 'success' | 'failed' | 'rejected' | 'blocked';

  userId?: string;
  did?: string;
  issuerDid?: string;
  subjectDid?: string;
  credentialId?: string;
  credentialHash?: string;

  chainId?: string;
  txHash?: string;

  metadata?: unknown;
  error?: unknown;

  createdAt: number;
}
```



---



# 19\. DID Audit Service



## `core/audit/did-audit.service.ts`



```TypeScript
import {
  DIDIdentityAuditAction,
  DIDIdentityAuditRecord,
} from './did-audit.types';

export interface DIDIdentityAuditSink {
  record(input: DIDIdentityAuditRecord): Promise;
}

export class ConsoleDIDIdentityAuditSink implements DIDIdentityAuditSink {
  async record(input: DIDIdentityAuditRecord): Promise {
    console.log('[DIDIdentityAudit]', input);
  }
}

export class DIDIdentityAuditService {
  constructor(
    private readonly sink: DIDIdentityAuditSink = new ConsoleDIDIdentityAuditSink(),
  ) {}

  async success(
    action: DIDIdentityAuditAction,
    input: Omit,
  ) {
    await this.record(action, 'success', input);
  }

  async failed(
    action: DIDIdentityAuditAction,
    input: Omit,
  ) {
    await this.record(action, 'failed', input);
  }

  private async record(
    action: DIDIdentityAuditAction,
    result: DIDIdentityAuditRecord['result'],
    input: Omit,
  ) {
    await this.sink.record({
      auditNo: this.newAuditNo(),
      action,
      result,
      ...input,
      createdAt: Date.now(),
    });
  }

  private newAuditNo(): string {
    return `DIDAUD-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }
}
```



---



# 20\. Part 1 完成内容



本部分已经完成 DID 身份系统最底层地基：



```Plain Text
DID 类型系统
DID Document 类型
VC 类型系统
VC Schema 类型
Issuer 类型
Wallet Binding 类型
链上 Anchor 类型
Key Manager 类型
DID 错误体系
VC 错误体系
DID Parser
DID Document Builder
稳定 JSON Hash
Key Manager 接口
DID Generator 接口
DID Resolver 接口
Identity Profile 类型
Audit 类型与 Service
```



---



# 21\. 下一部分继续



下一段建议继续：



# 《DID 身份 Part 2：DID 生成 did:key / did:pkh / did:web / did:ethr》



将覆盖：



```Plain Text
Ed25519 did:key 生成
secp256k1 did:key 生成
publicKeyMultibase
Multicodec 编码
did:pkh 生成
CAIP-10 Account ID
did:web 生成与 DID Document URL 规则
did:ethr 生成
DID Document verificationMethod 构建
DID Resolver 实现
真实 Crypto Adapter
```



这部分开始会接入真实密码学库，完成真正可用的 DID 生成。

