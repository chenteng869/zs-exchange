# KYC 模块 - 阿里云 OCR + 活体检测

> **任务 J-01** | 完整 KYC 流程：身份证 OCR → 人脸活体 → 实名核验 → 状态机 → 加密存储

## 目录

- [模块组成](#模块组成)
- [完整 KYC 流程图](#完整-kyc-流程图)
- [阿里云 API 申请指引](#阿里云-api-申请指引)
- [数据加密存储](#数据加密存储)
- [合规要求](#合规要求)
- [失败重试策略](#失败重试策略)
- [使用示例](#使用示例)
- [测试覆盖](#测试覆盖)

---

## 模块组成

| 文件 | 职责 |
|---|---|
| `alicloud-ocr.ts` | 身份证 OCR 识别（face / back），含重试 + mock 降级 |
| `alicloud-face.ts` | 人脸活体检测（视频 / 静默），含评分与风险等级 |
| `kyc-service.ts` | KYC 业务服务（状态机 + 加密存储 + 步骤追踪） |
| `crypto.ts` | PII 加密（AES-256-GCM）+ 脱敏工具 |
| `verifier.ts` | 已有：身份证 / 手机 / 邮箱 / 银行卡校验 |
| `workflow.ts` | 已有：Lv.1~3 审核工作流 |
| `limits.ts` | 已有：等级限额配置 |
| `index.ts` | 统一导出 |

---

## 完整 KYC 流程图

```
                          ┌──────────────┐
                          │ not_started  │
                          └──────┬───────┘
                                 │ startKyc(userId, type)
                                 ▼
                          ┌──────────────┐
              ┌──────────│ in_progress  │──────────┐
              │           └──────┬───────┘           │
              │ submitIdCard      │                 │
              │ (OCR 失败)        │ submitIdCard     │
              │                  │ (OCR 通过)        │
              ▼                  ▼                  │
       ┌─────────────┐    ┌──────────────┐          │
       │  rejected   │    │ ocr=passed   │          │
       │ steps.ocr   │    │ steps.doc    │          │
       │  =failed    │    │  =passed     │          │
       └─────────────┘    └──────┬───────┘          │
                                │ submitFaceVideo  │
                                │ / submitFacePhoto│
                                ▼                  │
                       ┌──────────────────┐        │
                       │ face=passed      │        │
                       │ → pending_review │        │
                       └────────┬─────────┘        │
                                │                  │
                ┌───────────────┼──────────────┐   │
                │ approve       │ reject       │   │
                ▼               ▼              │   │
         ┌─────────────┐ ┌─────────────┐      │   │
         │  approved   │ │  rejected   │      │   │
         │  (终态)     │ │  (终态)     │      │   │
         └──────┬──────┘ └──────┬──────┘      │   │
                │ 5 年留存到期  │              │   │
                ▼               └──────────────┘   │
         ┌─────────────┐                            │
         │  expired    │  ◀── 用户重新认证 ────────┘
         │  (可重激活)  │
         └─────────────┘
```

### 步骤状态机（独立追踪）

```
ocr / face / document:

pending ──调用成功──▶ passed
   │                    │
   │ 失败               │ (业务校验失败)
   ▼                    ▼
failed                failed
```

---

## 阿里云 API 申请指引

### 1. 注册阿里云账号

- 访问 https://www.aliyun.com/ 注册企业 / 个人账号
- 完成实名认证

### 2. 购买 / 开通云市场 API

#### (a) 身份证识别（cmapi020020）

- 商品页：https://market.aliyun.com/products/57124001/cmapi020020.html
- 选择套餐（按 QPS / 调用量计费）
- 开通后获得 **APPCODE**（32 位左右字符串）

#### (b) 人脸活体检测（cmapi027343）

- 商品页：https://market.aliyun.com/products/57000002/cmapi027343.html
- 选择套餐（视频活体通常按次计费）
- 开通后获得 **APPCODE**（独立于 OCR 的 APPCODE）

### 3. 配置环境变量

```bash
# .env.production
ALIYUN_OCR_APPCODE=your_ocr_appcode_here
ALIYUN_FACE_APPCODE=your_face_appcode_here
KYC_PII_KEY=$(openssl rand -base64 32)  # 32 字节随机密钥
```

> ⚠️ **KYC_PII_KEY** 必须 ≥ 32 字节，生产环境强烈建议从 AWS KMS / Aliyun KMS / Vault 动态获取，禁止硬编码或入代码库。

### 4. 端点配置

默认端点：

```ts
// OCR
https://idcard.market.alicloudapi.com/ocr/idcard

// 人脸活体
https://face-verification.market.alicloudapi.com/verify
```

如阿里云分配了专属 host，可在 `AliCloudOcrConfig.endpoint` / `AliCloudFaceConfig.endpoint` 中覆盖。

### 5. 演示降级

- 当 `appCode` 为空时，自动进入 **mock 模式**
- mock 模式下：
  - OCR 返回预设的身份证字段
  - 人脸活体默认通过（`similarity=0.93, liveness=0.97, riskLevel=low`）
  - URL 包含 `fail` / `attack` → 失败
  - URL 包含 `medium` / `borderline` → 中等风险
  - URL 包含 `low` → OCR 低置信度
  - URL 包含 `expired` → OCR 身份证号校验失败

---

## 数据加密存储

### 算法

- **AES-256-GCM**（认证加密）
  - 256 bit 密钥（32 字节）
  - 96 bit IV（12 字节，每次随机）
  - 128 bit 认证标签（16 字节）

### 存储格式

```
base64url(IV ‖ ciphertext ‖ authTag)
```

- IV：12 字节
- ciphertext：原文长度的密文
- authTag：16 字节

### 加密字段

| 字段 | 是否加密 | 说明 |
|---|---|---|
| `idNumber` | ✅ AES-256-GCM | 身份证号（高敏感） |
| `name` | ✅ AES-256-GCM | 姓名（高敏感） |
| `faceImageUrl` | ❌ | OSS 已签名授权 URL |
| `backImageUrl` | ❌ | OSS 已签名授权 URL |
| `videoUrl` | ❌ | OSS 已签名授权 URL |
| `birthDate` | ❌ | 明文（用于展示） |
| `validDate` | ❌ | 明文（用于展示） |
| `idNumberMasked` | ❌ | 脱敏后（用于列表展示） |

### 使用

```ts
import { encryptPII, decryptPII, maskIdNumber, maskName } from '@/lib/kyc/crypto';

const enc = encryptPII('110101199003073116', process.env.KYC_PII_KEY!);
const dec = decryptPII(enc, process.env.KYC_PII_KEY!);
const masked = maskIdNumber('110101199003073116'); // "110101********3116"
const maskedName = maskName('欧阳娜娜');            // "欧**娜"
```

### 浏览器端（Web Crypto）

```ts
import { encryptPIIAsync, decryptPIIAsync } from '@/lib/kyc/crypto';

const enc = await encryptPIIAsync(plain, key);
const dec = await decryptPIIAsync(enc, key);
```

---

## 合规要求

### 5 年留存

```ts
export const KYC_DATA_RETENTION_DAYS = 1825; // 5 年
```

- 申请记录 `expiresAt = createdAt + 1825 天`
- 留存到期后状态变更为 `expired`
- 加密的 PII 仍保留 5 年以备审计
- 超过留存期后应触发数据删除 / 匿名化

### 用户授权

- 用户提交 KYC 申请时必须勾选《隐私协议》+《KYC 授权书》
- 授权记录（用户 ID、授权时间、IP、协议版本）需单独存档
- 用户可随时申请导出 / 删除个人数据（GDPR / 个保法）

### 审计日志

- 所有 PII 解密操作必须记录审计日志
- `inspectEncryptedPayload()` 可解析密文结构（IV / ciphertext / authTag），用于调试
- 原始 API 响应保存在 `rawResponse` 字段（仅在内存 / 数据库加密列中存储）

### 跨境传输

- 身份证 OCR + 人脸活体均通过 HTTPS 上传
- 阿里云市场 API 默认部署在阿里云华东 / 华北节点
- 如需境外节点，需额外申请并配置 endpoint

---

## 失败重试策略

### OCR / 人脸活体 API

```
最多 3 次重试（可配置）
退避策略：指数退避（base × 2^attempt）
  - 默认 base = 500ms
  - 1st retry: 500ms 后
  - 2nd retry: 1000ms 后
  - 3rd retry: 2000ms 后
单次请求超时：10s (OCR) / 15s (活体)
```

| 错误类型 | 是否重试 |
|---|---|
| 5xx 服务器错误 | ✅ 重试 |
| 网络超时 / 连接失败 | ✅ 重试 |
| 4xx 客户端错误 | ❌ 不重试（直接抛业务错误） |
| 401 / 403 鉴权失败 | ❌ 不重试 |
| 业务错误（`code != 200`） | ❌ 不重试 |

### 业务层失败

| 场景 | 处理 |
|---|---|
| OCR 置信度 < 0.7 | `rejected`，`rejectReason = "OCR 置信度过低"` |
| OCR 身份证号校验失败 | `rejected`，`rejectReason = "OCR 身份证号格式错误"` |
| 活体 `similarity < 0.8` | `rejected`，`rejectReason = "活体检测未通过"` |
| 活体 `livenessScore < 0.85` | `rejected`，`rejectReason = "活体检测未通过"` |

### 降级策略

- 阿里云不可用时（网络故障 / 账户欠费 / 鉴权失败），**不进入 mock 模式**（业务真实性优先）
- 上层业务应捕获 `KycError` 并提示用户稍后重试
- 监控指标：调用成功率、平均耗时、置信度分布

---

## 使用示例

### 1. 基础集成（Node.js 后端）

```ts
import { KycService } from '@/lib/kyc';

const kycService = new KycService({
  ocrConfig: {
    appCode: process.env.ALIYUN_OCR_APPCODE!,
    timeoutMs: 10000,
    retries: 3,
  },
  faceConfig: {
    appCode: process.env.ALIYUN_FACE_APPCODE!,
    timeoutMs: 15000,
    retries: 3,
  },
  piiKey: process.env.KYC_PII_KEY!,
});

// 1. 启动申请
const app = await kycService.startKyc('user-123', 'basic');

// 2. 用户上传身份证 → 调用 submitIdCard
const afterOcr = await kycService.submitIdCard(
  'user-123',
  app.id,
  'https://oss.example.com/uploads/front.jpg',
  'https://oss.example.com/uploads/back.jpg',
);

// 3. 用户录制活体视频 → 调用 submitFaceVideo
const afterFace = await kycService.submitFaceVideo(
  'user-123',
  app.id,
  'https://oss.example.com/uploads/liveness.mp4',
);

// 4. 人工审核
const approved = await kycService.approveApplication(app.id, 'admin-001', '合规通过');

// 5. 查询用户状态
const status = await kycService.getUserStatus('user-123'); // 'approved'
```

### 2. 高级 KYC（photo + 视频 双活体）

```ts
const app = await kycService.startKyc('user-456', 'advanced');
await kycService.submitIdCard('user-456', app.id, frontUrl, backUrl);
await kycService.submitFacePhoto('user-456', app.id, photoUrl);   // 静默活体
await kycService.submitFaceVideo('user-456', app.id, videoUrl);   // 视频活体
await kycService.approveApplication(app.id, 'admin-001');
```

### 3. 审核员操作

```ts
// 列出待审核
const pending = await kycService.listPendingApplications();

// 通过
await kycService.approveApplication(appId, 'admin-001', 'OK');

// 拒绝
await kycService.rejectApplication(appId, 'admin-001', '身份证与本人不符');
```

### 4. 脱敏展示

```ts
import { maskIdNumber, maskName } from '@/lib/kyc/crypto';

// 在管理后台展示
display.idNumber = maskIdNumber('110101199003073116');  // "110101********3116"
display.name = maskName('欧阳娜娜');                    // "欧**娜"
```

### 5. 自定义存储（生产环境）

```ts
import { KycService } from '@/lib/kyc';

const kycService = new KycService({
  ocrConfig: { appCode: '...' },
  faceConfig: { appCode: '...' },
  store: {
    get: async (id) => await db.kycApplication.findUnique({ where: { id } }),
    set: async (app) => await db.kycApplication.upsert({ where: { id: app.id }, create: app, update: app }),
    list: async (filter) => await db.kycApplication.findMany({ where: filter }),
    delete: async (id) => await db.kycApplication.delete({ where: { id } }),
  },
});
```

---

## 测试覆盖

测试文件：`tests/kyc-service.test.ts`

| 编号 | 测试用例 | 覆盖点 |
|---|---|---|
| 1 | OCR 解析 face / back | mock 模式下字段映射 |
| 2 | OCR 错误重试 | 5xx 重试 / 4xx 不重试 / 重试耗尽 |
| 3 | 人脸活体（视频 + 静默） | mock 通过场景 |
| 4 | 活体检测失败处理 | mock fail / 评分函数 |
| 5 | `startKyc` | 创建新申请 / 拒绝重启已 approved |
| 6 | `submitIdCard` | OCR → 加密 → 步骤更新 |
| 7 | `submitFaceVideo` | 强制先 OCR → 评分 → 状态流转 |
| 8 | `approve / reject` | 步骤完整 / 拒绝原因必填 |
| 9 | 加密 / 解密 PII | 对称性 / IV 随机 / 篡改检测 |
| 10 | 脱敏显示 | idNumber / name / phone / email / bankCard |
| ➕ | 集成测试 | 完整 KYC happy path |

运行：

```bash
npx tsx --test tests/kyc-service.test.ts
```

或通过全量运行器：

```bash
npx tsx tests/run-all.ts
```

---

## 风险与注意事项

1. **密钥管理**：KYC_PII_KEY 一旦泄露，**所有历史 PII 都有解密风险**。建议：
   - 使用 KMS 动态派生（master key + per-app salt）
   - 每 90 天轮换一次
   - 旧 key 只解密不再加密

2. **API 限流**：阿里云市场 API 默认 QPS 限制较低，建议：
   - 业务侧加 token bucket
   - 监控 429 状态码
   - 高峰期启用排队

3. **活体降级到人工**：当阿里云活体 API 长期不可用时：
   - 不进入自动通过
   - 申请状态停留在 `in_progress`
   - 监控告警 → 切换到人工审核流程

4. **数据导出 / 删除**：
   - 需提供 `exportUserKyc(userId)` 接口（GDPR / 个保法要求）
   - 需提供 `deleteUserKyc(userId)` 接口（数据可携权）
   - 删除时**保留审计日志 5 年**（不可删除）

5. **多语言 / 国际化**：
   - 身份证号仅支持中国大陆 18 位
   - 国际护照 / 港澳通行证需扩展 `KycType` 和 OCR 接口
