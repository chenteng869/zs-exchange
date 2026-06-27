'use client';

/**
 * H5 我的页 v2 — 按截图风格重做
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  ShieldCheck,
  Wallet,
  Users,
  Bell,
  Settings,
  HelpCircle,
  FileText,
  LogOut,
  Copy,
  Download,
  Smartphone,
  Crown,
  LogIn,
  UserPlus,
  Gift,
} from 'lucide-react';
import { useApkDownload } from '@/hooks/useApkDownload';
import { useAuthStore } from '@/stores/authStore';

interface ApiProfile {
  id: string;
  username: string;
  email?: string | null;
  phone?: string | null;
  status: string;
  kycLevel: number;
  vipLevel: number;
  feeDiscount?: string | number | null;
  referralCode?: string | null;
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
}

function getStoredUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('h5_user') || sessionStorage.getItem('h5_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function H5Profile() {
  const router = useRouter();
  const { isAuthenticated: storeAuthenticated, logout } = useAuthStore();
  const [profile, setProfile] = useState<ApiProfile | null>(null);
  const { info: apkInfo, download: downloadApk, platform } = useApkDownload({ source: 'h5' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setProfile(null);
      return;
    }

    let alive = true;
    fetch('/api/v1/user/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || json.success === false) {
          throw new Error(json.error?.message || 'profile load failed');
        }
        return json.data as ApiProfile;
      })
      .then((data) => {
        if (alive) setProfile(data);
      })
      .catch(() => {
        if (alive) setProfile(null);
      });

    return () => {
      alive = false;
    };
  }, []);

  const storedUser = useMemo(() => getStoredUser(), []);
  const isAuthenticated = storeAuthenticated || Boolean(profile || getStoredToken());
  const user = {
    uid: profile?.id || storedUser?.id || '--',
    nickname: profile?.username || storedUser?.username || 'ZS User',
    vipLevel: `VIP${profile?.vipLevel ?? storedUser?.vipLevel ?? 0}`,
    kycLevel: profile?.kycLevel ?? storedUser?.kycLevel ?? 0,
  };
  const referral = {
    code: profile?.referralCode || '--',
    commissionRate: profile?.feeDiscount ? `${profile.feeDiscount}` : '0%',
    totalInvites: 0,
    activeInvites: 0,
    totalCommission: '0.00',
  };

  const handleApkDownload = async () => {
    if (platform === 'ios') {
      window.location.href = '/download';
      return;
    }
    await downloadApk('h5');
  };

  const handleCopyUid = () => {
    navigator.clipboard.writeText(user.uid).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('h5_user');
    window.location.reload();
  };

  return (
    <div style={{ padding: '12px' }}>
      {/* 顶部用户卡 */}
      <div
        style={{
          background:
            'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 50%, #172554 100%)',
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
            top: -30,
            right: -30,
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.30) 0%, transparent 70%)',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 800,
              color: '#fff',
              boxShadow: '0 4px 12px rgba(56, 189, 248, 0.40)',
            }}
          >
            {isAuthenticated ? user.nickname.charAt(0) : '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#fff',
                marginBottom: 4,
              }}
            >
              {isAuthenticated ? user.nickname : '未登录'}
            </div>
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    fontSize: 10,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: 'rgba(252, 213, 53, 0.20)',
                    color: '#FCD535',
                    fontWeight: 700,
                  }}
                >
                  {user.vipLevel}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: 'rgba(52, 211, 153, 0.20)',
                    color: '#34D399',
                    fontWeight: 700,
                  }}
                >
                  KYC{user.kycLevel}
                </span>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.60)' }}>登录后享受更多服务</div>
            )}
          </div>
          {!isAuthenticated && (
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/h5/login" style={{
                padding: '6px 14px', borderRadius: 8,
                background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)',
                color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none',
              }}>
                登录
              </Link>
              <Link href="/h5/register" style={{
                padding: '6px 14px', borderRadius: 8,
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
                color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none',
              }}>
                注册
              </Link>
            </div>
          )}
        </div>

        {isAuthenticated && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 12,
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 8,
              position: 'relative',
            }}
          >
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.60)' }}>UID</span>
            <span
              style={{
                fontSize: 12,
                color: '#fff',
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
                flex: 1,
              }}
            >
              {user.uid}
            </span>
            <button onClick={handleCopyUid} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
              {copied ? (
                <span style={{ fontSize: 11, color: '#34D399' }}>已复制</span>
              ) : (
                <Copy size={12} color="rgba(255,255,255,0.60)" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* 推广卡片 */}
      {isAuthenticated && (
        <div
          style={{
            background:
              'linear-gradient(135deg, rgba(240, 185, 11, 0.10) 0%, rgba(21, 34, 74, 0.70) 100%)',
            border: '1px solid rgba(240, 185, 11, 0.25)',
            borderRadius: 16,
            padding: 14,
            marginBottom: 12,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '15%',
              right: '15%',
              height: 1,
              background:
                'linear-gradient(90deg, transparent 0%, #FCD535 50%, transparent 100%)',
              boxShadow: '0 0 12px rgba(252, 213, 53, 0.6)',
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#FCD535' }}>
                🎁 邀请好友 享 {referral.commissionRate} 返佣
              </div>
              <div style={{ fontSize: 11, color: '#7B89B8', marginTop: 2 }}>
                邀请码: <span style={{ color: '#F8FAFC', fontWeight: 600 }}>{referral.code}</span>
              </div>
            </div>
            <Link
              href="/h5/profile?tab=invite"
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
                color: '#0F1B3D',
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              立即邀请
            </Link>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              marginTop: 8,
            }}
          >
            <div
              style={{
                padding: '8px 6px',
                background: 'rgba(15, 27, 61, 0.40)',
                borderRadius: 8,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>
                {referral.totalInvites}
              </div>
              <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>累计邀请</div>
            </div>
            <div
              style={{
                padding: '8px 6px',
                background: 'rgba(15, 27, 61, 0.40)',
                borderRadius: 8,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: '#34D399' }}>
                {referral.activeInvites}
              </div>
              <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>活跃用户</div>
            </div>
            <div
              style={{
                padding: '8px 6px',
                background: 'rgba(15, 27, 61, 0.40)',
                borderRadius: 8,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#FCD535',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                ¥{referral.totalCommission}
              </div>
              <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>累计返佣</div>
            </div>
          </div>
        </div>
      )}

      {/* APP 下载卡片 */}
      <div
        style={{
          background:
            'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(21, 34, 74, 0.85) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.30)',
          borderRadius: 16,
          padding: 14,
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
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 10,
            position: 'relative',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(56, 189, 248, 0.35)',
            }}
          >
            <Smartphone size={20} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>
              ZS Exchange 官方 APP
            </div>
            <div style={{ fontSize: 11, color: '#7B89B8', marginTop: 2 }}>
              {apkInfo
                ? `v${apkInfo.version} · ${apkInfo.fileSizeFormatted} · 体验更流畅`
                : '原生体验 推送更快 交易更稳'}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleApkDownload}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '10px 0',
            background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)',
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(56, 189, 248, 0.30)',
            position: 'relative',
          }}
        >
          <Download size={14} />
          {platform === 'ios' ? '前往下载页' : '下载安卓 APP'}
        </button>
      </div>

      {/* 功能列表 */}
      <div
        style={{
          background:
            'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 12,
        }}
      >
        {[
          { icon: Crown,      label: '会员中心',   href: '/h5/member', badge: isAuthenticated ? user.vipLevel : undefined },
          { icon: Wallet,     label: '我的钱包',   href: '/h5/assets' },
          { icon: Gift,       label: '福建老酒',   href: '/shop' },
          { icon: ShieldCheck,label: '安全中心',   href: '/h5/profile?tab=security' },
          { icon: Users,      label: '邀请好友',   href: '/h5/profile?tab=invite' },
          { icon: Bell,       label: '消息通知',   href: '/h5/profile?tab=notifications' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 14px',
                textDecoration: 'none',
                borderBottom: i < 5
                  ? '1px solid rgba(148, 163, 184, 0.06)'
                  : 'none',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: item.label === '会员中心' ? 'rgba(252, 213, 53, 0.15)' : item.label === '福建老酒' ? 'rgba(244, 114, 182, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={16} color={item.label === '会员中心' ? '#FCD535' : item.label === '福建老酒' ? '#F472B6' : '#38BDF8'} />
              </div>
              <span style={{ flex: 1, fontSize: 13, color: '#F8FAFC' }}>{item.label}</span>
              {item.badge && (
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(252, 213, 53, 0.20)', color: '#FCD535', fontWeight: 700 }}>
                  {item.badge}
                </span>
              )}
              <ChevronRight size={14} color="#7B89B8" />
            </Link>
          );
        })}
      </div>

      {/* 辅助功能 */}
      <div
        style={{
          background:
            'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 12,
        }}
      >
        {[
          { icon: Settings,   label: '系统设置',   href: '/h5/profile?tab=settings' },
          { icon: FileText,   label: '使用协议',   href: '/h5/profile?tab=terms' },
          { icon: HelpCircle, label: '帮助中心',   href: '/h5/profile?tab=help' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 14px',
                textDecoration: 'none',
                borderBottom: i < 2
                  ? '1px solid rgba(148, 163, 184, 0.06)'
                  : 'none',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: 'rgba(148, 163, 184, 0.10)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={16} color="#B4C0E0" />
              </div>
              <span style={{ flex: 1, fontSize: 13, color: '#F8FAFC' }}>{item.label}</span>
              <ChevronRight size={14} color="#7B89B8" />
            </Link>
          );
        })}
      </div>

      {/* 退出登录 / 登录注册 */}
      {isAuthenticated ? (
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '12px 0',
            background: 'rgba(244, 114, 182, 0.10)',
            border: '1px solid rgba(244, 114, 182, 0.25)',
            borderRadius: 12,
            color: '#F472B6',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <LogOut size={14} /> 退出登录
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/h5/login" style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '12px 0', background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)',
            borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none',
          }}>
            <LogIn size={14} /> 登录
          </Link>
          <Link href="/h5/register" style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '12px 0', background: 'rgba(148, 163, 184, 0.10)',
            border: '1px solid rgba(148, 163, 184, 0.25)', borderRadius: 12,
            color: '#F8FAFC', fontSize: 14, fontWeight: 600, textDecoration: 'none',
          }}>
            <UserPlus size={14} /> 注册
          </Link>
        </div>
      )}

      <div style={{ height: 20 }} />
    </div>
  );
}
