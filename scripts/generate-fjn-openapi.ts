/**
 * FJN OpenAPI 3.0 规范生成器
 *
 * 扫描 11 个 FJN Service 的 REST API 路由，生成符合 OpenAPI 3.0 规范的 JSON
 * 输出：docs/openapi/fjn-openapi.json
 *
 * 设计：
 *  - 端点路径：/api/v1/fjn/{service}
 *  - action 查询参数路由
 *  - GET 用 withAuth（需 JWT）
 *  - POST 用 withAdminAuth（需 JWT + admin 角色）
 *  - 错误码遵循 FjnError 体系
 *
 * 覆盖服务（11 个，228 端点）：
 *  - 阶段C+F (7)：revenue / referral / team / node / finance / tax / risk
 *  - 阶段I (4)：kyc / permission / region / device
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// === OpenAPI server 配置（可被环境变量覆盖）===
const OPENAPI_DEV_URL = process.env.OPENAPI_DEV_URL || 'http://localhost:3200';
const OPENAPI_PROD_URL = process.env.OPENAPI_PROD_URL || 'https://api.zs-exchange.com';

interface OpenAPIDocument {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
    contact?: { name: string; email?: string };
  };
  servers: Array<{ url: string; description: string }>;
  tags: Array<{ name: string; description: string }>;
  paths: Record<string, PathItem>;
  components: {
    securitySchemes: Record<string, SecurityScheme>;
    schemas: Record<string, Schema>;
    responses: Record<string, Response>;
    parameters: Record<string, Parameter>;
  };
}

interface PathItem {
  get?: Operation;
  post?: Operation;
}

interface Operation {
  tags: string[];
  summary: string;
  description: string;
  operationId: string;
  security: Array<Record<string, string[]>>;
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, Response>;
}

interface Parameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  description?: string;
  required?: boolean;
  schema: Schema | { type: string; enum?: string[]; default?: unknown };
}

interface RequestBody {
  required: boolean;
  content: Record<string, { schema: Schema | { $ref: string } }>;
}

interface Response {
  description: string;
  content?: Record<string, { schema: Schema | { $ref: string } }>;
}

interface SecurityScheme {
  type: 'http' | 'apiKey' | 'oauth2' | 'openIdConnect';
  scheme?: string;
  bearerFormat?: string;
  in?: 'query' | 'header' | 'cookie';
  name?: string;
  description?: string;
}

interface Schema {
  type?: string;
  format?: string;
  description?: string;
  properties?: Record<string, Schema | { type: string; description?: string; example?: unknown }>;
  required?: string[];
  items?: Schema | { $ref: string };
  enum?: string[];
  example?: unknown;
  $ref?: string;
  nullable?: boolean;
}

// ============================================================
// 通用 Schemas
// ============================================================

const StandardResponse = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    code: { type: 'integer', example: 0 },
    message: { type: 'string', example: 'OK' },
    data: { type: 'object', description: '业务数据' },
  },
  required: ['success', 'code', 'message'],
};

const ErrorResponse = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    code: { type: 'integer', example: 400 },
    message: { type: 'string', example: 'Bad request' },
    data: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'FINANCE_ACCOUNT_NOT_FOUND' },
        context: { type: 'object' },
      },
    },
  },
  required: ['success', 'code', 'message'],
};

const PaginationParams = {
  type: 'object',
  properties: {
    page: { type: 'integer', default: 1, description: '页码' },
    pageSize: { type: 'integer', default: 20, description: '每页数量' },
  },
};

// ============================================================
// Service 端点定义
// ============================================================

interface EndpointDef {
  service: string;
  method: 'GET' | 'POST';
  action: string;
  summary: string;
  description: string;
  isAdmin: boolean;
  requestSchema?: Record<string, unknown>;
}

const ENDPOINTS: EndpointDef[] = [
  // ============================================================
  // Revenue Service
  // ============================================================
  { service: 'revenue', method: 'GET', action: 'list', summary: '列出分账', description: '分页列出分账记录', isAdmin: false },
  { service: 'revenue', method: 'GET', action: 'detail', summary: '分账详情', description: '按 ID 查询分账详情', isAdmin: false },
  { service: 'revenue', method: 'GET', action: 'pool-list', summary: '列出分账池', description: '列出所有分账池', isAdmin: false },
  { service: 'revenue', method: 'GET', action: 'ledger-list', summary: '列出账本流水', description: '分页列出账本流水', isAdmin: false },
  { service: 'revenue', method: 'GET', action: 'stats', summary: '统计概览', description: '分账统计概览', isAdmin: false },
  { service: 'revenue', method: 'GET', action: 'preview-369', summary: '预览 369 分账', description: '预览 369 分账结果（不落库）', isAdmin: false },
  { service: 'revenue', method: 'POST', action: 'allocate', summary: '触发分账', description: '管理员触发分账（admin）', isAdmin: true },
  { service: 'revenue', method: 'POST', action: 'settle', summary: '结算分账', description: '管理员审核结算分账（admin）', isAdmin: true },
  { service: 'revenue', method: 'POST', action: 'reverse', summary: '冲销分账', description: '管理员冲销分账（admin）', isAdmin: true },

  // ============================================================
  // Referral Service
  // ============================================================
  { service: 'referral', method: 'GET', action: 'list', summary: '列出推荐奖励', description: '分页列出推荐奖励', isAdmin: false },
  { service: 'referral', method: 'GET', action: 'detail', summary: '推荐奖励详情', description: '按 ID 查询推荐奖励', isAdmin: false },
  { service: 'referral', method: 'GET', action: 'rules', summary: '列出推荐规则', description: '列出所有推荐规则', isAdmin: false },
  { service: 'referral', method: 'GET', action: 'stats', summary: '推荐统计', description: '推荐业务统计概览', isAdmin: false },
  { service: 'referral', method: 'POST', action: 'create', summary: '创建推荐奖励', description: '创建推荐奖励（admin）', isAdmin: true },
  { service: 'referral', method: 'POST', action: 'approve', summary: '审核推荐奖励', description: '审核推荐奖励（admin）', isAdmin: true },
  { service: 'referral', method: 'POST', action: 'settle', summary: '结算推荐奖励', description: '结算推荐奖励（admin）', isAdmin: true },

  // ============================================================
  // Team Service
  // ============================================================
  { service: 'team', method: 'GET', action: 'list', summary: '列出团队奖励', description: '分页列出团队奖励', isAdmin: false },
  { service: 'team', method: 'GET', action: 'detail', summary: '团队奖励详情', description: '按 ID 查询团队奖励', isAdmin: false },
  { service: 'team', method: 'GET', action: 'structure-list', summary: '列出团队结构', description: '列出所有团队结构', isAdmin: false },
  { service: 'team', method: 'GET', action: 'stats', summary: '团队统计', description: '团队业务统计', isAdmin: false },
  { service: 'team', method: 'GET', action: 'records', summary: '服务记录', description: '列出服务记录', isAdmin: false },
  { service: 'team', method: 'GET', action: 'reward-list', summary: '团队奖励列表', description: '按用户列出团队奖励', isAdmin: false },
  { service: 'team', method: 'GET', action: 'reward-detail', summary: '团队奖励详情', description: '按 ID 查询团队奖励', isAdmin: false },
  { service: 'team', method: 'POST', action: 'create-structure', summary: '创建团队结构', description: '创建团队结构（admin）', isAdmin: true },
  { service: 'team', method: 'POST', action: 'create', summary: '创建团队奖励', description: '创建团队奖励（admin）', isAdmin: true },
  { service: 'team', method: 'POST', action: 'approve', summary: '审核团队奖励', description: '审核团队奖励（admin）', isAdmin: true },
  { service: 'team', method: 'POST', action: 'submit-record', summary: '提交服务记录', description: '提交服务记录（admin）', isAdmin: true },
  { service: 'team', method: 'POST', action: 'distribute', summary: '分发团队奖励', description: '分发团队奖励（admin）', isAdmin: true },
  { service: 'team', method: 'POST', action: 'settle', summary: '结算团队奖励', description: '结算团队奖励（admin）', isAdmin: true },

  // ============================================================
  // Node Service
  // ============================================================
  { service: 'node', method: 'GET', action: 'list', summary: '列出节点奖励', description: '分页列出节点奖励', isAdmin: false },
  { service: 'node', method: 'GET', action: 'detail', summary: '节点奖励详情', description: '按 ID 查询节点奖励', isAdmin: false },
  { service: 'node', method: 'GET', action: 'rules', summary: '列出节点规则', description: '列出节点规则', isAdmin: false },
  { service: 'node', method: 'GET', action: 'rule-detail', summary: '节点规则详情', description: '按 ID 查询节点规则', isAdmin: false },
  { service: 'node', method: 'GET', action: 'settlements', summary: '节点结算', description: '列出节点结算记录', isAdmin: false },
  { service: 'node', method: 'GET', action: 'settlement-detail', summary: '节点结算详情', description: '按 ID 查询节点结算', isAdmin: false },
  { service: 'node', method: 'GET', action: 'claims', summary: '节点认领', description: '列出节点认领记录', isAdmin: false },
  { service: 'node', method: 'GET', action: 'claim-detail', summary: '节点认领详情', description: '按 ID 查询节点认领', isAdmin: false },
  { service: 'node', method: 'GET', action: 'events', summary: '节点事件', description: '列出节点事件', isAdmin: false },
  { service: 'node', method: 'GET', action: 'event-detail', summary: '节点事件详情', description: '按 ID 查询节点事件', isAdmin: false },
  { service: 'node', method: 'GET', action: 'stats', summary: '节点统计', description: '节点业务统计', isAdmin: false },
  { service: 'node', method: 'GET', action: 'scores', summary: '节点分数', description: '按节点列出分数', isAdmin: false },
  { service: 'node', method: 'GET', action: 'score-detail', summary: '节点分数详情', description: '按 ID 查询节点分数', isAdmin: false },
  { service: 'node', method: 'GET', action: 'history', summary: '节点历史', description: '节点历史变更', isAdmin: false },
  { service: 'node', method: 'POST', action: 'rule-create', summary: '创建节点规则', description: '创建节点规则（admin）', isAdmin: true },
  { service: 'node', method: 'POST', action: 'rule-update', summary: '更新节点规则', description: '更新节点规则（admin）', isAdmin: true },
  { service: 'node', method: 'POST', action: 'rule-archive', summary: '归档节点规则', description: '归档节点规则（admin）', isAdmin: true },
  { service: 'node', method: 'POST', action: 'event-record', summary: '记录节点事件', description: '记录节点事件（admin）', isAdmin: true },
  { service: 'node', method: 'POST', action: 'reward-create', summary: '创建节点奖励', description: '创建节点奖励（admin）', isAdmin: true },
  { service: 'node', method: 'POST', action: 'reward-approve', summary: '审核节点奖励', description: '审核节点奖励（admin）', isAdmin: true },
  { service: 'node', method: 'POST', action: 'reward-settle', summary: '结算节点奖励', description: '结算节点奖励（admin）', isAdmin: true },
  { service: 'node', method: 'POST', action: 'claim-create', summary: '创建节点认领', description: '创建节点认领（admin）', isAdmin: true },
  { service: 'node', method: 'POST', action: 'claim-approve', summary: '审核节点认领', description: '审核节点认领（admin）', isAdmin: true },
  { service: 'node', method: 'POST', action: 'claim-reject', summary: '驳回节点认领', description: '驳回节点认领（admin）', isAdmin: true },
  { service: 'node', method: 'POST', action: 'settlement-create', summary: '创建节点结算', description: '创建节点结算（admin）', isAdmin: true },
  { service: 'node', method: 'POST', action: 'settlement-pay', summary: '支付节点结算', description: '支付节点结算（admin）', isAdmin: true },
  { service: 'node', method: 'POST', action: 'score-update', summary: '更新节点分数', description: '更新节点分数（admin）', isAdmin: true },

  // ============================================================
  // Finance Service
  // ============================================================
  { service: 'finance', method: 'GET', action: 'account-list', summary: '列出账户', description: '分页列出财务账户', isAdmin: false },
  { service: 'finance', method: 'GET', action: 'account-detail', summary: '账户详情', description: '按 ID 查询账户', isAdmin: false },
  { service: 'finance', method: 'GET', action: 'ledger-list', summary: '列出流水', description: '分页列出财务流水', isAdmin: false },
  { service: 'finance', method: 'GET', action: 'ledger-detail', summary: '流水详情', description: '按 ID 查询流水', isAdmin: false },
  { service: 'finance', method: 'GET', action: 'settlement-list', summary: '列出结算单', description: '分页列出结算单', isAdmin: false },
  { service: 'finance', method: 'GET', action: 'settlement-detail', summary: '结算单详情', description: '按 ID 查询结算单（含 items）', isAdmin: false },
  { service: 'finance', method: 'GET', action: 'summary-account', summary: '账户汇总', description: '按 currency/accountType 汇总账户', isAdmin: false },
  { service: 'finance', method: 'GET', action: 'summary-ledger', summary: '流水汇总', description: '按 accountType+direction 汇总流水', isAdmin: false },
  { service: 'finance', method: 'GET', action: 'pools', summary: '369 池子列表', description: '列出 369 三个池子 + 应付/准备金', isAdmin: false },
  { service: 'finance', method: 'POST', action: 'account-create', summary: '创建账户', description: '创建财务账户（admin）', isAdmin: true },
  { service: 'finance', method: 'POST', action: 'account-freeze', summary: '冻结账户', description: '冻结财务账户（admin）', isAdmin: true },
  { service: 'finance', method: 'POST', action: 'account-unfreeze', summary: '解冻账户', description: '解冻财务账户（admin）', isAdmin: true },
  { service: 'finance', method: 'POST', action: 'account-close', summary: '关闭账户', description: '关闭财务账户（admin）', isAdmin: true },
  { service: 'finance', method: 'POST', action: 'ledger-post', summary: '入账', description: '入账（核心，admin）', isAdmin: true },
  { service: 'finance', method: 'POST', action: 'ledger-reverse', summary: '冲销流水', description: '冲销财务流水（admin）', isAdmin: true },
  { service: 'finance', method: 'POST', action: 'ledger-void', summary: '作废流水', description: '作废财务流水（admin）', isAdmin: true },
  { service: 'finance', method: 'POST', action: 'revenue-recognize-369', summary: '369 收入确认', description: '369 分账入账 40:30:30（admin）', isAdmin: true },
  { service: 'finance', method: 'POST', action: 'pools-initialize', summary: '初始化 369 池子', description: '初始化 369 三个池子（admin）', isAdmin: true },
  { service: 'finance', method: 'POST', action: 'settlement-create', summary: '创建结算单', description: '创建财务结算单（admin）', isAdmin: true },
  { service: 'finance', method: 'POST', action: 'settlement-add-item', summary: '添加结算条目', description: '添加结算条目（admin）', isAdmin: true },
  { service: 'finance', method: 'POST', action: 'settlement-approve', summary: '审核结算单', description: '审核财务结算单（admin）', isAdmin: true },
  { service: 'finance', method: 'POST', action: 'settlement-pay', summary: '支付结算单', description: '支付财务结算单（admin）', isAdmin: true },
  { service: 'finance', method: 'POST', action: 'settlement-cancel', summary: '取消结算单', description: '取消财务结算单（admin）', isAdmin: true },

  // ============================================================
  // Tax Service
  // ============================================================
  { service: 'tax', method: 'GET', action: 'rule-list', summary: '列出规则', description: '分页列出税务规则', isAdmin: false },
  { service: 'tax', method: 'GET', action: 'rule-detail', summary: '规则详情', description: '按 ID 查询税务规则', isAdmin: false },
  { service: 'tax', method: 'GET', action: 'rule-active', summary: '激活规则', description: '按 ruleCode+regionCode 查激活规则', isAdmin: false },
  { service: 'tax', method: 'GET', action: 'record-list', summary: '列出记录', description: '分页列出税务记录', isAdmin: false },
  { service: 'tax', method: 'GET', action: 'record-detail', summary: '记录详情', description: '按 ID 查询税务记录', isAdmin: false },
  { service: 'tax', method: 'GET', action: 'report-list', summary: '列出报表', description: '分页列出税务报表', isAdmin: false },
  { service: 'tax', method: 'GET', action: 'report-detail', summary: '报表详情', description: '按 ID 查询税务报表', isAdmin: false },
  { service: 'tax', method: 'POST', action: 'calculate', summary: '计算税额', description: '纯计算税额（不落库）', isAdmin: false },
  { service: 'tax', method: 'POST', action: 'rule-create', summary: '创建规则', description: '创建税务规则（admin）', isAdmin: true },
  { service: 'tax', method: 'POST', action: 'rule-update', summary: '更新规则', description: '更新税务规则（admin）', isAdmin: true },
  { service: 'tax', method: 'POST', action: 'rule-archive', summary: '归档规则', description: '归档税务规则（admin）', isAdmin: true },
  { service: 'tax', method: 'POST', action: 'rule-deactivate', summary: '停用规则', description: '停用税务规则（admin）', isAdmin: true },
  { service: 'tax', method: 'POST', action: 'record-create', summary: '记录税务', description: '记录税务（admin）', isAdmin: true },
  { service: 'tax', method: 'POST', action: 'record-mark-paid', summary: '标记记录已支付', description: '标记记录已支付（admin）', isAdmin: true },
  { service: 'tax', method: 'POST', action: 'record-adjust', summary: '调整记录', description: '调整税务记录（admin）', isAdmin: true },
  { service: 'tax', method: 'POST', action: 'record-reverse', summary: '冲销记录', description: '冲销税务记录（admin）', isAdmin: true },
  { service: 'tax', method: 'POST', action: 'report-create', summary: '创建报表', description: '创建税务报表（admin）', isAdmin: true },
  { service: 'tax', method: 'POST', action: 'report-submit', summary: '提交报表', description: '提交税务报表（admin）', isAdmin: true },
  { service: 'tax', method: 'POST', action: 'report-mark-paid', summary: '标记报表已支付', description: '标记报表已支付（admin）', isAdmin: true },
  { service: 'tax', method: 'POST', action: 'report-reject', summary: '驳回报表', description: '驳回税务报表（admin）', isAdmin: true },

  // ============================================================
  // Risk Service
  // ============================================================
  { service: 'risk', method: 'GET', action: 'rule-list', summary: '列出规则', description: '分页列出风险规则', isAdmin: false },
  { service: 'risk', method: 'GET', action: 'rule-detail', summary: '规则详情', description: '按 ID 查询风险规则', isAdmin: false },
  { service: 'risk', method: 'GET', action: 'rule-by-code', summary: '按 code 查规则', description: '按 ruleCode 查询风险规则', isAdmin: false },
  { service: 'risk', method: 'GET', action: 'event-list', summary: '列出事件', description: '分页列出风险事件', isAdmin: false },
  { service: 'risk', method: 'GET', action: 'event-detail', summary: '事件详情', description: '按 ID 查询风险事件', isAdmin: false },
  { service: 'risk', method: 'GET', action: 'case-list', summary: '列出案件', description: '分页列出风险案件', isAdmin: false },
  { service: 'risk', method: 'GET', action: 'case-detail', summary: '案件详情', description: '按 ID 查询风险案件', isAdmin: false },
  { service: 'risk', method: 'GET', action: 'score-list', summary: '用户分数历史', description: '按 userId 列出分数历史', isAdmin: false },
  { service: 'risk', method: 'GET', action: 'score-latest', summary: '最新分数', description: '按 userId+scoreType 查最新分数', isAdmin: false },
  { service: 'risk', method: 'GET', action: 'blacklist-list', summary: '列出黑名单', description: '分页列出黑名单', isAdmin: false },
  { service: 'risk', method: 'GET', action: 'blacklist-check', summary: '检查黑名单', description: '检查 category+value 是否在黑名单', isAdmin: false },
  { service: 'risk', method: 'GET', action: 'device-list', summary: '列出设备', description: '分页列出设备指纹', isAdmin: false },
  { service: 'risk', method: 'GET', action: 'device-by-fingerprint', summary: '按指纹查设备', description: '按 fingerprint 查询设备', isAdmin: false },
  { service: 'risk', method: 'POST', action: 'rule-create', summary: '创建规则', description: '创建风险规则（admin）', isAdmin: true },
  { service: 'risk', method: 'POST', action: 'rule-update', summary: '更新规则', description: '更新风险规则（admin）', isAdmin: true },
  { service: 'risk', method: 'POST', action: 'rule-enable', summary: '启用规则', description: '启用风险规则（admin）', isAdmin: true },
  { service: 'risk', method: 'POST', action: 'rule-disable', summary: '禁用规则', description: '禁用风险规则（admin）', isAdmin: true },
  { service: 'risk', method: 'POST', action: 'event-record', summary: '记录事件', description: '记录风险事件（admin）', isAdmin: true },
  { service: 'risk', method: 'POST', action: 'event-review', summary: '审核事件', description: '审核风险事件（admin）', isAdmin: true },
  { service: 'risk', method: 'POST', action: 'event-resolve', summary: '解决事件', description: '解决风险事件（admin）', isAdmin: true },
  { service: 'risk', method: 'POST', action: 'event-escalate', summary: '升级事件', description: '升级风险事件（admin）', isAdmin: true },
  { service: 'risk', method: 'POST', action: 'case-open', summary: '开案', description: '开风险案件（admin）', isAdmin: true },
  { service: 'risk', method: 'POST', action: 'case-assign', summary: '分派案件', description: '分派风险案件（admin）', isAdmin: true },
  { service: 'risk', method: 'POST', action: 'case-resolve', summary: '解决案件', description: '解决风险案件（admin）', isAdmin: true },
  { service: 'risk', method: 'POST', action: 'case-close', summary: '关闭案件', description: '关闭风险案件（admin）', isAdmin: true },
  { service: 'risk', method: 'POST', action: 'case-reopen', summary: '重开案件', description: '重开风险案件（admin）', isAdmin: true },
  { service: 'risk', method: 'POST', action: 'score-update', summary: '更新分数', description: '更新风险分数（admin）', isAdmin: true },
  { service: 'risk', method: 'POST', action: 'blacklist-add', summary: '添加黑名单', description: '添加黑名单（admin）', isAdmin: true },
  { service: 'risk', method: 'POST', action: 'blacklist-remove', summary: '移除黑名单', description: '移除黑名单（admin）', isAdmin: true },
  { service: 'risk', method: 'POST', action: 'blacklist-expire', summary: '扫描过期黑名单', description: '扫描过期黑名单（admin）', isAdmin: true },
  { service: 'risk', method: 'POST', action: 'device-register', summary: '注册设备', description: '注册设备指纹（admin）', isAdmin: true },

  // ============================================================
  // KYC Service (Phase I-Task 1)
  // ============================================================
  { service: 'kyc', method: 'GET', action: 'list', summary: '列出 KYC', description: '分页列出 KYC 记录（多维过滤）', isAdmin: false },
  { service: 'kyc', method: 'GET', action: 'detail', summary: 'KYC 详情', description: '按 ID 查询 KYC 记录', isAdmin: false },
  { service: 'kyc', method: 'GET', action: 'my-status', summary: '我的 KYC', description: '当前用户最新 KYC 记录', isAdmin: false },
  { service: 'kyc', method: 'GET', action: 'summary', summary: 'KYC 汇总', description: 'KYC 按状态+按等级 汇总', isAdmin: true },
  { service: 'kyc', method: 'GET', action: 'list-kyb', summary: '列出 KYB', description: '分页列出 KYB 记录（企业合规）', isAdmin: false },
  { service: 'kyc', method: 'GET', action: 'kyb-detail', summary: 'KYB 详情', description: '按 ID 查询 KYB 记录', isAdmin: false },
  { service: 'kyc', method: 'GET', action: 'my-kyb-status', summary: '我的 KYB', description: '当前用户最新 KYB 记录', isAdmin: false },
  { service: 'kyc', method: 'GET', action: 'summary-kyb', summary: 'KYB 汇总', description: 'KYB 按状态汇总', isAdmin: true },
  { service: 'kyc', method: 'GET', action: 'review-logs', summary: '审核日志', description: '分页列出 KYC+KYB 审核日志', isAdmin: true },
  { service: 'kyc', method: 'POST', action: 'submit', summary: '提交 KYC', description: '用户提交 KYC 资料', isAdmin: false },
  { service: 'kyc', method: 'POST', action: 'approve', summary: '通过 KYC', description: '管理员审核通过 KYC（admin）', isAdmin: true },
  { service: 'kyc', method: 'POST', action: 'reject', summary: '拒绝 KYC', description: '管理员拒绝 KYC（admin）', isAdmin: true },
  { service: 'kyc', method: 'POST', action: 'manual-review', summary: '转人工复核', description: '管理员将 KYC 转人工复核（admin）', isAdmin: true },
  { service: 'kyc', method: 'POST', action: 'expire', summary: '标记 KYC 过期', description: '管理员/system 标记 KYC 过期（admin）', isAdmin: true },
  { service: 'kyc', method: 'POST', action: 'resubmit', summary: '重新提交 KYC', description: '用户重新提交 KYC', isAdmin: false },
  { service: 'kyc', method: 'POST', action: 'submit-kyb', summary: '提交 KYB', description: '用户提交 KYB 资料（企业）', isAdmin: false },
  { service: 'kyc', method: 'POST', action: 'approve-kyb', summary: '通过 KYB', description: '管理员审核通过 KYB（admin）', isAdmin: true },
  { service: 'kyc', method: 'POST', action: 'reject-kyb', summary: '拒绝 KYB', description: '管理员拒绝 KYB（admin）', isAdmin: true },
  { service: 'kyc', method: 'POST', action: 'manual-review-kyb', summary: '转人工复核 KYB', description: '管理员将 KYB 转人工复核（admin）', isAdmin: true },
  { service: 'kyc', method: 'POST', action: 'expire-kyb', summary: '标记 KYB 过期', description: '管理员/system 标记 KYB 过期（admin）', isAdmin: true },

  // ============================================================
  // Permission Service (Phase I-Task 2)
  // ============================================================
  { service: 'permission', method: 'GET', action: 'roles', summary: '列出角色', description: '分页列出 RBAC 角色', isAdmin: false },
  { service: 'permission', method: 'GET', action: 'role-detail', summary: '角色详情', description: '按 ID 查询角色', isAdmin: false },
  { service: 'permission', method: 'GET', action: 'role-by-code', summary: '按 code 查角色', description: '按 roleCode 查询角色', isAdmin: false },
  { service: 'permission', method: 'GET', action: 'permissions', summary: '列出权限', description: '分页列出权限', isAdmin: false },
  { service: 'permission', method: 'GET', action: 'permission-detail', summary: '权限详情', description: '按 ID 查询权限', isAdmin: false },
  { service: 'permission', method: 'GET', action: 'permission-by-code', summary: '按 code 查权限', description: '按 permissionCode 查询权限', isAdmin: false },
  { service: 'permission', method: 'GET', action: 'role-permissions', summary: '角色权限列表', description: '列出角色的所有权限', isAdmin: false },
  { service: 'permission', method: 'GET', action: 'user-roles', summary: '用户角色列表', description: '分页列出用户角色分配', isAdmin: false },
  { service: 'permission', method: 'GET', action: 'user-effective-roles', summary: '用户有效角色', description: '聚合所有来源的用户有效角色', isAdmin: false },
  { service: 'permission', method: 'GET', action: 'user-permissions', summary: '用户直授权限', description: '列出用户直授权限', isAdmin: false },
  { service: 'permission', method: 'GET', action: 'policies', summary: '列出 ABAC 策略', description: '分页列出 ABAC 策略', isAdmin: false },
  { service: 'permission', method: 'GET', action: 'access-logs', summary: '访问日志', description: '分页列出访问评估日志', isAdmin: true },
  { service: 'permission', method: 'GET', action: 'summary', summary: 'RBAC+ABAC 汇总', description: '权限体系总览统计', isAdmin: true },
  { service: 'permission', method: 'POST', action: 'create-role', summary: '创建角色', description: '创建 RBAC 角色（admin）', isAdmin: true },
  { service: 'permission', method: 'POST', action: 'update-role', summary: '更新角色', description: '更新角色（admin）', isAdmin: true },
  { service: 'permission', method: 'POST', action: 'role-status', summary: '角色状态变更', description: '角色 enable/disable/deprecate（admin）', isAdmin: true },
  { service: 'permission', method: 'POST', action: 'create-permission', summary: '创建权限', description: '创建权限（admin）', isAdmin: true },
  { service: 'permission', method: 'POST', action: 'update-permission', summary: '更新权限', description: '更新权限（admin）', isAdmin: true },
  { service: 'permission', method: 'POST', action: 'disable-permission', summary: '禁用权限', description: '禁用权限（admin）', isAdmin: true },
  { service: 'permission', method: 'POST', action: 'grant-role-permission', summary: '给角色授权', description: '给角色授予权限（admin）', isAdmin: true },
  { service: 'permission', method: 'POST', action: 'revoke-role-permission', summary: '撤销角色权限', description: '撤销角色权限（admin）', isAdmin: true },
  { service: 'permission', method: 'POST', action: 'assign-user-role', summary: '分配用户角色', description: '给用户分配角色（admin）', isAdmin: true },
  { service: 'permission', method: 'POST', action: 'revoke-user-role', summary: '撤销用户角色', description: '撤销用户角色（admin）', isAdmin: true },
  { service: 'permission', method: 'POST', action: 'grant-user-permission', summary: '直授用户权限', description: '直接给用户授予权限（admin）', isAdmin: true },
  { service: 'permission', method: 'POST', action: 'revoke-user-permission', summary: '撤销用户直授权限', description: '撤销用户直授权限（admin）', isAdmin: true },
  { service: 'permission', method: 'POST', action: 'create-policy', summary: '创建 ABAC 策略', description: '创建 ABAC 策略（admin）', isAdmin: true },
  { service: 'permission', method: 'POST', action: 'update-policy', summary: '更新 ABAC 策略', description: '更新 ABAC 策略（admin）', isAdmin: true },
  { service: 'permission', method: 'POST', action: 'disable-policy', summary: '禁用 ABAC 策略', description: '禁用 ABAC 策略（admin）', isAdmin: true },
  { service: 'permission', method: 'POST', action: 'evaluate-access', summary: '访问评估', description: '核心 RBAC+ABAC 访问评估', isAdmin: false },
  { service: 'permission', method: 'POST', action: 'log-access', summary: '记录访问日志', description: '记录一次访问评估日志', isAdmin: false },

  // ============================================================
  // Region Service (Phase I-Task 3)
  // ============================================================
  { service: 'region', method: 'GET', action: 'list-regions', summary: '列出地区', description: '分页列出地区（国家/省/市 3 级）', isAdmin: false },
  { service: 'region', method: 'GET', action: 'region-detail', summary: '地区详情', description: '按 ID 查询地区', isAdmin: false },
  { service: 'region', method: 'GET', action: 'region-by-code', summary: '按 code 查地区', description: '按 regionCode 查询地区', isAdmin: false },
  { service: 'region', method: 'GET', action: 'country-tree', summary: '国家树', description: '查询某国家下 3 级树', isAdmin: false },
  { service: 'region', method: 'GET', action: 'descendants', summary: '下属地区', description: '查询地区的所有下属节点', isAdmin: false },
  { service: 'region', method: 'GET', action: 'path-to-root', summary: '到根路径', description: '查询地区到根节点的路径', isAdmin: false },
  { service: 'region', method: 'GET', action: 'list-restrictions', summary: '列出地区限制', description: '分页列出地区限制', isAdmin: false },
  { service: 'region', method: 'GET', action: 'list-ip-geos', summary: '列出 IP Geo 段', description: '分页列出 IP Geo 段', isAdmin: true },
  { service: 'region', method: 'GET', action: 'summary', summary: '地区汇总', description: '地区维度业务汇总', isAdmin: true },
  { service: 'region', method: 'POST', action: 'create-region', summary: '创建地区', description: '创建地区节点（admin）', isAdmin: true },
  { service: 'region', method: 'POST', action: 'update-region', summary: '更新地区', description: '更新地区（admin）', isAdmin: true },
  { service: 'region', method: 'POST', action: 'region-status', summary: '地区状态变更', description: '地区 enable/disable/deprecate（admin）', isAdmin: true },
  { service: 'region', method: 'POST', action: 'add-restriction', summary: '添加地区限制', description: '添加地区限制（admin）', isAdmin: true },
  { service: 'region', method: 'POST', action: 'restriction-status', summary: '限制状态变更', description: '限制 enable/disable/expire（admin）', isAdmin: true },
  { service: 'region', method: 'POST', action: 'check-restriction', summary: '实时限制校验', description: '核心：检查用户当前地区限制', isAdmin: false },
  { service: 'region', method: 'POST', action: 'register-ip-geo', summary: '注册 IP 段', description: '注册 IP Geo 段（admin）', isAdmin: true },
  { service: 'region', method: 'POST', action: 'ip-geo-status', summary: 'IP Geo 状态变更', description: 'IP Geo enable/disable（admin）', isAdmin: true },
  { service: 'region', method: 'POST', action: 'resolve-ip', summary: '解析 IP', description: '核心：根据 IP 解析地区/国家', isAdmin: false },

  // ============================================================
  // Device Service (Phase I-Task 4)
  // ============================================================
  // Fingerprint 域
  { service: 'device', method: 'GET', action: 'fingerprint-detail', summary: '指纹详情', description: '按 ID 查询设备指纹', isAdmin: false },
  { service: 'device', method: 'GET', action: 'fingerprint-by-hash', summary: '按 hash 查指纹', description: '按 fingerprint hash 查询设备指纹', isAdmin: false },
  { service: 'device', method: 'POST', action: 'fingerprint', summary: '创建或更新指纹', description: 'upsert 设备指纹', isAdmin: false },
  { service: 'device', method: 'POST', action: 'create-fingerprint', summary: '强制创建指纹', description: '强制创建新设备指纹', isAdmin: false },
  { service: 'device', method: 'POST', action: 'update-fingerprint-stats', summary: '更新指纹统计', description: '更新设备指纹的访问统计', isAdmin: false },
  // UserDevice 域
  { service: 'device', method: 'GET', action: 'list', summary: '列出用户设备', description: '分页列出用户设备', isAdmin: false },
  { service: 'device', method: 'GET', action: 'device-detail', summary: '设备详情', description: '按 ID 查询用户设备', isAdmin: false },
  { service: 'device', method: 'POST', action: 'bind', summary: '绑定设备', description: '核心：用户绑定设备（含风险评估）', isAdmin: false },
  { service: 'device', method: 'POST', action: 'heartbeat', summary: '心跳', description: '设备心跳上报', isAdmin: false },
  { service: 'device', method: 'POST', action: 'trust', summary: '信任设备', description: '用户/管理员信任设备', isAdmin: false },
  { service: 'device', method: 'POST', action: 'untrust', summary: '取消信任', description: '取消设备信任', isAdmin: false },
  { service: 'device', method: 'POST', action: 'block', summary: '锁定设备', description: '管理员锁定设备（admin）', isAdmin: true },
  { service: 'device', method: 'POST', action: 'unblock', summary: '解除锁定', description: '管理员解除设备锁定（admin）', isAdmin: true },
  { service: 'device', method: 'POST', action: 'revoke', summary: '吊销设备', description: '用户/管理员吊销设备', isAdmin: false },
  { service: 'device', method: 'POST', action: 'unbind', summary: '解绑设备', description: '解绑用户设备', isAdmin: false },
  // Blacklist 域
  { service: 'device', method: 'GET', action: 'list-blacklist', summary: '列出黑名单', description: '分页列出设备黑名单', isAdmin: true },
  { service: 'device', method: 'GET', action: 'blacklist-by-fingerprint', summary: '按指纹查黑名单', description: '按 fingerprint 查询黑名单记录', isAdmin: false },
  { service: 'device', method: 'POST', action: 'add-blacklist', summary: '加入黑名单', description: '将指纹加入设备黑名单（admin）', isAdmin: true },
  { service: 'device', method: 'POST', action: 'remove-blacklist', summary: '移除黑名单', description: '从黑名单移除（admin）', isAdmin: true },
  { service: 'device', method: 'POST', action: 'check-blacklist', summary: '实时黑名单检查', description: '核心：检查指纹是否在黑名单', isAdmin: false },
  // RiskAssessment 域
  { service: 'device', method: 'GET', action: 'list-risk-assessments', summary: '列出风险评估', description: '分页列出设备风险评估', isAdmin: false },
  { service: 'device', method: 'POST', action: 'assess-risk', summary: '触发风险评估', description: '核心：触发设备风险评估（11 因子）', isAdmin: false },
  { service: 'device', method: 'POST', action: 'dismiss-risk', summary: '忽略风险评估', description: '管理员忽略风险评估（admin）', isAdmin: true },
  { service: 'device', method: 'POST', action: 'action-risk', summary: '处置风险评估', description: '管理员处置风险评估（admin）', isAdmin: true },
  // Challenge 域
  { service: 'device', method: 'GET', action: 'list-challenges', summary: '列出挑战', description: '分页列出设备挑战', isAdmin: false },
  { service: 'device', method: 'POST', action: 'issue-challenge', summary: '签发挑战', description: '核心：签发设备挑战（OTP/邮箱/短信）', isAdmin: false },
  { service: 'device', method: 'POST', action: 'verify-challenge', summary: '验证挑战', description: '验证挑战码', isAdmin: false },
  { service: 'device', method: 'POST', action: 'fail-challenge', summary: '标记挑战失败', description: '手动标记挑战失败', isAdmin: false },
  { service: 'device', method: 'POST', action: 'cancel-challenge', summary: '取消挑战', description: '取消未验证的挑战', isAdmin: false },
  { service: 'device', method: 'POST', action: 'expire-challenge', summary: '标记挑战过期', description: '标记挑战过期', isAdmin: false },
  // Summary
  { service: 'device', method: 'GET', action: 'summary', summary: '设备汇总', description: '设备维度业务汇总', isAdmin: true },
];

// ============================================================
// 生成 OpenAPI Document
// ============================================================

const SERVICE_TAGS: Record<string, string> = {
  revenue: 'Revenue Service (C+F) - 369 分账',
  referral: 'Referral Service (C+F) - 推荐奖励',
  team: 'Team Service (C+F) - 团队奖励',
  node: 'Node Service (C+F) - 节点奖励',
  finance: 'Finance Service (G) - 财务账本',
  tax: 'Tax Service (G) - 税务服务',
  risk: 'Risk Service (G) - 风控服务',
  kyc: 'KYC/KYB Service (I) - 个人+企业合规身份',
  permission: 'Permission Service (I) - RBAC+ABAC 权限',
  region: 'Region Service (I) - 3 级地区 + 限制 + IP Geo',
  device: 'Device Service (I) - 设备指纹/绑定/风险/挑战',
};

function buildOpenAPIDocument(): OpenAPIDocument {
  const paths: Record<string, PathItem> = {};

  // 按 service + method 分组端点
  const grouped: Record<string, { gets: EndpointDef[]; posts: EndpointDef[] }> = {};
  for (const ep of ENDPOINTS) {
    if (!grouped[ep.service]) grouped[ep.service] = { gets: [], posts: [] };
    if (ep.method === 'GET') grouped[ep.service].gets.push(ep);
    else grouped[ep.service].posts.push(ep);
  }

  // 为每个 service 生成一个路径 /api/v1/fjn/{service}
  // GET 操作聚合所有 GET actions（action 作为 required query 参数，enum 列出）
  // POST 操作聚合所有 POST actions（同上）
  // 这样既符合 OpenAPI 3.0 规范（path/method 唯一），又完整保留了所有 action 信息
  for (const [service, { gets, posts }] of Object.entries(grouped)) {
    const path = `/api/v1/fjn/${service}`;
    const pathItem: PathItem = {};

    if (gets.length > 0) {
      pathItem.get = buildAggregatedGetOperation(service, gets);
    }
    if (posts.length > 0) {
      pathItem.post = buildAggregatedPostOperation(service, posts);
    }
    paths[path] = pathItem;
  }

  return {
    openapi: '3.0.3',
    info: {
      title: 'FJN 福建老酒业务服务 API',
      version: '1.0.0',
      description: 'FJN 福建老酒业务 11 个 Service 的完整 REST API 规范。\n\n**覆盖服务**\n- 阶段C+F (7)：Revenue / Referral / Team / Node / Finance / Tax / Risk\n- 阶段I (4)：KYC（含KYB） / Permission（RBAC+ABAC） / Region（3级+限制+IP Geo） / Device（指纹/绑定/风险/挑战）\n\n**鉴权**：JWT Bearer Token，所有 admin 端点需 `admin` 角色。',
      contact: { name: 'FJN Development Team' },
    },
    servers: [
      { url: OPENAPI_DEV_URL, description: '本地开发' },
      { url: OPENAPI_PROD_URL, description: '生产环境' },
    ],
    tags: Object.entries(SERVICE_TAGS).map(([name, description]) => ({ name, description })),
    paths,
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Token，从 /api/v1/auth/login 获取',
        },
      },
      schemas: {
        StandardResponse,
        ErrorResponse,
        Pagination: PaginationParams,
      },
      responses: {
        StandardResponse: {
          description: '标准响应',
          content: { 'application/json': { schema: StandardResponse } },
        },
        ErrorResponse: {
          description: '错误响应',
          content: { 'application/json': { schema: ErrorResponse } },
        },
      },
      parameters: {},
    },
  };
}

/**
 * 聚合一个 Service 的所有 GET 端点为单个 operation
 * - action 用 query 参数表达（enum 列出所有可用 action）
 * - 共享 query 参数 (id/code/hash/fingerprint/roleId/userId/countryCode/page/pageSize)
 * - security：若全为 admin 才标 admin，否则仅 user（保守）
 */
function buildAggregatedGetOperation(service: string, eps: EndpointDef[]): Operation {
  const actionEnum = eps.map((ep) => ep.action);
  const allAdmin = eps.every((ep) => ep.isAdmin);
  // security: 若有用户级 + admin 混合，则只标用户级（保守）；纯 admin 才标 admin
  const security: Array<Record<string, string[]>> = allAdmin
    ? [{ BearerAuth: ['admin'] }]
    : [{ BearerAuth: [] }];

  // 合并通用 query 参数
  const idActions = eps.filter((ep) => ep.action.endsWith('-detail') || ep.action === 'descendants' || ep.action === 'path-to-root').map((ep) => ep.action);
  const codeActions = eps.filter((ep) => ep.action.endsWith('-by-code') || ep.action === 'region-by-code').map((ep) => ep.action);
  const hashActions = eps.filter((ep) => ep.action.endsWith('-by-hash')).map((ep) => ep.action);
  const fingerprintActions = eps.filter((ep) => ep.action === 'blacklist-by-fingerprint').map((ep) => ep.action);
  const roleIdActions = eps.filter((ep) => ep.action === 'role-permissions').map((ep) => ep.action);
  const userIdActions = eps.filter((ep) => ep.action === 'user-permissions' || ep.action === 'user-effective-roles').map((ep) => ep.action);
  const countryCodeActions = eps.filter((ep) => ep.action === 'country-tree').map((ep) => ep.action);
  const listActions = eps
    .filter(
      (ep) =>
        ep.action.startsWith('list') ||
        ep.action.endsWith('-list') ||
        ep.action === 'roles' ||
        ep.action === 'permissions' ||
        ep.action === 'policies' ||
        ep.action === 'user-roles' ||
        ep.action === 'access-logs' ||
        ep.action === 'review-logs',
    )
    .map((ep) => ep.action);

  const op: Operation = {
    tags: [service],
    summary: `${service} 服务的 GET 端点（${eps.length} 个 action）`,
    description: buildGetDescription(service, eps),
    operationId: `${service}_get_aggregated`,
    security,
    parameters: [
      {
        name: 'action',
        in: 'query',
        required: true,
        description: '操作类型',
        schema: { type: 'string', enum: actionEnum },
      },
    ],
    responses: {
      '200': { description: '成功', content: { 'application/json': { schema: { $ref: '#/components/responses/StandardResponse' } } } },
      '400': { description: '请求参数错误', content: { 'application/json': { schema: { $ref: '#/components/responses/ErrorResponse' } } } },
      '401': { description: '未认证', content: { 'application/json': { schema: { $ref: '#/components/responses/ErrorResponse' } } } },
      '403': { description: '权限不足', content: { 'application/json': { schema: { $ref: '#/components/responses/ErrorResponse' } } } },
      '404': { description: '资源不存在', content: { 'application/json': { schema: { $ref: '#/components/responses/ErrorResponse' } } } },
      '500': { description: '服务器错误', content: { 'application/json': { schema: { $ref: '#/components/responses/ErrorResponse' } } } },
    },
  };

  if (idActions.length > 0) {
    op.parameters!.push({
      name: 'id',
      in: 'query',
      required: false,
      description: `资源 ID（action ∈ {${idActions.join(', ')}} 时必填）`,
      schema: { type: 'string' },
    });
  }
  if (codeActions.length > 0) {
    op.parameters!.push({
      name: 'code',
      in: 'query',
      required: false,
      description: `资源 Code（action ∈ {${codeActions.join(', ')}} 时必填）`,
      schema: { type: 'string' },
    });
  }
  if (hashActions.length > 0) {
    op.parameters!.push({
      name: 'hash',
      in: 'query',
      required: false,
      description: `指纹 hash（action ∈ {${hashActions.join(', ')}} 时必填）`,
      schema: { type: 'string' },
    });
  }
  if (fingerprintActions.length > 0) {
    op.parameters!.push({
      name: 'fingerprint',
      in: 'query',
      required: false,
      description: `设备指纹（action ∈ {${fingerprintActions.join(', ')}} 时必填）`,
      schema: { type: 'string' },
    });
  }
  if (roleIdActions.length > 0) {
    op.parameters!.push({
      name: 'roleId',
      in: 'query',
      required: false,
      description: `角色 ID（action ∈ {${roleIdActions.join(', ')}} 时必填）`,
      schema: { type: 'string' },
    });
  }
  if (userIdActions.length > 0) {
    op.parameters!.push({
      name: 'userId',
      in: 'query',
      required: false,
      description: `用户 ID（action ∈ {${userIdActions.join(', ')}} 时必填）`,
      schema: { type: 'string' },
    });
  }
  if (countryCodeActions.length > 0) {
    op.parameters!.push({
      name: 'countryCode',
      in: 'query',
      required: false,
      description: `国家代码（action=country-tree 时必填，如 CN）`,
      schema: { type: 'string' },
    });
  }
  if (listActions.length > 0) {
    op.parameters!.push(
      { name: 'page', in: 'query', required: false, description: `页码（action ∈ {${listActions.join(', ')}} 时使用，默认 1）`, schema: { type: 'integer', default: 1 } },
      { name: 'pageSize', in: 'query', required: false, description: `每页数量（action ∈ {${listActions.join(', ')}} 时使用，默认 20）`, schema: { type: 'integer', default: 20 } },
    );
  }

  return op;
}

/**
 * 聚合一个 Service 的所有 POST 端点为单个 operation
 */
function buildAggregatedPostOperation(service: string, eps: EndpointDef[]): Operation {
  const actionEnum = eps.map((ep) => ep.action);
  const allAdmin = eps.every((ep) => ep.isAdmin);
  const security: Array<Record<string, string[]>> = allAdmin
    ? [{ BearerAuth: ['admin'] }]
    : [{ BearerAuth: [] }];

  const op: Operation = {
    tags: [service],
    summary: `${service} 服务的 POST 端点（${eps.length} 个 action）`,
    description: buildPostDescription(service, eps),
    operationId: `${service}_post_aggregated`,
    security,
    parameters: [
      {
        name: 'action',
        in: 'query',
        required: true,
        description: '操作类型',
        schema: { type: 'string', enum: actionEnum },
      },
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { type: 'object', description: `${service} 服务的 POST 请求体（具体字段依 action 而异，参考 action 列表与对应 service 文档）` },
        },
      },
    },
    responses: {
      '200': { description: '成功', content: { 'application/json': { schema: { $ref: '#/components/responses/StandardResponse' } } } },
      '201': { description: '创建成功', content: { 'application/json': { schema: { $ref: '#/components/responses/StandardResponse' } } } },
      '400': { description: '请求参数错误', content: { 'application/json': { schema: { $ref: '#/components/responses/ErrorResponse' } } } },
      '401': { description: '未认证', content: { 'application/json': { schema: { $ref: '#/components/responses/ErrorResponse' } } } },
      '403': { description: '权限不足', content: { 'application/json': { schema: { $ref: '#/components/responses/ErrorResponse' } } } },
      '404': { description: '资源不存在', content: { 'application/json': { schema: { $ref: '#/components/responses/ErrorResponse' } } } },
      '500': { description: '服务器错误', content: { 'application/json': { schema: { $ref: '#/components/responses/ErrorResponse' } } } },
    },
  };

  return op;
}

function buildGetDescription(service: string, eps: EndpointDef[]): string {
  const lines: string[] = [];
  lines.push(`**${service} 服务** 提供的所有 GET 端点。`);
  lines.push('');
  lines.push('**可用 actions：**');
  for (const ep of eps) {
    const auth = ep.isAdmin ? '🔒 admin' : '👤 user';
    lines.push(`- \`${ep.action}\` — ${ep.summary} (${auth})`);
  }
  lines.push('');
  lines.push('**注意**：根据所选 action，部分 query 参数（如 id/code/roleId/userId 等）为必填。');
  return lines.join('\n');
}

function buildPostDescription(service: string, eps: EndpointDef[]): string {
  const lines: string[] = [];
  lines.push(`**${service} 服务** 提供的所有 POST 端点。`);
  lines.push('');
  lines.push('**可用 actions：**');
  for (const ep of eps) {
    const auth = ep.isAdmin ? '🔒 admin' : '👤 user';
    lines.push(`- \`${ep.action}\` — ${ep.summary} (${auth})`);
  }
  lines.push('');
  lines.push('**注意**：请求体字段依 action 而异，详见对应 service 的源代码路由文件。');
  return lines.join('\n');
}

// ============================================================
// 主入口
// ============================================================

function main() {
  console.log('=== FJN OpenAPI 3.0 规范生成器 (阶段I-任务5.5) ===\n');
  console.log(`总端点数（actions）: ${ENDPOINTS.length}`);

  // 按 Service 统计
  const stats: Record<string, number> = {};
  ENDPOINTS.forEach((ep) => {
    stats[ep.service] = (stats[ep.service] ?? 0) + 1;
  });
  console.log('\n各 Service 端点分布:');
  Object.entries(stats).forEach(([svc, count]) => {
    console.log(`  ${svc.padEnd(10)} ${count} 端点`);
  });

  // 按 method 统计
  const methodStats = ENDPOINTS.reduce(
    (acc, ep) => {
      acc[ep.method] = (acc[ep.method] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  console.log('\n按 HTTP 方法:');
  Object.entries(methodStats).forEach(([m, c]) => {
    console.log(`  ${m.padEnd(4)} ${c} 端点`);
  });

  // 按鉴权统计
  const authStats = ENDPOINTS.reduce(
    (acc, ep) => {
      const k = ep.isAdmin ? 'admin' : 'user';
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  console.log('\n按鉴权要求:');
  Object.entries(authStats).forEach(([a, c]) => {
    console.log(`  ${a.padEnd(6)} ${c} 端点`);
  });

  // 按阶段统计
  const stageI = new Set(['kyc', 'permission', 'region', 'device']);
  const stageStats: Record<string, number> = {
    '阶段C+F (7 services)': 0,
    '阶段I (4 services)': 0,
  };
  ENDPOINTS.forEach((ep) => {
    if (stageI.has(ep.service)) {
      stageStats['阶段I (4 services)'] = (stageStats['阶段I (4 services)'] ?? 0) + 1;
    } else {
      stageStats['阶段C+F (7 services)'] = (stageStats['阶段C+F (7 services)'] ?? 0) + 1;
    }
  });
  console.log('\n按阶段:');
  Object.entries(stageStats).forEach(([s, c]) => {
    console.log(`  ${s.padEnd(28)} ${c} 端点`);
  });

  const doc = buildOpenAPIDocument();

  // 输出目录
  const outDir = join(process.cwd(), 'docs', 'openapi');
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }
  const outFile = join(outDir, 'fjn-openapi.json');
  writeFileSync(outFile, JSON.stringify(doc, null, 2), 'utf-8');

  const fileSize = (require('fs').statSync(outFile).size / 1024).toFixed(2);
  const pathCount = Object.keys(doc.paths).length;
  console.log(`\n✅ OpenAPI 3.0 规范已生成:`);
  console.log(`   路径: ${outFile}`);
  console.log(`   大小: ${fileSize} KB`);
  console.log(`   总 actions: ${ENDPOINTS.length}`);
  console.log(`   路径数: ${pathCount}（每 service 一条 /api/v1/fjn/{service}，action 作为 query 参数）`);
  console.log(`   Service: ${Object.keys(stats).length}`);
  console.log(`\n📖 Swagger UI 访问: ${OPENAPI_DEV_URL}/api/v1/fjn/docs`);
  console.log(`📄 OpenAPI JSON:   ${OPENAPI_DEV_URL}/api/v1/fjn/openapi`);
}

main();
