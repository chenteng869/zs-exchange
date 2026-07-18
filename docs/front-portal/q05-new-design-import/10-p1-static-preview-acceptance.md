# Q05-FrontPortal-P1-Static-Preview-Portal — 验收归档

> 任务编号：Q05-FrontPortal-P1-Acceptance-Archive
> 归档日期：2026-07-18
> 归档人：Trae (MiniMax-M3)
> 验证者：用户本人
> 状态：**验收通过，可冻结**

---

## 一、验收结论

```
Q05-FrontPortal-P1-Static-Preview-Portal：验收通过。
状态：可冻结。
建议：先做 P1 验收归档文档，再单独 commit。
暂不 push，除非确认远端策略。
```

- **Q05-FrontPortal-P1-Static-Preview-Portal 验收通过**
- **状态：可冻结**
- **未 commit，未 push**

---

## 二、基线信息

| 项 | 值 |
|----|----|
| **HEAD（commit）** | `afa6c9debca704e1fd7ae177ae50a81bd7a974f4` |
| **HEAD 短哈希** | `afa6c9d…4f4` |
| **HEAD 提交信息** | `feat(q04-3.12.b2.1): realify 3 admin pages with adminFetch` |
| **当前分支** | `main` |
| **本任务 P1 提交状态** | **未 commit** |
| **本任务 P1 push 状态** | **未 push** |
| **P1 文件 git 状态** | `??` 未跟踪新增文件 |

### 当前 dirty 分布（git status --short 节选）

```
?? src/app/portal-preview/
?? src/components/portal-preview/
```

- `src/app/portal-preview/` 与 `src/components/portal-preview/` 为本任务 P1 新增，未跟踪
- historical dirty（425+ 项 M/D）**不属于本次 P1**，未触碰，未清理
- total dirty 由 425 → 447（+22 为本次新增的 portal-preview 文件与目录节点）

---

## 三、交付范围 — 10 个新路由

| # | 路由 | 对应资产 | 性质 |
|---|------|---------|------|
| 1 | `/portal-preview` | Stitch `_1` | 桌面端首页（亮色改造） |
| 2 | `/portal-preview/mobile` | Stitch `h5_11` | H5 移动端预览（480px 容器） |
| 3 | `/portal-preview/about` | Stitch `_10` | 关于我们 |
| 4 | `/portal-preview/announcements` | Stitch `_8` | 公告中心 |
| 5 | `/portal-preview/fees` | Stitch `_9` | 费率说明 |
| 6 | `/portal-preview/risk` | Stitch `_15` | 风险提示 |
| 7 | `/portal-preview/kyc-guide` | Stitch `_16` | KYC 教学 |
| 8 | `/portal-preview/institution` | Stitch `_12` | 机构服务 |
| 9 | `/portal-preview/discover` | Stitch `_24` | 发现中心 |
| 10 | `/portal-preview/spot-guide` | Stitch `_17` | 现货交易教学 |

> 全部位于 `/portal-preview/**` 隔离前缀下，未影响 `/` 既有路由。

---

## 四、新增文件范围

### 4.1 路由与布局（11 个）

```
src/app/portal-preview/layout.tsx
src/app/portal-preview/page.tsx
src/app/portal-preview/mobile/page.tsx
src/app/portal-preview/about/page.tsx
src/app/portal-preview/announcements/page.tsx
src/app/portal-preview/fees/page.tsx
src/app/portal-preview/risk/page.tsx
src/app/portal-preview/kyc-guide/page.tsx
src/app/portal-preview/institution/page.tsx
src/app/portal-preview/discover/page.tsx
src/app/portal-preview/spot-guide/page.tsx
```

### 4.2 共享组件（20 个）

```
src/components/portal-preview/brand.ts
src/components/portal-preview/PortalHeader.tsx
src/components/portal-preview/PortalFooter.tsx
src/components/portal-preview/PortalStatusBadge.tsx
src/components/portal-preview/PortalEmptyState.tsx
src/components/portal-preview/PortalSection.tsx
src/components/portal-preview/PortalHero.tsx
src/components/portal-preview/PortalMarketPreview.tsx
src/components/portal-preview/PortalProductMatrix.tsx
src/components/portal-preview/PortalAnnouncementEntry.tsx
src/components/portal-preview/PortalAnnouncementList.tsx
src/components/portal-preview/PortalFeeSection.tsx
src/components/portal-preview/PortalRiskNotice.tsx
src/components/portal-preview/PortalKycGuide.tsx
src/components/portal-preview/PortalInstitutionSection.tsx
src/components/portal-preview/PortalDiscoverSection.tsx
src/components/portal-preview/PortalSpotGuide.tsx
src/components/portal-preview/PortalAboutSection.tsx
src/components/portal-preview/PortalMobileHero.tsx
src/components/portal-preview/PortalMobileBottomTabs.tsx
```

### 4.3 验收归档（本文件）

```
docs/front-portal/q05-new-design-import/10-p1-static-preview-acceptance.md
```

---

## 五、验收确认（明确未触碰清单）

| 项 | 状态 | 备注 |
|----|------|------|
| `/` 既有首页 | **未触碰** | `src/app/page.tsx`、`src/app/HomepageContent.tsx` 维持原状 |
| APP | **未触碰** | `src/app/h5/**` 110+ 路由全部保留 |
| Admin | **未触碰** | `src/app/admin/**` 全部维持现状 |
| 数据库 | **未触碰** | 无 schema 变更、无 seed 变更、无 Prisma 文件变更 |
| middleware | **未触碰** | `src/middleware.ts` 未改 |
| API | **未新增** | `src/app/api/**` 未新增任何 route |
| 真实行情 | **未接** | 行情区所有数字均显示「数据接入中」 |
| 真实资产 | **未接** | 资产视图仅为静态占位 |
| 真实交易 | **未接** | 教学页标注"不进入真实交易" |
| 真实 KYC / KYB | **未接** | 教学页标注"不进行真实 KYC 提交" |
| 未确认数字 | **已清理** | 详见第六节 |
| commit | **未执行** | 等待用户确认后单独 commit |
| push | **未执行** | 远端策略未定 |

---

## 六、数据与文案修正记录

> 本次 P1 严格遵循"未确认的具体数字不应作为页面固定展示"的硬约束。
> 初版存在如下可能被误读为"真实运营数据"的内容，已在验收前全部修正。

| # | 位置 | 修改前 | 修改后 |
|---|------|--------|--------|
| 1 | 首页「平台数据」 | `注册用户: 10万+` | `注册用户: 数据接入中` |
| 2 | 首页「平台数据」 | `储备金率: 106.3%` | `储备金率: 数据接入中` |
| 3 | 关于我们 大事记 | `2025.11 正式用户突破 10 万，月成交额突破 50 亿美金` | `2025.11 平台进入公测阶段，启动内测用户招募` |
| 4 | 费率说明 表头 | `现货 Maker / Taker / 合约 Maker / Taker` | `现货 Maker（示例）/ Taker（示例）/ 合约 Maker（示例）/ Taker（示例）` |
| 5 | 费率说明 底部 | `费率以最终下单页为准` | `以上为示例费率结构 · 实际费率以最终下单页为准` |
| 6 | 费率说明 Lv.1 权益 | `每日 100 BTC 等值提现额度` | `示例：每日提现额度` |
| 7 | 费率说明 Lv.2 权益 | `每日 200 BTC 等值提现额度` + `API 频率 10/秒` | `示例：更高提现额度` + `API 频率更高` |
| 8 | 费率说明 Lv.3 权益 | `每日 500 BTC 等值提现额度` + `API 频率 20/秒` | `示例：机构级提现额度` + `API 频率更高` |
| 9 | 费率说明 机构做市商 | `API 频率 50/秒+` | `API 频率更高` |
| 10 | KYC 教学 Lv.1 限额 | `单日提现 ≤ 2 BTC 等值` | `示例限额（单日提现）` |
| 11 | KYC 教学 Lv.2 限额 | `单日提现 ≤ 50 BTC 等值` | `示例限额（单日提现）` |
| 12 | 机构服务 OTC 描述 | `单笔最低 50 BTC 等值` | `单笔门槛以实际咨询为准` |
| 13 | 产品矩阵 永续合约 | `最高 100x 杠杆` | `支持杠杆交易（最高杠杆以实际页面为准）` |
| 14 | 现货教学 充值提示 | `支持链：Ethereum / BSC / Polygon / Conflux` | `支持链：Ethereum / BSC / Polygon / Conflux（以页面显示为准）` |
| 15 | 现货教学 提现提示 | `链上确认通常需要 1-30 分钟` | `链上确认时间因链而异（通常 1-30 分钟）` |
| 16 | 发现中心 研报 | `42 页 / 28 页 / 36 页` | 统一为 `示例页数` |

> 共修正 16 处。所有改动仅涉及占位文案替换，未触碰布局、交互、品牌色、组件结构。

### 保留为项目品牌文案的非具体数字

| 项 | 状态 | 说明 |
|----|------|------|
| `DSAEX-2024-001 / DSAST-2024-002` 牌照号 | **保留** | 已在 `src/lib/constants.ts` 与既有 `src/app/page.tsx` 中作为项目品牌文案沿用 |
| `萨摩亚 MSA` 监管方 | **保留** | 项目既有品牌定位 |
| `7×24` 在线客服 | **保留** | 通用服务承诺，非具体数据 |

---

## 七、TypeScript 校验

### 7.1 临时校验配置

```json
// tsconfig.portal-check.json（仅用于本次 P1 局部类型检查，校验后删除）
{
  "extends": "./tsconfig.json",
  "include": [
    "src/components/portal-preview/**/*",
    "src/app/portal-preview/**/*"
  ],
  "exclude": [
    "node_modules",
    ".next",
    "src/lib/**",
    "src/app/api/**",
    "src/app/admin/**",
    "src/app/h5/**",
    "src/app/auth/**",
    "src/app/user/**",
    "src/app/business/**",
    "src/app/dashboard/**",
    "src/app/download/**",
    "src/app/finance/**",
    "src/app/ido/**",
    "src/app/licenses/**",
    "src/app/markets/**",
    "src/app/portal/**",
    "src/app/register/**",
    "src/app/shop/**",
    "src/app/trade/**"
  ]
}
```

### 7.2 校验命令与结果

```bash
$ npx tsc -p tsconfig.portal-check.json --noEmit --pretty false
$ echo $?
0
```

**结果：`exit 0, no errors`**

> 临时 `tsconfig.portal-check.json` 已在校验完成后删除，未污染版本控制。

---

## 八、未实现范围（P1 明确不做）

> 以下内容明确不在 P1 范围内，避免后续误以为"已完成"。

| 模块 | 状态 | 备注 |
|------|------|------|
| 真实行情接入 | ❌ 未做 | 行情区均为「数据接入中」占位 |
| 真实公告 CMS | ❌ 未做 | 公告仅静态展示 4 类目 10 条 |
| 真实 KYC 提交流程 | ❌ 未做 | 教学页标注"不进行真实提交" |
| 真实 KYB 机构认证 | ❌ 未做 | 教学页标注"不进行真实提交" |
| 真实现货下单 | ❌ 未做 | 教学页标注"不进入真实交易" |
| 钱包充值 / 提现 | ❌ 未做 | 无 |
| 用户登录态接入 | ❌ 未做 | Header 中"登录/注册"按钮仍指向既有 `/auth/login` 原页面 |
| 国际化 i18n | ❌ 未做 | 全站纯中文（按用户"中文优先"要求） |
| 13 个无 `<title>` 页面识别 | ❌ 未做 | 已标记 D 类，未进入 P1 |
| 3 个空目录识别 | ❌ 未做 | 已标记 D 类，P2 再处理 |
| 暗色专业终端 | ❌ 未做 | 按 P0 决策暂不进入 P1 |
| `_19 / _20 / _25` 首页切换 | ❌ 未做 | `_1` 暂定为主基线，未做横向对比切换 |
| 移动端 110+ 路由 | ❌ 未做 | H5 既有路由未触碰 |
| Admin 路由 | ❌ 未做 | 全部维持现状 |
| 历史 dirty 清理 | ❌ 未做 | 425+ 项 M/D 文件未触碰 |

---

## 九、P2 建议（仅建议，不启动）

> 以下为后续阶段的建议性路线，本次不启动 P2。

1. **首页基线复核**：浏览器实测后，若 `_19 / _20 / _25` 优于 `_1`，可一键切换 P1 主基线
2. **真实数据接入**：行情服务、公告 CMS、KYC provider
3. **KYC / KYB 真实接入**：对接真实第三方 KYC 服务（Onfido / Sumsub / Jumio）
4. **暗色专业交易终端独立阶段**：交易终端、行情大屏可单独走 P3 暗色主题
5. **i18n 接入**：next-intl 已依赖，可平滑接入中英双语
6. **13 个无 title 页面识别**：人工识别 screen.png 后批量映射到 P2
7. **真实登录态与资产视图**：按现有 P0 硬约束推进
8. **3 个空目录补齐**：补做原始资产或明确移除

---

## 十、冻结建议

### 10.1 建议的 commit message

```
docs+portal(q05): freeze p1 static preview portal
```

### 10.2 建议的 commit 范围

仅包含：

```
docs/front-portal/q05-new-design-import/10-p1-static-preview-acceptance.md
```

如需将 P1 页面纳入同一 commit，可扩展为：

```
docs/front-portal/q05-new-design-import/10-p1-static-preview-acceptance.md
src/app/portal-preview/
src/components/portal-preview/
```

> 最终 commit 范围由用户在 commit 前确认。

### 10.3 push 建议

- **不 push**，待用户在 commit 后单独给出远端策略指示
- 如需 push，必须先做 pre-push verification 与 post-push verification（参考项目 memory 流程）

---

## 附录 A：P1 已实现模块清单

| 模块 | 实现 |
|------|------|
| 共享布局 | ✅ 水印条 + PortalHeader + PortalFooter |
| 顶部导航 | ✅ Logo + 7 大菜单 + 搜索（/）+ 通知 + 登录/注册 |
| 搜索 Drawer | ✅ `/` 唤起、`Esc` 关闭、10 项快速跳转 |
| 品牌色系统 | ✅ BRAND 9 类色 + STATUS 7 类状态标签 |
| 状态标签 | ✅ OPEN / BETA / SOON / MAINTENANCE / COMING / EMPTY / PRIVATE |
| 空状态组件 | ✅ 5 种状态 + CTA 支持 |
| 首页 Hero | ✅ 标题 + 描述 + 双 CTA + 信任要素 + 行情占位卡 |
| 行情预览 | ✅ 5 个币种占位 + 涨跌幅占位（无假数据） |
| 产品矩阵 | ✅ 6 大产品卡 + 状态标签 |
| 平台数据 | ✅ 5 项指标（仅"7×24"为通用服务承诺，其余均"数据接入中"） |
| 公告入口/列表 | ✅ 4 类目 + 10 条公告 + 搜索 + Tab 过滤 |
| 费率说明 | ✅ 4 个 VIP 等级 + 优势说明 + 完整费率矩阵（标记示例） |
| 风险提示 | ✅ 4 类风险 + 用户承诺 + 警示条 |
| KYC 教学 | ✅ 4 步流程 + 4 等级说明 + 教学提示（限额标记示例） |
| 机构服务 | ✅ 6 大服务卡 + 商务联系（OTC 门槛"以实际咨询为准"） |
| 发现中心 | ✅ 4 Tab + 树图生态 + 研报中心（页数"示例页数"） |
| 现货教学 | ✅ 4 步流程 + 5 关键概念 + 教学提示 |
| 关于我们 | ✅ 价值观 + 大事记（去除 10 万/50 亿等具体数字） + 牌照信息 |
| H5 移动端 | ✅ 480px 容器 + 移动 Hero + 5 Tab 底部导航 |

---

## 附录 B：状态总览

| 项 | 状态 |
|----|------|
| 业务代码改动 | ❌ 无 |
| 新增依赖 | ❌ 无 |
| 新增 API | ❌ 无 |
| 数据库 / middleware 改动 | ❌ 无 |
| 伪造数据 | ❌ 无 |
| 未确认数字清理 | ✅ 16 处全部修正 |
| TypeScript 校验 | ✅ exit 0 |
| commit | ❌ 未执行（待用户确认） |
| push | ❌ 未执行（待用户确认） |

---

> 归档完成。等待用户对 commit 范围与是否 commit 的最终确认。
