'use client';

import { useState } from 'react';
import {
  Globe,
  Moon,
  Sun,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Fingerprint,
  Smartphone,
  Languages,
  DollarSign,
  ChevronRight,
  Check,
} from 'lucide-react';

export default function H5ProfileSettingsPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [biometric, setBiometric] = useState(true);
  const [pushTrade, setPushTrade] = useState(true);
  const [pushPrice, setPushPrice] = useState(false);
  const [pushSystem, setPushSystem] = useState(true);
  const [hideBalance, setHideBalance] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('简体中文');

  return (
    <div style={{ padding: '12px' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#38BDF8', borderRadius: 2 }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>系统设置</span>
      </div>

      {/* 主题切换 */}
      <Section title="外观">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 8,
          }}
        >
          {[
            { key: 'dark',  label: '深色', icon: Moon, gradient: 'linear-gradient(135deg, #0F1B3D 0%, #1E3A8A 100%)' },
            { key: 'light', label: '浅色', icon: Sun,  gradient: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)' },
          ].map((t) => {
            const Icon = t.icon;
            const active = theme === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTheme(t.key as 'dark' | 'light')}
                style={{
                  padding: 12,
                  borderRadius: 14,
                  background: t.gradient,
                  border: active ? '2px solid #F0B90B' : '2px solid rgba(148, 163, 184, 0.20)',
                  cursor: 'pointer',
                  position: 'relative',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon size={18} color={t.key === 'dark' ? '#F8FAFC' : '#1E3A8A'} />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: t.key === 'dark' ? '#F8FAFC' : '#1E3A8A',
                    }}
                  >
                    {t.label}
                  </span>
                </div>
                {active && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#F0B90B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Check size={12} color="#0F1B3D" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Section>

      {/* 通用设置 */}
      <Section title="通用">
        <Row
          icon={Globe}
          iconColor="#38BDF8"
          label="语言"
          right={
            <span style={{ fontSize: 12, color: '#B4C0E0' }}>{language}</span>
          }
        />
        <Row
          icon={DollarSign}
          iconColor="#FCD535"
          label="计价货币"
          right={
            <span style={{ fontSize: 12, color: '#B4C0E0' }}>{currency}</span>
          }
          last
        />
      </Section>

      {/* 安全 */}
      <Section title="安全">
        <ToggleRow
          icon={Eye}
          iconColor="#A78BFA"
          label="隐藏余额"
          sub="首页资产数字将显示为 ****"
          value={hideBalance}
          onChange={setHideBalance}
        />
        <ToggleRow
          icon={Fingerprint}
          iconColor="#34D399"
          label="生物识别登录"
          sub="使用 Face ID / 指纹快速登录"
          value={biometric}
          onChange={setBiometric}
          last
        />
      </Section>

      {/* 通知 */}
      <Section title="通知推送">
        <ToggleRow
          icon={Bell}
          iconColor="#38BDF8"
          label="交易通知"
          sub="下单、成交、撤单等"
          value={pushTrade}
          onChange={setPushTrade}
        />
        <ToggleRow
          icon={Bell}
          iconColor="#F0B90B"
          label="价格预警"
          sub="关注的币种达到设定价格"
          value={pushPrice}
          onChange={setPushPrice}
        />
        <ToggleRow
          icon={Bell}
          iconColor="#F472B6"
          label="系统消息"
          sub="平台公告、系统升级等"
          value={pushSystem}
          onChange={setPushSystem}
          last
        />
      </Section>

      {/* 数据 */}
      <Section title="数据">
        <Row
          icon={Smartphone}
          iconColor="#22D3EE"
          label="清除缓存"
          right={<span style={{ fontSize: 12, color: '#7B89B8' }}>12.4 MB</span>}
        />
        <Row
          icon={Lock}
          iconColor="#F0B90B"
          label="隐私设置"
          right={<ChevronRight size={14} color="#7B89B8" />}
          last
        />
      </Section>

      {/* 版本 */}
      <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 10, color: '#7B89B8' }}>
        ZS Exchange H5 · v2.1.0
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
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
      <div
        style={{
          background:
            'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  iconColor,
  label,
  right,
  last,
}: {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  right?: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 14px',
        borderBottom: last ? 'none' : '1px solid rgba(148, 163, 184, 0.06)',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: `${iconColor}26`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={16} color={iconColor} />
      </div>
      <span style={{ flex: 1, fontSize: 13, color: '#F8FAFC' }}>{label}</span>
      {right}
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  iconColor,
  label,
  sub,
  value,
  onChange,
  last,
}: {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 14px',
        borderBottom: last ? 'none' : '1px solid rgba(148, 163, 184, 0.06)',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: `${iconColor}26`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={16} color={iconColor} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: '#F8FAFC' }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>{sub}</div>}
      </div>
      <Switch value={value} onChange={onChange} />
    </div>
  );
}

function Switch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        background: value
          ? 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)'
          : 'rgba(148, 163, 184, 0.20)',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.2s',
        padding: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 2,
          left: value ? 20 : 2,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          transition: 'all 0.2s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.20)',
        }}
      />
    </button>
  );
}
