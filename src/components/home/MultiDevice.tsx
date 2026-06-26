'use client';

import { motion } from 'framer-motion';
import { Smartphone, Monitor, Globe, Laptop, Tablet } from 'lucide-react';
import { fadeInUp, staggerContainer, staggerItem, hoverLift } from '@/lib/animations';

const platforms = [
  {
    name: 'iOS',
    description: 'iPhone & iPad 原生应用',
    icon: Smartphone,
    color: 'from-blue-500/20 to-blue-600/10',
    iconColor: 'text-blue-400',
    border: 'border-blue-500/20',
  },
  {
    name: 'Android',
    description: '全机型适配 安卓原生',
    icon: Smartphone,
    color: 'from-emerald-500/20 to-emerald-600/10',
    iconColor: 'text-success',
    border: 'border-emerald-500/20',
  },
  {
    name: 'Desktop',
    description: 'Windows/Mac/Linux 客户端',
    icon: Monitor,
    color: 'from-purple-500/20 to-purple-600/10',
    iconColor: 'text-purple-400',
    border: 'border-purple-500/20',
  },
  {
    name: 'Web',
    description: '浏览器即开即用 无需安装',
    icon: Globe,
    color: 'from-cyan-500/20 to-cyan-600/10',
    iconColor: 'text-cyan-400',
    border: 'border-cyan-500/20',
  },
  {
    name: 'Mac',
    description: 'macOS 专属优化客户端',
    icon: Laptop,
    color: 'from-amber-500/20 to-amber-600/10',
    iconColor: 'text-amber-400',
    border: 'border-amber-500/20',
  },
];

export default function MultiDevice() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="max-w-7xl mx-auto"
      >
        {/* 标题 */}
        <motion.div variants={fadeInUp} className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            全平台覆盖 · 随时随地交易
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            支持 iOS、Android、桌面端、Web、Mac 五大平台，一次注册多端同步
          </p>
        </motion.div>

        {/* 5个设备卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 max-w-5xl mx-auto">
          {platforms.map((platform) => (
            <motion.div
              key={platform.name}
              variants={staggerItem}
              {...hoverLift}
              className={`
                relative group bg-gradient-to-br ${platform.color} backdrop-blur-sm
                rounded-xl border ${platform.border} p-6 text-center
                cursor-default transition-all duration-300
                hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-500/5
              `}
            >
              {/* 图标 */}
              <div className="w-14 h-14 rounded-full bg-[#F7F8FA] flex items-center justify-center mx-auto mb-4 group-hover:bg-[#EAECEF] transition-colors">
                <platform.icon className={`w-7 h-7 ${platform.iconColor}`} />
              </div>
              {/* 平台名 */}
              <h3 className="text-base font-bold text-text-primary mb-2">{platform.name}</h3>
              {/* 描述 */}
              <p className="text-xs text-text-secondary leading-relaxed">{platform.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
