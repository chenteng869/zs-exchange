'use client';

import React from 'react';
import {
  Row,
  Col,
  Card,
  Tag,
  Space,
  Typography,
} from 'antd';
import {
  PictureOutlined,
  DollarOutlined,
  FireOutlined,
  PlusCircleOutlined,
  RiseOutlined,
  EyeOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

const mockNFTData = [
  {
    id: 1,
    name: 'CryptoPunk #7821',
    series: 'CryptoPunks',
    buyer: '0x8f3a...9c2d',
    seller: '0xa1b2...c3d4',
    price: 125.5,
    fee: 3.76,
    time: '2024-06-23 14:32',
  },
  {
    id: 2,
    name: 'Bored Ape #4521',
    series: 'BAYC',
    buyer: '0x5678...efgh',
    seller: '0x9876...5432',
    price: 89.25,
    fee: 2.67,
    time: '2024-06-23 14:18',
  },
  {
    id: 3,
    name: 'Azuki #1234',
    series: 'Azuki',
    buyer: '0xabcd...1234',
    seller: '0xdef0...7890',
    price: 45.8,
    fee: 1.37,
    time: '2024-06-23 14:05',
  },
  {
    id: 4,
    name: 'Doodles #9876',
    series: 'Doodles',
    buyer: '0x3456...ijkl',
    seller: '0xmnop...qrst',
    price: 32.5,
    fee: 0.97,
    time: '2024-06-23 13:52',
  },
  {
    id: 5,
    name: 'CloneX #3333',
    series: 'CloneX',
    buyer: '0xuvwx...yz01',
    seller: '0x2345...6789',
    price: 67.9,
    fee: 2.03,
    time: '2024-06-23 13:38',
  },
  {
    id: 6,
    name: 'Moonbirds #5555',
    series: 'Moonbirds',
    buyer: '0x6789...abcd',
    seller: '0x8901...2345',
    price: 28.15,
    fee: 0.84,
    time: '2024-06-23 13:25',
  },
  {
    id: 7,
    name: 'World of Women #7777',
    series: 'WOW',
    buyer: '0xcdef...4567',
    seller: '0xfghi...jklm',
    price: 156.0,
    fee: 4.68,
    time: '2024-06-23 13:12',
  },
  {
    id: 8,
    name: 'Pudgy Penguins #2222',
    series: 'Pudgy',
    buyer: '0xnoqr...stuv',
    seller: '0wxyz...1234',
    price: 19.99,
    fee: 0.59,
    time: '2024-06-23 12:59',
  },
  {
    id: 9,
    name: 'Cool Cats #4444',
    series: 'CoolCats',
    buyer: '0x3456...7890',
    seller: '0xabcd...efgh',
    price: 12.5,
    fee: 0.37,
    time: '2024-06-23 12:45',
  },
  {
    id: 10,
    name: 'Meebits #6666',
    series: 'Meebits',
    buyer: '0xijkl...mnop',
    seller: '0qrst...uvwx',
    price: 42.35,
    fee: 1.27,
    time: '2024-06-23 12:32',
  },
  {
    id: 11,
    name: 'Art Blocks #8888',
    series: 'ArtBlocks',
    buyer: '0yz01...2345',
    seller: '0x6789...abcd',
    price: 95.75,
    fee: 2.87,
    time: '2024-06-23 12:18',
  },
  {
    id: 12,
    name: 'DeGods #9999',
    series: 'DeGods',
    buyer: '0xfghi...jklm',
    seller: '0pqrt...uvwx',
    price: 178.5,
    fee: 5.35,
    time: '2024-06-23 12:04',
  },
];

export default function NFTTransactionsPage() {
  const getSeriesColor = (series: string) => {
    const colorMap: Record<string, string> = {
      CryptoPunks: '#E4E4E4',
      BAYC: '#A868DC',
      Azuki: '#FF4D4F',
      Doodles: '#FAAD14',
      CloneX: '#13C2C2',
      Moonbirds: '#722ED1',
      WOW: '#EB2F96',
      Pudgy: '#52C41A',
      CoolCats: '#1677FF',
      Meebits: '#FA8C16',
      ArtBlocks: '#F5222D',
      DeGods: '#F0B90B',
    };
    return <Tag color={colorMap[series] || 'default'}>{series}</Tag>;
  };

  const columns = [
    {
      title: 'NFT名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (text: string) => (
        <Space>
          <PictureOutlined style={{ color: '#7C3AED' }} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: '系列',
      dataIndex: 'series',
      key: 'series',
      width: 120,
      render: (series: string) => getSeriesColor(series),
    },
    {
      title: '买方',
      dataIndex: 'buyer',
      key: 'buyer',
      width: 140,
      render: (addr: string) => <Text code style={{ fontSize: 12 }}>{addr}</Text>,
    },
    {
      title: '卖方',
      dataIndex: 'seller',
      key: 'seller',
      width: 140,
      render: (addr: string) => <Text code style={{ fontSize: 12 }}>{addr}</Text>,
    },
    {
      title: '价格(ETH)',
      dataIndex: 'price',
      key: 'price',
      width: 110,
      render: (price: number) => (
        <Text strong style={{ color: '#1677FF', fontSize: 15 }}>
          Ξ{price.toFixed(2)}
        </Text>
      ),
    },
    {
      title: '平台费(ETH)',
      dataIndex: 'fee',
      key: 'fee',
      width: 120,
      render: (fee: number) => <Text type="secondary">Ξ{fee.toFixed(2)}</Text>,
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 130,
    },
  ];

  const actions: any[] = [
    {
      key: 'view',
      label: '详情',
      icon: <EyeOutlined />,
      type: 'link',
      onClick: (record: any) => console.log('查看:', record.id),
    },
    {
      key: 'link',
      label: '查看链上',
      icon: <LinkOutlined />,
      type: 'link',
      onClick: (record: any) => console.log('链上:', record.name),
    },
  ];

  const totalVolume = mockNFTData.reduce((sum, nft) => sum + nft.price, 0);
  const totalFee = mockNFTData.reduce((sum, nft) => sum + nft.fee, 0);

  return (
    <AdminLayout>
      <div className="p-6" style={{ background: '#F5F7FA', minHeight: '100vh' }}>
        {/* 页面标题 */}
        <div className="mb-6">
          <Title level={2} style={{ margin: 0, color: '#111827' }}>
            NFT交易记录
          </Title>
          <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: 'block' }}>
            NFT市场交易追踪 · 热门系列监控 · 价格趋势分析
          </Text>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="今日成交"
              value={mockNFTData.length}
              suffix="笔"
              icon={<PictureOutlined />}
              color="#1677FF"
              trend="up"
              trendValue="+25%"
              description="交易活跃"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="成交额"
              value={totalVolume.toFixed(2)}
              suffix="ETH"
              icon={<DollarOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="+32.5%"
              description="市场热度高"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="热门系列"
              value="BAYC"
              suffix=""
              icon={<FireOutlined />}
              color="#F59E0B"
              description="占比最高"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="新增挂单"
              value={256}
              suffix="件"
              icon={<PlusCircleOutlined />}
              color="#7C3AED"
              trend="up"
              trendValue="+18%"
              description="供应增加"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="地板价变化"
              value="+5.8"
              suffix="%"
              icon={<RiseOutlined />}
              color="#06B6D4"
              trend="up"
              trendValue="+5.8%"
              description="整体上涨"
            />
          </Col>
        </Row>

        {/* NFT交易表格 */}
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <DataTable
            columns={columns}
            dataSource={mockNFTData}
            title="NFT交易列表"
            rowKey="id"
            actions={actions}
            showAdd={false}
            searchPlaceholder="搜索NFT名称或系列..."
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
          />
        </Card>

        {/* 收入统计 */}
        <Card
          bordered={false}
          className="mt-6"
          title="平台收入统计"
          style={{
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <Row gutter={[24, 16]}>
            <Col xs={24} md={8}>
              <Space direction="vertical">
                <Text type="secondary">今日总成交额</Text>
                <Text strong style={{ fontSize: 24, color: '#16A34A' }}>
                  Ξ {totalVolume.toFixed(2)} ETH
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  ≈ ${(totalVolume * 3500).toLocaleString('en-US', { maximumFractionDigits: 0 })} USD
                </Text>
              </Space>
            </Col>
            <Col xs={24} md={8}>
              <Space direction="vertical">
                <Text type="secondary">平台手续费收入</Text>
                <Text strong style={{ fontSize: 24, color: '#1677FF' }}>
                  Ξ {totalFee.toFixed(2)} ETH
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  费率 3%
                </Text>
              </Space>
            </Col>
            <Col xs={24} md={8}>
              <Space direction="vertical">
                <Text type="secondary">平均成交价格</Text>
                <Text strong style={{ fontSize: 24, color: '#7C3AED' }}>
                  Ξ {(totalVolume / mockNFTData.length).toFixed(2)} ETH
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  较昨日 +12.3%
                </Text>
              </Space>
            </Col>
          </Row>
        </Card>
      </div>
    </AdminLayout>
  );
}
