'use client';

/**
 * H5 钱包安全页
 */
import { ChevronRight, ShieldCheck, KeyRound, Lock, Smartphone, Check } from 'lucide-react';

interface SecurityItem {
  key: string;
  title: string;
  desc: string;
  status: 'on' | 'off';
  icon: any;
  color: string;
  required: boolean;
}

const ITEMS: SecurityItem[] = [
  { key: '2fa',     title: '谷歌两步验证',   desc: '使用 Google Authenticator 验证', status: 'on',  icon: Smartphone, color: '#34D399', required: true },
  { key: 'phone',   title: '手机绑定',       desc: '+86 138****5678',              status: 'on',  icon: Smartphone, color: '#38BDF8', required: true },
  { key: 'email',   title: '邮箱绑定',       desc: 'user***@example.com',          status: 'on',  icon: Lock,       color: '#A78BFA', required: false },
  { key: 'pin',     title: '资金密码',       desc: '已设置',                       status: 'on',  icon: KeyRound,   color: '#FCD535', required: true },
  { key: 'anti',    title: '反钓鱼码',       desc: '已设置 - 防止钓鱼邮件',        status: 'on',  icon: ShieldCheck,color: '#22D3EE', required: false },
  { key: 'whitelist', title: '提现白名单',   desc: '未设置',                       status: 'off', icon: ShieldCheck,color: '#F472B6', required: false },
  { key: 'cold',    title: '冷钱包存储',     desc: '95% 资产离线存储',             status: 'on',  icon: Lock,       color: '#34D399', required: true },
  { key: 'kyc',     title: '实名认证',       desc: 'KYC2 已完成',                  status: 'on',  icon: ShieldCheck,color: '#FCD535', required: true },
];

export default function H5SecurityPage() {
  return (
    <div style={{ padding: '12px' }}>
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>安全中心</span>
      </div>

      {/* 安全评分卡 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 50%, #172554 100%)',
          borderRadius: 18,
          padding: 18,
          marginBottom: 12,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -30, right: -30, width: 140, height: 140, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(52, 211, 153, 0.30) 0%, transparent 70%)',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: 32,
              background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, color: '#fff',
              boxShadow: '0 4px 16px rgba(52, 211, 153, 0.40)',
            }}
          >
            A+
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, color: '#fff', fontWeight: 700, marginBottom: 4 }}>
              钱包安全等级
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.70)' }}>
              7/8 项已启用,建议开启提现白名单
            </div>
            <div
              style={{
                marginTop: 8, height: 4, borderRadius: 2,
                background: 'rgba(255,255,255,0.10)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '87.5%', height: '100%',
                  background: 'linear-gradient(90deg, #34D399 0%, #10B981 100%)',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 必做项 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px' }}>
        <div
          style={{
            width: 3, height: 14, borderRadius: 2,
            background: 'linear-gradient(180deg, #F472B6 0%, #EF4444 100%)',
            boxShadow: '0 0 6px rgba(244, 114, 182, 0.50)',
          }}
        />
        <span style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC' }}>必做安全项</span>
        <span style={{ fontSize: 10, color: '#F472B6', marginLeft: 4 }}>推荐完成</span>
      </div>

      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 12,
        }}
      >
        {ITEMS.filter((i) => i.required).map((item, i, arr) => {
          const Icon = item.icon;
          return (
            <Row item={item} Icon={item.icon} key={item.key} isLast={i === arr.length - 1} />
          );
        })}
      </div>

      {/* 增强项 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px' }}>
        <div
          style={{
            width: 3, height: 14, borderRadius: 2,
            background: 'linear-gradient(180deg, #38BDF8 0%, #1E40AF 100%)',
            boxShadow: '0 0 6px rgba(56, 189, 248, 0.50)',
          }}
        />
        <span style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC' }}>安全增强</span>
      </div>

      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {ITEMS.filter((i) => !i.required).map((item, i, arr) => (
          <Row item={item} Icon={item.icon} key={item.key} isLast={i === arr.length - 1} />
        ))}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}

function Row({ item, Icon, isLast }: { item: SecurityItem; Icon: any; isLast: boolean }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: 14,
        borderBottom: !isLast ? '1px solid rgba(148, 163, 184, 0.06)' : 'none',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: 36, height: 36, borderRadius: 12,
          background: `${item.color}26`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Icon size={16} color={item.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>{item.title}</div>
        <div style={{ fontSize: 11, color: '#7B89B8', marginTop: 2 }}>{item.desc}</div>
      </div>
      <div
        style={{
          padding: '3px 10px', borderRadius: 10,
          background: item.status === 'on' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(244, 114, 182, 0.15)',
          color: item.status === 'on' ? '#34D399' : '#F472B6',
          fontSize: 11, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        {item.status === 'on' && <Check size={10} />}
        {item.status === 'on' ? '已开启' : '未开启'}
      </div>
      <ChevronRight size={14} color="#7B89B8" />
    </div>
  );
}