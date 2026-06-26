'use client';

import React, { useState } from 'react';
import { Row, Col, Tag, Badge, Modal, message, Space, Typography } from 'antd';
import {
  PictureOutlined,
  DollarOutlined,
  TeamOutlined,
  SwapOutlined,
  AppstoreOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  EditOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Text } = Typography;

const mockNFTs = [
  { id: 'NFT-001', name: 'Cyber Punk #2048', series: 'Cyber Punk', creator: '0x8a2a...f3d1', floorPrice: 2.85, holders: 156, status: 'listed', chain: 'ETH' },
  { id: 'NFT-002', name: 'Bored Ape #8892', series: 'BAYC', creator: '0x3c4e...a1b2', floorPrice: 45.2, holders: 89, status: 'listed', chain: 'ETH' },
  { id: 'NFT-003', name: 'Azuki #4521', series: 'Azuki', creator: '0x7d1f...c9e3', floorPrice: 12.6, holders: 234, status: 'listed', chain: 'ETH' },
  { id: 'NFT-004', name: 'Doodles #7890', series: 'Doodles', creator: '0x2b5a...e4f7', floorPrice: 5.8, holders: 312, status: 'auction', chain: 'ETH' },
  { id: 'NFT-005', name: 'CloneX #3344', series: 'CloneX', creator: '0x9f1c...b8d2', floorPrice: 3.25, holders: 178, status: 'listed', chain: 'ETH' },
  { id: 'NFT-006', name: 'Moonbird #5678', series: 'Moonbirds', creator: '0x4e7d...a3c9', floorPrice: 1.95, holders: 445, status: 'delisted', chain: 'ETH' },
  { id: 'NFT-007', name: 'Pudgy #1234', series: 'Pudgy Penguins', creator: '0x6a8e...d5f1', floorPrice: 8.5, holders: 267, status: 'listed', chain: 'ETH' },
  { id: 'NFT-008', name: 'DeGod #9012', series: 'DeGods', creator: '0x1b3c...e7a8', floorPrice: 18.75, holders: 98, status: 'listed', chain: 'SOL' },
  { id: 'NFT-009', name: 'Okay Bear #2345', series: 'Okay Bears', creator: '0x5d9f...c2b4', floorPrice: 4.2, holders: 356, status: 'listed', chain: 'SOL' },
  { id: 'NFT-010', name: 'Meebits #6789', series: 'Meebits', creator: '0x8c2a...f9e1', floorPrice: 0.85, holders: 523, status: 'listed', chain: 'ETH' },
  { id: 'NFT-011', name: 'World of Women #3456', series: 'WoW', creator: '0x3e7b...a5d8', floorPrice: 2.15, holders: 289, status: 'auction', chain: 'ETH' },
  { id: 'NFT-012', name: 'Cool Cats #7891', series: 'Cool Cats', creator: '0x7f4c...b1e3', floorPrice: 1.45, holdings: 412, status: 'listed', chain: 'ETH' },
];

export default function NFTOverviewPage() {
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<any>(null);

  const handleViewDetail = (record: any) => {
    setSelectedNFT(record);
    setDetailVisible(true);
  };

  const columns = [
    {
      title: 'NFT名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Space>
          <PictureOutlined style={{ color: '#F0B90B' }} />
          <span className="font-semibold">{text}</span>
        </Space>
      ),
    },
    {
      title: '系列',
      dataIndex: 'series',
      key: 'series',
      render: (text: string) => <Tag color="gold">{text}</Tag>,
    },
    {
      title: '创作者',
      dataIndex: 'creator',
      key: 'creator',
      render: (text: string) => <Text copyable style={{ fontSize: 13 }}>{text}</Text>,
    },
    {
      title: 'Floor Price',
      dataIndex: 'floorPrice',
      key: 'floorPrice',
      render: (val: number, record: any) => (
        <span className="font-medium">
          {record.chain === 'SOL' ? '' : 'Ξ'}{val.toFixed(2)}
        </span>
      ),
      sorter: (a: any, b: any) => a.floorPrice - b.floorPrice,
    },
    {
      title: '持有者',
      dataIndex: 'holders',
      key: 'holders',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '链上状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const map: Record<string, { color: string; text: string }> = {
          listed: { color: 'success', text: '在售' },
          auction: { color: 'processing', text: '拍卖中' },
          delisted: { color: 'default', text: '已下架' },
        };
        return <Badge status={map[status]?.color as any} text={map[status]?.text} />;
      },
    },
  ];

  const actions: any[] = [
    {
      key: 'view',
      label: '详情',
      icon: <EyeOutlined />,
      type: 'link',
      onClick: handleViewDetail,
    },
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      type: 'link',
    },
    {
      key: 'link',
      label: '链上查看',
      icon: <LinkOutlined />,
      type: 'link',
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 标题区 */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#0F1B3D' }}>
            <PictureOutlined style={{ color: '#F0B90B' }} />
            NFT资产管理中心
          </h1>
          <p className="text-gray-500 mt-2">数字藏品全生命周期管理 · 铸造·交易·版权·版税</p>
        </div>

        {/* DataCards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="NFT总数"
              value={12847}
              icon={<AppstoreOutlined />}
              color="#1677FF"
              suffix="件"
              trend="up"
              trendValue="+12.5%"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="总市值"
              value={45680}
              prefix="$"
              suffix="K"
              icon={<DollarOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="+8.3%"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="持有者数"
              value={3856}
              icon={<TeamOutlined />}
              color="#7C3AED"
              suffix="人"
              trend="up"
              trendValue="+5.2%"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="今日成交量"
              value={284}
              icon={<SwapOutlined />}
              color="#F59E0B"
              suffix="笔"
              trend="down"
              trendValue="-3.1%"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="系列数"
              value={156}
              icon={<AppstoreOutlined />}
              color="#06B6D4"
              suffix="个"
              trend="up"
              trendValue="+2.8%"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="版税收入"
              value={128.5}
              prefix="$"
              suffix="K"
              icon={<ThunderboltOutlined />}
              color="#EC4899"
              trend="up"
              trendValue="+15.6%"
            />
          </Col>
        </Row>

        {/* DataTable */}
        <DataTable
          columns={columns}
          dataSource={mockNFTs}
          rowKey="id"
          title="NFT资产列表"
          searchPlaceholder="搜索NFT名称/系列..."
          showFilter
          filterOptions={[
            { label: '全部状态', value: '' },
            { label: '在售', value: 'listed' },
            { label: '拍卖中', value: 'auction' },
            { label: '已下架', value: 'delisted' },
          ]}
          actions={actions}
          onAdd={() => message.info('跳转至铸造页面')}
          addButtonText="新建铸造"
        />

        {/* 详情Modal */}
        <Modal
          title="NFT 详情"
          open={detailVisible}
          onCancel={() => setDetailVisible(false)}
          footer={null}
          width={520}
        >
          {selectedNFT && (
            <div className="space-y-4">
              <Row gutter={[16, 16]}>
                <Col span={12}><Text type="secondary">ID:</Text><br /><Text strong>{selectedNFT.id}</Text></Col>
                <Col span={12}><Text type="secondary">名称:</Text><br /><Text strong>{selectedNFT.name}</Text></Col>
                <Col span={12}><Text type="secondary">系列:</Text><br /><Text strong>{selectedNFT.series}</Text></Col>
                <Col span={12}><Text type="secondary">Floor Price:</Text><br /><Text strong>{selectedNFT.floorPrice} ETH</Text></Col>
                <Col span={12}><Text type="secondary">持有者数:</Text><br /><Text strong>{selectedNFT.holders}</Text></Col>
                <Col span={12}><Text type="secondary">状态:</Text><br /><Tag color="blue">{selectedNFT.status}</Tag></Col>
              </Row>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
