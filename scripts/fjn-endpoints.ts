/**
 * FJN 端点定义（共享数据源）
 *
 * 同时被以下两个脚本引用：
 *  - scripts/generate-fjn-openapi.ts  (生成 OpenAPI 3.0 规范 JSON)
 *  - scripts/generate-fjn-api-md.ts  (生成 Markdown API 文档)
 */

export interface EndpointDef {
  service: string;
  method: 'GET' | 'POST';
  action: string;
  summary: string;
  description: string;
  isAdmin: boolean;
  /** GET 端点专用 */
  pathParams?: string[];
  /** POST 端点专用 */
  bodyFields?: Array<{ name: string; type: string; required: boolean; description: string }>;
}

export const ENDPOINTS: EndpointDef[] = [
  // ============================================================
  // Revenue Service
  // ============================================================
  { service: 'revenue', method: 'GET', action: 'list', summary: '列出分账', description: '分页列出分账记录', isAdmin: false },
  { service: 'revenue', method: 'GET', action: 'detail', summary: '分账详情', description: '按 ID 查询分账详情', isAdmin: false, pathParams: ['id'] },
  { service: 'revenue', method: 'GET', action: 'pool-list', summary: '列出分账池', description: '列出所有分账池', isAdmin: false },
  { service: 'revenue', method: 'GET', action: 'ledger-list', summary: '列出账本流水', description: '分页列出账本流水', isAdmin: false },
  { service: 'revenue', method: 'GET', action: 'stats', summary: '统计概览', description: '分账统计概览', isAdmin: false },
  { service: 'revenue', method: 'GET', action: 'preview-369', summary: '预览 369 分账', description: '预览 369 分账结果（不落库）', isAdmin: false },
  { service: 'revenue', method: 'POST', action: 'allocate', summary: '触发分账', description: '管理员触发分账', isAdmin: true, bodyFields: [
    { name: 'orderId', type: 'string', required: true, description: '订单 ID' },
    { name: 'paidAmount', type: 'string', required: true, description: '已支付金额' },
    { name: 'currency', type: 'string', required: true, description: '币种' },
    { name: 'taxAmount', type: 'string', required: false, description: '税额' },
    { name: 'ruleVersion', type: 'string', required: false, description: '分账规则版本' },
  ] },
  { service: 'revenue', method: 'POST', action: 'settle', summary: '结算分账', description: '管理员审核结算分账', isAdmin: true, bodyFields: [
    { name: 'allocationId', type: 'string', required: true, description: '分账 ID' },
    { name: 'reviewerId', type: 'string', required: true, description: '审核人 ID' },
    { name: 'reviewNote', type: 'string', required: false, description: '审核意见' },
  ] },
  { service: 'revenue', method: 'POST', action: 'reverse', summary: '冲销分账', description: '管理员冲销分账', isAdmin: true, bodyFields: [
    { name: 'allocationId', type: 'string', required: true, description: '分账 ID' },
    { name: 'reason', type: 'string', required: true, description: '冲销原因' },
    { name: 'approvalId', type: 'string', required: false, description: '审批单 ID' },
  ] },

  // ============================================================
  // Referral Service
  // ============================================================
  { service: 'referral', method: 'GET', action: 'list', summary: '列出推荐奖励', description: '分页列出推荐奖励', isAdmin: false },
  { service: 'referral', method: 'GET', action: 'detail', summary: '推荐奖励详情', description: '按 ID 查询推荐奖励', isAdmin: false, pathParams: ['id'] },
  { service: 'referral', method: 'GET', action: 'rules', summary: '列出推荐规则', description: '列出所有推荐规则', isAdmin: false },
  { service: 'referral', method: 'GET', action: 'stats', summary: '推荐统计', description: '推荐业务统计概览', isAdmin: false },
  { service: 'referral', method: 'POST', action: 'create', summary: '创建推荐奖励', description: '创建推荐奖励', isAdmin: true },
  { service: 'referral', method: 'POST', action: 'approve', summary: '审核推荐奖励', description: '审核推荐奖励', isAdmin: true },
  { service: 'referral', method: 'POST', action: 'settle', summary: '结算推荐奖励', description: '结算推荐奖励', isAdmin: true },

  // ============================================================
  // Team Service
  // ============================================================
  { service: 'team', method: 'GET', action: 'list', summary: '列出团队奖励', description: '分页列出团队奖励', isAdmin: false },
  { service: 'team', method: 'GET', action: 'detail', summary: '团队奖励详情', description: '按 ID 查询团队奖励', isAdmin: false, pathParams: ['id'] },
  { service: 'team', method: 'GET', action: 'structure-list', summary: '列出团队结构', description: '列出所有团队结构', isAdmin: false },
  { service: 'team', method: 'GET', action: 'stats', summary: '团队统计', description: '团队业务统计', isAdmin: false },
  { service: 'team', method: 'GET', action: 'records', summary: '服务记录', description: '列出服务记录', isAdmin: false },
  { service: 'team', method: 'GET', action: 'reward-list', summary: '团队奖励列表', description: '按用户列出团队奖励', isAdmin: false },
  { service: 'team', method: 'GET', action: 'reward-detail', summary: '团队奖励详情', description: '按 ID 查询团队奖励', isAdmin: false, pathParams: ['id'] },
  { service: 'team', method: 'POST', action: 'create-structure', summary: '创建团队结构', description: '创建团队结构', isAdmin: true },
  { service: 'team', method: 'POST', action: 'create', summary: '创建团队奖励', description: '创建团队奖励', isAdmin: true },
  { service: 'team', method: 'POST', action: 'approve', summary: '审核团队奖励', description: '审核团队奖励', isAdmin: true },
  { service: 'team', method: 'POST', action: 'submit-record', summary: '提交服务记录', description: '提交服务记录', isAdmin: true },
  { service: 'team', method: 'POST', action: 'distribute', summary: '分发团队奖励', description: '分发团队奖励', isAdmin: true },
  { service: 'team', method: 'POST', action: 'settle', summary: '结算团队奖励', description: '结算团队奖励', isAdmin: true },

  // ============================================================
  // Node Service
  // ============================================================
  { service: 'node', method: 'GET', action: 'list', summary: '列出节点奖励', description: '分页列出节点奖励', isAdmin: false },
  { service: 'node', method: 'GET', action: 'detail', summary: '节点奖励详情', description: '按 ID 查询节点奖励', isAdmin: false, pathParams: ['id'] },
  { service: 'node', method: 'GET', action: 'rules', summary: '列出节点规则', description: '列出节点规则', isAdmin: false },
  { service: 'node', method: 'GET', action: 'rule-detail', summary: '节点规则详情', description: '按 ID 查询节点规则', isAdmin: false, pathParams: ['id'] },
  { service: 'node', method: 'GET', action: 'settlements', summary: '节点结算', description: '列出节点结算记录', isAdmin: false },
  { service: 'node', method: 'GET', action: 'settlement-detail', summary: '节点结算详情', description: '按 ID 查询节点结算', isAdmin: false, pathParams: ['id'] },
  { service: 'node', method: 'GET', action: 'claims', summary: '节点认领', description: '列出节点认领记录', isAdmin: false },
  { service: 'node', method: 'GET', action: 'claim-detail', summary: '节点认领详情', description: '按 ID 查询节点认领', isAdmin: false, pathParams: ['id'] },
  { service: 'node', method: 'GET', action: 'events', summary: '节点事件', description: '列出节点事件', isAdmin: false },
  { service: 'node', method: 'GET', action: 'event-detail', summary: '节点事件详情', description: '按 ID 查询节点事件', isAdmin: false, pathParams: ['id'] },
  { service: 'node', method: 'GET', action: 'stats', summary: '节点统计', description: '节点业务统计', isAdmin: false },
  { service: 'node', method: 'GET', action: 'scores', summary: '节点分数', description: '按节点列出分数', isAdmin: false },
  { service: 'node', method: 'GET', action: 'score-detail', summary: '节点分数详情', description: '按 ID 查询节点分数', isAdmin: false, pathParams: ['id'] },
  { service: 'node', method: 'GET', action: 'history', summary: '节点历史', description: '节点历史变更', isAdmin: false },
  { service: 'node', method: 'POST', action: 'rule-create', summary: '创建节点规则', description: '创建节点规则', isAdmin: true },
  { service: 'node', method: 'POST', action: 'rule-update', summary: '更新节点规则', description: '更新节点规则', isAdmin: true },
  { service: 'node', method: 'POST', action: 'rule-archive', summary: '归档节点规则', description: '归档节点规则', isAdmin: true },
  { service: 'node', method: 'POST', action: 'event-record', summary: '记录节点事件', description: '记录节点事件', isAdmin: true },
  { service: 'node', method: 'POST', action: 'reward-create', summary: '创建节点奖励', description: '创建节点奖励', isAdmin: true },
  { service: 'node', method: 'POST', action: 'reward-approve', summary: '审核节点奖励', description: '审核节点奖励', isAdmin: true },
  { service: 'node', method: 'POST', action: 'reward-settle', summary: '结算节点奖励', description: '结算节点奖励', isAdmin: true },
  { service: 'node', method: 'POST', action: 'claim-create', summary: '创建节点认领', description: '创建节点认领', isAdmin: true },
  { service: 'node', method: 'POST', action: 'claim-approve', summary: '审核节点认领', description: '审核节点认领', isAdmin: true },
  { service: 'node', method: 'POST', action: 'claim-reject', summary: '驳回节点认领', description: '驳回节点认领', isAdmin: true },
  { service: 'node', method: 'POST', action: 'settlement-create', summary: '创建节点结算', description: '创建节点结算', isAdmin: true },
  { service: 'node', method: 'POST', action: 'settlement-pay', summary: '支付节点结算', description: '支付节点结算', isAdmin: true },
  { service: 'node', method: 'POST', action: 'score-update', summary: '更新节点分数', description: '更新节点分数', isAdmin: true },

  // ============================================================
  // Finance Service
  // ============================================================
  { service: 'finance', method: 'GET', action: 'account-list', summary: '列出账户', description: '分页列出财务账户', isAdmin: false },
  { service: 'finance', method: 'GET', action: 'account-detail', summary: '账户详情', description: '按 ID 查询账户', isAdmin: false, pathParams: ['id'] },
  { service: 'finance', method: 'GET', action: 'ledger-list', summary: '列出流水', description: '分页列出财务流水', isAdmin: false },
  { service: 'finance', method: 'GET', action: 'ledger-detail', summary: '流水详情', description: '按 ID 查询流水', isAdmin: false, pathParams: ['id'] },
  { service: 'finance', method: 'GET', action: 'settlement-list', summary: '列出结算单', description: '分页列出结算单', isAdmin: false },
  { service: 'finance', method: 'GET', action: 'settlement-detail', summary: '结算单详情', description: '按 ID 查询结算单（含 items）', isAdmin: false, pathParams: ['id'] },
  { service: 'finance', method: 'GET', action: 'summary-account', summary: '账户汇总', description: '按 currency/accountType 汇总账户', isAdmin: false },
  { service: 'finance', method: 'GET', action: 'summary-ledger', summary: '流水汇总', description: '按 accountType+direction 汇总流水', isAdmin: false },
  { service: 'finance', method: 'GET', action: 'pools', summary: '369 池子列表', description: '列出 369 三个池子 + 应付/准备金', isAdmin: false },
  { service: 'finance', method: 'POST', action: 'account-create', summary: '创建账户', description: '创建财务账户', isAdmin: true, bodyFields: [
    { name: 'accountName', type: 'string', required: true, description: '账户名' },
    { name: 'accountType', type: 'string', required: true, description: '账户类型' },
    { name: 'currency', type: 'string', required: true, description: '币种' },
  ] },
  { service: 'finance', method: 'POST', action: 'account-freeze', summary: '冻结账户', description: '冻结财务账户', isAdmin: true, bodyFields: [
    { name: 'id', type: 'string', required: true, description: '账户 ID' },
    { name: 'reason', type: 'string', required: true, description: '冻结原因' },
  ] },
  { service: 'finance', method: 'POST', action: 'account-unfreeze', summary: '解冻账户', description: '解冻财务账户', isAdmin: true, bodyFields: [
    { name: 'id', type: 'string', required: true, description: '账户 ID' },
    { name: 'reason', type: 'string', required: true, description: '解冻原因' },
  ] },
  { service: 'finance', method: 'POST', action: 'account-close', summary: '关闭账户', description: '关闭财务账户', isAdmin: true, bodyFields: [
    { name: 'id', type: 'string', required: true, description: '账户 ID' },
    { name: 'reason', type: 'string', required: true, description: '关闭原因' },
  ] },
  { service: 'finance', method: 'POST', action: 'ledger-post', summary: '入账', description: '入账（核心）', isAdmin: true, bodyFields: [
    { name: 'accountType', type: 'string', required: true, description: '账户类型' },
    { name: 'businessType', type: 'string', required: true, description: '业务类型' },
    { name: 'direction', type: 'string', required: true, description: '方向 (in/out)' },
    { name: 'amount', type: 'string', required: true, description: '金额（Decimal 字符串）' },
    { name: 'currency', type: 'string', required: true, description: '币种' },
    { name: 'sourceType', type: 'string', required: true, description: '来源类型' },
    { name: 'sourceId', type: 'string', required: true, description: '来源 ID' },
  ] },
  { service: 'finance', method: 'POST', action: 'ledger-reverse', summary: '冲销流水', description: '冲销财务流水', isAdmin: true, bodyFields: [
    { name: 'id', type: 'string', required: true, description: '流水 ID' },
    { name: 'reason', type: 'string', required: true, description: '冲销原因' },
  ] },
  { service: 'finance', method: 'POST', action: 'ledger-void', summary: '作废流水', description: '作废财务流水', isAdmin: true, bodyFields: [
    { name: 'id', type: 'string', required: true, description: '流水 ID' },
    { name: 'reason', type: 'string', required: true, description: '作废原因' },
  ] },
  { service: 'finance', method: 'POST', action: 'revenue-recognize-369', summary: '369 收入确认', description: '369 分账入账 40:30:30', isAdmin: true, bodyFields: [
    { name: 'orderId', type: 'string', required: true, description: '订单 ID' },
    { name: 'userId', type: 'string', required: true, description: '用户 ID' },
    { name: 'currency', type: 'string', required: true, description: '币种' },
    { name: 'totalAmount', type: 'string', required: true, description: '总金额' },
    { name: 'sourceId', type: 'string', required: true, description: '来源 ID' },
  ] },
  { service: 'finance', method: 'POST', action: 'pools-initialize', summary: '初始化 369 池子', description: '初始化 369 三个池子', isAdmin: true, bodyFields: [
    { name: 'currency', type: 'string', required: false, description: '币种（默认 CNY）' },
  ] },
  { service: 'finance', method: 'POST', action: 'settlement-create', summary: '创建结算单', description: '创建财务结算单', isAdmin: true, bodyFields: [
    { name: 'settlementType', type: 'string', required: true, description: '结算类型' },
    { name: 'period', type: 'string', required: true, description: '结算周期 (YYYY-MM)' },
    { name: 'currency', type: 'string', required: true, description: '币种' },
  ] },
  { service: 'finance', method: 'POST', action: 'settlement-add-item', summary: '添加结算条目', description: '添加结算条目', isAdmin: true, bodyFields: [
    { name: 'settlementId', type: 'string', required: true, description: '结算单 ID' },
    { name: 'amount', type: 'string', required: true, description: '金额' },
  ] },
  { service: 'finance', method: 'POST', action: 'settlement-approve', summary: '审核结算单', description: '审核财务结算单', isAdmin: true, bodyFields: [
    { name: 'id', type: 'string', required: true, description: '结算单 ID' },
    { name: 'approverId', type: 'string', required: true, description: '审核人 ID' },
  ] },
  { service: 'finance', method: 'POST', action: 'settlement-pay', summary: '支付结算单', description: '支付财务结算单', isAdmin: true, bodyFields: [
    { name: 'id', type: 'string', required: true, description: '结算单 ID' },
    { name: 'paidAt', type: 'string', required: false, description: '支付时间（ISO 8601）' },
  ] },
  { service: 'finance', method: 'POST', action: 'settlement-cancel', summary: '取消结算单', description: '取消财务结算单', isAdmin: true, bodyFields: [
    { name: 'id', type: 'string', required: true, description: '结算单 ID' },
    { name: 'reason', type: 'string', required: true, description: '取消原因' },
  ] },

  // ============================================================
  // Tax Service
  // ============================================================
  { service: 'tax', method: 'GET', action: 'rule-list', summary: '列出规则', description: '分页列出税务规则', isAdmin: false },
  { service: 'tax', method: 'GET', action: 'rule-detail', summary: '规则详情', description: '按 ID 查询税务规则', isAdmin: false, pathParams: ['id'] },
  { service: 'tax', method: 'GET', action: 'rule-active', summary: '激活规则', description: '按 ruleCode+regionCode 查激活规则', isAdmin: false },
  { service: 'tax', method: 'GET', action: 'record-list', summary: '列出记录', description: '分页列出税务记录', isAdmin: false },
  { service: 'tax', method: 'GET', action: 'record-detail', summary: '记录详情', description: '按 ID 查询税务记录', isAdmin: false, pathParams: ['id'] },
  { service: 'tax', method: 'GET', action: 'report-list', summary: '列出报表', description: '分页列出税务报表', isAdmin: false },
  { service: 'tax', method: 'GET', action: 'report-detail', summary: '报表详情', description: '按 ID 查询税务报表', isAdmin: false, pathParams: ['id'] },
  { service: 'tax', method: 'POST', action: 'calculate', summary: '计算税额', description: '纯计算税额（不落库）', isAdmin: false, bodyFields: [
    { name: 'taxableAmount', type: 'string', required: true, description: '应税金额' },
    { name: 'currency', type: 'string', required: true, description: '币种' },
    { name: 'taxMode', type: 'string', required: true, description: '计税模式 (inclusive/exclusive)' },
  ] },
  { service: 'tax', method: 'POST', action: 'rule-create', summary: '创建规则', description: '创建税务规则', isAdmin: true, bodyFields: [
    { name: 'ruleCode', type: 'string', required: true, description: '规则代码' },
    { name: 'taxType', type: 'string', required: true, description: '税种' },
    { name: 'regionCode', type: 'string', required: true, description: '地区代码' },
    { name: 'taxRate', type: 'string', required: true, description: '税率（0.13 = 13%）' },
    { name: 'effectiveFrom', type: 'string', required: true, description: '生效日期' },
  ] },
  { service: 'tax', method: 'POST', action: 'rule-update', summary: '更新规则', description: '更新税务规则', isAdmin: true, bodyFields: [
    { name: 'id', type: 'string', required: true, description: '规则 ID' },
  ] },
  { service: 'tax', method: 'POST', action: 'rule-archive', summary: '归档规则', description: '归档税务规则', isAdmin: true, bodyFields: [
    { name: 'id', type: 'string', required: true, description: '规则 ID' },
    { name: 'reason', type: 'string', required: true, description: '归档原因' },
  ] },
  { service: 'tax', method: 'POST', action: 'rule-deactivate', summary: '停用规则', description: '停用税务规则', isAdmin: true, bodyFields: [
    { name: 'id', type: 'string', required: true, description: '规则 ID' },
  ] },
  { service: 'tax', method: 'POST', action: 'record-create', summary: '记录税务', description: '记录税务', isAdmin: true, bodyFields: [
    { name: 'ruleId', type: 'string', required: true, description: '规则 ID' },
    { name: 'sourceType', type: 'string', required: true, description: '来源类型' },
    { name: 'sourceId', type: 'string', required: true, description: '来源 ID' },
    { name: 'taxableAmount', type: 'string', required: true, description: '应税金额' },
  ] },
  { service: 'tax', method: 'POST', action: 'record-mark-paid', summary: '标记记录已支付', description: '标记记录已支付', isAdmin: true, bodyFields: [
    { name: 'id', type: 'string', required: true, description: '记录 ID' },
  ] },
  { service: 'tax', method: 'POST', action: 'record-adjust', summary: '调整记录', description: '调整税务记录', isAdmin: true, bodyFields: [
    { name: 'id', type: 'string', required: true, description: '记录 ID' },
    { name: 'adjustedTaxableAmount', type: 'string', required: true, description: '调整后应税金额' },
    { name: 'adjustedTaxRate', type: 'string', required: true, description: '调整后税率' },
    { name: 'reason', type: 'string', required: true, description: '调整原因' },
  ] },
  { service: 'tax', method: 'POST', action: 'record-reverse', summary: '冲销记录', description: '冲销税务记录', isAdmin: true, bodyFields: [
    { name: 'id', type: 'string', required: true, description: '记录 ID' },
    { name: 'reason', type: 'string', required: true, description: '冲销原因' },
  ] },
  { service: 'tax', method: 'POST', action: 'report-create', summary: '创建报表', description: '创建税务报表', isAdmin: true, bodyFields: [
    { name: 'regionCode', type: 'string', required: true, description: '地区代码' },
    { name: 'reportPeriod', type: 'string', required: true, description: '报表周期 (YYYY-MM)' },
    { name: 'taxType', type: 'string', required: true, description: '税种' },
  ] },
  { service: 'tax', method: 'POST', action: 'report-submit', summary: '提交报表', description: '提交税务报表', isAdmin: true, bodyFields: [
    { name: 'id', type: 'string', required: true, description: '报表 ID' },
    { name: 'approverId', type: 'string', required: true, description: '审核人 ID' },
  ] },
  { service: 'tax', method: 'POST', action: 'report-mark-paid', summary: '标记报表已支付', description: '标记报表已支付', isAdmin: true, bodyFields: [
    { name: 'id', type: 'string', required: true, description: '报表 ID' },
  ] },
  { service: 'tax', method: 'POST', action: 'report-reject', summary: '驳回报表', description: '驳回税务报表', isAdmin: true, bodyFields: [
    { name: 'id', type: 'string', required: true, description: '报表 ID' },
    { name: 'reason', type: 'string', required: true, description: '驳回原因' },
  ] },

  // ============================================================
  // Risk Service
  // ============================================================
  { service: 'risk', method: 'GET', action: 'rule-list', summary: '列出规则', description: '分页列出风险规则', isAdmin: false },
  { service: 'risk', method: 'GET', action: 'rule-detail', summary: '规则详情', description: '按 ID 查询风险规则', isAdmin: false, pathParams: ['id'] },
  { service: 'risk', method: 'GET', action: 'rule-by-code', summary: '按 code 查规则', description: '按 ruleCode 查询风险规则', isAdmin: false },
  { service: 'risk', method: 'GET', action: 'event-list', summary: '列出事件', description: '分页列出风险事件', isAdmin: false },
  { service: 'risk', method: 'GET', action: 'event-detail', summary: '事件详情', description: '按 ID 查询风险事件', isAdmin: false, pathParams: ['id'] },
  { service: 'risk', method: 'GET', action: 'case-list', summary: '列出案件', description: '分页列出风险案件', isAdmin: false },
  { service: 'risk', method: 'GET', action: 'case-detail', summary: '案件详情', description: '按 ID 查询风险案件', isAdmin: false, pathParams: ['id'] },
  { service: 'risk', method: 'GET', action: 'score-list', summary: '用户分数历史', description: '按 userId 列出分数历史', isAdmin: false },
  { service: 'risk', method: 'GET', action: 'score-latest', summary: '最新分数', description: '按 userId+scoreType 查最新分数', isAdmin: false },
  { service: 'risk', method: 'GET', action: 'blacklist-list', summary: '列出黑名单', description: '分页列出黑名单', isAdmin: false },
  { service: 'risk', method: 'GET', action: 'blacklist-check', summary: '检查黑名单', description: '检查 category+value 是否在黑名单', isAdmin: false },
  { service: 'risk', method: 'GET', action: 'device-list', summary: '列出设备', description: '分页列出设备指纹', isAdmin: false },
  { service: 'risk', method: 'GET', action: 'device-by-fingerprint', summary: '按指纹查设备', description: '按 fingerprint 查询设备', isAdmin: false },
  { service: 'risk', method: 'POST', action: 'rule-create', summary: '创建规则', description: '创建风险规则', isAdmin: true, bodyFields: [
    { name: 'ruleCode', type: 'string', required: true, description: '规则代码' },
    { name: 'ruleName', type: 'string', required: true, description: '规则名称' },
    { name: 'ruleType', type: 'string', required: true, description: '规则类型' },
    { name: 'riskLevel', type: 'string', required: true, description: '风险等级' },
    { name: 'action', type: 'string', required: true, description: '动作' },
    { name: 'ruleConfig', type: 'object', required: true, description: '规则配置' },
  ] },
  { service: 'risk', method: 'POST', action: 'rule-update', summary: '更新规则', description: '更新风险规则', isAdmin: true, bodyFields: [
    { name: 'id', type: 'string', required: true, description: '规则 ID' },
  ] },
  { service: 'risk', method: 'POST', action: 'rule-enable', summary: '启用规则', description: '启用风险规则', isAdmin: true, bodyFields: [
    { name: 'id', type: 'string', required: true, description: '规则 ID' },
  ] },
  { service: 'risk', method: 'POST', action: 'rule-disable', summary: '禁用规则', description: '禁用风险规则', isAdmin: true, bodyFields: [
    { name: 'id', type: 'string', required: true, description: '规则 ID' },
  ] },
  { service: 'risk', method: 'POST', action: 'event-record', summary: '记录事件', description: '记录风险事件', isAdmin: true, bodyFields: [
    { name: 'eventType', type: 'string', required: true, description: '事件类型' },
    { name: 'riskScore', type: 'number', required: true, description: '风险分数' },
  ] },
  { service: 'risk', method: 'POST', action: 'event-review', summary: '审核事件', description: '审核风险事件', isAdmin: true, bodyFields: [
    { name: 'id', type: 'string', required: true, description: '事件 ID' },
    { name: 'reviewerId', type: 'string', required: true, description: '审核人 ID' },
  ] },
  { service: 'risk', method: 'POST', action: 'event-resolve', summary: '解决事件', description: '解决风险事件', isAdmin: true, bodyFields: [
    { name: 'id', type: 'string', required: true, description: '事件 ID' },
    { name: 'resolution', type: 'string', required: true, description: '解决方案' },
  ] },
  { service: 'risk', method: 'POST', action: 'event-escalate', summary: '升级事件', description: '升级风险事件', isAdmin: true, bodyFields: [
    { name: 'id', type: 'string', required: true, description: '事件 ID' },
    { name: 'reason', type: 'string', required: true, description: '升级原因' },
    { name: 'targetLevel', type: 'string', required: true, description: '目标等级' },
  ] },
  { service: 'risk', method: 'POST', action: 'case-open', summary: '开案', description: '开风险案件', isAdmin: true, bodyFields: [
    { name: 'userId', type: 'string', required: true, description: '用户 ID' },
    { name: 'caseType', type: 'string', required: true, description: '案件类型' },
    { name: 'riskLevel', type: 'string', required: true, description: '风险等级' },
  ] },
  { service: 'risk', method: 'POST', action: 'case-assign', summary: '分派案件', description: '分派风险案件', isAdmin: true, bodyFields: [
    { name: 'id', type: 'string', required: true, description: '案件 ID' },
    { name: 'assignedTo', type: 'string', required: true, description: '分派人 ID' },
  ] },
  { service: 'risk', method: 'POST', action: 'case-resolve', summary: '解决案件', description: '解决风险案件', isAdmin: true, bodyFields: [
    { name: 'id', type: 'string', required: true, description: '案件 ID' },
    { name: 'resolution', type: 'string', required: true, description: '解决方案' },
    { name: 'action', type: 'string', required: true, description: '动作' },
  ] },
  { service: 'risk', method: 'POST', action: 'case-close', summary: '关闭案件', description: '关闭风险案件', isAdmin: true, bodyFields: [
    { name: 'id', type: 'string', required: true, description: '案件 ID' },
    { name: 'resolution', type: 'string', required: true, description: '解决方案' },
  ] },
  { service: 'risk', method: 'POST', action: 'case-reopen', summary: '重开案件', description: '重开风险案件', isAdmin: true, bodyFields: [
    { name: 'id', type: 'string', required: true, description: '案件 ID' },
    { name: 'reason', type: 'string', required: true, description: '重开原因' },
  ] },
  { service: 'risk', method: 'POST', action: 'score-update', summary: '更新分数', description: '更新风险分数', isAdmin: true, bodyFields: [
    { name: 'userId', type: 'string', required: true, description: '用户 ID' },
    { name: 'scoreType', type: 'string', required: true, description: '分数类型' },
    { name: 'score', type: 'number', required: true, description: '分数' },
  ] },
  { service: 'risk', method: 'POST', action: 'blacklist-add', summary: '添加黑名单', description: '添加黑名单', isAdmin: true, bodyFields: [
    { name: 'category', type: 'string', required: true, description: '分类' },
    { name: 'value', type: 'string', required: true, description: '值' },
    { name: 'reason', type: 'string', required: true, description: '原因' },
  ] },
  { service: 'risk', method: 'POST', action: 'blacklist-remove', summary: '移除黑名单', description: '移除黑名单', isAdmin: true, bodyFields: [
    { name: 'id', type: 'string', required: true, description: '黑名单 ID' },
    { name: 'reason', type: 'string', required: true, description: '原因' },
  ] },
  { service: 'risk', method: 'POST', action: 'blacklist-expire', summary: '扫描过期黑名单', description: '扫描过期黑名单', isAdmin: true },
  { service: 'risk', method: 'POST', action: 'device-register', summary: '注册设备', description: '注册设备指纹', isAdmin: true, bodyFields: [
    { name: 'fingerprint', type: 'string', required: true, description: '设备指纹' },
  ] },
];
