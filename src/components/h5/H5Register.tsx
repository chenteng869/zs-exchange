'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, Phone, Gift, ChevronLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function H5Register() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    referralCode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.username || form.username.length < 3) e.username = '用户名至少3位';
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) e.username = '仅限字母、数字、下划线';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = '请输入有效邮箱';
    if (!form.password || form.password.length < 8) e.password = '密码至少8位';
    if (form.password !== form.confirmPassword) e.confirmPassword = '两次密码不一致';
    if (!agreed) e.agreement = '请同意用户协议';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
          referralCode: form.referralCode || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error?.message || '注册失败');
        setLoading(false);
        return;
      }
      router.replace('/h5/profile');
    } catch (e: any) {
      alert(e?.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px 12px 42px',
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
      {/* 顶部栏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#F8FAFC', padding: 4 }}>
          <ChevronLeft size={24} />
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#F8FAFC' }}>注册账户</span>
      </div>

      {/* Logo */}
      <div style={{ textAlign: 'center', padding: '24px 0 32px' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <ShieldCheck size={32} color="#fff" />
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#F8FAFC' }}>创建账户</div>
        <div style={{ fontSize: 13, color: '#7B89B8', marginTop: 4 }}>加入 ZS Exchange</div>
      </div>

      {/* 表单 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* 用户名 */}
        <div style={{ position: 'relative' }}>
          <div style={iconBoxStyle}><User size={16} /></div>
          <input style={inputStyle} placeholder="用户名（3-20位）"
            value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
          {errors.username && <div style={{ fontSize: 11, color: '#F472B6', marginTop: 4 }}>{errors.username}</div>}
        </div>

        {/* 邮箱 */}
        <div style={{ position: 'relative' }}>
          <div style={iconBoxStyle}><Mail size={16} /></div>
          <input style={inputStyle} placeholder="邮箱地址" type="email"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          {errors.email && <div style={{ fontSize: 11, color: '#F472B6', marginTop: 4 }}>{errors.email}</div>}
        </div>

        {/* 手机号 */}
        <div style={{ position: 'relative' }}>
          <div style={iconBoxStyle}><Phone size={16} /></div>
          <input style={inputStyle} placeholder="手机号（可选）" type="tel"
            value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>

        {/* 密码 */}
        <div style={{ position: 'relative' }}>
          <div style={iconBoxStyle}><Lock size={16} /></div>
          <input style={{ ...inputStyle, paddingRight: 42 }} placeholder="密码（至少8位）" type={showPwd ? 'text' : 'password'}
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <button onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#7B89B8' }}>
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          {errors.password && <div style={{ fontSize: 11, color: '#F472B6', marginTop: 4 }}>{errors.password}</div>}
        </div>

        {/* 确认密码 */}
        <div style={{ position: 'relative' }}>
          <div style={iconBoxStyle}><Lock size={16} /></div>
          <input style={{ ...inputStyle, paddingRight: 42 }} placeholder="确认密码" type={showConfirmPwd ? 'text' : 'password'}
            value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
          <button onClick={() => setShowConfirmPwd(!showConfirmPwd)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#7B89B8' }}>
            {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          {errors.confirmPassword && <div style={{ fontSize: 11, color: '#F472B6', marginTop: 4 }}>{errors.confirmPassword}</div>}
        </div>

        {/* 推荐码 */}
        <div style={{ position: 'relative' }}>
          <div style={iconBoxStyle}><Gift size={16} /></div>
          <input style={inputStyle} placeholder="推荐码（可选）"
            value={form.referralCode} onChange={e => setForm({ ...form, referralCode: e.target.value })} />
        </div>

        {/* 协议 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
            style={{ marginTop: 2, width: 16, height: 16, accentColor: '#38BDF8' }} />
          <span style={{ fontSize: 12, color: '#7B89B8', lineHeight: 1.5 }}>
            我已阅读并同意
            <a href="/terms" style={{ color: '#38BDF8' }}>《用户协议》</a>
            和<a href="/privacy" style={{ color: '#38BDF8' }}>《隐私政策》</a>
          </span>
        </div>
        {errors.agreement && <div style={{ fontSize: 11, color: '#F472B6' }}>{errors.agreement}</div>}

        {/* 注册按钮 */}
        <button onClick={handleSubmit} disabled={loading}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 12,
            background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)',
            border: 'none', color: '#fff', fontSize: 15, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            marginTop: 8,
          }}>
          {loading ? '注册中...' : '创建账户'}
        </button>

        {/* 登录链接 */}
        <div style={{ textAlign: 'center', fontSize: 13, color: '#7B89B8', marginTop: 8 }}>
          已有账户？<Link href="/h5/login" style={{ color: '#38BDF8', fontWeight: 600 }}>立即登录</Link>
        </div>
      </div>
    </div>
  );
}
