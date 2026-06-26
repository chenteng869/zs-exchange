'use client';

import { useState } from 'react';
import {
  Modal,
  Tag,
  Progress,
  Badge,
  Button,
  Space,
  Avatar,
  Descriptions,
  Divider,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  RiseOutlined,
  DollarOutlined,
  EyeOutlined,
  EditOutlined,
  MessageOutlined,
  StarOutlined,
  FireOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

interface KolProfile {
  id: string;
  name: string;
  platform: string;
  followers: number;
  influenceScore: number;
  status: string;
  recentActivity: string;
  engagementRate: number;
  avgReach: number;
  cooperationCount: number;
  riskLevel: string;
}

const mockKols: KolProfile[] = [
  { id: 'KOL-001', name: 'CryptoGuru', platform: 'Twitter/X', followers: 285000, influenceScore: 92, status: 'cooperating', recentActivity: '发布 BTC 趋势分析长文', engagementRate: 8.5, avgReach: 125000, cooperationCount: 12, riskLevel: 'low' },
  { id: 'KOL-002', name: 'DeFi Master', platform: 'YouTube', followers: 158000, influenceScore: 85, status: 'cooperating', recentActivity: '直播 DeFi 收益策略', engagementRate: 6.2, avgReach: 85000, cooperationCount: 8, riskLevel: 'low' },
  { id: 'KOL-003', name: 'Whale Watcher', platform: 'Twitter/X', followers: 425000, influenceScore: 95, status: 'negotiating', recentActivity: '追踪巨鲸地址 0x742d... 大额转入', engagementRate: 9.1, avgReach: 280000, cooperationCount: 15, riskLevel: 'low' },
  { id: 'KOL-004', name: 'Alpha Hunter', platform: 'Telegram', followers: 92000, influenceScore: 78, status: 'cooperating', recentActivity: '分享 SOL 链上 Alpha 机会', engagementRate: 12.3, avgReach: 52000, cooperationCount: 6, riskLevel: 'medium' },
  { id: 'KOL-005', name: 'On-chain Prophet', platform: 'Twitter/X', followers: 215000, influenceScore: 88, status: 'cooperating', recentActivity: '发布 Nansen 数据周报解读', engagementRate: 7.8, avgReach: 145000, cooperationCount: 10, riskLevel: 'low' },
  { id: 'KOL-006', name: 'NFT Wizard', platform: 'Discord', followers: 38000, influenceScore: 72, status: 'paused', recentActivity: 'NFT 市场深度分析视频', engagementRate: 15.2, avgReach: 28000, cooperationCount: 4, riskLevel: 'medium' },
  { id: 'KOL-007', name: 'CryptoNewsCN', platform: '微博', followers: 562000, influenceScore: 90, status: 'cooperating', recentActivity: '转发央行数字货币最新政策', engagementRate: 3.5, avgReach: 350000, cooperationCount: 18, riskLevel: 'low' },
  { id: 'KOL-008', name: 'BlockchainEdu', platform: 'Bilibili', followers: 128000, influenceScore: 80, status: 'negotiating', recentActivity: '发布区块链入门系列教程第28集', engagementRate: 10.8, avgReach: 95000, cooperationCount: 5, riskLevel: 'low' },
  { id: 'KOL-009', name: 'Token Analyst', platform: 'Twitter/X', followers: 175000, influenceScore: 83, status: 'cooperating', recentActivity: 'GXT 代币经济模型深度解析', engagementRate: 6.9, avgReach: 110000, cooperationCount: 9, riskLevel: 'low' },
  { id: 'KOL-010', name: 'Web3 Explorer', platform: 'YouTube', followers: 95000, influenceScore: 75, status: 'expired', recentActivity: 'Web3 项目测评：Layer2 对比', engagementRate: 11.5, avgReach: 62000, cooperationCount: 3, riskLevel: 'high' },
  { id: 'KOL-011', name: 'Yield Farmer Pro', platform: 'Telegram', followers: 65000, influenceScore: 70, status: 'cooperating', recentActivity: '分享新挖矿池 APY 数据', engagementRate: 18.5, avgReach: 42000, cooperationCount: 7, riskLevel: 'medium' },
  { id: 'KOL-012', name: 'MetaVerse Vision', platform: 'Twitter/X', followers: 310000, influenceScore: 86, status: 'cooperating', recentActivity: '元宇宙项目投资机会盘点', engagementRate: 5.2, avgReach: 195000, cooperationCount: 11, riskLevel: 'low' },
];

const platformColorMap: Record<string, string> = {
  'Twitter/X': '#1DA1F2',
  YouTube: '#FF0000',
  Telegram: '#26A5E4',
  Discord: '#5865F2',
  微博: '#E6162D',
  Bilibili: '#FB7299',
};

const statusConfig: Record<string, { color: any; label: string }> = {
  cooperating: { color: 'success', label: '合作中' },
  negotiating: { color: 'processing', label: '洽谈中' },
  paused: { color: 'warning', label: '已暂停' },
  expired: { color: 'error', label: '已到期' },
};

const riskConfig: Record<string, { color: string; label: string }> = {
  low: { color: 'green', label: '低风险' },
  medium: { color: 'orange', label: '中风险' },
  high: { color: 'red', label: '高风险' },
};

export default function KolPage() {
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedKol, setSelectedKol] = useState<KolProfile | null>(null);

  const handleViewDetail = (record: KolProfile) => {
    setSelectedKol(record);
    setDetailOpen(true);
  };

  const actions: any[] = [
    {
      key: 'view',
      label: '详情',
      icon: <EyeOutlined />,
      onClick: handleViewDetail,
    },
    {
      key: 'message',
      label: '联系',
      icon: <MessageOutlined />,
      hidden: (r: KolProfile) => r.status === 'expired',
    },
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
    },
  ];

  const columns = [
    {
      title: 'KOL名称',
      dataIndex: 'name',
      key: 'kolName',
      render: (t: string) => <span className="font-semibold text-blue-600">{t}</span>,
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (t: string) => (
        <Tag color={platformColorMap[t] || 'default'}>{t}</Tag>
      ),
    },
    {
      title: '粉丝量',
      dataIndex: 'followers',
      key: 'followers',
      render: (v: number) => (
        <span className="font-semibold">{v >= 10000 ? `${(v / 10000).toFixed(1)}万` : v.toLocaleString()}</span>
      ),
    },
    {
      title: '影响力分',
      dataIndex: 'influenceScore',
      key: 'influenceScore',
      render: (v: number) => (
        <div className="flex items-center gap-2">
          <Progress percent={v} size="small" style={{ width: 80 }} strokeColor={v > 85 ? '#16A34A' : v > 75 ? '#1677FF' : '#F59E0B'} />
          <span className="text-sm font-semibold">{v}</span>
        </div>
      ),
    },
    {
      title: '合作状态',
      dataIndex: 'status',
      key: 'coopStatus',
      render: (s: string) => {
        const cfg = statusConfig[s];
        return cfg ? <Badge status={cfg.color} text={cfg.label} /> : <Badge status="default" text={s} />;
      },
    },
    {
      title: '最近活动',
      dataIndex: 'recentActivity',
      key: 'recentAct',
      width: 200,
      ellipsis: true,
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 页头 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <UserOutlined /> KOL意见领袖管理中心
            </h1>
            <p className="text-gray-500 mt-1">影响力评估 · 合作管理 · 效果追踪 · 风控预警</p>
          </div>
          <Space>
            <Button icon={<WarningOutlined />}>风控扫描</Button>
            <Button type="primary" icon={<TeamOutlined />}>邀请新KOL</Button>
          </Space>
        </div>

        {/* DataCards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="KOL总数"
              value={12}
              suffix="位"
              icon={<UserOutlined />}
              color="#1677FF"
              trend="up"
              trendValue="+2 本月"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="合作中"
              value={9}
              suffix="位"
              icon={<CheckCircleOutlined />}
              color="#16A34A"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="本月新增"
              value={2}
              suffix="位"
              icon={<RiseOutlined />}
              color="#F59E0B"
              trend="up"
              trendValue="+1 较上月"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="平均粉丝"
              value="19.8"
              suffix="万"
              icon={<StarOutlined />}
              color="#7C3AED"
              trend="up"
              trendValue="+12%"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="总触达"
              value="1,567"
              suffix="万人/次"
              icon={<FireOutlined />}
              color="#DC2626"
              trend="up"
              trendValue="+28.5%"
            />
          </Col>
        </Row>

        {/* DataTable */}
        <DataTable
          columns={columns}
          dataSource={mockKols}
          rowKey="id"
          title="KOL列表"
          searchPlaceholder="搜索KOL名称或平台..."
          addButtonText="添加KOL"
          actions={actions}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 位KOL` }}
        />

        {/* KOL详情 Modal */}
        <Modal
          title={`KOL详情 — ${selectedKol?.name || ''}`}
          open={detailOpen}
          onCancel={() => setDetailOpen(false)}
          footer={[
            <Button key="close" onClick={() => setDetailOpen(false)}>关闭</Button>,
            <Button key="contact" type="primary" icon={<MessageOutlined />}>发送消息</Button>,
          ]}
          width={720}
        >
          {selectedKol && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <Avatar size={64} style={{ backgroundColor: '#1677FF' }} icon={<UserOutlined />} />
                <div>
                  <h2 className="text-xl font-bold m-0">{selectedKol.name}</h2>
                  <Tag color={platformColorMap[selectedKol.platform]}>{selectedKol.platform}</Tag>
                  <Tag color={riskConfig[selectedKol.riskLevel]?.color}>{riskConfig[selectedKol.riskLevel]?.label}</Tag>
                </div>
              </div>

              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Statistic title="粉丝总量" value={selectedKol.followers} suffix="人" valueStyle={{ fontSize: 20 }} />
                </Col>
                <Col span={8}>
                  <Statistic title="影响力分" value={selectedKol.influenceScore} valueStyle={{ fontSize: 20, color: selectedKol.influenceScore > 85 ? '#16A34A' : '#1677FF' }} />
                </Col>
                <Col span={8}>
                  <Statistic title="平均触达" value={selectedKol.avgReach} suffix="人/次" valueStyle={{ fontSize: 20 }} />
                </Col>
              </Row>

              <Divider />

              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="互动率">{selectedKol.engagementRate}%</Descriptions.Item>
                <Descriptions.Item label="合作次数">{selectedKol.cooperationCount} 次</Descriptions.Item>
                <Descriptions.Item label="合作状态">
                  <Badge status={statusConfig[selectedKol.status]?.color} text={statusConfig[selectedKol.status]?.label} />
                </Descriptions.Item>
                <Descriptions.Item label="风险等级">
                  <Tag color={riskConfig[selectedKol.riskLevel]?.color}>{riskConfig[selectedKol.riskLevel]?.label}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="最近活动" span={2}>{selectedKol.recentActivity}</Descriptions.Item>
              </Descriptions>

              <Divider>数据概览</Divider>

              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                    <h4 className="text-sm font-semibold mb-3 text-gray-600">效果指标</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>曝光量(近30日):</span><span className="font-mono font-bold">{(selectedKol.avgReach * 25).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>点击率(CTR):</span><span className="font-mono">4.82%</span></div>
                      <div className="flex justify-between"><span>转化率(CVR):</span><span className="font-mono text-green-600">2.35%</span></div>
                      <div className="flex justify-between"><span>单次获客成本:</span><span className="font-mono">${(Math.random() * 10 + 2).toFixed(2)}</span></div>
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                    <h4 className="text-sm font-semibold mb-3 text-gray-600">合作信息</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>合同期限:</span><span className="font-mono">2024-01 ~ 2024-12</span></div>
                      <div className="flex justify-between"><span>合作费用:</span><span className="font-mono font-bold">$${(Math.random() * 50 + 5).toFixed(0)}K /月</span></div>
                      <div className="flex justify-between"><span>内容频次:</span><span className="font-mono">每周 3-5 条</span></div>
                      <div className="flex justify-between"><span>专属对接:</span><span className="font-mono">运营组-Alice</span></div>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
