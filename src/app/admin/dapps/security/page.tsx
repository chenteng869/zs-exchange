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
  Row,
  Col,
  Card,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  WarningOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';

const THREAT_TYPE_MAP = {
  phishing: { color: 'red', text: '閽撻奔鏀诲嚮', icon: <WarningOutlined /> },
  scam: { color: 'orange', text: 'Scam', icon: <WarningOutlined /> },
  malware: { color: 'purple', text: '鎭舵剰杞欢', icon: <WarningOutlined /> },
  homograph: { color: 'cyan', text: '鍚屽舰鏀诲嚮', icon: <WarningOutlined /> },
  suspicious: { color: 'yellow', text: 'Suspicious', icon: <WarningOutlined /> },
};

const STATUS_MAP = {
  active: { color: 'red', text: 'Active' },
  resolved: { color: 'green', text: 'Resolved' },
  pending: { color: 'blue', text: 'Pending' },
};

export default function SecurityManagementPage() {
  const queryClient = useQueryClient();
  const [selectedThreat, setSelectedThreat] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const mockThreats = [
    {
      id: 'threat-001',
      type: 'phishing',
      url: 'https://uniswap-scam.com',
      domain: 'uniswap-scam.com',
      target: 'Uniswap',
      status: 'active',
      severity: 'high',
      detectedAt: '2024-01-20T10:30:00Z',
      lastSeen: '2024-01-20T14:22:00Z',
      reports: 156,
      description: 'Domain is similar to Uniswap and suspected phishing',
      evidence: ['Domain similarity 95%', 'Page structure imitation', 'Malicious script detected'],
      blockedUsers: 8920,
      resolvedAt: null,
    },
    {
      id: 'threat-002',
      type: 'scam',
      url: 'https://fake-nft-sale.com',
      domain: 'fake-nft-sale.com',
      target: 'OpenSea',
      status: 'resolved',
      severity: 'medium',
      detectedAt: '2024-01-18T08:15:00Z',
      lastSeen: '2024-01-19T12:00:00Z',
      reports: 45,
      description: 'Fake NFT sale site with multiple user reports',
      evidence: ['铏氬亣鎵胯', '鏃犲疄闄匩FT', '鐢ㄦ埛涓炬姤'],
      blockedUsers: 2340,
      resolvedAt: '2024-01-19T16:00:00Z',
    },
    {
      id: 'threat-003',
      type: 'homograph',
      url: 'https://xn--uniswa-43d.com',
      domain: 'xn--uniswa-43d.com',
      target: 'Uniswap',
      status: 'active',
      severity: 'high',
      detectedAt: '2024-01-19T15:45:00Z',
      lastSeen: '2024-01-20T10:00:00Z',
      reports: 89,
      description: 'Unicode homograph domain impersonating Uniswap',
      evidence: ['Unicode homograph detected', 'Confusing domain', 'Abnormal DNS records'],
      blockedUsers: 5670,
      resolvedAt: null,
    },
    {
      id: 'threat-004',
      type: 'malware',
      url: 'https://malware-dapp.com',
      domain: 'malware-dapp.com',
      target: 'Unknown',
      status: 'pending',
      severity: 'high',
      detectedAt: '2024-01-20T09:20:00Z',
      lastSeen: '2024-01-20T09:20:00Z',
      reports: 12,
      description: 'Malware download link detected',
      evidence: ['Malware file signature', 'Virus scan detected', 'Suspicious download behavior'],
      blockedUsers: 120,
      resolvedAt: null,
    },
    {
      id: 'threat-005',
      type: 'suspicious',
      url: 'https://suspicious-defi.com',
      domain: 'suspicious-defi.com',
      target: 'DeFi',
      status: 'pending',
      severity: 'medium',
      detectedAt: '2024-01-20T11:30:00Z',
      lastSeen: '2024-01-20T11:30:00Z',
      reports: 8,
      description: 'New DeFi protocol with unknown audit status',
      evidence: ['No audit report', 'Anonymous development team', 'Obfuscated code'],
      blockedUsers: 89,
      resolvedAt: null,
    },
  ];

  const mockStats = {
    totalThreats: 156,
    activeThreats: 45,
    resolvedThreats: 108,
    blockedUsers: 125800,
    todayThreats: 12,
    avgResponseTime: '2.5 min',
  };

  const { data, isLoading } = useQuery({
    queryKey: ['security-threats', searchKeyword, typeFilter],
    queryFn: async () => {
      let filtered = mockThreats;
      if (searchKeyword) {
        filtered = filtered.filter(threat =>
          threat.url.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          threat.domain.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          threat.target.toLowerCase().includes(searchKeyword.toLowerCase())
        );
      }
      if (typeFilter) {
        filtered = filtered.filter(threat => threat.type === typeFilter);
      }
      return { items: filtered, total: filtered.length, page: 1, pageSize: 50 };
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { id };
    },
    onSuccess: () => {
      message.success('Threat resolved');
      queryClient.invalidateQueries({ queryKey: ['security-threats'] });
    },
    onError: () => {
      message.error('鎿嶄綔澶辫触');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { id };
    },
    onSuccess: () => {
      message.success('Record deleted');
      queryClient.invalidateQueries({ queryKey: ['security-threats'] });
    },
    onError: () => {
      message.error('鎿嶄綔澶辫触');
    },
  });

  const columns = [
    {
      title: 'Threat Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const t = THREAT_TYPE_MAP[type as keyof typeof THREAT_TYPE_MAP] || THREAT_TYPE_MAP.suspicious;
        return (
          <Space>
            {t.icon}
            <Tag color={t.color}>{t.text}</Tag>
          </Space>
        );
      },
    },
    {
      title: '鎭舵剰URL',
      dataIndex: 'url',
      key: 'url',
      width: 250,
      render: (url: string) => (
        <div className="font-mono text-sm break-all">{url}</div>
      ),
    },
    {
      title: 'URL',
      dataIndex: 'target',
      key: 'target',
      width: 120,
    },
    {
      title: '涓ラ噸绋嬪害',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: string) => {
        const color = severity === 'high' ? 'red' : severity === 'medium' ? 'orange' : 'blue';
        return <Tag color={color}>{severity === 'high' ? 'High' : severity === 'medium' ? 'Medium' : 'Low'}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const s = STATUS_MAP[status as keyof typeof STATUS_MAP] || STATUS_MAP.pending;
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '涓炬姤娆℃暟',
      dataIndex: 'reports',
      key: 'reports',
      width: 100,
    },
    {
      title: '鎷︽埅鐢ㄦ埛',
      dataIndex: 'blockedUsers',
      key: 'blockedUsers',
      width: 120,
      render: (count: number) => count.toLocaleString(),
    },
    {
      title: 'Detected At',
      dataIndex: 'detectedAt',
      key: 'detectedAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
  ];

  const actions: any[] = [
    {
      key: 'view',
      label: '鏌ョ湅璇︽儏',
      icon: <SafetyCertificateOutlined />,
      onClick: (record: any) => {
        setSelectedThreat(record);
        setDetailModalVisible(true);
      },
    },
    {
      key: 'resolve',
      label: 'Mark Resolved',
      icon: <CheckCircleOutlined />,
      type: 'primary',
      hidden: (record: any) => record.status === 'resolved',
      onClick: (record: any) => {
        resolveMutation.mutate({ id: record.id });
      },
    },
    {
      key: 'delete',
      label: '鍒犻櫎璁板綍',
      icon: <DeleteOutlined />,
      danger: true,
      confirm: (record: any) => ({
        title: '纭畾瑕佸垹闄よ濞佽儊璁板綍鍚楋紵',
        description: 'This deletion cannot be undone',
        onConfirm: () => {
          deleteMutation.mutate({ id: record.id });
        },
      }),
    },
  ];

  const filterOptions = [
    { label: 'All Types', value: '' },
    { label: '閽撻奔鏀诲嚮', value: 'phishing' },
    { label: 'Scam', value: 'scam' },
    { label: '鎭舵剰杞欢', value: 'malware' },
    { label: '鍚屽舰鏀诲嚮', value: 'homograph' },
    { label: 'Suspicious', value: 'suspicious' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold m-0">Security Detection</h1>
          <Space>
            <Button type="primary" icon={<PlusOutlined />}>
              Add Blacklist
            </Button>
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <WarningOutlined style={{ color: '#DC2626', fontSize: 24 }} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{mockStats.totalThreats}</div>
                  <div className="text-sm text-gray-500">濞佽儊鎬绘暟</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <SafetyCertificateOutlined style={{ color: '#F59E0B', fontSize: 24 }} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{mockStats.activeThreats}</div>
                  <div className="text-sm text-gray-500">娲昏穬濞佽儊</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircleOutlined style={{ color: '#16A34A', fontSize: 24 }} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{mockStats.resolvedThreats}</div>
                  <div className="text-sm text-gray-500">Resolved</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <SafetyCertificateOutlined style={{ color: '#1677FF', fontSize: 24 }} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{mockStats.blockedUsers.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Blocked Users</div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        <DataTable
          title=""
          columns={columns}
          dataSource={data?.items || []}
          loading={isLoading}
          showSearch
          searchPlaceholder="Search URL, domain, or target"
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
        title="濞佽儊璇︽儏"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
          selectedThreat?.status !== 'resolved' && (
            <Button
              key="resolve"
              type="primary"
              onClick={() => {
                resolveMutation.mutate({ id: selectedThreat.id });
                setDetailModalVisible(false);
              }}
            >
              Mark Resolved
            </Button>
          ),
        ]}
        width={900}
      >
        {selectedThreat && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                {THREAT_TYPE_MAP[selectedThreat.type as keyof typeof THREAT_TYPE_MAP].icon}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold m-0">{selectedThreat.url}</h2>
                <p className="text-gray-500 m-0 mt-1">{selectedThreat.description}</p>
                <Space className="mt-2">
                  <Tag color={THREAT_TYPE_MAP[selectedThreat.type as keyof typeof THREAT_TYPE_MAP].color}>
                    {THREAT_TYPE_MAP[selectedThreat.type as keyof typeof THREAT_TYPE_MAP].text}
                  </Tag>
                  <Tag color={selectedThreat.severity === 'high' ? 'red' : selectedThreat.severity === 'medium' ? 'orange' : 'blue'}>
                    {selectedThreat.severity === 'high' ? 'High Risk' : selectedThreat.severity === 'medium' ? 'Medium Risk' : 'Low Risk'}
                  </Tag>
                  <Tag color={STATUS_MAP[selectedThreat.status as keyof typeof STATUS_MAP].color}>
                    {STATUS_MAP[selectedThreat.status as keyof typeof STATUS_MAP].text}
                  </Tag>
                </Space>
              </div>
            </div>

            <Descriptions bordered column={2}>
              <Descriptions.Item label="鎭舵剰URL">
                <div className="font-mono text-sm">{selectedThreat.url}</div>
              </Descriptions.Item>
              <Descriptions.Item label="鍩熷悕">{selectedThreat.domain}</Descriptions.Item>
              <Descriptions.Item label="鐩爣椤圭洰">{selectedThreat.target}</Descriptions.Item>
              <Descriptions.Item label="涓ラ噸绋嬪害">
                <Tag color={selectedThreat.severity === 'high' ? 'red' : selectedThreat.severity === 'medium' ? 'orange' : 'blue'}>
                  {selectedThreat.severity === 'high' ? 'High' : selectedThreat.severity === 'medium' ? 'Medium' : 'Low'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Detected At">
                {dayjs(selectedThreat.detectedAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="Last Seen">
                {dayjs(selectedThreat.lastSeen).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="涓炬姤娆℃暟">{selectedThreat.reports}</Descriptions.Item>
              <Descriptions.Item label="Blocked Users">{selectedThreat.blockedUsers.toLocaleString()}</Descriptions.Item>
              {selectedThreat.status === 'resolved' && (
                <Descriptions.Item label="瑙ｅ喅鏃堕棿">
                  {dayjs(selectedThreat.resolvedAt).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider />

            <h3 className="font-bold mb-4">濞佽儊璇佹嵁</h3>
            <ul className="space-y-2">
              {selectedThreat.evidence.map((item: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <WarningOutlined className="text-red-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}