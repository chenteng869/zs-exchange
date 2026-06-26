# 福建老酒分润智能合约

基于 4/3/3 分润模型的链上自动分润系统。

## 分润模型

### 总体分配比例（4/3/3）

每瓶售价严格按照 **40% / 30% / 30%** 固定比例分配：

| 分配项 | 比例 | 说明 |
|--------|------|------|
| 产品成本 | 40% | 产品本体、包装、仓储、物流、损耗、基础运营 |
| AIOPC 创业家大宗提成 | 30% | 一线销售、渠道拓展、区域复制、企业订单 |
| 剩余分润池 | 30% | 平台运营、技术、商学院、推荐奖励等 |

### 剩余分润池详细分配（7 角色）

| 角色 | 占剩余分润池比例 | 说明 |
|------|----------------|------|
| 中萨合资公司 | ~45.45% | 主体运营、合规、品牌 |
| 海外加密资产公司 | ~19.09% | 跨境结算、加密资产通道 |
| AIOPC 创业家商学院事业部 | ~10.91% | 培训、话术、SOP 输出 |
| 太初国链技术团队 | ~10.91% | 系统开发、维护、迭代 |
| 各个事业部运营事业部 | ~7.27% | 日常运营、客服、活动 |
| AIOPC 创业家事务部 | ~3.64% | 渠道协调、事务处理 |
| AIOPC 创业家推荐人 | ~2.73% | 推荐奖励、裂变激励 |

### 369 美元单瓶分润明细

| 分配项 | 比例 | 金额（USDC） |
|--------|------|-------------|
| 产品成本 | 40% | $147.60 |
| AIOPC 创业家大宗提成 | 30% | $110.70 |
| 剩余分润池合计 | 30% | $110.70 |
| - 中萨合资公司 | - | $50.32 |
| - 海外加密资产公司 | - | $21.13 |
| - 商学院事业部 | - | $12.08 |
| - 技术团队 | - | $12.08 |
| - 运营事业部 | - | $8.04 |
| - 事务部 | - | $4.03 |
| - 推荐人 | - | $3.02 |

### 699 美元单瓶分润明细

执行同样的 40/30/30 规则，金额按比例放大。

## 合约接口

### 核心方法

```solidity
// 创建订单并执行分润
function createOrder(address referrer, uint256 priceTier) external payable returns (uint256)

// 查询分润明细（纯计算，不上链）
function getProfitBreakdown(uint256 priceTier) external pure returns (...)

// 获取用户订单
function getUserOrders(address user, uint256 offset, uint256 limit) external view returns (Order[] memory)

// 查询地址累计收益
function totalEarned(address) external view returns (uint256)
```

### 管理方法（仅 Owner）

```solidity
// 设置各角色钱包地址
function setProductCostWallet(address _wallet)
function setAiopcCommissionWallet(address _wallet)
function setZsVentureWallet(address _wallet)
function setOverseasCryptoWallet(address _wallet)
function setBusinessSchoolWallet(address _wallet)
function setTechTeamWallet(address _wallet)
function setOperationsWallet(address _wallet)
function setAffairsDeptWallet(address _wallet)

// 转移所有权
function transferOwnership(address newOwner)

// 紧急提取（异常情况用）
function emergencyWithdraw()
```

### 事件

```solidity
event OrderCreated(uint256 orderId, address buyer, address referrer, uint256 priceTier, uint256 timestamp)
event ProfitDistributed(uint256 orderId, uint256 productCost, uint256 aiopcCommission, uint256 profitPoolTotal, uint256 timestamp)
event RoleShareDistributed(uint256 orderId, address wallet, string role, uint256 amount)
event WalletUpdated(string role, address oldWallet, address newWallet)
```

## 部署

### 环境变量

```bash
PRIVATE_KEY=0x...           # 部署账户私钥
RPC_URL=https://...         # RPC 节点 URL

# 各角色钱包地址（部署时传入）
PRODUCT_COST_WALLET=0x...
AIOPC_COMMISSION_WALLET=0x...
ZS_VENTURE_WALLET=0x...
OVERSEAS_CRYPTO_WALLET=0x...
BUSINESS_SCHOOL_WALLET=0x...
TECH_TEAM_WALLET=0x...
OPERATIONS_WALLET=0x...
AFFAIRS_DEPT_WALLET=0x...
```

### 部署命令

```bash
npx tsx scripts/deploy-fujian-wine.ts
```

## 分润执行原则

1. **成交即记录** — 下单即进入分润计算队列，链上留痕
2. **订单即归属** — 渠道归属和推荐关系绑定，不可篡改
3. **分润即计算** — 智能合约自动按比例拆分，实时到账
4. **结算即留痕** — 每笔分润可追溯、可审计，链上可查
5. **异常即审核** — 异常订单通过 Owner 权限人工复核

## 安全注意事项

- 所有分润比例为常量，不可修改，确保制度透明
- 无推荐人时，推荐人奖励自动归入事务部
- Owner 仅可修改钱包地址，不可修改分润比例
- 紧急提取功能仅用于异常情况，正常分润走 createOrder
- 建议使用多签钱包作为 Owner
