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
  DatePicker,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  PlusOutlined,
  CopyOutlined,
  CheckOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';

const VC_TYPE_MAP = {
  exchange: { color: 'blue', text: '浜ゆ槗鎵€鍑瘉' },
  commerce: { color: 'purple', text: 'Commerce Credential' },
  gaming: { color: 'green', text: '娓告垙鍑瘉' },
  financial: { color: 'orange', text: '閲戣瀺鍑瘉' },
  enterprise: { color: 'cyan', text: 'Enterprise Credential' },
};

const VC_STATUS_MAP = {
  issued: { color: 'green', text: 'Issued' },
  revoked: { color: 'red', text: 'Revoked' },
  expired: { color: 'gray', text: 'Expired' },
  pending: { color: 'blue', text: 'Pending' },
};

const VC_FORMAT_MAP = {
  jwt: { color: 'blue', text: 'JWT' },
  jsonld: { color: 'purple', text: 'JSON-LD' },
  eip712: { color: 'orange', text: 'EIP-712' },
};

export default function VCManagementPage() {
  const queryClient = useQueryClient();
  const [selectedVC, setSelectedVC] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const mockVCs = [
    {
      id: 'vc-001',
      type: 'exchange',
      format: 'jwt',
      status: 'issued',
      issuer: 'did:web:zs-exchange.com',
      holder: 'did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAA',
      schema: 'ExchangeUserCredential',
      credentialSubject: {
        userId: 'user_001',
        level: 'VIP',
        tradingVolume: '1000000',
        verified: true,
      },
      issuanceDate: '2024-01-15T10:30:00Z',
      expirationDate: '2025-01-15T10:30:00Z',
      proofType: 'Ed25519Signature2020',
      verificationCount: 12,
      onChainAnchor: true,
      anchorTx: '0xabc123...',
    },
    {
      id: 'vc-002',
      type: 'commerce',
      format: 'jsonld',
      status: 'issued',
      issuer: 'did:web:zs-exchange.com',
      holder: 'did:key:z6MkfH4qWkKt9xQ2jZ3N4P5R6S7T8U9V0W1X2Y3Z4A5B6C7D8E9F0G1H2I3J4K5L6M7N8O9P0',
      schema: 'CrossBorderMerchantCredential',
      credentialSubject: {
        merchantId: 'merchant_001',
        businessType: 'electronics',
        annualRevenue: '5000000',
        complianceLevel: 'high',
      },
      issuanceDate: '2024-01-16T08:15:00Z',
      expirationDate: '2024-07-16T08:15:00Z',
      proofType: 'RsaSignature2018',
      verificationCount: 8,
      onChainAnchor: true,
      anchorTx: '0xdef456...',
    },
    {
      id: 'vc-003',
      type: 'gaming',
      format: 'eip712',
      status: 'pending',
      issuer: 'did:web:zs-exchange.com',
      holder: 'did:pkh:eip155:137:0x1234567890abcdef1234567890abcdef12345678',
      schema: 'GamePlayerCredential',
      credentialSubject: {
        playerId: 'player_001',
        level: 50,
        achievements: ['Gold Medal', 'Fastest Runner'],
        inGameAssets: 15,
      },
      issuanceDate: '2024-01-17T12:00:00Z',
      expirationDate: '2024-12-31T23:59:59Z',
      proofType: 'EIP712Signature',
      verificationCount: 0,
      onChainAnchor: false,
      anchorTx: null,
    },
    {
      id: 'vc-004',
      type: 'financial',
      format: 'jwt',
      status: 'revoked',
      issuer: 'did:ethr:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAA',
      holder: 'did:web:example.com:users:bob',
      schema: 'FinancialComplianceCredential',
      credentialSubject: {
        entityId: 'entity_001',
        complianceStatus: 'compliant',
        jurisdiction: 'Samoa',
        licenseNumber: 'FSC-2024-001',
      },
      issuanceDate: '2024-01-10T09:00:00Z',
      expirationDate: '2024-12-31T23:59:59Z',
      proofType: 'Ed25519Signature2020',
      verificationCount: 5,
      onChainAnchor: true,
      anchorTx: '0xghi789...',
      revokedReason: 'License expired',
    },
    {
      id: 'vc-005',
      type: 'enterprise',
      format: 'jsonld',
      status: 'expired',
      issuer: 'did:web:zs-exchange.com',
      holder: 'did:web:samoa-inc.com',
      schema: 'SamoaEnterpriseCredential',
      credentialSubject: {
        companyName: 'ZS Digital Tech Samoa Inc',
        registrationNumber: 'SC-2023-001',
        businessScope: 'Digital Asset Exchange',
        registeredCapital: '5000000',
      },
      issuanceDate: '2023-01-15T10:00:00Z',
      expirationDate: '2024-01-15T10:00:00Z',
      proofType: 'RsaSignature2018',
      verificationCount: 20,
      onChainAnchor: true,
      anchorTx: '0xjkl012...',
    },
  ];

  const { data, isLoading } = useQuery({
    queryKey: ['vcs', searchKeyword, typeFilter],
    queryFn: async () => {
      let filtered = mockVCs;
      if (searchKeyword) {
        filtered = filtered.filter(vc =>
          vc.id.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          vc.holder.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          vc.schema.toLowerCase().includes(searchKeyword.toLowerCase())
        );
      }
      if (typeFilter) {
        filtered = filtered.filter(vc => vc.type === typeFilter);
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
      message.success('鍑瘉宸叉挙閿€');
      queryClient.invalidateQueries({ queryKey: ['vcs'] });
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
      title: '鍑瘉ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id: string) => (
        <Space>
          <FileTextOutlined className="text-gray-400" />
          <span className="font-mono">{id}</span>
        </Space>
      ),
    },
    {
      title: 'Credential Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const t = VC_TYPE_MAP[type as keyof typeof VC_TYPE_MAP] || VC_TYPE_MAP.exchange;
        return <Tag color={t.color}>{t.text}</Tag>;
      },
    },
    {
      title: 'Schema',
      dataIndex: 'schema',
      key: 'schema',
      width: 200,
    },
    {
      title: 'Holder',
      key: 'holder',
      width: 250,
      render: (_: any, record: any) => (
        <div>
          <div className="font-mono text-xs break-all">{record.holder}</div>
          <Button
            type="text"
            size="small"
            icon={copiedId === record.holder ? <CheckOutlined /> : <CopyOutlined />}
            onClick={() => handleCopy(record.holder)}
            className="text-gray-400 hover:text-blue-500"
          >
            {copiedId === record.holder ? 'Copied' : 'Copy'}
          </Button>
        </div>
      ),
    },
    {
      title: 'Format',
      dataIndex: 'format',
      key: 'format',
      width: 100,
      render: (format: string) => {
        const f = VC_FORMAT_MAP[format as keyof typeof VC_FORMAT_MAP] || VC_FORMAT_MAP.jwt;
        return <Tag color={f.color}>{f.text}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const s = VC_STATUS_MAP[status as keyof typeof VC_STATUS_MAP] || VC_STATUS_MAP.issued;
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '楠岃瘉娆℃暟',
      dataIndex: 'verificationCount',
      key: 'verificationCount',
      width: 100,
      render: (count: number) => (
        <Space>
          <SafetyCertificateOutlined className="text-gray-400" />
          <span>{count}</span>
        </Space>
      ),
    },
    {
      title: '杩囨湡鏃堕棿',
      dataIndex: 'expirationDate',
      key: 'expirationDate',
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
  ];

  const actions: any[] = [
    {
      key: 'view',
      label: '鏌ョ湅璇︽儏',
      icon: <EyeOutlined />,
      onClick: (record: any) => {
        setSelectedVC(record);
        setDetailModalVisible(true);
      },
    },
    {
      key: 'revoke',
      label: 'Revoke',
      icon: <SafetyCertificateOutlined />,
      danger: true,
      hidden: (record: any) => record.status === 'revoked' || record.status === 'expired',
      confirm: (record: any) => ({
        title: 'Are you sure you want to revoke this credential?',
        description: '鎾ら攢鍚庤鍑瘉灏嗗け鏁堬紝鏃犳硶鐢ㄤ簬楠岃瘉',
        onConfirm: () => {
          revokeMutation.mutate({ id: record.id });
        },
      }),
    },
  ];

  const filterOptions = [
    { label: 'All Types', value: '' },
    { label: '浜ゆ槗鎵€鍑瘉', value: 'exchange' },
    { label: 'Commerce Credential', value: 'commerce' },
    { label: '娓告垙鍑瘉', value: 'gaming' },
    { label: '閲戣瀺鍑瘉', value: 'financial' },
    { label: 'Enterprise Credential', value: 'enterprise' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold m-0">VC鍑瘉绠＄悊</h1>
          <Space>
            <Button type="primary" icon={<PlusOutlined />}>
              鍙戣鍑瘉
            </Button>
          </Space>
        </div>

        <DataTable
          title=""
          columns={columns}
          dataSource={data?.items || []}
          loading={isLoading}
          showSearch
          searchPlaceholder="鎼滅储鍑瘉ID銆佹寔鏈夎€呮垨Schema"
          onSearch={setSearchKeyword}
          showFilter
          filterOptions={filterOptions}
          onFilter={setTypeFilter}
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
        title="鍑瘉璇︽儏"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
          selectedVC?.status !== 'revoked' && selectedVC?.status !== 'expired' && (
            <Button
              key="revoke"
              type="primary"
              danger
              onClick={() => {
                revokeMutation.mutate({ id: selectedVC.id });
                setDetailModalVisible(false);
              }}
            >
              Revoke
            </Button>
          ),
        ]}
        width={900}
      >
        {selectedVC && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <FileTextOutlined style={{ fontSize: 32, color: '#1677FF' }} />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold m-0">{selectedVC.schema}</h2>
                <p className="text-gray-500 m-0 mt-1">鍑瘉ID: {selectedVC.id}</p>
                <Space className="mt-2">
                  <Tag color={VC_TYPE_MAP[selectedVC.type as keyof typeof VC_TYPE_MAP].color}>
                    {VC_TYPE_MAP[selectedVC.type as keyof typeof VC_TYPE_MAP].text}
                  </Tag>
                  <Tag color={VC_FORMAT_MAP[selectedVC.format as keyof typeof VC_FORMAT_MAP].color}>
                    {VC_FORMAT_MAP[selectedVC.format as keyof typeof VC_FORMAT_MAP].text}
                  </Tag>
                  <Tag color={VC_STATUS_MAP[selectedVC.status as keyof typeof VC_STATUS_MAP].color}>
                    {VC_STATUS_MAP[selectedVC.status as keyof typeof VC_STATUS_MAP].text}
                  </Tag>
                </Space>
              </div>
            </div>

            <Descriptions bordered column={2}>
              <Descriptions.Item label="Issuer">
                <div className="font-mono text-sm">{selectedVC.issuer}</div>
              </Descriptions.Item>
              <Descriptions.Item label="Holder">
                <div className="font-mono text-sm">{selectedVC.holder}</div>
              </Descriptions.Item>
              <Descriptions.Item label="鍙戣鏃ユ湡">
                {dayjs(selectedVC.issuanceDate).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="杩囨湡鏃ユ湡">
                {dayjs(selectedVC.expirationDate).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="绛惧悕绫诲瀷">
                {selectedVC.proofType}
              </Descriptions.Item>
              <Descriptions.Item label="閾句笂閿氬畾">
                {selectedVC.onChainAnchor ? (
                  <Tag color="green">Anchored</Tag>
                ) : (
                  <Tag color="gray">Not Anchored</Tag>
                )}
              </Descriptions.Item>
              {selectedVC.onChainAnchor && (
                <Descriptions.Item label="閿氬畾浜ゆ槗">
                  <span className="font-mono text-sm">{selectedVC.anchorTx}</span>
                </Descriptions.Item>
              )}
              {selectedVC.status === 'revoked' && (
                <Descriptions.Item label="鎾ら攢鍘熷洜">
                  {selectedVC.revokedReason}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider />

            <h3 className="font-bold mb-4">鍑瘉涓讳綋淇℃伅</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="text-sm font-mono overflow-x-auto">
                {JSON.stringify(selectedVC.credentialSubject, null, 2)}
              </pre>
            </div>

            <Divider />

            <h3 className="font-bold mb-4">楠岃瘉缁熻</h3>
            <Descriptions bordered column={3}>
              <Descriptions.Item label="楠岃瘉娆℃暟">
                <span className="text-lg font-bold text-blue-600">{selectedVC.verificationCount}</span>
              </Descriptions.Item>
              <Descriptions.Item label="On-chain Verifications">3 times</Descriptions.Item>
              <Descriptions.Item label="Offline Verifications">9 times</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}