# H00\-《DApp 浏览器工业级总架构》

# 《DApp 浏览器工业级总架构》



本章定义生产级 DApp 浏览器的整体架构。目标不是做一个简单 WebView，而是做一个完整的 **Web3 应用运行容器 \+ 钱包连接层 \+ 权限安全层 \+ 多链交易签名层 \+ DApp 生态入口**。



系统最终覆盖：



- WebView 内核封装

- 多链钱包注入

- EIP\-1193 Provider

- WalletConnect v2

- DApp 授权系统

- DApp 权限隔离

- DApp 列表与搜索

- 收藏 / 最近访问

- URL 安全检测

- 钓鱼域名拦截

- 交易签名前预解析

- 用户确认弹窗

- 多账户 / 多链切换

- DApp Session 管理

- DApp 调用审计

- 前端浏览器 UI

- 移动端 WebView 桥

- 后台 DApp 管理

- 风控黑名单

- 生产监控

    

---



## 1\. DApp 浏览器定位



DApp 浏览器不是普通浏览器，也不是单纯打开网页。



它是：



```Plain Text
Secure WebView Runtime
  + Injected Wallet Provider
  + Permission System
  + Signing Gateway
  + Transaction Risk Engine
  + Multi-chain RPC Router
  + WalletConnect Endpoint
  + DApp Registry
  + Audit & Monitoring
```



DApp 浏览器的核心职责：



```Plain Text
让第三方 DApp 安全地连接用户钱包，并在用户明确授权后完成签名、交易、切链、授权等操作。
```



DApp 浏览器必须模拟主流钱包环境：



```TypeScript
window.ethereum.request({
  method: 'eth_requestAccounts',
});
```



并且要兼容：



```Plain Text
MetaMask
WalletConnect
EIP-1193
EIP-1102
EIP-3085
EIP-3326
EIP-712
ERC-20
ERC-721
ERC-1155
```



---



## 2\. 总体架构



```Plain Text
Mobile App / Web App
  │
  ├─ DApp Browser UI
  │   ├─ Home
  │   ├─ Search
  │   ├─ Category
  │   ├─ Favorites
  │   ├─ Recent
  │   └─ Browser Tabs
  │
  ├─ Secure WebView Core
  │   ├─ URL Loader
  │   ├─ Navigation Guard
  │   ├─ Script Injector
  │   ├─ JS Bridge
  │   ├─ Download Guard
  │   └─ External Link Guard
  │
  ├─ Injected Provider
  │   ├─ window.ethereum
  │   ├─ EIP-1193 request()
  │   ├─ send / sendAsync
  │   ├─ events
  │   └─ provider state
  │
  ├─ DApp Request Router
  │   ├─ Account Request
  │   ├─ Chain Request
  │   ├─ RPC Proxy
  │   ├─ Sign Request
  │   ├─ Transaction Request
  │   └─ Permission Request
  │
  ├─ Permission & Session Layer
  │   ├─ DApp Sessions
  │   ├─ Origin Permissions
  │   ├─ Account Permissions
  │   ├─ Chain Permissions
  │   └─ Revocation
  │
  ├─ Wallet Core
  │   ├─ Accounts
  │   ├─ Chains
  │   ├─ Sign Message
  │   ├─ Sign Typed Data
  │   ├─ Sign Transaction
  │   └─ Broadcast
  │
  ├─ Security Engine
  │   ├─ URL Risk
  │   ├─ Domain Blacklist
  │   ├─ Contract Blacklist
  │   ├─ Calldata Decode
  │   ├─ Approval Risk
  │   ├─ Simulation
  │   └─ User Warning
  │
  ├─ WalletConnect v2
  │   ├─ Pairing
  │   ├─ Session Proposal
  │   ├─ Session Request
  │   ├─ Session Storage
  │   └─ Disconnect
  │
  ├─ DApp Registry
  │   ├─ DApp List
  │   ├─ Search
  │   ├─ Category
  │   ├─ Featured
  │   ├─ Risk Level
  │   └─ Admin Config
  │
  └─ Audit / Monitoring
      ├─ Request Log
      ├─ Sign Log
      ├─ Tx Log
      ├─ Risk Event
      ├─ Metrics
      └─ Alerts
```



---



## 3\. 核心调用链路



### 3\.1 DApp 连接钱包



```Plain Text
DApp Page
  -> window.ethereum.request({ method: 'eth_requestAccounts' })
  -> Injected Provider
  -> WebView Bridge
  -> Native Request Router
  -> URL Security Check
  -> Permission Session Check
  -> User Connect Confirm Modal
  -> Wallet Account Selected
  -> Session Created
  -> Return Address[]
  -> Provider emits accountsChanged
```



---



### 3\.2 DApp 查询链 ID



```Plain Text
DApp
  -> eth_chainId
  -> Provider
  -> Bridge
  -> Chain State Service
  -> Return active chainId
```



---



### 3\.3 DApp 切换链



```Plain Text
DApp
  -> wallet_switchEthereumChain
  -> Provider
  -> Bridge
  -> Chain Permission Check
  -> Chain Support Check
  -> User Confirm
  -> Active Chain Changed
  -> Provider emits chainChanged
```



---



### 3\.4 DApp 签名消息



```Plain Text
DApp
  -> personal_sign / eth_signTypedData_v4
  -> Provider
  -> Bridge
  -> Permission Check
  -> Message Parser
  -> Risk Check
  -> User Sign Confirm Modal
  -> Wallet Core Sign
  -> Return Signature
  -> Audit Log
```



---



### 3\.5 DApp 发起交易



```Plain Text
DApp
  -> eth_sendTransaction
  -> Provider
  -> Bridge
  -> Permission Check
  -> Tx Parser
  -> Token / NFT / Contract Decode
  -> Risk Engine
  -> Gas Estimate
  -> Optional Simulation
  -> User Tx Confirm Modal
  -> Wallet Core Sign Tx
  -> RPC Broadcast
  -> Return txHash
  -> Audit Log
```



---



### 3\.6 WalletConnect 请求



```Plain Text
External DApp
  -> WalletConnect Pairing
  -> Session Proposal
  -> User Approves Session
  -> External DApp Sends Request
  -> WalletConnect Request Handler
  -> Same Signing / Tx Flow
  -> Response to WalletConnect
```



---



## 4\. 工程目录结构



建议按工业级模块拆分：



```Bash
src/modules/dapp-browser/
  core/
    browser/
      dapp-browser.controller.ts
      dapp-browser.service.ts
      dapp-browser-state.service.ts
      browser-tab.service.ts

    webview/
      secure-webview.tsx
      webview-navigation.guard.ts
      webview-message-router.ts
      webview-bridge.types.ts
      injected-script-loader.ts

    provider/
      injected-provider.ts
      injected-provider-source.ts
      provider-events.ts
      provider-error.ts
      provider-methods.ts
      eip1193.types.ts

    bridge/
      dapp-bridge.service.ts
      dapp-request-router.service.ts
      dapp-response.service.ts
      dapp-event-dispatcher.service.ts

    permissions/
      dapp-permission.service.ts
      dapp-session.service.ts
      dapp-session.repository.ts
      permission-policy.service.ts
      permission.types.ts

    accounts/
      dapp-account.service.ts
      active-account.service.ts
      account-selector.service.ts

    chains/
      chain-registry.service.ts
      active-chain.service.ts
      chain-switch.service.ts
      chain-add.service.ts
      chain.types.ts

    rpc/
      rpc-router.service.ts
      rpc-client.service.ts
      rpc-rate-limit.service.ts
      rpc-cache.service.ts
      rpc.types.ts

    signing/
      signing-request.service.ts
      message-parser.service.ts
      typed-data-parser.service.ts
      signing-confirmation.service.ts
      signing-audit.service.ts

    transaction/
      transaction-request.service.ts
      transaction-parser.service.ts
      calldata-decoder.service.ts
      token-approval-parser.service.ts
      nft-approval-parser.service.ts
      transaction-simulation.service.ts
      transaction-confirmation.service.ts
      transaction-broadcast.service.ts

    security/
      url-security.service.ts
      phishing-detector.service.ts
      domain-blacklist.service.ts
      contract-blacklist.service.ts
      transaction-risk.service.ts
      approval-risk.service.ts
      security-event.service.ts

    walletconnect/
      walletconnect-client.service.ts
      walletconnect-session.service.ts
      walletconnect-proposal.service.ts
      walletconnect-request-handler.service.ts
      walletconnect-event.service.ts

    registry/
      dapp-registry.service.ts
      dapp-search.service.ts
      dapp-category.service.ts
      dapp-favorite.service.ts
      dapp-recent.service.ts
      dapp-registry.repository.ts

    audit/
      dapp-audit.service.ts
      dapp-audit.repository.ts
      dapp-call-log.service.ts

    monitoring/
      dapp-metrics.service.ts
      dapp-alert.service.ts
      dapp-health.service.ts

  ui/
    screens/
      DappHomeScreen.tsx
      DappBrowserScreen.tsx
      DappSearchScreen.tsx
      DappFavoritesScreen.tsx
      WalletConnectScreen.tsx
      DappSessionsScreen.tsx

    components/
      DappCard.tsx
      DappSearchBar.tsx
      DappCategoryTabs.tsx
      BrowserToolbar.tsx
      BrowserAddressBar.tsx
      BrowserTabView.tsx
      SecurityWarningBanner.tsx
      ConnectedAccountBar.tsx

    modals/
      ConnectConfirmModal.tsx
      SignMessageModal.tsx
      SignTypedDataModal.tsx
      TransactionConfirmModal.tsx
      ChainSwitchModal.tsx
      AddChainModal.tsx
      RiskWarningModal.tsx
      WalletConnectProposalModal.tsx

  admin/
    dapp-admin.controller.ts
    dapp-security-admin.controller.ts
    dapp-audit-admin.controller.ts
    dapp-admin.service.ts

  shared/
    types/
      dapp.types.ts
      wallet.types.ts
      security.types.ts
      audit.types.ts

    errors/
      dapp-errors.ts
      provider-errors.ts

    utils/
      url.ts
      hex.ts
      chain.ts
      origin.ts
      serializer.ts

  dapp-browser.module.ts
```



---



## 5\. 分层职责



### 5\.1 UI 层



负责：



- DApp 首页

- 浏览器页面

- WebView 容器

- 钱包连接弹窗

- 签名确认弹窗

- 交易确认弹窗

- 风险提示

- WalletConnect 会话页面

    

不负责：



- 真实签名

- 真实广播

- RPC 请求

- 风险判断核心逻辑

    

---



### 5\.2 WebView 层



负责：



- 加载 DApp URL

- 注入 Provider

- 拦截导航

- 接收 JS 请求

- 向 Native 发送消息

- 向 DApp 回传响应

- 控制多窗口 / 外链 / 下载行为

    

---



### 5\.3 Provider 层



负责：



- 暴露 `window.ethereum`

- 实现 EIP\-1193 `request`

- 实现事件系统

- 兼容 `send` / `sendAsync`

- 维护 selectedAddress / chainId

- 向 Native Bridge 转发 JSON\-RPC 请求

    

---



### 5\.4 Bridge 层



负责：



- 接收 WebView 消息

- 标准化请求

- 路由到不同服务

- 包装响应

- 向 WebView 回传结果

- 向 WebView 推送事件

    

---



### 5\.5 Permission 层



负责：



- DApp 首次连接授权

- origin 权限隔离

- account 权限隔离

- chain 权限隔离

- session 创建 / 续期 / 撤销

- 权限检查

    

---



### 5\.6 Wallet Core 层



负责：



- 获取账户地址

- 私钥 / MPC / KMS / Secure Enclave 签名

- 交易签名

- 消息签名

- TypedData 签名

- 广播交易

    

业务代码禁止直接接触：



```Plain Text
privateKey
mnemonic
seed
```



---



### 5\.7 Security 层



负责：



- URL 安全检测

- 钓鱼域名检测

- 合约黑名单

- approve 风险识别

- NFT 授权风险识别

- 交易模拟

- DApp 行为审计

- 高危交易阻断

    

---



### 5\.8 WalletConnect 层



负责：



- WalletConnect v2 初始化

- pairing

- session proposal

- session request

- session delete

- 外部 DApp 请求处理

- 复用签名 / 交易 / 权限逻辑

    

---



### 5\.9 Registry 层



负责：



- DApp 列表

- 搜索

- 分类

- 收藏

- 最近访问

- featured

- riskLevel

- 后台管理

    

---



### 5\.10 Audit / Monitoring 层



负责：



- DApp 连接审计

- 签名审计

- 交易审计

- 风险事件

- 请求量指标

- 失败率指标

- 高危告警

    

---



## 6\. Provider 支持能力



生产级必须支持以下方法。



### 6\.1 账户相关



```Plain Text
eth_requestAccounts
eth_accounts
wallet_requestPermissions
wallet_getPermissions
```



---



### 6\.2 链相关



```Plain Text
eth_chainId
net_version
wallet_switchEthereumChain
wallet_addEthereumChain
```



---



### 6\.3 签名相关



```Plain Text
personal_sign
eth_sign
eth_signTypedData
eth_signTypedData_v3
eth_signTypedData_v4
```



---



### 6\.4 交易相关



```Plain Text
eth_sendTransaction
eth_sendRawTransaction
eth_estimateGas
eth_gasPrice
eth_feeHistory
eth_maxPriorityFeePerGas
```



---



### 6\.5 查询相关



```Plain Text
eth_call
eth_getBalance
eth_blockNumber
eth_getTransactionByHash
eth_getTransactionReceipt
eth_getCode
eth_getLogs
eth_getBlockByNumber
eth_getBlockByHash
```



---



### 6\.6 资产相关



```Plain Text
wallet_watchAsset
```



---



## 7\. Provider 事件



必须支持：



```Plain Text
connect
disconnect
accountsChanged
chainChanged
message
```



示例：



```TypeScript
window.ethereum.on('accountsChanged', (accounts) => {});
window.ethereum.on('chainChanged', (chainId) => {});
window.ethereum.on('disconnect', (error) => {});
```



---



## 8\. DApp 权限模型



### 8\.1 权限维度



```Plain Text
origin
accountId
address
chainId
permissions
expiresAt
```



---



### 8\.2 权限类型



```TypeScript
export type DappPermission =
  | 'accounts'
  | 'sign_message'
  | 'sign_typed_data'
  | 'send_transaction'
  | 'switch_chain'
  | 'add_chain'
  | 'watch_asset';
```



---



### 8\.3 Session 示例



```TypeScript
export interface DappSession {
  sessionId: string;
  origin: string;
  hostname: string;
  accountId: string;
  address: string;
  chainId: string;
  permissions: DappPermission[];
  source: 'webview' | 'walletconnect';
  connectedAt: number;
  updatedAt: number;
  expiresAt?: number;
  revokedAt?: number;
}
```



---



## 9\. 安全策略



### 9\.1 URL 加载安全



默认只允许：



```Plain Text
https://
```



默认禁止：



```Plain Text
http://
file://
data:
javascript:
intent:
market:
```



特殊 URL 必须走外部跳转确认。



---



### 9\.2 域名安全



检测：



```Plain Text
黑名单域名
同形字攻击
拼写相似域名
新注册域名
高风险 TLD
短链跳转
多级重定向
```



---



### 9\.3 WebView 安全



必须：



```Plain Text
disable file access
disable universal file access
disable mixed content
block third-party cookies if needed
disable auto download
disable multiple windows by default
block unknown schemes
sanitize postMessage
validate message origin
```



---



### 9\.4 签名安全



签名前必须展示：



```Plain Text
DApp 域名
请求方法
账户地址
链
原文内容
解析内容
风险提示
```



对于 `eth_sign`：



```Plain Text
默认高危提示
```



对于 `eth_signTypedData_v4`：



```Plain Text
结构化展示 domain / message / types
```



---



### 9\.5 交易安全



交易前必须解析：



```Plain Text
to
value
data
method selector
token transfer
approve
permit
NFT approveForAll
swap
bridge
contract interaction
```



高危操作：



```Plain Text
unlimited approve
setApprovalForAll
unknown contract
blacklisted contract
high gas
contract creation
native token drain
```



---



## 10\. 多链架构



### 10\.1 Chain Registry



```TypeScript
export interface ChainConfig {
  chainId: string;
  namespace: 'eip155' | 'solana' | 'tron' | 'bitcoin';
  name: string;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  nativeCurrency: {
    symbol: string;
    decimals: number;
    name: string;
  };
  enabled: boolean;
  testnet: boolean;
}
```



---



### 10\.2 第一批生产支持



EVM：



```Plain Text
Ethereum
BNB Chain
Polygon
Arbitrum
Optimism
Base
Avalanche
```



后续：



```Plain Text
Solana
Tron
Bitcoin
Sui
Aptos
```



EIP\-1193 主要服务 EVM。非 EVM 要提供各自 Provider：



```Plain Text
window.solana
window.tronWeb
window.okxwallet
```



但第一阶段架构先以 EVM 为主，预留多链 Provider 插槽。



---



## 11\. WalletConnect v2 架构



```Plain Text
WalletConnect Client
  -> Pairing URI
  -> Session Proposal
  -> User Approves Chains / Accounts / Methods
  -> Session Established
  -> DApp Sends Request
  -> Request Handler
  -> Permission / Security / Signing / Tx Flow
  -> Response
```



WalletConnect 支持方法：



```Plain Text
eth_sendTransaction
personal_sign
eth_signTypedData
eth_signTypedData_v4
wallet_switchEthereumChain
wallet_addEthereumChain
```



---



## 12\. DApp Registry 架构



### 12\.1 DApp 数据



```TypeScript
export interface DappItem {
  dappId: string;
  name: string;
  description?: string;
  iconUrl?: string;
  url: string;
  category: string;
  chains: string[];
  tags: string[];
  featured: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'blocked';
  status: 'active' | 'hidden' | 'blocked';
  sortOrder: number;
}
```



---



### 12\.2 功能



```Plain Text
DApp 列表
分类筛选
链筛选
关键词搜索
热门推荐
运营 Banner
收藏
最近访问
风险标识
后台上下架
```



---



## 13\. 审计系统



所有敏感行为必须审计。



### 13\.1 审计事件



```Plain Text
dapp.connect.requested
dapp.connect.approved
dapp.connect.rejected
dapp.sign.requested
dapp.sign.approved
dapp.sign.rejected
dapp.tx.requested
dapp.tx.approved
dapp.tx.rejected
dapp.tx.broadcasted
dapp.chain.switch
dapp.permission.revoked
walletconnect.session.approved
walletconnect.session.deleted
security.phishing.blocked
security.contract.blocked
```



---



### 13\.2 审计字段



```TypeScript
export interface DappAuditLog {
  auditNo: string;
  origin: string;
  hostname: string;
  dappId?: string;
  accountId?: string;
  address?: string;
  chainId?: string;
  method?: string;
  requestPayload?: unknown;
  responsePayload?: unknown;
  action: string;
  result: 'success' | 'rejected' | 'blocked' | 'failed';
  riskLevel?: string;
  riskReasons?: string[];
  createdAt: number;
}
```



---



## 14\. 后台管理



后台必须支持：



```Plain Text
DApp 列表管理
DApp 上架 / 下架
DApp 风险等级
DApp 分类管理
Banner 推荐
域名黑名单
合约黑名单
风险事件查询
签名审计查询
交易审计查询
WalletConnect 会话查询
```



---



## 15\. 生产监控



### 15\.1 指标



```Plain Text
dapp_browser_page_open_total
dapp_browser_provider_request_total
dapp_browser_provider_request_failed_total
dapp_browser_connect_total
dapp_browser_sign_total
dapp_browser_transaction_total
dapp_browser_transaction_rejected_total
dapp_browser_security_block_total
dapp_browser_walletconnect_session_total
dapp_browser_rpc_latency_seconds
dapp_browser_webview_crash_total
```



Labels：



```Plain Text
method
chain_id
origin
risk_level
result
```



---



### 15\.2 P0 告警



必须 P0：



```Plain Text
私钥泄露风险
恶意域名未拦截
黑名单合约交易放行
用户未确认就签名
用户未确认就发交易
Provider 大面积不可用
WalletConnect 请求无法处理
RPC 广播错误率暴涨
WebView 崩溃率异常
审计日志写入失败
```



---



## 16\. 工业级落地顺序



你要求不做 MVP，但代码仍然必须按可落地顺序分段写。顺序如下：



```Plain Text
Part 1: 类型系统 + 错误系统 + Provider 注入
Part 2: WebView 安全容器 + Bridge
Part 3: Request Router + RPC Proxy
Part 4: Permission / Session
Part 5: Account / Chain 管理
Part 6: Signing Flow
Part 7: Transaction Parser / Risk / Confirmation
Part 8: DApp Registry / Favorite / Recent
Part 9: WalletConnect v2
Part 10: Audit / Monitoring
Part 11: Admin 管理后台
Part 12: 完整联调与测试清单
```



每一段代码都必须满足：



```Plain Text
TypeScript 强类型
模块边界清晰
可测试
可替换真实 Wallet Core
可接后端
可扩展多链
不把私钥放进业务层
```



---



## 17\. 第一批代码目标



下一段开始正式写代码：



**《DApp 浏览器 Part 1：类型系统、错误系统、EIP\-1193 Provider 注入》**



会包含：



```Plain Text
shared/types/dapp.types.ts
shared/types/eip1193.types.ts
shared/types/chain.types.ts
shared/types/security.types.ts
shared/errors/provider-errors.ts
shared/errors/dapp-errors.ts
provider/provider-events.ts
provider/provider-methods.ts
provider/injected-provider.ts
provider/injected-provider-source.ts
```



这部分是整个 DApp 浏览器的地基。

