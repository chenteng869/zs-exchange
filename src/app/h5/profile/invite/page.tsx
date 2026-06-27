'use client';

import { useEffect, useMemo, useState, type ElementType } from 'react';
import {
  Gift,
  Copy,
  Users,
  TrendingUp,
  DollarSign,
  MessageCircle,
  Mail,
  Link as LinkIcon,
  QrCode,
  Check,
} from 'lucide-react';
import { userApi, type ApiUserProfile } from '@/lib/api/user';

interface ReferralView {
  code: string;
  totalInvites: number;
  activeInvites: number;
  totalCommission: string;
  todayCommission: string;
  commissionRate: string;
}

function toReferralView(profile: ApiUserProfile | null): ReferralView {
  return {
    code: profile?.referralCode || '--',
    totalInvites: 0,
    activeInvites: 0,
    totalCommission: '0.00',
    todayCommission: '0.00',
    commissionRate: profile?.feeDiscount ? `${Number(profile.feeDiscount) * 100}%` : '30%',
  };
}

export default function H5ProfileInvitePage() {
  const [profile, setProfile] = useState<ApiUserProfile | null>(null);
  const [copied, setCopied] = useState(false);
  const r = useMemo(() => toReferralView(profile), [profile]);
  const inviteUrl = `https://zse.exchange/register?ref=${r.code}`;

  useEffect(() => {
    let alive = true;

    userApi.getProfile()
      .then((nextProfile) => {
        if (alive) setProfile(nextProfile);
      })
      .catch(() => {
        if (alive) setProfile(null);
      });

    return () => {
      alive = false;
    };
  }, []);

  const copyCode = () => {
    if (typeof navigator !== 'undefined' && r.code !== '--') {
      navigator.clipboard?.writeText(r.code).catch(() => undefined);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding: '12px' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#38BDF8', borderRadius: 2 }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>邀请好友</span>
      </div>

      {/* 主推广卡 */}
      <div
        style={{
          background:
            'linear-gradient(135deg, rgba(240, 185, 11, 0.18) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(240, 185, 11, 0.35)',
          borderRadius: 18,
          padding: 20,
          marginBottom: 12,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -30,
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(240, 185, 11, 0.30) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -30,
            left: -20,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.20) 0%, transparent 70%)',
          }}
        />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Gift size={22} color="#FCD535" />
            <span style={{ fontSize: 18, fontWeight: 800, color: '#F8FAFC' }}>
              邀请好友享 {r.commissionRate} 返佣
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#B4C0E0', marginBottom: 14, lineHeight: 1.6 }}>
            好友注册后绑定您的邀请码，返佣数据以用户 API 与后续 referral API 结算为准。
          </div>

          <div
            style={{
              padding: 14,
              background: 'rgba(15, 27, 61, 0.50)',
              borderRadius: 12,
              border: '1px solid rgba(148, 163, 184, 0.10)',
            }}
          >
            <div style={{ fontSize: 10, color: '#7B89B8', marginBottom: 6 }}>我的邀请码</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  flex: 1,
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#FCD535',
                  letterSpacing: 4,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {r.code}
              </span>
              <button
                onClick={copyCode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: copied
                    ? 'linear-gradient(135deg, #34D399 0%, #10B981 100%)'
                    : 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
                  color: '#0F1B3D',
                  fontSize: 12,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? '已复制' : '复制'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 数据卡 3 列 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <StatCard icon={Users} color="#38BDF8" value={r.totalInvites} label="累计邀请" />
        <StatCard icon={TrendingUp} color="#34D399" value={r.activeInvites} label="活跃用户" />
        <StatCard icon={DollarSign} color="#FCD535" value={`≈${r.totalCommission}`} label="累计返佣" highlight />
      </div>

      {/* 今日返佣 */}
      <div
        style={{
          background:
            'linear-gradient(135deg, rgba(52, 211, 153, 0.15) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(52, 211, 153, 0.30)',
          borderRadius: 16,
          padding: 14,
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'rgba(52, 211, 153, 0.20)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <DollarSign size={20} color="#34D399" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#7B89B8' }}>今日返佣 (实时)</div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: '#34D399',
              marginTop: 2,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            + ≈{r.todayCommission}
          </div>
        </div>
        <div
          style={{
            fontSize: 10,
            padding: '3px 8px',
            borderRadius: 4,
            background: 'rgba(52, 211, 153, 0.20)',
            color: '#34D399',
            fontWeight: 700,
          }}
        >
          API
        </div>
      </div>

      {/* 分享方式 */}
      <div
        style={{
          background:
            'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          padding: 14,
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC', marginBottom: 12 }}>
          分享给好友
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
          }}
        >
          {[
            { icon: LinkIcon, label: '复制链接', color: '#38BDF8' },
            { icon: QrCode, label: '邀请海报', color: '#F0B90B' },
            { icon: MessageCircle, label: '微信好友', color: '#34D399' },
            { icon: Mail, label: '邮件邀请', color: '#A78BFA' },
          ].map((it) => {
            const Icon = it.icon;
            return (
              <div key={it.label} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 14,
                    background: `${it.color}26`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 6px',
                  }}
                >
                  <Icon size={22} color={it.color} />
                </div>
                <div style={{ fontSize: 11, color: '#B4C0E0' }}>{it.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 链接预览 */}
      <div
        style={{
          background:
            'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          padding: 12,
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <LinkIcon size={16} color="#7B89B8" />
        <span
          style={{
            flex: 1,
            fontSize: 11,
            color: '#B4C0E0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontFamily: 'monospace',
          }}
        >
          {inviteUrl}
        </span>
        <Copy size={14} color="#38BDF8" />
      </div>

      {/* 规则 */}
      <div
        style={{
          background:
            'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          padding: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <div style={{ width: 3, height: 12, background: '#F0B90B', borderRadius: 2 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>返佣规则</span>
        </div>
        {[
          '1. 好友通过您的专属链接/邀请码注册后建立邀请关系',
          '2. 好友完成首笔交易后，奖励与返佣进入后端 referral 结算',
          '3. 您可获得其交易手续费返佣，具体比例以账户等级为准',
          '4. 返佣结算以真实 API 数据为准',
          '5. 邀请人数与返佣金额不在前端伪造',
        ].map((rule) => (
          <div
            key={rule}
            style={{
              fontSize: 11,
              color: '#B4C0E0',
              lineHeight: 1.8,
              padding: '3px 0',
            }}
          >
            {rule}
          </div>
        ))}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}

function StatCard({
  icon: Icon,
  color,
  value,
  label,
  highlight,
}: {
  icon: ElementType;
  color: string;
  value: string | number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        background:
          'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
        border: '1px solid rgba(148, 163, 184, 0.12)',
        borderRadius: 14,
        padding: 12,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: `${color}26`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 6px',
        }}
      >
        <Icon size={16} color={color} />
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 800,
          color: highlight ? '#FCD535' : '#F8FAFC',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>{label}</div>
    </div>
  );
}
