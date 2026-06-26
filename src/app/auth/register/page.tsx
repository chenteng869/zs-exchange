'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Button, Card, Form, message, Slider, Checkbox } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import Link from 'next/link';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();

  const handleRegister = async (values: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone?: string;
    referralCode?: string;
    agreement: boolean;
  }) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次密码输入不一致');
      return;
    }
    if (values.password.length < 8) {
      message.error('密码至少8位');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: values.username,
          email: values.email,
          password: values.password,
          phone: values.phone,
          referralCode: values.referralCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        message.error(data.error?.message || '注册失败');
        return;
      }
      message.success('注册成功！');
      setRegisterSuccess(true);
      setTimeout(() => { router.push('/user/dashboard'); }, 1500);
    } catch (e: any) {
      message.error(e?.message || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
  };

  const strengthLabels = ['弱', '一般', '中等', '强', '非常强'];
  const strengthColors = ['#FF4D4F', '#FFA940', '#1677FF', '#52C41A', '#722ED1'];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px 0' }}>
      <Card style={{ width: 480, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', borderRadius: 16, border: 'none' }} bodyStyle={{ padding: 40 }}>
        {registerSuccess ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#52C41A', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={{ margin: '0 0 16px', fontSize: 24, fontWeight: 700, color: '#52C41A' }}>注册成功</h2>
            <p style={{ margin: '0 0 24px', color: '#666', fontSize: 15 }}>欢迎加入 ZS Exchange，正在跳转...</p>
            <Button type="primary" size="large" onClick={() => router.push('/user/dashboard')}>进入控制台</Button>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <SafetyCertificateOutlined style={{ fontSize: 28, color: '#fff' }} />
              </div>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#111827' }}>创建账户</h2>
              <p style={{ margin: '8px 0 0', color: '#6B7280', fontSize: 14 }}>加入 ZS Exchange</p>
            </div>
            <Form form={form} onFinish={handleRegister} size="large">
              <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }, { min: 3, max: 20, message: '用户名3-20位' }, { pattern: /^[a-zA-Z0-9_]+$/, message: '仅限字母、数字、下划线' }]}>
                <Input prefix={<UserOutlined style={{ color: '#9CA3AF' }} />} placeholder="用户名（3-20位）" autoComplete="username" />
              </Form.Item>
              <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效邮箱' }]}>
                <Input prefix={<MailOutlined style={{ color: '#9CA3AF' }} />} placeholder="邮箱地址" autoComplete="email" />
              </Form.Item>
              <Form.Item name="phone">
                <Input prefix={<PhoneOutlined style={{ color: '#9CA3AF' }} />} placeholder="手机号（可选）" autoComplete="tel" />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }, { min: 8, message: '密码至少8位' }]}>
                <Input.Password prefix={<LockOutlined style={{ color: '#9CA3AF' }} />} placeholder="密码（至少8位）" autoComplete="new-password" />
              </Form.Item>
              <Form.Item shouldUpdate noStyle>
                {({ getFieldValue }) => {
                  const pwd = getFieldValue('password') || '';
                  const strength = getPasswordStrength(pwd);
                  return pwd.length > 0 ? (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: '#666' }}>密码强度：</span>
                        <span style={{ fontSize: 12, color: strengthColors[strength - 1] || '#999', fontWeight: 600 }}>{strengthLabels[strength - 1] || ''}</span>
                      </div>
                      <Slider value={strength} max={5} tooltip={{ open: false }} disabled style={{ margin: 0 }} />
                    </div>
                  ) : null;
                }}
              </Form.Item>
              <Form.Item name="confirmPassword" rules={[{ required: true, message: '请确认密码' }, ({ getFieldValue }) => ({ validator: (_, value) => (!value || getFieldValue('password') === value) ? Promise.resolve() : Promise.reject(new Error('两次密码不一致')) })]}>
                <Input.Password prefix={<LockOutlined style={{ color: '#9CA3AF' }} />} placeholder="确认密码" autoComplete="new-password" />
              </Form.Item>
              <Form.Item name="referralCode">
                <Input prefix={<GiftOutlined style={{ color: '#9CA3AF' }} />} placeholder="推荐码（可选）" />
              </Form.Item>
              <Form.Item name="agreement" valuePropName="checked" rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error('请同意用户协议')) }]}>
                <Checkbox>我已阅读并同意<a href="/terms" style={{ color: '#667eea' }}>《用户协议》</a>和<a href="/privacy" style={{ color: '#667eea' }}>《隐私政策》</a></Checkbox>
              </Form.Item>
              <Form.Item style={{ marginBottom: 16 }}>
                <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 48, borderRadius: 8, fontWeight: 600, fontSize: 16, background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none' }}>创建账户</Button>
              </Form.Item>
              <div style={{ textAlign: 'center', color: '#6B7280', fontSize: 14 }}>已有账户？<Link href="/auth/login" style={{ color: '#667eea', fontWeight: 600 }}>立即登录</Link></div>
            </Form>
          </>
        )}
      </Card>
    </div>
  );
}
