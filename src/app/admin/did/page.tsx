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
  Input,
  Select,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  PlusOutlined,
  CopyOutlined,
  CheckOutlined,
  UserOutlined,
  WalletOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';

const DID_METHOD_MAP = {
  'did:key': { color: 'blue', text: 'did:key' },
  'did:pkh': { color: 'purple', text: 'did:pkh' },
  'did:web': { color: 'green', text: 'did:web' },
  'did:ethr': { color: 'orange', text: 'did:ethr' },
};

const DID_STATUS_MAP = {
  active: { color: 'green', text: '娲昏穬' },
  suspended: { color: 'orange', text: '鏆傚仠' },
  revoked: { color: 'red', text: '宸叉挙閿€' },
};

export default function DIDManagementPage() {
  const queryClient = useQueryClient();
  const [selectedDID, setSelectedDID] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const mockDIDs = [
    {
      id: 'did:key:z6MkfH4qWkKt9xQ2jZ3N4P5R6S7T8U9V0W1X2Y3Z4A5B6C7D8E9F0G1H2I3J4K5L6M7N8O9P0',
      method: 'did:key',
      controller: 'did:key:z6MkfH4qWkKt9xQ2jZ3N4P5R6S7T8U9V0W1X2Y3Z4A5B6C7D8E9F0G1H2I3J4K5L6M7N8O9P0',
      subject: 'user_001',
      status: 'active',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-20T14:22:00Z',
      boundWallets: [
        { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f7AAA', chain: 'Ethereum', type: 'CAIP-10' },
      ],
      credentialsCount: 5,
      verificationMethods: ['Ed25519VerificationKey2020'],
    },
    {
      id: 'did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAA',
      method: 'did:pkh',
      controller: 'did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAA',
      subject: 'user_002',
      status: 'active',
      createdAt: '2024-01-16T08:15:00Z',
      updatedAt: '2024-01-21T09:45:00Z',
      boundWallets: [
        { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f7AAA', chain: 'Ethereum', type: 'CAIP-10' },
        { address: '0x1234567890abcdef1234567890abcdef12345678', chain: 'Polygon', type: 'SIWE' },
      ],
      credentialsCount: 3,
      verificationMethods: ['EcdsaSecp256k1VerificationKey2019'],
    },
    {
      id: 'did:web:example.com:users:alice',
      method: 'did:web',
      controller: 'did:web:example.com',
      subject: 'alice@example.com',
      status: 'active',
      createdAt: '2024-01-17T12:00:00Z',
      updatedAt: '2024-01-22T11:30:00Z',
      boundWallets: [],
      credentialsCount: 2,
      verificationMethods: ['JsonWebKey2020'],
    },
    {
      id: 'did:ethr:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAA',
      method: 'did:ethr',
      controller: 'did:ethr:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAA',
      subject: 'user_003',
      status: 'suspended',
      createdAt: '2024-01-18T15:45:00Z',
      updatedAt: '2024-01-23T16:00:00Z',
      boundWallets: [
        { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f7AAA', chain: 'Ethereum', type: 'SIWE' },
      ],
      credentialsCount: 1,
      verificationMethods: ['EcdsaSecp256k1RecoveryMethod2020'],
    },
    {
      id: 'did:key:z6MkjRagNiMu91DduvCvgEsqLZDVzrJzFrwahc4tXLt9DoHd',
      method: 'did:key',
      controller: 'did:key:z6MkjRagNiMu91DduvCvgEsqLZDVzrJzFrwahc4tXLt9DoHd',
      subject: 'service_account_001',
      status: 'active',
      createdAt: '2024-01-19T09:20:00Z',
      updatedAt: '2024-01-24T08:15:00Z',
      boundWallets: [],
      credentialsCount: 8,
      verificationMethods: ['Ed25519VerificationKey2020'],
    },
  ];

  const { data, isLoading } = useQuery({
    queryKey: ['dids', searchKeyword, methodFilter],
    queryFn: async () => {
      let filtered = mockDIDs;
      if (searchKeyword) {
        filtered = filtered.filter(did =>
          did.id.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          did.subject.toLowerCase().includes(searchKeyword.toLowerCase())
        );
      }
      if (methodFilter) {
        filtered = filtered.filter(did => did.method === methodFilter);
      }
      return { items: filtered, total: filtered.length, page: 1, pageSize: 50 };
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { id, status };
    },
    onSuccess: (_, { status }) => {
      message.success(status === 'active' ? 'DID activated' : 'DID suspended');
      queryClient.invalidateQueries({ queryKey: ['dids'] });
    },
    onError: () => {
      message.error('鎿嶄綔澶辫触');
    },
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const columns = [
    {
      title: 'DID鏍囪瘑',
      key: 'did',
      width: 300,
      render: (_: any, record: any) => (
        <div className="space-y-1">
          <div className="font-mono text-sm break-all">{record.id}</div>
          <Button
            type="text"
            icon={copiedId === record.id ? <CheckOutlined /> : <CopyOutlined />}
            onClick={() => handleCopy(record.id)}
            className="text-gray-400 hover:text-blue-500"
          >
            {copiedId === record.id ? 'Copied' : 'Copy'}
          </Button>
        </div>
      ),
    },
    {
      title: 'DID鏂规硶',
      dataIndex: 'method',
      key: 'method',
      width: 120,
      render: (method: string) => {
        const m = DID_METHOD_MAP[method as keyof typeof DID_METHOD_MAP] || DID_METHOD_MAP['did:key'];
        return <Tag color={m.color}>{m.text}</Tag>;
      },
    },
    {
      title: '涓讳綋',
      dataIndex: 'subject',
      key: 'subject',
      width: 150,
      render: (subject: string) => (
        <Space>
          <UserOutlined className="text-gray-400" />
          <span>{subject}</span>
        </Space>
      ),
    },
    {
      title: '缁戝畾閽卞寘',
      key: 'wallets',
      width: 200,
      render: (_: any, record: any) => (
        <div>
          {record.boundWallets?.length ? (
            record.boundWallets.slice(0, 2).map((w: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-sm mb-1">
                <WalletOutlined className="text-gray-400" />
                <span className="font-mono text-xs">{w.address.slice(0, 10)}...</span>
                <Tag color="blue">{w.chain}</Tag>
              </div>
            ))
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
          {record.boundWallets?.length > 2 && (
            <span className="text-xs text-gray-400">+{record.boundWallets.length - 2} 鏇村</span>
          )}
        </div>
      ),
    },
    {
      title: '鍑瘉鏁伴噺',
      dataIndex: 'credentialsCount',
      key: 'credentialsCount',
      width: 100,
      render: (count: number) => (
        <Space>
          <FileTextOutlined className="text-gray-400" />
          <span className="font-medium">{count}</span>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const s = DID_STATUS_MAP[status as keyof typeof DID_STATUS_MAP] || DID_STATUS_MAP.active;
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '鍒涘缓鏃堕棿',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
  ];

  const actions: any[] = [
    {
      key: 'view',
      label: '鏌ョ湅璇︽儏',
      icon: <EyeOutlined />,
      onClick: (record: any) => {
        setSelectedDID(record);
        setDetailModalVisible(true);
      },
    },
    {
      key: 'toggle-status',
      label: (record: any) => record.status === 'active' ? '鏆傚仠' : '鍚敤',
      icon: (record: any) => record.status === 'active' ? <EyeOutlined /> : <CheckOutlined />,
      danger: (record: any) => record.status === 'active',
      confirm: (record: any) => ({
        title: record.status === 'active' ? '纭畾瑕佹殏鍋滆DID鍚楋紵' : '纭畾瑕佸惎鐢ㄨDID鍚楋紵',
        description: record.status === 'active'
          ? '鏆傚仠鍚庤DID灏嗘棤娉曠敤浜庨獙璇佸拰鎺堟潈'
          : 'After activation, DID functions will be restored',
        onConfirm: () => {
          toggleStatusMutation.mutate({ id: record.id, status: record.status === 'active' ? 'suspended' : 'active' });
        },
      }),
    },
  ];

  const filterOptions = [
    { label: '鍏ㄩ儴鏂规硶', value: '' },
    { label: 'did:key', value: 'did:key' },
    { label: 'did:pkh', value: 'did:pkh' },
    { label: 'did:web', value: 'did:web' },
    { label: 'did:ethr', value: 'did:ethr' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold m-0">DID韬唤绠＄悊</h1>
          <Space>
            <Button type="primary" icon={<PlusOutlined />}>
              鍒涘缓DID
            </Button>
          </Space>
        </div>

        <DataTable
          title=""
          columns={columns}
          dataSource={data?.items || []}
          loading={isLoading}
          showSearch
          searchPlaceholder="Search DID identifier or subject"
          onSearch={setSearchKeyword}
          showFilter
          filterOptions={filterOptions}
          onFilter={setMethodFilter}
          actions={actions}
          rowKey="id"
          pagination={{
            total: data?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} records`,
          }}
        />
      </div>

      <Modal
        title="DID璇︽儏"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            鍏抽棴
          </Button>,
          <Button key="edit" type="primary">
            缂栬緫DID
          </Button>,
        ]}
        width={900}
      >
        {selectedDID && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b">
              <Avatar
                icon={<UserOutlined />}
                style={{ background: '#1677FF' }}
              />
              <div className="flex-1">
                <h2 className="text-xl font-bold m-0 break-all">{selectedDID.id}</h2>
                <p className="text-gray-500 m-0 mt-1">DID鏂规硶: {selectedDID.method}</p>
                <Space className="mt-2">
                  <Tag color={DID_STATUS_MAP[selectedDID.status as keyof typeof DID_STATUS_MAP].color}>
                    {DID_STATUS_MAP[selectedDID.status as keyof typeof DID_STATUS_MAP].text}
                  </Tag>
                  <Tag color="blue">{selectedDID.verificationMethods?.[0]}</Tag>
                </Space>
              </div>
            </div>

            <Descriptions bordered column={2}>
              <Descriptions.Item label="DID鏍囪瘑">{selectedDID.id}</Descriptions.Item>
              <Descriptions.Item label="Controller">{selectedDID.controller}</Descriptions.Item>
              <Descriptions.Item label="涓讳綋">{selectedDID.subject}</Descriptions.Item>
              <Descriptions.Item label="楠岃瘉鏂规硶">
                {selectedDID.verificationMethods?.join(', ') || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="鍒涘缓鏃堕棿">
                {new Date(selectedDID.createdAt).toLocaleString('zh-CN')}
              </Descriptions.Item>
              <Descriptions.Item label="鏇存柊鏃堕棿">
                {new Date(selectedDID.updatedAt).toLocaleString('zh-CN')}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <h3 className="font-bold mb-4">缁戝畾閽卞寘鍒楄〃</h3>
            {selectedDID.boundWallets?.length ? (
              <div className="space-y-3">
                {selectedDID.boundWallets.map((wallet: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <Space>
                      <WalletOutlined className="text-gray-400" />
                      <span className="font-mono text-sm">{wallet.address}</span>
                      <Tag color="blue">{wallet.chain}</Tag>
                      <Tag color="green">{wallet.type}</Tag>
                    </Space>
                    <Button type="text" danger>
                      瑙ｇ粦
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">鏆傛棤缁戝畾閽卞寘</p>
            )}

            <Divider />

            <h3 className="font-bold mb-4">鍑瘉姒傝</h3>
            <Descriptions bordered column={3}>
              <Descriptions.Item label="鍑瘉鎬绘暟">
                <span className="text-lg font-bold text-blue-600">{selectedDID.credentialsCount}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Verified">3 items</Descriptions.Item>
              <Descriptions.Item label="Pending">2 items</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}