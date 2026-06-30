# ZS-AI-Platform 仪表板 - Notion 专用版本

> **平台**：Notion  
> **Workspace**：ZS Exchange Team  
> **数据库 ID**：`db-zs-ai-platform-2026`  
> **页面权限**：全员可读，PMO 可编辑  
> **最后更新**：2026-06-11

---

## 📌 1. Notion 数据库架构设计

### 1.1 数据库总览（共 5 个关联数据库）

```
┌─────────────────────────────────────────────────────────┐
│            ZS-AI-Platform Dashboard (Notion)             │
├─────────────────────────────────────────────────────────┤
│  📊 KPI 数据库  ←─→  📋 任务数据库  ←─→  ⚠️ 风险数据库  │
│       ↓                    ↓                   ↓        │
│  🗓️ 里程碑数据库  ←─→  👥 资源数据库                     │
└─────────────────────────────────────────────────────────┘
```

### 1.2 数据库 Schema 定义

#### 📊 数据库 1：KPI 指标库

```yaml
Database Name: ZS-AI-Platform · KPI 追踪库
Database ID: db_kpi_zs_ai_2026
Icon: 📊
Parent Page: 项目执行仪表板

Properties (字段定义):
  - 指标名称:        Title              # 必填，主键
  - 指标编码:        ID (ZS-KPI-001)    # 唯一标识
  - 分类:            Select             # 进度/质量/性能/成本/风险/团队
      Options: [进度, 质量, 性能, 成本, 风险, 团队]
  - 当前值:          Number             # 自动从 Jira 同步
  - 目标值:          Number             # 设定目标
  - 单位:            Select             # %, 个, ms, h, ¥
  - 阈值规则:        Formula            # 红黄绿自动判断
  - 数据源:          URL                # 链接到 Jira/Grafana
  - 负责人:          Person             # 责任人
  - 刷新频率:        Select             # 实时/15min/小时/天
  - 趋势:           Formula             # 7日环比自动计算
  - 状态:           Status              # 🟢正常/🟡预警/🔴异常
  - 备注:           Text                # 文字说明
  - 关联任务:        Relation → 任务库
  - 创建时间:        Created time
  - 更新时间:        Last edited time
```

#### 📋 数据库 2：任务追踪库

```yaml
Database Name: ZS-AI-Platform · 任务库
Database ID: db_task_zs_ai_2026
Icon: 📋
Parent Page: 项目执行仪表板

Properties:
  - 任务标题:        Title
  - Jira ID:         Text (ZS-101)
  - 阶段:            Select             # M0/M1/M2/M3/M4/M5
  - Sprint:          Select             # Sprint #1 ~ #26
  - 任务类型:        Multi-Select       # 需求/设计/开发/测试/文档
  - 状态:            Status
      To-do / In Progress / In Review / Done / Blocked
  - 优先级:          Select             # P0/P1/P2/P3
  - 负责人:          Person
  - 预计工时:        Number (h)
  - 实际工时:        Number (h)
  - 开始日期:        Date
  - 截止日期:        Date
  - 完成日期:        Date
  - 完成度:          Formula = 实际工时/预计工时*100
  - 阻塞原因:        Text
  - 关联 KPI:        Relation → KPI 库
  - 关联里程碑:      Relation → 里程碑库
  - 风险等级:        Rollup (来自风险库)
```

#### ⚠️ 数据库 3：风险登记库

```yaml
Database Name: ZS-AI-Platform · 风险库
Database ID: db_risk_zs_ai_2026
Icon: ⚠️

Properties:
  - 风险标题:        Title
  - 风险 ID:         ID (R-01)
  - 风险类别:        Select
      Options: [技术, 业务, 合规, 人员, 资源, 外部]
  - 等级:            Select             # P0/P1/P2/P3
  - 影响等级:        Select (高/中/低)
  - 概率:           Select (高/中/低)
  - 风险评分:        Formula = 等级*影响*概率
  - 触发条件:        Text
  - 应对策略:        Text
  - 应急预案:        Text
  - 负责人:          Person
  - 状态:           Status
      监控中/处理中/已缓解/已关闭
  - 触发时间:        Date
  - 关闭时间:        Date
  - 关联任务:        Relation → 任务库
  - 通知渠道:        Multi-Select
      [飞书群, 邮件, 短信, Webhook]
  - 升级路径:        Text
```

#### 🗓️ 数据库 4：里程碑库

```yaml
Database Name: ZS-AI-Platform · 里程碑库
Database ID: db_milestone_zs_ai_2026
Icon: 🗓️

Properties:
  - 里程碑名称:       Title
  - 阶段:            Select (M0/M1/M2/M3/M4/M5)
  - 开始日期:        Date
  - 结束日期:        Date
  - 计划天数:        Formula = endDate - startDate
  - 状态:           Status
  - 实际完成日期:    Date
  - 偏差天数:        Formula = 实际完成日期 - 结束日期
  - 任务数:          Rollup (从任务库统计)
  - 完成率:          Rollup
  - 负责人:          Person
  - 关键交付物:       Text
  - 验收标准:        Text
```

#### 👥 数据库 5：资源分配库

```yaml
Database Name: ZS-AI-Platform · 资源库
Database ID: db_resource_zs_ai_2026
Icon: 👥

Properties:
  - 成员姓名:        Title
  - 工号:           Text
  - 角色:           Select
      Options: [PM, 架构师, 区块链, AI算法, 后端, 前端, 测试, DevOps]
  - 飞书 ID:        Text
  - 当前负载:        Number (%)
  - 本周工时:        Number (h)
  - 容量:           Number (h)
  - 在岗状态:        Select (在岗/请假/培训)
  - 负责任务:        Relation → 任务库
  - 关联风险:        Relation → 风险库
  - 飞书用户名:      Text (用于 @ 通知)
```

---

## 🎨 2. Notion 多视图配置

### 2.1 KPI 库 - 5 种视图

#### 视图 1：表格视图（默认 - 完整字段）

```
┌──────────┬────────┬────────┬────────┬────────┬────────┐
│ 指标名称 │ 当前值 │ 目标值 │  阈值  │  趋势  │  状态  │
├──────────┼────────┼────────┼────────┼────────┼────────┤
│ 项目进度 │  12%   │  100%  │  ≥10%  │  ↑ +3  │  🟢    │
│ 任务完成 │ 15/129 │ 129    │  ≥15   │  ↑ +5  │  🟢    │
│ 缺陷密度 │ 0.12   │ <0.5   │  <0.3  │  ↓ -0.05│  🟢   │
│ 团队负载 │  87%   │ 85-95% │  85-95 │  → 0   │  🟢    │
│ ...      │  ...   │  ...   │  ...   │  ...   │  ...   │
└──────────┴────────┴────────┴────────┴────────┴────────┘
```

#### 视图 2：看板视图（按分类）

```yaml
View Name: KPI 看板 · 按分类
Group By: 分类
Filter: 状态 != 已归档
Sort: 指标名称 (升序)

看板列:
  - 列1: 进度类（5 个指标）
  - 列2: 质量类（5 个指标）
  - 列3: 性能类（4 个指标）
  - 列4: 成本类（3 个指标）
  - 列5: 风险类（3 个指标）
  - 列6: 团队类（3 个指标）
```

#### 视图 3：日历视图（按更新时间）

```yaml
View Name: KPI 日历
Calendar By: 更新时间
Show: 显示 24 小时内的更新
Color By: 状态
  🟢 正常 = 绿色
  🟡 预警 = 黄色
  🔴 异常 = 红色
```

#### 视图 4：画廊视图（带图片卡片）

```yaml
View Name: KPI 画廊
Card Size: Medium
Card Preview: 自动选择首个图标
Display Properties:
  - 指标名称
  - 当前值
  - 趋势
  - 状态
```

#### 视图 5：时间线视图（按创建时间）

```yaml
View Name: KPI 时间轴
Timeline By: 创建时间
Show: All entries
Color: By 分类
```

---

### 2.2 任务库 - 6 种视图

#### 视图 1：看板视图（Sprint 进行中）

```yaml
View Name: 当前 Sprint 看板
Group By: 状态
Filter: Sprint = Sprint #3
Hide Fields: [Jira ID, 实际工时]

看板列:
  📋 To-do (3)
  🔵 In Progress (4)
  👀 In Review (1)
  ✅ Done (3)
  🚫 Blocked (0)
```

#### 视图 2：甘特图（按日期）

```yaml
View Name: 项目甘特图
Timeline By: 开始日期 → 截止日期
Bar Wrapping: 不换行
Color By: 阶段
Display Properties:
  - 任务标题
  - 阶段
  - 负责人
  - 完成度
```

#### 视图 3：日历视图（按截止日期）

```yaml
View Name: 任务日历
Calendar By: 截止日期
Show: 本月 + 下月
Color By: 优先级
```

#### 视图 4：表格视图（全部任务）

```yaml
View Name: 全部任务 · 表格
Filter: 状态 != Done OR Done within last 30 days
Sort: 截止日期 (升序)
Display Properties: 全部字段
```

#### 视图 5：按负责人分组

```yaml
View Name: 我的任务
Group By: 负责人
Filter: 当前用户
Display Properties: [任务标题, 状态, 优先级, 截止日期]
```

#### 视图 6：按阶段分组

```yaml
View Name: 阶段任务分布
Group By: 阶段
Summary: 状态计数
Color By: 优先级
```

---

### 2.3 风险库 - 4 种视图

#### 视图 1：风险看板（按等级）

```yaml
View Name: 风险看板
Group By: 等级 (P0 → P3)
Filter: 状态 != 已关闭
Color By: 等级
  P0 = 红色
  P1 = 橙色
  P2 = 黄色
  P3 = 绿色
```

#### 视图 2：风险热力图（自定义画廊）

```yaml
View Name: 风险热力图
Layout: Gallery
Card Size: Small
Group By: 影响等级
Color By: 风险评分
```

#### 视图 3：按负责人分组

```yaml
View Name: 我的风险
Group By: 负责人
Filter: 当前用户 AND 状态 = 监控中
```

#### 视图 4：按时间线（触发时间）

```yaml
View Name: 风险时间线
Timeline By: 触发时间
Filter: 触发时间 >= 今天 - 7天
```

---

## 🧮 3. Notion Formula 公式集合

### 3.1 KPI 库公式

```javascript
// 公式 1: 红黄绿阈值判断（自动状态）
ifs(
  prop("当前值") >= prop("目标值") * 0.9, "🟢 正常",
  prop("当前值") >= prop("目标值") * 0.7, "🟡 预警",
  prop("当前值") >= prop("目标值") * 0.5, "🟠 关注",
  true, "🔴 异常"
)

// 公式 2: 进度条（Emoji 可视化）
slice("▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░", 0, round(prop("当前值") / 10)) + 
slice("▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░", 0, 10 - round(prop("当前值") / 10))

// 公式 3: 趋势箭头
ifs(
  prop("周环比") > 5, "📈 ↑",
  prop("周环比") < -5, "📉 ↓",
  true, "→ 持平"
)

// 公式 4: 与目标的差距
prop("目标值") - prop("当前值")

// 公式 5: 完成度百分比
format(round((prop("实际工时") / prop("预计工时")) * 100)) + "%"
```

### 3.2 任务库公式

```javascript
// 公式 1: 是否逾期
ifs(
  and(prop("状态") != "Done", prop("截止日期") < now()), "🚫 逾期",
  and(prop("状态") != "Done", dateBetween(prop("截止日期"), now(), "days") <= 3), "⚠️ 即将到期",
  true, "✅ 正常"
)

// 公式 2: 工时偏差
format(prop("预计工时") - prop("实际工时")) + "h"

// 公式 3: 任务健康度评分
ifs(
  prop("完成度") >= 100, 5,
  prop("完成度") >= 75, 4,
  prop("完成度") >= 50, 3,
  prop("完成度") >= 25, 2,
  true, 1
)

// 公式 4: 阶段进度
prop("关联里程碑")->prop("完成率")

// 公式 5: 风险传染（任务关联的风险数）
length(prop("关联风险"))
```

### 3.3 风险库公式

```javascript
// 公式 1: 风险评分（自动计算）
ifs(
  prop("等级") == "P0", 100,
  prop("等级") == "P1", 50,
  prop("等级") == "P2", 20,
  prop("等级") == "P3", 5
) * 
ifs(prop("影响等级") == "高", 3, prop("影响等级") == "中", 2, 1) *
ifs(prop("概率") == "高", 3, prop("概率") == "中", 2, 1)

// 公式 2: 处理时长
dateBetween(prop("关闭时间"), prop("触发时间"), "days")

// 公式 3: 是否超期未处理
ifs(
  and(prop("状态") != "已关闭", dateBetween(now(), prop("触发时间"), "days") > 7), "🚨 超期",
  and(prop("状态") != "已关闭", dateBetween(now(), prop("触发时间"), "days") > 3), "⚠️ 关注",
  true, "✅ 正常"
)

// 公式 4: 风险等级颜色标记
ifs(
  prop("等级") == "P0", "🔴",
  prop("等级") == "P1", "🟠",
  prop("等级") == "P2", "🟡",
  prop("等级") == "P3", "🟢"
)
```

### 3.4 资源库公式

```javascript
// 公式 1: 资源利用率
format(round((prop("本周工时") / prop("容量")) * 100)) + "%"

// 公式 2: 健康度
ifs(
  prop("当前负载") > 100, "🔴 超载",
  prop("当前负载") >= 90, "🟡 满载",
  prop("当前负载") >= 70, "🟢 正常",
  true, "⚪ 偏闲"
)

// 公式 3: 剩余可用工时
prop("容量") - prop("本周工时")
```

---

## 🔗 4. Rollup 关联汇总

### 4.1 任务库 → 里程碑库的 Rollup

```yaml
Rollup 字段: 阶段任务完成率
Relation Property: 关联里程碑
Target Property: 状态
Function: Count where 状态 = Done
Calculate: sum / count * 100
```

### 4.2 里程碑库 → 任务库的 Rollup

```yaml
Rollup 字段: 任务数
Relation Property: 任务关联
Target Property: 任务标题
Function: Count
```

### 4.3 风险库 → 任务库的 Rollup

```yaml
Rollup 字段: 风险影响任务数
Relation Property: 关联任务
Target Property: 任务标题
Function: Count unique
```

### 4.4 资源库 → 任务库的 Rollup

```yaml
Rollup 字段: 个人任务数
Relation Property: 负责任务
Target Property: 任务标题
Function: Count
```

---

## 🔘 5. 模板按钮（Template Buttons）

### 5.1 任务库 - 3 个模板按钮

```yaml
Template 1: 创建需求评审任务
  Icon: 📝
  Properties:
    - 任务标题: "[评审] " + 当前任务标题
    - 任务类型: 评审
    - 状态: To-do
    - 优先级: P1
    - 预计工时: 4
  Body: |
    # 评审会议议程
    1. 需求背景介绍
    2. 技术方案讨论
    3. 风险评估
    4. 决议与 TODO

Template 2: 创建 Bug 修复任务
  Icon: 🐛
  Properties:
    - 任务标题: "[Bug] " + 问题描述
    - 任务类型: 开发
    - 状态: To-do
    - 优先级: P1
    - 预计工时: 8
  Body: |
    # Bug 描述
    - 复现步骤
    - 期望结果
    - 实际结果
    - 截图

Template 3: 创建 Sprint 规划任务
  Icon: 🗓️
  Properties:
    - 任务类型: 规划
    - 状态: In Progress
    - 优先级: P0
  Body: |
    # Sprint 规划
    - Sprint 目标
    - 容量评估
    - 任务拆分
    - 风险识别
```

### 5.2 风险库 - 2 个模板按钮

```yaml
Template 1: 紧急风险上报
  Icon: 🚨
  Properties:
    - 风险标题: "[紧急] " + 风险描述
    - 等级: P0
    - 影响等级: 高
    - 状态: 监控中
    - 通知渠道: 飞书群, 短信
  Body: |
    # 风险详情
    - 触发时间
    - 影响范围
    - 应急措施
    - 升级路径

Template 2: 风险复盘
  Icon: 📋
  Properties:
    - 状态: 已关闭
    - 关闭时间: now()
  Body: |
    # 复盘报告
    1. 风险经过
    2. 处理过程
    3. 经验教训
    4. 改进措施
```

---

## 🔍 6. 过滤器和排序示例

### 6.1 KPI 库过滤器组合

```yaml
Filter 1: 当前需关注指标
  Conditions:
    状态 = "🟡 预警" OR 状态 = "🔴 异常"
  Sort: 当前值 (降序)

Filter 2: 本周更新指标
  Conditions:
    更新时间 >= 今天 - 7 天
  Sort: 状态 (升序)

Filter 3: 性能类指标
  Conditions:
    分类 = 性能
    状态 ≠ "🟢 正常"
  Sort: 指标名称

Filter 4: 关键 KPI
  Conditions:
    分类 = 进度 OR 分类 = 质量
  Sort: 指标编码
```

### 6.2 任务库过滤器组合

```yaml
Filter 1: 我负责的进行中任务
  Conditions:
    负责人 = 当前用户
    状态 = "In Progress"
  Sort: 截止日期 (升序)

Filter 2: 本周到期
  Conditions:
    截止日期 >= 今天
    截止日期 <= 今天 + 7 天
    状态 ≠ "Done"
  Sort: 优先级 (降序)

Filter 3: Sprint #3 所有任务
  Conditions:
    Sprint = "Sprint #3"
  Sort: 状态, 优先级

Filter 4: 阻塞任务
  Conditions:
    状态 = "Blocked"
    OR 阻塞原因 is not empty
  Sort: 阻塞时间 (降序)
```

### 6.3 风险库过滤器组合

```yaml
Filter 1: 高优先级风险
  Conditions:
    等级 = P0 OR 等级 = P1
    状态 ≠ "已关闭"
  Sort: 风险评分 (降序)

Filter 2: 待处理风险
  Conditions:
    负责人 = 当前用户
    状态 = 监控中 OR 状态 = 处理中
  Sort: 触发时间 (降序)

Filter 3: 本月新发风险
  Conditions:
    触发时间 >= 本月第一天
  Sort: 等级, 风险评分
```

---

## 🔔 7. Notion 自动化（Automation）

### 7.1 触发器配置

```yaml
Automation 1: 风险升级通知
  Trigger: 风险等级 = P0
  Action:
    1. 发送飞书消息到「ZS-PMO-告警群」
    2. @相关责任人
    3. 创建紧急任务
    4. 邮件通知 PMO 总监

Automation 2: 任务逾期提醒
  Trigger: 截止日期 = 今天 AND 状态 ≠ Done
  Action:
    1. 飞书消息 @负责人
    2. 更新任务状态为「逾期」

Automation 3: Sprint 结束提醒
  Trigger: Sprint 结束日期 - 1 天
  Action:
    1. 汇总未完成任务
    2. 飞书通知所有团队成员

Automation 4: KPI 异常升级
  Trigger: 状态 = 🔴 异常
  Action:
    1. 飞书群告警
    2. 创建风险登记
    3. 通知 PMO
```

---

## 📖 8. 使用示例

### 示例 1：周一晨会快速查看

**步骤**：
1. 打开 `仪表板主页` → 顶部 KPI 概览
2. 点击「任务看板」视图 → 查看 Sprint #3 进展
3. 查看「风险看板」→ 优先关注 P0/P1
4. 查阅「时间线」→ 确认本周里程碑

**预期结果**：
- 5 分钟内了解项目整体健康度
- 识别需要立即处理的风险
- 锁定本周关键交付物

### 示例 2：投资人周报生成

**步骤**：
1. 打开 KPI 库 → 应用「关键 KPI」过滤器
2. 截图 4 大类核心指标
3. 导出 Notion 页面为 PDF
4. 附加里程碑时间线甘特图
5. 添加风险摘要（前 3 个）

**预期结果**：
- 1 份 5 页专业周报
- 数据准确、可追溯
- 体现项目透明度和治理水平

---

## 🛠️ 9. 集成与扩展

### 9.1 Notion API 集成

```javascript
// Notion API 调用示例
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function syncKPIs() {
  const kpiDb = await notion.databases.query({
    database_id: 'db_kpi_zs_ai_2026',
    filter: {
      property: '状态',
      select: { equals: '🟡 预警' }
    }
  });
  // 处理预警 KPI...
  return kpiDb.results;
}
```

### 9.2 飞书 Webhook 推送

```javascript
async function pushToFeishu(alert) {
  await fetch(process.env.FEISHU_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      msg_type: 'interactive',
      card: {
        header: {
          title: { tag: 'plain_text', content: '⚠️ ZS-AI 项目告警' },
          template: 'red'
        },
        elements: [
          { tag: 'div', text: { tag: 'lark_md', content: alert.message } },
          { tag: 'action', actions: [
            { tag: 'button', text: { tag: 'plain_text', content: '查看详情' }, 
              url: alert.notionUrl, type: 'primary' }
          ]}
        ]
      }
    })
  });
}
```

---

## 📚 相关文档

- 📄 [项目执行仪表板（主文档）](./项目执行仪表板.md)
- 📄 [Confluence 专用版本](./仪表板-Confluence-版本.md)
- 📄 [KPI 指标定义表](./KPI指标定义表.md)
- 📄 [风险预警规则](./风险预警规则.md)
- 📄 [数据自动更新配置](./数据自动更新配置.md)

---

> **模板维护**：DevOps & PMO | **Notion 版本**：API v2 | **兼容性**：Notion 2026+
