'use client';

import React, { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Select, Image } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, SearchOutlined, GiftOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;

interface NFT {
  id: string;
  name: string;
  collection: string;
  chain: string;
  tokenId: string;
  image: string;
  owner: string;
  status: string;
  value: string;
  attributes: string[];
}

const mockNFTs: NFT[] = [
  { id: '1', name: 'Guo Xue Calligraphy #1', collection: 'Chinese Heritage', chain: 'Ethereum', tokenId: '1', image: 'https://picsum.photos/200/200?random=1', owner: '0x742d35Cc...22A8', status: 'held', value: '2.5 ETH', attributes: ['Rare', 'Limited', 'Calligraphy'] },
  { id: '2', name: 'Ancient Scroll #5', collection: 'Chinese Heritage', chain: 'BSC', tokenId: '5', image: 'https://picsum.photos/200/200?random=2', owner: '0x1a2b3c4d...r9s0t', status: 'listed', value: '1.8 BNB', attributes: ['Common', 'Scroll'] },
  { id: '3', name: 'Digital Seal #3', collection: 'Imperial Seals', chain: 'Polygon', tokenId: '3', image: 'https://picsum.photos/200/200?random=3', owner: 'Internal', status: 'held', value: '500 MATIC', attributes: ['Legendary', 'Seal', 'Gold'] },
  { id: '4', name: 'Poem Master #8', collection: 'Tang Dynasty', chain: 'Ethereum', tokenId: '8', image: 'https://picsum.photos/200/200?random=4', owner: '0xAbC123De...012345', status: 'held', value: '0.8 ETH', attributes: ['Epic', 'Poem', 'Tang'] },
  { id: '5', name: 'Zen Garden #12', collection: 'Chinese Heritage', chain: 'TRON', tokenId: '12', image: 'https://picsum.photos/200/200?random=5', owner: 'TQmKd12x...1f4a5', status: 'transferring', value: '10000 TRX', attributes: ['Rare', 'Zen', 'Garden'] },
];

export default function NFTAssetsPage() {
  const [selectedStatus, setSelectedStatus] = useState('all');

  const columns = [
    { 
      title: 'NFT', 
      key: 'nft', 
      width: 200,
      render: (_: any, record: NFT) => (
        <div className="flex items-center gap-3">
          <Image src={record.image} width={60} height={60} style={{ borderRadius: '8px' }} />
          <div className="flex flex-col">
            <span className="font-semibold">{record.name}</span>
            <span className="text-xs text-gray-500">#{record.tokenId}</span>
          </div>
        </div>
      )
    },
    { title: '系列', dataIndex: 'collection', key: 'collection' },
    { title: '公链', dataIndex: 'chain', key: 'chain' },
    { title: '持有者', dataIndex: 'owner', key: 'owner', render: (text: string) => <span className="font-mono text-sm">{text}</span> },
    { 
      title: '属性', 
      key: 'attributes',
      render: (_: any, record: NFT) => (
        <div className="flex flex-wrap gap-1">
          {record.attributes.map((attr, idx) => (
            <Tag key={idx} color="blue">{attr}</Tag>
          ))}
        </div>
      )
    },
    { title: '价值', dataIndex: 'value', key: 'value', render: (text: string) => <span className="font-semibold">{text}</span> },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          held: 'green',
          listed: 'blue',
          transferring: 'orange'
        };
        const labels: Record<string, string> = {
          held: '持有中',
          listed: '挂牌中',
          transferring: '转移中'
        };
        return <Tag color={colors[status] || 'gray'}>{labels[status] || status}</Tag>;
      }
    },
    { 
      title: '操作', 
      key: 'action',
      render: (_: any, record: NFT) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />}>查看</Button>
          <Button type="link" size="small" icon={<EditOutlined />}>管理</Button>
        </Space>
      )
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GiftOutlined className="text-2xl text-indigo-600" />
            <h1 className="text-2xl font-bold m-0">NFT资产</h1>
          </div>
          <Space>
            <Select 
              placeholder="筛选状态" 
              style={{ width: 150 }} 
              value={selectedStatus}
              onChange={setSelectedStatus}
            >
              <Option value="all">全部</Option>
              <Option value="held">持有中</Option>
              <Option value="listed">挂牌中</Option>
              <Option value="transferring">转移中</Option>
            </Select>
            <Select placeholder="筛选公链" style={{ width: 150 }}>
              <Option value="all">全部</Option>
              <Option value="Ethereum">Ethereum</Option>
              <Option value="BSC">BSC</Option>
              <Option value="Polygon">Polygon</Option>
              <Option value="TRON">TRON</Option>
            </Select>
          </Space>
        </div>

        <Row gutter={16} className="mb-4">
          <Col span={6}>
            <Card>
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600">{mockNFTs.length}</div>
                <div className="text-gray-500">总NFT数</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">3</div>
                <div className="text-gray-500">持有中</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">1</div>
                <div className="text-gray-500">挂牌中</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">3</div>
                <div className="text-gray-500">系列数</div>
              </div>
            </Card>
          </Col>
        </Row>

        <Card>
          <Table
            dataSource={mockNFTs}
            columns={columns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>
      </div>
    </AdminLayout>
  );
}