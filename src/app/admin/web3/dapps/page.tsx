﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿'use client';
import { logger } from '@/lib/logger';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Space,
  Tag,
  Modal,
  message,
  Form,
  Input,
  Select,
  Switch,
  Card,
  Descriptions,
  Avatar,
  Drawer,
  Badge,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  SearchOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  PlusOutlined,
  AppstoreOutlined,
  LockOutlined,
  UnlockOutlined,
  ThunderboltOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';

// 模拟 DApp 数据
const mockDApps = [
  {
    id: '1',
    name: '国学NFT交易平台',
    description: '区块链上的国学文化艺术品交易与展示平台',
    icon: '🎨',
    category: 'NFT',
    status: 'active',
    contractAddress: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1',
    webUrl: 'https://nft.zs.exchange',
    apiEndpoint: 'https://api.nft.zs.exchange/v1',
    permissions: ['read', 'write', 'nft_mint', 'nft_transfer'],
    owners: ['admin@zs.exchange', 'dev@zs.exchange'],
    stats: {
      users: 8520,
      transactions: 58400,
      volume: 15800000,
    },
    createdAt: '2024-01-15',
    updatedAt: '2024-05-10',
  },
  {
    id: '2',
    name: 'TokenSwapDEX',
    description: '去中心化代币交换平台，支持多链和低滑点交易',
    icon: '🔄',
    category: 'DeFi',
    status: 'active',
    contractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    webUrl: 'https://swap.zs.exchange',
    apiEndpoint: 'https://api.swap.zs.exchange/v1',
    permissions: ['read', 'write', 'swap', 'liquidity'],
    owners: ['dev@dex.io'],
    stats: {
      users: 5800,
      transactions: 32100,
      volume: 12500000,
    },
    createdAt: '2024-02-08',
    updatedAt: '2024-05-08',
  },
  {
    id: '3',
    name: 'ChainStaking',
    description: '多链质押挖矿服务，支持灵活存期和自动复利',
    icon: '💰',
    category: 'Staking',
    status: 'active',
    contractAddress: '0x1111111111111111111111111111111111111111',
    webUrl: 'https://stake.zs.exchange',
    apiEndpoint: 'https://api.stake.zs.exchange/v1',
    permissions: ['read', 'write', 'stake', 'claim'],
    owners: ['staking@zs.exchange'],
    stats: {
      users: 3200,
      transactions: 18500,
      volume: 8900000,
    },
    createdAt: '2024-02-25',
    updatedAt: '2024-05-05',
  },
  {
    id: '4',
    name: 'Web3内容生态',
    description: '去中心化内容创作与分发平台，创作者经济生态',
    icon: '📚',
    category: 'Content',
    status: 'pending',
    contractAddress: '',
    webUrl: 'https://content.zs.exchange',
    apiEndpoint: '',
    permissions: ['read'],
    owners: ['content@zs.exchange'],
    stats: {
      users: 2100,
      transactions: 0,
      volume: 0,
    },
    createdAt: '2024-04-20',
    updatedAt: '2024-04-20',
  },
  {
    id: '5',
    name: 'GameFi游戏',
    description: '链游生态，Play-to-Earn 游戏经济模型',
    icon: '🎮',
    category: 'GameFi',
    status: 'pending',
    contractAddress: '',
    webUrl: '',
    apiEndpoint: '',
    permissions: ['read'],
    owners: ['game@zs.exchange'],
    stats: {
      users: 1850,
      transactions: 0,
      volume: 0,
    },
    createdAt: '2024-05-01',
    updatedAt: '2024-05-01',
  },
];

// 分类选项
const categoryOptions = [
  { label: 'NFT', value: 'NFT' },
  { label: 'DeFi', value: 'DeFi' },
  { label: 'Staking', value: 'Staking' },
  { label: 'Content', value: 'Content' },
  { label: 'GameFi', value: 'GameFi' },
  { label: 'SocialFi', value: 'SocialFi' },
];

// 权限选项
const permissionOptions = [
  { label: '读权限', value: 'read' },
  { label: '写权限', value: 'write' },
  { label: 'NFT 铸造', value: 'nft_mint' },
  { label: 'NFT 转账', value: 'nft_transfer' },
  { label: '交易交换', value: 'swap' },
  { label: '流动性管理', value: 'liquidity' },
  { label: '质押管理', value: 'stake' },
  { label: '收益提取', value: 'claim' },
];

export default function DAppsPage() {
  const queryClient = useQueryClient();
  const [selectedDApp, setSelectedDApp] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['web3-dapps'],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 500));
      return { items: mockDApps, total: mockDApps.length, page: 1, pageSize: 10 };
    },
  });

  // 状态切换 mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await new Promise(r => setTimeout(r, 500));
      return { id, status };
    },
    onSuccess: () => {
      message.success('状态更新成功');
      queryClient.invalidateQueries({ queryKey: ['web3-dapps'] });
    },
    onError: () => message.error('更新失败'),
  });

  // 表格列
  const columns = [
    {
      title: 'DApp 信息',
      key: 'info',
      width: 200,
      render: (_: any, record: any) => (
        <div className="flex items-center gap-3">
          <Avatar className="text-xl bg-purple-100 text-purple-600">{record.icon}</Avatar>
          <div>
            <div className="font-semibold">{record.name}</div>
            <div className="text-gray-400 text-xs">{record.category}</div>
          </div>
        </div>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 250,
    },
    {
      title: '用户数',
      dataIndex: ['stats', 'users'],
      key: 'users',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '交易量',
      dataIndex: ['stats', 'volume'],
      key: 'volume',
      render: (val: number) => val > 0 ? `$${(val / 1000000).toFixed(2)}M` : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        let color = 'default';
        let text = '未知';
        if (status === 'active') { color = 'green'; text = '运行中'; }
        else if (status === 'pending') { color = 'blue'; text = '审核中'; }
        else if (status === 'offline') { color = 'default'; text = '已下线'; }
        else if (status === 'rejected') { color = 'red'; text = '已拒绝'; }
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
    },
  ];

  // 操作按钮
  const actions: any[] = [
    {
      key: 'view',
      label: '查看',
      icon: <EyeOutlined />,
      onClick: (record: any) => {
        setSelectedDApp(record);
        setDetailModalVisible(true);
      },
    },
    {
      key: 'toggle-status',
      label: (record: any) => record.status === 'active' ? '下线' : '上线',
      icon: (record: any) => record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />,
      danger: (record: any) => record.status === 'active',
      confirm: (record: any) => ({
        title: record.status === 'active' ? '确定下线该DApp吗？' : '确定上线该DApp吗？',
        onConfirm: () => {
          toggleStatusMutation.mutate({ id: record.id, status: record.status === 'active' ? 'offline' : 'active' });
        },
      }),
    },
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      type: 'primary',
      onClick: (record: any) => {
        setSelectedDApp(record);
        form.setFieldsValue(record);
        setDrawerVisible(true);
      },
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      danger: true,
      confirm: {
        title: '确定要删除该DApp吗？',
        description: '此操作不可恢复，请谨慎操作',
        onConfirm: () => message.success('已删除'),
      },
    },
  ];

  const handleCreate = () => {
    setSelectedDApp(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      await new Promise(r => setTimeout(r, 500));
      message.success(selectedDApp ? '更新成功' : '创建成功');
      setDrawerVisible(false);
      queryClient.invalidateQueries({ queryKey: ['web3-dapps'] });
    } catch (e) {
      logger.error(e);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <AppstoreOutlined className="text-2xl text-blue-600" />
          <h1 className="text-2xl font-bold m-0">DApp 接入管理</h1>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="DApp 总数" value={data?.items?.length || 0} prefix={<AppstoreOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="运行中" value={data?.items?.filter((d: any) => d.status === 'active').length || 0} valueStyle={{ color: '#3f8600' }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="审核中" value={data?.items?.filter((d: any) => d.status === 'pending').length || 0} valueStyle={{ color: '#1677FF' }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="总用户" value={data?.items?.reduce((sum: number, d: any) => sum + d.stats.users, 0) || 0} />
            </Card>
          </Col>
        </Row>

        <DataTable
          title=""
          columns={columns}
          dataSource={data?.items || []}
          loading={isLoading}
          showSearch
          searchPlaceholder="搜索DApp名称或描述"
          showFilter
          filterOptions={[
            { label: '全部', value: '' },
            { label: '运行中', value: 'active' },
            { label: '审核中', value: 'pending' },
            { label: '已下线', value: 'offline' },
          ]}
          actions={actions}
          showAdd
          addButtonText="新增 DApp"
          onAdd={handleCreate}
          onRefresh={refetch}
          rowKey="id"
          pagination={{
            total: data?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个 DApp`,
          }}
        />

        {/* DApp 详情弹窗 */}
        <Modal
          title="DApp 详情"
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          width={800}
          footer={null}
        >
          {selectedDApp && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b">
                <Avatar size={64} className="bg-purple-100 text-purple-600 text-3xl">{selectedDApp.icon}</Avatar>
                <div>
                  <h2 className="text-xl font-bold m-0">{selectedDApp.name}</h2>
                  <p className="text-gray-500 m-0">{selectedDApp.description}</p>
                  <Space className="mt-2">
                    <Tag color="blue">{selectedDApp.category}</Tag>
                    <Badge
                      status={selectedDApp.status === 'active' ? 'success' : selectedDApp.status === 'pending' ? 'warning' : 'default'}
                      text={selectedDApp.status === 'active' ? '运行中' : selectedDApp.status === 'pending' ? '审核中' : '已下线'}
                    />
                  </Space>
                </div>
              </div>

              <Descriptions bordered column={2}>
                <Descriptions.Item label="合约地址" span={2}>
                  <span className="font-mono text-sm">{selectedDApp.contractAddress || '-'}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Web 地址">
                  {selectedDApp.webUrl ? (
                    <a href={selectedDApp.webUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                      {selectedDApp.webUrl}
                    </a>
                  ) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="API 端点">
                  {selectedDApp.apiEndpoint || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="所有者">
                  {selectedDApp.owners?.join(', ') || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="权限列表">
                  <Space wrap>
                    {selectedDApp.permissions?.map((p: string) => (
                      <Tag key={p}>{p}</Tag>
                    ))}
                  </Space>
                </Descriptions.Item>
              </Descriptions>

              <h3 className="font-bold mt-4 mb-2">数据统计</h3>
              <Row gutter={16}>
                <Col span={8}>
                  <Card size="small">
                    <Statistic title="用户数" value={selectedDApp.stats.users} />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small">
                    <Statistic title="交易数" value={selectedDApp.stats.transactions} />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small">
                    <Statistic title="交易额" value={selectedDApp.stats.volume} precision={0} prefix="$" />
                  </Card>
                </Col>
              </Row>

              <Descriptions bordered column={2} className="mt-4">
                <Descriptions.Item label="创建时间">{selectedDApp.createdAt}</Descriptions.Item>
                <Descriptions.Item label="更新时间">{selectedDApp.updatedAt}</Descriptions.Item>
              </Descriptions>
            </div>
          )}
        </Modal>

        {/* 新增/编辑 Drawer */}
        <Drawer
          title={selectedDApp ? '编辑 DApp' : '新增 DApp'}
          width={600}
          open={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={() => setDrawerVisible(false)}>取消</Button>
              <Button type="primary" onClick={handleSubmit} loading={false}>
                {selectedDApp ? '更新' : '创建'}
              </Button>
            </div>
          }
        >
          <Form form={form} layout="vertical" className="mt-4">
            <Form.Item
              name="name"
              label="DApp 名称"
              rules={[{ required: true, message: '请输入名称' }]}
            >
              <Input placeholder="请输入 DApp 名称" prefix={<AppstoreOutlined />} />
            </Form.Item>

            <Form.Item name="icon" label="图标 (emoji)">
              <Input placeholder="例如: 🎨" maxLength={2} />
            </Form.Item>

            <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
              <Select options={categoryOptions} placeholder="请选择分类" />
            </Form.Item>

            <Form.Item name="description" label="描述">
              <Input.TextArea rows={4} placeholder="请输入 DApp 描述" />
            </Form.Item>

            <Form.Item name="contractAddress" label="智能合约地址">
              <Input placeholder="0x..." prefix={<ThunderboltOutlined />} />
            </Form.Item>

            <Form.Item name="webUrl" label="Web 地址">
              <Input placeholder="https://" />
            </Form.Item>

            <Form.Item name="apiEndpoint" label="API 端点">
              <Input placeholder="https://api..." prefix={<ApiOutlined />} />
            </Form.Item>

            <Form.Item name="permissions" label="权限列表">
              <Select
                mode="multiple"
                options={permissionOptions}
                placeholder="请选择权限"
              />
            </Form.Item>

            <Form.Item name="owners" label="管理员 (邮箱)">
              <Select mode="tags" placeholder="输入邮箱地址" open={false} />
            </Form.Item>

            <Form.Item name="status" label="状态" valuePropName="checked">
              <Select
                options={[
                  { label: '草稿', value: 'draft' },
                  { label: '提交审核', value: 'pending' },
                  { label: '上线', value: 'active' },
                ]}
              />
            </Form.Item>
          </Form>
        </Drawer>
      </div>
    </AdminLayout>
  );
}
