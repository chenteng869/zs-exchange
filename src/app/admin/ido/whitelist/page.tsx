'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, Select, Badge, Statistic } from 'antd';
import { UserOutlined, PlusOutlined, EyeOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;

const mockWhitelist = [
  { id: '1', walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f6E391', username: 'whale_001', tier: 'gold', status: 'approved', createdAt: '2024-05-01' },
  { id: '2', walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', username: 'vip_user', tier: 'platinum', status: 'approved', createdAt: '2024-05-02' },
  { id: '3', walletAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', username: 'investor_2024', tier: 'silver', status: 'pending', createdAt: '2024-05-10' },
  { id: '4', walletAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', username: 'web3_pro', tier: 'gold', status: 'approved', createdAt: '2024-05-05' },
  { id: '5', walletAddress: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', username: 'nft_collector', tier: 'platinum', status: 'approved', createdAt: '2024-05-08' },
];

const whitelistColumns = [
  { title: '钱包地址', dataIndex: 'walletAddress', key: 'walletAddress', render: (text: string) => <code className="text-sm text-blue-600">{text}</code> },
  { title: '用户名', dataIndex: 'username', key: 'username' },
  { 
    title: '等级', 
    dataIndex: 'tier', 
    key: 'tier', 
    render: (tier: string) => {
      const tiers: Record<string, { color: string; label: string }> = {
        platinum: { color: 'purple', label: '铂金' },
        gold: { color: 'gold', label: '黄金' },
        silver: { color: 'cyan', label: '白银' },
      };
      const t = tiers[tier];
      return <Tag color={t?.color}>{t?.label}</Tag>;
    },
  },
  { 
    title: '状态', 
    dataIndex: 'status', 
    key: 'status', 
    render: (status: string) => {
      const config: Record<string, { color: 'success' | 'processing' | 'default'; label: string }> = {
        approved: { color: 'success', label: '已通过' },
        pending: { color: 'processing', label: '审核中' },
        rejected: { color: 'default', label: '已拒绝' },
      };
      const c = config[status];
      return <Badge status={c?.color} text={c?.label} />;
    },
  },
  { title: '添加时间', dataIndex: 'createdAt', key: 'createdAt' },
  { 
    title: '操作', 
    key: 'action', 
    render: (_: any, record: any) => (
      <Space size="small">
        <Button type="link" size="small" icon={<EyeOutlined />}>详情</Button>
        {record.status === 'pending' && (
          <Button type="link" size="small">通过</Button>
        )}
        {record.status !== 'rejected' && (
          <Button type="link" size="small" danger>移除</Button>
        )}
      </Space>
    ),
  },
];

const mockProjects = [
  { id: '1', name: 'GXT Protocol', symbol: 'GXT' },
  { id: '2', name: 'MetaVerse Chain', symbol: 'MVC' },
];

export default function IDOWhitelistPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const totalWhitelist = mockWhitelist.length;
  const approvedCount = mockWhitelist.filter(w => w.status === 'approved').length;
  const pendingCount = mockWhitelist.filter(w => w.status === 'pending').length;
  const platinumCount = mockWhitelist.filter(w => w.tier === 'platinum').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserOutlined className="text-2xl text-blue-600" />
            <h1 className="text-2xl font-bold m-0">白名单管理</h1>
          </div>
          <Space>
            <Button icon={<UploadOutlined />}>批量导入</Button>
            <Button icon={<DownloadOutlined />}>导出名单</Button>
            <Button type="primary" icon={<PlusOutlined />}>添加地址</Button>
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="白名单总数" value={totalWhitelist} valueStyle={{ color: '#1677FF' }} />
              <div className="text-gray-400 text-sm mt-1">已添加地址数</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="已通过" value={approvedCount} suffix={`/${totalWhitelist}`} valueStyle={{ color: '#16A34A' }} />
              <div className="text-gray-400 text-sm mt-1">审核通过数量</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="审核中" value={pendingCount} valueStyle={{ color: '#F59E0B' }} />
              <div className="text-gray-400 text-sm mt-1">待审核数量</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="铂金用户" value={platinumCount} valueStyle={{ color: '#7C3AED' }} />
              <div className="text-gray-400 text-sm mt-1">VIP等级用户</div>
            </Card>
          </Col>
        </Row>

        <Card title="白名单列表">
          <div className="mb-4">
            <Select placeholder="选择项目" style={{ width: 200, marginRight: 16 }}>
              {mockProjects.map(p => (
                <Option key={p.id} value={p.id}>{p.name} ({p.symbol})</Option>
              ))}
            </Select>
            <Select placeholder="选择等级" style={{ width: 150, marginRight: 16 }}>
              <Option value="all">全部等级</Option>
              <Option value="platinum">铂金</Option>
              <Option value="gold">黄金</Option>
              <Option value="silver">白银</Option>
            </Select>
            <Select placeholder="选择状态" style={{ width: 150 }}>
              <Option value="all">全部状态</Option>
              <Option value="approved">已通过</Option>
              <Option value="pending">审核中</Option>
              <Option value="rejected">已拒绝</Option>
            </Select>
          </div>
          <Table
            dataSource={mockWhitelist}
            columns={whitelistColumns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        <Modal
          title="添加白名单地址"
          open={isModalVisible}
          onOk={() => {
            form.validateFields().then(() => {
              Modal.success({ title: '操作成功', content: '地址已添加！' });
              setIsModalVisible(false);
            });
          }}
          onCancel={() => setIsModalVisible(false)}
          width={500}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="钱包地址" name="walletAddress" rules={[{ required: true, message: '请输入钱包地址' }]}>
              <Input placeholder="0x..." />
            </Form.Item>
            <Form.Item label="用户名" name="username">
              <Input placeholder="可选，用户昵称" />
            </Form.Item>
            <Form.Item label="用户等级" name="tier" rules={[{ required: true, message: '请选择等级' }]}>
              <Select placeholder="请选择等级">
                <Option value="platinum">铂金</Option>
                <Option value="gold">黄金</Option>
                <Option value="silver">白银</Option>
              </Select>
            </Form.Item>
            <Form.Item label="关联项目" name="projectId">
              <Select placeholder="选择项目（可选）">
                {mockProjects.map(p => (
                  <Option key={p.id} value={p.id}>{p.name} ({p.symbol})</Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}