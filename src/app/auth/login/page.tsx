'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Button, Card, Form, message, Checkbox } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();
  const { login, isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    router.replace('/user/dashboard');
    return null;
  }

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login({ username: values.username, password: values.password });
      message.success('登录成功');
      router.replace('/user/dashboard');
    } catch (e: any) {
      message.error(e?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px 0' }}>
      <Card style={{ width: 420, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', borderRadius: 16, border: 'none' }} bodyStyle={{ padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <SafetyCertificateOutlined style={{ fontSize: 28, color: '#fff' }} />
          </div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#111827' }}>欢迎回来</h2>
          <p style={{ margin: '8px 0 0', color: '#6B7280', fontSize: 14 }}>登录 ZS Exchange 账户</p>
        </div>
        <Form form={form} onFinish={handleLogin} size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名或邮箱' }]}>
            <Input prefix={<UserOutlined style={{ color: '#9CA3AF' }} />} placeholder="用户名 / 邮箱" autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: '#9CA3AF' }} />} placeholder="密码" autoComplete="current-password" />
          </Form.Item>
          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Checkbox>记住登录状态</Checkbox>
              <a style={{ color: '#667eea', fontSize: 13 }}>忘记密码？</a>
            </div>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 48, borderRadius: 8, fontWeight: 600, fontSize: 16, background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none' }}>
              登录
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center', color: '#6B7280', fontSize: 14, marginTop: 16 }}>
            还没有账户？<Link href="/auth/register" style={{ color: '#667eea', fontWeight: 600 }}>立即注册</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
