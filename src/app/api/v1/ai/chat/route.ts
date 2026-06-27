import { NextRequest } from 'next/server';
import { success, badRequest } from '@/lib/api/response';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

// Intent classifier — matches key trading topics
function classifyIntent(text: string): string {
  const t = text.toLowerCase();
  if (/btc|bitcoin|比特/.test(t)) return 'btc';
  if (/eth|ethereum|以太/.test(t)) return 'eth';
  if (/sol|solana/.test(t)) return 'sol';
  if (/热门|涨|pump|trending/.test(t)) return 'trending';
  if (/合约|contract|永续|futures|杠杆|leverage/.test(t)) return 'futures';
  if (/现货|spot/.test(t)) return 'spot';
  if (/kyc|认证|身份/.test(t)) return 'kyc';
  if (/otc|大宗/.test(t)) return 'otc';
  if (/充值|deposit|入金/.test(t)) return 'deposit';
  if (/提现|withdraw|出金/.test(t)) return 'withdraw';
  if (/手续费|fee|费率/.test(t)) return 'fee';
  if (/安全|password|密码|2fa/.test(t)) return 'security';
  if (/api|接口/.test(t)) return 'api';
  if (/风险|risk|止损|stoploss/.test(t)) return 'risk';
  if (/量化|quant|策略|strategy/.test(t)) return 'quant';
  return 'default';
}

const RESPONSES: Record<string, string[]> = {
  btc: [
    'BTC 是市值最大的加密资产，当前市场处于震荡整理阶段。\n建议关注：\n• 日线级别支撑/阻力位\n• 链上大额转账动向\n• 宏观美联储政策变化\n\n⚠️ 以上为一般性分析，不构成投资建议。',
    'Bitcoin 目前仍是加密市场的主导资产（BTC.D > 50%）。\n操作参考：\n• 趋势向上时可关注回调后的支撑入场机会\n• 做空谨慎，市值大波动性相对小\n• 止损设置建议不超过持仓的 2%',
  ],
  eth: [
    'ETH 是智能合约平台领头羊，与 BTC 走势高度相关。\n近期关注点：\n• ETH 2.0 质押率变化\n• Layer2 生态活跃度（ARB/OP）\n• Gas 费变动趋势\n\n当前市场情绪中性，建议观望为主。',
  ],
  sol: [
    'SOL 近期生态表现活跃，MEME 赛道带动情绪。\n关注风险：\n• 短期波动幅度较大（Beta > 1.5）\n• 流动性在夜盘时段明显下降\n• 建议仓位控制在总资产 5% 以内',
  ],
  trending: [
    '今日市场热点（基于内部量化信号）：\n1. 📈 BTC 震荡偏强，关注 68,000 压力\n2. 🔥 SOL 生态 MEME 轮动活跃\n3. ⚡ Layer2 赛道（ARB / OP）正在补涨\n4. 💎 稳定币收益率普涨，资金在流入\n\n数据每 4 小时更新，仅供参考。',
  ],
  futures: [
    '合约交易须知：\n\n开通步骤：\n1. 完成 KYC 二级认证\n2. 资产→合约账户 划转 USDT\n3. 进入「交易 → 永续合约」\n\n费率：Maker 0.02% / Taker 0.05%\n最高杠杆：100x（推荐新手 ≤ 5x）\n\n⚠️ 合约交易风险极高，请确认止损后再开仓。',
    '杠杆建议：\n• 新手：1-3x，控制风险为主\n• 进阶：5-10x，需有完善止损策略\n• 高手：20x+，需严格风控纪律\n\n强平价格 = 开仓价 × (1 ± 1/杠杆倍数 × 0.9)',
  ],
  spot: [
    '现货交易是最基础的交易方式，适合新用户入门。\n\n优势：\n• 无爆仓风险\n• 可长期持有\n• 支持限价 / 市价单\n\n推荐策略：定投 BTC/ETH，分批建仓，不追涨杀跌。',
  ],
  kyc: [
    'KYC 认证说明：\n\n基础（Level 1）：邮箱 + 手机\n中级（Level 2）：身份证 + 人脸\n高级（Level 3）：居住证明\n\n Level 2 解锁：\n• 现货/合约全功能\n• 单日提现 ≤ 50,000 USDT\n\n进入「我的 → 身份认证」提交资料，通常 24 小时内完成审核。',
  ],
  deposit: [
    '充值说明：\n\n1. 进入「资产 → 充值」\n2. 选择币种和网络（请注意网络匹配！）\n3. 复制收款地址，从外部钱包发送\n4. BTC 通常 1-3 个确认入账，ETH/USDT 约 12 个确认\n\n⚠️ 充错网络可能导致资产永久丢失，请仔细核对。',
  ],
  withdraw: [
    '提现说明：\n\n1. 进入「资产 → 提现」\n2. 选择币种、输入地址和金额\n3. 进行二次验证（邮件 / 手机 / 2FA）\n4. 等待人工审核（大额）或自动处理（小额）\n\n最低提现：BTC 0.001 / ETH 0.01 / USDT 10\n手续费按网络实时 Gas 动态定价。',
  ],
  fee: [
    '费率体系：\n\n现货：\n• Maker（挂单）: 0.10%\n• Taker（吃单）: 0.15%\n\n合约：\n• Maker: 0.02%\n• Taker: 0.05%\n• 资金费率: 每 8 小时结算\n\nVIP 等级越高，折扣越大。持有 ZST 平台币可享额外 25% 费率折扣。',
  ],
  security: [
    '账户安全建议：\n\n1. ✅ 开启 Google Authenticator (2FA)\n2. ✅ 设置提现白名单地址\n3. ✅ 开启登录邮件通知\n4. ✅ 使用强密码（>12位，含特殊字符）\n5. ❌ 切勿在非官方链接登录\n\n进入「设置 → 安全中心」管理安全功能。',
  ],
  api: [
    'API 接入说明：\n\n1. 进入「设置 → API 管理」创建密钥\n2. 设置 IP 白名单和权限范围\n3. 参考文档：docs.zs-exchange.com\n\n支持：REST API / WebSocket 行情流\nSDK：Python / Node.js / Java\n\n请妥善保管 API Secret，不要泄露给第三方。',
  ],
  risk: [
    '风险管理要点：\n\n• 仓位管理：单笔风险 ≤ 总资产 2%\n• 止损设置：开仓同时设好止损价\n• 分散投资：不超过 3-5 个主流币\n• 情绪管理：避免在恐惧/贪婪极端时操作\n• 流动性：保留 20-30% 现金灵活应对\n\n「保住本金」始终是第一要务。',
  ],
  quant: [
    '量化策略简介：\n\n平台支持策略类型：\n1. 网格策略 — 区间震荡套利\n2. DCA 定投 — 长期平滑成本\n3. 动量策略 — 趋势追踪\n4. 套利策略 — 跨所/跨市场价差\n\n进入「AI → 量化分析」可查看实时策略信号和回测数据。\n\n年化收益中位数 40-120%（历史数据，不代表未来）。',
  ],
  default: [
    '感谢你的提问！我是 ZS-AI 智能客服小 Z。\n\n我能帮助你解答：\n• 行情分析与投资建议\n• 合约/现货交易操作\n• 充值提现流程\n• 账户安全与 KYC\n• 费率与 VIP 权益\n\n请重新描述你的问题，我会尽快为你解答 😊',
    '收到你的问题，我正在分析中...\n\n如需帮助请试试：\n「BTC 现在能买吗？」\n「如何开通合约？」\n「提现最快多久？」\n「怎么降低手续费？」',
  ],
};

function buildReply(userText: string): string {
  const intent = classifyIntent(userText);
  const pool = RESPONSES[intent] || RESPONSES.default;
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const message = String(body.message || '').trim();

  if (!message) {
    return badRequest('Message is required');
  }

  if (message.length > 500) {
    return badRequest('Message too long');
  }

  const history: ChatMessage[] = Array.isArray(body.history) ? body.history.slice(-10) : [];
  void history; // reserved for context-aware replies in future

  const reply = buildReply(message);

  return success({ reply, intent: classifyIntent(message) });
}
