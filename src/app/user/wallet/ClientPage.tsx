'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  History,
  Search,
  Shield,
  Snowflake,
  KeyRound,
  ShieldCheck,
  ChevronDown,
  X,
  Copy,
  QrCode,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button, Badge, Modal, Card } from '@/components/ui';
import Table from '@/components/ui/Table';
// eslint-disable-next-line
const T: any = Table;
import { fadeInUp, staggerContainer, staggerItem, hoverLift } from '@/lib/animations';

/* ==================== Mock 币种资产数据 (13种主流币) ==================== */
interface AssetItem {
  symbol: string;
  name: string;
  icon: string;
  iconBg: string;
  total: number;       // 全部数量
  available: number;   // 可用
  frozen: number;      // 冻结中
  usdValue: number;    // 折合USD
  change24h: number;   // 24h涨跌幅%
}

const ASSETS_DATA: AssetItem[] = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿', iconBg: '#F7931A', total: 0.5234, available: 0.5000, frozen: 0.0234, usdValue: 35678.50, change24h: 2.34 },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', iconBg: '#627EEA', total: 3.2560, available: 3.0000, frozen: 0.2560, usdValue: 9780.00, change24h: -1.25 },
  { symbol: 'BNB', name: 'BNB', icon: '◆', iconBg: '#F3BA2F', total: 12.5, available: 10.0, frozen: 2.5, usdValue: 7500.00, change24h: 0.85 },
  { symbol: 'SOL', name: 'Solana', icon: '◎', iconBg: '#9945FF', total: 45.8, available: 40.0, frozen: 5.8, usdValue: 6870.00, change24h: 4.52 },
  { symbol: 'XRP', name: 'Ripple', icon: 'X', iconBg: '#23292F', total: 2500, available: 2500, frozen: 0, usdValue: 1375.00, change24h: -0.32 },
  { symbol: 'ADA', name: 'Cardano', icon: '₳', iconBg: '#0033AD', total: 1500, available: 1200, frozen: 300, usdValue: 825.00, change24h: 1.18 },
  { symbol: 'DOGE', name: 'Dogecoin', icon: 'Ð', iconBg: '#C2A633', total: 10000, available: 8000, frozen: 2000, usdValue: 760.00, change24h: -2.15 },
  { symbol: 'DOT', name: 'Polkadot', icon: '●', iconBg: '#E6007A', total: 200, available: 180, frozen: 20, usdValue: 520.00, change24h: 3.41 },
  { symbol: 'AVAX', name: 'Avalanche', icon: '▲', iconBg: '#E84142', total: 30, available: 28, frozen: 2, usdValue: 552.00, change24h: -0.88 },
  { symbol: 'MATIC', name: 'Polygon', icon: '⬡', iconBg: '#8247E5', total: 3500, available: 3000, frozen: 500, usdValue: 2800.00, change24h: 1.56 },
  { symbol: 'LINK', name: 'Chainlink', icon: '⬢', iconBg: '#2A5ADA', total: 85, available: 80, frozen: 5, usdValue: 1020.00, change24h: 2.08 },
  { symbol: 'USDT', name: 'Tether', icon: '₮', iconBg: '#26A17B', total: 15000, available: 14000, frozen: 1000, usdValue: 15000.00, change24h: 0.01 },
  { symbol: 'USDC', name: 'USD Coin', icon: '$', iconBg: '#2775CA', total: 3000, available: 3000, frozen: 0, usdValue: 3000.00, change24h: 0.00 },
];

/* ==================== 汇总计算 ==================== */
const TOTAL_VALUE = ASSETS_DATA.reduce((sum, a) => sum + a.usdValue, 0);
const AVAILABLE_TOTAL = ASSETS_DATA.reduce((sum, a) => sum + (a.available / a.total) * a.usdValue, 0);
const FROZEN_TOTAL = ASSETS_DATA.reduce((sum, a) => sum + (a.frozen / a.total) * a.usdValue, 0);
// 模拟总盈亏（基于持仓成本）
const TOTAL_PNL = 3421.56;

/* ==================== 网络配置数据 ==================== */
const NETWORK_MAP: Record<string, string[]> = {
  BTC: ['Bitcoin', 'TRC20'],
  ETH: ['ERC20', 'Arbitrum', 'Optimism'],
  BNB: ['BEP20', 'BEP2'],
  SOL: ['Solana'],
  USDT: ['TRC20', 'ERC20', 'BEP20', 'Polygon', 'AVAX-C'],
  USDC: ['ERC20', 'BEP20', 'Polygon'],
};

/* 补充图标导入 */
function ChevronLeft(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 14} height={props.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
  );
}

export default function WalletPage() {
  const [searchQuery, setSearchQuery] = useState('');
  // 充值弹窗状态
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<AssetItem | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState('');

  // 过滤资产列表
  const filteredAssets = ASSETS_DATA.filter(
    (asset) =>
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* 打开充值弹窗 */
  const handleDeposit = (asset?: AssetItem) => {
    if (asset) {
      setSelectedCoin(asset);
    }
    setDepositModalOpen(true);
    // 重置网络选择
    setSelectedNetwork('');
  };

  /* 关闭充值弹窗 */
  const closeDepositModal = () => {
    setDepositModalOpen(false);
    setSelectedCoin(null);
    setSelectedNetwork('');
  };

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ==================== Hero 区域 ==================== */}
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">资产管理</h1>
              <p className="text-text-secondary mt-1">安全存储 · 快速交易 · 随时掌控</p>
            </div>
          </div>
        </motion.div>

        {/* ==================== 资产汇总栏 ==================== */}
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div variants={staggerItem}>
            <Card variant="default" padding="md" hoverable={false} className="text-center">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">总资产</p>
              <p className="text-xl sm:text-2xl font-bold text-white">${TOTAL_VALUE.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </Card>
          </motion.div>
          <motion.div variants={staggerItem}>
            <Card variant="default" padding="md" hoverable={false} className="text-center">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">可用总额</p>
              <p className="text-xl sm:text-2xl font-bold text-success">${AVAILABLE_TOTAL.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </Card>
          </motion.div>
          <motion.div variants={staggerItem}>
            <Card variant="default" padding="md" hoverable={false} className="text-center">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">冻结总额</p>
              <p className="text-xl sm:text-2xl font-bold text-warning">${FROZEN_TOTAL.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </Card>
          </motion.div>
          <motion.div variants={staggerItem}>
            <Card variant="default" padding="md" hoverable={false} className="text-center">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">累计盈亏</p>
              <p className={`text-xl sm:text-2xl font-bold ${TOTAL_PNL >= 0 ? 'text-success' : 'text-danger'}`}>
                {TOTAL_PNL >= 0 ? '+' : ''}${TOTAL_PNL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </Card>
          </motion.div>
        </motion.div>

        {/* ==================== 总资产概览卡片 (增强版) ==================== */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="relative overflow-hidden rounded-2xl mb-8 border border-brand-500/30"
          style={{
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(255, 255, 255, 0.95) 60%, rgba(212, 175, 55, 0.05) 100%)',
          }}
        >
          {/* 装饰性光晕 */}
          <div className="absolute top-0 right-20 w-48 h-48 bg-brand-500/15 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-20 w-40 h-40 bg-gold/10 rounded-full blur-[60px]" />

          <div className="relative z-10 p-6 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* 左侧：总资产信息 */}
              <div>
                <p className="text-sm text-text-muted uppercase tracking-wider mb-2">总资产估值 (USDT)</p>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-4xl md:text-5xl font-bold text-white">
                    ${TOTAL_VALUE.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                    TOTAL_PNL >= 0 
                      ? 'bg-success/20 text-success' 
                      : 'bg-danger/20 text-danger'
                  }`}>
                    {TOTAL_PNL >= 0 ? '+' : ''}{((TOTAL_PNL / (TOTAL_VALUE - TOTAL_PNL)) * 100).toFixed(2)}%
                    <span className="ml-1">(24h)</span>
                  </span>
                </div>
                <p className="text-sm text-text-secondary mt-2">
                  今日盈亏: <span className={TOTAL_PNL >= 0 ? 'text-success' : 'text-danger'}>
                    {TOTAL_PNL >= 0 ? '+' : ''}${TOTAL_PNL.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT
                  </span>
                </p>
              </div>

              {/* 右侧：快捷操作按钮组 */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => handleDeposit()}
                  size="lg"
                  className="!rounded-xl bg-gradient-to-r bg-brand-500 text-[#1A1D24] hover:!shadow-sm"
                >
                  <ArrowDownToLine size={18} className="mr-2" />
                  充值
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="!rounded-xl border-[#EAECEF] text-text-secondary hover:!border-[#D1D5DB] hover:!text-text-primary"
                >
                  <ArrowUpFromLine size={18} className="mr-2" />
                  提现
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="!rounded-xl border-[#EAECEF] text-text-secondary hover:!border-[#D1D5DB] hover:!text-text-primary"
                >
                  <ArrowLeftRight size={18} className="mr-2" />
                  转账
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ==================== 操作按钮组 + 搜索栏 ==================== */}
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          {/* 操作按钮组 */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => handleDeposit()} size="sm" className="!rounded-lg bg-gradient-to-r bg-brand-500 text-[#1A1D24] hover:!shadow-sm">
              <ArrowDownToLine size={16} className="mr-1.5" />
              充值
            </Button>
            <Button variant="outline" size="sm" className="!rounded-lg border-[#EAECEF] text-text-secondary hover:!border-[#D1D5DB] hover:!text-text-primary">
              <ArrowUpFromLine size={16} className="mr-1.5" />
              提现
            </Button>
            <Button variant="outline" size="sm" className="!rounded-lg border-[#EAECEF] text-text-secondary hover:!border-[#D1D5DB] hover:!text-text-primary">
              <ArrowLeftRight size={16} className="mr-1.5" />
              转账
            </Button>
            <Button variant="outline" size="sm" className="!rounded-lg border-[#EAECEF] text-text-secondary hover:!border-[#D1D5DB] hover:!text-text-primary">
              <History size={16} className="mr-1.5" />
              历史记录
            </Button>
          </div>

          {/* 搜索框 */}
          <div className="relative w-full sm:w-auto">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="搜索币种..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 rounded-lg bg-white border border-[#EAECEF] text-sm text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all"
            />
          </div>
        </motion.div>

        {/* ==================== 资产列表表格 ==================== */}
        <motion.div variants={fadeInUp} initial="hidden" animate="visible">
          <Table striped hoverable>
            <T.Thead>
              <T.Tr isZebra={false}>
                <T.Th>币种</T.Th>
                <T.Th>全部</T.Th>
                <T.Th>可用</T.Th>
                <T.Th>冻结中</T.Th>
                <T.Th>折合USD</T.Th>
                <T.Th>24h涨跌</T.Th>
                <T.Th>操作</T.Th>
              </T.Tr>
            </T.Thead>
            <T.Tbody>
              {filteredAssets.map((asset, index) => (
                <T.Tr key={asset.symbol} index={index}>
                  <T.Td>
                    <div className="flex items-center gap-3">
                      {/* 币种图标 */}
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ backgroundColor: asset.iconBg }}
                      >
                        {asset.icon}
                      </div>
                      <div>
                        <span className="font-semibold text-text-primary">{asset.symbol}</span>
                        <span className="block text-xs text-text-muted">{asset.name}</span>
                      </div>
                    </div>
                  </T.Td>
                  <T.Td>
                    <span className="text-text-secondary">{asset.total.toLocaleString('en-US', { maximumFractionDigits: 4 })}</span>
                  </T.Td>
                  <T.Td>
                    <span className="text-text-primary">{asset.available.toLocaleString('en-US', { maximumFractionDigits: 4 })}</span>
                  </T.Td>
                  <T.Td>
                    <span className="text-warning">{asset.frozen.toLocaleString('en-US', { maximumFractionDigits: 4 })}</span>
                  </T.Td>
                  <T.Td>
                    <span className="font-medium text-text-primary">
                      ${asset.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </T.Td>
                  <T.Td>
                    <Badge variant={asset.change24h >= 0 ? 'success' : 'danger'} size="sm">
                      {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                    </Badge>
                  </T.Td>
                  <T.Td>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDeposit(asset)}
                        className="px-2.5 py-1 rounded-md bg-brand-500/15 text-brand-light text-xs font-medium hover:bg-brand-500/25 transition-colors cursor-pointer"
                      >
                        充
                      </button>
                      <button className="px-2.5 py-1 rounded-md bg-[#F7F8FA] text-text-secondary text-xs font-medium hover:bg-[#EAECEF] transition-colors cursor-pointer">
                        提
                      </button>
                      <button className="px-2.5 py-1 rounded-md bg-[#F7F8FA] text-text-secondary text-xs font-medium hover:bg-[#EAECEF] transition-colors cursor-pointer">
                        转
                      </button>
                      <button className="px-2.5 py-1 rounded-md bg-[#F7F8FA] text-text-secondary text-xs font-medium hover:bg-[#EAECEF] transition-colors cursor-pointer">
                        易
                      </button>
                    </div>
                  </T.Td>
                </T.Tr>
              ))}
            </T.Tbody>
          </Table>
        </motion.div>

        {/* ==================== 安全提示区域 ==================== */}
        <motion.section variants={fadeInUp} initial="hidden" animate="visible" className="mt-8">
          <Card variant="default" padding="lg">
            <div className="flex items-start gap-3 mb-4">
              <ShieldCheck size={22} className="text-samoa shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-semibold text-text-primary">安全保障</h3>
                <p className="text-sm text-text-secondary mt-1">ZS Exchange 采用行业领先的安全措施保护您的资产</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              {/* 冷存储 */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-deep-700/30">
                <Snowflake size={18} className="text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-text-primary">冷存储</p>
                  <p className="text-xs text-text-muted mt-0.5">98%资产离线硬件冷钱包存储，物理隔绝黑客攻击</p>
                </div>
              </div>
              {/* 多签 */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-deep-700/30">
                <KeyRound size={18} className="text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-text-primary">多重签名</p>
                  <p className="text-xs text-text-muted mt-0.5">关键操作需3/5多方签名确认，防止单点风险</p>
                </div>
              </div>
              {/* 保险基金 */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-deep-700/30">
                <Shield size={18} className="text-green-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-text-primary">保险基金池</p>
                  <p className="text-xs text-text-muted mt-0.5">设立专项风险准备金，极端情况全额赔付用户损失</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.section>
      </div>

      <Footer />

      {/* ==================== 充值弹窗 Modal ==================== */}
      <AnimatePresence>
        {depositModalOpen && (
          <Modal isOpen={depositModalOpen} onClose={closeDepositModal} title="充值资产" size="lg">
            {/* 步骤一：选择币种 */}
            {!selectedCoin && (
              <div className="space-y-4">
                <p className="text-sm text-text-secondary">请选择您要充值的币种：</p>
                <div className="grid grid-cols-3 gap-3 max-h-[320px] overflow-y-auto pr-1">
                  {ASSETS_DATA.map((asset) => (
                    <button
                      key={asset.symbol}
                      onClick={() => handleDeposit(asset)}
                      className="flex items-center gap-2 p-3 rounded-xl bg-[#F7F8FA] border border-[#EAECEF] hover:border-brand-500 transition-all duration-200 cursor-pointer"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: asset.iconBg }}
                      >
                        {asset.icon}
                      </div>
                      <span className="text-sm font-medium text-text-primary">{asset.symbol}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 步骤二：选择网络 → 显示地址 */}
            {selectedCoin && !selectedNetwork && (
              <div className="space-y-4">
                {/* 已选币种展示 */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-deep-700/50">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: selectedCoin.iconBg }}
                  >
                    {selectedCoin.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{selectedCoin.symbol}</p>
                    <p className="text-xs text-text-muted">{selectedCoin.name}</p>
                  </div>
                  <button
                    onClick={() => setSelectedCoin(null)}
                    className="ml-auto p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-deep-700 transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* 选择网络 */}
                <p className="text-sm text-text-secondary font-medium">选择充值网络：</p>
                <div className="space-y-2">
                  {(NETWORK_MAP[selectedCoin.symbol] || ['主网']).map((network) => (
                    <button
                      key={network}
                      onClick={() => setSelectedNetwork(network)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                        selectedNetwork === network
                          ? 'border-brand-500 bg-brand-500/10'
                          : 'border-deep-600 bg-deep-700 hover:border-deep-500'
                      }`}
                    >
                      <span className="text-sm font-medium text-text-primary">{network}</span>
                      <ChevronDown size={16} className="text-text-muted" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 步骤三：显示充值地址和二维码 */}
            {selectedCoin && selectedNetwork && (
              <div className="space-y-5">
                {/* 币种+网络信息栏 */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-deep-700/50">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: selectedCoin.iconBg }}
                  >
                    {selectedCoin.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{selectedCoin.symbol}</p>
                    <p className="text-xs text-text-muted">网络：{selectedNetwork}</p>
                  </div>
                  <button
                    onClick={() => setSelectedNetwork('')}
                    className="ml-auto p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-deep-700 transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>
                </div>

                {/* 二维码占位区 */}
                <div className="flex justify-center p-6 rounded-xl bg-white">
                  <QrCode size={160} className="text-deep-900" />
                </div>

                {/* 充值地址 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">充值地址</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${selectedCoin.symbol}_${selectedNetwork}_DEPOSIT_ADDRESS_0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 10)}`}
                      className="flex-1 px-3 py-2.5 rounded-lg bg-deep-700 border border-deep-600 text-sm text-text-primary font-mono outline-none"
                    />
                    <button className="shrink-0 p-2.5 rounded-lg bg-brand-500/15 text-brand-light hover:bg-brand-500/25 transition-colors cursor-pointer">
                      <Copy size={16} />
                    </button>
                  </div>
                </div>

                {/* 温馨提示 */}
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-xs text-warning leading-relaxed">
                    请仅通过{selectedNetwork}网络向此地址充值{selectedCoin.symbol}。错误网络的转账可能导致资产丢失且无法找回。
                    最小充值金额为 0.001 {selectedCoin.symbol}。
                  </p>
                </div>
              </div>
            )}
          </Modal>
        )}
      </AnimatePresence>
    </main>
  );
}
