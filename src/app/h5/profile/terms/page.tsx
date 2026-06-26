'use client';

import { useState } from 'react';
import { FileText, Check, ChevronDown, ChevronRight, Shield } from 'lucide-react';

interface Agreement {
  id: string;
  title: string;
  updated: string;
  content: string[];
}

const AGREEMENTS: Agreement[] = [
  {
    id: 'user',
    title: '用户服务协议',
    updated: '2026-06-01',
    content: [
      '一、服务协议的接受',
      '本协议是您与 ZS Exchange（以下简称"本平台"）之间就使用本平台服务所订立的协议。在使用本平台服务前，请仔细阅读本协议全部条款。一旦您使用本平台服务，即视为您已充分理解并同意接受本协议全部条款。',
      '',
      '二、账户注册与使用',
      '1. 您应当使用真实有效的手机号或邮箱注册账户，并完成必要的身份认证；',
      '2. 账户一经注册不可重复注册，所有账户操作均视为账户注册人本人操作；',
      '3. 您应妥善保管账户密码、验证码、私钥等敏感信息，因泄露造成的损失由您自行承担；',
      '4. 如发现账户被盗用，应立即联系本平台客服并采取必要措施。',
      '',
      '三、服务内容',
      '本平台为您提供包括但不限于以下服务：',
      '1. 数字资产现货交易、币币兑换；',
      '2. 永续合约、期权合约交易；',
      '3. 理财、DeFi 流动性挖矿、质押等增值服务；',
      '4. NFT、IDO 等创新业务；',
      '5. 法币 C2C 交易、跨境支付。',
      '',
      '四、用户行为规范',
      '1. 不得利用本平台从事任何违法违规活动；',
      '2. 不得从事洗钱、恐怖融资、内幕交易、操纵市场等行为；',
      '3. 不得利用平台漏洞获取不正当利益；',
      '4. 不得恶意干扰平台正常运营。',
      '',
      '五、风险提示',
      '数字资产交易存在重大风险，价格波动剧烈，可能导致部分或全部本金损失。请您根据自身风险承受能力审慎决策，本平台不为您的投资损失承担责任。',
      '',
      '六、协议的变更与终止',
      '本平台有权根据法律法规变更或业务调整修改本协议，修改后的协议将在平台公布。您继续使用本平台服务即视为接受修改后的协议。',
    ],
  },
  {
    id: 'privacy',
    title: '隐私政策',
    updated: '2026-05-15',
    content: [
      '一、信息收集',
      '本平台收集的信息包括：',
      '1. 账户注册信息：手机号、邮箱、密码（加密存储）；',
      '2. 身份认证信息：姓名、身份证号、证件照片、人脸识别数据；',
      '3. 交易信息：充值/提现/交易记录；',
      '4. 设备信息：设备型号、操作系统、IP 地址、浏览器类型。',
      '',
      '二、信息使用',
      '本平台收集的信息仅用于：',
      '1. 提供和维护平台服务；',
      '2. 进行身份认证与反洗钱合规审查；',
      '3. 防范账户被盗用与欺诈行为；',
      '4. 向您推送服务通知与重要公告；',
      '5. 满足法律法规规定的报告义务。',
      '',
      '三、信息共享',
      '除下列情况外，本平台不会向第三方共享您的个人信息：',
      '1. 获得您本人明确同意；',
      '2. 法律法规或政府主管部门要求；',
      '3. 为完成交易或服务必需的合作机构（如支付通道、KYC 认证机构）。',
      '',
      '四、信息存储与保护',
      '1. 您的个人信息存储于境内外符合安全标准的服务器；',
      '2. 敏感信息采用 AES-256 加密存储；',
      '3. 内部访问严格按"最小必要"原则授权。',
      '',
      '五、您的权利',
      '您有权查看、更正、删除您的个人信息，注销账户。',
    ],
  },
  {
    id: 'risk',
    title: '风险提示书',
    updated: '2026-04-20',
    content: [
      '尊敬的客户：',
      '数字资产交易具有高度风险，请您仔细阅读以下风险提示：',
      '',
      '一、价格波动风险',
      '数字资产价格受市场情绪、监管政策、技术发展等多种因素影响，可能在短时间内出现剧烈波动，您可能面临全部本金损失的风险。',
      '',
      '二、合约交易风险',
      '1. 合约交易采用保证金制度，杠杆可放大收益亦可放大损失；',
      '2. 当市场行情不利时，可能触发强平，导致本金全部损失；',
      '3. 极端行情下可能产生穿仓损失，您需承担相应责任。',
      '',
      '三、技术风险',
      '1. 区块链网络可能出现拥堵、确认延迟、分叉等不可控情况；',
      '2. 智能合约可能存在未知漏洞；',
      '3. 平台系统可能因不可抗力暂停服务。',
      '',
      '四、合规风险',
      '不同国家/地区对数字资产的监管政策存在差异，您应自行了解所在司法辖区的相关法规。',
      '',
      '五、其他风险',
      '包括但不限于流动性风险、操作风险、政策风险等。',
    ],
  },
];

export default function H5ProfileTermsPage() {
  const [active, setActive] = useState<Agreement>(AGREEMENTS[0]);
  const [expanded, setExpanded] = useState(true);

  return (
    <div style={{ padding: '12px' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#38BDF8', borderRadius: 2 }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>用户协议</span>
      </div>

      {/* 协议 Tab */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: 4,
          background:
            'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 12,
          marginBottom: 12,
        }}
      >
        {AGREEMENTS.map((a) => (
          <button
            key={a.id}
            onClick={() => setActive(a)}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 8,
              border: 'none',
              background: active.id === a.id ? 'rgba(56, 189, 248, 0.20)' : 'transparent',
              color: active.id === a.id ? '#38BDF8' : '#7B89B8',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            {active.id === a.id && <Check size={11} />}
            {a.title}
          </button>
        ))}
      </div>

      {/* 元数据 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 12px',
          background: 'rgba(240, 185, 11, 0.10)',
          border: '1px solid rgba(240, 185, 11, 0.25)',
          borderRadius: 10,
          marginBottom: 12,
        }}
      >
        <FileText size={12} color="#F0B90B" />
        <span style={{ fontSize: 11, color: '#FCD535', fontWeight: 600 }}>
          最后更新：{active.updated}
        </span>
        <span style={{ flex: 1 }} />
        <button
          onClick={() => setExpanded((e) => !e)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            padding: '4px 8px',
            borderRadius: 6,
            background: 'rgba(56, 189, 248, 0.15)',
            border: 'none',
            color: '#38BDF8',
            fontSize: 10,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          {expanded ? '收起' : '展开'}
        </button>
      </div>

      {/* 内容 */}
      {expanded && (
        <div
          style={{
            background:
              'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
            border: '1px solid rgba(148, 163, 184, 0.12)',
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: '#F8FAFC',
              margin: '0 0 12px',
            }}
          >
            {active.title}
          </h2>
          {active.content.map((p, i) => {
            if (p === '') return <div key={i} style={{ height: 8 }} />;
            const isHeading = /^([一二三四五六七八九十]+、|（.+）)/.test(p);
            return (
              <div
                key={i}
                style={{
                  fontSize: 12,
                  color: isHeading ? '#FCD535' : '#B4C0E0',
                  lineHeight: 1.8,
                  fontWeight: isHeading ? 700 : 400,
                  margin: '2px 0',
                }}
              >
                {p}
              </div>
            );
          })}
        </div>
      )}

      {/* 同意按钮 */}
      <button
        style={{
          width: '100%',
          padding: '14px 0',
          background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
          color: '#0F1B3D',
          fontSize: 15,
          fontWeight: 800,
          border: 'none',
          borderRadius: 14,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          boxShadow: '0 4px 16px rgba(240, 185, 11, 0.30)',
        }}
      >
        <Shield size={16} strokeWidth={2.5} /> 我已阅读并同意
      </button>

      <div style={{ height: 20 }} />
    </div>
  );
}
