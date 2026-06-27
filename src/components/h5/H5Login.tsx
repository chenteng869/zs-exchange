'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Eye, EyeOff, Lock, ShieldCheck, User } from 'lucide-react';

export default function H5Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.username.trim() || !form.password) {
      setError('请输入用户名和密码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
        }),
      });
      const json = await res.json();

      if (!res.ok || json.success === false) {
        throw new Error(json.error?.message || '登录失败');
      }

      localStorage.setItem('auth_token', json.data.accessToken);
      localStorage.setItem('refresh_token', json.data.refreshToken);
      localStorage.setItem('h5_user', JSON.stringify(json.data.user));
      router.replace('/h5/wallet');
    } catch (e: any) {
      setError(e?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 42px',
    background: 'rgba(148, 163, 184, 0.08)',
    border: '1px solid rgba(148, 163, 184, 0.15)',
    borderRadius: 12,
    color: '#F8FAFC',
    fontSize: 14,
    outline: 'none',
  };

  const iconBoxStyle: React.CSSProperties = {
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#7B89B8',
  };

  return (
    <div style={{ padding: '0 16px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', color: '#F8FAFC', padding: 4 }}
          aria-label="返回"
        >
          <ChevronLeft size={24} />
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#F8FAFC' }}>登录</span>
      </div>

      <div style={{ textAlign: 'center', padding: '32px 0 40px' }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <ShieldCheck size={32} color="#fff" />
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#F8FAFC' }}>欢迎回来</div>
        <div style={{ fontSize: 13, color: '#7B89B8', marginTop: 4 }}>登录 ZS Exchange 账户</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ position: 'relative' }}>
          <div style={iconBoxStyle}>
            <User size={16} />
          </div>
          <input
            style={inputStyle}
            placeholder="用户名"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            autoComplete="username"
          />
        </div>

        <div style={{ position: 'relative' }}>
          <div style={iconBoxStyle}>
            <Lock size={16} />
          </div>
          <input
            style={inputStyle}
            placeholder="密码"
            type={showPwd ? 'text' : 'password'}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="current-password"
          />
          <button
            onClick={() => setShowPwd(!showPwd)}
            style={{
              position: 'absolute',
              right: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: '#7B89B8',
            }}
            aria-label={showPwd ? '隐藏密码' : '显示密码'}
          >
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {error && <div style={{ fontSize: 12, color: '#F472B6', textAlign: 'center' }}>{error}</div>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)',
            border: 'none',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? '登录中...' : '登录'}
        </button>

        <div style={{ textAlign: 'center', fontSize: 13, color: '#7B89B8', marginTop: 8 }}>
          还没有账户？
          <Link href="/h5/register" style={{ color: '#38BDF8', fontWeight: 600 }}>
            立即注册
          </Link>
        </div>
      </div>
    </div>
  );
}
