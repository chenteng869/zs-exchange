# A12\-《DID 身份 Part 12：完整联调验收 / 安全测试 / 上线 Checklist》

# 《DID 身份 Part 12：完整联调验收 / 安全测试 / 上线 Checklist》



本章是 DID 身份系统最终验收文档，覆盖：



- DID 生成验收

- 钱包绑定验收

- Issuer Trust 验收

- Schema 验收

- VC 签发验收

- VC 验证验收

- 撤销验收

- 链上 Anchor 验收

- 隐私保护验收

- 五大业务域验收

- 萨摩亚公司设立验收

- 后台管理验收

- 安全测试

- 性能测试

- 上线 Checklist

- P0 回滚方案

    

最终目标：



```Plain Text
保证 DID 身份系统不是 Demo，而是可用于交易所、跨境电商、博彩、金融、萨摩亚官网 APP / 企业家设立公司的工业级身份基础设施。
```



---



# 1\. 最终系统能力总览



完整 DID 身份系统已经覆盖：



```Plain Text
DID Core
DID Document
did:key
did:pkh
did:web
did:ethr
Wallet Binding SIWE / CAIP-10
Issuer Trust Registry
Schema Registry
VC Issue Pipeline
JWT VC
JSON-LD VC
EIP-712 VC
VC Verify Pipeline
Credential Status
StatusList2021
Revocation
Suspension
Lifecycle
On-chain Anchor
Privacy Commitment
Selective Disclosure
ZK Interface
Identity UI
VC Wallet
Admin Governance
Audit
RBAC / MFA
```



支持五大业务域：



```Plain Text
1. 加密数字货币交易所 identity DID
2. 全球跨境电商 decentralized identity DID
3. 博彩 identity DID
4. 金融公司 identity DID
5. 萨摩亚官网 APP / 企业家设立公司 identity DID
```



---



# 2\. 联调环境准备



## 2\.1 必备环境



```Plain Text
iOS / Android App
Web Admin Console
DID Backend API
PostgreSQL
Redis
KMS / HSM / MPC 签名服务
EVM RPC
测试链
合约部署地址
Issuer 测试 DID
Verifier 测试 DID
测试钱包账户
测试用户账户
测试管理员账户
```



---



## 2\.2 测试链



建议：



```Plain Text
Sepolia
Polygon Amoy
Base Sepolia
Arbitrum Sepolia
BNB Testnet
```



主网上线前灰度：



```Plain Text
Ethereum Mainnet
Polygon
BNB Chain
Base
Arbitrum
```



---



## 2\.3 合约部署检查



必须部署：



```Plain Text
DIDAnchorRegistry
CredentialAnchorRegistry
RevocationRootRegistry
IssuerRegistryAnchor
```



必须配置：



```Plain Text
owner = multisig
anchor operator
issuer operator
revoker operator
```



---



# 3\. DID 生成验收



## 3\.1 did:key Ed25519



测试：



```TypeScript
const did = await didRuntime.generator.create({
  method: 'key',
  keyType: 'Ed25519',
});
```



期望：



```Plain Text
did 以 did:key:z 开头
DID Document 有 verificationMethod
verificationMethod type = Ed25519VerificationKey2020
authentication 包含 key-1
assertionMethod 包含 key-1
```



---



## 3\.2 did:key secp256k1



测试：



```TypeScript
await didRuntime.generator.create({
  method: 'key',
  keyType: 'secp256k1',
});
```



期望：



```Plain Text
did:key:z...
verificationMethod type = EcdsaSecp256k1VerificationKey2019
```



---



## 3\.3 did:pkh



测试：



```TypeScript
await didRuntime.generator.create({
  method: 'pkh',
  network: 'eip155',
  chainId: '1',
  accountAddress: '0x1234567890abcdef1234567890abcdef12345678',
});
```



期望：



```Plain Text
did:pkh:eip155:1:0x...
address checksum 合法
DID Document 包含 blockchainAccountId
```



---



## 3\.4 did:web



测试：



```TypeScript
await didRuntime.generator.create({
  method: 'web',
  metadata: {
    domain: 'identity.samoa.example',
    publicKeyJwk,
  },
});
```



期望：



```Plain Text
did:web:identity.samoa.example
DID Document URL = https://identity.samoa.example/.well-known/did.json
Resolver 可解析
```



---



## 3\.5 did:ethr



测试：



```TypeScript
await didRuntime.generator.create({
  method: 'ethr',
  accountAddress,
  network: 'mainnet',
});
```



期望：



```Plain Text
did:ethr:0x...
或 did:ethr::0x...
```



---



# 4\. DID Resolver 验收



必须验证：



```Plain Text
did:key 可解析
did:pkh 可解析
did:web 可解析
did:ethr 可解析
非法 DID 返回 invalidDid
不支持 method 返回 methodNotSupported
did:web 404 返回 notFound
```



---



# 5\. 钱包绑定验收



## 5\.1 创建 Challenge



```TypeScript
const challenge = await walletBinding.challengeService.createEvmChallenge({
  did,
  address,
  chainId: '1',
  domain: 'app.example.com',
  uri: 'https://app.example.com/identity/wallet-binding',
});
```



期望：



```Plain Text
message 符合 EIP-4361
包含 domain
包含 address
包含 nonce
包含 issuedAt
包含 expirationTime
包含 DID resource
包含 CAIP-10 accountId
```



---



## 5\.2 正常绑定



```TypeScript
const result = await walletBinding.bindingService.verifyAndBindEvm({
  challengeId,
  signature,
});
```



期望：



```Plain Text
签名验证通过
生成 WalletBindingRecord
生成 did:pkh
challenge 标记 used
重复调用返回已存在 binding 或拒绝复用 challenge
```



---



## 5\.3 防重放



必须失败：



```Plain Text
重复使用 challenge
过期 challenge
domain 不匹配
uri 不匹配
chainId 不匹配
nonce 不匹配
签名地址不匹配
```



---



## 5\.4 五域绑定规则



必须验证：



```Plain Text
交易所 withdraw -> strong_required
博彩 withdraw_winnings -> strong_required
金融 invest -> required
金融 withdraw -> strong_required
跨境电商 seller_payout -> required
萨摩亚 sign_company_documents -> strong_required
```



---



# 6\. Issuer Trust 验收



## 6\.1 注册 Issuer



```TypeScript
await issuerRegistry.register({
  did: 'did:web:identity.samoa.example',
  trustLevel: 'government',
  allowedDomains: ['samoa_enterprise'],
  allowedCredentialTypes: ['SamoaEntrepreneurIdentity'],
  allowedSchemas: ['schema:samoa:entrepreneur-identity:v1'],
});
```



期望：



```Plain Text
Issuer 状态 active
Trust Level 正确
权限范围正确
审计 issuer.registered
```



---



## 6\.2 未授权 Issuer 签发



如果 Issuer 不允许该 domain：



```Plain Text
ISSUER_DOMAIN_NOT_ALLOWED
```



如果不允许 credentialType：



```Plain Text
ISSUER_CREDENTIAL_NOT_ALLOWED
```



如果不允许 schema：



```Plain Text
ISSUER_SCHEMA_NOT_ALLOWED
```



---



## 6\.3 Issuer suspend / revoke



必须验证：



```Plain Text
suspended issuer 不能签发
revoked issuer 不能签发
revoked issuer 签发的 VC 验证 issuer_trust 失败
```



---



# 7\. Schema Registry 验收



## 7\.1 注册 Schema



必须验证：



```Plain Text
schemaId 唯一
domain 正确
credentialType 正确
requiredClaims 正确
hash 稳定
status = active
```



---



## 7\.2 Claims 校验



缺少 required claim 必须失败：



```Plain Text
REQUIRED_CLAIM_MISSING
```



Deprecated / disabled schema：



```Plain Text
SCHEMA_DEPRECATED
SCHEMA_DISABLED
```



---



# 8\. VC 签发验收



## 8\.1 JSON\-LD VC



签发：



```TypeScript
await vcIssuer.issue({
  context: {
    format: 'jsonld_vc',
    domain,
    issuerDid,
    issuerKeyRef,
    subjectDid,
    credentialType,
    schemaId,
  },
  claims,
});
```



期望：



```Plain Text
VC 有 @context
type 包含 VerifiableCredential
issuer 正确
credentialSubject.id 正确
credentialSchema 正确
credentialStatus 可选
proof 存在
proofPurpose = assertionMethod
credentialHash 生成
签发审计存在
```



---



## 8\.2 JWT VC



期望：



```Plain Text
JWT 三段式
payload.iss = issuerDid
payload.sub = subjectDid
payload.vc 存在
nbf / exp 正确
签名可验证
```



---



## 8\.3 EIP\-712 VC



期望：



```Plain Text
typedData.domain.name = VerifiableCredential
primaryType = Credential
signature 存在
可恢复签名者
```



---



# 9\. VC 验证验收



必须逐项验证：



```Plain Text
format
structure
signature
time
schema
issuer_trust
status
anchor
holder_binding
domain_policy
```



验证结果示例：



```JSON
{
  "valid": true,
  "checks": [
    { "name": "structure", "passed": true },
    { "name": "signature", "passed": true },
    { "name": "time", "passed": true },
    { "name": "schema", "passed": true },
    { "name": "issuer_trust", "passed": true },
    { "name": "status", "passed": true }
  ]
}
```



---



## 9\.1 过期 VC



必须失败：



```Plain Text
CREDENTIAL_EXPIRED
```



---



## 9\.2 撤销 VC



必须失败：



```Plain Text
LOCAL_REVOCATION_REGISTRY_REVOKED
或 STATUS_LIST_REVOKED
或 ONCHAIN_REVOKED
```



---



## 9\.3 Issuer 不可信



必须失败：



```Plain Text
ISSUER_NOT_FOUND
ISSUER_STATUS_SUSPENDED
DOMAIN_NOT_ALLOWED
CREDENTIAL_TYPE_NOT_ALLOWED
SCHEMA_NOT_ALLOWED
```



---



# 10\. Revocation / StatusList 验收



## 10\.1 分配 StatusList Entry



期望：



```Plain Text
listId 存在
index 唯一
statusListCredential URL 正确
bit 初始为 0
```



---



## 10\.2 撤销



```TypeScript
await revocation.revoke({
  credentialId,
  reason: 'AML high risk',
  operatorId,
});
```



期望：



```Plain Text
Lifecycle = revoked
Local revocation registry 命中
StatusList bit = 1
审计 credential.lifecycle.revoked
VC 验证失败
```



---



## 10\.3 暂停 / 恢复



```Plain Text
suspend -> status = suspended, bit = 1
resume -> status = active, bit = 0
```



---



## 10\.4 Revocation Root Anchor



期望：



```Plain Text
rootHash 生成
链上 updateRoot 成功
txHash 写入
链上 getRoot 匹配
```



---



# 11\. 链上 Anchor 验收



## 11\.1 DID Document Hash



```Plain Text
anchorDID 成功
getDIDAnchor 返回 documentHash
本地 hash == onchain hash
```



---



## 11\.2 Credential Hash



```Plain Text
anchorCredential 成功
getCredentialAnchor 返回 issuerHash / subjectHash / schemaHash / domainHash
全部匹配
```



---



## 11\.3 Issuer Anchor



```Plain Text
issuerHash
metadataHash
permissionHash
statusHash
链上一致
```



---



## 11\.4 隐私要求



必须检查链上 event 和 calldata 中没有：



```Plain Text
姓名
护照
身份证
出生日期
地址
税号
UBO 明文
收入
资产
博彩记录
AML 报告
```



---



# 12\. 隐私保护验收



## 12\.1 PII 扫描



输入：



```JSON
{
  "passportNumber": "P123456",
  "dateOfBirth": "1990-01-01"
}
```



期望：



```Plain Text
检测 government_id / date_of_birth
anchor purpose 下必须失败
```



---



## 12\.2 Commitment



必须验证：



```Plain Text
同 value + 不同 salt -> 不同 commitment
同 value + 同 salt + 同 pepper -> 相同 commitment
不同 domain -> 不同 commitment
不同 credentialType -> 不同 commitment
```



---



## 12\.3 Pepper



必须验证：



```Plain Text
生产环境没有 pepper 不允许 sensitive commitment
pepper 不出现在前端
pepper 不写日志
pepper 不上链
```



---



## 12\.4 Selective Disclosure



必须验证：



```Plain Text
只披露用户确认字段
敏感字段默认隐藏
未披露字段生成 commitment
presentation 包含 challenge
过期 disclosure request 失败
```



---



## 12\.5 ZK 预留



必须验证接口：



```Plain Text
AgeOver18ZKService
KYCLevelZKService
AccreditedInvestorZKService
SamoaUBOZKService
```



即使 prover 未接入，也要明确返回：



```Plain Text
ZK_PROVER_NOT_CONFIGURED
ZK_VERIFIER_NOT_CONFIGURED
```



---



# 13\. 五大业务域验收



---



## 13\.1 交易所 DID



必须跑通：



```Plain Text
用户 did:pkh / did:key
钱包绑定
ExchangeKYCLevel VC
AMLScreening VC
SanctionsScreening VC
ExchangeWithdrawalPermission VC
TravelRuleCompliance VC
提现前 DomainPermissionService + WalletBindingGuard + VCVerify
AML high risk 后撤销提现权限
撤销后提现失败
```



---



## 13\.2 跨境电商 DID



必须跑通：



```Plain Text
买家身份 VC
卖家身份 VC
MerchantKYB VC
TaxIdentity VC
ShippingAddressProof VC
seller_payout 前检查 wallet binding
商户欺诈后 revoke / suspend
```



---



## 13\.3 博彩 DID



必须跑通：



```Plain Text
AgeOver18 VC
GeoEligibility VC
SelfExclusionStatus VC
ResponsibleGamingLimit VC
BettingPermission VC
bet 前验证全部 VC
self_exclusion 后 BettingPermission 立即 revoked
用户不能继续下注
```



---



## 13\.4 金融 DID



必须跑通：



```Plain Text
FinancialKYCLevel VC
RiskSuitability VC
AccreditedInvestor VC
IncomeProof / AssetProof VC
InvestmentPermission VC
invest 前验证
accreditation_invalid 后不能投资
```



---



## 13\.5 萨摩亚官网 APP / 企业家 DID



必须跑通：



```Plain Text
创建 Samoa Entrepreneur DID
绑定钱包
SamoaEntrepreneurIdentity VC
SamoaOfficialServiceAccess VC
CompanyNameReservation VC
Founder / Director / Shareholder / UBO VC
RegisteredAgent VC
RegisteredOfficeAddress VC
CompanyFormationApplication VC
后台 approve
签发 IncorporationCertificate VC
Credential Hash 上链
签发 GoodStanding VC
company_struck_off 后撤销 GoodStanding 和 Certificate
```



---



# 14\. 萨摩亚公司设立专项验收



## 14\.1 申请流程



必须验证：



```Plain Text
draft
submitted
under_review
approved
incorporated
rejected
struck_off
```



---



## 14\.2 审核条件



批准前必须检查：



```Plain Text
EntrepreneurIdentity active
FounderIdentity active
DirectorIdentity active
ShareholderIdentity active
UBODeclaration active
RegisteredAgent active
RegisteredOfficeAddress active
AML / Sanctions / PEP passed
SourceOfFundsDeclaration active
CompanyNameReservation active
```



---



## 14\.3 公司证书



IncorporationCertificate VC 必须：



```Plain Text
issuer = Samoa official issuer
trustLevel = government
schema = schema:samoa:incorporation-certificate:v1
credentialStatus 存在
credentialHash 上链
不暴露 companyName 明文，使用 companyNameHash
```



---



## 14\.4 Good Standing



必须：



```Plain Text
短周期有效
可撤销
可重新签发
公司 struck_off 后立即 revoked
```



---



# 15\. 后台管理验收



必须验证：



```Plain Text
Issuer 注册 / 暂停 / 撤销
Issuer 权限变更
Schema 注册 / 废弃 / 禁用
Credential 查询 / 签发
Credential suspend / resume / revoke
StatusList 创建 / 查询 / root anchor
Anchor DID / Credential / Issuer / RevocationRoot
Samoa application list / review / approve / reject / incorporated
Audit 查询
```



---



## 15\.1 RBAC



没有权限必须失败：



```Plain Text
ADMIN_PERMISSION_DENIED
```



---



## 15\.2 MFA



高危操作未 MFA：



```Plain Text
ADMIN_MFA_REQUIRED
```



---



## 15\.3 Reason



高危操作没有 reason：



```Plain Text
ADMIN_REASON_REQUIRED
```



---



# 16\. UI 验收



必须验证：



```Plain Text
Identity Home 展示 primary DID
五大业务域状态展示
Wallet Binding 列表
发起绑定
撤销绑定
VC Wallet
VC 详情
隐私字段隐藏
Credential Verify
Verification checks 展示
Selective Disclosure Modal
Samoa Enterprise Identity Page
Samoa Company Formation Page
链上 anchor txHash 展示
revoked / expired / suspended 醒目展示
```



---



# 17\. 安全测试



## 17\.1 私钥安全



必须验证：



```Plain Text
业务层不能读取 issuer private key
业务层不能读取 holder private key
私钥不出现在日志
私钥不进入前端
KMS / HSM / MPC 签名边界清晰
```



---



## 17\.2 VC 伪造



攻击：



```Plain Text
修改 claims
修改 issuer
修改 expirationDate
修改 credentialSubject
复制 proof 到另一个 VC
```



必须：



```Plain Text
signature invalid
hash mismatch
schema invalid
issuer trust failed
```



---



## 17\.3 DID Document 篡改



必须：



```Plain Text
did:web documentHash anchor mismatch
verificationMethod 不在 assertionMethod 中则失败
revoked key 不可用
```



---



## 17\.4 钱包绑定重放



必须失败：



```Plain Text
重复 challenge
过期 nonce
换 domain
换 uri
换 chainId
换 address
```



---



## 17\.5 链上隐私泄露



必须检查：



```Plain Text
event logs
calldata
indexed topics
explorer 显示
```



不得出现任何 PII。



---



## 17\.6 博彩合规



必须：



```Plain Text
self-exclusion 后立即禁止下注
年龄证明不能暴露 DOB
geo ineligible 不能下注
responsible limit breach 后 suspend betting permission
```



---



## 17\.7 金融合规



必须：



```Plain Text
accredited investor revoked 后不能投资
risk suitability expired 后不能投资
sanctions hit 后全部 financial permissions revoked
```



---



## 17\.8 萨摩亚合规



必须：



```Plain Text
公司 struck off 后 GoodStanding revoked
UBO false declaration 后 UBO VC revoked
RegisteredAgent revoked 后相关申请不能批准
CompanyCertificate anchor hash mismatch 时验证失败
```



---



# 18\. 性能测试



## 18\.1 DID 生成



目标：



```Plain Text
did:key P95  Wallet Binding
  -> Issuer Trust
  -> Schema Registry
  -> VC Issue
  -> VC Verify
  -> Revocation
  -> Privacy
  -> On-chain Anchor
  -> UI Wallet
  -> Admin Governance
```



并且从架构上已经覆盖五大业务场景：



```Plain Text
加密数字货币交易所
全球跨境电商平台
博彩
金融公司
萨摩亚官网 APP / 企业家设立公司
```



这套系统不是单纯“身份页面”，而是：



```Plain Text
可签发、可验证、可撤销、可锚定、可隐私披露、可后台治理、可监管审计的 DID 身份基础设施。
```



