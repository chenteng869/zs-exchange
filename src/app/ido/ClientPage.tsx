'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Rocket,
  Timer,
  Shield,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Zap,
  Lock,
  Star,
  ExternalLink,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';

// ==================== 项目标签类型 ====================
type ProjectTag = 'DeFi' | 'Game' | 'NFT' | 'Infrastructure' | 'AI' | 'Layer2';

// ==================== IDO项目数据结构 ====================
interface IdoProject {
  id: string;
  name: string;
  logo: string; // emoji或渐变色块
  description: string;
  tag: ProjectTag;
  status: 'live' | 'upcoming' | 'ended'; // 进行中/即将开始/已结束
  totalRaise: number; // 总额度 (USD)
  raised: number; // 已认购 (USD)
  price: number; // 认购价格
  currency: string; // 认购币种 (USDT等)
  unlockRule: string; // 释放规则
  startTime?: string; // 开始时间
  endTime?: string; // 结束时间
  progress: number; // 进度百分比 0-100
  participants: number; // 参与人数
  highlight?: boolean; // 是否推荐
}

// ==================== Mock IDO 项目数据 ====================
const IDO_PROJECTS: IdoProject[] = [
  // ====== 进行中项目 (3个) ======
  {
    id: 'ido-001',
    name: 'Nexus Finance',
    logo: 'NF',
    description: '下一代跨链DeFi聚合协议，支持多链资产无缝桥接和最优收益策略',
    tag: 'DeFi',
    status: 'live',
    totalRaise: 500000,
    raised: 385000,
    price: 0.08,
    currency: 'USDT',
    unlockRule: 'TGE释放20% · 线性解锁6个月',
    startTime: '2026-06-01 10:00:00',
    endTime: '2026-06-15 18:00:00',
    progress: 77,
    participants: 2847,
    highlight: true,
  },
  {
    id: 'ido-002',
    name: 'CryptoRacers',
    logo: 'CR',
    description: 'Web3竞速游戏，融合NFT赛车收藏、PVP竞技和Play-to-Earn经济模型',
    tag: 'Game',
    status: 'live',
    totalRaise: 300000,
    raised: 198000,
    price: 0.05,
    currency: 'USDT',
    unlockRule: 'TGE释放15% · 每月释放14.17%',
    startTime: '2026-06-05 12:00:00',
    endTime: '2026-06-20 12:00:00',
    progress: 66,
    participants: 1523,
  },
  {
    id: 'ido-003',
    name: 'MetaLand AI',
    logo: 'ML',
    description: 'AI驱动的元宇宙土地交易平台，智能定价+自动生成虚拟建筑',
    tag: 'AI',
    status: 'live',
    totalRaise: 800000,
    raised: 432000,
    price: 0.12,
    currency: 'USDT',
    unlockRule: 'TGE释放10% · 线性解锁12个月',
    startTime: '2026-06-08 09:00:00',
    endTime: '2026-06-22 09:00:00',
    progress: 54,
    participants: 1920,
  },
  // ====== 即将开始项目 (2个) ======
  {
    id: 'ido-004',
    name: 'ChainVault',
    logo: 'CV',
    description: '去中心化资产管理协议，支持机构级多签托管和自动化再平衡',
    tag: 'Infrastructure',
    status: 'upcoming',
    totalRaise: 1000000,
    raised: 0,
    price: 0.15,
    currency: 'USDT',
    unlockRule: 'TGE释放25% · 季度释放25%×3',
    startTime: '2026-06-20 10:00:00',
    endTime: '2026-07-04 18:00:00',
    progress: 0,
    participants: 0,
  },
  {
    id: 'ido-005',
    name: 'PixelPunks NFT',
    logo: 'PP',
    description: '生成式像素艺术NFT系列，每个NFT都是独一无二的算法创作',
    tag: 'NFT',
    status: 'upcoming',
    totalRaise: 200000,
    raised: 0,
    price: 0.03,
    currency: 'USDT',
    unlockRule: 'TGE释放30% · 剩余70%分4期释放',
    startTime: '2026-06-25 14:00:00',
    endTime: '2026-07-05 14:00:00',
    progress: 0,
    participants: 0,
  },
  // ====== 已结束项目 (3个) ======
  {
    id: 'ido-006',
    name: 'SwiftBridge',
    logo: 'SB',
    description: '超高速跨链桥，亚秒级资产转移，支持EVM和非EVM链',
    tag: 'Infrastructure',
    status: 'ended',
    totalRaise: 600000,
    raised: 600000,
    price: 0.06,
    currency: 'USDT',
    unlockRule: 'TGE释放20% · 月度释放13.33%×6',
    progress: 100,
    participants: 3562,
  },
  {
    id: 'ido-007',
    name: 'DeFi Kingdoms 2',
    logo: 'DK',
    description: '经典链游续作，全新经济模型和更丰富的GameFi玩法',
    tag: 'Game',
    status: 'ended',
    totalRaise: 400000,
    raised: 400000,
    price: 0.04,
    currency: 'USDT',
    unlockRule: 'TGE释放15% · 双周释放一次',
    progress: 100,
    participants: 4891,
  },
  {
    id: 'ido-008',
    name: 'ZK-Rollup Layer2',
    logo: 'ZK',
    description: '基于零知识证明的Layer2扩容方案，低Gas高吞吐',
    tag: 'Layer2',
    status: 'ended',
    totalRaise: 1500000,
    raised: 1425000,
    price: 0.25,
    currency: 'USDT',
    unlockRule: 'TGE释放10% · 线性解锁18个月',
    progress: 95,
    participants: 2103,
  },
];

// ==================== 标签颜色映射 ====================
const TAG_COLORS: Record<ProjectTag, { bg: string; text: string }> = {
  DeFi: { bg: 'bg-brand-500/20', text: 'text-brand-500' },
  Game: { bg: 'bg-success/20', text: 'text-success' },
  NFT: { bg: 'bg-info/20', text: 'text-info' },
  Infrastructure: { bg: 'bg-warning/20', text: 'text-warning' },
  AI: { bg: 'bg-danger/20', text: 'text-danger' },
  Layer2: { bg: 'bg-samoa/20', text: 'text-samoa' },
};

// ==================== 倒计时Hook ====================
function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
}

// ==================== 倒计时显示组件 ====================
function CountdownDisplay({ targetDate }: { targetDate: string }) {
  const { days, hours, minutes, seconds } = useCountdown(targetDate);

  return (
    <div className="flex items-center gap-1.5 font-mono">
      <div className="flex items-center gap-1">
        <Timer size={14} className="text-warning" />
      </div>
      {[
        { value: days, label: '天' },
        { value: hours, label: '时' },
        { value: minutes, label: '分' },
        { value: seconds, label: '秒' },
      ].map((unit) => (
        <div key={unit.label} className="text-center min-w-[36px]">
          <div className="bg-deep-900 rounded-md px-1.5 py-1 text-sm font-bold text-text-primary leading-none">
            {String(unit.value).padStart(2, '0')}
          </div>
          <span className="text-[10px] text-text-muted">{unit.label}</span>
        </div>
      ))}
    </div>
  );
}

// ==================== 项目卡片组件 ====================
function LiveProjectCard({ project }: { project: IdoProject }) {
  return (
    <Card variant="default" padding="lg" className="relative overflow-hidden h-full flex flex-col">
      {/* 推荐标签 */}
      {project.highlight && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge variant="license" pulse size="md">推荐</Badge>
        </div>
      )}

      {/* 项目头部：Logo + 名称 + 标签 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-deep-700 to-deep-800 border border-deep-600 flex items-center justify-center text-3xl">
            {project.logo}
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary">{project.name}</h3>
            <Badge
              variant="default"
              size="sm"
              className={`${TAG_COLORS[project.tag].bg} ${TAG_COLORS[project.tag].text} !border-transparent mt-1`}
            >
              {project.tag}
            </Badge>
          </div>
        </div>
      </div>

      {/* 项目描述 */}
      <p className="text-sm text-text-secondary mb-4 line-clamp-2">{project.description}</p>

      {/* 进度条 */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-text-muted">已认购</span>
          <span className="text-text-primary font-mono">
            ${(project.raised / 1000).toFixed(0)}K / ${(project.totalRaise / 1000).toFixed(0)}K
          </span>
        </div>
        <div className="w-full h-2.5 bg-deep-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${project.progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              project.progress >= 80 ? 'bg-success' : project.progress >= 50 ? 'bg-brand-500' : 'bg-info'
            }`}
          />
        </div>
      </div>

      {/* 关键信息网格 */}
      <div className="grid grid-cols-3 gap-3 my-4 p-3 bg-deep-700/30 rounded-lg">
        <div className="text-center">
          <div className="text-xs text-text-muted">认购价</div>
          <div className="text-sm font-bold font-mono text-license">${project.price}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-text-muted">参与人数</div>
          <div className="text-sm font-bold font-mono text-text-primary">
            {project.participants.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-text-muted">进度</div>
          <div className="text-sm font-bold font-mono text-success">{project.progress}%</div>
        </div>
      </div>

      {/* 倒计时 */}
      {project.endTime && (
        <div className="mb-4 flex justify-center">
          <CountdownDisplay targetDate={project.endTime} />
        </div>
      )}

      {/* 释放规则 */}
      <div className="mt-auto pt-3 border-t border-deep-700/50">
        <div className="flex items-start gap-2 text-xs text-text-muted">
          <Lock size={12} className="shrink-0 mt-0.5 text-info" />
          <span>{project.unlockRule}</span>
        </div>
      </div>

      {/* CTA按钮 */}
      <Button
        variant="primary"
        size="md"
        className="w-full mt-4"
        rightIcon={<ArrowRight size={16} />}
      >
        立即认购
      </Button>
    </Card>
  );
}

// ==================== 即将开始项目行组件 ====================
function UpcomingProjectRow({ project }: { project: IdoProject }) {
  return (
    <Card variant="default" padding="md" className="hover:border-brand-500/30 transition-colors">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Logo + 信息 */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-deep-700 border border-deep-600 flex items-center justify-center text-2xl shrink-0">
            {project.logo}
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-text-primary truncate">{project.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="default"
                size="sm"
                className={`${TAG_COLORS[project.tag].bg} ${TAG_COLORS[project.tag].text} !border-transparent`}
              >
                {project.tag}
              </Badge>
              <span className="text-xs text-text-muted truncate">{project.description.slice(0, 30)}...</span>
            </div>
          </div>
        </div>

        {/* 价格 + 时间 + 按钮 */}
        <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto">
          <div className="text-right hidden md:block">
            <div className="text-xs text-text-muted">认购价格</div>
            <div className="font-mono font-semibold text-text-primary">${project.price}</div>
          </div>
          <div className="hidden lg:block">
            <div className="text-xs text-text-muted mb-1">开始时间</div>
            {project.startTime && <CountdownDisplay targetDate={project.startTime} />}
          </div>
          <Button variant="outline" size="sm" leftIcon={<Clock size={14} />}>
            提醒我
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ==================== 已结束项目横向卡片 ====================
function EndedProjectCard({ project }: { project: IdoProject }) {
  return (
    <Card variant="default" padding="md" className="min-w-[280px] max-w-[300px] shrink-0">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-lg bg-deep-700 flex items-center justify-center text-xl">
          {project.logo}
        </div>
        <div>
          <h4 className="font-medium text-text-primary text-sm">{project.name}</h4>
          <Badge variant="success" size="sm" className="mt-1">
            已完成
          </Badge>
        </div>
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-text-muted">认购总额</span>
          <span className="font-mono text-text-primary">${(project.raised / 1000).toFixed(0)}K</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">参与人数</span>
          <span className="font-mono text-text-secondary">{project.participants.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">完成度</span>
          <span className="font-mono text-success">{project.progress}%</span>
        </div>
      </div>
    </Card>
  );
}

// ==================== 辅助：Coins图标组件 ====================
function CoinsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  );
}

// ==================== 主页面组件 ====================
export default function IdoPage() {
  // 分类项目
  const liveProjects = IDO_PROJECTS.filter((p) => p.status === 'live');
  const upcomingProjects = IDO_PROJECTS.filter((p) => p.status === 'upcoming');
  const endedProjects = IDO_PROJECTS.filter((p) => p.status === 'ended');

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-deep-900 pt-[72px]">
        {/* ==================== Hero 区域 ==================== */}
        <motion.section
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-license/8 via-transparent to-transparent" />
          <div className="absolute top-20 left-1/4 w-80 h-80 bg-license/10 rounded-full blur-[120px]" />

          <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-12 md:py-20 relative z-10 text-center">
            {/* 萨摩亚徽章 */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-samoa/40 bg-samoa/10 mb-6">
              <span>🇼🇸</span>
              <span className="text-sm font-medium text-samoa">萨摩亚合规IDO平台</span>
              <Shield size={14} className="text-samoa" />
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-text-primary tracking-tight mb-4">
              IDO{' '}
              <span className="bg-gradient-to-r from-license to-yellow-400 bg-clip-text text-transparent">
                Launchpad
              </span>
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-8">
              发现优质早期项目 · 合规认购流程 · 公平分配机制 · 安全释放保障
            </p>

            {/* 统计数据 */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-10">
              {[
                { label: '已完成项目', value: '42+', icon: <Rocket size={18} className="text-brand-500" /> },
                { label: '总融资额', value: '$28M+', icon: <TrendingUp size={18} className="text-success" /> },
                { label: '累计参与者', value: '85K+', icon: <Users size={18} className="text-info" /> },
                { label: '平均回报率', value: '3.2x', icon: <Star size={18} className="text-license" /> },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-2 px-4 py-2 bg-deep-800/60 backdrop-blur-sm rounded-lg border border-deep-700/50">
                  {stat.icon}
                  <div className="text-left">
                    <div className="text-lg font-bold font-mono text-text-primary">{stat.value}</div>
                    <div className="text-xs text-text-muted">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ==================== 主内容区域 ==================== */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-[1400px] mx-auto px-4 lg:px-6 pb-16 space-y-12"
        >
          {/* ====== 进行中项目 ====== */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-6 rounded-full bg-success animate-pulse" />
              <h2 className="text-xl font-bold text-text-primary">进行中项目</h2>
              <Badge variant="success" size="sm" pulse>{liveProjects.length} 个进行中</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {liveProjects.map((project) => (
                <motion.div key={project.id} variants={staggerItem}>
                  <LiveProjectCard project={project} />
                </motion.div>
              ))}
            </div>
          </section>

          {/* ====== 即将开始项目 ====== */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-6 rounded-full bg-warning" />
              <h2 className="text-xl font-bold text-text-primary">即将开始</h2>
              <Badge variant="warning" size="sm">{upcomingProjects.length} 个待上线</Badge>
            </div>
            <div className="space-y-4">
              {upcomingProjects.map((project) => (
                <motion.div key={project.id} variants={staggerItem}>
                  <UpcomingProjectRow project={project} />
                </motion.div>
              ))}
            </div>
          </section>

          {/* ====== 已结束项目 (横向滚动) ====== */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-6 rounded-full bg-deep-500" />
              <h2 className="text-xl font-bold text-text-primary">已结束项目</h2>
              <Badge variant="default" size="sm">{endedProjects.length} 个已完成</Badge>
            </div>
            <div className="overflow-x-auto pb-4 -mx-4 px-4">
              <div className="flex gap-4">
                {endedProjects.map((project) => (
                  <EndedProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          </section>

          {/* ====== IDO 参与条件说明 ====== */}
          <section>
            <Card variant="default" padding="lg">
              <h2 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
                <Shield size={20} className="text-samoa" />
                IDO 参与条件 & 流程说明
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    step: '01',
                    title: 'KYC认证',
                    desc: '完成实名认证，达到LV2等级以上方可参与IDO认购',
                    icon: <Shield size={20} className="text-samoa" />,
                    color: 'from-samoa/20 to-samoa/5',
                  },
                  {
                    step: '02',
                    title: '持仓要求',
                    desc: '持有ZS Token或指定币种达到最低门槛获取认购额度',
                    icon: <CoinsIcon />,
                    color: 'from-brand-primary/20 to-brand-primary/5',
                  },
                  {
                    step: '03',
                    title: '白名单审核',
                    desc: '提交申请并通过风控审核后进入白名单，获得正式认购资格',
                    icon: <CheckCircle2 size={20} className="text-success" />,
                    color: 'from-success/20 to-success/5',
                  },
                  {
                    step: '04',
                    title: '认购 & 释放',
                    desc: '在开放窗口期内完成认购，按释放规则逐步解锁项目代币',
                    icon: <Zap size={20} className="text-info" />,
                    color: 'from-info/20 to-info/5',
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className={`relative p-5 rounded-xl bg-gradient-to-br ${item.color} border border-deep-700/50`}
                  >
                    <div className="text-3xl font-bold text-deep-500/30 absolute top-3 right-4">
                      {item.step}
                    </div>
                    <div className="mb-3">{item.icon}</div>
                    <h3 className="text-base font-semibold text-text-primary mb-2">{item.title}</h3>
                    <p className="text-xs text-text-secondary leading-relaxed">{item.desc}</p>
                  </div>
                ))}

              </div>

              {/* 风险提示 */}
              <div className="mt-6 p-4 bg-warning/5 border border-warning/20 rounded-lg flex items-start gap-3">
                <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
                <div className="text-xs text-text-secondary leading-relaxed space-y-1">
                  <p>
                    <strong>风险提示：</strong>IDO项目属于高风险早期投资，可能面临项目失败、代币归零等风险。
                    请充分了解项目白皮书和团队背景后再做决策。过往项目表现不代表未来收益。
                  </p>
                  <p className="text-samoa">
                    🇼🇸 ZS Exchange IDO平台受萨摩亚金融监管框架约束，所有项目均经过基础尽职调查。
                  </p>
                </div>
              </div>
            </Card>
          </section>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
