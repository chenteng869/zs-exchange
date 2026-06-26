'use client';

import React, { useState } from 'react';
import { Row, Col, Tag, Badge, Modal, Form, Input, InputNumber, Select, Button, message, Space, Typography } from 'antd';
import {
  ThunderboltOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FireOutlined,
  ApiOutlined,
  HourglassOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { TextArea } = Input;
const { Option } = Select;

const mockMints = [
  { id: 'MINT-001', nftName: 'Cyber Genesis #001-100', quantity: 100, chain: 'ETH', gasUsed: 0.45, status: 'completed', createdAt: '2026-06-22 14:30' },
  { id: 'MINT-002', nftName: 'Digital Dreams #001-50', quantity: 50, chain: 'ETH', gasUsed: 0.28, status: 'completed', createdAt: '2026-06-22 11:20' },
  { id: 'MINT-003', nftName: 'Meta Avatars #001-200', quantity: 200, chain: 'Polygon', gasUsed: 0.08, status: 'minting', createdAt: '2026-06-23 09:15' },
  { id: 'MINT-004', nftName: 'Pixel Worlds #001-300', quantity: 300, chain: 'ARB', gasUsed: 0.02, status: 'pending', createdAt: '2026-06-23 10:00' },
  { id: 'MINT-005', nftName: 'Abstract Art Vol.3', quantity: 150, chain: 'ETH', gasUsed: 0.52, status: 'completed', createdAt: '2026-06-21 16:45' },
  { id: 'MINT-006', nftName: 'Music NFT Collection', quantity: 80, chain: 'Base', gasUsed: 0.01, status: 'failed', createdAt: '2026-06-21 09:30' },
  { id: 'MINT-007', nftName: 'Sports Legends 2026', quantity: 256, chain: 'ETH', gasUsed: 0.68, status: 'completed', createdAt: '2026-06-20 14:00' },
  { id: 'MINT-008', nftName: 'AI Generated Arts', quantity: 500, chain: 'Solana', gasUsed: 0.005, status: 'pending', createdAt: '2026-06-23 08:30' },
  { id: 'MINT-009', nftName: 'Vintage Photos #001', quantity: 50, chain: 'ETH', gasUsed: 0.18, status: 'completed', createdAt: '2026-06-19 11:20' },
  { id: 'MINT-010', nftName: 'Gaming Skins Bundle', quantity: 1000, chain: 'Immutable', gasUsed: 0.003, status: 'minting', createdAt: '2026-06-23 07:00' },
];

export default function NFTMintPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleCreateMint = () => {
    form.validateFields().then((values) => {
      message.success(`铸造任务已创建: ${values.nftName}`);
      setModalOpen(false);
      form.resetFields();
    });
  };

  const columns = [
    {
      title: '铸造ID',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <span className="font-mono text-sm">{text}</span>,
    },
    {
      title: 'NFT名称',
      dataIndex: 'nftName',
      key: 'nftName',
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '链',
      dataIndex: 'chain',
      key: 'chain',
      render: (chain: string) => {
        const colors: Record<string, string> = {
          ETH: 'blue',
          Polygon: 'purple',
          ARB: 'green',
          Solana: 'cyan',
          Base: 'geekblue',
          Immutable: 'orange',
        };
        return <Tag color={colors[chain] || 'default'}>{chain}</Tag>;
      },
    },
    {
      title: 'Gas费',
      dataIndex: 'gasUsed',
      key: 'gasUsed',
      render: (val: number) => <span>{val.toFixed(3)} ETH</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const map: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
          completed: { color: 'success', icon: <CheckCircleOutlined />, text: '已完成' },
          minting: { color: 'processing', icon: <ThunderboltOutlined />, text: '铸造中' },
          pending: { color: 'warning', icon: <ClockCircleOutlined />, text: '排队中' },
          failed: { color: 'error', icon: <CloseCircleOutlined />, text: '失败' },
        };
        const item = map[status];
        return item ? <Badge status={item.color as any} text={item.text} /> : status;
      },
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
  ];

  const actions: any[] = [
    {
      key: 'view',
      label: '查看',
      icon: <EyeOutlined />,
      type: 'link',
    },
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      type: 'link',
      hidden: () => false,
    },
    {
      key: 'delete',
      label: '取消',
      icon: <DeleteOutlined />,
      type: 'link',
      danger: true,
      confirm: {
        title: '确认取消该铸造任务？',
        description: '取消后无法恢复，Gas费可能无法退还',
        onConfirm: () => message.success('任务已取消'),
      },
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 标题区 */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#0F1B3D' }}>
            <ThunderboltOutlined style={{ color: '#F0B90B' }} />
            NFT铸造工坊
          </h1>
          <p className="text-gray-500 mt-2">批量铸造 · 多链部署 · Gas优化 · 进度追踪</p>
        </div>

        {/* DataCards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="铸造中"
              value={3}
              icon={<ThunderboltOutlined />}
              color="#1677FF"
              suffix="个任务"
              trend="up"
              trendValue="+1"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="已完成"
              value={156}
              icon={<CheckCircleOutlined />}
              color="#16A34A"
              suffix="批次"
              trend="up"
              trendValue="+12"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="今日铸造"
              value={1280}
              icon={<FireOutlined />}
              color="#F59E0B"
              suffix="件"
              trend="up"
              trendValue="+28%"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="Gas总消耗"
              value={12.58}
              icon={<ApiOutlined />}
              color="#7C3AED"
              prefix="Ξ"
              suffix="ETH"
              trend="down"
              trendValue="-5.2%"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="平均确认"
              value={45}
              icon={<HourglassOutlined />}
              color="#06B6D4"
              suffix="秒"
              description="Layer2: 8秒"
            />
          </Col>
        </Row>

        {/* DataTable */}
        <DataTable
          columns={columns}
          dataSource={mockMints}
          rowKey="id"
          title="铸造任务列表"
          searchPlaceholder="搜索铸造任务..."
          showFilter
          filterOptions={[
            { label: '全部状态', value: '' },
            { label: '铸造中', value: 'minting' },
            { label: '已完成', value: 'completed' },
            { label: '排队中', value: 'pending' },
            { label: '失败', value: 'failed' },
          ]}
          actions={actions}
          onAdd={() => setModalOpen(true)}
          addButtonText="新建铸造任务"
        />

        {/* 新建铸造Modal */}
        <Modal
          title="新建铸造任务"
          open={modalOpen}
          onCancel={() => { setModalOpen(false); form.resetFields(); }}
          onOk={handleCreateMint}
          okText="开始铸造"
          cancelText="取消"
          width={600}
        >
          <Form form={form} layout="vertical" className="mt-4">
            <Form.Item name="nftName" label="NFT系列名称" rules={[{ required: true, message: '请输入NFT名称' }]}>
              <Input placeholder="例: Cyber Genesis Collection" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="quantity" label="铸造数量" rules={[{ required: true, message: '请输入数量' }]}>
                  <InputNumber min={1} max={10000} style={{ width: '100%' }} placeholder="1-10000" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="chain" label="目标链" rules={[{ required: true, message: '请选择目标链' }]}>
                  <Select placeholder="选择区块链">
                    <Option value="ETH">Ethereum</Option>
                    <Option value="Polygon">Polygon</Option>
                    <Option value="ARB">Arbitrum</Option>
                    <Option value="Base">Base</Option>
                    <Option value="Solana">Solana</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="description" label="描述">
              <TextArea rows={3} placeholder="输入NFT描述信息..." />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}

function CloseCircleOutlined(props: any) {
  return (
    <svg {...props} viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor">
      <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm165.4 618.2l-66-.3L512 563.4l-99.3 118.4-66.1.3c-4.4 0-8-3.5-8-8 0-1.9.7-3.7 1.9-5.2l130.1-155L340.5 359c-1.2-1.5-1.9-3.3-1.9-5.2 0-4.4 3.6-8 8-8l66.1.3L512 464.6l99.3-118.4 66-.3c4.4 0 8 3.5 8 8 0 1.9-.7 3.7-1.9 5.2L553.5 514l130 155c1.2 1.5 1.9 3.3 1.9 5.2 0 4.4-3.6 8-8 8z"/>
    </svg>
  );
}
