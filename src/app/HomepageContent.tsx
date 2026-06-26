'use client';

// ==================== Layout 组件 ====================
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// ==================== 标准区组件 (Agent-C) ====================
import HeroSection from '@/components/home/HeroSection';
import StatsBar from '@/components/home/StatsBar';
import TickerTapeLive from '@/components/home/TickerTapeLive';
import MultiDevice from '@/components/home/MultiDevice';
import MarketOverview from '@/components/home/MarketOverview';
import FeatureGrid from '@/components/home/FeatureGrid';
import SecuritySection from '@/components/home/SecuritySection';
import HowItWorks from '@/components/home/HowItWorks';
import DownloadCTA from '@/components/home/DownloadCTA';
import FAQSection from '@/components/home/FAQSection';
import PartnersSection from '@/components/home/PartnersSection';

// ==================== ZS独有组件 (Agent-D) ====================
import LicenseShowcase from '@/components/differentiation/LicenseShowcase';
import BusinessEngines from '@/components/differentiation/BusinessEngines';
import ThreeNodeMap from '@/components/differentiation/ThreeNodeMap';

// ==================== 首页客户端内容组件 ====================
// v7 Aurora Premium 升级自 v6 Royal Premium
// 调研：Stripe 2026 / Coinbase Advanced / OKX Web3 / Kraken Pro / Bybit V5
// 关键变化：#0B1124 → #0F1B3D 极光皇家蓝 + 引入多色极光网格 + Glassmorphism 2.0
export default function HomepageContent() {
  return (
    <div
      className="dark-theme text-text-primary antialiased"
      style={{
        background:
          'linear-gradient(180deg, #0F1B3D 0%, #131E45 30%, #0F1B3D 65%, #131E45 100%)',
        minHeight: '100vh',
        position: 'relative',
      }}
    >
      {/* 顶部极光三色装饰光带 - v7 极光尊享高光 */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background:
            'linear-gradient(90deg, transparent 0%, rgba(240, 185, 11, 0.50) 20%, rgba(56, 189, 248, 0.90) 50%, rgba(167, 139, 250, 0.50) 80%, transparent 100%)',
          boxShadow: '0 0 24px rgba(56, 189, 248, 0.50), 0 0 48px rgba(240, 185, 11, 0.30)',
          zIndex: 60,
          pointerEvents: 'none',
        }}
      />

      {/* v7 全局固定极光光斑（轻量版，不影响滚动性能） */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: '20%',
          left: '-200px',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)',
          filter: 'blur(100px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: '60%',
          right: '-200px',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167, 139, 250, 0.15) 0%, transparent 70%)',
          filter: 'blur(100px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'fixed',
          bottom: '-100px',
          left: '40%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(240, 185, 11, 0.12) 0%, transparent 70%)',
          filter: 'blur(100px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* [01] 导航栏 - 固定在顶部 (深色半透明) */}
      <Navbar />

      {/* 主内容区域 */}
      <main>
        {/* ===== 首屏 Above Fold (最重要的核心区域) ===== */}

        {/* [02] Hero区 - 最重要，全屏高度，包含主标题、CTA、6张统计卡片 */}
        <section id="hero" aria-label="首屏英雄区">
          <HeroSection />
        </section>

        {/* [03] 数据统计条 - 紧跟Hero (深色 - 行情区 #131A2E) */}
        <section id="stats" aria-label="实时数据统计">
          <StatsBar />
        </section>

        {/* [04] 行情滚动条 - 实时数据版 (深色 - 卡片 #131A2E) */}
        <section id="ticker" aria-label="实时行情滚动条">
          <TickerTapeLive />
        </section>

        {/* ---- 以上为首屏 Above Fold 结束 ---- */}

        {/* ===== ZS独有差异化展示区 (更大间距 py-24 md:py-32) ===== */}

        {/* [05] ⭐ZS独有 - 牌照展示 - 全球稀缺双牌照资产 */}
        <section
          id="licenses"
          aria-label="牌照资质展示"
          className="py-24 md:py-32"
        >
          <LicenseShowcase />
        </section>

        {/* [06] ⭐ZS独有 - 五大业务引擎集群 */}
        <section
          id="engines"
          aria-label="五大业务引擎"
          className="py-24 md:py-32"
        >
          <BusinessEngines />
        </section>

        {/* [07] ⭐ZS独有 - 三地协同运营地图 (海南·萨摩亚·香港) */}
        <section
          id="three-node-map"
          aria-label="三地协同网络"
          className="py-24 md:py-32"
        >
          <ThreeNodeMap />
        </section>

        {/* ===== 标准产品展示区 (标准间距 py-20 md:py-24) ===== */}

        {/* [08] 多设备响应式展示 */}
        <section
          id="multi-device"
          aria-label="多平台支持"
          className="py-20 md:py-24"
        >
          <MultiDevice />
        </section>

        {/* [09] 市场概览 */}
        <section
          id="market-overview"
          aria-label="市场行情概览"
          className="py-20 md:py-24"
        >
          <MarketOverview />
        </section>

        {/* [10] 六大特性网格 */}
        <section
          id="features"
          aria-label="核心特性"
          className="py-20 md:py-24"
        >
          <FeatureGrid />
        </section>

        {/* [11] 安全保障体系 */}
        <section
          id="security"
          aria-label="安全保障"
          className="py-20 md:py-24"
        >
          <SecuritySection />
        </section>

        {/* [12] 如何开始使用 (4步入门) */}
        <section
          id="how-it-works"
          aria-label="使用指南"
          className="py-20 md:py-24"
        >
          <HowItWorks />
        </section>

        {/* [13] 下载/注册 CTA 行动召唤 */}
        <section
          id="download"
          aria-label="立即开始"
          className="py-20 md:py-24"
        >
          <DownloadCTA />
        </section>

        {/* [14] 常见问题解答 (8个FAQ) */}
        <section
          id="faq"
          aria-label="常见问题"
          className="py-20 md:py-24"
        >
          <FAQSection />
        </section>

        {/* [15] 合作伙伴/生态展示 */}
        <section
          id="partners"
          aria-label="合作伙伴"
          className="py-20 md:py-24"
        >
          <PartnersSection />
        </section>
      </main>

      {/* [16] 页脚 - 深色页脚 #020617 */}
      <Footer />
    </div>
  );
}
