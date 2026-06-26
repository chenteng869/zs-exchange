﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Image,
  Heart,
  Timer,
  TrendingUp,
  Grid3X3,
  ArrowUpDown,
  Flame,
  Clock,
  ExternalLink,
  User,
  Plus,
  Filter,
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';

// ==================== NFT分类类型 ====================
type NftCategory = 'all' | 'art' | 'game' | 'music' | 'photo' | 'pfp' | 'land';

// ==================== 排序方式 ====================
type SortOption = 'newest' | 'price-asc' | 'popular' | 'ending-soon';

// ==================== 分类配置 ====================
const CATEGORIES: { id: NftCategory; label: string; icon?: React.ReactNode }[] = [
  { id: 'all', label: '全部' },
  { id: 'art', label: '艺术', icon: <Image size={14} /> },
  { id: 'game', label: '游戏', icon: <Flame size={14} /> },
  { id: 'music', label: '音乐' },
  { id: 'photo', label: '摄影' },
  { id: 'pfp', label: 'PFP' },
  { id: 'land', label: '土地' },
];

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'newest', label: '最新上架' },
  { id: 'price-asc', label: '价格低→高' },
  { id: 'popular', label: '热门' },
  { id: 'ending-soon', label: '即将结束' },
];

// ==================== 渐变色块 (NFT图片占位) ====================
const GRADIENTS = [
  'from-purple-500 via-pink-500 to-red-400',
  'from-cyan-400 via-blue-500 to-purple-600',
  'from-green-400 via-emerald-500 to-teal-600',
  'from-orange-400 via-red-500 to-pink-500',
  'from-indigo-500 via-purple-500 to-pink-400',
  'from-yellow-400 via-orange-500 to-red-500',
  'from-blue-400 via-cyan-500 to-teal-400',
  'from-fuchsia-500 via-pink-500 to-rose-400',
  'from-lime-400 via-green-500 to-emerald-500',
  'from-violet-500 via-purple-500 to-indigo-500',
  'from-amber-400 via-yellow-500 to-orange-400',
  'from-sky-400 via-blue-500 to-indigo-400',
];

// ==================== NFT数据结构 ====================
interface NftItem {
  id: string;
  name: string;
  category: NftCategory;
  priceEth: number; // ETH价格
  priceUsd: number; // USD价格
  author: string;
  authorAvatar: string;
  likes: number;
  isLiked: boolean;
  gradientIndex: number; // 使用哪个渐变
}

// ==================== Mock NFT 数据 (至少9个) ====================
const MOCK_NFTS: NftItem[] = [
  {
    id: 'nft-001',
    name: 'Cosmic Dreamer #0421',
    category: 'art',
    priceEth: 2.85,
    priceUsd: 9851.82,
    author: 'ArtMaster.eth',
    authorAvatar: 'AM',
    likes: 234,
    isLiked: false,
    gradientIndex: 0,
  },
  {
    id: 'nft-002',
    name: 'Cyber Punk #7892',
    category: 'pfp',
    priceEth: 0.45,
    priceUsd: 1555.55,
    author: 'PixelStudio',
    authorAvatar: 'PS',
    likes: 892,
    isLiked: true,
    gradientIndex: 1,
  },
  {
    id: 'nft-003',
    name: 'Dragon Slayer Sword',
    category: 'game',
    priceEth: 1.2,
    priceUsd: 4148.14,
    author: 'GameForge',
    authorAvatar: 'GF',
    likes: 1567,
    isLiked: false,
    gradientIndex: 2,
  },
  {
    id: 'nft-004',
    name: 'Neon City Nights #008',
    category: 'photo',
    priceEth: 0.88,
    priceUsd: 3041.30,
    author: 'PhotoDAO',
    authorAvatar: 'PD',
    likes: 421,
    isLiked: false,
    gradientIndex: 3,
  },
  {
    id: 'nft-005',
    name: 'Beat Drop #VOL.12',
    category: 'music',
    priceEth: 0.32,
    priceUsd: 1106.17,
    author: 'SoundWave',
    authorAvatar: 'SW',
    likes: 678,
    isLiked: true,
    gradientIndex: 4,
  },
  {
    id: 'nft-006',
    name: 'Virtual Land - Sector A7',
    category: 'land',
    priceEth: 5.5,
    priceUsd: 19020.31,
    author: 'MetaWorlds',
    authorAvatar: 'MW',
    likes: 120,
    isLiked: false,
    gradientIndex: 5,
  },
  {
    id: 'nft-007',
    name: 'Abstract Emotions #33',
    category: 'art',
    priceEth: 1.65,
    priceUsd: 5703.69,
    author: 'DigitalMuse',
    authorAvatar: 'DM',
    likes: 342,
    isLiked: false,
    gradientIndex: 6,
  },
  {
    id: 'nft-008',
    name: 'Racing Legend Car #001',
    category: 'game',
    priceEth: 3.2,
    priceUsd: 11061.71,
    author: 'SpeedRacers',
    authorAvatar: 'SR',
    likes: 2103,
    isLiked: true,
    gradientIndex: 7,
  },
  {
    id: 'nft-009',
    name: 'Ape Dynasty #5621',
    category: 'pfp',
    priceEth: 0.68,
    priceUsd: 2350.61,
    author: 'ApeFactory',
    authorAvatar: 'AF',
    likes: 1845,
    isLiked: false,
    gradientIndex: 8,
  },
  {
    id: 'nft-010',
    name: 'Synthwave Sunset',
    category: 'art',
    priceEth: 0.95,
    priceUsd: 3284.45,
    author: 'RetroArt',
    authorAvatar: 'RA',
    likes: 567,
    isLiked: false,
    gradientIndex: 9,
  },
  {
    id: 'nft-011',
    name: 'Ocean Depths #007',
    category: 'photo',
    priceEth: 0.42,
    priceUsd: 1451.85,
    author: 'DeepBlue',
    authorAvatar: 'DB',
    likes: 289,
    isLiked: false,
    gradientIndex: 10,
  },
  {
    id: 'nft-012',
    name: 'Metaverse Plaza #B2',
    category: 'land',
    priceEth: 8.8,
    priceUsd: 30419.70,
    author: 'LandDAO',
    authorAvatar: 'LD',
    likes: 95,
    isLiked: true,
    gradientIndex: 11,
  },
];

// ==================== 热门合集Mock数据 ====================
interface Collection {
  name: string;
  coverGradient: string; // 渐变色
  floorPrice: number; // 地板价 ETH
  volume24h: number; // 24h成交量 ETH
  itemsCount: number; // 总数量
  change24h: number; // 24h变化%
}

const HOT_COLLECTIONS: Collection[] = [
  { name: 'Cosmic Dreams', coverGradient: 'from-purple-600 to-pink-500', floorPrice: 1.85, volume24h: 125.5, itemsCount: 10000, change24h: 12.5 },
  { name: 'Cyber Punks', coverGradient: 'from-blue-600 to-cyan-400', floorPrice: 0.35, volume24h: 340.2, itemsCount: 10000, change24h: -3.2 },
  { name: 'Dragon Armory', coverGradient: 'from-green-600 to-emerald-400', floorPrice: 0.88, volume24h: 89.7, itemsCount: 5000, change24h: 25.8 },
  { name: 'Ape Dynasty', coverGradient: 'from-orange-600 to-yellow-400', floorPrice: 0.52, volume24h: 256.8, itemsCount: 8888, change24h: 8.4 },
  { name: 'Meta Worlds', coverGradient: 'from-indigo-600 to-violet-400', floorPrice: 4.2, volume24h: 67.3, itemsCount: 100000, change24h: -1.5 },
];

// ==================== NFT卡片组件 ====================
function NftCard({ nft }: { nft: NftItem }) {
  const [liked, setLiked] = useState(nft.isLiked);
  const [likeCount, setLikeCount] = useState(nft.likes);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  return (
    <motion.div variants={staggerItem}>
      <Card variant="default" padding="none" className="overflow-hidden group h-full flex flex-col">
        {/* 图片区域 (渐变色块占位) */}
        <div className={`relative aspect-square bg-gradient-to-br ${GRADIENTS[nft.gradientIndex % GRADIENTS.length]}`}>
          {/* 悬停遮罩 */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Button variant="primary" size="sm" leftIcon={<ExternalLink size={14} />}>
              查看详情
            </Button>
          </div>

          {/* 收藏按钮 */}
          <button
            onClick={handleLike}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors cursor-pointer"
          >
            <Heart
              size={14}
              className={liked ? 'text-danger fill-danger' : 'text-white'}
            />
          </button>

          {/* 分类标签 */}
          <div className="absolute top-3 left-3">
            <Badge variant="default" size="sm" className="bg-black/50 backdrop-blur-sm !border-transparent text-white text-[10px]">
              {CATEGORIES.find((c) => c.id === nft.category)?.label}
            </Badge>
          </div>
        </div>

        {/* 信息区域 */}
        <div className="p-4 flex flex-col flex-1">
          {/* 名称 */}
          <h3 className="font-semibold text-text-primary text-sm mb-2 truncate">{nft.name}</h3>

          {/* 作者信息 */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">{nft.authorAvatar}</span>
            <span className="text-xs text-text-muted truncate">{nft.author}</span>
          </div>

          {/* 价格 + 点赞 */}
          <div className="mt-auto pt-3 border-t border-deep-700/50 flex items-center justify-between">
            <div>
              <div className="text-xs text-text-muted">价格</div>
              <div className="font-bold font-mono text-brand-500 text-sm">
                {nft.priceEth} ETH
              </div>
              <div className="text-xs text-text-muted font-mono">
                ≈ ${nft.priceUsd.toLocaleString()}
              </div>
            </div>
            <button
              onClick={handleLike}
              className="flex items-center gap-1 text-text-muted hover:text-danger transition-colors"
            >
              <Heart size={14} className={liked ? 'fill-danger text-danger' : ''} />
              <span className="text-xs font-mono">{likeCount}</span>
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ==================== 主页面组件 ====================
export default function NftPage() {
  const [activeCategory, setActiveCategory] = useState<NftCategory>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // 筛选 + 排序后的NFT列表
  const filteredNfts = useMemo(() => {
    let result = activeCategory === 'all'
      ? [...MOCK_NFTS]
      : MOCK_NFTS.filter((n) => n.category === activeCategory);

    // 排序
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.priceEth - b.priceEth);
        break;
      case 'popular':
        result.sort((a, b) => b.likes - a.likes);
        break;
      case 'ending-soon':
        // 模拟：按价格降序（假设高价=即将结束）
        result.sort((a, b) => b.priceEth - a.priceEth);
        break;
      case 'newest':
      default:
        // 默认顺序即为最新
        break;
    }

    return result;
  }, [activeCategory, sortBy]);

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
          <div className="absolute inset-0 bg-gradient-to-b from-pink-500/5 via-purple-500/5 to-transparent" />
          <div className="absolute top-16 right-1/4 w-80 h-80 bg-pink-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-32 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px]" />

          <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-12 md:py-20 relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-samoa/40 bg-samoa/10 mb-4">
                  <span>🇼🇸</span>
                  <span className="text-sm font-medium text-samoa">萨摩亚合规运营</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-bold text-text-primary tracking-tight mb-3">
                  NFT{' '}
                  <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
                    市场
                  </span>
                </h1>
                <p className="text-lg text-text-secondary max-w-xl">
                  独特数字藏品交易平台 · 发现、收藏、交易你的专属NFT
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="info" size="md" pulse>
                  <Grid3X3 size={14} /> {MOCK_NFTS.length}+ 作品在售
                </Badge>
                <Badge variant="license" size="md">
                  <Flame size={14} /> {HOT_COLLECTIONS.length} 热门合集
                </Badge>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ==================== 主内容区域 ==================== */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-[1400px] mx-auto px-4 lg:px-6 pb-16 space-y-10"
        >
          {/* ====== 筛选栏：分类 + 排序 ====== */}
          <section>
            <Card variant="default" padding="md">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                {/* 左侧：分类筛选 */}
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        activeCategory === cat.id
                          ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                          : 'bg-deep-700 text-text-secondary hover:text-text-primary border border-deep-600 hover:border-deep-500'
                      }`}
                    >
                      {cat.icon}
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* 右侧：排序选择 */}
                <div className="flex items-center gap-2 shrink-0">
                  <Filter size={14} className="text-text-muted" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="bg-deep-700 border border-deep-600 rounded-lg px-3 py-2 text-sm text-text-primary focus:border-brand-500 focus:outline-none cursor-pointer"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>
          </section>

          {/* ====== NFT 网格展示 (响应式3列/2列/1列) ====== */}
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNfts.map((nft) => (
                <NftCard key={nft.id} nft={nft} />
              ))}
            </div>

            {/* 无结果提示 */}
            {filteredNfts.length === 0 && (
              <div className="text-center py-16">
                <Image size={48} className="text-deep-500 mx-auto mb-4" />
                <p className="text-text-muted">该分类暂无NFT作品</p>
              </div>
            )}
          </section>

          {/* ====== 热门合集 (横向滚动) ====== */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Flame size={20} className="text-warning" />
              <h2 className="text-xl font-bold text-text-primary">热门合集</h2>
              <Badge variant="warning" size="sm">实时更新</Badge>
            </div>
            <div className="overflow-x-auto pb-4 -mx-4 px-4">
              <div className="flex gap-5">
                {HOT_COLLECTIONS.map((collection) => (
                  <Link
                    key={collection.name}
                    href="#"
                    className="shrink-0 w-[260px] no-underline"
                  >
                    <Card variant="default" padding="none" className="overflow-hidden hover:-translate-y-1 transition-transform duration-300 h-full">
                      {/* 合集封面渐变 */}
                      <div className={`h-36 bg-gradient-to-br ${collection.coverGradient} relative`}>
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute bottom-3 left-3">
                          <h3 className="font-bold text-white text-base drop-shadow-md">{collection.name}</h3>
                        </div>
                        {/* 24h涨跌标签 */}
                        <div className="absolute top-3 right-3">
                          <Badge
                            variant={collection.change24h >= 0 ? 'success' : 'danger'}
                            size="sm"
                            className="bg-white/90 !backdrop-blur-sm"
                          >
                            {collection.change24h >= 0 ? '+' : ''}
                            {collection.change24h.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                      {/* 合集统计 */}
                      <div className="p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-text-muted">地板价</span>
                          <span className="font-mono font-semibold text-brand-500">
                            {collection.floorPrice} ETH
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-text-muted">24h成交量</span>
                          <span className="font-mono text-text-secondary">
                            {collection.volume24h} ETH
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-text-muted">总数量</span>
                          <span className="font-mono text-text-muted">
                            {collection.itemsCount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* ====== 底部CTA：创作者入驻 ====== */}
          <section>
            <Card
              variant="gradient-border"
              padding="lg"
              className="!border-l-brand-primary !border-l-4 text-center relative overflow-hidden"
            >
              {/* 背景装饰 */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-500/10 rounded-full blur-[60px]" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-info/10 rounded-full blur-[60px]" />

              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br bg-brand-500 text-[#1A1D24] flex items-center justify-center mx-auto mb-4 shadow-glow-purple">
                  <Plus size={28} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-text-primary mb-3">
                  创作者？申请入驻 NFT 市场
                </h2>
                <p className="text-text-secondary max-w-lg mx-auto mb-6 text-sm leading-relaxed">
                  加入 ZS Exchange NFT 创作者计划，享受零手续费上架、专属推广资源、
                  社区流量扶持。让您的数字艺术触达全球收藏者。
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button variant="primary" size="lg" leftIcon={<User size={18} />}>
                    申请成为创作者
                  </Button>
                  <Button variant="outline" size="lg" leftIcon={<ExternalLink size={18} />}>
                    查看创作者指南
                  </Button>
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
