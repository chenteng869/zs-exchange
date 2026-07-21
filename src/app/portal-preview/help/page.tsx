/**
 * /portal-preview/help - 帮助中心入口聚合页（P4-0206）
 * 任务：Q05-FrontPortal-P4-Core-Portal-Skeleton
 * 模板：HelpCenterTemplate
 * 约束：仅静态骨架，不接真实数据
 */

import React from 'react';
import { HelpCenterTemplate, type HelpArticle } from '@/components/portal-preview/core/templates';
import { buildBreadcrumbs } from '@/components/portal-preview/core/config/p4-navigation';

export const metadata = {
  title: '帮助中心 | ZSDEX',
  description: '新手入门、账户、KYC、充值提现、交易、安全 FAQ',
};

const CATEGORIES = ['新手入门', '账户与身份', '资金', '交易', '安全'];

const ARTICLES: HelpArticle[] = [
  {
    id: '1',
    category: '新手入门',
    title: '如何在 ZSDEX 完成注册？',
    summary: '通过邮箱或手机号注册 ZSDEX 账户的完整流程',
    content: `1. 访问注册页面 https://portal-preview/account/register
2. 选择邮箱或手机号注册方式
3. 输入有效凭证，设置安全密码
4. 接收并填写验证码
5. 阅读并同意《用户协议》与《隐私政策》
6. 完成注册，登录账户

注意事项：
- 密码应包含大小写字母、数字与特殊字符，长度至少 8 位
- 建议开启二次验证（2FA）增强账户安全
- 同一身份信息仅可注册一个账户`,
    helpful: 128,
  },
  {
    id: '2',
    category: '新手入门',
    title: '新手必读：交易前需要做哪些准备？',
    summary: '从注册到完成第一笔交易的完整路径',
    content: `完成第一笔交易前，建议按以下顺序操作：

1. 完成 KYC 身份认证（提升账户等级与功能权限）
2. 开启二次验证（2FA）
3. 设置反钓鱼码（识别官方邮件）
4. 充值数字资产或法币
5. 阅读交易规则与风险披露
6. 熟悉现货 / 合约 / 杠杆等产品差异
7. 从小额交易开始，逐步积累经验`,
    helpful: 256,
  },
  {
    id: '3',
    category: '账户与身份',
    title: 'KYC 认证审核需要多久？',
    summary: 'KYC 审核时间、常见拒绝原因与处理方式',
    content: `标准审核时效：
- 普通认证：1-3 个工作日
- 加急认证：24 小时内（特定等级用户）

常见拒绝原因：
- 证件照片不清晰或信息不完整
- 证件与本人不一致
- 活体检测未通过
- 证件已过期

如审核被拒绝，请根据邮件提示重新提交资料。`,
    helpful: 89,
  },
  {
    id: '4',
    category: '账户与身份',
    title: '如何修改账户密码？',
    summary: '登录密码与资金密码的修改方法',
    content: `登录密码修改：
1. 进入"账户中心 - 账户安全"
2. 选择"修改登录密码"
3. 输入原密码与新密码
4. 完成二次验证确认
5. 修改成功

资金密码修改：
- 资金密码与登录密码独立设置
- 修改需通过原资金密码 + 二次验证
- 连续输错 5 次将锁定 24 小时`,
    helpful: 64,
  },
  {
    id: '5',
    category: '资金',
    title: '数字资产充值教程',
    summary: '从外部钱包向 ZSDEX 充值的完整流程',
    content: `充值步骤：
1. 进入"资产中心 - 充值"
2. 选择币种（如 BTC / ETH / USDT）
3. 选择充值网络（务必与提现方网络一致）
4. 复制平台充值地址或扫描二维码
5. 在外部钱包粘贴地址，确认网络后发起转账
6. 等待链上确认（不同币种与网络所需确认数不同）

⚠️ 重要提示：
- 充值前务必确认网络一致，否则资产可能永久丢失
- 最小充值金额因币种而异，未达最小金额将不会入账
- 大额充值建议先小额测试`,
    helpful: 312,
  },
  {
    id: '6',
    category: '资金',
    title: '提现到账时间说明',
    summary: '不同币种与网络的提现到账时效',
    content: `提现到账时间取决于区块链网络拥堵情况与平台风控审核：

- BTC：30-60 分钟（3 个区块确认）
- ETH：5-15 分钟（12 个区块确认）
- USDT-TRC20：1-5 分钟
- USDT-ERC20：5-15 分钟
- 法币提现：1-3 个工作日（取决于银行处理速度）

如遇提现延迟，可通过"工单系统"提交查询。`,
    helpful: 178,
  },
  {
    id: '7',
    category: '交易',
    title: '现货交易与合约交易的区别',
    summary: '两种交易模式的核心差异',
    content: `现货交易：
- 即时买卖实际资产
- 无杠杆，盈亏 = (卖出价 - 买入价) × 数量
- 适合中长期持有

合约交易：
- 交易的是合约，不持有实际资产
- 支持多倍杠杆，盈亏放大
- 存在强平风险
- 适合短期投机与对冲

⚠️ 合约交易风险较高，新手建议先熟悉现货交易。`,
    helpful: 421,
  },
  {
    id: '8',
    category: '交易',
    title: '如何设置止损与止盈？',
    summary: '限价单、止损单、止盈单的使用方法',
    content: `止损 / 止盈可通过两种方式设置：

方式一：下单时附带
- 在下单面板中勾选"止损"或"止盈"
- 输入触发价格与执行价格
- 提交订单即可

方式二：持仓后追加
- 在"当前持仓"列表中选择目标仓位
- 点击"止损"或"止盈"
- 设置触发与执行价格
- 确认提交

建议：止损 / 止盈是控制风险的有效工具，建议所有仓位都设置止损。`,
    helpful: 256,
  },
  {
    id: '9',
    category: '安全',
    title: '如何识别钓鱼邮件与网站？',
    summary: '常见钓鱼手段与防范方法',
    content: `常见钓鱼特征：
- 邮件域名不是 @zsdex.com 官方域名
- 邮件中要求输入密码或私钥
- 链接地址与官方不一致（注意拼写）
- 制造紧迫感（如"24 小时内未验证将封号"）

防范方法：
1. 设置反钓鱼码（在账户安全中）
2. 所有官方邮件应包含您的反钓鱼码
3. 不点击邮件中的链接，直接访问官网
4. 不在非官方页面输入账户凭证
5. 启用二次验证（2FA）`,
    helpful: 198,
  },
  {
    id: '10',
    category: '安全',
    title: '账户被盗应急处理流程',
    summary: '发现账户异常时的紧急处理步骤',
    content: `如怀疑账户被盗，请立即执行以下操作：

1. 立即修改登录密码与资金密码
2. 解除所有第三方授权（API Key、设备授权）
3. 启用账户冻结（如账户支持）
4. 提交紧急工单，附上可疑操作时间与内容
5. 配合平台安全团队调查
6. 必要时报警并保留证据

⚠️ 平台不会主动要求用户提供密码、私钥或验证码。`,
    helpful: 145,
  },
];

export default function HelpPage() {
  return (
    <HelpCenterTemplate
      title="帮助中心"
      description="查找常见问题解答与使用教程，按 / 聚焦搜索，Esc 关闭详情"
      breadcrumbs={buildBreadcrumbs('/portal-preview/help')}
      categories={CATEGORIES}
      articles={ARTICLES}
      showSearch
      complianceNote="本帮助中心内容为示例数据，具体功能以平台正式版为准。如有疑问，请通过官方渠道联系客服。"
    />
  );
}
