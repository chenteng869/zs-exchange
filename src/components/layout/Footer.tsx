import Link from 'next/link';
import {
  Bird,
  Send,
  MessageCircle,
  GitBranch,
} from 'lucide-react';

const footerLinks = {
  product: {
    title: '产品',
    links: [
      { label: '现货交易', href: '/business/spot' },
      { label: '合约交易', href: '/business/futures' },
      { label: '杠杆交易', href: '/business/margin' },
      { label: 'DeFi 理财', href: '/defi' },
    ],
  },
  service: {
    title: '服务',
    links: [
      { label: '代币发行', href: '/business/token' },
      { label: '公司注册', href: '/business/registration' },
      { label: '上市通道', href: '/business/listing' },
      { label: 'AIOPC 一人公司', href: '/business/aiopc' },
    ],
  },
  about: {
    title: '关于我们',
    links: [
      { label: '公司介绍', href: '/about' },
      { label: '牌照资质', href: '/licenses' },
      { label: '联系我们', href: '/contact' },
      { label: '加入我们', href: '/careers' },
    ],
  },
  compliance: {
    title: '合规监管',
    links: [
      { label: '萨摩亚 FSA 牌照', href: '/licenses#exchange' },
      { label: 'HK1683 通道', href: '/licenses#hk1683' },
      { label: '风险披露', href: '/compliance/risk-disclosure' },
    ],
  },
  support: {
    title: '帮助中心',
    links: [
      { label: '常见问题', href: '/help/faq' },
      { label: 'API 文档', href: '/api-docs' },
      { label: '费率说明', href: '/help/fees' },
    ],
  },
};

const socialLinks = [
  { icon: Bird, href: 'https://twitter.com/zs_exchange', label: 'Twitter' },
  { icon: Send, href: 'https://t.me/zs_exchange', label: 'Telegram' },
  { icon: MessageCircle, href: 'https://discord.gg/zs-exchange', label: 'Discord' },
  { icon: GitBranch, href: 'https://github.com/zs-exchange', label: 'GitHub' },
];

const complianceBadges = [
  { label: '萨摩亚 FSA' },
  { label: 'HK1683' },
  { label: 'AIOPC 基地' },
];

// 严格遵循《数字交易所官网与管理员后台色系搭配最佳方案 V1.0》第 4.4 章
// 页脚：#020617
export default function Footer() {
  return (
    <footer
      style={{
        background: '#020617',
        borderTop: '1px solid #2A3556',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-16 pb-8">
        {/* Main Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-12">
          {/* Product Column */}
          <div>
            <h3
              className="text-sm font-semibold mb-4"
              style={{ color: '#F8FAFC' }}
            >
              {footerLinks.product.title}
            </h3>
            <ul className="space-y-0">
              {footerLinks.product.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors block mb-2.5 no-underline"
                    style={{ color: '#94A3B8' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#1677FF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#94A3B8';
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Service Column */}
          <div>
            <h3
              className="text-sm font-semibold mb-4"
              style={{ color: '#F8FAFC' }}
            >
              {footerLinks.service.title}
            </h3>
            <ul className="space-y-0">
              {footerLinks.service.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors block mb-2.5 no-underline"
                    style={{ color: '#94A3B8' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#1677FF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#94A3B8';
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About Column */}
          <div>
            <h3
              className="text-sm font-semibold mb-4"
              style={{ color: '#F8FAFC' }}
            >
              {footerLinks.about.title}
            </h3>
            <ul className="space-y-0">
              {footerLinks.about.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors block mb-2.5 no-underline"
                    style={{ color: '#94A3B8' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#1677FF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#94A3B8';
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Compliance Column */}
          <div>
            <h3
              className="text-sm font-semibold mb-4"
              style={{ color: '#F8FAFC' }}
            >
              {footerLinks.compliance.title}
            </h3>
            <ul className="space-y-0">
              {footerLinks.compliance.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors block mb-2.5 no-underline"
                    style={{ color: '#94A3B8' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#1677FF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#94A3B8';
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h3
              className="text-sm font-semibold mb-4"
              style={{ color: '#F8FAFC' }}
            >
              {footerLinks.support.title}
            </h3>
            <ul className="space-y-0">
              {footerLinks.support.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors block mb-2.5 no-underline"
                    style={{ color: '#94A3B8' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#1677FF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#94A3B8';
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Column */}
          <div>
            <h3
              className="text-sm font-semibold mb-4"
              style={{ color: '#F8FAFC' }}
            >
              关注我们
            </h3>
            <div className="flex items-center gap-4 mt-1">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors p-1 -m-1 no-underline"
                  style={{ color: '#94A3B8' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#1677FF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#94A3B8';
                  }}
                  aria-label={social.label}
                >
                  <social.icon size={18} strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="pt-8" style={{ borderTop: '1px solid #2A3556' }}>
          {/* Compliance Badges Row */}
          <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
            {complianceBadges.map((badge) => (
              <span
                key={badge.label}
                className="text-[10px] rounded-full px-2 py-0.5"
                style={{
                  color: '#94A3B8',
                  border: '1px solid #2A3556',
                  background: 'rgba(22, 119, 255, 0.05)',
                }}
              >
                {badge.label}
              </span>
            ))}
          </div>

          {/* Copyright & Legal Links */}
          <div
            className="flex flex-col items-center gap-3 text-xs"
            style={{ color: '#94A3B8' }}
          >
            <span>&copy; 2025 中萨数字科技集团 ZS Exchange &middot; 萨摩亚政府持牌</span>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <Link
                href="/privacy"
                className="transition-colors no-underline"
                style={{ color: '#94A3B8' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#F8FAFC';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#94A3B8';
                }}
              >
                隐私政策
              </Link>
              <span style={{ color: '#2A3556' }}>|</span>
              <Link
                href="/terms"
                className="transition-colors no-underline"
                style={{ color: '#94A3B8' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#F8FAFC';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#94A3B8';
                }}
              >
                用户协议
              </Link>
              <span style={{ color: '#2A3556' }}>|</span>
              <Link
                href="/risk-warning"
                className="transition-colors no-underline"
                style={{ color: '#94A3B8' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#F8FAFC';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#94A3B8';
                }}
              >
                风险提示
              </Link>
              <span style={{ color: '#2A3556' }}>|</span>
              <Link
                href="/cookies"
                className="transition-colors no-underline"
                style={{ color: '#94A3B8' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#F8FAFC';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#94A3B8';
                }}
              >
                Cookie 设置
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
