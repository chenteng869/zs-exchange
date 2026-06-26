# 推送通知服务（Push Notification）— L-01 / L-02 / L-03

> 萨摩亚交易所（SMY Exchange）移动端推送子系统的统一实现。  
> 覆盖三大推送厂商：FCM（Google）、APNs（Apple）、HMS（华为），提供统一 API + 业务编排层。

---

## 1. 模块结构

```
src/lib/notification/
├── push/
│   ├── types.ts            # 公共类型 + 常量 + 平台→provider 映射
│   ├── fcm-client.ts       # FCM HTTP v1 API 客户端（OAuth 2.0 + RS256 JWT）
│   ├── apns-client.ts      # APNs HTTP/2 客户端（ES256 JWT 自实现）
│   ├── hms-client.ts       # HMS 推送客户端（OAuth 2.0 client_credentials）
│   ├── push-service.ts     # 业务编排层（设备注册 / 路由 / 批量 / 统计）
│   └── README.md           # 本文档
├── ...
└── index.ts                # 统一出口（已挂载 push/* 全部导出）

tests/push-service.test.ts  # 单元测试（22 个用例，全绿）
```

### 1.1 架构图

```
                       ┌────────────────────────────┐
                       │  应用层（auth / trade）     │
                       └──────────────┬─────────────┘
                                      │  sendToUser / sendToUsers
                                      │  sendBroadcast / registerDevice
                                      ▼
                       ┌────────────────────────────┐
                       │      PushService           │  业务编排层
                       │  - 设备 token 注册表       │  - 自动按 platform 选 provider
                       │  - 批量分片 (PUSH_BATCH)   │  - 失效 token 自动清理
                       │  - 统计 / 事件总线         │  - FCM → APNs 降级
                       └──────────────┬─────────────┘
                                      │
                ┌─────────────────────┼─────────────────────┐
                ▼                     ▼                     ▼
        ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
        │  FcmClient   │      │  ApnsClient  │      │  HmsClient   │
        │  (L-01)      │      │  (L-02)      │      │  (L-03)      │
        │  HTTP v1     │      │  HTTP/2      │      │  HTTP        │
        │  + OAuth 2.0 │      │  + ES256 JWT │      │  + OAuth 2.0 │
        └──────┬───────┘      └──────┬───────┘      └──────┬───────┘
               ▼                     ▼                     ▼
        fcm.googleapis.com    api.push.apple.com   push-api.cloud.huawei.com
```

---

## 2. 三家厂商接入指引

### 2.1 FCM（Firebase Cloud Messaging）— L-01

**适用**：Android + iOS（iOS 默认 FCM，可降级到 APNs）

**前置申请**：
1. 登录 [Firebase Console](https://console.firebase.google.com/)
2. 新建项目（例如 `smy-exchange-prod`），记下 **Project ID**
3. 进入「项目设置 → 服务账号」→ 点击「生成新的私钥」→ 下载 JSON
4. JSON 包含：
   - `project_id`
   - `client_email` （形如 `firebase-adminsdk-xxx@xxx.iam.gserviceaccount.com`）
   - `private_key` （RSA 私钥 PEM）

**配置**：
```ts
const fcm = createFcmClient({
  projectId: 'smy-exchange-prod',
  serviceAccount: {
    project_id: 'smy-exchange-prod',
    client_email: 'firebase-adminsdk-xxx@smy-exchange-prod.iam.gserviceaccount.com',
    private_key: process.env.FCM_PRIVATE_KEY!, // 完整 PEM，含 BEGIN/END
  },
  maxRetries: 3,
  backoffBaseMs: 400,
});
```

**客户端集成**（Android / iOS）：
- Android: `FirebaseMessaging.getInstance().getToken()`
- iOS: 同上，AppDelegate.m 注册 `[FIRApp configure]`

---

### 2.2 APNs（Apple Push Notification service）— L-02

**适用**：iOS

**前置申请**：
1. 登录 [Apple Developer](https://developer.apple.com/account)
2. 「Certificates, Identifiers & Profiles」→ 「Keys」→ 新建 APNs Key
3. 记下 **Key ID**（10 字符）和 **Team ID**（10 字符）
4. 下载 `.p8` 私钥文件（仅显示一次）
5. 创建 App ID，记下 **Bundle ID**（例如 `com.smy.exchange`）

**配置**：
```ts
const apns = createApnsClient({
  teamId: 'ABCDE12345',
  keyId: 'FGHIJ67890',
  privateKey: process.env.APNS_P8_KEY!, // PEM 格式 EC P-256 私钥
  bundleId: 'com.smy.exchange',
  production: false, // 开发阶段用 false（sandbox）
});
```

**客户端集成**（iOS）：
- AppDelegate.m 注册 `[[UIApplication sharedApplication] registerForRemoteNotifications]`
- 通过 `application:didRegisterForRemoteNotificationsWithDeviceToken:` 拿到 deviceToken

---

### 2.3 HMS（华为推送）— L-03

**适用**：华为 Android

**前置申请**：
1. 登录 [华为开发者联盟](https://developer.huawei.com/consumer/cn/)
2. 「AppGallery Connect」→ 新建应用
3. 「我的项目」→ 选中项目 → 「项目设置」→ 记下 **App ID** 和 **App Secret**
4. 「推送服务」→ 开启推送，配置 SHA256 证书指纹

**配置**：
```ts
const hms = createHmsClient({
  appId: '100xxxxx',
  appSecret: 'hms-app-secret-xxx',
  maxRetries: 3,
});
```

**客户端集成**（Android）：
- `Maven` 依赖 `com.huawei.hms:push:6.x.x`
- `HmsMessaging.getInstance().getToken()` 拿到 token

---

## 3. 完整调用示例

### 3.1 装配 PushService

```ts
import { createPushService, createFcmClient, createApnsClient, createHmsClient } from '@/lib/notification';

const fcm = createFcmClient({
  projectId: process.env.FCM_PROJECT_ID!,
  serviceAccount: {
    project_id: process.env.FCM_PROJECT_ID!,
    client_email: process.env.FCM_CLIENT_EMAIL!,
    private_key: process.env.FCM_PRIVATE_KEY!,
  },
});

const apns = createApnsClient({
  teamId: process.env.APNS_TEAM_ID!,
  keyId: process.env.APNS_KEY_ID!,
  privateKey: process.env.APNS_P8_KEY!,
  bundleId: 'com.smy.exchange',
  production: process.env.NODE_ENV === 'production',
});

const hms = createHmsClient({
  appId: process.env.HMS_APP_ID!,
  appSecret: process.env.HMS_APP_SECRET!,
});

export const pushService = createPushService({ fcm, apns, hms });
```

### 3.2 设备注册（用户登录后 / App 启动时）

```ts
// App 端调用服务端
await fetch('/api/push/register', {
  method: 'POST',
  body: JSON.stringify({
    token: 'cMeH...xxxx',            // 厂商返回的 device token
    platform: 'android',              // 'android' | 'ios' | 'harmony' | 'web'
    appVersion: '2.0.0',
    deviceModel: 'Huawei Mate 60 Pro',
    locale: 'zh-CN',
    timezone: 'Asia/Shanghai',
  }),
});

// 服务端
pushService.registerDevice(userId, {
  token, platform, appVersion, deviceModel, locale, timezone,
});
```

### 3.3 发送单条推送（价格告警）

```ts
const results = await pushService.sendToUser('user-123', {
  title: 'BTC 突破 100,000 USDT',
  body: '当前价 $100,150.00（24h +3.2%）',
  data: {
    type: 'price-alert',
    pair: 'BTCUSDT',
    price: '100150.00',
    url: '/trade/BTCUSDT',
  },
  badge: 5,
  sound: 'default',
  priority: 'high',
  ttlSeconds: 3600,
  collapseKey: 'price-BTCUSDT',
  imageUrl: 'https://cdn.smy.com/charts/btc.png',
  clickAction: '/trade/BTCUSDT',
});

console.log(results);
// [
//   { messageId: 'apns-msg-1', provider: 'APNS', status: 'success', ... },
//   { messageId: 'FCM-MOCK-1', provider: 'FCM', status: 'success', ... }
// ]
```

### 3.4 批量推送（提现成功通知）

```ts
const userIds = await db.withdrawals.findUsersForCompletedWithdrawals();
const results = await pushService.sendToUsers(userIds, {
  title: '提现成功',
  body: '您的 1.5 BTC 已成功提现至 1A1zP1...',
  data: { type: 'withdrawal-success', txHash: '0xabc...' },
  ttlSeconds: 86400,
});

console.log(`推送完成：成功 ${results.filter(r => r.status === 'success').length} / 失败 ${results.filter(r => r.status === 'failed').length}`);
```

### 3.5 广播（系统公告）

```ts
await pushService.sendBroadcast({
  title: '系统维护通知',
  body: '平台将于 2026-07-01 02:00-04:00 (UTC+8) 进行例行维护',
  data: { type: 'system-notice', maintenanceId: 'm-20260701' },
  priority: 'high',
});
```

### 3.6 清理失效 token

```ts
// 自动：PushService.sendToUser 检测到 invalid_token 时自动调用 invalidateToken
// 手动：清理某个用户的所有设备
for (const d of pushService.getUserDevices(userId)) {
  pushService.invalidateToken(d.token);
}
```

### 3.7 统计

```ts
const stats = pushService.getStats();
console.log(`
  总推送: ${stats.totalSent}
  成功: ${stats.successCount}
  失败: ${stats.failureCount}
  成功率: ${(stats.successCount / stats.totalSent * 100).toFixed(2)}%
  FCM:   ${stats.byProvider.FCM.sent} (${stats.byProvider.FCM.success} 成功)
  APNs:  ${stats.byProvider.APNS.sent} (${stats.byProvider.APNS.success} 成功)
  HMS:   ${stats.byProvider.HMS.sent} (${stats.byProvider.HMS.success} 成功)
`);
```

### 3.8 事件订阅

```ts
const unsubscribe = pushService.onPushSent((event) => {
  if (event.type === 'sent') {
    analytics.track('push_sent', { userId: event.userId, results: event.results });
  } else if (event.type === 'invalidated') {
    db.devices.delete({ token: event.token }); // 同步清理 DB
  }
});

// 取消订阅
unsubscribe();
```

---

## 4. 错误码对照表

### 4.1 FCM 错误

| 错误码 / 状态 | 含义 | 处理 |
|---|---|---|
| `UNREGISTERED` | 设备 token 失效 | 清理 token |
| `INVALID_ARGUMENT` | token 格式错误 | 清理 token |
| `SENDER_ID_MISMATCH` | token 与 project 不匹配 | 清理 token |
| `QUOTA_EXCEEDED` | 配额超限 | 退避重试 |
| `UNAVAILABLE` | 服务不可用 | 退避重试 |
| 5xx | 临时错误 | 退避重试 |
| 4xx 其他 | 业务错误 | 立即失败 |

### 4.2 APNs 错误

| 状态码 + reason | 含义 | 处理 |
|---|---|---|
| `410 Unregistered` | 用户卸载 App / 关闭通知 | 清理 token |
| `400 BadDeviceToken` | token 非法 | 清理 token |
| `400 DeviceTokenNotForTopic` | token 与 bundleId 不匹配 | 清理 token |
| `429 TooManyRequests` | 限流 | 退避重试 |
| 5xx | 临时错误 | 退避重试 |
| 403 ExpiredProviderToken | JWT 过期 | 清除 JWT 缓存 |

### 4.3 HMS 错误

| 业务码 | 含义 | 处理 |
|---|---|---|
| `80000000` | 成功 | 成功 |
| `80100000` | 系统级限流 | 退避重试 |
| `80100001` | 应用级限流 | 退避重试 |
| `80300002` | 设备 token 失效 | 清理 token |
| `80300007` | 设备 token 非法 | 清理 token |
| `80300008` | 设备不属于该应用 | 清理 token |
| 5xx | 临时错误 | 退避重试 |

---

## 5. 设备 token 清理策略

### 5.1 被动清理（自动）
- `PushService.sendToUser` 检测到 `status === 'invalid_token'` 时，自动调用 `invalidateToken(token)` 从内存表删除
- 推荐：在 `onPushSent` 事件处理器中同步删除 DB 记录

### 5.2 主动清理（手动）
```ts
// 1. 用户登出
pushService.invalidateDevice(userId, deviceToken);

// 2. 批量清理某个用户
for (const d of pushService.getUserDevices(userId)) {
  pushService.invalidateToken(d.token);
}

// 3. 整个 service 重置（不要在生产用）
pushService.reset();
```

### 5.3 定期清理（建议每日 cron）
```ts
// 验证所有 token 仍有效
for (const [userId, devices] of deviceMap) {
  for (const d of devices) {
    const valid = await fcm.validateToken(d.token);
    if (!valid) pushService.invalidateToken(d.token);
  }
}
```

---

## 6. 关键常量

```ts
PUSH_DEFAULT_TTL_SECONDS = 86_400        // 24h
PUSH_DEFAULT_PRIORITY    = 'normal'
PUSH_BATCH_SIZE          = 500           // 批量推送分片阈值
APNS_JWT_CACHE_TTL_MS    = 55 * 60_000  // 55 min
FCM_TOKEN_CACHE_TTL_MS   = 55 * 60_000
HMS_TOKEN_CACHE_TTL_MS   = 55 * 60_000
```

---

## 7. 测试覆盖（22 个用例，全绿）

```
✓ FcmClient: 发送成功（OAuth + Bearer + JSON body）
✓ FcmClient: 5xx 触发指数退避重试
✓ FcmClient: UNREGISTERED → invalid_token
✓ FcmClient: sendToTopic / sendToCondition
✓ ApnsClient: 发送成功（ES256 JWT + apns-topic header）
✓ ApnsClient: 410 Gone → invalid_token
✓ ApnsClient: 429 限流重试
✓ ApnsClient: JWT 头部 / 载荷 / 签名格式正确
✓ HmsClient: 发送成功（OAuth + Bearer + JSON body）
✓ HmsClient: refreshToken 主动清除缓存
✓ HmsClient: 80100000 限流重试
✓ PushService: registerDevice / unregisterDevice
✓ PushService: sendToUser 按 platform 选 provider
✓ PushService: sendToUser 多设备并发
✓ PushService: sendBroadcast 走 FCM + HMS topic
✓ PushService: getStats 统计
✓ PushService: 未配置 client 时自动 mock
✓ PushService: iOS FCM 失败时降级到 APNs
✓ PushService: sendToUser 返回 invalid_token 时自动清理
✓ derToJose: DER → JOSE 签名转换
✓ PushService: sendToUsers 批量
✓ PushService: onPushSent 事件总线
```

运行：
```bash
npx tsx tests/push-service.test.ts
```

---

## 8. 安全 & 凭据管理

| 凭据 | 存储 | 建议 |
|---|---|---|
| FCM service account | 环境变量或 KMS | 定期轮换（建议 90 天） |
| APNs .p8 key | 环境变量或 KMS | 永不轮换（Apple 允许） |
| HMS app secret | 环境变量或 KMS | 定期轮换 |
| 设备 token | 数据库（加密） | 失效立即清理 |

**永远不要** 把上述凭据 commit 到 Git，建议：
- 使用 `.env.local`（已加入 `.gitignore`）
- 生产环境用 K8s Secret + External Secrets Operator
- CI/CD 用临时凭据，build 完成后立即销毁
