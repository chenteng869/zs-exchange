# ZS-AI-Platform 仪表板 - Confluence 专用版本

> **平台**：Atlassian Confluence  
> **Space Key**：`ZS-AI`  
> **Page ID**：`9856321`  
> **权限**：项目组可读写，其他团队只读  
> **最后更新**：2026-06-11

---

## 🏗️ 1. Confluence 页面架构

### 1.1 页面树结构

```
📁 ZS-AI-Platform Space
├── 🏠 首页 / Dashboard
│   ├── 📊 项目执行仪表板（本文档）
│   ├── 📈 实时 KPI 看板
│   ├── 📋 任务跟踪
│   ├── ⚠️ 风险登记
│   ├── 🗓️ 里程碑日历
│   └── 👥 团队资源
├── 📁 01 项目规划
├── 📁 02 需求文档
├── 📁 03 技术设计
├── 📁 04 开发文档
├── 📁 05 测试报告
└── 📁 06 上线运维
```

### 1.2 仪表板页面布局

```
┌────────────────────────────────────────────────────────┐
│  PAGE TITLE: ZS-AI-Platform 项目执行仪表板             │
├────────────────────────────────────────────────────────┤
│  [Status Lozenge]  [Edit] [Share] [Watch] [Export]    │
├────────────────────────────────────────────────────────┤
│  1. 项目概览 (Page Properties Report Macro)            │
│  2. 核心 KPI 看板 (Chart Macro + Jira Issue Macro)     │
│  3. 任务进度 (Jira Macro + Status Macro)               │
│  4. 风险预警 (JQL + Status Color)                     │
│  5. 里程碑时间线 (Team Calendar Macro)                 │
│  6. 资源分配 (User Profile + HTML Macro)               │
│  7. 数据来源声明 (Metadata)                            │
└────────────────────────────────────────────────────────┘
```

---

## 📌 2. 关键 Confluence 宏（Macro）清单

| 宏名称 | 用途 | 出现位置 |
|--------|------|----------|
| `{jira}` | 嵌入 Jira Issue 数据 | 任务、风险、Bug |
| `{jirachart}` | Jira 图表 | 进度、Sprint 燃尽 |
| `{status}` | 颜色状态徽章 | 状态标签 |
| `{chart}` | 数据可视化图表 | KPI、资源 |
| `{gauge}` | 仪表盘数值 | 关键 KPI |
| `{excerpt-include}` | 引用其他页面 | 跨页面引用 |
| `{page-properties-report}` | 页面属性报表 | 文档清单 |
| `{page-properties}` | 页面元数据 | 文档头部 |
| `{panel}` | 强调面板 | 告警、提示 |
| `{info}` | 提示框 | 操作说明 |
| `{warning}` | 警告框 | 风险提示 |
| `{note}` | 备注框 | 附加说明 |
| `{html}` | 自定义 HTML | 复杂图表 |
| `{team-calendar}` | 团队日历 | 里程碑 |
| `{recently-updated}` | 最近更新 | 知识库 |
| `{livesearch}` | 实时搜索 | 文档检索 |
| `{content-report-table}` | 内容报表 | 文档清单 |
| `{roadmap}` | 路线图 | 里程碑 |
| `{attachments}` | 附件列表 | 文件归档 |
| `{children}` | 子页面列表 | 页面导航 |

---

## 📊 3. 模块 1：核心 KPI 看板

### 3.1 KPI 数字仪表（{gauge} 宏）

```xml
<ac:structured-macro ac:name="gauge" ac:schema-version="1">
  <ac:parameter ac:name="title">项目整体进度</ac:parameter>
  <ac:parameter ac:name="value">12</ac:parameter>
  <ac:parameter ac:name="maxValue">100</ac:parameter>
  <ac:parameter ac:name="unit">%</ac:parameter>
  <ac:parameter ac:name="color">#00C896</ac:parameter>
  <ac:parameter ac:name="thresholds">
    [{ "value": 0, "color": "#FF4757" },
     { "value": 50, "color": "#FFB800" },
     { "value": 80, "color": "#00C896" }]
  </ac:parameter>
</ac:structured-macro>
```

### 3.2 多指标仪表盘组（HTML 嵌入）

```html
<ac:structured-macro ac:name="html" ac:schema-version="1">
  <ac:plain-text-body><![CDATA[
<div class="zs-kpi-grid" style="display: grid; 
  grid-template-columns: repeat(4, 1fr); 
  gap: 16px; 
  font-family: 'Segoe UI', sans-serif;">
  
  <div class="kpi-card" style="background: linear-gradient(135deg, #0A1929, #1A2942);
    color: white; padding: 20px; border-radius: 12px; 
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
    <div style="font-size: 12px; opacity: 0.8;">📊 项目进度</div>
    <div style="font-size: 36px; font-weight: bold; color: #00D4FF;">12%</div>
    <div style="font-size: 12px;">目标 100% · 趋势 ↑ +3%</div>
  </div>
  
  <div class="kpi-card" style="background: linear-gradient(135deg, #0A1929, #1A2942);
    color: white; padding: 20px; border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
    <div style="font-size: 12px; opacity: 0.8;">✅ 任务完成</div>
    <div style="font-size: 36px; font-weight: bold; color: #00C896;">15/129</div>
    <div style="font-size: 12px;">本周完成 +5 · 趋势 ↑</div>
  </div>
  
  <div class="kpi-card" style="background: linear-gradient(135deg, #0A1929, #1A2942);
    color: white; padding: 20px; border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
    <div style="font-size: 12px; opacity: 0.8;">💰 预算消耗</div>
    <div style="font-size: 36px; font-weight: bold; color: #00D4FF;">8.3%</div>
    <div style="font-size: 12px;">¥83万 / ¥1000万</div>
  </div>
  
  <div class="kpi-card" style="background: linear-gradient(135deg, #0A1929, #1A2942);
    color: white; padding: 20px; border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
    <div style="font-size: 12px; opacity: 0.8;">🐛 缺陷密度</div>
    <div style="font-size: 36px; font-weight: bold; color: #00C896;">0.12</div>
    <div style="font-size: 12px;">/ KLOC · 优秀</div>
  </div>
  
</div>
  ]]></ac:plain-text-body>
</ac:structured-macro>
```

### 3.3 状态徽章（{status} 宏）

```xml
<ac:structured-macro ac:name="status" ac:schema-version="1">
  <ac:parameter ac:name="title">健康</ac:parameter>
  <ac:parameter ac:name="colour">Green</ac:parameter>
  <ac:parameter ac:name="subtle">false</ac:parameter>
</ac:structured-macro>

<ac:structured-macro ac:name="status" ac:schema-version="1">
  <ac:parameter ac:name="title">注意</ac:parameter>
  <ac:parameter ac:name="colour">Yellow</ac:parameter>
</ac:structured-macro>

<ac:structured-macro ac:name="status" ac:schema-version="1">
  <ac:parameter ac:name="title">严重</ac:parameter>
  <ac:parameter ac:name="colour">Red</ac:parameter>
</ac:structured-macro>
```

---

## 📋 4. 模块 2：任务进度可视化

### 4.1 Jira Issue Macro（基础列表）

```xml
<ac:structured-macro ac:name="jira" ac:schema-version="1">
  <ac:parameter ac:name="jqlQuery">
    project = ZS-AI 
    AND sprint = "Sprint #3" 
    AND status != Done 
    ORDER BY priority DESC, due ASC
  </ac:parameter>
  <ac:parameter ac:name="table">true</ac:parameter>
  <ac:parameter ac:name="columns">key,summary,type,status,priority,assignee,duedate,progress</ac:parameter>
  <ac:parameter ac:name="maximumIssues">50</ac:parameter>
  <ac:parameter ac:name="server">JIRA-ZS-CLOUD</ac:parameter>
</ac:structured-macro>
```

### 4.2 Jira 燃尽图（{jirachart} 宏）

```xml
<ac:structured-macro ac:name="jirachart" ac:schema-version="1">
  <ac:parameter ac:name="jqlQuery">
    project = ZS-AI 
    AND sprint = "Sprint #3" 
    AND issuetype in (Story, Task, Bug)
  </ac:parameter>
  <ac:parameter ac:name="chartType">burndown</ac:parameter>
  <ac:parameter ac:name="statType">issues</ac:parameter>
  <ac:parameter ac:name="server">JIRA-ZS-CLOUD</ac:parameter>
  <ac:parameter ac:name="width">800</ac:parameter>
  <ac:parameter ac:name="height">400</ac:parameter>
</ac:structured-macro>
```

### 4.3 Jira Velocity 图

```xml
<ac:structured-macro ac:name="jirachart" ac:schema-version="1">
  <ac:parameter ac:name="jqlQuery">project = ZS-AI AND sprint in openSprints()</ac:parameter>
  <ac:parameter ac:name="chartType">velocity</ac:parameter>
  <ac:parameter ac:name="server">JIRA-ZS-CLOUD</ac:parameter>
</ac:structured-macro>
```

### 4.4 阶段任务分布（{chart} 宏）

```xml
<ac:structured-macro ac:name="chart" ac:schema-version="1">
  <ac:parameter ac:name="type">pie</ac:parameter>
  <ac:parameter ac:name="title">任务阶段分布</ac:parameter>
  <ac:parameter ac:name="dataDisplay">percentage</ac:parameter>
  <ac:parameter ac:name="colors">#00D4FF,#00C896,#FFB800,#FF4757,#8B92A9,#FF6B9D</ac:parameter>
  <ac:plain-text-body><![CDATA[
    labels,values
    M0 立项,8
    M1 需求,24
    M2 设计,22
    M3 开发,45
    M4 测试,18
    M5 上线,12
  ]]></ac:plain-text-body>
</ac:structured-macro>
```

### 4.5 任务进度面板（{panel} 宏）

```xml
<ac:structured-macro ac:name="panel" ac:schema-version="1">
  <ac:parameter ac:name="title">🎯 Sprint #3 焦点</ac:parameter>
  <ac:parameter ac:name="borderStyle">solid</ac:parameter>
  <ac:parameter ac:name="borderColor">#00D4FF</ac:parameter>
  <ac:rich-text-body>
    <p><strong>Sprint 目标：</strong>完成 M1 阶段需求评审，启动 M2 架构设计</p>
    <p><strong>时间窗口：</strong>2026-06-09 ~ 2026-06-22</p>
    <p><strong>关键任务：</strong>8 个 · 已完成 3 个 · 进行中 4 个</p>
    <ac:structured-macro ac:name="status" ac:schema-version="1">
      <ac:parameter ac:name="title">Sprint 进度 60%</ac:parameter>
      <ac:parameter ac:name="colour">Blue</ac:parameter>
    </ac:structured-macro>
  </ac:rich-text-body>
</ac:structured-macro>
```

---

## ⚠️ 5. 模块 3：风险预警模块

### 5.1 实时风险列表（Jira JQL）

```xml
<ac:structured-macro ac:name="jira" ac:schema-version="1">
  <ac:parameter ac:name="jqlQuery">
    project = ZS-AI 
    AND issuetype = Risk 
    AND status != Closed 
    AND priority in (P0, P1, P2) 
    ORDER BY priority DESC, created DESC
  </ac:parameter>
  <ac:parameter ac:name="table">true</ac:parameter>
  <ac:parameter ac:name="columns">key,summary,priority,status,assignee,duedate,customfield_10101</ac:parameter>
  <ac:parameter ac:name="server">JIRA-ZS-CLOUD</ac:parameter>
</ac:structured-macro>
```

### 5.2 风险热力图（HTML 自定义）

```html
<ac:structured-macro ac:name="html" ac:schema-version="1">
  <ac:plain-text-body><![CDATA[
<div class="risk-heatmap" style="background: #F5F7FA; padding: 24px; 
  border-radius: 12px; font-family: 'Segoe UI', sans-serif;">
  <h3 style="color: #0A1929; margin-top: 0;">🔥 风险热力图</h3>
  <table style="width: 100%; border-collapse: collapse; text-align: center;">
    <tr>
      <td style="padding: 8px;"></td>
      <th style="padding: 8px; color: #555;">低概率</th>
      <th style="padding: 8px; color: #555;">中概率</th>
      <th style="padding: 8px; color: #555;">高概率</th>
    </tr>
    <tr>
      <th style="padding: 8px; color: #555;">高影响</th>
      <td style="padding: 16px; background: #FFE4E6; border-radius: 8px;">R-01 合约漏洞</td>
      <td style="padding: 16px; background: #FFB800; color: white; border-radius: 8px;">R-02 AI 模型</td>
      <td style="padding: 16px; background: #FFE4E6; border-radius: 8px;">—</td>
    </tr>
    <tr>
      <th style="padding: 8px; color: #555;">中影响</th>
      <td style="padding: 16px; background: #FFF4E6; border-radius: 8px;">R-07 跨链</td>
      <td style="padding: 16px; background: #FFB800; color: white; border-radius: 8px;">R-04 人员</td>
      <td style="padding: 16px; background: #FFB800; color: white; border-radius: 8px;">R-05 API</td>
    </tr>
    <tr>
      <th style="padding: 8px; color: #555;">低影响</th>
      <td style="padding: 16px; background: #00C896; color: white; border-radius: 8px;">R-10 国际化</td>
      <td style="padding: 16px; background: #FFE4E6; border-radius: 8px;">R-08 变更</td>
      <td style="padding: 16px; background: #00C896; color: white; border-radius: 8px;">R-09 环境</td>
    </tr>
  </table>
</div>
  ]]></ac:plain-text-body>
</ac:structured-macro>
```

### 5.3 告警面板（{warning} 宏）

```xml
<ac:structured-macro ac:name="warning" ac:schema-version="1">
  <ac:rich-text-body>
    <p><strong>⚠️ P0 风险告警：</strong>智能合约安全漏洞 (R-01)</p>
    <p>检测到链上合约存在重入攻击风险，<strong>资金安全事件 0</strong>。</p>
    <p>负责人：周敏 | 状态：监控中 | 触发时间：2 小时前</p>
    <p>
      <ac:structured-macro ac:name="jira">
        <ac:default-parameter>ZS-RISK-001</ac:default-parameter>
        <ac:parameter ac:name="server">JIRA-ZS-CLOUD</ac:parameter>
      </ac:structured-macro>
    </p>
  </ac:rich-text-body>
</ac:structured-macro>
```

### 5.4 风险分布图

```xml
<ac:structured-macro ac:name="chart" ac:schema-version="1">
  <ac:parameter ac:name="type">bar</ac:parameter>
  <ac:parameter ac:name="orientation">horizontal</ac:parameter>
  <ac:parameter ac:name="title">风险等级分布</ac:parameter>
  <ac:parameter ac:name="colors">#FF4757,#FF6B35,#FFB800,#00C896</ac:parameter>
  <ac:plain-text-body><![CDATA[
    labels,values
    🔴 P0 严重,1
    🟠 P1 高,2
    🟡 P2 中,4
    🟢 P3 低,3
  ]]></ac:plain-text-body>
</ac:structured-macro>
```

---

## 🗓️ 6. 模块 4：里程碑时间线

### 6.1 团队日历（{team-calendar} 宏）

```xml
<ac:structured-macro ac:name="team-calendar" ac:schema-version="1">
  <ac:parameter ac:name="defaultCalendar">zs-ai-calendar</ac:parameter>
  <ac:parameter ac:name="calendarFilter">zs-milestone</ac:parameter>
  <ac:parameter ac:name="view">month</ac:parameter>
  <ac:parameter ac:name="startDate">2026-01-01</ac:parameter>
  <ac:parameter ac:name="endDate">2026-12-31</ac:parameter>
  <ac:parameter ac:name="showTitle">true</ac:parameter>
  <ac:parameter ac:name="title">ZS-AI-Platform 里程碑日历</ac:parameter>
</ac:structured-macro>
```

### 6.2 路线图宏（{roadmap} 宏）

```xml
<ac:structured-macro ac:name="roadmap" ac:schema-version="1">
  <ac:parameter ac:name="name">ZS-AI 路线图</ac:parameter>
  <ac:parameter ac:name="startingDate">2026-01-01</ac:parameter>
  <ac:parameter ac:name="endingDate">2026-12-31</ac:parameter>
  <ac:parameter ac:name="lanes">
    [M0 立项, M1 需求, M2 设计, M3 开发, M4 测试, M5 上线]
  </ac:parameter>
  <ac:parameter ac:name="bars">
    [
      {"label": "M0 立项", "lane": "M0 立项", "start": "2026-01-15", 
       "end": "2026-01-28", "color": "#00C896", "status": "completed"},
      {"label": "M1 需求", "lane": "M1 需求", "start": "2026-04-01", 
       "end": "2026-04-30", "color": "#00D4FF", "status": "in-progress", "progress": 62},
      {"label": "M2 设计", "lane": "M2 设计", "start": "2026-05-01", 
       "end": "2026-05-31", "color": "#FFB800", "status": "in-progress", "progress": 15},
      {"label": "M3 开发", "lane": "M3 开发", "start": "2026-06-01", 
       "end": "2026-08-31", "color": "#8B92A9", "status": "pending"},
      {"label": "M4 测试", "lane": "M4 测试", "start": "2026-09-01", 
       "end": "2026-10-31", "color": "#8B92A9", "status": "pending"},
      {"label": "M5 上线", "lane": "M5 上线", "start": "2026-11-01", 
       "end": "2026-12-31", "color": "#8B92A9", "status": "pending"}
    ]
  </ac:parameter>
</ac:structured-macro>
```

### 6.3 里程碑表（{content-report-table} 宏）

```xml
<ac:structured-macro ac:name="content-report-table" ac:schema-version="1">
  <ac:parameter ac:name="label">milestone</ac:parameter>
  <ac:parameter ac:name="cql">
    label = "milestone" AND space = "ZS-AI"
  </ac:parameter>
  <ac:parameter ac:name="columns">title,excerpt,excerpt-label-milestone-status,
    label-milestone-date,label-milestone-owner</ac:parameter>
</ac:structured-macro>
```

---

## 👥 7. 模块 5：资源分配图表

### 7.1 团队花名册（{page-properties-report} 宏）

```xml
<ac:structured-macro ac:name="page-properties-report" ac:schema-version="1">
  <ac:parameter ac:name="label">team-member</ac:parameter>
  <ac:parameter ac:name="cql">label = "team-member"</ac:parameter>
  <ac:parameter ac:name="columns">title,excerpt,excerpt-label-role,
    excerpt-label-load,excerpt-label-skills</ac:parameter>
  <ac:parameter ac:name="sortBy">title</ac:parameter>
  <ac:parameter ac:name="reverseSort">false</ac:parameter>
</ac:structured-macro>
```

### 7.2 资源利用率饼图（{chart} 宏）

```xml
<ac:structured-macro ac:name="chart" ac:schema-version="1">
  <ac:parameter ac:name="type">doughnut</ac:parameter>
  <ac:parameter ac:name="title">资源利用率分布</ac:parameter>
  <ac:parameter ac:name="dataDisplay">percentage</ac:parameter>
  <ac:parameter ac:name="colors">#FF4757,#FFB800,#00C896,#00D4FF,#8B92A9</ac:parameter>
  <ac:plain-text-body><![CDATA[
    labels,values
    超载 (>100%),1
    满载 (90-100%),1
    正常 (70-90%),6
    偏闲 (50-70%),1
    空闲 (<50%),0
  ]]></ac:plain-text-body>
</ac:structured-macro>
```

### 7.3 成员卡片（HTML 自定义）

```html
<ac:structured-macro ac:name="html" ac:schema-version="1">
  <ac:plain-text-body><![CDATA[
<div class="team-grid" style="display: grid; 
  grid-template-columns: repeat(3, 1fr); gap: 16px;
  font-family: 'Segoe UI', sans-serif;">
  
  <div class="member-card" style="background: white; padding: 16px; 
    border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    border-left: 4px solid #00C896;">
    <div style="display: flex; align-items: center; gap: 12px;">
      <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #0A1929, #00D4FF);
        border-radius: 50%; color: white; display: flex; 
        align-items: center; justify-content: center; font-weight: bold;">张</div>
      <div>
        <div style="font-weight: bold; color: #0A1929;">张伟</div>
        <div style="font-size: 12px; color: #8B92A9;">🎯 产品经理</div>
      </div>
    </div>
    <div style="margin-top: 12px; font-size: 13px;">
      <div>📊 负载：<strong style="color: #FF4757;">100%</strong></div>
      <div>⏰ 工时：42/40h</div>
      <div>🔔 状态：超载</div>
    </div>
  </div>
  
  <!-- 重复其他成员卡片... -->
  
</div>
  ]]></ac:plain-text-body>
</ac:structured-macro>
```

### 7.4 用户配置文件宏

```xml
<ac:structured-macro ac:name="user-profile" ac:schema-version="1">
  <ac:parameter ac:name="user">zhangwei</ac:parameter>
  <ac:parameter ac:name="showIcon">true</ac:parameter>
  <ac:parameter ac:name="showFullName">true</ac:parameter>
</ac:structured-macro>
```

---

## 🧩 8. 模块 6：综合信息（仪表板头部与底部）

### 8.1 页面属性宏（{page-properties}）

```xml
<ac:structured-macro ac:name="page-properties" ac:schema-version="1">
  <ac:parameter ac:name="id">zs-dashboard-properties</ac:parameter>
  <ac:rich-text-body>
    <table>
      <tbody>
        <tr><th>项目名称</th><td>ZS-AI-Platform</td></tr>
        <tr><th>项目阶段</th><td>M1 - 需求分析</td></tr>
        <tr><th>项目经理</th><td>张伟</td></tr>
        <tr><th>技术负责人</th><td>李娜</td></tr>
        <tr><th>当前进度</th><td>12%</td></tr>
        <tr><th>数据更新</th><td>2026-06-11 14:30</td></tr>
        <tr><th>Jira Project</th><td>ZS-AI</td></tr>
        <tr><th>Grafana Dashboard</th><td><a href="https://grafana.zs.exchange/d/zs-ai">查看</a></td></tr>
        <tr><th>飞书群</th><td><a href="https://feishu.cn/group/zs-ai">ZS-AI 项目群</a></td></tr>
      </tbody>
    </table>
  </ac:rich-text-body>
</ac:structured-macro>
```

### 8.2 引用其他页面

```xml
<ac:structured-macro ac:name="excerpt-include" ac:schema-version="1">
  <ac:parameter ac:name="nopanel">true</ac:parameter>
  <ac:parameter ac:name="page">ZS-AI:$project-status-summary</ac:parameter>
</ac:structured-macro>
```

### 8.3 提示框（{info} / {note} 宏）

```xml
<ac:structured-macro ac:name="info" ac:schema-version="1">
  <ac:rich-text-body>
    <p><strong>💡 数据更新说明</strong></p>
    <ul>
      <li>KPI 数据：每 15 分钟从 Jira API 自动同步</li>
      <li>任务状态：实时通过 Jira Issue Macro 拉取</li>
      <li>风险监控：Prometheus + 飞书机器人实时推送</li>
      <li>数据延迟：≤ 30 秒</li>
    </ul>
  </ac:rich-text-body>
</ac:structured-macro>

<ac:structured-macro ac:name="note" ac:schema-version="1">
  <ac:rich-text-body>
    <p>📌 本仪表板由 PMO 团队维护，如需调整请联系张伟。</p>
  </ac:rich-text-body>
</ac:structured-macro>
```

### 8.4 子页面列表

```xml
<ac:structured-macro ac:name="children" ac:schema-version="1">
  <ac:parameter ac:name="parent">current</ac:parameter>
  <ac:parameter ac:name="sort">creation</ac:parameter>
  <ac:parameter ac:name="reverse">true</ac:parameter>
  <ac:parameter ac:name="excerpt">true</ac:parameter>
</ac:structured-macro>
```

---

## 🎨 9. 自定义 HTML 图表库

### 9.1 ZS 品牌色 CSS

```css
/* 复制到 Confluence 空间的 Look and Feel → Stylesheet */
:root {
  --zs-primary: #0A1929;     /* 深空蓝 */
  --zs-accent: #00D4FF;      /* 数字青 */
  --zs-success: #00C896;     /* 翠绿 */
  --zs-warning: #FFB800;     /* 琥珀 */
  --zs-danger: #FF4757;      /* 朱红 */
  --zs-gray: #8B92A9;        /* 雾灰 */
}

.zs-kpi-card {
  background: linear-gradient(135deg, #0A1929, #1A2942);
  color: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  font-family: 'Segoe UI', -apple-system, sans-serif;
  transition: transform 0.2s;
}

.zs-kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 212, 255, 0.2);
}

.zs-progress-bar {
  background: rgba(255,255,255,0.1);
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
}

.zs-progress-fill {
  background: linear-gradient(90deg, #00D4FF, #00C896);
  height: 100%;
  transition: width 0.5s ease;
}
```

### 9.2 甘特图（HTML + CSS 实现）

```html
<ac:structured-macro ac:name="html" ac:schema-version="1">
  <ac:plain-text-body><![CDATA[
<div class="gantt-container" style="background: white; padding: 20px; 
  border-radius: 12px; font-family: 'Segoe UI', sans-serif;">
  <h3 style="color: #0A1929; margin-top: 0;">📅 项目甘特图</h3>
  
  <div class="gantt-row" style="display: grid; 
    grid-template-columns: 120px repeat(12, 1fr); 
    gap: 4px; align-items: center; margin-bottom: 8px;">
    <div style="font-weight: bold; color: #555;">阶段</div>
    <div style="text-align: center; font-size: 10px; color: #888;">1月</div>
    <div style="text-align: center; font-size: 10px; color: #888;">2月</div>
    <div style="text-align: center; font-size: 10px; color: #888;">3月</div>
    <div style="text-align: center; font-size: 10px; color: #888;">4月</div>
    <div style="text-align: center; font-size: 10px; color: #888;">5月</div>
    <div style="text-align: center; font-size: 10px; color: #888;">6月</div>
    <div style="text-align: center; font-size: 10px; color: #888;">7月</div>
    <div style="text-align: center; font-size: 10px; color: #888;">8月</div>
    <div style="text-align: center; font-size: 10px; color: #888;">9月</div>
    <div style="text-align: center; font-size: 10px; color: #888;">10月</div>
    <div style="text-align: center; font-size: 10px; color: #888;">11月</div>
    <div style="text-align: center; font-size: 10px; color: #888;">12月</div>
  </div>
  
  <!-- M0 -->
  <div class="gantt-row" style="display: grid; 
    grid-template-columns: 120px repeat(12, 1fr); 
    gap: 4px; align-items: center; margin-bottom: 4px;">
    <div style="font-size: 13px;">M0 立项</div>
    <div style="grid-column: 1 / span 1; background: #00C896; 
      height: 24px; border-radius: 4px; color: white; 
      text-align: center; line-height: 24px; font-size: 11px;">✅ 100%</div>
    <div></div><div></div><div></div><div></div><div></div>
    <div></div><div></div><div></div><div></div><div></div><div></div>
  </div>
  
  <!-- M1 -->
  <div class="gantt-row" style="display: grid; 
    grid-template-columns: 120px repeat(12, 1fr); 
    gap: 4px; align-items: center; margin-bottom: 4px;">
    <div style="font-size: 13px;">M1 需求</div>
    <div></div><div></div><div></div>
    <div style="grid-column: 4 / span 1; background: linear-gradient(90deg, 
      #00C896 62%, #00D4FF 62%); height: 24px; border-radius: 4px; 
      color: white; text-align: center; line-height: 24px; font-size: 11px;">🔵 62%</div>
    <div></div><div></div><div></div><div></div><div></div>
    <div></div><div></div><div></div>
  </div>
  
  <!-- 重复 M2-M5... -->
  
</div>
  ]]></ac:plain-text-body>
</ac:structured-macro>
```

---

## 📋 10. 页面模板（Page Template）

### 10.1 创建项目周报模板

```yaml
Template Name: ZS-AI 周报模板
Space: ZS-AI
Page Type: Project Status Report

Header:
  - Page Properties:
      - 报告周: Week #
      - 报告人: PM
      - 报告日期: Date
      - 收件人: Stakeholders

Body Structure:
  1. Executive Summary (1 段)
  2. 关键指标 (4 个核心 KPI)
  3. 本周完成工作
  4. 下周计划
  5. 风险与阻碍
  6. 决策事项
  7. 附件
```

### 10.2 风险登记模板

```yaml
Template Name: 风险登记模板
Fields:
  - 风险 ID: R-##
  - 风险标题: 
  - 类别: [技术/业务/合规/人员/资源/外部]
  - 等级: [P0/P1/P2/P3]
  - 影响: [高/中/低]
  - 概率: [高/中/低]
  - 描述: 
  - 触发条件: 
  - 应对策略: 
  - 应急预案: 
  - 负责人: 
  - 状态: [监控中/处理中/已缓解/已关闭]
  - 通知渠道: [飞书/邮件/短信]
```

### 10.3 Sprint 评审模板

```yaml
Template Name: Sprint 评审模板
Fields:
  - Sprint 编号: Sprint ##
  - 时间: 
  - 参与人: 
  - 演示任务: 
  - 完成的用户故事: 
  - 未完成的原因: 
  - 团队反馈: 
  - 下个 Sprint 计划:
```

---

## 🔌 11. 集成与自动化

### 11.1 Confluence Automation 规则

```yaml
Rule 1: 风险升级自动通知
  Trigger: Page Property "风险等级" = P0
  Action:
    - Send Feishu message to "ZS-PMO-告警群"
    - @张伟 @李娜
    - Send email to stakeholders
    - Update parent page status

Rule 2: 仪表板数据每日归档
  Trigger: Schedule (每天 23:00)
  Action:
    - Copy dashboard page to "ZS-AI/archive/yyyy-mm-dd"
    - Export to PDF
    - Send to Notion mirror

Rule 3: Sprint 结束自动汇总
  Trigger: Sprint end date = today + 1
  Action:
    - Query Jira for completed tasks
    - Create Sprint review page
    - Notify all team members
```

### 11.2 Confluence CLI / REST API

```bash
# 创建仪表板页面
curl -X POST "https://zs-exchange.atlassian.net/wiki/rest/api/content" \
  -H "Authorization: Bearer ${CONFLUENCE_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "page",
    "title": "ZS-AI-Platform 项目执行仪表板",
    "space": {"key": "ZS-AI"},
    "body": {
      "storage": {
        "value": "<p>页面内容（包含宏）</p>",
        "representation": "storage"
      }
    }
  }'
```

---

## 📖 12. 使用示例

### 示例 1：每日站会

**步骤**：
1. 打开 Confluence `ZS-AI` Space
2. 进入「项目执行仪表板」页面
3. 查看页面顶部 KPI 概览（实时刷新）
4. 浏览 Sprint 燃尽图（{jirachart} 宏自动更新）
5. 检查风险告警面板（{warning} 宏显示 P0/P1）
6. 确认今日里程碑（{team-calendar} 宏）

**预期结果**：
- 5 分钟内完成站会所需信息收集
- 团队对齐当前状态与重点
- 识别需要立即解决的问题

### 示例 2：月度项目复盘

**步骤**：
1. 复制仪表板页面 → 创建 `2026-06 项目复盘`
2. 调整 Page Properties 标记为「复盘文档」
3. 在风险模块添加「经验教训」段落
4. 使用 {content-report-table} 拉取本月所有变更
5. 添加 {chart} 展示月度趋势对比
6. 邮件通知所有利益相关方

**预期结果**：
- 完整的月度项目复盘文档
- 数据可视化清晰呈现
- 为后续改进提供依据

---

## 📚 相关文档

- 📄 [项目执行仪表板（主文档）](./项目执行仪表板.md)
- 📄 [Notion 专用版本](./仪表板-Notion-版本.md)
- 📄 [KPI 指标定义表](./KPI指标定义表.md)
- 📄 [风险预警规则](./风险预警规则.md)
- 📄 [数据自动更新配置](./数据自动更新配置.md)

---

> **模板维护**：PMO + DevOps | **Confluence 版本**：v9.0+ | **兼容性**：Cloud / Data Center
