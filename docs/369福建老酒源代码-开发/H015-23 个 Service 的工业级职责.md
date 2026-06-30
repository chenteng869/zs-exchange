# H015\-23 个 Service 的工业级职责

# 

## Identity Service 用户与身份服务

负责：

```Plain Text
code复制代码
用户注册
用户登录
用户资料
用户状态
钱包绑定
推荐关系基础绑定
用户设备记录
会员等级基础
```

不负责：

```Plain Text
code复制代码
KYC 审核
积分
订单
奖励
财务
```

---

## KYC Service 合规身份服务

负责：

```Plain Text
code复制代码
个人 KYC
企业 KYB
证件资料
审核流程
第三方 KYC 回调
地区合规状态
身份有效期
```

---

## Product Service 商品服务

负责：

```Plain Text
code复制代码
福建老酒 369 商品
AEP 算力包
商品权益配置
商品版本
商品上下架
商品地区规则
商品库存
商品规则绑定
```

---

## Order Service 订单服务

负责：

```Plain Text
code复制代码
订单创建
订单状态机
订单明细
订单取消
订单确认
订单履约任务触发
订单事件发布
```

---

## Payment Service 支付服务

负责：

```Plain Text
code复制代码
支付单
支付回调
USDT 支付
银行卡 / 第三方支付扩展
支付幂等
tx_hash 校验
退款申请
退款执行
```

---

## Revenue Service 收入分配服务

负责：

```Plain Text
code复制代码
369 USD 40 / 30 / 30 分账
AEP 分账
分账规则读取
分账记录
分账冲销
分账池统计
```

---

## Points Service 积分服务

负责：

```Plain Text
code复制代码
FJ369 Points 权益值
cFJ369 贡献积分
积分发放
积分撤销
积分冻结
积分过期
积分规则
```

---

## Tradable Points Service tFJ369 服务

负责：

```Plain Text
code复制代码
cFJ369 转 tFJ369
转换比例
手续费
手续费分配
tFJ369 锁定
tFJ369 内部交易
交易风控
```

---

## NFT Service NFT 权益服务

负责：

```Plain Text
code复制代码
WinePass NFT
Eco Power Pass NFT
Club NFT
NFT 签发
NFT 升级
NFT 冻结
NFT 撤销
NFT 链上状态同步
```

---

## Eco Power Service 生态算力服务

负责：

```Plain Text
code复制代码
算力账户
算力流水
算力规则
算力计算
算力冻结
算力快照
会员倍率
风控系数
```

---

## Release Service 释放服务

负责：

```Plain Text
code复制代码
释放池
释放额度
释放计算
用户领取
Merkle Root
链上领取状态
释放风控
```

---

## Referral Service 推荐奖励服务

负责：

```Plain Text
code复制代码
推荐人 10% 奖励
推荐关系校验
推荐奖励锁定
推荐奖励审核
推荐奖励结算
推荐奖励追回
```

---

## Team Reward Service 团队奖励服务

负责：

```Plain Text
code复制代码
团队 5 / 3 / 2 奖励
团队关系
服务记录
团队奖励审核
团队奖励结算
团队奖励追回
```

---

## Node Service 节点服务

负责：

```Plain Text
code复制代码
城市节点
区域节点
国家节点
全球节点
节点 KYB
节点区域
节点协议
节点服务记录
节点奖励 3 / 3 / 2 / 2
```

---

## DAppX Mall Service 商城服务

负责：

```Plain Text
code复制代码
商城商品
商户入驻
商城订单
组合支付
积分 / Token / 优惠券消费
商户结算
商城风控
```

---

## Finance Service 财务账本服务

负责：

```Plain Text
code复制代码
财务流水
收入确认
成本池
市场池
公司池
奖励计提
结算单
退款冲销
财务追踪
```

---

## Tax Service 税务服务

负责：

```Plain Text
code复制代码
税务规则
税务记录
佣金税
VAT / GST / 销售税
税务报表
税务支付状态
```

---

## Risk Service 风控服务

负责：

```Plain Text
code复制代码
风险规则
风险评分
风控事件
风控案件
黑名单
设备指纹
资产冻结建议
奖励追回建议
```

---

## Approval Service 审批服务

负责：

```Plain Text
code复制代码
审批申请
审批步骤
多级审批
审批执行
审批权限
高危操作审批
```

---

## Audit Service 审计服务

负责：

```Plain Text
code复制代码
审计日志
操作日志
对象生命周期追踪
审计导出
后台操作留痕
```

---

## Blockchain Service 链上服务

负责：

```Plain Text
code复制代码
FJ369 Token 合约
tFJ369 合约
NFT 合约
Release Claim 合约
链上交易
链上事件监听
金库钱包
链上链下对账
```

---

## Notification Service 通知服务

负责：

```Plain Text
code复制代码
站内信
邮件
短信
Telegram / WhatsApp 扩展
KYC 通知
订单通知
奖励通知
风控通知
审批通知
```

---

## Reporting Service 报表服务

负责：

```Plain Text
code复制代码
销售报表
财务报表
税务报表
积分报表
奖励报表
节点报表
风控报表
链上对账报表
报表导出
```

---

# 但代

