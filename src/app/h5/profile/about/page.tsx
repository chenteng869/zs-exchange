'use client';

import {
  Building2,
  Award,
  Globe,
  Mail,
  Phone,
  MapPin,
  Star,
  Shield,
  CheckCircle2,
  Code,
  Activity,
  Send,
  ChevronRight,
} from 'lucide-react';

export default function H5ProfileAboutPage() {
  return (
    <div style={{ padding: '12px' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#38BDF8', borderRadius: 2 }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>关于我们</span>
      </div>

      {/* Logo 卡 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 50%, #172554 100%)',
          borderRadius: 18,
          padding: 24,
          marginBottom: 12,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -40,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(252, 213, 53, 0.30) 0%, transparent 70%)',
          }}
        />
        <div style={{ position: 'relative' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 22,
              background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              fontSize: 30,
              fontWeight: 800,
              color: '#fff',
              boxShadow: '0 8px 24px rgba(56, 189, 248, 0.40)',
            }}
          >
            S
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
            ZS Exchange
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.70)' }}>
            Samoa Licensed Digital Asset Exchange
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 12,
              padding: '4px 12px',
              borderRadius: 12,
              background: 'rgba(252, 213, 53, 0.20)',
              color: '#FCD535',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            <Star size={11} fill="#FCD535" /> v2.1.0 · 2026
          </div>
        </div>
      </div>

      {/* 公司介绍 */}
      <Card title="公司介绍">
        <p style={{ fontSize: 12, color: '#B4C0E0', lineHeight: 1.8, margin: 0 }}>
          ZS Exchange 是全球领先的合规数字资产交易平台，总部位于萨摩亚，持有
          <span style={{ color: '#FCD535', fontWeight: 700 }}> 萨摩亚金融服务监管局 (SFC) </span>
          颁发的数字资产交易所牌照与证券交易所牌照，平台致力于为全球用户提供安全、专业、高效的数字资产交易服务。
        </p>
      </Card>

      {/* 数据 */}
      <Card title="平台数据">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
          }}
        >
          {[
            { label: '注册用户',   value: '520万+',  color: '#38BDF8' },
            { label: '日均交易额', value: '$38亿',   color: '#FCD535' },
            { label: '支持币种',   value: '350+',    color: '#A78BFA' },
            { label: '覆盖国家',   value: '180+',    color: '#34D399' },
          ].map((it) => (
            <div
              key={it.label}
              style={{
                padding: 12,
                background: 'rgba(15, 27, 61, 0.40)',
                borderRadius: 10,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: it.color,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {it.value}
              </div>
              <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>{it.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* 牌照 */}
      <Card title="合规牌照">
        <License
          name="数字资产交易所牌照"
          no="SFC-DEX-2025-001"
          authority="萨摩亚金融服务监管局"
          scope="数字资产现货 / 币币兑换"
        />
        <License
          name="证券交易所牌照"
          no="SFC-SEX-2025-002"
          authority="萨摩亚金融服务监管局"
          scope="证券型代币 (STO) 发行与交易"
        />
      </Card>

      {/* 联系方式 */}
      <Card title="联系我们">
        <Contact icon={Mail}     label="商务合作"  value="business@zse.exchange" />
        <Contact icon={Mail}     label="客户支持"  value="support@zse.exchange" />
        <Contact icon={Phone}    label="客服热线"  value="+1 (684) 1234-5678" />
        <Contact icon={MapPin}   label="总部地址"  value="Apia, Samoa" />
        <Contact icon={Globe}    label="官方网站"  value="www.zse.exchange" last />
      </Card>

      {/* 社交媒体 */}
      <Card title="关注我们">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
          }}
        >
          {[
            { icon: Activity,  label: 'Twitter',  color: '#38BDF8' },
            { icon: Send,      label: 'Telegram', color: '#38BDF8' },
            { icon: Code,      label: 'GitHub',   color: '#B4C0E0' },
          ].map((it) => {
            const Icon = it.icon;
            return (
              <div
                key={it.label}
                style={{
                  padding: 12,
                  background: 'rgba(15, 27, 61, 0.40)',
                  borderRadius: 10,
                  textAlign: 'center',
                  cursor: 'pointer',
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
                  <Icon size={18} color={it.color} />
                </div>
                <div style={{ fontSize: 11, color: '#B4C0E0' }}>{it.label}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 备案 */}
      <div
        style={{
          marginTop: 12,
          padding: 12,
          textAlign: 'center',
          fontSize: 10,
          color: '#7B89B8',
          lineHeight: 1.8,
        }}
      >
        © 2025-2026 ZS Exchange. All Rights Reserved.<br />
        Samoa Financial Services Authority Licensed
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          margin: '0 4px 8px',
        }}
      >
        <div style={{ width: 3, height: 12, background: '#F0B90B', borderRadius: 2 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>{title}</span>
      </div>
      <div
        style={{
          background:
            'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          padding: 14,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function License({
  name,
  no,
  authority,
  scope,
}: {
  name: string;
  no: string;
  authority: string;
  scope: string;
}) {
  return (
    <div
      style={{
        padding: 12,
        background: 'rgba(15, 27, 61, 0.40)',
        border: '1px solid rgba(52, 211, 153, 0.25)',
        borderRadius: 12,
        marginBottom: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Award size={20} color="#0F1B3D" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>{name}</span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              fontSize: 9,
              padding: '1px 5px',
              borderRadius: 3,
              background: 'rgba(52, 211, 153, 0.20)',
              color: '#34D399',
              fontWeight: 700,
            }}
          >
            <CheckCircle2 size={9} /> 有效
          </span>
        </div>
        <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>
          {authority} · 编号 {no}
        </div>
        <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>业务范围：{scope}</div>
      </div>
    </div>
  );
}

function Contact({
  icon: Icon,
  label,
  value,
  last,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 0',
        borderBottom: last ? 'none' : '1px solid rgba(148, 163, 184, 0.06)',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: 'rgba(56, 189, 248, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={14} color="#38BDF8" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, color: '#7B89B8' }}>{label}</div>
        <div style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 600, marginTop: 2 }}>{value}</div>
      </div>
      <ChevronRight size={14} color="#7B89B8" />
    </div>
  );
}
