/**
 * 短信模板（SmsTemplate）
 *
 * 职责：
 *  - 维护模板 ID → 模板字符串 的映射
 *  - 模板变量采用 {var} 占位符，与 Twilio 模板风格保持兼容
 *  - 内置 5 个开箱即用模板：OTP_LOGIN / OTP_REGISTER / WITHDRAW_CONFIRM /
 *    LOGIN_ALERT / SECURITY_ALERT
 *  - 支持运行时注册、覆盖、删除、列出
 *
 * 用法：
 *   const tmpl = new SmsTemplate();
 *   const body = tmpl.render('OTP_LOGIN', { code: '123456' });
 *   tmpl.register('MY_TEMPLATE', 'Hello {name}, code={code}');
 */

import { logger } from '../logger';

// =============================================================================
// 公共类型
// =============================================================================

export interface SmsTemplateDefinition {
  /** 模板 ID */
  id: string;
  /** 模板正文（含 {var} 占位符） */
  body: string;
  /** 模板说明（可选） */
  description?: string;
  /** 关联的变量名（用于校验） */
  variables?: string[];
}

// =============================================================================
// 内置模板
// =============================================================================

const BUILTIN_TEMPLATES: SmsTemplateDefinition[] = [
  {
    id: 'OTP_LOGIN',
    body: '您的验证码：{code}，5 分钟内有效，请勿泄露。',
    description: '登录验证码',
    variables: ['code'],
  },
  {
    id: 'OTP_REGISTER',
    body: '欢迎注册萨摩亚交易所，验证码：{code}。',
    description: '注册验证码',
    variables: ['code'],
  },
  {
    id: 'WITHDRAW_CONFIRM',
    body: '您正在提现 {amount} {asset} 到 {address}，验证码：{code}。',
    description: '提现确认验证码',
    variables: ['amount', 'asset', 'address', 'code'],
  },
  {
    id: 'LOGIN_ALERT',
    body: '您的账号于 {time} 在 {location} 登录，如非本人操作请立即修改密码。',
    description: '异地登录提醒',
    variables: ['time', 'location'],
  },
  {
    id: 'SECURITY_ALERT',
    body: '检测到您的账号存在异常操作，请立即检查。',
    description: '通用安全告警',
    variables: [],
  },
];

// =============================================================================
// SmsTemplate
// =============================================================================

export class SmsTemplate {
  private readonly templates: Map<string, SmsTemplateDefinition> = new Map();
  private readonly logger: typeof logger;

  constructor(opts: { logger?: typeof logger } = {}) {
    this.logger = opts.logger ?? logger;
    for (const t of BUILTIN_TEMPLATES) {
      this.templates.set(t.id, { ...t });
    }
  }

  /**
   * 渲染模板
   * @throws 如果模板不存在或缺少必填变量
   */
  render(templateId: string, variables: Record<string, string> = {}): string {
    const tmpl = this.templates.get(templateId);
    if (!tmpl) {
      throw new Error(`SmsTemplate: unknown template "${templateId}"`);
    }
    // 检查必需变量
    if (tmpl.variables && tmpl.variables.length > 0) {
      const missing = tmpl.variables.filter((v) => variables[v] === undefined || variables[v] === null);
      if (missing.length > 0) {
        throw new Error(`SmsTemplate: template "${templateId}" missing variables: ${missing.join(', ')}`);
      }
    }
    return this.interpolate(tmpl.body, variables);
  }

  /**
   * 渲染模板（宽松模式）：模板不存在或变量缺失时返回 null 而不是抛错
   */
  tryRender(templateId: string, variables: Record<string, string> = {}): string | null {
    try {
      return this.render(templateId, variables);
    } catch (err) {
      this.logger.warn(`[SmsTemplate] tryRender failed: ${(err as Error).message}`);
      return null;
    }
  }

  /**
   * 注册 / 覆盖一个模板
   * 默认情况下 builtin 模板可被覆盖（业务可根据区域或活动调整文案）
   */
  register(def: SmsTemplateDefinition): void {
    if (!def.id) throw new Error('SmsTemplate.register: id is required');
    if (!def.body) throw new Error('SmsTemplate.register: body is required');
    this.templates.set(def.id, { ...def });
  }

  /**
   * 删除模板（不允许删除 builtin 模板）
   */
  remove(id: string): boolean {
    if (BUILTIN_TEMPLATES.find((t) => t.id === id)) {
      this.logger.warn(`[SmsTemplate] cannot remove builtin template "${id}"`);
      return false;
    }
    return this.templates.delete(id);
  }

  /** 获取模板定义 */
  get(id: string): SmsTemplateDefinition | undefined {
    return this.templates.get(id);
  }

  /** 是否存在 */
  has(id: string): boolean {
    return this.templates.has(id);
  }

  /** 列出所有模板 */
  list(): SmsTemplateDefinition[] {
    return Array.from(this.templates.values()).map((t) => ({ ...t }));
  }

  /** 列出所有 builtin 模板 ID */
  listBuiltinIds(): string[] {
    return BUILTIN_TEMPLATES.map((t) => t.id);
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  /**
   * 简单占位符替换：{name} 风格
   * 不支持转义，不支持嵌套；如需复杂模板请使用专用引擎
   */
  private interpolate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (_match, key: string) => {
      const v = vars[key];
      return v === undefined || v === null ? `{${key}}` : String(v);
    });
  }
}

// =============================================================================
// 工厂
// =============================================================================

export function createSmsTemplate(opts?: ConstructorParameters<typeof SmsTemplate>[0]): SmsTemplate {
  return new SmsTemplate(opts);
}

export { BUILTIN_TEMPLATES };

export default SmsTemplate;
