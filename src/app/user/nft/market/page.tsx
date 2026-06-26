'use client';

import { useState } from 'react';
import { Card, Row, Col, Button, Select, Input, Tag, Space, Statistic, Avatar, Grid } from 'antd';
import { SearchOutlined, ShoppingCartOutlined, HeartOutlined, FilterOutlined } from '@ant-design/icons';
import UserLayout from '@/components/user/UserLayout';

const { Option } = Select;
const { Search } = Input;
const { useBreakpoint } = Grid;

const mockNFTCollections = [
  {
    id: '1',
    name: '国学年画系列',
    image: '🎨',
    items: 1000,
    floorPrice: 2.5,
    volume24h: 125.5,
    trending: true,
  },
  {
    id: '2',
    name: '国学家训系列',
    image: '📜',
    items: 500,
    floorPrice: 5.0,
    volume24h: 85.2,
    trending: true,
  },
  {
    id: '3',
    name: '诗词系列',
    image: '✍️',
    items: 800,
    floorPrice: 8.8,
    volume24h: 200.0,
    trending: false,
  },
  {
    id: '4',
    name: '书法系列',
    image: '🖌️',
    items: 600,
    floorPrice: 1.8,
    volume24h: 45.5,
    trending: false,
  },
  {
    id: '5',
    name: '山水系列',
    image: '🏔️',
    items: 400,
    floorPrice: 3.2,
    volume24h: 65.0,
    trending: true,
  },
  {
    id: '6',
    name: '茶道系列',
    image: '🍵',
    items: 300,
    floorPrice: 4.5,
    volume24h: 55.8,
    trending: false,
  },
];

const mockFeaturedNFTs = [
  { id: '1', name: '国学经典 #001', collection: '国学年画系列', image: '🎨', price: 5.5, rarity: 'rare' },
  { id: '2', name: '国学家训 #002', collection: '国学家训系列', image: '📜', price: 12.8, rarity: 'epic' },
  { id: '3', name: '诗词歌赋 #003', collection: '诗词系列', image: '✍️', price: 25.0, rarity: 'legendary' },
  { id: '4', name: '书法艺术 #004', collection: '书法系列', image: '🖌️', price: 2.5, rarity: 'common' },
  { id: '5', name: '山水意境 #005', collection: '山水系列', image: '🏔️', price: 8.5, rarity: 'rare' },
  { id: '6', name: '茶道精神 #006', collection: '茶道系列', image: '🍵', price: 6.8, rarity: 'epic' },
];

const rarityColors: Record<string, string> = {
  common: 'default',
  rare: 'blue',
  epic: 'purple',
  legendary: 'gold',
};

export default function UserNFTMarket() {
  const [sortBy, setSortBy] = useState<string>('popular');
  const [filterChain, setFilterChain] = useState<string>('all');
  const screens = useBreakpoint();

  return (
    <UserLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold m-0">NFT 市场</h1>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="24h 交易量"
                value={528.5}
                precision={1}
                suffix="ETH"
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="活跃用户"
                value={1258}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="NFT 总数"
                value={50000}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="地板价"
                value={1.8}
                precision={1}
                suffix="ETH"
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>

        <Card title="热门系列">
          <Row gutter={[16, 16]}>
            {mockNFTCollections.map((collection) => (
              <Col
                key={collection.id}
                xs={24}
                sm={12}
                md={8}
                lg={6}
              >
                <Card
                  hoverable
                  cover={
                    <div className="text-center py-8 bg-gray-50">
                      <Avatar size={80} style={{ fontSize: '48px' }}>
                        {collection.image}
                      </Avatar>
                    </div>
                  }
                  actions={[
                    <Button type="link" key="view">查看</Button>,
                    <Button type="primary" key="buy">购买</Button>,
                  ]}
                >
                  <Card.Meta
                    title={
                      <Space>
                        {collection.name}
                        {collection.trending && <Tag color="red">热门</Tag>}
                      </Space>
                    }
                    description={
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-500">地板价</span>
                          <span className="font-semibold">{collection.floorPrice} ETH</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">24h 交易</span>
                          <span className="text-green-600">{collection.volume24h} ETH</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">总数</span>
                          <span>{collection.items}</span>
                        </div>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        <Card
          title="精选 NFT"
          extra={
            <Space>
              <Input
                placeholder="搜索 NFT"
                prefix={<SearchOutlined />}
                style={{ width: 200 }}
              />
              <Select
                value={sortBy}
                onChange={setSortBy}
                style={{ width: 150 }}
              >
                <Option value="popular">热门</Option>
                <Option value="price-low">价格从低到高</Option>
                <Option value="price-high">价格从高到低</Option>
                <Option value="recent">最新</Option>
              </Select>
              <Select
                value={filterChain}
                onChange={setFilterChain}
                style={{ width: 120 }}
              >
                <Option value="all">全部链</Option>
                <Option value="ETH">ETH</Option>
                <Option value="Polygon">Polygon</Option>
                <Option value="BSC">BSC</Option>
              </Select>
              <Button icon={<FilterOutlined />}>筛选</Button>
            </Space>
          }
        >
          <Row gutter={[16, 16]}>
            {mockFeaturedNFTs.map((nft) => (
              <Col
                key={nft.id}
                xs={24}
                sm={12}
                md={8}
                lg={6}
              >
                <Card
                  hoverable
                  cover={
                    <div className="text-center py-8 bg-gradient-to-br from-blue-50 to-purple-50">
                      <Avatar size={120} style={{ fontSize: '72px' }}>
                        {nft.image}
                      </Avatar>
                    </div>
                  }
                  actions={[
                    <Button type="text" icon={<HeartOutlined />} key="like">128</Button>,
                    <Button type="primary" icon={<ShoppingCartOutlined />} key="buy">
                      购买
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    title={nft.name}
                    description={
                      <div className="space-y-2">
                        <div className="text-sm text-gray-500">{nft.collection}</div>
                        <Tag color={rarityColors[nft.rarity]}>{nft.rarity}</Tag>
                        <div className="text-xl font-bold text-green-600">
                          {nft.price} ETH
                        </div>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>

          <div className="text-center mt-6">
            <Button size="large">加载更多</Button>
          </div>
        </Card>
      </div>
    </UserLayout>
  );
}
