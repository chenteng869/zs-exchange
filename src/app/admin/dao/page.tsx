'use client';

import { useState } from 'react';
import {
  Card,
  Tag,
  Progress,
  Badge,
  Button,
  Space,
  Avatar,
  Row,
  Col,
  Typography,
} from 'antd';
import {
  BranchesOutlined,
  FileTextOutlined,
  TeamOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  FireOutlined,
  CrownOutlined,
  ApiOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Text } = Typography;

interface DaoProposal {
  id: string;
  daoName: string;
  title: string;
  type: string;
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  deadline: string;
  status: string;
  proposer: string;
}

const mockProposals: DaoProposal[] = [
  { id: 'PR-2024001', daoName: 'GXT DAO', title: '调整交易手续费率至 0.08%', type: 'fee', votesFor: 15800000, votesAgainst: 3200000, totalVotes: 19000000, deadline: '2024-06-25 18:00', status: 'active', proposer: '0x742d...a8F2' },
  { id: 'PR-2024002', daoName: 'GXT DAO', title: '上线 GXT/USDT 永续合约产品线', type: 'listing', votesFor: 22500000, votesAgainst: 1800000, totalVotes: 24300000, deadline: '2024-06-18 12:00', status: 'passed', proposer: '0x8B5c...91dE' },
  { id: 'PR-2024003', daoName: 'DeFi Alliance', title: '回购销毁 500万 GXT 代币', type: 'buyback', votesFor: 18200000, votesAgainst: 2800000, totalVotes: 21000000, deadline: '2024-06-28 09:00', status: 'active', proposer: '0x3F2a...B7c1' },
  { id: 'PR-2024004', daoName: 'GXT DAO', title: '增加保险池规模至 $500M', type: 'treasury', votesFor: 19800000, votesAgainst: 2200000, totalVotes: 22000000, deadline: '2024-06-15 20:00', status: 'passed', proposer: '0x9c8E...42fA' },
  { id: 'PR-2024005', daoName: 'Safety Council', title: '集成 Nansen 链上情报模块', type: 'integration', votesFor: 8200000, votesAgainst: 12500000, totalVotes: 20700000, deadline: '2024-06-10 15:00', status: 'failed', proposer: '0x6a1D...E5b8' },
  { id: 'PR-2024006', daoName: 'DeFi Alliance', title: '新增 SOL/USDT 流动性挖矿池', type: 'mining', votesFor: 15200000, votesAgainst: 4500000, totalVotes: 19700000, deadline: '2024-06-22 14:00', status: 'active', proposer: '0xF1a2...C9d3' },
  { id: 'PR-2024007', daoName: 'GXT DAO', title: 'DAO 国库多签钱包升级至 v2', type: 'governance', votesFor: 28500000, votesAgainst: 1200000, totalVotes: 29700000, deadline: '2024-06-08 16:00', status: 'executed', proposer: '0xB3b4...D8e5' },
  { id: 'PR-2024008', daoName: 'Safety Council', title: '紧急暂停某异常合约交互权限', type: 'emergency', votesFor: 31000000, votesAgainst: 500000, totalVotes: 31500000, deadline: '2024-06-05 10:00', status: 'executed', proposer: '0xC5c6...E0f7' },
  { id: 'PR-2024009', daoName: 'DeFi Alliance', title: '调整质押年化收益率至 8%-15%', type: 'staking', votesFor: 12800000, votesAgainst: 6800000, totalVotes: 19600000, deadline: '2024-06-30 11:00', status: 'active', proposer: '0xD7d8...F1a9' },
  { id: 'PR-2024010', daoName: 'GXT DAO', title: '社区基金预算分配 Q3 季度计划', type: 'budget', votesFor: 16500000, votesAgainst: 5200000, totalVotes: 21700000, deadline: '2024-06-27 17:00', status: 'active', proposer: '0xE9eA...B2cb' },
  { id: 'PR-2024011', daoName: 'Safety Council', title: '跨链桥安全审计报告公示及修复方案', type: 'security', votesFor: 24800000, votesAgainst: 1800000, totalVotes: 26600000, deadline: '2024-06-12 13:00', status: 'passed', proposer: '0xFbFc...C3dd' },
  { id: 'PR-2024012', daoName: 'DeFi Alliance', title: 'NFT 市场手续费分成比例调整', type: 'revenue', votesFor: 11200000, votesAgainst: 8500000, totalVotes: 19700000, deadline: '2024-07-01 09:00', status: 'active', proposer: '0x1d2e...D4e5' },
];

const proposalTypeMap: Record<string, { color: string; label: string }> = {
  fee: { color: 'orange', label: '费率调整' },
  listing: { color: 'green', label: '产品上线' },
  buyback: { color: 'red', label: '回购销毁' },
  treasury: { color: 'blue', label: '国库管理' },
  integration: { color: 'purple', label: '系统集成' },
  mining: { color: 'cyan', label: '挖矿激励' },
  governance: { color: 'geekblue', label: '治理规则' },
  emergency: { color: 'magenta', label: '紧急提案' },
  staking: { color: 'gold', label: '质押参数' },
  budget: { color: 'lime', label: '预算分配' },
  security: { color: 'volcano', label: '安全审计' },
  revenue: { color: 'default', label: '收益分配' },
};

const statusConfig: Record<string, { color: any; label: string }> = {
  active: { color: 'processing', label: '投票中' },
  passed: { color: 'success', label: '已通过' },
  failed: { color: 'error', label: '已否决' },
  executed: { color: 'default', label: '已执行' },
};

const hotDaos = [
  { name: 'GXT DAO', members: 28500, treasury: '$237M', proposals: 86, icon: <CrownOutlined />, color: '#1677FF', desc: '主网治理 · 费率·国库·安全' },
  { name: 'DeFi Alliance', members: 15800, treasury: '$85M', proposals: 45, icon: <ApiOutlined />, color: '#7C3AED', desc: 'DeFi 协议治理 · 挖矿·质押' },
  { name: 'Safety Council', members: 3200, treasury: '$50M', proposals: 28, icon: <FireOutlined />, color: '#DC2626', desc: '紧急响应 · 安全审计·风控' },
  { name: 'Community Fund', members: 42000, treasury: '$32M', proposals: 62, icon: <TeamOutlined />, color: '#16A34A', desc: '社区自治 · 预算·活动·生态' },
];

export default function DaoPage() {
  const actions: any[] = [
    {
      key: 'view',
      label: '查看',
      icon: <EyeOutlined />,
    },
  ];

  const columns = [
    {
      title: 'DAO名称',
      dataIndex: 'daoName',
      key: 'daoName',
      render: (t: string) => <span className="font-semibold text-blue-600">{t}</span>,
    },
    {
      title: '提案标题',
      dataIndex: 'title',
      key: 'proposalTitle',
      render: (t: string) => (
        <Text ellipsis style={{ maxWidth: 220 }}>{t}</Text>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'proposalType',
      render: (t: string) => {
        const cfg = proposalTypeMap[t];
        return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : <Tag>{t}</Tag>;
      },
    },
    {
      title: '投票进度',
      key: 'voteProgress',
      render: (_: unknown, r: DaoProposal) => {
        const rate = r.totalVotes > 0 ? Math.round((r.votesFor / r.totalVotes) * 100) : 0;
        return (
          <div className="flex items-center gap-2">
            <Progress percent={rate} size="small" style={{ width: 100 }} strokeColor={rate > 60 ? '#16A34A' : rate > 40 ? '#1677FF' : '#DC2626'} />
            <Text type="secondary" className="text-xs">{rate}%</Text>
          </div>
        );
      },
    },
    {
      title: '截止时间',
      dataIndex: 'deadline',
      key: 'deadline',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'proposalStatus',
      render: (s: string) => {
        const cfg = statusConfig[s];
        return cfg ? <Badge status={cfg.color} text={cfg.label} /> : <Badge status="default" text={s} />;
      },
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 页头 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BranchesOutlined /> DAO去中心化自治组织
            </h1>
            <p className="text-gray-500 mt-1">提案管理 · 投票执行 · 国库管理 · 治理代币</p>
          </div>
          <Space>
            <Button icon={<ThunderboltOutlined />}>快照投票</Button>
            <Button type="primary" icon={<FileTextOutlined />}>新建提案</Button>
          </Space>
        </div>

        {/* DataCards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="活跃DAO数"
              value={4}
              suffix="个组织"
              icon={<BranchesOutlined />}
              color="#1677FF"
              trend="up"
              trendValue="+1 本月"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="总提案数"
              value={221}
              icon={<FileTextOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="+18 本周"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="参与人数"
              value={89500}
              suffix="人"
              icon={<TeamOutlined />}
              color="#F59E0B"
              trend="up"
              trendValue="+12.5%"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="国库余额"
              value="404"
              suffix="M USDT"
              icon={<DollarOutlined />}
              color="#7C3AED"
              trend="up"
              trendValue="+$28M"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="本周投票"
              value={156}
              suffix="次"
              icon={<ThunderboltOutlined />}
              color="#DC2626"
              trend="up"
              trendValue="+22%"
            />
          </Col>
        </Row>

        {/* 热门DAO卡片 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">热门DAO组织</h2>
          <Row gutter={[16, 16]}>
            {hotDaos.map((dao) => (
              <Col xs={24} sm={12} lg={6} key={dao.name}>
                <Card hoverable className="h-full" style={{ borderRadius: 12 }}>
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar size={48} style={{ backgroundColor: dao.color }} icon={dao.icon} />
                    <div>
                      <h3 className="font-bold text-base m-0">{dao.name}</h3>
                      <Text type="secondary" className="text-xs">{dao.desc}</Text>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <Text type="secondary">成员数</Text>
                      <span className="font-semibold">{dao.members.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <Text type="secondary">国库规模</Text>
                      <span className="font-semibold" style={{ color: '#16A34A' }}>{dao.treasury}</span>
                    </div>
                    <div className="flex justify-between">
                      <Text type="secondary">历史提案</Text>
                      <span className="font-semibold">{dao.proposals} 个</span>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* DataTable */}
        <DataTable
          columns={columns}
          dataSource={mockProposals}
          rowKey="id"
          title="提案列表"
          searchPlaceholder="搜索提案标题..."
          addButtonText="创建提案"
          actions={actions}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条提案` }}
        />
      </div>
    </AdminLayout>
  );
}
