/**
 * 邮件模板（EmailTemplate）
 *
 * 职责：
 *  - 维护模板 ID → { subject, text, html } 映射
 *  - 内置 8 个开箱即用模板：邮箱验证 / 密码重置 / 提现成功 / 充值到账 /
 *    异地登录 / 安全告警 / KYC 通过 / KYC 拒绝 / Newsletter
 *  - 支持运行时注册、覆盖、列出
 *  - 支持变量渲染（{var} 占位符）
 *  - 支持退订链接注入
 *  - 暗色 / 亮色 友好
 *  - 不依赖 handlebars / ejs，纯模板字符串
 *
 * 用法：
 *   const tmpl = new EmailTemplate();
 *   const { subject, text, html } = tmpl.render('TPL_VERIFY_EMAIL', { code: '123456' });
 *   tmpl.register({ id: 'CUSTOM', subject: '...', text: '...', html: '...' });
 */

// =============================================================================
// 公共类型
// =============================================================================

export interface EmailTemplateDefinition {
  /** 模板 ID */
  id: string;
  /** 主题（含 {var} 占位符） */
  subject: string;
  /** 纯文本正文（含 {var} 占位符） */
  text: string;
  /** HTML 正文（含 {var} 占位符） */
  html: string;
  /** 模板说明（可选） */
  description?: string;
  /** 关联的变量名（用于校验） */
  variables?: string[];
}

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

// =============================================================================
// 关键常量
// =============================================================================

/** 主色：#1677FF */
export const BRAND_PRIMARY = '#1677FF';
export const BRAND_PRIMARY_DARK = '#0958D9';
export const BRAND_TEXT = '#1F2937';
export const BRAND_MUTED = '#6B7280';
export const BRAND_BG = '#F5F7FA';
export const BRAND_BORDER = '#E5E7EB';
export const BRAND_SUCCESS = '#10B981';
export const BRAND_DANGER = '#EF4444';
export const BRAND_WARNING = '#F59E0B';
export const BRAND_LOGO = 'SMY Exchange';
export const BRAND_TAGLINE = 'Samoa Digital Asset Exchange';
export const UNSUBSCRIBE_PLACEHOLDER = '{{unsubscribe_url}}';
export const APP_BASE_URL_PLACEHOLDER = '{{app_base_url}}';
export const SUPPORT_EMAIL_PLACEHOLDER = '{{support_email}}';

export const APP_BASE_URL_DEFAULT = 'https://smy.exchange';
export const SUPPORT_EMAIL_DEFAULT = 'support@smy.exchange';

// =============================================================================
// 内置模板
// =============================================================================

const BUILTIN_TEMPLATES: EmailTemplateDefinition[] = [
  // ---------------------------------------------------------------------------
  // 1. 邮箱验证
  // ---------------------------------------------------------------------------
  {
    id: 'TPL_VERIFY_EMAIL',
    subject: '验证您的 SMY Exchange 邮箱',
    description: '邮箱验证码（6 位）',
    variables: ['code', 'ttl_minutes'],
    text: [
      '您好，',
      '',
      '请使用以下验证码完成邮箱验证：',
      '',
      '  验证码：{code}',
      '  有效时间：{ttl_minutes} 分钟',
      '',
      '如果这不是您本人的操作，请忽略本邮件。',
      '',
      '— SMY Exchange 团队',
    ].join('\n'),
    html: wrapHtml({
      title: '验证您的邮箱',
      bodyHtml: `
        <p>您好，感谢您注册 SMY Exchange。</p>
        <p>请使用以下验证码完成邮箱验证：</p>
        <div class="otp-box">{code}</div>
        <p>该验证码 <strong>{ttl_minutes} 分钟</strong> 内有效，请勿泄露给任何人。</p>
        <p class="muted">如果这不是您本人的操作，请忽略本邮件。</p>
      `,
    }),
  },

  // ---------------------------------------------------------------------------
  // 2. 密码重置
  // ---------------------------------------------------------------------------
  {
    id: 'TPL_RESET_PASSWORD',
    subject: '重置您的 SMY Exchange 密码',
    description: '密码重置链接（30 分钟有效）',
    variables: ['reset_url', 'ttl_minutes'],
    text: [
      '您好，',
      '',
      '我们收到了您的密码重置请求。点击以下链接重置密码：',
      '',
      '  {reset_url}',
      '',
      '该链接 {ttl_minutes} 分钟内有效。',
      '如果这不是您本人的操作，请忽略本邮件，您的账户仍然安全。',
      '',
      '— SMY Exchange 团队',
    ].join('\n'),
    html: wrapHtml({
      title: '重置您的密码',
      bodyHtml: `
        <p>您好，</p>
        <p>我们收到了您的密码重置请求。点击下方按钮重置密码：</p>
        <p style="text-align:center; margin: 24px 0;">
          <a class="btn-primary" href="{reset_url}" target="_blank" rel="noopener">重置密码</a>
        </p>
        <p class="muted">该链接 <strong>{ttl_minutes} 分钟</strong> 内有效。如按钮无法点击，请复制以下链接到浏览器打开：</p>
        <p class="muted" style="word-break: break-all;">{reset_url}</p>
        <p class="muted">如果这不是您本人的操作，请忽略本邮件。</p>
      `,
    }),
  },

  // ---------------------------------------------------------------------------
  // 3. 提现成功
  // ---------------------------------------------------------------------------
  {
    id: 'TPL_WITHDRAW_SUCCESS',
    subject: '您的提现已成功',
    description: '提现成功通知',
    variables: ['amount', 'asset', 'address', 'tx_hash', 'network'],
    text: [
      '您好，',
      '',
      '您的提现申请已成功广播至区块链网络：',
      '',
      '  金额：{amount} {asset}',
      '  目标地址：{address}',
      '  网络：{network}',
      '  交易哈希：{tx_hash}',
      '',
      '请在区块浏览器中查看详情。',
      '',
      '— SMY Exchange 团队',
    ].join('\n'),
    html: wrapHtml({
      title: '您的提现已成功',
      bodyHtml: `
        <p>您好，</p>
        <p>您的提现申请已成功广播：</p>
        <table class="kv-table" cellpadding="6" cellspacing="0" border="0">
          <tr><td class="kv-key">金额</td><td class="kv-val"><strong>{amount} {asset}</strong></td></tr>
          <tr><td class="kv-key">目标地址</td><td class="kv-val" style="word-break: break-all;">{address}</td></tr>
          <tr><td class="kv-key">网络</td><td class="kv-val">{network}</td></tr>
          <tr><td class="kv-key">交易哈希</td><td class="kv-val" style="word-break: break-all;">{tx_hash}</td></tr>
        </table>
        <p class="muted">请在区块浏览器中查看确认进度。</p>
      `,
    }),
  },

  // ---------------------------------------------------------------------------
  // 4. 充值到账
  // ---------------------------------------------------------------------------
  {
    id: 'TPL_DEPOSIT_RECEIVED',
    subject: '您的充值已到账',
    description: '充值到账通知',
    variables: ['amount', 'asset', 'tx_hash', 'network', 'confirmations'],
    text: [
      '您好，',
      '',
      '您的充值已到账：',
      '',
      '  金额：{amount} {asset}',
      '  网络：{network}',
      '  交易哈希：{tx_hash}',
      '  当前确认数：{confirmations}',
      '',
      '资金已可用于交易。如需提现，请完成相应 KYC 等级。',
      '',
      '— SMY Exchange 团队',
    ].join('\n'),
    html: wrapHtml({
      title: '您的充值已到账',
      bodyHtml: `
        <p>您好，</p>
        <p>您的充值已到账：</p>
        <table class="kv-table" cellpadding="6" cellspacing="0" border="0">
          <tr><td class="kv-key">金额</td><td class="kv-val"><strong>{amount} {asset}</strong></td></tr>
          <tr><td class="kv-key">网络</td><td class="kv-val">{network}</td></tr>
          <tr><td class="kv-key">交易哈希</td><td class="kv-val" style="word-break: break-all;">{tx_hash}</td></tr>
          <tr><td class="kv-key">当前确认数</td><td class="kv-val">{confirmations}</td></tr>
        </table>
        <p class="muted">资金已可用于交易。</p>
      `,
    }),
  },

  // ---------------------------------------------------------------------------
  // 5. 异地登录
  // ---------------------------------------------------------------------------
  {
    id: 'TPL_LOGIN_ALERT',
    subject: '检测到新设备登录',
    description: '异地 / 新设备登录提醒',
    variables: ['time', 'ip', 'device', 'location'],
    text: [
      '您好，',
      '',
      '我们检测到您的账户在新设备上登录：',
      '',
      '  时间：{time}',
      '  IP：{ip}',
      '  设备：{device}',
      '  地点：{location}',
      '',
      '如非本人操作，请立即修改密码并启用 2FA。',
      '',
      '— SMY Exchange 团队',
    ].join('\n'),
    html: wrapHtml({
      title: '检测到新设备登录',
      bodyHtml: `
        <p>您好，</p>
        <p>我们检测到您的账户在新设备上登录：</p>
        <table class="kv-table" cellpadding="6" cellspacing="0" border="0">
          <tr><td class="kv-key">时间</td><td class="kv-val">{time}</td></tr>
          <tr><td class="kv-key">IP</td><td class="kv-val">{ip}</td></tr>
          <tr><td class="kv-key">设备</td><td class="kv-val">{device}</td></tr>
          <tr><td class="kv-key">地点</td><td class="kv-val">{location}</td></tr>
        </table>
        <p style="color: {BRAND_DANGER};"><strong>如非本人操作，请立即修改密码并启用 2FA。</strong></p>
      `,
      tone: 'warning',
    }),
  },

  // ---------------------------------------------------------------------------
  // 6. 安全告警
  // ---------------------------------------------------------------------------
  {
    id: 'TPL_SECURITY_ALERT',
    subject: '您的账户存在异常操作',
    description: '通用安全告警',
    variables: ['alert_type', 'time', 'detail'],
    text: [
      '您好，',
      '',
      '我们检测到您的账户存在异常操作：',
      '',
      '  操作类型：{alert_type}',
      '  时间：{time}',
      '  详情：{detail}',
      '',
      '如非本人操作，请立即冻结账户并联系客服。',
      '',
      '— SMY Exchange 团队',
    ].join('\n'),
    html: wrapHtml({
      title: '安全告警',
      bodyHtml: `
        <p>您好，</p>
        <p>我们检测到您的账户存在异常操作：</p>
        <table class="kv-table" cellpadding="6" cellspacing="0" border="0">
          <tr><td class="kv-key">操作类型</td><td class="kv-val"><strong>{alert_type}</strong></td></tr>
          <tr><td class="kv-key">时间</td><td class="kv-val">{time}</td></tr>
          <tr><td class="kv-key">详情</td><td class="kv-val">{detail}</td></tr>
        </table>
        <p style="color: {BRAND_DANGER};"><strong>如非本人操作，请立即冻结账户并联系客服。</strong></p>
      `,
      tone: 'danger',
    }),
  },

  // ---------------------------------------------------------------------------
  // 7. KYC 通过
  // ---------------------------------------------------------------------------
  {
    id: 'TPL_KYC_APPROVED',
    subject: '您的 KYC 认证已通过',
    description: 'KYC 审核通过',
    variables: ['level', 'time'],
    text: [
      '您好，',
      '',
      '恭喜！您的 KYC 认证已通过。',
      '',
      '  认证等级：{level}',
      '  审核时间：{time}',
      '',
      '您可以享受更高额度的交易、提现服务。',
      '',
      '— SMY Exchange 团队',
    ].join('\n'),
    html: wrapHtml({
      title: 'KYC 认证已通过',
      bodyHtml: `
        <p>您好，</p>
        <p class="success-icon">&#10004;</p>
        <p>恭喜！您的 KYC 认证已通过。</p>
        <table class="kv-table" cellpadding="6" cellspacing="0" border="0">
          <tr><td class="kv-key">认证等级</td><td class="kv-val"><strong>{level}</strong></td></tr>
          <tr><td class="kv-key">审核时间</td><td class="kv-val">{time}</td></tr>
        </table>
        <p class="muted">您可以享受更高额度的交易、提现服务。</p>
      `,
      tone: 'success',
    }),
  },

  // ---------------------------------------------------------------------------
  // 8. KYC 拒绝
  // ---------------------------------------------------------------------------
  {
    id: 'TPL_KYC_REJECTED',
    subject: '您的 KYC 认证未通过',
    description: 'KYC 审核拒绝',
    variables: ['reason', 'time'],
    text: [
      '您好，',
      '',
      '很抱歉，您的 KYC 认证未通过。',
      '',
      '  拒绝原因：{reason}',
      '  审核时间：{time}',
      '',
      '您可以重新提交资料进行认证。如有疑问请联系客服。',
      '',
      '— SMY Exchange 团队',
    ].join('\n'),
    html: wrapHtml({
      title: 'KYC 认证未通过',
      bodyHtml: `
        <p>您好，</p>
        <p style="color: {BRAND_DANGER};">很抱歉，您的 KYC 认证未通过。</p>
        <table class="kv-table" cellpadding="6" cellspacing="0" border="0">
          <tr><td class="kv-key">拒绝原因</td><td class="kv-val">{reason}</td></tr>
          <tr><td class="kv-key">审核时间</td><td class="kv-val">{time}</td></tr>
        </table>
        <p class="muted">您可以重新提交资料进行认证。如有疑问请联系客服。</p>
      `,
      tone: 'danger',
    }),
  },

  // ---------------------------------------------------------------------------
  // 9. Newsletter 每周行情简报
  // ---------------------------------------------------------------------------
  {
    id: 'TPL_NEWSLETTER',
    subject: 'SMY Exchange 每周行情简报',
    description: '营销 - 每周行情简报',
    variables: ['week', 'top_gainers', 'top_losers', 'highlight', 'cta_url'],
    text: [
      'SMY Exchange 每周行情简报 - {week}',
      '',
      '【本周亮点】',
      '{highlight}',
      '',
      '【涨幅榜】',
      '{top_gainers}',
      '',
      '【跌幅榜】',
      '{top_losers}',
      '',
      '立即查看完整榜单：{cta_url}',
      '',
      '— SMY Exchange',
    ].join('\n'),
    html: wrapHtml({
      title: '每周行情简报 - {week}',
      bodyHtml: `
        <p>本周亮点</p>
        <blockquote style="border-left: 3px solid {BRAND_PRIMARY}; padding-left: 12px; color: {BRAND_TEXT};">
          {highlight}
        </blockquote>
        <h3 style="color: {BRAND_SUCCESS};">涨幅榜</h3>
        <pre style="white-space: pre-wrap; font-family: -apple-system, monospace;">{top_gainers}</pre>
        <h3 style="color: {BRAND_DANGER};">跌幅榜</h3>
        <pre style="white-space: pre-wrap; font-family: -apple-system, monospace;">{top_losers}</pre>
        <p style="text-align:center; margin: 24px 0;">
          <a class="btn-primary" href="{cta_url}" target="_blank" rel="noopener">查看完整榜单</a>
        </p>
      `,
      tone: 'marketing',
    }),
  },
];

// =============================================================================
// HTML 包装器
// =============================================================================

interface WrapHtmlOptions {
  title: string;
  bodyHtml: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'marketing';
}

/**
 * 包装 HTML：完整邮件 HTML 文档结构
 * - 居中布局（max-width 600px）
 * - 主色 #1677FF
 * - 字号 14-16px
 * - 暗色 / 亮色 友好（prefers-color-scheme）
 * - 退订链接（UNSUBSCRIBE_PLACEHOLDER 由业务层注入）
 * - 支持 4 种 tone：default / success / warning / danger
 */
function wrapHtml(opts: WrapHtmlOptions): string {
  const tone = opts.tone ?? 'default';
  const accent =
    tone === 'success' ? BRAND_SUCCESS
    : tone === 'warning' ? BRAND_WARNING
    : tone === 'danger' ? BRAND_DANGER
    : tone === 'marketing' ? BRAND_PRIMARY
    : BRAND_PRIMARY;

  const resolved = opts.bodyHtml
    .replace(/\{BRAND_PRIMARY\}/g, BRAND_PRIMARY)
    .replace(/\{BRAND_SUCCESS\}/g, BRAND_SUCCESS)
    .replace(/\{BRAND_DANGER\}/g, BRAND_DANGER)
    .replace(/\{BRAND_MUTED\}/g, BRAND_MUTED);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${escapeHtml(opts.title)}</title>
  <style>
    body { margin: 0; padding: 0; background: ${BRAND_BG}; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: ${accent}; padding: 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 600; }
    .header .tagline { color: rgba(255,255,255,0.85); font-size: 12px; margin-top: 4px; }
    .content { padding: 32px 28px; }
    .content h2 { color: ${BRAND_TEXT}; font-size: 18px; margin-top: 0; }
    .content p { margin: 12px 0; font-size: 15px; }
    .muted { color: ${BRAND_MUTED}; font-size: 13px; }
    .otp-box { background: ${BRAND_BG}; border: 2px dashed ${BRAND_PRIMARY}; color: ${BRAND_PRIMARY}; font-size: 28px; font-weight: 700; letter-spacing: 8px; text-align: center; padding: 18px 12px; border-radius: 6px; margin: 18px 0; font-family: "SF Mono", Menlo, Consolas, monospace; }
    .btn-primary { display: inline-block; background: ${BRAND_PRIMARY}; color: #ffffff !important; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-size: 15px; font-weight: 600; }
    .btn-primary:hover { background: ${BRAND_PRIMARY_DARK}; }
    .kv-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .kv-table tr { border-bottom: 1px solid ${BRAND_BORDER}; }
    .kv-table td { padding: 10px 8px; font-size: 14px; vertical-align: top; }
    .kv-key { color: ${BRAND_MUTED}; width: 100px; }
    .kv-val { color: ${BRAND_TEXT}; word-break: break-all; }
    .success-icon { display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 50%; background: ${BRAND_SUCCESS}; color: #ffffff; text-align: center; font-size: 32px; margin: 0 0 12px 0; }
    .footer { background: ${BRAND_BG}; padding: 20px 28px; text-align: center; color: ${BRAND_MUTED}; font-size: 12px; border-top: 1px solid ${BRAND_BORDER}; }
    .footer a { color: ${BRAND_MUTED}; text-decoration: underline; }
    @media (prefers-color-scheme: dark) {
      body { background: #0B0F19 !important; color: #E5E7EB !important; }
      .container { background: #111827 !important; }
      .content p, .content h2, .kv-val { color: #E5E7EB !important; }
      .muted, .kv-key, .footer { color: #9CA3AF !important; }
      .otp-box { background: #1F2937 !important; }
      .footer { background: #0B0F19 !important; border-top-color: #374151 !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${escapeHtml(BRAND_LOGO)}</h1>
      <div class="tagline">${escapeHtml(BRAND_TAGLINE)}</div>
    </div>
    <div class="content">
      <h2>${escapeHtml(opts.title)}</h2>
      ${resolved}
    </div>
    <div class="footer">
      <div>本邮件由 SMY Exchange 系统自动发出，请勿直接回复。</div>
      <div style="margin-top: 8px;">
        <a href="${APP_BASE_URL_PLACEHOLDER}">访问官网</a>
        &nbsp;|&nbsp;
        <a href="${SUPPORT_EMAIL_PLACEHOLDER}">联系客服</a>
        &nbsp;|&nbsp;
        <a href="${UNSUBSCRIBE_PLACEHOLDER}">退订邮件</a>
      </div>
      <div style="margin-top: 8px;">&copy; ${new Date().getFullYear()} SMY Exchange. All rights reserved.</div>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// =============================================================================
// EmailTemplate
// =============================================================================

export class EmailTemplate {
  private readonly templates: Map<string, EmailTemplateDefinition> = new Map();

  constructor() {
    for (const t of BUILTIN_TEMPLATES) {
      this.templates.set(t.id, { ...t });
    }
  }

  /**
   * 渲染模板
   * @throws 如果模板不存在或缺少必填变量
   */
  render(templateId: string, variables: Record<string, string> = {}): RenderedEmail {
    const tmpl = this.templates.get(templateId);
    if (!tmpl) {
      throw new Error(`EmailTemplate: unknown template "${templateId}"`);
    }
    if (tmpl.variables && tmpl.variables.length > 0) {
      const missing = tmpl.variables.filter(
        (v) => variables[v] === undefined || variables[v] === null,
      );
      if (missing.length > 0) {
        throw new Error(`EmailTemplate: template "${templateId}" missing variables: ${missing.join(', ')}`);
      }
    }
    return {
      subject: this.interpolate(tmpl.subject, variables),
      text: this.interpolate(tmpl.text, variables),
      html: this.interpolate(tmpl.html, variables),
    };
  }

  /**
   * 渲染模板（宽松模式）：模板不存在或变量缺失时返回 null
   */
  tryRender(templateId: string, variables: Record<string, string> = {}): RenderedEmail | null {
    try {
      return this.render(templateId, variables);
    } catch {
      return null;
    }
  }

  /** 注册 / 覆盖一个模板 */
  register(def: EmailTemplateDefinition): void {
    if (!def.id) throw new Error('EmailTemplate.register: id is required');
    if (!def.subject) throw new Error('EmailTemplate.register: subject is required');
    if (!def.text) throw new Error('EmailTemplate.register: text is required');
    if (!def.html) throw new Error('EmailTemplate.register: html is required');
    this.templates.set(def.id, { ...def });
  }

  /** 删除模板（不允许删除 builtin） */
  remove(id: string): boolean {
    if (BUILTIN_TEMPLATES.find((t) => t.id === id)) return false;
    return this.templates.delete(id);
  }

  /** 获取模板定义 */
  get(id: string): EmailTemplateDefinition | undefined {
    return this.templates.get(id);
  }

  /** 是否存在 */
  has(id: string): boolean {
    return this.templates.has(id);
  }

  /** 列出所有模板 */
  list(): EmailTemplateDefinition[] {
    return Array.from(this.templates.values()).map((t) => ({ ...t }));
  }

  /** 列出 builtin 模板 ID */
  listBuiltinIds(): string[] {
    return BUILTIN_TEMPLATES.map((t) => t.id);
  }

  /**
   * 简单占位符替换：{name} 风格
   * 不支持转义，不支持嵌套
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

export function createEmailTemplate(): EmailTemplate {
  return new EmailTemplate();
}

export { BUILTIN_TEMPLATES };

export default EmailTemplate;
