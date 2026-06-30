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
  Divider,
  Input,
  Select,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  PlusOutlined,
  CopyOutlined,
  CheckOutlined,
  WalletOutlined,
  UserOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';

const BINDING_TYPE_MAP = {
  'SIWE': { color: 'blue', text: 'SIWE' },
  'CAIP-10': { color: 'purple', text: 'CAIP-10' },
};

const CHAIN_MAP: Record<string, { color: string; text: string }> = {
  Ethereum: { color: 'blue', text: 'Ethereum' },
  Polygon: { color: 'purple', text: 'Polygon' },
  BSC: { color: 'yellow', text: 'BSC' },
  Arbitrum: { color: 'cyan', text: 'Arbitrum' },
  Optimism: { color: 'orange', text: 'Optimism' },
};

const STATUS_MAP = {
  active: { color: 'green', text: '活跃' },
  expired: { color: 'gray', text: '已过期' },
  revoked: { color: 'red', text: '已撤销' },
};

export default function WalletBindingPage() {
  const queryClient = useQueryClient();
  const [selectedBinding, setSelectedBinding] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [chainFilter, setChainFilter] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const mockBindings = [
    {
      id: 'wb-001',
      did: 'did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAA',
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f7AAA',
      chain: 'Ethereum',
      chainId: '1',
      bindingType: 'SIWE',
      status: 'active',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-20T14:22:00Z',
      expiresAt: '2024-07-15T10:30:00Z',
      nonce: 'abc123xyz',
      signature: '0x123456...',
      siweMessage: 'example.com wants you to sign in with your Ethereum account:\n0x742d35Cc6634C0532925a3b844Bc9e7595f7AAA\n\nSign in to ZS Exchange\n\nURI: https://example.com\nVersion: 1\nChain ID: 1\nNonce: abc123xyz\nIssued At: 2024-01-15T10:30:00Z',
      verificationCount: 15,
    },
    {
      id: 'wb-002',
      did: 'did:pkh:eip155:137:0x1234567890abcdef1234567890abcdef12345678',
      walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
      chain: 'Polygon',
      chainId: '137',
      bindingType: 'CAIP-10',
      status: 'active',
      createdAt: '2024-01-16T08:15:00Z',
      updatedAt: '2024-01-21T09:45:00Z',
      expiresAt: '2025-01-16T08:15:00Z',
      nonce: 'def456uvw',
      signature: '0x789012...',
      siweMessage: null,
      verificationCount: 8,
    },
    {
      id: 'wb-003',
      did: 'did:key:z6MkfH4qWkKt9xQ2jZ3N4P5R6S7T8U9V0W1X2Y3Z4A5B6C7D8E9F0G1H2I3J4K5L6M7N8O9P0',
      walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
      chain: 'BSC',
      chainId: '56',
      bindingType: 'SIWE',
      status: 'expired',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      expiresAt: '2024-01-15T00:00:00Z',
      nonce: 'ghi789rst',
      signature: '0x345678...',
      siweMessage: 'example.com wants you to sign in...',
      verificationCount: 5,
    },
    {
      id: 'wb-004',
      did: 'did:ethr:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAA',
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f7AAA',
      chain: 'Arbitrum',
      chainId: '42161',
      bindingType: 'CAIP-10',
      status: 'revoked',
      createdAt: '2024-01-18T15:45:00Z',
      updatedAt: '2024-01-23T16:00:00Z',
      expiresAt: '2025-01-18T15:45:00Z',
      nonce: 'jkl012qpo',
      signature: '0x901234...',
      siweMessage: null,
      verificationCount: 3,
      revokedReason: 'User request',
    },
    {
      id: 'wb-005',
      did: 'did:web:example.com:users:alice',
      walletAddress: '0x0987654321fedcba0987654321fedcba09876543',
      chain: 'Optimism',
      chainId: '10',
      bindingType: 'SIWE',
      status: 'active',
      createdAt: '2024-01-19T09:20:00Z',
      updatedAt: '2024-01-24T08:15:00Z',
      expiresAt: '2024-07-19T09:20:00Z',
      nonce: 'mno345lkj',
      signature: '0x567890...',
      siweMessage: 'example.com wants you to sign in...',
      verificationCount: 12,
    },
  ];

  const { data, isLoading } = useQuery({
    queryKey: ['wallet-bindings', searchKeyword, chainFilter],
    queryFn: async () => {
      let filtered = mockBindings;
      if (searchKeyword) {
        filtered = filtered.filter(binding =>
          binding.walletAddress.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          binding.did.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          binding.id.toLowerCase().includes(searchKeyword.toLowerCase())
        );
      }
      if (chainFilter) {
        filtered = filtered.filter(binding => binding.chain === chainFilter);
      }
      return { items: filtered, total: filtered.length, page: 1, pageSize: 50 };
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { id };
    },
    onSuccess: () => {
      message.success('绑定已撤销');
      queryClient.invalidateQueries({ queryKey: ['wallet-bindings'] });
    },
    onError: () => {
      message.error('操作失败');
    },
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const columns = [
    {
      title: '绑定ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '钱包地址',
      dataIndex: 'walletAddress',
      key: 'walletAddress',
      width: 200,
      render: (address: string) => (
        <Space>
          <WalletOutlined className="text-gray-400" />
          <span className="font-mono text-sm">{address}</span>
          <Button
            type="text"
            size="small"
            icon={copiedId === address ? <CheckOutlined /> : <CopyOutlined />}
            onClick={() => handleCopy(address)}
            className="text-gray-400 hover:text-blue-500"
          />
        </Space>
      ),
    },
    {
      title: 'DID',
      key: 'did',
      width: 250,
      render: (_: any, record: any) => (
        <div className="font-mono text-xs break-all">
          {record.did}
        </div>
      ),
    },
    {
      title: '链',
      dataIndex: 'chain',
      key: 'chain',
      width: 120,
      render: (chain: string) => {
        const c = CHAIN_MAP[chain] || { color: 'default', text: chain };
        return <Tag color={c.color}>{c.text}</Tag>;
      },
    },
    {
      title: '绑定类型',
      dataIndex: 'bindingType',
      key: 'bindingType',
      width: 120,
      render: (type: string) => {
        const t = BINDING_TYPE_MAP[type as keyof typeof BINDING_TYPE_MAP] || BINDING_TYPE_MAP.SIWE;
        return <Tag color={t.color}>{t.text}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const s = STATUS_MAP[status as keyof typeof STATUS_MAP] || STATUS_MAP.active;
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '过期时间',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      width: 160,
      render: (date: string) => {
        const d = dayjs(date);
        const isExpired = d.isBefore(dayjs());
        return (
          <span className={isExpired ? 'text-gray-400' : ''}>
            {d.format('YYYY-MM-DD')}
          </span>
        );
      },
    },
    {
      title: '验证次数',
      dataIndex: 'verificationCount',
      key: 'verificationCount',
      width: 100,
    },
  ];

  const actions: any[] = [
    {
      key: 'view',
      label: '查看详情',
      icon: <EyeOutlined />,
      onClick: (record: any) => {
        setSelectedBinding(record);
        setDetailModalVisible(true);
      },
    },
    {
      key: 'revoke',
      label: '撤销绑定',
      icon: <KeyOutlined />,
      danger: true,
      hidden: (record: any) => record.status === 'revoked' || record.status === 'expired',
      confirm: (record: any) => ({
        title: '确定要撤销该钱包绑定吗？',
        description: '撤销后该钱包将无法用于DID验证',
        onConfirm: () => {
          revokeMutation.mutate({ id: record.id });
        },
      }),
    },
  ];

  const filterOptions = [
    { label: '全部链', value: '' },
    { label: 'Ethereum', value: 'Ethereum' },
    { label: 'Polygon', value: 'Polygon' },
    { label: 'BSC', value: 'BSC' },
    { label: 'Arbitrum', value: 'Arbitrum' },
    { label: 'Optimism', value: 'Optimism' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold m-0">钱包绑定管理</h1>
          <Space>
            <Button type="primary" icon={<PlusOutlined />}>
              新建绑定
            </Button>
          </Space>
        </div>

        <DataTable
          title=""
          columns={columns}
          dataSource={data?.items || []}
          loading={isLoading}
          showSearch
          searchPlaceholder="搜索钱包地址或DID"
          onSearch={setSearchKeyword}
          showFilter
          filterOptions={filterOptions}
          onFilter={setChainFilter}
          actions={actions}
          rowKey="id"
          pagination={{
            total: data?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </div>

      <Modal
        title="钱包绑定详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
          selectedBinding?.status !== 'revoked' && selectedBinding?.status !== 'expired' && (
            <Button
              key="revoke"
              type="primary"
              danger
              onClick={() => {
                revokeMutation.mutate({ id: selectedBinding.id });
                setDetailModalVisible(false);
              }}
            >
              Revoke Binding
            </Button>
          ),
        ]}
        width={900}
      >
        {selectedBinding && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                <WalletOutlined style={{ fontSize: 32, color: '#7C3AED' }} />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold m-0">{selectedBinding.walletAddress}</h2>
                <p className="text-gray-500 m-0 mt-1">绑定ID: {selectedBinding.id}</p>
                <Space className="mt-2">
                  <Tag color={CHAIN_MAP[selectedBinding.chain].color}>
                    {CHAIN_MAP[selectedBinding.chain].text}
                  </Tag>
                  <Tag color={BINDING_TYPE_MAP[selectedBinding.bindingType as keyof typeof BINDING_TYPE_MAP].color}>
                    {BINDING_TYPE_MAP[selectedBinding.bindingType as keyof typeof BINDING_TYPE_MAP].text}
                  </Tag>
                  <Tag color={STATUS_MAP[selectedBinding.status as keyof typeof STATUS_MAP].color}>
                    {STATUS_MAP[selectedBinding.status as keyof typeof STATUS_MAP].text}
                  </Tag>
                </Space>
              </div>
            </div>

            <Descriptions bordered column={2}>
              <Descriptions.Item label="DID">
                <div className="font-mono text-sm break-all">{selectedBinding.did}</div>
              </Descriptions.Item>
              <Descriptions.Item label="钱包地址">
                <div className="font-mono text-sm">{selectedBinding.walletAddress}</div>
              </Descriptions.Item>
              <Descriptions.Item label="链">
                {selectedBinding.chain} (Chain ID: {selectedBinding.chainId})
              </Descriptions.Item>
              <Descriptions.Item label="绑定类型">
                {selectedBinding.bindingType}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(selectedBinding.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs(selectedBinding.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="过期时间">
                {dayjs(selectedBinding.expiresAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="验证次数">
                {selectedBinding.verificationCount}
              </Descriptions.Item>
              {selectedBinding.status === 'revoked' && (
                <Descriptions.Item label="撤销原因">
                  {selectedBinding.revokedReason}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider />

            <h3 className="font-bold mb-4">签名信息</h3>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500 mb-2">Nonce</div>
                <div className="font-mono text-sm">{selectedBinding.nonce}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500 mb-2">Signature</div>
                <div className="font-mono text-sm break-all">{selectedBinding.signature}</div>
              </div>
              {selectedBinding.siweMessage && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 mb-2">SIWE Message</div>
                  <pre className="text-sm font-mono whitespace-pre-wrap">{selectedBinding.siweMessage}</pre>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}