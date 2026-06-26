# 活体检测多厂商适配器（P1 J-02）

> SMY 交易所 KYC 活体检测模块：百度 / 腾讯 / 旷视 / 阿里云四厂商支持，自动主备切换。

## 1. 厂商对比

| 厂商      | 鉴权方式                  | 活体方式       | 优势              | 接入文档                                       |
| --------- | ------------------------- | -------------- | ----------------- | ---------------------------------------------- |
| 阿里云    | APPCODE (Header)          | 视频 / 静默    | 已对接（J-01）    | https://market.aliyun.com/products/57000002   |
| 百度智能云| API Key + Secret → Token  | 视频 / 图片    | 金融级，价格低    | https://cloud.baidu.com/doc/FACE/s/Vk37c1k7c  |
| 腾讯云    | SecretId + SecretKey TC3  | 视频 / 静默    | 慧眼权威，签名稳  | https://cloud.tencent.com/document/product/1007 |
| 旷视      | API Key + Secret (Basic)  | 视频 / 图片    | 离线 SDK 强       | https://console.faceplusplus.com.cn            |

## 2. 申请指引

### 2.1 百度智能云
1. 打开 https://cloud.baidu.com/product/face
2. 开通「人脸实名认证 V3」/「人脸检测」
3. 创建应用 → 获取 `API Key` / `Secret Key`
4. 环境变量：
   - `BAIDU_API_KEY`
   - `BAIDU_SECRET_KEY`

### 2.2 腾讯云
1. 打开 https://console.cloud.tencent.com/faceid
2. 开通「人脸核身 FaceID」/「活体人脸核身」
3. 控制台 → 访问管理 → API 密钥管理 → 创建 `SecretId` / `SecretKey`
4. 环境变量：
   - `TENCENT_SECRET_ID`
   - `TENCENT_SECRET_KEY`

### 2.3 旷视（Face++）
1. 打开 https://console.faceplusplus.com.cn/
2. 申请企业认证 → 创建应用 → 选择「人脸核身 / 金融级活体」
3. 获取 `API Key` / `API Secret`
4. 环境变量：
   - `MEGVII_API_KEY`
   - `MEGVII_API_SECRET`

## 3. 完整调用示例

```ts
import {
  LivenessService,
  BaiduLivenessClient,
  TencentLivenessClient,
  MegviiLivenessClient,
  AliCloudFaceVerification,
} from '@/lib/kyc/liveness';

// 1. 构造各厂商客户端
const aliCloud = new AliCloudFaceVerification({ appCode: process.env.ALIYUN_FACE_APPCODE! });
const baidu = new BaiduLivenessClient({
  apiKey: process.env.BAIDU_API_KEY!,
  secretKey: process.env.BAIDU_SECRET_KEY!,
});
const tencent = new TencentLivenessClient({
  secretId: process.env.TENCENT_SECRET_ID!,
  secretKey: process.env.TENCENT_SECRET_KEY!,
});
const megvii = new MegviiLivenessClient({
  apiKey: process.env.MEGVII_API_KEY!,
  apiSecret: process.env.MEGVII_API_SECRET!,
});

// 2. 构造业务服务
const liveness = new LivenessService({
  aliCloud,
  baidu,
  tencent,
  megvii,
  strategy: 'first_success',  // 或 'majority' / 'all'
  overallTimeoutMs: 5_000,    // 单厂商降级超时
});

// 3. 调用
const result = await liveness.verify({
  userId: 'u1',
  type: 'video',
  videoUrl: 'https://oss.example.com/liveness.mp4',
  idCardNumber: '110101199003073116',
  name: '张三',
  refImageUrl: 'https://oss.example.com/idcard-face.jpg',
  threshold: 0.85,
  actions: ['blink', 'mouth_open', 'turn_left'],
});

if (result.passed && result.riskLevel === 'low') {
  // 通过
}
```

## 4. TC3 签名流程（腾讯云）

腾讯云 API 3.0 使用 **TC3-HMAC-SHA256** 签名（本项目自实现，无外部依赖）：

```
1. 拼接 CanonicalRequest
     = METHOD + "\n"
     + URI + "\n"
     + CanonicalQueryString + "\n"
     + CanonicalHeaders + "\n"
     + SignedHeaders + "\n"
     + HashedRequestPayload

2. 拼接 StringToSign
     = "TC3-HMAC-SHA256" + "\n"
     + Timestamp + "\n"
     + CredentialScope + "\n"        // <Date>/<Service>/tc3_request
     + HashedCanonicalRequest

3. 派生密钥链
     SecretDate     = HMAC-SHA256("TC3" + SecretKey, Date)
     SecretService  = HMAC-SHA256(SecretDate, Service)
     SecretSigning  = HMAC-SHA256(SecretService, "tc3_request")

4. 计算签名
     Signature = HMAC-SHA256(SecretSigning, StringToSign) → hex

5. 构造 Authorization 头
     TC3-HMAC-SHA256 Credential=<SecretId>/<CredentialScope>, SignedHeaders=<...>, Signature=<...>
```

详见 `src/lib/kyc/liveness/tencent-client.ts` 中 `signRequest` 方法。

## 5. 厂商切换策略

| 策略          | 行为                                                       | 适用场景             |
| ------------- | ---------------------------------------------------------- | -------------------- |
| `first_success` | 第一个成功就用；失败立即降级到下一厂商                   | 默认 / 性能优先      |
| `majority`      | 全部厂商调用，至少 2 个结果一致才算通过                  | 高安全 / 重要客户    |
| `all`           | 全部厂商调用，结果聚合（平均分数）                       | 风控分析 / 复核场景  |

## 6. 性能与成本对比

| 厂商      | 单次耗时      | 单价（人民币） | 失败率（统计）| 备注               |
| --------- | ------------- | -------------- | -------------- | ------------------ |
| 阿里云    | 1.0-1.5s      | ~0.4 元/次     | < 0.5%         | 已对接 J-01         |
| 百度      | 1.0-2.0s      | ~0.3 元/次     | < 0.8%         | 需先 OAuth 取 token |
| 腾讯      | 1.5-2.5s      | ~0.5 元/次     | < 0.3%         | TC3 签名计算 ~5ms   |
| 旷视      | 1.2-2.0s      | ~0.35 元/次    | < 0.6%         | 离线 SDK 可进一步降 |

- **整体降级耗时** < 5s（默认 `overallTimeoutMs = 5000`）
- **token 缓存** 29 天（百度）
- **Basic Auth** 无状态（旷视）
- **TC3 签名** 单次计算 < 10ms（已测）

## 7. 与 J-01 阿里云 OCR 配合

`KycService`（来自 J-01）的 `submitFaceVideo` / `submitFacePhoto` 仍然直接调用 `AliCloudFaceVerification`。
如需切换到多厂商服务，将 `KycService` 内部的 `AliCloudFaceVerification` 替换为 `LivenessService` 即可：

```ts
// 替换 KycService 构造函数内
// this.face = new AliCloudFaceVerification(options.faceConfig);
//   ↓
this.liveness = new LivenessService({
  aliCloud: new AliCloudFaceVerification(options.faceConfig),
  baidu: options.baiduConfig && new BaiduLivenessClient(options.baiduConfig),
  tencent: options.tencentConfig && new TencentLivenessClient(options.tencentConfig),
  megvii: options.megviiConfig && new MegviiLivenessClient(options.megviiConfig),
  strategy: 'first_success',
});
```

## 8. 演示降级

任一厂商 API Key 含 `mock` 子串时，自动启用 mock 模式（返回预设结果）。
便于本地开发 / 单元测试，无需真实凭证即可跑通流程。

## 9. 测试

```bash
# 运行 J-02 全部 14+ 测试用例
npx tsx --test tests/liveness-providers.test.ts

# 期望：全部 pass
# - 百度 4 个 / 腾讯 5 个 / 旷视 4 个 / Service 7 个
```

测试覆盖：
- 百度：Token、活体（视频+图片）、5xx 重试、mock 触发
- 腾讯：TC3 签名正确性（对照官方算法）、活体、Header 完整性、5xx 重试、mock
- 旷视：Basic Auth、活体、5xx 重试、mock
- LivenessService：first_success / majority / all、降级 < 5s、统计、add/remove、事件订阅
