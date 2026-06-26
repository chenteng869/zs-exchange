'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import {
  Button,
  Space,
  Tag,
  Modal,
  message,
  Descriptions,
  Select,
  Table,
  Card,
  Progress,
  Tooltip,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  PauseCircleOutlined,
  SettingOutlined,
  TeamOutlined,
  CrownOutlined,
  UserOutlined,
  DollarOutlined,
  GlobalOutlined,
  StarOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

const { Option } = Select;

interface DistributionPartner {
  id: string;
  partnerName: string;
  partnerType: 'ib' | 'kol' | 'institution' | 'white_label';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  region: string;
  contactPerson: string;
  email: string;
  phone: string;
  commissionRate: number;
  totalClients: number;
  totalVolume: number;
  activeProducts: number;
  status: 'pending' | 'active' | 'suspended' | 'terminated';
  joinDate: string;
  lastActivity: string;
  performanceScore: number;
}

const mockPartners: DistributionPartner[] = [
  {
    id: '1',
    partnerName: 'Alpha Capital Partners',
    partnerType: 'institution',
    tier: 'platinum',
    region: '新加坡',
    contactPerson: 'David Chen',
    email: 'david@alphacap.sg',
    phone: '+65-9123-4567',
    commissionRate: 25,
    totalClients: 1250,
    totalVolume: 45000000,
    activeProducts: 8,
    status: 'active',
    joinDate: '2023-06-15',
    lastActivity: '2024-06-23',
    performanceScore: 96,
  },
  {
    id: '2',
    partnerName: 'CryptoKOL 小明',
    partnerType: 'kol',
    tier: 'gold',
    region: '中国·上海',
    contactPerson: '小明',
    email: 'xiaoming@crypto.com',
    phone: '+86-138-0000-1111',
    commissionRate: 30,
    totalClients: 8900,
    totalVolume: 28000000,
    activeProducts: 5,
    status: 'active',
    joinDate: '2023-09-01',
    lastActivity: '2024-06-22',
    performanceScore: 91,
  },
  {
    id: '3',
    partnerName: 'TradeFlow IB Services',
    partnerType: 'ib',
    tier: 'gold',
    region: '英国·伦敦',
    contactPerson: 'Sarah Johnson',
    email: 'sarah@tradeflow.uk',
    phone: '+44-7911-123456',
    commissionRate: 20,
    totalClients: 3400,
    totalVolume: 32000000,
    activeProducts: 6,
    status: 'active',
    joinDate: '2023-08-20',
    lastActivity: '2024-06-23',
    performanceScore: 88,
  },
  {
    id: '4',
    partnerName: 'QuantEdge 白标方案',
    partnerType: 'white_label',
    tier: 'platinum',
    region: '美国·纽约',
    contactPerson: 'Michael Ross',
    email: 'michael@quantedge.us',
    phone: '+1-212-555-0100',
    commissionRate: 15,
    totalClients: 560,
    totalVolume: 68000000,
    activeProducts: 10,
    status: 'active',
    joinDate: '2023-03-10',
    lastActivity: '2024-06-23',
    performanceScore: 94,
  },
  {
    id: '5',
    partnerName: '东南亚交易联盟',
    partnerType: 'institution',
    tier: 'silver',
    region: '马来西亚·吉隆坡',
    contactPerson: 'Ahmad Razak',
    email: 'ahmad@sea-trade.my',
    phone: '+60-12-345-6789',
    commissionRate: 22,
    totalClients: 2100,
    totalVolume: 15000000,
    activeProducts: 4,
    status: 'active',
    joinDate: '2023-11-15',
    lastActivity: '2024-06-21',
    performanceScore: 79,
  },
  {
    id: '6',
    partnerName: 'DeFi达人老王',
    partnerType: 'kol',
    tier: 'silver',
    region: '中国·北京',
    contactPerson: '王建国',
    email: 'laowang@defi.cn',
    phone: '+86-139-0000-2222',
    commissionRate: 28,
    totalClients: 5200,
    totalVolume: 12000000,
    activeProducts: 3,
    status: 'suspended',
    joinDate: '2024-01-05',
    lastActivity: '2024-05-15',
    performanceScore: 65,
  },
  {
    id: '7',
    partnerName: 'EuroTrade IB Network',
    partnerType: 'ib',
    tier: 'bronze',
    region: '德国·法兰克福',
    contactPerson: 'Hans Mueller',
    email: 'hans@eurotrade.de',
    phone: '+49-170-123-4567',
    commissionRate: 18,
    totalClients: 450,
    totalVolume: 3500000,
    activeProducts: 2,
    status: 'pending',
    joinDate: '2024-04-01',
    lastActivity: '2024-06-20',
    performanceScore: 58,
  },
  {
    id: '8',
    partnerName: '中东财富管理集团',
    partnerType: 'institution',
    tier: 'gold',
    region: '阿联酋·迪拜',
    contactPerson: 'Omar Al-Rashid',
    email: 'omar@mwm.ae',
    phone: '+971-50-123-4567',
    commissionRate: 24,
    totalClients: 890,
    totalVolume: 42000000,
    activeProducts: 7,
    status: 'active',
    joinDate: '2023-07-22',
    lastActivity: '2024-06-23',
    performanceScore: 89,
  },
  {
    id: '9',
    partnerName: '日本加密货币协会',
    partnerType: 'institution',
    tier: 'silver',
    region: '日本·东京',
    contactPerson: 'Tanaka Yuki',
    email: 'tanaka@crypto-jp.jp',
    phone: '+81-90-1234-5678',
    commissionRate: 20,
    totalClients: 1680,
    totalVolume: 18500000,
    activeProducts: 5,
    status: 'active',
    joinDate: '2023-12-10',
    lastActivity: '2024-06-22',
    performanceScore: 82,
  },
  {
    id: '10',
    partnerName: '韩国区块链联盟',
    partnerType: 'white_label',
    tier: 'bronze',
    region: '韩国·首尔',
    contactPerson: 'Kim Min-jun',
    email: 'kim@kr-blockchain.kr',
    phone: '+82-10-1234-5678',
    commissionRate: 16,
    totalClients: 230,
    totalVolume: 5200000,
    activeProducts: 3,
    status: 'terminated',
    joinDate: '2024-02-14',
    lastActivity: '2024-04-30',
    performanceScore: 42,
  },
];

export default function DistributionNetworkPage() {
  const [selectedPartner, setSelectedPartner] = useState<DistributionPartner | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('');
  const [filterTier, setFilterTier] = useState<string>('');
  const [filterRegion, setFilterRegion] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const filteredPartners = mockPartners.filter((partner) => {
    if (filterType && partner.partnerType !== filterType) return false;
    if (filterTier && partner.tier !== filterTier) return false;
    if (filterRegion && !partner.region.includes(filterRegion)) return false;
    if (filterStatus && partner.status !== filterStatus) return false;
    return true;
  });

  const totalPartners = mockPartners.length;
  const activePartners = mockPartners.filter((p) => p.status === 'active').length;
  const goldPlusPartners = mockPartners.filter(
    (p) => p.tier === 'gold' || p.tier === 'platinum'
  ).length;
  const totalClients = mockPartners.reduce((sum, p) => sum + p.totalClients, 0);
  const totalCommission = mockPartners.reduce(
    (sum, p) => sum + p.totalVolume * (p.commissionRate / 100),
    0
  );

  const typeConfig: Record<string, { label: string; color: string }> = {
    ib: { label: 'IB经纪', color: 'blue' },
    kol: { label: 'KOL', color: 'orange' },
    institution: { label: '机构', color: 'purple' },
    white_label: { label: '白标', color: 'cyan' },
  };

  const tierConfig: Record<string, { label: string; color: string; icon: string }> = {
    bronze: { label: '铜牌', color: '#CD7F32', icon: '🥉' },
    silver: { label: '银牌', color: '#C0C0C0', icon: '🥈' },
    gold: { label: '金牌', color: '#FFD700', icon: '🥇' },
    platinum: { label: '铂金', color: '#E5E4E2', icon: '💎' },
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: '待审核', color: 'default' },
    active: { label: '活跃', color: 'success' },
    suspended: { label: '已暂停', color: 'warning' },
    terminated: { label: '已终止', color: 'error' },
  };

  const columns = [
    {
      title: '伙伴名称',
      dataIndex: 'partnerName',
      key: 'partnerName',
      render: (text: string) => <span className="font-semibold text-blue-600">{text}</span>,
    },
    {
      title: '类型',
      dataIndex: 'partnerType',
      key: 'partnerType',
      render: (type: string) => (
        <Tag color={typeConfig[type]?.color}>{typeConfig[type]?.label}</Tag>
      ),
    },
    {
      title: '等级',
      dataIndex: 'tier',
      key: 'tier',
      render: (tier: string) => (
        <Tag
          style={{
            color: tierConfig[tier]?.color,
            borderColor: tierConfig[tier]?.color,
            fontWeight: 600,
          }}
        >
          {tierConfig[tier]?.icon} {tierConfig[tier]?.label}
        </Tag>
      ),
    },
    {
      title: '区域',
      dataIndex: 'region',
      key: 'region',
    },
    {
      title: '联系人',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (text: string) => (
        <span className="text-xs">{text}</span>
      ),
    },
    {
      title: '佣金率',
      dataIndex: 'commissionRate',
      key: 'commissionRate',
      render: (val: number) => <span className="font-semibold text-green-600">{val}%</span>,
    },
    {
      title: '客户数',
      dataIndex: 'totalClients',
      key: 'totalClients',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '交易量',
      dataIndex: 'totalVolume',
      key: 'totalVolume',
      render: (val: number) => `$${(val / 1000000).toFixed(1)}M`,
    },
    {
      title: '活跃产品',
      dataIndex: 'activeProducts',
      key: 'activeProducts',
      render: (val: number) => <Tag color="blue">{val}个</Tag>,
    },
    {
      title: '绩效分',
      dataIndex: 'performanceScore',
      key: 'performanceScore',
      render: (val: number) => (
        <Tooltip title={`绩效评分: ${val}/100`}>
          <Progress
            percent={val}
            size="small"
            style={{ width: 80 }}
            strokeColor={val >= 85 ? '#52c41a' : val >= 70 ? '#faad14' : '#ff4d4f'}
          />
        </Tooltip>
      ),
    },
    {
      title: '加入日期',
      dataIndex: 'joinDate',
      key: 'joinDate',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD'),
    },
    {
      title: '最后活跃',
      dataIndex: 'lastActivity',
      key: 'lastActivity',
      render: (val: string) => dayjs(val).format('MM-DD'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusConfig[status]?.color}>{statusConfig[status]?.label}</Tag>
      ),
    },
  ];

  const actions: any[] = [
    {
      key: 'view',
      label: '详情',
      icon: <EyeOutlined />,
      onClick: (record: DistributionPartner) => {
        setSelectedPartner(record);
        setDetailModalOpen(true);
      },
    },
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      onClick: (record: DistributionPartner) => {
        message.info(`编辑伙伴: ${record.partnerName}`);
      },
    },
    {
      key: 'suspend',
      label: (_: any, record: DistributionPartner) =>
        record.status === 'active' ? '暂停' : '恢复',
      icon: <PauseCircleOutlined />,
      hidden: () => false,
      onClick: (record: DistributionPartner) => {
        message.success(
          `伙伴 ${record.partnerName} 已${record.status === 'active' ? '暂停' : '恢复'}`
        );
      },
    },
    {
      key: 'commission',
      label: '佣金设置',
      icon: <SettingOutlined />,
      onClick: (record: DistributionPartner) => {
        message.info(`设置佣金: ${record.partnerName} - 当前${record.commissionRate}%`);
      },
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold m-0 flex items-center gap-3">
              <GlobalOutlined style={{ color: '#F0B90B' }} />
              分销网络管理
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              全球分销伙伴网络 · IB/KOL/机构渠道/白标合作 · AIOPC伙伴匹配
            </p>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => message.success('数据已刷新')}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />}>
              邀请伙伴
            </Button>
          </Space>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <DataCard
            title="合作伙伴总数"
            value={totalPartners}
            icon={<TeamOutlined />}
            color="#1677FF"
            description="全球分销网络"
          />
          <DataCard
            title="活跃伙伴"
            value={activePartners}
            icon={<CrownOutlined />}
            color="#16A34A"
            suffix={`/${totalPartners}`}
            description="正常运营中"
          />
          <DataCard
            title="金牌以上"
            value={goldPlusPartners}
            icon={<StarOutlined />}
            color="#F0B90B"
            description="高价值伙伴"
          />
          <DataCard
            title="总客户数"
            value={totalClients.toLocaleString()}
            icon={<UserOutlined />}
            color="#7C3AED"
            description="全网络累计"
          />
          <DataCard
            title="佣金支出预估"
            value={`${(totalCommission / 1000000).toFixed(1)}M`}
            prefix="$"
            icon={<DollarOutlined />}
            color="#F59E0B"
            description="本月应发佣金"
          />
        </div>

        {/* 筛选区域 */}
        <Card size="small">
          <Space wrap>
            <Select
              placeholder="伙伴类型"
              style={{ width: 140 }}
              allowClear
              value={filterType || undefined}
              onChange={setFilterType}
            >
              <Option value="ib">IB经纪</Option>
              <Option value="kol">KOL</Option>
              <Option value="institution">机构</Option>
              <Option value="white_label">白标</Option>
            </Select>
            <Select
              placeholder="等级"
              style={{ width: 120 }}
              allowClear
              value={filterTier || undefined}
              onChange={setFilterTier}
            >
              <Option value="bronze">铜牌</Option>
              <Option value="silver">银牌</Option>
              <Option value="gold">金牌</Option>
              <Option value="platinum">铂金</Option>
            </Select>
            <Select
              placeholder="区域"
              style={{ width: 150 }}
              allowClear
              value={filterRegion || undefined}
              onChange={setFilterRegion}
            >
              <Option value="中国">中国</Option>
              <Option value="新加坡">新加坡</Option>
              <Option value="美国">美国</Option>
              <Option value="英国">英国</Option>
              <Option value="阿联酋">中东</Option>
              <Option value="日本">日本</Option>
              <Option value="韩国">韩国</Option>
              <Option value="马来西亚">东南亚</Option>
              <Option value="德国">欧洲</Option>
            </Select>
            <Select
              placeholder="状态"
              style={{ width: 120 }}
              allowClear
              value={filterStatus || undefined}
              onChange={setFilterStatus}
            >
              <Option value="pending">待审核</Option>
              <Option value="active">活跃</Option>
              <Option value="suspended">已暂停</Option>
              <Option value="terminated">已终止</Option>
            </Select>
          </Space>
        </Card>

        {/* 数据表格 */}
        <DataTable
          columns={columns as any}
          dataSource={filteredPartners as any}
          rowKey="id"
          actions={actions}
          showSearch={false}
          showAdd={false}
        />

        {/* 详情弹窗 */}
        <Modal
          title={
            <span>
              伙伴详情 - <span style={{ color: '#F0B90B' }}>{selectedPartner?.partnerName}</span>
            </span>
          }
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalOpen(false)}>
              关闭
            </Button>,
            <Button key="edit" type="primary" icon={<EditOutlined />}>
              编辑信息
            </Button>,
          ]}
          width={900}
        >
          {selectedPartner && (
            <div className="space-y-6">
              {/* 伙伴基本信息 */}
              <Divider orientation="left">伙伴信息</Divider>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="伙伴名称">{selectedPartner.partnerName}</Descriptions.Item>
                <Descriptions.Item label="伙伴ID">
                  <code className="font-mono text-xs">PTN-{selectedPartner.id}</code>
                </Descriptions.Item>
                <Descriptions.Item label="伙伴类型">
                  <Tag color={typeConfig[selectedPartner.partnerType]?.color}>
                    {typeConfig[selectedPartner.partnerType]?.label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="等级">
                  <Tag
                    style={{
                      color: tierConfig[selectedPartner.tier]?.color,
                      borderColor: tierConfig[selectedPartner.tier]?.color,
                      fontWeight: 600,
                    }}
                  >
                    {tierConfig[selectedPartner.tier]?.icon} {tierConfig[selectedPartner.tier]?.label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="区域">{selectedPartner.region}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={statusConfig[selectedPartner.status]?.color}>
                    {statusConfig[selectedPartner.status]?.label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="联系人">{selectedPartner.contactPerson}</Descriptions.Item>
                <Descriptions.Item label="邮箱">{selectedPartner.email}</Descriptions.Item>
                <Descriptions.Item label="电话">{selectedPartner.phone}</Descriptions.Item>
                <Descriptions.Item label="加入日期">
                  {dayjs(selectedPartner.joinDate).format('YYYY-MM-DD')}
                </Descriptions.Item>
              </Descriptions>

              {/* 业绩数据 */}
              <Divider orientation="left">业绩数据</Divider>
              <Descriptions column={3} bordered size="small">
                <Descriptions.Item label="总客户数">
                  {selectedPartner.totalClients.toLocaleString()}人
                </Descriptions.Item>
                <Descriptions.Item label="总交易量">
                  ${(selectedPartner.totalVolume / 1000000).toFixed(2)}M
                </Descriptions.Item>
                <Descriptions.Item label="活跃产品">
                  {selectedPartner.activeProducts}个
                </Descriptions.Item>
                <Descriptions.Item label="佣金率">
                  <span className="text-green-600 font-bold text-lg">
                    {selectedPartner.commissionRate}%
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="预估月佣金">
                  $
                  {(selectedPartner.totalVolume * (selectedPartner.commissionRate / 100) / 12).toFixed(0)}
                </Descriptions.Item>
                <Descriptions.Item label="最后活跃">
                  {dayjs(selectedPartner.lastActivity).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
              </Descriptions>

              {/* 佣金结构 */}
              <Divider orientation="left">佣金结构</Divider>
              <Card size="small">
                <Space direction="vertical" className="w-full" size="middle">
                  <div className="flex justify-between">
                    <span>基础佣金率</span>
                    <span className="font-bold text-lg">{selectedPartner.commissionRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>阶梯奖励(超$10M部分)</span>
                    <span className="text-green-600">+{Math.round(selectedPartner.commissionRate * 0.2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>季度达标奖金</span>
                    <span>$5,000 - $25,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>推荐新伙伴奖励</span>
                    <span>首月佣金的10%</span>
                  </div>
                </Space>
              </Card>

              {/* AIOPC伙伴价值评估 */}
              <Divider orientation="left">
                <StarOutlined style={{ color: '#F0B90B' }} /> AIOPC伙伴价值评估
              </Divider>
              <Card
                style={{
                  background: 'linear-gradient(135deg, #FFF9E6 0%, #FFFDF5 100%)',
                  borderColor: '#F0B90B',
                }}
                size="small"
              >
                <div className="mb-3">
                  <span className="text-lg font-bold" style={{ color: '#F0B90B' }}>
                    综合价值评分: {selectedPartner.performanceScore}/100
                  </span>
                </div>
                <Space direction="vertical" className="w-full" size="middle">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">客户质量指数</span>
                      <span className="text-sm font-semibold">
                        {Math.min(95, selectedPartner.performanceScore + 5)}%
                      </span>
                    </div>
                    <Progress
                      percent={Math.min(95, selectedPartner.performanceScore + 5)}
                      strokeColor="#1677FF"
                      showInfo={false}
                      size="small"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">交易活跃度</span>
                      <span className="text-sm font-semibold">
                        {Math.min(92, selectedPartner.performanceScore)}%
                      </span>
                    </div>
                    <Progress
                      percent={Math.min(92, selectedPartner.performanceScore)}
                      strokeColor="#16A34A"
                      showInfo={false}
                      size="small"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">合规性评分</span>
                      <span className="text-sm font-semibold">
                        {Math.min(98, selectedPartner.performanceScore + 8)}%
                      </span>
                    </div>
                    <Progress
                      percent={Math.min(98, selectedPartner.performanceScore + 8)}
                      strokeColor="#7C3AED"
                      showInfo={false}
                      size="small"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">增长潜力</span>
                      <span className="text-sm font-semibold">
                        {Math.max(60, selectedPartner.performanceScore - 10)}%
                      </span>
                    </div>
                    <Progress
                      percent={Math.max(60, selectedPartner.performanceScore - 10)}
                      strokeColor="#F0B90B"
                      showInfo={false}
                      size="small"
                    />
                  </div>
                </Space>
              </Card>

              {/* 客户列表 */}
              <Divider orientation="left">近期客户列表</Divider>
              <Table
                size="small"
                pagination={false}
                dataSource={[
                  { id: 'C001', name: '张三', amount: '$50,000', date: '2024-06-20', product: 'Alpha动量信号V3' },
                  { id: 'C002', name: '李四', amount: '$120,000', date: '2024-06-18', product: '量化套利基金Pro' },
                  { id: 'C003', name: 'John Smith', amount: '$25,000', date: '2024-06-15', product: '趋势跟踪基础版' },
                  { id: 'C004', name: '王五', amount: '$200,000', date: '2024-06-12', product: 'AI智能投顾账户' },
                ]}
                columns={[
                  { title: '客户ID', dataIndex: 'id', key: 'id', width: 80 },
                  { title: '客户名', dataIndex: 'name', key: 'name' },
                  { title: '投资金额', dataIndex: 'amount', key: 'amount' },
                  { title: '投资产品', dataIndex: 'product', key: 'product' },
                  { title: '日期', dataIndex: 'date', key: 'date', width: 100 },
                ]}
                rowKey="id"
              />

              {/* 交互日志 */}
              <Divider orientation="left">交互日志</Divider>
              <Table
                size="small"
                pagination={false}
                dataSource={[
                  { time: '2024-06-23 09:15', event: '登录系统', detail: 'IP: 203.0.113.50' },
                  { time: '2024-06-22 16:30', event: '查看佣金报表', detail: '下载Q2报表' },
                  { time: '2024-06-21 11:00', event: '新增客户', detail: '客户ID: C004' },
                  { time: '2024-06-20 14:20', event: '提交推广素材', detail: '审核通过' },
                ]}
                columns={[
                  { title: '时间', dataIndex: 'time', key: 'time', width: 160 },
                  { title: '事件', dataIndex: 'event', key: 'event', width: 120 },
                  { title: '详情', dataIndex: 'detail', key: 'detail' },
                ]}
                rowKey="time"
              />
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
