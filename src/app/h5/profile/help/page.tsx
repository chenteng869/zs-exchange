'use client';

import { useState } from 'react';
import {
  Search,
  ChevronRight,
  ChevronDown,
  MessageCircle,
  BookOpen,
  HelpCircle,
  CreditCard,
  Wallet,
  Shield,
  TrendingUp,
  Layers,
  FileText,
  Phone,
  Mail,
  Send,
} from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

interface FaqGroup {
  id: string;
  title: string;
  icon: React.ElementType;
  iconColor: string;
  items: FaqItem[];
}

const FAQ_GROUPS: FaqGroup[] = [
  {
    id: 'g1',
    title: '账户与安全',
    icon: Shield,
    iconColor: '#34D399',
    items: [
      { q: '如何开启二次验证 (2FA)？', a: '在「安全设置」中开启 Google Authenticator 或短信二次验证，推荐使用 Google Authenticator。' },
      { q: '忘记登录密码怎么办？',     a: '在登录页点击「忘记密码」，通过邮箱/手机验证码 + 身份验证后即可重置。' },
      { q: '如何修改资金密码？',       a: '在「安全设置」-「资金密码」中验证原密码后即可修改。' },
    ],
  },
  {
    id: 'g2',
    title: '充值与提现',
    icon: Wallet,
    iconColor: '#38BDF8',
    items: [
      { q: '充值多久到账？',           a: 'BTC/ETH 等链上转账需 1-3 个区块确认，约 5-30 分钟；ERC20/USDT 等需更多确认。' },
      { q: '提现手续费多少？',         a: 'BTC 0.0001, ETH 0.005, USDT-TRC20 1, USDT-ERC20 5，具体以提现页面为准。' },
      { q: '提现限额是多少？',         a: 'KYC0 等级 1 BTC/日，KYC1 等级 10 BTC/日，KYC2 等级 100 BTC/日。' },
    ],
  },
  {
    id: 'g3',
    title: '交易问题',
    icon: TrendingUp,
    iconColor: '#F0B90B',
    items: [
      { q: '市价单与限价单的区别？',   a: '市价单按当前最优市价立即成交；限价单在指定价格或更优价格成交。' },
      { q: '合约交易爆仓规则？',       a: '当账户保证金率 ≤ 维持保证金率时触发强平，强平价 = 开仓价 × (1 - 1/杠杆)。' },
      { q: '撤单失败原因？',           a: '常见原因：1) 已部分/全部成交 2) 委托量低于最小下单量 3) 余额不足。' },
    ],
  },
  {
    id: 'g4',
    title: '理财与 DeFi',
    icon: Layers,
    iconColor: '#A78BFA',
    items: [
      { q: '定期理财如何计息？',       a: '锁仓期间按 APY 年化计息，每日 00:00 结算昨日收益到可用余额。' },
      { q: 'DeFi 池的无常损失是什么？', a: '当池中两种代币价格背离时，持币相比单纯持有可能产生损失。' },
    ],
  },
];

const HOT_QUESTIONS = [
  '如何注册账户？',
  '如何完成 KYC 认证？',
  '充值没到账怎么办？',
  '合约资金费率怎么算？',
];

export default function H5ProfileHelpPage() {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>('g1-0');

  const toggle = (id: string) => setExpanded((s) => (s === id ? null : id));

  return (
    <div style={{ padding: '12px' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#38BDF8', borderRadius: 2 }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>帮助中心</span>
      </div>

      {/* 搜索框 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          background:
            'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 14,
          marginBottom: 12,
        }}
      >
        <Search size={16} color="#7B89B8" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索问题、关键词..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#F8FAFC',
            fontSize: 13,
            fontFamily: 'inherit',
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{
              padding: '2px 6px',
              borderRadius: 4,
              background: 'rgba(148, 163, 184, 0.10)',
              border: 'none',
              color: '#7B89B8',
              fontSize: 10,
              cursor: 'pointer',
            }}
          >
            清除
          </button>
        )}
      </div>

      {/* 入口宫格 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
          marginBottom: 14,
        }}
      >
        {[
          { icon: BookOpen,   label: '新手教程', color: '#38BDF8' },
          { icon: CreditCard, label: '费率说明', color: '#FCD535' },
          { icon: Shield,     label: '安全指南', color: '#34D399' },
          { icon: FileText,   label: 'API 文档', color: '#A78BFA' },
        ].map((it) => {
          const Icon = it.icon;
          return (
            <div
              key={it.label}
              style={{
                padding: 12,
                background:
                  'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
                border: '1px solid rgba(148, 163, 184, 0.12)',
                borderRadius: 14,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: `${it.color}26`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 6px',
                }}
              >
                <Icon size={16} color={it.color} />
              </div>
              <div style={{ fontSize: 11, color: '#B4C0E0' }}>{it.label}</div>
            </div>
          );
        })}
      </div>

      {/* 热门问题 */}
      <SectionTitle title="热门问题" />
      <div
        style={{
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          marginBottom: 14,
        }}
      >
        {HOT_QUESTIONS.map((q) => (
          <span
            key={q}
            style={{
              padding: '6px 12px',
              borderRadius: 16,
              background: 'rgba(56, 189, 248, 0.10)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: '#38BDF8',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {q}
          </span>
        ))}
      </div>

      {/* FAQ 分组 */}
      {FAQ_GROUPS.map((g) => {
        const Icon = g.icon;
        return (
          <div key={g.id} style={{ marginBottom: 12 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                margin: '0 4px 8px',
              }}
            >
              <Icon size={14} color={g.iconColor} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>{g.title}</span>
            </div>
            <div
              style={{
                background:
                  'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
                border: '1px solid rgba(148, 163, 184, 0.12)',
                borderRadius: 16,
                overflow: 'hidden',
              }}
            >
              {g.items.map((it, i) => {
                const id = `${g.id}-${i}`;
                const open = expanded === id;
                return (
                  <div
                    key={id}
                    style={{
                      borderBottom: i < g.items.length - 1 ? '1px solid rgba(148, 163, 184, 0.06)' : 'none',
                    }}
                  >
                    <div
                      onClick={() => toggle(id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '12px 14px',
                        cursor: 'pointer',
                      }}
                    >
                      <HelpCircle size={14} color={g.iconColor} />
                      <span style={{ flex: 1, fontSize: 13, color: '#F8FAFC' }}>{it.q}</span>
                      {open ? (
                        <ChevronDown size={14} color="#7B89B8" />
                      ) : (
                        <ChevronRight size={14} color="#7B89B8" />
                      )}
                    </div>
                    {open && (
                      <div
                        style={{
                          padding: '0 14px 12px 38px',
                          fontSize: 12,
                          color: '#B4C0E0',
                          lineHeight: 1.7,
                        }}
                      >
                        {it.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* 联系我们 */}
      <SectionTitle title="联系我们" />
      <div
        style={{
          background:
            'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: 16,
          padding: 14,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 8,
        }}
      >
        {[
          { icon: MessageCircle, label: '在线客服', value: '7×24h',  color: '#38BDF8' },
          { icon: Mail,          label: '邮件咨询', value: '2h 内回复', color: '#F0B90B' },
          { icon: Send,          label: 'Telegram', value: '@ZSE_Support', color: '#34D399' },
          { icon: Phone,         label: '电话',     value: '+1 684-1234', color: '#A78BFA' },
        ].map((it) => {
          const Icon = it.icon;
          return (
            <div
              key={it.label}
              style={{
                padding: 10,
                background: 'rgba(15, 27, 61, 0.40)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: `${it.color}26`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={14} color={it.color} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, color: '#7B89B8' }}>{it.label}</div>
                <div style={{ fontSize: 11, color: '#F8FAFC', fontWeight: 600, marginTop: 1 }}>{it.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        margin: '0 4px 8px',
      }}
    >
      <div style={{ width: 3, height: 12, background: '#F0B90B', borderRadius: 2 }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC' }}>{title}</span>
    </div>
  );
}
