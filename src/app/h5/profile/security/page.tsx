'use client';

import {
  Shield,
  Key,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  FingerprintPattern,
  LogOut,
  AlertTriangle,
  Check,
  ChevronRight,
  Trash2,
} from 'lucide-react';

export default function H5ProfileSecurityPage() {
  return (
    <div style={{ padding: '12px' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#38BDF8', borderRadius: 2 }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>安全设置</span>
      </div>

      {/* 评分卡 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 50%, #172554 100%)',
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(52, 211, 153, 0.30) 0%, transparent 70%)',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              border: '3px solid #34D399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(52, 211, 153, 0.15)',
              fontSize: 24,
              fontWeight: 800,
              color: '#34D399',
            }}
          >
            A+
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>账户安全等级</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', marginTop: 4 }}>
              您已完成 5 项安全设置，建议继续完善
            </div>
            <div
              style={{
                marginTop: 8,
                height: 4,
                background: 'rgba(255,255,255,0.10)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '85%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #34D399 0%, #10B981 100%)',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 必做项 */}
      <SectionHeader title="必做安全项" badge="3 项" badgeColor="#F0B90B" />
      <Card>
        <Row icon={Smartphone} iconColor="#38BDF8" label="手机绑定" status="已绑定" statusColor="#34D399" sub="+86 138****5678" />
        <Row icon={Lock} iconColor="#38BDF8" label="登录密码" status="已设置" statusColor="#34D399" />
        <Row icon={Key} iconColor="#F0B90B" label="资金密码" status="未设置" statusColor="#F472B6" required />
      </Card>

      {/* 增强项 */}
      <SectionHeader title="安全增强" badge="推荐" badgeColor="#38BDF8" />
      <Card>
        <Row
          icon={FingerprintPattern}
          iconColor="#A78BFA"
          label="生物识别"
          status="已开启"
          statusColor="#34D399"
          sub="Face ID / 指纹"
        />
        <Row
          icon={Shield}
          iconColor="#34D399"
          label="二次验证 (2FA)"
          status="未开启"
          statusColor="#F0B90B"
        />
        <Row
          icon={Eye}
          iconColor="#22D3EE"
          label="防钓鱼码"
          status="未设置"
          statusColor="#F0B90B"
        />
        <Row
          icon={EyeOff}
          iconColor="#F472B6"
          label="登录设备管理"
          status="3 台设备"
          statusColor="#B4C0E0"
          last
        />
      </Card>

      {/* 危险操作 */}
      <SectionHeader title="账户操作" badge="高危" badgeColor="#F472B6" />
      <Card>
        <Row icon={LogOut} iconColor="#F0B90B" label="退出所有设备" status="" sub="在其他设备上强制登出" />
        <Row
          icon={Trash2}
          iconColor="#F472B6"
          label="注销账户"
          status=""
          sub="注销后无法恢复"
          last
          danger
        />
      </Card>

      {/* 提示 */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: 12,
          background: 'rgba(240, 185, 11, 0.10)',
          border: '1px solid rgba(240, 185, 11, 0.25)',
          borderRadius: 12,
          marginTop: 12,
        }}
      >
        <AlertTriangle size={16} color="#F0B90B" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 11, color: '#B4C0E0', lineHeight: 1.6 }}>
          请妥善保管您的账户安全信息，ZS Exchange 工作人员不会向您索要密码、验证码等敏感信息。
        </div>
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}

function SectionHeader({ title, badge, badgeColor }: { title: string; badge?: string; badgeColor?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        margin: '14px 4px 8px',
      }}
    >
      <div style={{ width: 3, height: 14, background: '#F0B90B', borderRadius: 2 }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>{title}</span>
      {badge && (
        <span
          style={{
            fontSize: 10,
            padding: '1px 6px',
            borderRadius: 4,
            background: `${badgeColor}26`,
            color: badgeColor,
            fontWeight: 600,
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
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
  );
}

function Row({
  icon: Icon,
  iconColor,
  label,
  status,
  statusColor,
  sub,
  last,
  required,
  danger,
}: {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  status: string;
  statusColor?: string;
  sub?: string;
  last?: boolean;
  required?: boolean;
  danger?: boolean;
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 13, color: danger ? '#F472B6' : '#F8FAFC', fontWeight: 500 }}>
            {label}
          </span>
          {required && (
            <span
              style={{
                fontSize: 9,
                padding: '1px 4px',
                borderRadius: 3,
                background: 'rgba(244, 114, 182, 0.20)',
                color: '#F472B6',
                fontWeight: 700,
              }}
            >
              必做
            </span>
          )}
        </div>
        {sub && <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>{sub}</div>}
      </div>
      {status && statusColor && (
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            fontSize: 11,
            color: statusColor,
            fontWeight: 600,
          }}
        >
          {statusColor === '#34D399' && <Check size={11} />}
          {status}
        </span>
      )}
      <ChevronRight size={14} color="#7B89B8" />
    </div>
  );
}
