'use client';

import React, { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Form, Input, Select, Statistic, Tree, TreeSelect } from 'antd';
import { UserOutlined, GiftOutlined, ShareAltOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;

interface ReferralNode {
  title: string;
  key: string;
  children?: ReferralNode[];
}

interface ReferralRecord {
  id: string;
  userId: string;
  userAddress: string;
  referrerId: string;
  level: number;
  directReferrals: number;
  totalReferrals: number;
  rewards: string;
  joinedAt: string;
}

const mockReferrals: ReferralRecord[] = [
  { id: '1', userId: 'usr-001', userAddress: '0x742d35Cc...22A8', referrerId: '-', level: 0, directReferrals: 5, totalReferrals: 25, rewards: '500 GXT', joinedAt: '2026-01-15' },
  { id: '2', userId: 'usr-002', userAddress: '0x1a2b3c4d...r9s0t', referrerId: 'usr-001', level: 1, directReferrals: 3, totalReferrals: 8, rewards: '200 GXT', joinedAt: '2026-02-20' },
  { id: '3', userId: 'usr-003', userAddress: 'bc1qxy2kg...hx0wlh', referrerId: 'usr-001', level: 1, directReferrals: 2, totalReferrals: 5, rewards: '150 GXT', joinedAt: '2026-02-25' },
  { id: '4', userId: 'usr-004', userAddress: '0xAbC123De...012345', referrerId: 'usr-002', level: 2, directReferrals: 1, totalReferrals: 1, rewards: '50 GXT', joinedAt: '2026-03-10' },
  { id: '5', userId: 'usr-005', userAddress: 'TQmKd12x...1f4a5', referrerId: 'usr-002', level: 2, directReferrals: 0, totalReferrals: 0, rewards: '30 GXT', joinedAt: '2026-03-15' },
];

const treeData: ReferralNode[] = [
  {
    title: 'usr-001 (一级)',
    key: 'usr-001',
    children: [
      {
        title: 'usr-002 (二级)',
        key: 'usr-002',
        children: [
          { title: 'usr-004 (三级)', key: 'usr-004' },
          { title: 'usr-005 (三级)', key: 'usr-005' },
        ],
      },
      { title: 'usr-003 (二级)', key: 'usr-003' },
    ],
  },
];

export default function ReferralPage() {
  const [selectedUser, setSelectedUser] = useState('');

  const columns = [
    { title: '用户ID', dataIndex: 'userId', key: 'userId', render: (text: string) => <span className="font-mono text-sm">{text}</span> },
    { title: '钱包地址', dataIndex: 'userAddress', key: 'userAddress', render: (text: string) => <span className="font-mono text-sm">{text}</span> },
    { title: '推荐人', dataIndex: 'referrerId', key: 'referrerId', render: (text: string) => text === '-' ? <span className="text-gray-400">无</span> : <span className="font-mono text-sm">{text}</span> },
    { 
      title: '层级', 
      dataIndex: 'level', 
      key: 'level',
      render: (level: number) => (
        <Tag color={level === 0 ? 'red' : level === 1 ? 'orange' : 'blue'}>
          {level === 0 ? '一级' : level === 1 ? '二级' : '三级'}
        </Tag>
      )
    },
    { title: '直接推荐', dataIndex: 'directReferrals', key: 'directReferrals' },
    { title: '团队人数', dataIndex: 'totalReferrals', key: 'totalReferrals' },
    { title: '推荐奖励', dataIndex: 'rewards', key: 'rewards' },
    { title: '加入时间', dataIndex: 'joinedAt', key: 'joinedAt' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShareAltOutlined className="text-2xl text-indigo-600" />
            <h1 className="text-2xl font-bold m-0">推荐关系</h1>
          </div>
        </div>

        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic title="总用户数" value="1,250" prefix={<UserOutlined />} valueStyle={{ color: '#1677FF' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="一级用户" value="150" suffix="人" valueStyle={{ color: '#DC2626' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="二级用户" value="450" suffix="人" valueStyle={{ color: '#F59E0B' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="累计奖励" value="50,000" suffix=" GXT" prefix={<GiftOutlined />} valueStyle={{ color: '#3f8600' }} />
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Card title="推荐关系树">
              <Tree
                defaultExpandAll
                treeData={treeData}
                style={{ maxHeight: 400, overflowY: 'auto' }}
              />
            </Card>
          </Col>
          <Col span={16}>
            <Card title="推荐列表">
              <div className="flex gap-4 mb-4">
                <Form layout="inline">
                  <Form.Item>
                    <Input 
                      placeholder="搜索用户ID" 
                      style={{ width: 200 }}
                    />
                  </Form.Item>
                  <Form.Item>
                    <Select placeholder="筛选层级" style={{ width: 120 }}>
                      <Option value="all">全部层级</Option>
                      <Option value="0">一级</Option>
                      <Option value="1">二级</Option>
                      <Option value="2">三级</Option>
                    </Select>
                  </Form.Item>
                </Form>
              </div>

              <Table
                dataSource={mockReferrals}
                columns={columns}
                pagination={{ pageSize: 10 }}
                rowKey="id"
              />
            </Card>
          </Col>
        </Row>
      </div>
    </AdminLayout>
  );
}