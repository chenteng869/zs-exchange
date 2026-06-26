'use client';

import React from 'react';
import { Row, Col, Card, Tag, Statistic, Typography, Avatar, Grid } from 'antd';
import {
  AppstoreOutlined,
  PictureOutlined,
  DollarOutlined,
  RiseOutlined,
  UserOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

const hotSeries = [
  { id: 'S-001', name: 'BAYC', emoji: '🐵', count: 10000, floorPrice: 45.2, volume: 12580, creator: 'Yuga Labs' },
  { id: 'S-002', name: 'Azuki', emoji: '🎭', count: 10000, floorPrice: 12.6, volume: 8920, creator: 'Chiru Labs' },
  { id: 'S-003', name: 'Doodles', emoji: '🎨', count: 10000, floorPrice: 5.8, volume: 6540, creator: 'Doodles Team' },
  { id: 'S-004', name: 'Pudgy Penguins', emoji: '🐧', count: 8888, floorPrice: 8.5, volume: 5280, creator: 'Luca Netz' },
  { id: 'S-005', name: 'DeGods', emoji: '😎', count: 10000, floorPrice: 18.75, volume: 4860, creator: 'FrankDeGods' },
  { id: 'S-006', name: 'Moonbirds', emoji: '🦉', count: 10000, floorPrice: 1.95, volume: 3920, creator: 'Proof' },
];

const allSeries = [
  { id: 'S-001', name: 'BAYC', totalSupply: 10000, minted: 10000, floorPrice: 45.2, volume24h: 1258, royalty: 5, status: 'active', created: '2021-04' },
  { id: 'S-002', name: 'Azuki', totalSupply: 10000, minted: 10000, floorPrice: 12.6, volume24h: 892, royalty: 5, status: 'active', created: '2022-01' },
  { id: 'S-003', name: 'Doodles', totalSupply: 10000, minted: 10000, floorPrice: 5.8, volume24h: 654, royalty: 5, status: 'active', created: '2021-10' },
  { id: 'S-004', name: 'Pudgy Penguins', totalSupply: 8888, minted: 8888, floorPrice: 8.5, volume24h: 528, royalty: 5, status: 'active', created: '2021-07' },
  { id: 'S-005', name: 'DeGods', totalSupply: 10000, minted: 9850, floorPrice: 18.75, volume24h: 486, royalty: 5, status: 'active', created: '2021-12' },
  { id: 'S-006', name: 'Moonbirds', totalSupply: 10000, minted: 10000, floorPrice: 1.95, volume24h: 392, royalty: 5, status: 'active', created: '2022-04' },
  { id: 'S-007', name: 'CloneX', totalSupply: 20000, minted: 19850, floorPrice: 3.25, volume24h: 345, royalty: 5, status: 'active', created: '2021-11' },
  { id: 'S-008', name: 'Meebits', totalSupply: 20000, minted: 20000, floorPrice: 0.85, volume24h: 218, royalty: 5, status: 'paused', created: '2021-05' },
  { id: 'S-009', name: 'World of Women', totalSupply: 10000, minted: 10000, floorPrice: 2.15, volume24h: 186, royalty: 5, status: 'active', created: '2021-07' },
  { id: 'S-010', name: 'Cool Cats', totalSupply: 9999, minted: 9999, floorPrice: 1.45, volume24h: 154, royalty: 5, status: 'active', created: '2021-07' },
];

export default function NFTSeriesPage() {
  const screens = useBreakpoint();

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 标题区 */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#0F1B3D' }}>
            <AppstoreOutlined style={{ color: '#F0B90B' }} />
            NFT系列管理中心
          </h1>
          <p className="text-gray-500 mt-2">热门系列展示 · 全部系列管理 · Floor追踪 · 版税配置</p>
        </div>

        {/* DataCards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="系列总数"
              value={156}
              icon={<AppstoreOutlined />}
              color="#1677FF"
              suffix="个"
              trend="up"
              trendValue="+3.2%"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="活跃系列"
              value={142}
              icon={<RiseOutlined />}
              color="#16A34A"
              suffix="个"
              description="过去30天有交易"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="总NFT数"
              value={128447}
              icon={<PictureOutlined />}
              color="#7C3AED"
              suffix="件"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="平均版税"
              value={5}
              suffix="%"
              icon={<DollarOutlined />}
              color="#F59E0B"
              description="行业标准"
            />
          </Col>
        </Row>

        {/* 热门系列卡片网格 */}
        <div>
          <Title level={4} className="mb-4">
            <RiseOutlined style={{ color: '#F0B90B' }} /> 热门系列 TOP 6
          </Title>
          <Row gutter={[16, 16]}>
            {hotSeries.map((item) => (
              <Col xs={24} sm={12} lg={8} xl={4} key={item.id}>
                <Card
                  hoverable
                  className="h-full"
                  style={{ borderRadius: 12 }}
                  cover={
                    <div style={{
                      height: 120,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 48,
                    }}>
                      {item.emoji}
                    </div>
                  }
                >
                  <Card.Meta
                    avatar={<Avatar style={{ backgroundColor: '#F0B90B' }} icon={<UserOutlined />} />}
                    title={<span className="font-bold">{item.name}</span>}
                    description={
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between"><Text type="secondary">数量:</Text><Text strong>{item.count.toLocaleString()}</Text></div>
                        <div className="flex justify-between"><Text type="secondary">Floor:</Text><Text strong style={{ color: '#16A34A' }}>Ξ{item.floorPrice}</Text></div>
                        <div className="flex justify-between"><Text type="secondary">Volume:</Text><Text strong>${(item.volume / 1000).toFixed(1)}K</Text></div>
                        <div><Tag color="gold">{item.creator}</Tag></div>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* 全部系列 DataTable */}
        <DataTable
          columns={[
            {
              title: '系列名',
              dataIndex: 'name',
              key: 'name',
              render: (text: string) => <span className="font-semibold">{text}</span>,
            },
            {
              title: '总量',
              dataIndex: 'totalSupply',
              key: 'totalSupply',
              render: (v: number) => v.toLocaleString(),
            },
            {
              title: '已铸造',
              dataIndex: 'minted',
              key: 'minted',
              render: (v: number, r: any) => `${v.toLocaleString()} / ${((v / r.totalSupply) * 100).toFixed(0)}%`,
            },
            {
              title: 'Floor Price',
              dataIndex: 'floorPrice',
              key: 'floorPrice',
              render: (v: number) => <span className="text-green-600 font-medium">Ξ{v.toFixed(2)}</span>,
              sorter: (a: any, b: any) => a.floorPrice - b.floorPrice,
            },
            {
              title: '24h Volume',
              dataIndex: 'volume24h',
              key: 'volume24h',
              render: (v: number) => `Ξ${v.toLocaleString()}`,
            },
            {
              title: '版税',
              dataIndex: 'royalty',
              key: 'royalty',
              render: (v: number) => `${v}%`,
            },
            {
              title: '状态',
              dataIndex: 'status',
              key: 'status',
              render: (s: string) => (
                <Tag color={s === 'active' ? 'success' : 'default'}>{s === 'active' ? '活跃' : '暂停'}</Tag>
              ),
            },
            {
              title: '创建时间',
              dataIndex: 'created',
              key: 'created',
            },
          ]}
          dataSource={allSeries}
          rowKey="id"
          title="全部系列列表"
          searchPlaceholder="搜索系列名称..."
          showFilter
          filterOptions={[
            { label: '全部', value: '' },
            { label: '活跃', value: 'active' },
            { label: '暂停', value: 'paused' },
          ]}
          onAdd={() => {}}
          addButtonText="创建系列"
        />
      </div>
    </AdminLayout>
  );
}
