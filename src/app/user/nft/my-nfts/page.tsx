'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Select, Input, Statistic, Modal, Descriptions, Avatar } from 'antd';
import { EyeOutlined, SendOutlined, SwapOutlined, CopyOutlined } from '@ant-design/icons';
import UserLayout from '@/components/user/UserLayout';

const { Option } = Select;
const { Search } = Input;

const mockNFTs = [
  {
    id: '1',
    tokenId: '#1234',
    name: '国学经典 #001',
    collection: '国学年画系列',
    image: '🎨',
    rarity: 'rare',
    value: 5.5,
    chain: 'ETH',
    lastPrice: 5.0,
  },
  {
    id: '2',
    tokenId: '#5678',
    name: '国学家训 #002',
    collection: '国学家训系列',
    image: '📜',
    rarity: 'epic',
    value: 12.8,
    chain: 'ETH',
    lastPrice: 10.0,
  },
  {
    id: '3',
    tokenId: '#9012',
    name: '诗词歌赋 #003',
    collection: '诗词系列',
    image: '✍️',
    rarity: 'legendary',
    value: 25.0,
    chain: 'Polygon',
    lastPrice: 20.0,
  },
  {
    id: '4',
    tokenId: '#3456',
    name: '书法艺术 #004',
    collection: '书法系列',
    image: '🖌️',
    rarity: 'common',
    value: 1.2,
    chain: 'ETH',
    lastPrice: 1.0,
  },
  {
    id: '5',
    tokenId: '#7890',
    name: '山水意境 #005',
    collection: '山水系列',
    image: '🏔️',
    rarity: 'rare',
    value: 8.5,
    chain: 'BSC',
    lastPrice: 7.5,
  },
];

const rarityColors: Record<string, string> = {
  common: 'default',
  rare: 'blue',
  epic: 'purple',
  legendary: 'gold',
};

const rarityText: Record<string, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

export default function UserNFTMyNFTs() {
  const [nfts] = useState(mockNFTs);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [filterChain, setFilterChain] = useState<string>('all');

  const filteredNFTs = nfts.filter(nft => {
    if (filterRarity !== 'all' && nft.rarity !== filterRarity) return false;
    if (filterChain !== 'all' && nft.chain !== filterChain) return false;
    return true;
  });

  const totalValue = filteredNFTs.reduce((sum, nft) => sum + nft.value, 0);

  const columns = [
    {
      title: 'NFT',
      key: 'nft',
      width: 300,
      render: (_: any, record: any) => (
        <Space>
          <Avatar
            size={64}
            style={{ backgroundColor: '#f0f0f0', fontSize: '32px' }}
          >
            {record.image}
          </Avatar>
          <div>
            <div className="font-semibold">{record.name}</div>
            <div className="text-sm text-gray-500">
              {record.collection} • Token {record.tokenId}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '稀有度',
      dataIndex: 'rarity',
      key: 'rarity',
      width: 120,
      render: (rarity: string) => (
        <Tag color={rarityColors[rarity]}>
          {rarityText[rarity]}
        </Tag>
      ),
    },
    {
      title: '链',
      dataIndex: 'chain',
      key: 'chain',
      width: 100,
      render: (chain: string) => <Tag color="blue">{chain}</Tag>,
    },
    {
      title: '当前估值',
      dataIndex: 'value',
      key: 'value',
      width: 150,
      render: (val: number) => (
        <div>
          <div className="font-semibold text-green-600">{val} ETH</div>
          <div className="text-xs text-gray-500">
            ≈ ${(val * 3000).toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      title: '上次成交价',
      dataIndex: 'lastPrice',
      key: 'lastPrice',
      width: 120,
      render: (val: number) => `${val} ETH`,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedNFT(record);
              setDetailModalVisible(true);
            }}
          >
            详情
          </Button>
          <Button type="link" size="small" icon={<SendOutlined />}>
            转账
          </Button>
          <Button type="link" size="small" icon={<SwapOutlined />}>
            挂单
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold m-0">我的 NFT</h1>
          <Space>
            <Button>铸造 NFT</Button>
            <Button type="primary">领取空投</Button>
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="NFT 总数"
                value={nfts.length}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="总估值"
                value={totalValue}
                precision={2}
                suffix="ETH"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="系列数"
                value={5}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="待领取收益"
                value={0.25}
                precision={2}
                suffix="ETH"
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>

        <Card>
          <Row gutter={[16, 16]} className="mb-4">
            <Col xs={24} sm={8}>
              <Search placeholder="搜索 NFT 名称或 ID" />
            </Col>
            <Col xs={24} sm={6}>
              <Select
                placeholder="稀有度"
                style={{ width: '100%' }}
                value={filterRarity}
                onChange={setFilterRarity}
              >
                <Option value="all">全部稀有度</Option>
                <Option value="common">普通</Option>
                <Option value="rare">稀有</Option>
                <Option value="epic">史诗</Option>
                <Option value="legendary">传说</Option>
              </Select>
            </Col>
            <Col xs={24} sm={6}>
              <Select
                placeholder="链"
                style={{ width: '100%' }}
                value={filterChain}
                onChange={setFilterChain}
              >
                <Option value="all">全部链</Option>
                <Option value="ETH">Ethereum</Option>
                <Option value="Polygon">Polygon</Option>
                <Option value="BSC">BSC</Option>
              </Select>
            </Col>
          </Row>

          <Table
            dataSource={filteredNFTs}
            columns={columns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        <Modal
          title="NFT 详情"
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={[
            <Button key="transfer">转账</Button>,
            <Button key="list">挂单出售</Button>,
            <Button type="primary" key="close" onClick={() => setDetailModalVisible(false)}>
              关闭
            </Button>,
          ]}
          width={800}
        >
          {selectedNFT && (
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <div className="text-center">
                  <Avatar
                    size={300}
                    style={{
                      backgroundColor: '#f0f0f0',
                      fontSize: '120px',
                    }}
                  >
                    {selectedNFT.image}
                  </Avatar>
                </div>
              </Col>
              <Col xs={24} md={12}>
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="名称">{selectedNFT.name}</Descriptions.Item>
                  <Descriptions.Item label="编号">{selectedNFT.tokenId}</Descriptions.Item>
                  <Descriptions.Item label="系列">{selectedNFT.collection}</Descriptions.Item>
                  <Descriptions.Item label="稀有度">
                    <Tag color={rarityColors[selectedNFT.rarity]}>
                      {rarityText[selectedNFT.rarity]}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="链">{selectedNFT.chain}</Descriptions.Item>
                  <Descriptions.Item label="当前估值">
                    <span className="text-green-600 font-semibold">
                      {selectedNFT.value} ETH
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="上次成交">
                    {selectedNFT.lastPrice} ETH
                  </Descriptions.Item>
                </Descriptions>

                <div className="mt-4 space-y-2">
                  <div className="text-sm">
                    <span className="text-gray-500">合约地址：</span>
                    <Space>
                      <span className="font-mono text-xs">0x1234...5678</span>
                      <Button type="link" size="small" icon={<CopyOutlined />}>
                        复制
                      </Button>
                    </Space>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Token ID：</span>
                    <span className="font-mono">{selectedNFT.tokenId}</span>
                  </div>
                </div>
              </Col>
            </Row>
          )}
        </Modal>
      </div>
    </UserLayout>
  );
}
