# ZS Exchange 生产上线与上链就绪审计报告

审计日期：2026-06-28  
审计范围：会员注册、认证会话、DID 身份、Solana 上链、钱包/管理 API、H5 DID 展示、类型检查、健康检查、依赖安全、生产配置。

## 总结裁决

结论：当前项目不达标生产上线，也不达标主网上链生产标准。

明确回答：

1. 会员注册是否已经上链：否。注册接口只创建 `CoreUser`、签发 token、创建 session，没有创建 DID，也没有任何链上交易调用。
2. DID 身份是否已经上链：默认否。`/api/v1/did/solana/create` 只是本地生成 `did:sol` 与 Keypair；`/api/v1/did/solana/anchor` 才可能发 Solana Memo 交易，但它未与会员注册绑定，未鉴权，支持模拟模式，且默认 devnet。
3. 是否达到上线/上链生产标准：否。存在明文私钥、默认 JWT secret、未鉴权 DID 私钥返回、全量类型检查失败、Next.js critical 漏洞、DID/Solana 模块大量类型错误、管理接口权限错误等 P0 阻断。

## P0 阻断问题

### P0-01 DID 创建接口未鉴权并返回私钥

证据：
- `src/app/api/v1/did/solana/create/route.ts:7` 直接暴露 `POST`，没有 `requireAuth`。
- `src/app/api/v1/did/solana/create/route.ts:14-19` 返回 `privateKey`。
- `src/modules/did-identity/core/methods/did-sol.service.ts:97-104` 将 `keypair.secretKey` base58 编码后返回。

影响：
- 任意调用者可以生成 DID 并拿到私钥。
- 生产系统不应通过普通 API 明文返回用户或系统私钥。
- 这不是托管钱包、MPC、KMS 或一次性密钥领取模型。

整改要求：
- DID 创建必须鉴权，绑定 `ctx.userId`。
- 私钥不得进入 API 响应；应写入 KMS/MPC/keyRef，返回 DID、publicKey、keyRef。
- 创建记录必须落库，包含 userId、did、method、chain、status、anchorTx、createdAt。

### P0-02 会员注册未绑定 DID，也没有上链事务

证据：
- `src/app/api/v1/auth/[action]/route.ts:28-70` 注册只校验用户名/邮箱/密码，并调用 `userRepository.create`。
- `src/app/api/v1/auth/[action]/route.ts:72-85` 注册后只签发 token 并创建 session。
- `prisma/schema.prisma:17-48` `CoreUser` 模型没有 DID 字段或 DID 关系。

影响：
- 会员注册不是链上身份注册。
- DID 页面、DID API、会员系统是分离的，没有真实业务闭环。

整改要求：
- 注册后异步或同步创建 DID 记录。
- 明确策略：注册即创建 DID，还是 KYC 后创建 DID。
- DID 创建、VC 签发、钱包绑定、链上锚定需要事务状态机。

### P0-03 DID 锚定接口未鉴权并要求客户端提交私钥

证据：
- `src/app/api/v1/did/solana/anchor/route.ts:5` 暴露 `POST`，没有 `requireAuth`。
- `src/app/api/v1/did/solana/anchor/route.ts:8-17` 从请求体读取 `did` 和 `privateKey` 后直接锚定。
- `src/modules/did-identity/core/methods/did-sol.service.ts:179-204` 用请求传入私钥恢复 Keypair。

影响：
- 客户端传私钥到服务器是高危设计。
- 任意用户可请求服务端用任意私钥发交易。
- 没有所有权校验、用户绑定、nonce、防重放、审计状态。

整改要求：
- 私钥签名必须由托管 KMS/MPC 或用户端钱包签名完成。
- 服务端 anchor 只接受 keyRef 或已签名 payload。
- 必须校验 DID 属于当前用户。

### P0-04 DID 默认 devnet，模拟模式会返回假 txHash

证据：
- `src/modules/did-identity/core/methods/did-sol.service.ts:36-43` 未传参数时默认使用 `devnet`。
- `src/modules/did-identity/core/methods/did-sol.service.ts:184-195` `simulate` 模式直接返回 mock txHash/slot。
- `src/modules/did-identity/core/methods/did-sol.service.ts:291-297` Explorer URL 固定 `cluster=devnet`。

影响：
- 不能证明 DID 已在主网上链。
- 模拟数据可能被误当作链上交易。

整改要求：
- 生产环境强制 `mainnet-beta` 或显式生产链配置。
- API 响应必须区分 `simulated`、`submitted`、`confirmed`、`finalized`。
- 生产禁用模拟模式。

### P0-05 仓库包含明文 Solana 私钥

证据：
- `scripts/create-token.ts:6` 写死了 base58 私钥字符串。

影响：
- 该密钥应视为已泄露。
- 任何使用过该密钥的钱包、mint authority、metadata authority 都不可信。

整改要求：
- 立即轮换该私钥控制的所有资产/权限。
- 删除明文，改用环境变量、KMS 或本地未提交密钥文件。
- 加入 secret scanning 与提交前拦截。

### P0-06 JWT 存在生产默认兜底密钥

证据：
- `src/lib/auth/jwt.ts:20-25` `JWT_SECRET` 和 `JWT_REFRESH_SECRET` 缺失时使用 `change-in-production` 风格默认值。

影响：
- 生产环境变量缺失时，token 可被低成本伪造。
- `verifyToken` 未设置 issuer/audience 约束。

整改要求：
- 生产启动时缺少 JWT secret 必须 fail fast。
- 使用 256 bit 以上随机 secret，并配置 issuer/audience/jti。
- refresh token 需支持轮换、撤销、设备绑定。

### P0-07 全量类型检查失败，且集中在 DID/Solana/DApp 模块

证据：
- `npm run type-check:full` 失败。
- 失败文件包含 `src/modules/did-identity/**`、`src/lib/wallet/chains/solana-adapter.ts`、`src/lib/wallet/key/solana-signer.ts`、DApp Browser 和 DID 页面。

影响：
- 上链关键模块不具备类型可靠性。
- 构建过程无法作为生产质量门禁。

整改要求：
- 生产分支必须全量 `tsc -p tsconfig.json --noEmit` 通过。
- 禁止只依赖 P0 子集类型检查作为上线门槛。

### P0-08 Solana 私钥派生格式与签名器期望不一致

证据：
- `src/lib/wallet/key/key.service.ts:214-222` Solana 派生返回 hex 私钥。
- `src/lib/wallet/key/solana-signer.ts:13`、`29` 使用 `bs58.decode(privateKey)` 恢复 `Keypair.fromSecretKey`。

影响：
- 真实签名链路可能失败或产生不可用签名。
- 资产出链签名不可作为生产能力验收。

整改要求：
- 统一 Solana 私钥格式：64-byte secretKey base58，或明确 seed 到 Keypair 的转换。
- 增加真实签名、验签、交易模拟、devnet 广播集成测试。

### P0-09 `/api/v1/wallet/admin/*` 只有普通用户鉴权，没有管理员鉴权

证据：
- `src/app/api/v1/wallet/admin/deposits/route.ts:7-8` 使用 `requireAuth`。
- `src/app/api/v1/wallet/admin/withdrawals/route.ts:7-8` 使用 `requireAuth`。
- 对照 `src/lib/api/middleware.ts:108-117` 项目已有 `withAdminAuth`。

影响：
- 任意登录用户可能访问管理侧充提记录。
- 这属于资金域权限边界错误。

整改要求：
- 所有 `/admin` 语义接口必须使用 `withAdminAuth` 或等价 RBAC。
- 加入权限矩阵测试。

### P0-10 依赖审计存在 critical/high 漏洞

证据：
- `npm audit --audit-level=high --registry=https://registry.npmjs.org` 结果：68 vulnerabilities，4 critical，31 high。
- 包含 Next.js critical、form-data high、ws high、bigint-buffer high、xlsx high 等。

影响：
- 不允许生产上线，特别是 Next.js App Router/Server Actions/缓存/SSRF/DoS 相关安全公告。

整改要求：
- 升级 Next.js、React 相关生态、Solana/WalletConnect 依赖。
- 无修复项需要替换依赖或隔离使用面。

## P1 高风险问题

### P1-01 API Key 创建接口可能返回 secret hash

证据：
- `src/app/api/v1/user/api-keys/route.ts:40-55` 返回 `{ ...created, secretKey }`。
- `src/repositories/api-key.repository.ts:18-21` 查询会返回完整 Prisma payload。

影响：
- 创建结果可能包含数据库中的 `secretKey` 哈希字段，同时又返回明文一次性 secret，响应结构混淆。

整改要求：
- API Key 响应 DTO 必须显式白名单字段。
- 列表接口不得返回 secret/hash。

### P1-02 `CoreSession` 模型与 auth 代码不一致

证据：
- `prisma/schema.prisma:50-62` `CoreSession` 没有 `status` 字段。
- `src/app/api/v1/auth/[action]/route.ts:187` 读取 `session.status`。
- `src/app/api/v1/auth/[action]/route.ts:223` 更新 `{ status: 'revoked' }`。

影响：
- refresh/logout 可能运行时报错或撤销失效。
- 会话安全不可控。

整改要求：
- 给 `CoreSession` 加 status 字段并迁移，或改用 delete/revoke table。
- refresh token 必须可撤销、可轮换、可审计。

### P1-03 管理后台开发环境可直接签发 dev-admin

证据：
- `src/app/api/admin/auth/login/route.ts:16-34` 非生产任意用户名密码均签发 `dev-admin` token。
- `src/lib/api/auth.ts:32-38` 非生产接受 `dev-admin` 绕过数据库。

影响：
- 如果环境变量或部署模式错误，管理权限会被直接打开。

整改要求：
- 开发绕过必须由显式 `ALLOW_DEV_ADMIN_LOGIN=true` 控制，默认关闭。
- 启动时打印高危警告，生产强制禁止。

### P1-04 H5 DID 身份页仍为 mock 数据

证据：
- `src/app/h5/profile/did-identity/page.tsx:39-47` 使用 `mockUserDID`。
- `src/app/h5/profile/did-identity/page.tsx:49-68` 使用 `mockBoundWallets`。
- `src/app/h5/profile/did-identity/page.tsx:70-85` 使用 `mockCredentials`。

影响：
- H5 展示不能证明用户 DID、钱包绑定、VC 凭证真实存在。

整改要求：
- 对接真实 `/api/v1/user/did`、`/api/v1/did/*`、VC、wallet binding API。
- 前端显示链上状态和 tx explorer 必须来自后端状态。

### P1-05 安全响应头未配置

证据：
- `next.config.js:1-36` 没有 `headers()` 配置 CSP、HSTS、X-Frame-Options、Permissions-Policy 等。

影响：
- 交易所类系统无法通过基础 Web 安全基线。

整改要求：
- 增加生产安全头。
- CSP 需要覆盖 H5、管理后台、钱包连接、第三方支付域。

## 已通过或部分可用项

1. `npm run type-check:p0` 通过。
2. `npm run test:p0` 通过，1 个测试文件、3 个测试通过。
3. `npm run health:routes` 通过，扫描到 76 个 API route，P0 required routes 未缺失。
4. `npm run health:p0` 通过，本地 `http://localhost:3200` 能跑通注册、现货撮合、余额、充值入账、资金划转等 P0 闭环。
5. MoonPay/Alchemy webhook 有签名校验入口，但业务入账仍有注释占位，需要进一步验收真实闭环。

## 上线门禁建议

生产上线前必须同时满足：

1. `npm run type-check:full` 通过。
2. `npm audit --audit-level=high` 无 critical/high，或有正式风险接受单。
3. DID 创建、解析、锚定、VC、钱包绑定全链路落库且绑定用户。
4. 私钥不得出现在源码、日志、API 响应、前端状态。
5. 注册到 DID 的业务状态机明确，并有失败重试和补偿机制。
6. Solana 主网/测试网配置环境隔离，生产禁用 simulate。
7. admin API 全部 RBAC 校验。
8. 会话撤销、refresh token 轮换、2FA、KYC 风控上线。
9. H5 DID 页面全部换成真实 API 数据。
10. 所有资金域 API 有审计日志、幂等键、权限校验、余额不变量测试。

