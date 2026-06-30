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
  LinkOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';

const DAPP_STATUS_MAP = {
  approved: { color: 'green', text: 'Approved' },
  pending: { color: 'blue', text: 'Pending' },
  rejected: { color: 'red', text: 'Rejected' },
  suspended: { color: 'orange', text: 'Suspended' },
};

const DAPP_CATEGORY_MAP = {
  defi: { color: 'blue', text: 'DeFi' },
  nft: { color: 'purple', text: 'NFT' },
  gaming: { color: 'green', text: '娓告垙' },
  social: { color: 'cyan', text: '绀句氦' },
  tool: { color: 'orange', text: '宸ュ叿' },
  other: { color: 'gray', text: '鍏朵粬' },
};

const RISK_LEVEL_MAP = {
  low: { color: 'green', text: 'Low' },
  medium: { color: 'orange', text: 'Medium' },
  high: { color: 'red', text: 'High' },
};

export default function DAppManagementPage() {
  const queryClient = useQueryClient();
  const [selectedDApp, setSelectedDApp] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const mockDApps = [
    {
      id: 'dapp-001',
      name: 'Uniswap',
      description: 'Decentralized exchange with multi-token swaps',
      url: 'https://app.uniswap.org',
      category: 'defi',
      status: 'approved',
      riskLevel: 'low',
      icon: 'https://app.uniswap.org/favicon.ico',
      origin: 'https://app.uniswap.org',
      contractAddresses: ['0x1F98431c8aD98523631AE4a59f267346ea31F984'],
      permissions: ['eth_accounts', 'eth_sendTransaction', 'eth_sign'],
      connectedUsers: 12580,
      transactionsCount: 45890,
      lastAccess: '2024-01-20T14:22:00Z',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-20T14:22:00Z',
      securityScore: 95,
      auditStatus: 'audited',
      auditReport: 'https://certik.org',
    },
    {
      id: 'dapp-002',
      name: 'OpenSea',
      description: '鍏ㄧ悆鏈€澶х殑NFT甯傚満',
      url: 'https://opensea.io',
      category: 'nft',
      status: 'approved',
      riskLevel: 'low',
      icon: 'https://opensea.io/favicon.ico',
      origin: 'https://opensea.io',
      contractAddresses: ['0x495f947276749Ce646f68AC8c248420045cb7b5e'],
      permissions: ['eth_accounts', 'eth_sendTransaction', 'eth_signTypedData_v4'],
      connectedUsers: 8920,
      transactionsCount: 23450,
      lastAccess: '2024-01-20T12:15:00Z',
      createdAt: '2024-01-05T08:00:00Z',
      updatedAt: '2024-01-20T12:15:00Z',
      securityScore: 92,
      auditStatus: 'audited',
      auditReport: 'https://peckshield.com',
    },
    {
      id: 'dapp-003',
      name: 'Axie Infinity',
      description: '鍖哄潡閾炬父鎴忥紝鏀堕泦鍜屾垬鏂桝xie瀹犵墿',
      url: 'https://axieinfinity.com',
      category: 'gaming',
      status: 'approved',
      riskLevel: 'medium',
      icon: 'https://axieinfinity.com/favicon.ico',
      origin: 'https://axieinfinity.com',
      contractAddresses: ['0xF5b0A3eFB8e8E4c201e2A935F110eAaF3FFE89Ea'],
      permissions: ['eth_accounts', 'eth_sendTransaction'],
      connectedUsers: 5670,
      transactionsCount: 18920,
      lastAccess: '2024-01-19T18:30:00Z',
      createdAt: '2024-01-08T15:00:00Z',
      updatedAt: '2024-01-19T18:30:00Z',
      securityScore: 78,
      auditStatus: 'audited',
      auditReport: 'https://certik.org',
    },
    {
      id: 'dapp-004',
      name: 'Phishing Scam',
      description: '鐤戜技閽撻奔缃戠珯锛岃璋ㄦ厧璁块棶',
      url: 'https://phishing-scam-example.com',
      category: 'other',
      status: 'rejected',
      riskLevel: 'high',
      icon: null,
      origin: 'https://phishing-scam-example.com',
      contractAddresses: [],
      permissions: [],
      connectedUsers: 0,
      transactionsCount: 0,
      lastAccess: null,
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      securityScore: 10,
      auditStatus: 'not_audited',
      auditReport: null,
      rejectionReason: '鐤戜技閽撻奔缃戠珯锛屽煙鍚嶄笌鐭ュ悕椤圭洰鐩镐技',
    },
    {
      id: 'dapp-005',
      name: 'New DeFi App',
      description: '鏂颁笂绾跨殑DeFi鍗忚锛屾敮鎸佽川鎶煎拰鍊熻捶',
      url: 'https://new-defi-app.com',
      category: 'defi',
      status: 'pending',
      riskLevel: 'medium',
      icon: null,
      origin: 'https://new-defi-app.com',
      contractAddresses: ['0xNewContractAddress12345'],
      permissions: ['eth_accounts', 'eth_sendTransaction'],
      connectedUsers: 120,
      transactionsCount: 340,
      lastAccess: '2024-01-20T16:45:00Z',
      createdAt: '2024-01-18T11:00:00Z',
      updatedAt: '2024-01-20T16:45:00Z',
      securityScore: 65,
      auditStatus: 'pending',
      auditReport: null,
    },
  ];

  const { data, isLoading } = useQuery({
    queryKey: ['dapps', searchKeyword, categoryFilter],
    queryFn: async () => {
      let filtered = mockDApps;
      if (searchKeyword) {
        filtered = filtered.filter(dapp =>
          dapp.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          dapp.url.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          dapp.description.toLowerCase().includes(searchKeyword.toLowerCase())
        );
      }
      if (categoryFilter) {
        filtered = filtered.filter(dapp => dapp.category === categoryFilter);
      }
      return { items: filtered, total: filtered.length, page: 1, pageSize: 50 };
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { id };
    },
    onSuccess: () => {
      message.success('DApp宸插鏍搁€氳繃');
      queryClient.invalidateQueries({ queryKey: ['dapps'] });
    },
    onError: () => {
      message.error('鎿嶄綔澶辫触');
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { id };
    },
    onSuccess: () => {
      message.success('DApp suspended');
      queryClient.invalidateQueries({ queryKey: ['dapps'] });
    },
    onError: () => {
      message.error('鎿嶄綔澶辫触');
    },
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const columns = [
    {
      title: 'DApp鍚嶇О',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (_: any, record: any) => (
        <Space>
          {record.icon ? (
            <img src={record.icon} alt={record.name} className="w-8 h-8 rounded" />
          ) : (
            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
              <LinkOutlined className="text-gray-400" />
            </div>
          )}
          <span className="font-medium">{record.name}</span>
        </Space>
      ),
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      width: 250,
      render: (url: string, record: any) => (
        <div className="space-y-1">
          <div className="font-mono text-sm break-all">{url}</div>
          <Button
            type="text"
            size="small"
            icon={copiedUrl === url ? <CheckOutlined /> : <CopyOutlined />}
            onClick={() => handleCopy(url)}
            className="text-gray-400 hover:text-blue-500"
          >
            {copiedUrl === url ? 'Copied' : 'Copy'}
          </Button>
        </div>
      ),
    },
    {
      title: '鍒嗙被',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => {
        const c = DAPP_CATEGORY_MAP[category as keyof typeof DAPP_CATEGORY_MAP] || DAPP_CATEGORY_MAP.other;
        return <Tag color={c.color}>{c.text}</Tag>;
      },
    },
    {
      title: '椋庨櫓绛夌骇',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 100,
      render: (level: string) => {
        const r = RISK_LEVEL_MAP[level as keyof typeof RISK_LEVEL_MAP] || RISK_LEVEL_MAP.medium;
        return <Tag color={r.color}>{r.text}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const s = DAPP_STATUS_MAP[status as keyof typeof DAPP_STATUS_MAP] || DAPP_STATUS_MAP.pending;
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '瀹夊叏璇勫垎',
      dataIndex: 'securityScore',
      key: 'securityScore',
      width: 100,
      render: (score: number) => (
        <div className="flex items-center gap-2">
          <SafetyCertificateOutlined className={score >= 80 ? 'text-green-500' : score >= 60 ? 'text-orange-500' : 'text-red-500'} />
          <span className={score >= 80 ? 'text-green-600' : score >= 60 ? 'text-orange-600' : 'text-red-600'}>
            {score}
          </span>
        </div>
      ),
    },
    {
      title: '杩炴帴鐢ㄦ埛',
      dataIndex: 'connectedUsers',
      key: 'connectedUsers',
      width: 120,
      render: (count: number) => count.toLocaleString(),
    },
    {
      title: 'Last Access',
      dataIndex: 'lastAccess',
      key: 'lastAccess',
      width: 160,
      render: (date: string | null) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
  ];

  const actions: any[] = [
    {
      key: 'view',
      label: '鏌ョ湅璇︽儏',
      icon: <EyeOutlined />,
      onClick: (record: any) => {
        setSelectedDApp(record);
        setDetailModalVisible(true);
      },
    },
    {
      key: 'approve',
      label: '瀹℃牳閫氳繃',
      icon: <CheckOutlined />,
      type: 'primary',
      hidden: (record: any) => record.status !== 'pending',
      onClick: (record: any) => {
        approveMutation.mutate({ id: record.id });
      },
    },
    {
      key: 'suspend',
      label: '鏆傚仠',
      icon: <WarningOutlined />,
      danger: true,
      hidden: (record: any) => record.status === 'suspended' || record.status === 'rejected',
      confirm: (record: any) => ({
        title: '纭畾瑕佹殏鍋滆DApp鍚楋紵',
        description: '鏆傚仠鍚庣敤鎴峰皢鏃犳硶璁块棶璇App',
        onConfirm: () => {
          suspendMutation.mutate({ id: record.id });
        },
      }),
    },
  ];

  const filterOptions = [
    { label: '鍏ㄩ儴鍒嗙被', value: '' },
    { label: 'DeFi', value: 'defi' },
    { label: 'NFT', value: 'nft' },
    { label: '娓告垙', value: 'gaming' },
    { label: '绀句氦', value: 'social' },
    { label: '宸ュ叿', value: 'tool' },
    { label: '鍏朵粬', value: 'other' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold m-0">DApp绠＄悊</h1>
          <Space>
            <Button type="primary" icon={<PlusOutlined />}>
              娣诲姞DApp
            </Button>
          </Space>
        </div>

        <DataTable
          title=""
          columns={columns}
          dataSource={data?.items || []}
          loading={isLoading}
          showSearch
          searchPlaceholder="Search DApp name, URL, or description"
          onSearch={setSearchKeyword}
          showFilter
          filterOptions={filterOptions}
          onFilter={setCategoryFilter}
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
        title="DApp璇︽儏"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
          selectedDApp?.status === 'pending' && (
            <Button
              key="approve"
              type="primary"
              onClick={() => {
                approveMutation.mutate({ id: selectedDApp.id });
                setDetailModalVisible(false);
              }}
            >
              Approve
            </Button>
          ),
          selectedDApp?.status !== 'suspended' && selectedDApp?.status !== 'rejected' && (
            <Button
              key="suspend"
              type="primary"
              danger
              onClick={() => {
                suspendMutation.mutate({ id: selectedDApp.id });
                setDetailModalVisible(false);
              }}
            >
              Suspend
            </Button>
          ),
        ]}
        width={900}
      >
        {selectedDApp && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b">
              {selectedDApp.icon ? (
                <img src={selectedDApp.icon} alt={selectedDApp.name} className="w-16 h-16 rounded-lg" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                  <LinkOutlined style={{ fontSize: 32, color: '#1677FF' }} />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-xl font-bold m-0">{selectedDApp.name}</h2>
                <p className="text-gray-500 m-0 mt-1">{selectedDApp.description}</p>
                <Space className="mt-2">
                  <Tag color={DAPP_CATEGORY_MAP[selectedDApp.category as keyof typeof DAPP_CATEGORY_MAP].color}>
                    {DAPP_CATEGORY_MAP[selectedDApp.category as keyof typeof DAPP_CATEGORY_MAP].text}
                  </Tag>
                  <Tag color={RISK_LEVEL_MAP[selectedDApp.riskLevel as keyof typeof RISK_LEVEL_MAP].color}>
                    {RISK_LEVEL_MAP[selectedDApp.riskLevel as keyof typeof RISK_LEVEL_MAP].text}
                  </Tag>
                  <Tag color={DAPP_STATUS_MAP[selectedDApp.status as keyof typeof DAPP_STATUS_MAP].color}>
                    {DAPP_STATUS_MAP[selectedDApp.status as keyof typeof DAPP_STATUS_MAP].text}
                  </Tag>
                </Space>
              </div>
            </div>

            <Descriptions bordered column={2}>
              <Descriptions.Item label="URL">
                <a href={selectedDApp.url} target="_blank" rel="noopener noreferrer" className="font-mono text-sm text-blue-500">
                  {selectedDApp.url}
                </a>
              </Descriptions.Item>
              <Descriptions.Item label="Origin">{selectedDApp.origin}</Descriptions.Item>
              <Descriptions.Item label="瀹夊叏璇勫垎">
                <span className={selectedDApp.securityScore >= 80 ? 'text-green-600' : selectedDApp.securityScore >= 60 ? 'text-orange-600' : 'text-red-600'}>
                  {selectedDApp.securityScore}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Audit Status">
                {selectedDApp.auditStatus === 'audited' ? (
                  <Tag color="green">Audited</Tag>
                ) : selectedDApp.auditStatus === 'pending' ? (
                  <Tag color="blue">Auditing</Tag>
                ) : (
                  <Tag color="gray">Unaudited</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="杩炴帴鐢ㄦ埛">{selectedDApp.connectedUsers.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="浜ゆ槗娆℃暟">{selectedDApp.transactionsCount.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Last Access">
                {selectedDApp.lastAccess ? dayjs(selectedDApp.lastAccess).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="鍒涘缓鏃堕棿">
                {dayjs(selectedDApp.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              {selectedDApp.status === 'rejected' && (
                <Descriptions.Item label="鎷掔粷鍘熷洜">
                  {selectedDApp.rejectionReason}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider />

            <h3 className="font-bold mb-4">鍚堢害鍦板潃</h3>
            {selectedDApp.contractAddresses?.length ? (
              <div className="space-y-2">
                {selectedDApp.contractAddresses.map((addr: string, index: number) => (
                  <div key={index} className="font-mono text-sm bg-gray-50 p-2 rounded">
                    {addr}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">鏆傛棤鍚堢害鍦板潃</p>
            )}

            <Divider />

            <h3 className="font-bold mb-4">鏉冮檺鍒楄〃</h3>
            {selectedDApp.permissions?.length ? (
              <div className="flex flex-wrap gap-2">
                {selectedDApp.permissions.map((perm: string, index: number) => (
                  <Tag key={index} color="blue">{perm}</Tag>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">鏆傛棤鏉冮檺</p>
            )}

            {selectedDApp.auditReport && (
              <>
                <Divider />
                <h3 className="font-bold mb-4">瀹¤鎶ュ憡</h3>
                <a href={selectedDApp.auditReport} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  鏌ョ湅瀹¤鎶ュ憡
                </a>
              </>
            )}
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}