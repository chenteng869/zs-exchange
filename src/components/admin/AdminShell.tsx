'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Layout, Menu, Avatar, Dropdown, Button, Space, theme, ConfigProvider } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  TransactionOutlined,
  SafetyOutlined,
  DollarOutlined,
  SettingOutlined,
  HistoryOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  AppstoreOutlined,
  AuditOutlined,
  BankOutlined,
  TeamOutlined,
  IdcardOutlined,
  VideoCameraOutlined,
  PictureOutlined,
  ContainerOutlined,
  ShopOutlined,
  CreditCardOutlined,
  WalletOutlined,
  SafetyCertificateOutlined,
  AlertOutlined,
  BarChartOutlined,
  AccountBookOutlined,
  CheckCircleOutlined,
  UsergroupAddOutlined,
  LockOutlined,
  GlobalOutlined,
  CloudServerOutlined,
  SwapOutlined,
  RocketOutlined,
  UnlockOutlined,
  TrophyOutlined,
  GiftOutlined,
  ShoppingCartOutlined,
  CarOutlined,
  ThunderboltOutlined,
  ApiOutlined,
  BuildOutlined,
  FundOutlined,
  ExperimentOutlined,
  ScanOutlined,
  EditOutlined,
  ThunderboltFilled,
  // v2.0 新增图标：企业服务/代币发行/上市通道/AIOPC/直销/牌照合规
  FolderOpenOutlined,
  RiseOutlined,
  RobotOutlined,
  LinkOutlined,
  NodeIndexOutlined,
  ReadOutlined,
  HomeOutlined,
  ToolOutlined,
  ApartmentOutlined,
  // 369 业务新增图标
  CalendarOutlined,
  CrownOutlined,
  StarOutlined,
  GoldOutlined,
  ClusterOutlined,
  CompassOutlined,
  EnvironmentOutlined,
  BlockOutlined,
  NotificationOutlined,
  ReloadOutlined,
  HourglassOutlined,
  DollarCircleOutlined,
  AimOutlined,
  PieChartOutlined,
  BellOutlined,
  FileOutlined,
  FileProtectOutlined,
  // v3.0 新增图标：安全/大屏/AI分析/区块链/OpenClaw/n8n/BPM/IoT/国际化/数据
  SecurityScanOutlined,
  DesktopOutlined,
  RadarChartOutlined,
  RobotFilled,
  NodeCollapseOutlined,
  ApiFilled,
  BranchesOutlined,
  WifiOutlined,
  TranslationOutlined,
  LineChartOutlined,
  EyeOutlined,
  FireOutlined,
  DatabaseOutlined,
  KeyOutlined,
  AlertFilled,
  SearchOutlined,
  BulbOutlined,
  ExperimentFilled,
  SoundOutlined,
  FormOutlined,
  PlayCircleOutlined,
  CopyOutlined,
  DashboardTwoTone,
  HeartOutlined,
  VideoCameraAddOutlined,
  HeatMapOutlined,
  ProjectOutlined,
  CloudDownloadOutlined,
  FrownOutlined,
  SmileOutlined,
  QuestionCircleOutlined,
  PercentageOutlined,
  UsbOutlined,
  MonitorOutlined,
  BellFilled,
  DatabaseFilled,
  FunctionOutlined,
  BugOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';

const { Header, Sider, Content } = Layout;
type MenuItem = NonNullable<MenuProps['items']>[number];
const AdminLayoutContext = createContext(false);

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const menuItems = [
  {
    key: '/admin/dashboard',
    icon: <DashboardOutlined />,
    label: '数据中心',
  },
  {
    key: 'p2p3-group',
    icon: <RocketOutlined />,
    label: 'P2/P3 专业交易',
    children: [
      { key: '/admin/algo/strategies', icon: <ThunderboltOutlined />, label: '算法交易' },
      { key: '/admin/maker', icon: <TeamOutlined />, label: '做市商系统' },
      { key: '/admin/portfolio', icon: <PieChartOutlined />, label: '投资组合' },
      { key: '/admin/yield', icon: <ClusterOutlined />, label: 'DeFi 收益' },
      { key: '/admin/fiat', icon: <BankOutlined />, label: '法币通道' },
      { key: '/admin/kol', icon: <UserOutlined />, label: 'KOL 系统' },
      { key: '/admin/insurance', icon: <SafetyCertificateOutlined />, label: '保险池' },
      { key: '/admin/nansen', icon: <RadarChartOutlined />, label: 'Nansen 链上' },
      { key: '/admin/dcep', icon: <WalletOutlined />, label: '数字人民币' },
      { key: '/admin/sentiment', icon: <HeartOutlined />, label: 'AI 情绪分析' },
      { key: '/admin/dao', icon: <BranchesOutlined />, label: 'DAO 治理' },
      { key: '/admin/otc', icon: <BankOutlined />, label: 'OTC 大宗交易' },
    ],
  },
  {
    key: 'web3-group',
    icon: <ThunderboltOutlined />,
    label: 'Web3.0 管理',
    children: [
      {
        key: '/admin/web3/dashboard',
        icon: <BarChartOutlined />,
        label: 'Web3 数据看板',
      },
      {
        key: '/admin/web3/dapps',
        icon: <AppstoreOutlined />,
        label: 'DApp 接入管理',
      },
      {
        key: '/admin/web3/blockchain',
        icon: <ScanOutlined />,
        label: '区块链监控',
      },
    ],
  },
  {
    key: 'chain-group',
    icon: <GlobalOutlined />,
    label: '公链管理',
    children: [
      {
        key: '/admin/chain/nodes',
        icon: <CloudServerOutlined />,
        label: '节点管理',
      },
      {
        key: '/admin/chain/explorer',
        icon: <AppstoreOutlined />,
        label: '区块浏览',
      },
      {
        key: '/admin/chain/governance',
        icon: <AuditOutlined />,
        label: '链上治理',
      },
      {
        key: '/admin/chain/monitor',
        icon: <BarChartOutlined />,
        label: '网络监控',
      },
      {
        key: '/admin/chain/bridge',
        icon: <TransactionOutlined />,
        label: '跨链桥',
      },
    ],
  },
  {
    key: 'cex-group',
    icon: <CreditCardOutlined />,
    label: 'CEX交易所',
    children: [
      {
        key: '/admin/cex/spot',
        icon: <ShoppingOutlined />,
        label: '币币交易',
      },
      {
        key: '/admin/cex/futures',
        icon: <SafetyCertificateOutlined />,
        label: '合约交易',
      },
      {
        key: '/admin/cex/leverage',
        icon: <AlertOutlined />,
        label: '杠杆交易',
      },
      {
        key: '/admin/cex/orders',
        icon: <ContainerOutlined />,
        label: '订单管理',
      },
      {
        key: '/admin/cex/pairs',
        icon: <AppstoreOutlined />,
        label: '交易对配置',
      },
      {
        key: '/admin/cex/market',
        icon: <BarChartOutlined />,
        label: '行情管理',
      },
      {
        key: '/admin/cex/risk',
        icon: <SafetyOutlined />,
        label: '风险控制',
      },
    ],
  },
  {
    key: 'dex-group',
    icon: <SwapOutlined />,
    label: 'DEX交易所',
    children: [
      {
        key: '/admin/dex/pools',
        icon: <ContainerOutlined />,
        label: '流动性池',
      },
      {
        key: '/admin/dex/swap',
        icon: <TransactionOutlined />,
        label: '闪兑交易',
      },
      {
        key: '/admin/dex/farming',
        icon: <BankOutlined />,
        label: '流动性挖矿',
      },
      {
        key: '/admin/dex/pairs',
        icon: <AppstoreOutlined />,
        label: '交易对管理',
      },
    ],
  },
  {
    key: 'defi-group',
    icon: <FundOutlined />,
    label: 'DeFi管理',
    children: [
      {
        key: '/admin/defi/staking',
        icon: <LockOutlined />,
        label: '质押管理',
      },
      {
        key: '/admin/defi/liquidity',
        icon: <SwapOutlined />,
        label: '流动性管理',
      },
      {
        key: '/admin/defi/rewards',
        icon: <TrophyOutlined />,
        label: '收益分配',
      },
    ],
  },
  {
    key: 'wallet-group',
    icon: <WalletOutlined />,
    label: 'Web3钱包',
    children: [
      {
        key: '/admin/wallet/addresses',
        icon: <IdcardOutlined />,
        label: '地址管理',
      },
      {
        key: '/admin/wallet/assets',
        icon: <DollarOutlined />,
        label: '资产监控',
      },
      {
        key: '/admin/wallet/transactions',
        icon: <TransactionOutlined />,
        label: '交易记录',
      },
      {
        key: '/admin/wallet/nfts',
        icon: <PictureOutlined />,
        label: 'NFT资产',
      },
      {
        key: '/admin/wallet/security',
        icon: <SafetyOutlined />,
        label: '安全策略',
      },
    ],
  },
  {
    key: 'staking-group',
    icon: <AccountBookOutlined />,
    label: '质押挖矿',
    children: [
      {
        key: '/admin/staking/pools',
        icon: <ContainerOutlined />,
        label: '矿池管理',
      },
      {
        key: '/admin/staking/records',
        icon: <FileTextOutlined />,
        label: '质押记录',
      },
      {
        key: '/admin/staking/rewards',
        icon: <DollarOutlined />,
        label: '收益发放',
      },
      {
        key: '/admin/staking/referral',
        icon: <TeamOutlined />,
        label: '推荐关系',
      },
      {
        key: '/admin/staking/config',
        icon: <SettingOutlined />,
        label: '收益率配置',
      },
    ],
  },
  {
    key: 'ido-group',
    icon: <RocketOutlined />,
    label: 'IDO/Launchpad',
    children: [
      {
        key: '/admin/ido/projects',
        icon: <AppstoreOutlined />,
        label: '项目管理',
      },
      {
        key: '/admin/ido/whitelist',
        icon: <UsergroupAddOutlined />,
        label: '白名单管理',
      },
      {
        key: '/admin/ido/subscriptions',
        icon: <FileTextOutlined />,
        label: '申购管理',
      },
      {
        key: '/admin/ido/unlock',
        icon: <UnlockOutlined />,
        label: '解锁计划',
      },
      {
        key: '/admin/ido/distribution',
        icon: <CreditCardOutlined />,
        label: '代币发放',
      },
    ],
  },
  {
    key: 'quant-group',
    icon: <BarChartOutlined />,
    label: '量化交易',
    children: [
      // === 核心功能（原5项保留）===
      { key: '/admin/quant/dashboard', icon: <DashboardTwoTone />, label: '量化仪表盘' },
      { key: '/admin/quant/strategies', icon: <AppstoreOutlined />, label: '策略管理' },
      { key: '/admin/quant/backtest', icon: <HistoryOutlined />, label: '策略回测' },
      { key: '/admin/quant/subscriptions', icon: <UserOutlined />, label: '跟单订阅' },
      { key: '/admin/quant/performance', icon: <BarChartOutlined />, label: '绩效监控' },
      { key: '/admin/quant/risk', icon: <SafetyOutlined />, label: '风险控制' },
      // === 策略市场 ===
      {
        key: 'quant-strategy-market',
        icon: <ShopOutlined />,
        label: '策略市场',
        children: [
          { key: '/admin/quant/strategy-market', icon: <ShoppingOutlined />, label: '策略商城' },
          { key: '/admin/quant/agents', icon: <RobotOutlined />, label: 'AI策略代理' },
          { key: '/admin/quant/settings', icon: <SettingOutlined />, label: '策略设置' },
        ],
      },
      // === 分析工具 ===
      {
        key: 'quant-analysis',
        icon: <LineChartOutlined />,
        label: '分析工具',
        children: [
          { key: '/admin/quant/analysis', icon: <RadarChartOutlined />, label: '量化分析' },
          { key: '/admin/quant/portfolio', icon: <FundOutlined />, label: '投资组合' },
          { key: '/admin/quant/benchmark', icon: <AimOutlined />, label: '基准对比' },
          { key: '/admin/quant/trade-logs', icon: <FileTextOutlined />, label: '交易日志' },
        ],
      },
      // === 跟单系统 ===
      {
        key: 'quant-copy',
        icon: <CopyOutlined />,
        label: '跟单系统',
        children: [
          { key: '/admin/quant/copy-trading', icon: <SwapOutlined />, label: '跟单交易' },
          { key: '/admin/quant/copy-performance', icon: <TrophyOutlined />, label: '跟单绩效' },
        ],
      },
      // === 代币评分系统 (Token Score) ===
      {
        key: 'quant-token',
        icon: <FireOutlined />,
        label: '代币评分',
        children: [
          { key: '/admin/quant/token-score', icon: <StarOutlined />, label: '评分列表' },
          { key: '/admin/quant/token-pricing', icon: <DollarCircleOutlined />, label: '代币定价' },
          { key: '/admin/quant/token-audit', icon: <SafetyCertificateOutlined />, label: '代币审计' },
          { key: '/admin/quant/token-onchain', icon: <BlockOutlined />, label: '链上数据' },
          { key: '/admin/quant/token-warnings', icon: <AlertFilled />, label: '风险预警' },
        ],
      },
      // === IPO评估系统 ===
      {
        key: 'quant-ipo',
        icon: <RiseOutlined />,
        label: 'IPO评估',
        children: [
          { key: '/admin/quant/ipo-assessment', icon: <ExperimentFilled />, label: '综合评估' },
          { key: '/admin/quant/ipo-score', icon: <ExperimentOutlined />, label: 'IPO评分' },
          { key: '/admin/quant/ipo-dcf', icon: <FundOutlined />, label: 'DCF估值' },
          { key: '/admin/quant/ipo-peers', icon: <TeamOutlined />, label: '同业对比' },
          { key: '/admin/quant/ipo-roadshow', icon: <VideoCameraOutlined />, label: '路演管理' },
          { key: '/admin/quant/ipo-simulator', icon: <ExperimentOutlined />, label: 'IPO模拟器' },
        ],
      },
      // === 策略分销 ===
      {
        key: 'quant-distribution',
        icon: <ShoppingCartOutlined />,
        label: '策略分销',
        children: [
          { key: '/admin/quant/distribution/products', icon: <AppstoreOutlined />, label: '分销产品' },
          { key: '/admin/quant/distribution/network', icon: <NodeIndexOutlined />, label: '分销网络' },
          { key: '/admin/quant/distribution/funnel', icon: <PieChartOutlined />, label: '转化漏斗' },
          { key: '/admin/quant/distribution/analytics', icon: <PieChartOutlined />, label: '分销分析' },
          { key: '/admin/quant/distribution/settlement', icon: <AccountBookOutlined />, label: '结算管理' },
        ],
      },
      // === 企业投研 ===
      {
        key: 'quant-enterprise',
        icon: <FileTextOutlined />,
        label: '企业投研',
        children: [
          { key: '/admin/quant/enterprise-report', icon: <ReadOutlined />, label: '企业研报' },
          { key: '/admin/quant/enterprise-advisor', icon: <BulbOutlined />, label: '投顾助手' },
        ],
      },
      // === AIOPC工具箱 ===
      {
        key: 'quant-aiopc',
        icon: <ThunderboltOutlined />,
        label: 'AIOPC工具箱',
        children: [
          { key: '/admin/quant/aiopc-tools', icon: <ToolOutlined />, label: 'AIOPC工具' },
          { key: '/admin/quant/supply-chain', icon: <ApartmentOutlined />, label: '供应链分析' },
          { key: '/admin/quant/digital-maturity', icon: <CloudServerOutlined />, label: '数字化成熟度' },
        ],
      },
    ],
  },
  {
    key: 'entertainment-group',
    icon: <TrophyOutlined />,
    label: '娱乐游戏',
    children: [
      {
        key: '/admin/entertainment/lottery',
        icon: <GiftOutlined />,
        label: '幸运抽奖',
      },
      {
        key: '/admin/entertainment/blindbox',
        icon: <ContainerOutlined />,
        label: '盲盒系统',
      },
      {
        key: '/admin/entertainment/games',
        icon: <VideoCameraOutlined />,
        label: '竞技游戏',
      },
      {
        key: '/admin/entertainment/prizes',
        icon: <GiftOutlined />,
        label: '奖品管理',
      },
      {
        key: '/admin/entertainment/records',
        icon: <HistoryOutlined />,
        label: '中奖记录',
      },
    ],
  },
  {
    key: 'ecommerce-group',
    icon: <ShopOutlined />,
    label: '电商商城',
    children: [
      {
        key: '/admin/ecommerce/products',
        icon: <AppstoreOutlined />,
        label: '商品管理',
      },
      {
        key: '/admin/ecommerce/orders',
        icon: <ShoppingCartOutlined />,
        label: '订单管理',
      },
      {
        key: '/admin/ecommerce/inventory',
        icon: <ContainerOutlined />,
        label: '库存管理',
      },
      {
        key: '/admin/ecommerce/logistics',
        icon: <CarOutlined />,
        label: '物流配置',
      },
      {
        key: '/admin/ecommerce/finance',
        icon: <DollarOutlined />,
        label: '财务管理',
      },
    ],
  },
  {
    key: 'content-group',
    icon: <FileTextOutlined />,
    label: '国学内容',
    children: [
      {
        key: '/admin/content/animation',
        icon: <VideoCameraOutlined />,
        label: '国学动漫',
      },
      {
        key: '/admin/content/drama',
        icon: <VideoCameraOutlined />,
        label: '真人短剧',
      },
      {
        key: '/admin/content/heritage',
        icon: <PictureOutlined />,
        label: '非遗内容',
      },
      {
        key: '/admin/content/audit',
        icon: <AuditOutlined />,
        label: '内容审核',
      },
      {
        key: '/admin/content/nft',
        icon: <ContainerOutlined />,
        label: '内容NFT',
      },
    ],
  },
  {
    key: 'user-group',
    icon: <TeamOutlined />,
    label: '用户运营',
    children: [
      {
        key: '/admin/users',
        icon: <UserOutlined />,
        label: '用户管理',
      },
      {
        key: '/admin/users/kyc',
        icon: <IdcardOutlined />,
        label: 'KYC审核',
      },
      {
        key: '/admin/users/levels',
        icon: <CheckCircleOutlined />,
        label: '等级管理',
      },
      {
        key: '/admin/users/invite',
        icon: <UsergroupAddOutlined />,
        label: '邀请关系',
      },
    ],
  },
  // ====== 福建老酒 / 369 业务（FJN 369 商品权益域）======
  // 29 个子页面按业务域拆成 5 个二级分组，避免单层菜单过长无法定位
  {
    key: 'fujian-group',
    icon: <GiftOutlined />,
    label: '福建老酒·369',
    children: [
      {
        key: 'fujian-core',
        icon: <AppstoreOutlined />,
        label: '核心业务',
        children: [
          { key: '/admin/fujian/identity', icon: <UserOutlined />, label: '369 用户身份' },
          { key: '/admin/fujian/products', icon: <AppstoreOutlined />, label: '369 商品管理' },
          { key: '/admin/fujian/orders', icon: <ShoppingCartOutlined />, label: '369 订单管理' },
          { key: '/admin/fujian/payment', icon: <CreditCardOutlined />, label: '369 支付管理' },
          { key: '/admin/fujian/channel', icon: <TeamOutlined />, label: '369 渠道中心' },
          { key: '/admin/fujian/profits', icon: <DollarOutlined />, label: '369 分润管理' },
          { key: '/admin/fujian/members', icon: <UsergroupAddOutlined />, label: '369 会员管理' },
        ],
      },
      {
        key: 'fujian-assets',
        icon: <GoldOutlined />,
        label: '释放与资产',
        children: [
          { key: '/admin/fujian/release-schedules', icon: <CalendarOutlined />, label: '369 释放计划' },
          { key: '/admin/fujian/release-claims', icon: <ReloadOutlined />, label: '369 释放领取' },
          { key: '/admin/fujian/release-batches', icon: <HourglassOutlined />, label: '369 释放批次' },
          { key: '/admin/fujian/points', icon: <GoldOutlined />, label: 'FJ369 积分（链下）' },
          { key: '/admin/fujian/tfj369', icon: <BlockOutlined />, label: 'tFJ369 代币（链上 SPL）' },
          { key: '/admin/fujian/winepass', icon: <PictureOutlined />, label: 'WinePass NFT 铸造' },
          { key: '/admin/fujian/eco-power', icon: <ThunderboltOutlined />, label: 'EcoPower 算力' },
        ],
      },
      {
        key: 'fujian-network',
        icon: <ClusterOutlined />,
        label: '团队与代理网络',
        children: [
          { key: '/admin/fujian/referral', icon: <ShareAltOutlined />, label: '369 推荐关系' },
          { key: '/admin/fujian/team', icon: <ClusterOutlined />, label: '369 团队管理' },
          { key: '/admin/fujian/node', icon: <ApartmentOutlined />, label: '369 节点管理' },
          { key: '/admin/fujian/region', icon: <CompassOutlined />, label: '369 区域代理' },
        ],
      },
      {
        key: 'fujian-compliance',
        icon: <SafetyOutlined />,
        label: '风控合规',
        children: [
          { key: '/admin/fujian/kyc', icon: <SafetyCertificateOutlined />, label: '369 KYC 审核' },
          { key: '/admin/fujian/device', icon: <ToolOutlined />, label: '369 设备管理' },
          { key: '/admin/fujian/permission', icon: <LockOutlined />, label: '369 权限管理' },
          { key: '/admin/fujian/approval', icon: <CheckCircleOutlined />, label: '369 审批中心' },
          { key: '/admin/fujian/audit', icon: <AuditOutlined />, label: '369 合规审计' },
          { key: '/admin/fujian/tax', icon: <BankOutlined />, label: '369 税务合规' },
          { key: '/admin/fujian/risk', icon: <SafetyOutlined />, label: '369 风控中心' },
        ],
      },
      {
        key: 'fujian-system',
        icon: <SettingOutlined />,
        label: '系统与服务',
        children: [
          { key: '/admin/fujian/reporting', icon: <PieChartOutlined />, label: '369 业务报表' },
          { key: '/admin/fujian/notification', icon: <BellOutlined />, label: '369 通知中心' },
          { key: '/admin/fujian/file', icon: <FileOutlined />, label: '369 文件服务' },
          { key: '/admin/fujian/dappx-mall', icon: <ShopOutlined />, label: 'DAppX Mall 商城' },
        ],
      },
    ],
  },
  {
    key: 'finance-group',
    icon: <DollarOutlined />,
    label: '财务中心',
    children: [
      {
        key: '/admin/finance/overview',
        icon: <BarChartOutlined />,
        label: '财务概览',
      },
      {
        key: '/admin/finance/revenue',
        icon: <AccountBookOutlined />,
        label: '收入统计',
      },
      {
        key: '/admin/finance/reconciliation',
        icon: <CheckCircleOutlined />,
        label: '对账管理',
      },
      {
        key: '/admin/finance/settlement',
        icon: <CreditCardOutlined />,
        label: '结算管理',
      },
    ],
  },
  {
    key: 'system-group',
    icon: <SettingOutlined />,
    label: '系统管理',
    children: [
      {
        key: '/admin/settings',
        icon: <SettingOutlined />,
        label: '系统设置',
      },
      {
        key: '/admin/settings/admins',
        icon: <UsergroupAddOutlined />,
        label: '管理员管理',
      },
      {
        key: '/admin/settings/roles',
        icon: <LockOutlined />,
        label: '权限管理',
      },
      {
        key: '/admin/audit-logs',
        icon: <HistoryOutlined />,
        label: '操作日志',
      },
      {
        key: '/admin/settings/server',
        icon: <CloudServerOutlined />,
        label: '服务器监控',
      },
    ],
  },
  // ====== v2.0 新增：第17组 企业服务 ======
  {
    key: 'enterprise-group',
    icon: <BankOutlined />,
    label: '企业服务',
    children: [
      {
        key: '/admin/enterprise/registration',
        icon: <FileTextOutlined />,
        label: '公司注册管理',
      },
      {
        key: '/admin/enterprise/spv',
        icon: <AccountBookOutlined />,
        label: 'SPV 公司管理',
      },
      {
        key: '/admin/enterprise/services',
        icon: <ToolOutlined />,
        label: '企业服务产品',
      },
      {
        key: '/admin/enterprise/customers',
        icon: <TeamOutlined />,
        label: '客户关系管理',
      },
      {
        key: '/admin/enterprise/compliance',
        icon: <SafetyCertificateOutlined />,
        label: '企业合规管理',
      },
    ],
  },
  // ====== v2.0 新增：第18组 代币发行服务 ======
  {
    key: 'token-issue-group',
    icon: <FundOutlined />,
    label: '代币发行服务',
    children: [
      {
        key: '/admin/token/projects',
        icon: <FolderOpenOutlined />,
        label: '发行项目管理',
      },
      {
        key: '/admin/token/design',
        icon: <ExperimentOutlined />,
        label: '代币经济设计',
      },
      {
        key: '/admin/token/deployment',
        icon: <CloudServerOutlined />,
        label: '代币部署管理',
      },
      {
        key: '/admin/token/listing',
        icon: <RiseOutlined />,
        label: '上币管理',
      },
      {
        key: '/admin/token/compliance',
        icon: <AuditOutlined />,
        label: '代币合规',
      },
    ],
  },
  // ====== v2.0 新增：第19组 上市通道服务 ======
  {
    key: 'listing-channel-group',
    icon: <TrophyOutlined />,
    label: '上市通道服务',
    children: [
      {
        key: '/admin/listing/samoa',
        icon: <GlobalOutlined />,
        label: '萨摩亚证券交易所',
      },
      {
        key: '/admin/listing/hk',
        icon: <BankOutlined />,
        label: '香港 HK1683',
      },
      {
        key: '/admin/listing/pipeline',
        icon: <SwapOutlined />,
        label: '上市项目管线',
      },
      {
        key: '/admin/listing/post-listing',
        icon: <HistoryOutlined />,
        label: '上市后服务',
      },
    ],
  },
  // ====== v2.0 新增：第20组 AIOPC 产业园 ======
  {
    key: 'aiopc-group',
    icon: <RobotOutlined />,
    label: 'AIOPC 产业园',
    children: [
      {
        key: '/admin/aiopc/park',
        icon: <HomeOutlined />,
        label: '产业园运营',
      },
      {
        key: '/admin/aiopc/members',
        icon: <UsergroupAddOutlined />,
        label: '入驻企业管理',
      },
      {
        key: '/admin/aiopc/tools',
        icon: <ToolOutlined />,
        label: 'AI 工具赋能',
      },
      {
        key: '/admin/aiopc/spv-link',
        icon: <LinkOutlined />,
        label: '海萨联动',
      },
      {
        key: '/admin/aiopc/global-replication',
        icon: <ApartmentOutlined />,
        label: '全球复制',
      },
    ],
  },
  // ====== v2.0 新增：第21组 全球直销体系 ======
  {
    key: 'direct-sales-group',
    icon: <NodeIndexOutlined />,
    label: '全球直销体系',
    children: [
      {
        key: '/admin/dsales/network',
        icon: <ApartmentOutlined />,
        label: '分销网络',
      },
      {
        key: '/admin/dsales/products',
        icon: <ShopOutlined />,
        label: '直销产品',
      },
      {
        key: '/admin/dsales/commission',
        icon: <DollarOutlined />,
        label: '佣金结算',
      },
      {
        key: '/admin/dsales/training',
        icon: <ReadOutlined />,
        label: '培训认证',
      },
      {
        key: '/admin/dsales/compliance',
        icon: <SafetyOutlined />,
        label: '直销合规',
      },
    ],
  },
  // ====== v2.0 新增：第22组 牌照与合规中心 ======
  {
    key: 'license-hub-group',
    icon: <SafetyCertificateOutlined />,
    label: '牌照与合规中心',
    children: [
      {
        key: '/admin/license/portfolio',
        icon: <IdcardOutlined />,
        label: '牌照资产管理',
      },
      {
        key: '/admin/license/jurisdictions',
        icon: <GlobalOutlined />,
        label: '多法域合规',
      },
      {
        key: '/admin/license/audit',
        icon: <AuditOutlined />,
        label: '内部审计',
      },
      {
        key: '/admin/license/governance',
        icon: <TeamOutlined />,
        label: '治理与风控',
      },
    ],
  },
  // ====== v3.0 新增：第23组 安全防御中心 ======
  {
    key: 'security-center-group',
    icon: <SecurityScanOutlined />,
    label: '安全防御中心',
    children: [
      {
        key: '/admin/security/overview',
        icon: <DashboardTwoTone />,
        label: '安全总览',
      },
      {
        key: '/admin/security/intrusion',
        icon: <AlertFilled />,
        label: '入侵检测',
      },
      {
        key: '/admin/security/firewall',
        icon: <FireOutlined />,
        label: '防火墙管理',
      },
      {
        key: '/admin/security/vulnerability',
        icon: <BugOutlined />,
        label: '漏洞扫描',
      },
      {
        key: '/admin/security/rbac',
        icon: <SafetyCertificateOutlined />,
        label: '访问控制(RBAC)',
      },
      {
        key: '/admin/security/audit',
        icon: <SearchOutlined />,
        label: '安全审计',
      },
      {
        key: '/admin/security/threat-intel',
        icon: <RadarChartOutlined />,
        label: '威胁情报',
      },
      {
        key: '/admin/security/incident-response',
        icon: <AimOutlined />,
        label: '应急响应',
      },
      {
        key: '/admin/security/encryption',
        icon: <KeyOutlined />,
        label: '数据加密',
      },
      {
        key: '/admin/security/policy',
        icon: <SafetyCertificateOutlined />,
        label: '安全策略',
      },
      {
        key: '/admin/security/waf',
        icon: <SafetyCertificateOutlined />,
        label: 'WAF防火墙',
      },
    ],
  },
  // ====== v3.0 新增：第24组 大屏指挥台 ======
  {
    key: 'command-center-group',
    icon: <DesktopOutlined />,
    label: '大屏指挥台',
    children: [
      {
        key: '/admin/command/global-overview',
        icon: <DashboardTwoTone />,
        label: '全局概览',
      },
      {
        key: '/admin/command/realtime-alerts',
        icon: <BellFilled />,
        label: '实时告警',
      },
      {
        key: '/admin/command/risk-map',
        icon: <EnvironmentOutlined />,
        label: '风险地图',
      },
      {
        key: '/admin/command/video-monitor',
        icon: <VideoCameraAddOutlined />,
        label: '视频监控',
      },
      {
        key: '/admin/command/emergency-command',
        icon: <AimOutlined />,
        label: '应急指挥',
      },
      {
        key: '/admin/command/trend-analysis',
        icon: <LineChartOutlined />,
        label: '趋势分析',
      },
      {
        key: '/admin/command/performance-board',
        icon: <FundOutlined />,
        label: '绩效看板',
      },
      {
        key: '/admin/command/heatmap',
        icon: <HeatMapOutlined />,
        label: '风险热力图',
      },
      {
        key: '/admin/command/demo',
        icon: <ProjectOutlined />,
        label: '可视化演示',
      },
    ],
  },
  // ====== v3.0 新增：第25组 AI分析中心 ======
  {
    key: 'ai-analysis-group',
    icon: <ExperimentFilled />,
    label: 'AI分析中心',
    children: [
      {
        key: '/admin/ai-center/risk-prediction',
        icon: <RadarChartOutlined />,
        label: '风险预测',
      },
      {
        key: '/admin/ai-center/hazard-detection',
        icon: <EyeOutlined />,
        label: '隐患识别',
      },
      {
        key: '/admin/ai-center/smart-decision',
        icon: <BulbOutlined />,
        label: '智能决策',
      },
      {
        key: '/admin/ai-center/model-management',
        icon: <DatabaseFilled />,
        label: '模型管理',
      },
      {
        key: '/admin/ai-center/config',
        icon: <SettingOutlined />,
        label: 'AI配置',
      },
      {
        key: '/admin/ai-center/knowledge-graph',
        icon: <ApartmentOutlined />,
        label: '知识图谱',
      },
      {
        key: '/admin/ai-center/voice-interaction',
        icon: <SoundOutlined />,
        label: '语音交互',
      },
    ],
  },
  // ====== v3.0 新增：第26组 区块链（存证链） ======
  {
    key: 'blockchain-hub-group',
    icon: <BlockOutlined />,
    label: '区块链',
    children: [
      {
        key: '/admin/blockchain/evidence-chain',
        icon: <DatabaseOutlined />,
        label: '存证链',
      },
      {
        key: '/admin/blockchain/smart-contract',
        icon: <FormOutlined />,
        label: '智能合约',
      },
      {
        key: '/admin/blockchain/explorer',
        icon: <SearchOutlined />,
        label: '链上浏览器',
      },
      {
        key: '/admin/blockchain/node-management',
        icon: <CloudServerOutlined />,
        label: '节点管理',
      },
    ],
  },
  // ====== v3.0 新增：第27组 OpenClaw智能体 ======
  {
    key: 'openclaw-group',
    icon: <RobotFilled />,
    label: 'OpenClaw智能体',
    children: [
      {
        key: '/admin/openclaw/orchestration',
        icon: <NodeCollapseOutlined />,
        label: '智能体编排',
      },
      {
        key: '/admin/openclaw/marketplace',
        icon: <ShopOutlined />,
        label: '智能体市场',
      },
      {
        key: '/admin/openclaw/training',
        icon: <ThunderboltFilled />,
        label: '训练微调',
      },
      {
        key: '/admin/openclaw/monitor-dashboard',
        icon: <DesktopOutlined />,
        label: '监控大屏',
      },
    ],
  },
  // ====== v3.0 新增：第28组 n8n工作流 ======
  {
    key: 'n8n-workflow-group',
    icon: <ApiFilled />,
    label: 'n8n工作流',
    children: [
      {
        key: '/admin/n8n/editor',
        icon: <FormOutlined />,
        label: '可视化编辑器',
      },
      {
        key: '/admin/n8n/triggers',
        icon: <PlayCircleOutlined />,
        label: '触发器管理',
      },
      {
        key: '/admin/n8n/history',
        icon: <HistoryOutlined />,
        label: '执行历史',
      },
      {
        key: '/admin/n8n/templates',
        icon: <CopyOutlined />,
        label: '模板市场',
      },
    ],
  },
  // ====== v3.0 新增：自动化协同工作中心（6大引擎统一入口）======
  {
    key: 'automation-hub-group',
    icon: <ApiOutlined />,
    label: '自动化协同',
    children: [
      {
        key: '/admin/automation-hub',
        icon: <NodeIndexOutlined />,
        label: '协同工作中心',
      },
    ],
  },
  // ====== v3.0 新增：第29组 AI大模型集成 ======
  {
    key: 'ai-llm-group',
    icon: <CloudDownloadOutlined />,
    label: 'AI大模型集成',
    children: [
      {
        key: '/admin/ai-llm/model-management',
        icon: <DatabaseFilled />,
        label: '模型管理',
      },
      {
        key: '/admin/ai-llm/intelligent-recognition',
        icon: <EyeOutlined />,
        label: '智能识别',
      },
      {
        key: '/admin/ai-llm/recommendation',
        icon: <SmileOutlined />,
        label: '智能推荐',
      },
      {
        key: '/admin/ai-llm/prompt-engineering',
        icon: <EditOutlined />,
        label: 'Prompt工程',
      },
      {
        key: '/admin/ai-llm/cost-analysis',
        icon: <DollarCircleOutlined />,
        label: '成本分析',
      },
    ],
  },
  // ====== v3.0 新增：第30组 BPM工作流引擎 ======
  {
    key: 'bpm-engine-group',
    icon: <BranchesOutlined />,
    label: 'BPM工作流引擎',
    children: [
      {
        key: '/admin/bpm/modeling',
        icon: <FormOutlined />,
        label: '流程建模',
      },
      {
        key: '/admin/bpm/runtime',
        icon: <PlayCircleOutlined />,
        label: '流程运行',
      },
      {
        key: '/admin/bpm/monitoring',
        icon: <MonitorOutlined />,
        label: '流程监控',
      },
      {
        key: '/admin/bpm/analysis',
        icon: <LineChartOutlined />,
        label: '流程分析',
      },
    ],
  },
  // ====== v3.0 新增：第31组 IoT设备接入 ======
  {
    key: 'iot-device-group',
    icon: <WifiOutlined />,
    label: 'IoT设备接入',
    children: [
      {
        key: '/admin/iot/device-access',
        icon: <UsbOutlined />,
        label: '设备接入',
      },
      {
        key: '/admin/iot/device-monitor',
        icon: <MonitorOutlined />,
        label: '设备监控',
      },
      {
        key: '/admin/iot/device-alert',
        icon: <BellFilled />,
        label: '设备告警',
      },
      {
        key: '/admin/iot/device-data',
        icon: <DatabaseFilled />,
        label: '设备数据',
      },
    ],
  },
  // ====== v3.0 新增：第32组 国际化 ======
  {
    key: 'i18n-group',
    icon: <TranslationOutlined />,
    label: '国际化',
    children: [
      {
        key: '/admin/i18n/language-pack',
        icon: <TranslationOutlined />,
        label: '语言包管理',
      },
      {
        key: '/admin/i18n/timezone',
        icon: <CompassOutlined />,
        label: '时区管理',
      },
      {
        key: '/admin/i18n/currency',
        icon: <DollarCircleOutlined />,
        label: '货币管理',
      },
      {
        key: '/admin/i18n/culture-adaptation',
        icon: <GlobalOutlined />,
        label: '文化适配',
      },
    ],
  },
  // ====== v3.0 新增：第33组 高级数据分析 ======
  {
    key: 'advanced-analytics-group',
    icon: <LineChartOutlined />,
    label: '高级数据分析',
    children: [
      {
        key: '/admin/analytics/prediction-model',
        icon: <FunctionOutlined />,
        label: '预测模型',
      },
      {
        key: '/admin/analytics/time-series',
        icon: <LineChartOutlined />,
        label: '时序分析',
      },
      {
        key: '/admin/analytics/association',
        icon: <ApartmentOutlined />,
        label: '关联分析',
      },
      {
        key: '/admin/analytics/anomaly-detection',
        icon: <FrownOutlined />,
        label: '异常检测',
      },
      {
        key: '/admin/analytics/bi-self-service',
        icon: <BarChartOutlined />,
        label: 'BI自助分析',
      },
    ],
  },
  // ====== 第34组 加密货币数据（多源聚合：CoinGecko/Binance/OKX/CMC/DefiLlama/Coinglass）======
  {
    key: 'crypto-data-group',
    icon: <ApiOutlined />,
    label: '加密货币数据',
    children: [
      { key: '/admin/crypto/dashboard', icon: <DashboardTwoTone />, label: '数据总览' },
      { key: '/admin/crypto/tickers', icon: <LineChartOutlined />, label: '行情榜单' },
      { key: '/admin/crypto/klines', icon: <BarChartOutlined />, label: 'K线分析' },
      { key: '/admin/crypto/depth', icon: <ContainerOutlined />, label: '订单簿深度' },
      { key: '/admin/crypto/trades', icon: <SwapOutlined />, label: '实时成交' },
      { key: '/admin/crypto/global', icon: <GlobalOutlined />, label: '全球指标' },
      { key: '/admin/crypto/defi', icon: <FundOutlined />, label: 'DeFi 协议' },
      { key: '/admin/crypto/fear-greed', icon: <ExperimentOutlined />, label: '情绪指数' },
      { key: '/admin/crypto/search', icon: <SearchOutlined />, label: '币种搜索' },
      { key: '/admin/crypto/convert', icon: <DollarOutlined />, label: '汇率换算' },
      { key: '/admin/crypto/trending', icon: <FireOutlined />, label: '热门趋势' },
      { key: '/admin/crypto/providers', icon: <CloudServerOutlined />, label: '数据源监控' },
    ],
  },
];

const getMenuItemKey = (item: MenuItem) => String(item?.key ?? '');

const isRouteKey = (key: string) => key.startsWith('/admin');

const findBestSelectedKey = (items: MenuItem[], pathname: string): string => {
  const routeKeys: string[] = [];

  const walk = (nodes: MenuItem[]) => {
    nodes.forEach((item) => {
      if (!item) return;
      const key = getMenuItemKey(item);
      if (isRouteKey(key)) {
        routeKeys.push(key);
      }
      if ('children' in item && Array.isArray(item.children)) {
        walk(item.children as MenuItem[]);
      }
    });
  };

  walk(items);

  return (
    routeKeys
      .filter((key) => pathname === key || pathname.startsWith(`${key}/`))
      .sort((left, right) => right.length - left.length)[0] || pathname
  );
};

const findAncestorKeys = (
  items: MenuItem[],
  targetKey: string,
  parents: string[] = []
): string[] | null => {
  for (const item of items) {
    if (!item) continue;

    const key = getMenuItemKey(item);
    if (key === targetKey) {
      return parents;
    }

    if ('children' in item && Array.isArray(item.children)) {
      const match = findAncestorKeys(item.children as MenuItem[], targetKey, [...parents, key]);
      if (match) {
        return match;
      }
    }
  }

  return null;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const insideAdminLayout = useContext(AdminLayoutContext);
  const [collapsed, setCollapsed] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // 开发模式：暂时跳过认证检查，直接展示后台（生产环境需恢复）
  // useEffect(() => {
  //   if (!isAuthenticated && pathname !== '/admin/login') {
  //     window.location.href = `/admin/login?redirect=${encodeURIComponent(pathname)}`;
  //   }
  // }, [isAuthenticated, pathname]);

  // 使用 useCallback 防止每次渲染重建函数导致 Menu 重渲染
  const handleMenuClick = useCallback(({ key }: { key: string }) => {
    if (!isRouteKey(key)) {
      return;
    }

    setPendingPath(key);
    router.push(key);
  }, [router]);

  useEffect(() => {
    if (pendingPath === pathname) {
      setPendingPath(null);
    }
  }, [pendingPath, pathname]);

  // 缓存 menuItems 引用，防止每次 AdminLayout 实例化时 Menu 因引用不同而重渲染
  const memoMenuItems = useMemo(() => menuItems, []);

  const activeMenuKey = useMemo(
    () => findBestSelectedKey(memoMenuItems, pendingPath || pathname),
    [memoMenuItems, pathname, pendingPath]
  );

  const activeOpenKeys = useMemo(
    () => findAncestorKeys(memoMenuItems, activeMenuKey) ?? [],
    [activeMenuKey, memoMenuItems]
  );

  const [openKeys, setOpenKeys] = useState<string[]>(activeOpenKeys);

  useEffect(() => {
    setOpenKeys(activeOpenKeys);
  }, [activeOpenKeys]);

  // 缓存 selectedKeys 避免数组引用变化触发 Menu 不必要的重渲染
  const selectedKeys = useMemo(() => [activeMenuKey], [activeMenuKey]);

  const userMenuItems = [
    {
      key: 'profile',
      label: '个人资料',
      icon: <UserOutlined />,
    },
  ];

  if (insideAdminLayout) {
    return <>{children}</>;
  }

  return (
    <AdminLayoutContext.Provider value={true}>
    <ConfigProvider
      theme={{
        // === 后台主题（按文档第7章：浅色金融风控 + 深色侧边栏） ===
        algorithm: theme.defaultAlgorithm,  // 后台使用浅色算法
        token: {
          // 主品牌色 - 电光蓝
          colorPrimary: '#1677FF',
          // 成功色
          colorSuccess: '#16A34A',
          // 错误色
          colorError: '#DC2626',
          // 警告色
          colorWarning: '#F59E0B',
          // 信息色
          colorInfo: '#1677FF',
          // 文字
          colorText: '#111827',
          colorTextSecondary: '#6B7280',
          // 背景 - 后台浅色
          colorBgLayout: '#F5F7FA',
          colorBgContainer: '#FFFFFF',
          colorBgElevated: '#FFFFFF',
          // 边框
          colorBorder: '#E5E7EB',
          colorBorderSecondary: '#F3F4F6',
          // 圆角
          borderRadius: 8,
          borderRadiusLG: 12,
        },
        components: {
          Layout: {
            headerBg: '#FFFFFF',
            siderBg: '#FFFFFF',
            bodyBg: '#F5F7FA',
            triggerBg: '#F3F4F6',
          },
          Menu: {
            // 后台菜单：2026-07-10 改造为亮色（white/浅灰）
            itemBg: '#FFFFFF',
            subMenuItemBg: '#FAFBFC',
            itemSelectedBg: '#E6F4FF',
            itemSelectedColor: '#1677FF',
            itemHoverBg: '#F3F4F6',
            itemColor: '#0F172A',
            itemHoverColor: '#1677FF',
            horizontalItemSelectedColor: '#1677FF',
          },
          Table: {
            headerBg: '#F9FAFB',
            headerColor: '#111827',
            rowHoverBg: '#F9FAFB',
            borderColor: '#E5E7EB',
          },
          Button: {
            colorPrimary: '#1677FF',
            colorPrimaryHover: '#4096FF',
            colorPrimaryActive: '#0958D9',
          },
          Tag: {
            defaultBg: '#F3F4F6',
            defaultColor: '#1F2937',
          },
          Card: {
            colorBgContainer: '#FFFFFF',
            headerBg: '#F9FAFB',
          },
        },
      }}
    >
      <div className="light-theme" style={{ minHeight: '100vh', background: '#F5F7FA' }}>
      <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="admin-layout-sider"
        width={240}
        style={{
          background: '#FFFFFF',
          flex: collapsed ? '0 0 80px' : '0 0 240px',
          minWidth: collapsed ? 80 : 240,
          maxWidth: collapsed ? 80 : 240,
          willChange: 'transform',
          transform: 'translateZ(0)',
          overflow: 'hidden',
          position: 'sticky',
          top: 0,
          height: '100vh',
          boxShadow: '2px 0 8px rgba(15, 23, 42, 0.06)',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          {collapsed ? (
            <div style={{ color: '#1677FF', fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>ZS</div>
          ) : (
            <div style={{ color: '#0F172A', fontSize: 18, fontWeight: 700 }}>中萨数字科技交易所</div>
          )}
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={selectedKeys}
          openKeys={collapsed ? [] : openKeys}
          items={memoMenuItems}
          onClick={handleMenuClick}
          onOpenChange={(keys) => setOpenKeys(keys as string[])}
          style={{
            background: '#FFFFFF',
            borderRight: 0,
            height: 'calc(100vh - 64px)',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        />
      </Sider>
      <Layout
        style={{
          background: '#F5F7FA',
          minHeight: '100vh',
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <Header
          style={{
            padding: '0 24px',
            background: '#FFFFFF',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minWidth: 0,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ color: '#111827' }}
          />
          <Space>
            <Dropdown menu={{ items: userMenuItems }}>
              <Space className="cursor-pointer">
                <Avatar size="small" icon={<UserOutlined />} style={{ background: '#1677FF' }} />
                <span style={{ color: '#111827' }}>{user?.username || '管理员'}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          className="admin-content-wrapper"
          style={{
            margin: 24,
            padding: 24,
            minHeight: 'calc(100vh - 64px - 48px)',
            minWidth: 0,
            overflow: 'auto',
            background: 'transparent',
            transition: 'opacity 0.15s ease',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
    </div>
    </ConfigProvider>
    </AdminLayoutContext.Provider>
  );
}
