'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Space,
  Tag,
  Modal,
  message,
  Descriptions,
  Avatar,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  EditOutlined,
  EyeOutlined,
  LockOutlined,
  UnlockOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';

// 模拟数据
const mockUsers = [
  {
    id: '1',
    username: 'user_001',
    email: 'user001@example.com',
    phone: '13800138000',
    walletAddress: '0x1234...5678',
    did: 'did:example:user001',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
    kycStatus: 'approved',
    userLevel: 3,
    isActive: true,
    inviteCode: 'INV001',
    inviterId: 'system',
    totalAssets: 15890.50,
    totalTransactions: 128,
    createdAt: '2026-04-30 10:30',
    updatedAt: '2026-05-10 08:00',
  },
  {
    id: '2',
    username: 'creator_002',
    email: 'creator002@example.com',
    phone: '13800138001',
    walletAddress: '0xabc1...def2',
    did: 'did:example:creator002',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
    kycStatus: 'approved',
    userLevel: 4,
    isActive: true,
    inviteCode: 'INV002',
    inviterId: '1',
    totalAssets: 85400.25,
    totalTransactions: 520,
    createdAt: '2026-04-20 15:20',
    updatedAt: '2026-05-09 22:00',
  },
  {
    id: '3',
    username: 'user_003',
    email: 'user003@example.com',
    phone: '13800138002',
    walletAddress: '0x9876...5432',
    did: '',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
    kycStatus: 'pending',
    userLevel: 2,
    isActive: false,
    inviteCode: 'INV003',
    inviterId: '2',
    totalAssets: 0,
    totalTransactions: 5,
    createdAt: '2026-04-10 09:15',
    updatedAt: '2026-05-07 14:30',
  },
  {
    id: '4',
    username: 'nft_lover',
    email: 'nft@example.com',
    phone: '13800138003',
    walletAddress: '0x4444...4444',
    did: 'did:example:nftlover',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4',
    kycStatus: 'approved',
    userLevel: 3,
    isActive: true,
    inviteCode: 'INV004',
    inviterId: '1',
    totalAssets: 52000.00,
    totalTransactions: 256,
    createdAt: '2026-04-25 11:45',
    updatedAt: '2026-05-10 09:00',
  },
  {
    id: '5',
    username: 'newbie_005',
    email: 'newbie@example.com',
    phone: '',
    walletAddress: '',
    did: '',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5',
    kycStatus: 'not_started',
    userLevel: 1,
    isActive: true,
    inviteCode: 'INV005',
    inviterId: null,
    totalAssets: 0,
    totalTransactions: 0,
    createdAt: '2026-05-10 08:00',
    updatedAt: '2026-05-10 08:00',
  },
];

// KYC 状态映射
const KYC_STATUS_MAP = {
  not_started: { color: 'default', text: '未开始' },
  pending: { color: 'blue', text: '审核中' },
  approved: { color: 'green', text: '已通过' },
  rejected: { color: 'red', text: '已拒绝' },
};

// 用户等级颜色
const LEVEL_COLORS = {
  1: 'grey',
  2: 'blue',
  3: 'purple',
  4: 'orange',
  5: 'gold',
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [kycFilter, setKycFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // 查询用户列表
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['users', searchKeyword, kycFilter, statusFilter],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filtered = [...mockUsers];
      
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        filtered = filtered.filter(u => 
          u.username.toLowerCase().includes(keyword) ||
          u.email.toLowerCase().includes(keyword) ||
          u.phone.includes(keyword) ||
          u.walletAddress.toLowerCase().includes(keyword)
        );
      }
      
      if (kycFilter) {
        filtered = filtered.filter(u => u.kycStatus === kycFilter);
      }
      
      if (statusFilter) {
        filtered = filtered.filter(u => 
          statusFilter === 'active' ? u.isActive : !u.isActive
        );
      }
      
      return { items: filtered, total: filtered.length, page: 1, pageSize: 10 };
    },
  });

  // 切换用户状态
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { id, isActive };
    },
    onSuccess: (_, { isActive }) => {
      message.success(isActive ? '用户已启用' : '用户已禁用');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => {
      message.error('操作失败');
    },
  });

  // 表格列定义
  const columns = [
    {
      title: '用户信息',
      key: 'userInfo',
      width: 200,
      render: (_: any, record: any) => (
        <Space>
          <Avatar 
            src={record.avatar} 
            icon={<UserOutlined />}
            size={40}
          />
          <div>
            <div className="font-semibold">{record.username}</div>
            <div className="text-gray-500 text-xs">{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '钱包地址',
      dataIndex: 'walletAddress',
      key: 'walletAddress',
      width: 140,
      render: (text: string) => text ? (
        <Space>
          <WalletOutlined className="text-gray-400" />
          <span className="font-mono text-xs">{text}</span>
        </Space>
      ) : '-',
    },
    {
      title: 'KYC状态',
      dataIndex: 'kycStatus',
      key: 'kycStatus',
      width: 120,
      render: (status: string) => {
        const s = KYC_STATUS_MAP[status as keyof typeof KYC_STATUS_MAP] || KYC_STATUS_MAP.not_started;
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '等级',
      dataIndex: 'userLevel',
      key: 'userLevel',
      width: 100,
      render: (level: number) => (
        <Tag color={LEVEL_COLORS[level as keyof typeof LEVEL_COLORS]}>
          Level {level}
        </Tag>
      ),
    },
    {
      title: '总资产(USD)',
      dataIndex: 'totalAssets',
      key: 'totalAssets',
      width: 120,
      render: (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    },
    {
      title: '交易笔数',
      dataIndex: 'totalTransactions',
      key: 'totalTransactions',
      width: 100,
    },
    {
      title: '账户状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '正常' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => date,
    },
  ];

  // 操作按钮
  const actions: any[] = [
    {
      key: 'view',
      label: '查看',
      icon: <EyeOutlined />,
      onClick: (record: any) => {
        setSelectedUser(record);
        setDetailModalVisible(true);
      },
    },
    {
      key: 'toggle-status',
      label: (record: any) => record.isActive ? '禁用' : '启用',
      icon: (record: any) => record.isActive ? <LockOutlined /> : <UnlockOutlined />,
      danger: (record: any) => record.isActive,
      confirm: (record: any) => ({
        title: record.isActive ? '确定要禁用该用户吗？' : '确定要启用该用户吗？',
        description: record.isActive 
          ? '禁用后用户将无法登录和使用平台功能'
          : '启用后用户将恢复所有权限',
        onConfirm: () => {
          toggleStatusMutation.mutate({ id: record.id, isActive: !record.isActive });
        },
      }),
    },
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      type: 'default',
      onClick: (record: any) => {
        message.info('编辑功能开发中');
      },
    },
  ];

  // 筛选选项
  const filterOptions = [
    { label: '全部状态', value: '' },
    { label: '正常用户', value: 'active' },
    { label: '禁用用户', value: 'inactive' },
  ];

  const kycFilterOptions = [
    { label: '全部 KYC 状态', value: '' },
    { label: '未开始', value: 'not_started' },
    { label: '审核中', value: 'pending' },
    { label: '已通过', value: 'approved' },
    { label: '已拒绝', value: 'rejected' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold m-0">用户管理</h1>
          <Space>
            <Button type="primary" icon={<EditOutlined />}>
              批量操作
            </Button>
          </Space>
        </div>

        <DataTable
          title=""
          columns={columns}
          dataSource={data?.items || []}
          loading={isLoading}
          showSearch
          searchPlaceholder="搜索用户名、邮箱或钱包地址"
          onSearch={setSearchKeyword}
          showFilter
          filterOptions={filterOptions}
          onFilter={setStatusFilter}
          actions={actions}
          rowKey="id"
          onRefresh={refetch}
          pagination={{
            total: data?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </div>

      {/* 用户详情弹窗 */}
      <Modal
        title="用户详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          <Button key="edit" type="primary">
            编辑用户
          </Button>,
        ]}
        width={800}
      >
        {selectedUser && (
          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="flex items-center gap-4 pb-4 border-b">
              <Avatar 
                src={selectedUser.avatar} 
                size={80}
                icon={<UserOutlined />}
              />
              <div>
                <h2 className="text-xl font-bold m-0">{selectedUser.username}</h2>
                <p className="text-gray-500 m-0">用户 ID: {selectedUser.id}</p>
                <Space className="mt-2">
                  <Tag color={selectedUser.isActive ? 'green' : 'red'}>
                    {selectedUser.isActive ? '账户正常' : '账户已禁用'}
                  </Tag>
                  <Tag color={LEVEL_COLORS[selectedUser.userLevel as keyof typeof LEVEL_COLORS]}>
                    Level {selectedUser.userLevel}
                  </Tag>
                </Space>
              </div>
            </div>

            <Descriptions bordered column={2}>
              <Descriptions.Item label="邮箱">{selectedUser.email}</Descriptions.Item>
              <Descriptions.Item label="手机号">{selectedUser.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="钱包地址">
                {selectedUser.walletAddress ? (
                  <span className="font-mono">{selectedUser.walletAddress}</span>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="DID">
                {selectedUser.did || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="KYC 状态">
                {(() => {
                  const s = KYC_STATUS_MAP[selectedUser.kycStatus as keyof typeof KYC_STATUS_MAP];
                  return <Tag color={s.color}>{s.text}</Tag>;
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="邀请码">
                {selectedUser.inviteCode || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="注册时间">
                {selectedUser.createdAt}
              </Descriptions.Item>
              <Descriptions.Item label="最近更新">
                {selectedUser.updatedAt}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <h3 className="font-bold mb-4">资产概览</h3>
            <Descriptions bordered column={3}>
              <Descriptions.Item label="总资产">
                <span className="text-lg font-bold text-green-600">
                  ${selectedUser.totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="累计交易">
                {selectedUser.totalTransactions} 笔
              </Descriptions.Item>
              <Descriptions.Item label="NFT 持有">
                3 个
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
