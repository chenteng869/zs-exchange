'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input, Button, Card, Form, message, Checkbox, Space } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/admin/dashboard';
  const { login, isAuthenticated } = useAuthStore();

  // 已登录则直接跳转
  if (isAuthenticated) {
    router.replace(redirect);
    return null;
  }

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login({
        username: values.username,
        password: values.password,
      });
      message.success('登录成功');
      router.replace(redirect);
    } catch (e: any) {
      message.error(e?.message || '登录失败，请检查账号密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F5F7FA',
      }}
    >
      <Card
        style={{
          width: 420,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          borderRadius: 12,
          border: 'none',
        }}
      >
        {/* Logo & 标题 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #1677FF, #7C3AED)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <SafetyCertificateOutlined style={{ fontSize: 28, color: '#fff' }} />
          </div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>
            中萨数字科技交易所
          </h2>
          <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: 14 }}>
            管理员控制台
          </p>
        </div>

        <Form onFinish={handleLogin} size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入管理员账号' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#9CA3AF' }} />}
              placeholder="管理员账号 / 邮箱"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#9CA3AF' }} />}
              placeholder="密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Checkbox>记住登录状态</Checkbox>
              <a style={{ color: '#1677FF', fontSize: 13 }}>忘记密码？</a>
            </div>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 44,
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 15,
                background: 'linear-gradient(135deg, #1677FF, #4096FF)',
                border: 'none',
              }}
            >
              登录管理后台
            </Button>
          </Form.Item>

          {/* Demo 提示 */}
          <div
            style={{
              marginTop: 20,
              padding: '10px 14px',
              background: '#EFF6FF',
              borderRadius: 8,
              border: '1px solid #BFDBFE',
            }}
          >
            <p style={{ margin: 0, fontSize: 12, color: '#1E40AF', lineHeight: 1.6 }}>
              <strong>演示模式：</strong>输入任意账号和密码（至少8位）即可登录体验。
              <br />
              开发环境无需真实后端验证。
            </p>
          </div>
        </Form>
      </Card>
    </div>
  );
}
