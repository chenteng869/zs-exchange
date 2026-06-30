# H13\-《DApp 浏览器 Part 13：完整联调验收清单 / 性能测试 / 安全测试 / 上线 Checklist》

# 《DApp 浏览器 Part 13：完整联调验收清单 / 性能测试 / 安全测试 / 上线 Checklist》



本章作为 DApp 浏览器项目的最终验收文档，覆盖：



- Provider 兼容性测试

- WebView 安全测试

- WalletConnect 联调

- DApp 连接测试

- 签名测试

- 交易测试

- 钓鱼拦截测试

- 黑名单合约测试

- Session 权限隔离测试

- 多账户切换测试

- 多链切换测试

- 性能指标

- 灰度上线

- 上线 Checklist

- P0 回滚预案

    

核心目标：



```Plain Text
确保 DApp 浏览器不是“能打开网页”，而是能在真实生产环境中安全、稳定、可控地承载第三方 DApp。
```



---



# 1\. 最终系统能力总览



完整 DApp 浏览器已经覆盖：



```Plain Text
Secure WebView
EIP-1193 Provider
DApp Bridge
Request Router
RPC Proxy
Chain Management
Account Management
Session Permission
Connect Confirmation
Sign Confirmation
Transaction Parser
Transaction Risk Engine
Wallet Core Signer
WalletConnect v2
DApp Registry
Favorites / Recent
Security Rules
Phishing Protection
Contract Blacklist
Audit Log
Metrics
Admin Console
```



最终链路：



```Plain Text
DApp / WalletConnect
  -> Provider Request
  -> Bridge / Request Router
  -> Permission Check
  -> Security Check
  -> User Confirmation
  -> Wallet Core
  -> RPC Broadcast / Response
  -> Audit / Metrics
```



---



# 2\. 联调环境准备



## 2\.1 基础环境



必须准备：



```Plain Text
iOS 真机
Android 真机
测试钱包账户
测试链 RPC
WalletConnect Project ID
DApp 测试站点
后台 Admin 环境
监控环境
```



推荐测试链：



```Plain Text
Ethereum Sepolia
Polygon Amoy
BNB Testnet
Arbitrum Sepolia
Base Sepolia
```



生产主网灰度前必须测试：



```Plain Text
Ethereum Mainnet
BNB Chain
Polygon
Arbitrum
Optimism
Base
Avalanche
```



---



## 2\.2 测试 DApp



建议覆盖：



```Plain Text
Uniswap
Aave
OpenSea
PancakeSwap
Snapshot
1inch
Curve
Lido
自研测试 DApp
WalletConnect 官方测试 DApp
```



自研测试 DApp 必须支持：



```TypeScript
eth_requestAccounts
eth_accounts
eth_chainId
net_version
wallet_switchEthereumChain
wallet_addEthereumChain
personal_sign
eth_sign
eth_signTypedData_v4
eth_sendTransaction
eth_getBalance
eth_call
eth_estimateGas
```



---



# 3\. Provider 兼容性测试



## 3\.1 Provider 注入



测试：



```TypeScript
Boolean(window.ethereum)
Boolean(window.web3?.currentProvider)
window.ethereum.isMetaMask
window.ethereum.isConnected()
```



期望：



```Plain Text
window.ethereum 存在
window.web3.currentProvider 存在
isMetaMask = true
isConnected() = true
ethereum#initialized 事件触发
```



---



## 3\.2 request API



测试：



```TypeScript
await ethereum.request({
  method: 'eth_chainId',
});
```



期望：



```Plain Text
返回当前 chainId，例如 0x1
```



---



## 3\.3 send 兼容



测试：



```TypeScript
ethereum.send('eth_chainId');
```



期望：



```Plain Text
返回 Promise 或兼容结果
```



---



## 3\.4 sendAsync 兼容



测试：



```TypeScript
ethereum.sendAsync(
  {
    id: 1,
    jsonrpc: '2.0',
    method: 'eth_chainId',
    params: [],
  },
  (err, res) => {
    console.log(err, res);
  },
);
```



期望：



```JSON
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": "0x1"
}
```



---



## 3\.5 事件监听



测试：



```TypeScript
ethereum.on('accountsChanged', console.log);
ethereum.on('chainChanged', console.log);
ethereum.on('disconnect', console.log);
ethereum.on('connect', console.log);
```



验收：



```Plain Text
切账户触发 accountsChanged
切链触发 chainChanged
Provider 初始化后 connect 正常
断开连接时 disconnect 正常
```



---



# 4\. WebView 安全测试



## 4\.1 HTTPS 加载



测试 URL：



```Plain Text
https://app.uniswap.org
```



期望：



```Plain Text
允许加载
Provider 注入成功
页面可连接钱包
```



---



## 4\.2 HTTP 阻断



测试 URL：



```Plain Text
http://example.com
```



期望：



```Plain Text
阻断加载
显示安全拦截页
记录 security.url.blocked
```



---



## 4\.3 Dangerous Scheme 阻断



测试：



```Plain Text
javascript:alert(1)
file:///etc/passwd
data:text/html;base64,...
```



期望：



```Plain Text
全部阻断
不可执行
不可加载
写安全事件
```



---



## 4\.4 外部 Scheme



测试：



```Plain Text
mailto:test@example.com
tel:10086
wc:xxxx
intent://xxx
```



期望：



```Plain Text
不在 WebView 内直接加载
走外部确认或 WalletConnect 处理
```



---



## 4\.5 window\.open



测试 DApp 调用：



```JavaScript
window.open('https://example.com');
```



期望：



```Plain Text
不自动打开新窗口
由外链策略控制
```



---



## 4\.6 文件访问



验收配置：



```Plain Text
allowFileAccess = false
allowUniversalAccessFromFileURLs = false
mixedContentMode = never
setSupportMultipleWindows = false
javaScriptCanOpenWindowsAutomatically = false
```



---



# 5\. DApp 连接测试



## 5\.1 未授权 eth\_accounts



测试：



```TypeScript
await ethereum.request({
  method: 'eth_accounts',
});
```



期望：



```JSON
[]
```



---



## 5\.2 eth\_requestAccounts



测试：



```TypeScript
await ethereum.request({
  method: 'eth_requestAccounts',
});
```



期望：



```Plain Text
弹出 ConnectConfirmModal
展示 DApp 域名
展示账户地址
展示权限列表
用户确认后返回 address
```



返回：



```JSON
[
  "0x1234567890abcdef1234567890abcdef12345678"
]
```



---



## 5\.3 用户拒绝连接



操作：



```Plain Text
点击拒绝
```



期望：



```JSON
{
  "code": 4001,
  "message": "User rejected account connection"
}
```



---



## 5\.4 Session 创建



连接成功后检查：



```Plain Text
origin
hostname
accountId
address
chainId
permissions
source = webview
```



必须正确落库 / 落本地存储。



---



# 6\. Session 权限隔离测试



## 6\.1 不同 DApp 隔离



步骤：



```Plain Text
1. Uniswap 授权 account-1
2. Aave 不授权
3. Uniswap eth_accounts
4. Aave eth_accounts
```



期望：



```Plain Text
Uniswap 返回 account-1 address
Aave 返回 []
```



---



## 6\.2 不同账户隔离



步骤：



```Plain Text
1. Uniswap 授权 account-1
2. 切换到 account-2
3. Uniswap eth_accounts
```



期望：



```JSON
[]
```



除非 account\-2 也授权。



---



## 6\.3 不同链隔离



步骤：



```Plain Text
1. Uniswap 在 Ethereum 授权 account-1
2. 切换到 BSC
3. Uniswap eth_accounts
```



期望：



```Plain Text
如果 Session 按 chainId 隔离，则返回 []
如果策略允许跨链复用，则返回 address
```



必须与产品策略一致。



---



## 6\.4 撤销授权



步骤：



```Plain Text
1. Admin 或用户端撤销 Uniswap Session
2. WebView 收到 accountsChanged []
3. DApp 再调用 eth_accounts
```



期望：



```JSON
[]
```



---



# 7\. 多账户切换测试



## 7\.1 切换到已授权账户



步骤：



```Plain Text
1. account-1 已授权当前 DApp
2. 切换 account-1
```



期望：



```TypeScript
accountsChanged(['0x...'])
```



---



## 7\.2 切换到未授权账户



步骤：



```Plain Text
1. account-1 已授权
2. account-2 未授权
3. 切换 account-2
```



期望：



```TypeScript
accountsChanged([])
```



不能泄露 account\-2 地址。



---



## 7\.3 无账户状态



步骤：



```Plain Text
锁定钱包或退出账户
```



期望：



```TypeScript
accountsChanged([])
```



签名和交易请求返回：



```JSON
{
  "code": 4100,
  "message": "No active account"
}
```



---



# 8\. 多链切换测试



## 8\.1 eth\_chainId



测试：



```TypeScript
await ethereum.request({
  method: 'eth_chainId',
});
```



期望：



```Plain Text
返回当前链 chainId
```



---



## 8\.2 wallet\_switchEthereumChain



测试：



```TypeScript
await ethereum.request({
  method: 'wallet_switchEthereumChain',
  params: [{ chainId: '0x38' }],
});
```



期望：



```Plain Text
弹出 ChainSwitchModal
用户确认后切链
Provider 触发 chainChanged
返回 null
```



---



## 8\.3 用户拒绝切链



期望：



```JSON
{
  "code": 4001,
  "message": "User rejected chain switch"
}
```



---



## 8\.4 未支持链



测试：



```TypeScript
await ethereum.request({
  method: 'wallet_switchEthereumChain',
  params: [{ chainId: '0x999999' }],
});
```



期望：



```JSON
{
  "code": 4902,
  "message": "Unrecognized chain"
}
```



---



## 8\.5 wallet\_addEthereumChain



测试：



```TypeScript
await ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [
    {
      chainId: '0x2105',
      chainName: 'Base',
      rpcUrls: ['https://mainnet.base.org'],
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18
      },
      blockExplorerUrls: ['https://basescan.org']
    }
  ]
});
```



期望：



```Plain Text
弹出 AddChainModal
只允许 https RPC
用户确认后加入 Chain Registry
返回 null
```



---



# 9\. RPC Proxy 测试



## 9\.1 eth\_blockNumber



```TypeScript
await ethereum.request({
  method: 'eth_blockNumber',
});
```



期望：



```Plain Text
返回 0x 开头区块高度
```



---



## 9\.2 eth\_getBalance



```TypeScript
await ethereum.request({
  method: 'eth_getBalance',
  params: [address, 'latest'],
});
```



期望：



```Plain Text
返回 0x 余额
```



---



## 9\.3 eth\_call



```TypeScript
await ethereum.request({
  method: 'eth_call',
  params: [
    {
      to: tokenAddress,
      data: '0x70a08231000000000000000000000000...'
    },
    'latest'
  ],
});
```



期望：



```Plain Text
返回合约调用结果
```



---



## 9\.4 RPC 限流



短时间发起大量请求：



```Plain Text
> 30 req/s / origin / chain / method
```



期望：



```JSON
{
  "code": -32005,
  "message": "RPC rate limit exceeded"
}
```



---



# 10\. 签名测试



## 10\.1 personal\_sign UTF\-8



```TypeScript
await ethereum.request({
  method: 'personal_sign',
  params: ['Hello DApp', address],
});
```



期望：



```Plain Text
弹出 SignMessageModal
展示 Hello DApp
确认后返回真实 signature
```



---



## 10\.2 personal\_sign Hex



```TypeScript
await ethereum.request({
  method: 'personal_sign',
  params: ['0x48656c6c6f', address],
});
```



期望：



```Plain Text
解析 Hex
展示 Hello
返回 signature
```



---



## 10\.3 eth\_sign 高危提示



```TypeScript
await ethereum.request({
  method: 'eth_sign',
  params: [address, '0x48656c6c6f'],
});
```



期望：



```Plain Text
弹出高危提示
riskReasons 包含 ETH_SIGN_IS_HIGH_RISK
```



---



## 10\.4 eth\_signTypedData\_v4



```TypeScript
await ethereum.request({
  method: 'eth_signTypedData_v4',
  params: [address, JSON.stringify(typedData)],
});
```



期望：



```Plain Text
弹出 SignTypedDataModal
展示 domain
展示 primaryType
展示 message
chainId mismatch 时高危提示
```



---



## 10\.5 Permit 风险



TypedData 包含：



```Plain Text
Permit
spender
value
deadline
```



期望：



```Plain Text
riskReasons 包含 TYPED_DATA_PERMIT_APPROVAL
```



---



## 10\.6 Permit2 风险



期望：



```Plain Text
riskReasons 包含 TYPED_DATA_PERMIT2_APPROVAL
riskLevel = critical
```



---



# 11\. 交易测试



## 11\.1 Native Transfer



```TypeScript
await ethereum.request({
  method: 'eth_sendTransaction',
  params: [
    {
      from: address,
      to: recipient,
      value: '0x2386f26fc10000',
      data: '0x'
    }
  ]
});
```



期望：



```Plain Text
解析为 native_transfer
展示 recipient
展示 value
展示 gas
用户确认后广播
返回 txHash
```



---



## 11\.2 ERC20 transfer



Calldata selector：



```Plain Text
0xa9059cbb
```



期望：



```Plain Text
解析为 erc20_transfer
展示 tokenAddress
展示 recipient
展示 amount
```



---



## 11\.3 ERC20 approve



Selector：



```Plain Text
0x095ea7b3
```



期望：



```Plain Text
解析 spender
解析 amount
展示 Token 授权
```



---



## 11\.4 无限授权



Amount：



```Plain Text
0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
```



期望：



```Plain Text
riskLevel = critical
warnings 包含 UNLIMITED_ERC20_APPROVAL
```



---



## 11\.5 NFT approve



Selector：



```Plain Text
0x095ea7b3
```



期望：



```Plain Text
解析 spender
解析 tokenId
展示 NFT 授权
```



---



## 11\.6 setApprovalForAll



Selector：



```Plain Text
0xa22cb465
```



期望：



```Plain Text
riskLevel = critical
warnings 包含 NFT_APPROVAL_FOR_ALL
```



---



## 11\.7 Swap



常见 selector：



```Plain Text
0x38ed1739
0x7ff36ab5
0x414bf389
```



期望：



```Plain Text
解析为 swap
riskLevel 至少 medium
展示 Swap 交易
```



---



## 11\.8 Bridge



期望：



```Plain Text
解析为 bridge 或 contract_interaction
riskLevel high
展示跨链/聚合调用风险
```



---



## 11\.9 用户拒绝交易



期望：



```JSON
{
  "code": 4001,
  "message": "User rejected transaction"
}
```



---



## 11\.10 广播失败



例如 RPC 返回：



```JSON
{
  "code": -32000,
  "message": "insufficient funds"
}
```



期望：



```Plain Text
DApp 收到标准 RPC error
审计记录 dapp.tx.failed
```



---



# 12\. 黑名单和反钓鱼测试



## 12\.1 黑名单域名



配置：



```Plain Text
fake-uniswap.com -> block
```



访问：



```Plain Text
https://fake-uniswap.com
```



期望：



```Plain Text
WebView 阻断
记录 security.url.blocked
Admin 可查询
```



---



## 12\.2 Homograph 域名



访问：



```Plain Text
https://unіswap.org
```



其中 `і` 是非 ASCII 字符。



期望：



```Plain Text
阻断或高危提示
reasons 包含 POSSIBLE_HOMOGRAPH_ATTACK
```



---



## 12\.3 可疑关键词



访问：



```Plain Text
https://claim-free-airdrop.xyz
```



期望：



```Plain Text
warn 或 block
reasons 包含 SUSPICIOUS_KEYWORD / SUSPICIOUS_TLD
```



---



## 12\.4 黑名单合约



交易目标：



```Plain Text
0x000000000000000000000000000000000000dead
```



期望：



```Plain Text
交易阻断
TransactionConfirmModal 不允许确认
审计 dapp.tx.blocked
安全事件 contract_blocked
```



---



# 13\. WalletConnect 联调



## 13\.1 Pairing



输入：



```Plain Text
wc:xxxx@2?relay-protocol=irn&symKey=...
```



期望：



```Plain Text
成功触发 session_proposal
弹出 WalletConnectProposalModal
```



---



## 13\.2 Approve Session



确认后：



```Plain Text
外部 DApp 显示 connected
本地保存 session
Admin 可查 session
```



---



## 13\.3 Reject Session



拒绝后：



```Plain Text
外部 DApp 显示 rejected
本地不保存 session
审计 walletconnect.session.rejected
```



---



## 13\.4 WalletConnect personal\_sign



期望：



```Plain Text
复用 SignMessageModal
确认后返回 signature
```



---



## 13\.5 WalletConnect eth\_sendTransaction



期望：



```Plain Text
复用 TransactionConfirmModal
走风险解析
确认后广播
返回 txHash
```



---



## 13\.6 WalletConnect 断开



App 断开：



```Plain Text
对端收到 session_delete
本地 session 标记 deleted
```



---



## 13\.7 WalletConnect 黑名单 Peer



Peer URL 命中黑名单：



```Plain Text
session_proposal 自动 reject
写 security.walletconnect.blocked
```



---



# 14\. DApp 首页生态测试



## 14\.1 首页加载



期望展示：



```Plain Text
搜索框
精选推荐
分类
收藏
最近访问
热门 DApp
```



---



## 14\.2 搜索



搜索：



```Plain Text
uniswap
swap
app.uniswap.org
```



期望：



```Plain Text
正确返回 Uniswap
排序合理
blocked DApp 默认不展示
```



---



## 14\.3 分类



点击：



```Plain Text
DEX
NFT
Lending
Bridge
```



期望：



```Plain Text
仅展示对应分类
```



---



## 14\.4 收藏



步骤：



```Plain Text
收藏 Uniswap
重进首页
```



期望：



```Plain Text
我的收藏出现 Uniswap
可取消收藏
```



---



## 14\.5 最近访问



打开 DApp 后：



```Plain Text
最近访问记录更新
同 origin 去重
按 visitedAt 倒序
```



---



# 15\. Admin 后台验收



## 15\.1 DApp Registry 管理



必须支持：



```Plain Text
新增 DApp
编辑 DApp
隐藏 DApp
封禁 DApp
恢复 DApp
设置 featured
设置 riskLevel
```



验收：



```Plain Text
blocked DApp 用户端不可打开
hidden DApp 用户端不展示
featured DApp 首页展示
```



---



## 15\.2 Security Rule 管理



必须支持：



```Plain Text
新增域名黑名单
新增域名警告
新增合约黑名单
新增合约警告
删除规则
禁用规则
```



验收：



```Plain Text
规则生效无需发版
命中规则写安全事件
```



---



## 15\.3 Session 管理



必须支持：



```Plain Text
查询 DApp Session
按 userId 查询
按 origin 查询
撤销单个 session
撤销某 origin 下所有 session
```



验收：



```Plain Text
撤销后 WebView accountsChanged []
DApp eth_accounts 返回 []
```



---



## 15\.4 WalletConnect 管理



必须支持：



```Plain Text
查询 active sessions
断开 session
查看 peer 信息
查看 methods / chains
```



---



## 15\.5 Audit 查询



必须支持筛选：



```Plain Text
action
result
source
hostname
userId
address
chainId
method
riskLevel
time range
```



---



# 16\. 性能测试



## 16\.1 WebView 启动性能



目标：



```Plain Text
WebView 首屏 P95  Secure WebView
  -> EIP-1193 Provider
  -> Permission Session
  -> Signing
  -> Transaction
  -> Wallet Core
  -> WalletConnect
  -> Security Engine
  -> Audit / Metrics
  -> Admin Control
```



这已经不是“WebView 打网页”，而是一个完整的：



```Plain Text
Web3 Runtime + Wallet Gateway + Security Sandbox + DApp Operating Platform
```



后续如果继续扩展，建议进入：



```Plain Text
Part 14：Solana / Tron / BTC 多链 Provider
Part 15：交易模拟资产变化解析
Part 16：授权管理与一键 revoke
Part 17：DApp 风险评分与社区举报系统
Part 18：浏览器多 Tab / 书签 / 密码填充 / 隐私模式
```



