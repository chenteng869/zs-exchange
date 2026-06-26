import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '用户认证 - ZS Exchange',
  description: 'ZS Exchange 用户登录和注册',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* 顶部导航栏 */}
      <header style={{ padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: '#fff', fontSize: 20 }}>💱</span>
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>ZS Exchange</span>
        </a>
        <a
          href="/"
          style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 14 }}
        >
          返回首页
        </a>
      </header>

      {/* 内容 */}
      <main>{children}</main>

      {/* 底部版权 */}
      <footer style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
        © 2024 ZS Exchange. 萨摩亚持牌 · 全球数字金融新枢纽
      </footer>
    </div>
  );
}
