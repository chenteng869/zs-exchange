'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Row, Col, Card, Table, Tag, Button, Modal, Form, Input, Select, Space, message, Popconfirm, Badge, Descriptions, Statistic, Progress, List, Typography, Switch, InputNumber, Tooltip } from 'antd';
import {
  LockOutlined,
  KeyOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  DatabaseOutlined,
  CreditCardOutlined,
  FileProtectOutlined,
  CloudServerOutlined,
  SyncOutlined,
  HistoryOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';
const { Text, Paragraph } = Typography;

// 加密算法类型
type EncryptionAlgorithm = 'AES-256-GCM' | 'RSA-2048' | 'RSA-4096' | 'ChaCha20-Poly1305' | 'SHA-256' | 'SHA-512' | 'ECDSA-secp256k1';

// 加密策略接口
interface EncryptionPolicy {
  id: string;
  name: string;
  algorithm: EncryptionAlgorithm;
  targetFields: string[];
  targetTable: string;
  status: 'active' | 'inactive' | 'deprecated';
  lastRotated: string;
  nextRotation: string;
  rotationPeriod: number; // 天数
  coverage: number; // 百分比
  encryptedRecords: number;
  totalRecords: number;
  createdAt: string;
  updatedAt: string;
}

// 密钥接口
interface CryptoKey {
  id: string;
  keyId: string;
  alias: string;
  algorithm: EncryptionAlgorithm;
  keySize: number;
  status: 'active' | 'deprecated' | 'compromised' | 'rotating';
  createdAt: string;
  expiresAt: string;
  rotationPeriod: number;
  lastUsed: string;
  usageCount: number;
  description: string;
}

// 模拟加密策略数据
const mockPolicies: EncryptionPolicy[] = [
  { id: 'EP-001', name: '用户手机号加密', algorithm: 'AES-256-GCM', targetFields: ['phone_number'], targetTable: 'users', status: 'active', lastRotated: '2024-05-15', nextRotation: '2024-08-15', rotationPeriod: 90, coverage: 100, encryptedRecords: 25800, totalRecords: 25800, createdAt: '2024-01-01', updatedAt: '2024-05-15' },
  { id: 'EP-002', name: '用户身份证号加密', algorithm: 'AES-256-GCM', targetFields: ['id_card_number', 'id_card_name'], targetTable: 'user_kyc', status: 'active', lastRotated: '2024-05-20', nextRotation: '2024-08-20', rotationPeriod: 90, coverage: 100, encryptedRecords: 18650, totalRecords: 18650, createdAt: '2024-01-15', updatedAt: '2024-05-20' },
  { id: 'EP-003', name: '银行卡信息加密', algorithm: 'RSA-4096', targetFields: ['bank_account', 'bank_name'], targetTable: 'payment_methods', status: 'active', lastRotated: '2024-06-01', nextRotation: '2024-12-01', rotationPeriod: 180, coverage: 100, encryptedRecords: 12340, totalRecords: 12340, createdAt: '2024-02-01', updatedAt: '2024-06-01' },
  { id: 'EP-004', name: '钱包私钥加密存储', algorithm: 'ChaCha20-Poly1305', targetFields: ['encrypted_private_key', 'salt'], targetTable: 'user_wallets', status: 'active', lastRotated: '2024-05-10', nextRotation: '2024-08-10', rotationPeriod: 90, coverage: 98.5, encryptedRecords: 21450, totalRecords: 21780, createdAt: '2024-01-10', updatedAt: '2024-05-10' },
  { id: 'EP-005', name: '交易备注字段加密', algorithm: 'AES-256-GCM', targetFields: ['memo', 'remark'], targetTable: 'transactions', status: 'active', lastRotated: '2024-04-01', nextRotation: '2024-07-01', rotationPeriod: 90, coverage: 95.2, encryptedRecords: 856000, totalRecords: 898500, createdAt: '2024-03-01', updatedAt: '2024-04-01' },
  { id: 'EP-006', name: 'API密钥加密', algorithm: 'AES-256-GCM', targetFields: ['api_key_secret', 'api_key_hash'], targetTable: 'api_credentials', status: 'active', lastRotated: '2024-05-25', nextRotation: '2024-06-25', rotationPeriod: 30, coverage: 100, encryptedRecords: 156, totalRecords: 156, createdAt: '2024-04-15', updatedAt: '2024-05-25' },
  { id: 'EP-007', name: '会话Token加密', algorithm: 'ChaCha20-Poly1305', targetFields: ['session_data', 'refresh_token'], targetTable: 'sessions', status: 'active', lastRotated: '2024-06-05', nextRotation: '2024-07-05', rotationPeriod: 30, coverage: 99.8, encryptedRecords: 5230, totalRecords: 5240, createdAt: '2024-05-01', updatedAt: '2024-06-05' },
  { id: 'EP-008', name: '旧版MD5密码哈希(待迁移)', algorithm: 'SHA-256', targetFields: ['password_hash'], targetTable: 'users_legacy', status: 'deprecated', lastRotated: '2023-01-01', nextRotation: '-', rotationPeriod: 0, coverage: 100, encryptedRecords: 5200, totalRecords: 5200, createdAt: '2020-01-01', updatedAt: '2023-01-01' },
];

// 模拟密钥数据
const mockKeys: CryptoKey[] = [
  { id: 'KEY-001', keyId: 'key-aes-data-2024q2', alias: '主数据加密密钥', algorithm: 'AES-256-GCM', keySize: 256, status: 'active', createdAt: '2024-04-01', expiresAt: '2025-04-01', rotationPeriod: 90, lastUsed: '2024-06-08 14:30:00', usageCount: 1584200, description: '用于用户敏感数据字段的对称加密主密钥' },
  { id: 'KEY-002', keyId: 'key-rsa-payment-2024', alias: '支付数据加密密钥对', algorithm: 'RSA-4096', keySize: 4096, status: 'active', createdAt: '2024-06-01', expiresAt: '2025-06-01', rotationPeriod: 180, lastUsed: '2024-06-08 14:25:00', usageCount: 85620, description: '用于银行卡信息和支付数据的非对称加密' },
  { id: 'KEY-003', keyId: 'key-chacha-wallet-2024', alias: '钱包私钥保护密钥', algorithm: 'ChaCha20-Poly1305', keySize: 256, status: 'active', createdAt: '2024-05-10', expiresAt: '2025-05-10', rotationPeriod: 90, lastUsed: '2024-06-08 14:20:00', usageCount: 245800, description: '用于加密存储用户钱包私钥的DEK' },
  { id: 'KEY-004', keyId: 'key-hmac-api-sign', alias: 'API签名HMAC密钥', algorithm: 'SHA-256', keySize: 256, status: 'active', createdAt: '2024-05-25', expiresAt: '2024-06-25', rotationPeriod: 30, lastUsed: '2024-06-08 14:35:00', usageCount: 5240000, description: '用于API请求签名验证的HMAC密钥' },
  { id: 'KEY-005', keyId: 'key-ecdsa-chain', alias: '区块链签名密钥', algorithm: 'ECDSA-secp256k1', keySize: 256, status: 'active', createdAt: '2024-01-01', expiresAt: '2025-01-01', rotationPeriod: 365, lastUsed: '2024-06-08 14:15:00', usageCount: 12580, description: '用于链上交易的ECDSA签名密钥对' },
  { id: 'KEY-006', keyId: 'key-aes-data-2024q1', alias: 'Q1数据加密密钥(已轮换)', algorithm: 'AES-256-GCM', keySize: 256, status: 'deprecated', createdAt: '2024-01-01', expiresAt: '2024-04-01', rotationPeriod: 90, lastUsed: '2024-04-01 00:00:00', usageCount: 985000, description: '2024年Q1季度数据加密密钥，已完成轮换' },
  { id: 'KEY-007', keyId: 'key-tls-cert-sign', alias: 'TLS证书签名密钥', algorithm: 'RSA-2048', keySize: 2048, status: 'rotating', createdAt: '2023-06-08', expiresAt: '2024-09-08', rotationPeriod: 365, lastUsed: '2024-06-08 14:00:00', usageCount: Infinity, description: '内部TLS证书签发CA密钥，正在轮换中' },
];

// 加密覆盖率图表
const coverageOption = {
  tooltip: { trigger: 'axis', formatter: '{b}<br/>覆盖率: {c}%' },
  radar: {
    indicator: [
      { name: '用户基本信息', max: 100 },
      { name: 'KYC身份信息', max: 100 },
      { name: '支付卡信息', max: 100 },
      { name: '钱包私钥', max: 100 },
      { name: '交易数据', max: 100 },
      { name: '会话数据', max: 100 },
    ],
  },
  series: [{
    type: 'radar',
    data: [{ value: [100, 100, 100, 98.5, 95.2, 99.8], name: '加密覆盖率', areaStyle: { opacity: 0.3 } }],
  }],
};

// 密钥生命周期分布
const keyLifecycleOption = {
  tooltip: { trigger: 'item' },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    data: [
      { value: 5, name: '使用中', itemStyle: { color: '#16A34A' } },
      { value: 1, name: '已弃用', itemStyle: { color: '#8c8c8c' } },
      { value: 1, name: '轮换中', itemStyle: { color: '#1677FF' } },
    ],
    label: { formatter: '{b}\n{c}个' },
  }],
};

export default function EncryptionPage() {
  const queryClient = useQueryClient();
  const [policyModalVisible, setPolicyModalVisible] = useState(false);
  const [keyModalVisible, setKeyModalVisible] = useState(false);
  const [selectedKey, setSelectedKey] = useState<CryptoKey | null>(null);
  const [activeTab, setActiveTab] = useState<'policies' | 'keys'>('policies');
  const [policyForm] = Form.useForm();

  // 密钥轮换
  const rotateKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      await new Promise(r => setTimeout(r, 1500));
      return keyId;
    },
    onSuccess: () => {
      message.success('密钥轮换任务已提交');
      queryClient.invalidateQueries({ queryKey: ['encryption-data'] });
    },
  });

  // 加密策略表格列
  const policyColumns = [
    { title: '策略名称', dataIndex: 'name', key: 'name', render: (name: string) => <span className="font-medium">{name}</span> },
    {
      title: '算法', dataIndex: 'algorithm', key: 'algorithm', width: 160,
      render: (algo: EncryptionAlgorithm) => <Tag color="blue"><code className="text-xs">{algo}</code></Tag>,
    },
    {
      title: '目标', key: 'target', width: 180,
      render: (_: any, p: EncryptionPolicy) => (
        <div>
          <div className="text-xs font-mono text-blue-600">{p.targetTable}</div>
          <div className="text-xs text-gray-400">{p.targetFields.join(', ')}</div>
        </div>
      ),
    },
    {
      title: '覆盖率', dataIndex: 'coverage', key: 'coverage', width: 140,
      render: (cov: number, p: EncryptionPolicy) => (
        <div>
          <Progress percent={Math.round(cov)} size="small" status={cov === 100 ? 'success' : cov >= 95 ? 'normal' : 'exception'} format={() => `${cov}%`} />
          <div className="text-xs text-gray-400">{p.encryptedRecords.toLocaleString()} / {p.totalRecords.toLocaleString()}</div>
        </div>
      ),
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (status: string) => {
        const configs: Record<string, { badge: string; text: string }> = { active: { badge: 'success', text: '生效中' }, inactive: { badge: 'default', text: '未启用' }, deprecated: { badge: 'warning', text: '已废弃' } };
        const c = configs[status];
        return <Badge status={c.badge as any} text={c.text} />;
      },
    },
    { title: '上次轮换', dataIndex: 'lastRotated', key: 'lastRotated', width: 120 },
    { title: '下次轮换', dataIndex: 'nextRotation', key: 'nextRotation', width: 120 },
    {
      title: '操作', key: 'actions', width: 140,
      render: () => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
          <Button type="link" size="small" icon={<ReloadOutlined />}>立即轮换</Button>
        </Space>
      ),
    },
  ];

  // 密钥表格列
  const keyColumns = [
    { title: '密钥别名', dataIndex: 'alias', key: 'alias', render: (alias: string) => <span className="font-medium">{alias}</span> },
    { title: 'Key ID', dataIndex: 'keyId', key: 'keyId', width: 200, render: (id: string) => <code className="text-xs bg-gray-100 px-2 py-1 rounded">{id}</code> },
    {
      title: '算法', key: 'algorithm', width: 170,
      render: (_: any, k: CryptoKey) => (
        <div>
          <Tag color="blue"><code className="text-xs">{k.algorithm}</code></Tag>
          <span className="text-xs text-gray-400 ml-1">{k.keySize}-bit</span>
        </div>
      ),
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (status: string) => {
        const configs: Record<string, { color: string; text: string }> = { active: { color: 'green', text: '使用中' }, deprecated: { color: 'default', text: '已弃用' }, compromised: { color: 'red', text: '已泄露' }, rotating: { color: 'blue', text: '轮换中' } };
        const c = configs[status];
        return <Badge status={c.color as any} text={c.text} />;
      },
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 120 },
    { title: '有效期至', dataIndex: 'expiresAt', key: 'expiresAt', width: 120 },
    { title: '轮换周期', dataIndex: 'rotationPeriod', key: 'rotationPeriod', width: 90, render: (days: number) => days > 0 ? `${days}天` : '-' },
    { title: '使用次数', dataIndex: 'usageCount', key: 'usageCount', width: 100, render: (count: number) => count === Infinity ? <Text type="secondary">持续</Text> : count.toLocaleString() },
    {
      title: '操作', key: 'actions', width: 160,
      render: (_: any, k: CryptoKey) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedKey(k); setKeyModalVisible(true); }}>详情</Button>
          {k.status === 'active' && (
            <Popconfirm title="确定执行密钥轮换？" onConfirm={() => rotateKeyMutation.mutate(k.id)} okText="确定" cancelText="取消">
              <Button type="link" size="small" icon={<SyncOutlined />} loading={rotateKeyMutation.isPending}>轮换</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3 mb-6">
          <LockOutlined className="text-2xl text-indigo-600" />
          <h1 className="text-2xl font-bold m-0">数据加密与密钥管理中心</h1>
        </div>

        {/* 统计概览 */}
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}><Card size="small" className="shadow-sm"><Statistic title="加密策略" value={mockPolicies.length} prefix={<FileProtectOutlined />} /></Card></Col>
          <Col xs={12} sm={6}><Card size="small" className="shadow-sm"><Statistic title="活跃密钥" value={mockKeys.filter(k => k.status === 'active').length} prefix={<KeyOutlined />} valueStyle={{ color: '#16A34A' }} /></Card></Col>
          <Col xs={12} sm={6}><Card size="small" className="shadow-sm"><Statistic title="平均覆盖率" value={97.8} suffix="%" precision={1} valueStyle={{ color: '#1677FF' }} /></Card></Col>
          <Col xs={12} sm={6}><Card size="small" className="shadow-sm"><Statistic title="加密记录总数" value={1845726} prefix={<DatabaseOutlined />} /></Card></Col>
        </Row>

        {/* 主内容区 - Tabs切换 */}
        <Card className="shadow-sm" extra={
          <Space>
            <Button.Group>
              <Button type={activeTab === 'policies' ? 'primary' : 'default'} onClick={() => setActiveTab('policies')} icon={<FileProtectOutlined />}>加密策略</Button>
              <Button type={activeTab === 'keys' ? 'primary' : 'default'} onClick={() => setActiveTab('keys')} icon={<KeyOutlined />}>密钥管理</Button>
            </Button.Group>
            {activeTab === 'policies' && <Button type="primary" icon={<PlusOutlined />} onClick={() => setPolicyModalVisible(true)}>新增策略</Button>}
          </Space>
        }>
          {activeTab === 'policies' ? (
            <Table dataSource={mockPolicies} columns={policyColumns} rowKey="id" pagination={{ pageSize: 6, showTotal: t => `共${t}条策略` }} size="middle" />
          ) : (
            <Table dataSource={mockKeys} columns={keyColumns} rowKey="id" pagination={{ pageSize: 6, showTotal: t => `共${t}把密钥` }} size="middle" />
          )}
        </Card>

        {/* 图表区域 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="加密覆盖率雷达图" className="shadow-sm">
              <SafeECharts option={coverageOption} style={{ height: 320 }} title="加密覆盖率" />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="密钥生命周期分布" className="shadow-sm">
              <SafeECharts option={keyLifecycleOption} style={{ height: 320 }} title="密钥分布" />
            </Card>
          </Col>
        </Row>

        {/* 新增策略弹窗 */}
        <Modal title="新增加密策略" open={policyModalVisible} onCancel={() => setPolicyModalVisible(false)} width={600} okText="创建" onOk={async () => {
          try {
            await policyForm.validateFields();
            await new Promise(r => setTimeout(r, 500));
            message.success('加密策略创建成功');
            setPolicyModalVisible(false);
          } catch {}
        }}>
          <Form form={policyForm} layout="vertical" className="mt-4">
            <Form.Item name="name" label="策略名称" rules={[{ required: true }]}>
              <Input placeholder="例如: 用户邮箱加密" prefix={<LockOutlined />} />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="algorithm" label="加密算法" rules={[{ required: true }]}>
                  <Select options={[
                    { label: 'AES-256-GCM (推荐)', value: 'AES-256-GCM' },
                    { label: 'ChaCha20-Poly1305', value: 'ChaCha20-Poly1305' },
                    { label: 'RSA-2048', value: 'RSA-2048' },
                    { label: 'RSA-4096', value: 'RSA-4096' },
                  ]} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="rotationPeriod" label="轮换周期(天)" initialValue={90}>
                  <InputNumber min={1} max={365} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="targetTable" label="目标数据表" rules={[{ required: true }]}>
              <Input placeholder="例如: users" prefix={<DatabaseOutlined />} />
            </Form.Item>
            <Form.Item name="targetFields" label="目标字段(逗号分隔)" rules={[{ required: true }]}>
              <Input placeholder="例如: phone_number, email, id_card" />
            </Form.Item>
          </Form>
        </Modal>

        {/* 密钥详情弹窗 */}
        <Modal title={`密钥详情 - ${selectedKey?.alias || ''}`} open={keyModalVisible} onCancel={() => setKeyModalVisible(false)} width={650} footer={<Button onClick={() => setKeyModalVisible(false)}>关闭</Button>}>
          {selectedKey && (
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="密钥别名" span={2}><span className="font-bold">{selectedKey.alias}</span></Descriptions.Item>
              <Descriptions.Item label="Key ID" span={2}><code className="bg-gray-100 px-2 py-1 rounded">{selectedKey.keyId}</code></Descriptions.Item>
              <Descriptions.Item label="算法"><Tag color="blue"><code>{selectedKey.algorithm}</code></Tag> ({selectedKey.keySize}-bit)</Descriptions.Item>
              <Descriptions.Item label="状态"><Badge status={{ active: 'success', deprecated: 'default', compromised: 'error', rotating: 'processing' }[selectedKey.status] as any} text={{ active: '使用中', deprecated: '已弃用', compromised: '已泄露', rotating: '轮换中' }[selectedKey.status]} /></Descriptions.Item>
              <Descriptions.Item label="创建时间">{selectedKey.createdAt}</Descriptions.Item>
              <Descriptions.Item label="有效期至">{selectedKey.expiresAt}</Descriptions.Item>
              <Descriptions.Item label="轮换周期">{selectedKey.rotationPeriod > 0 ? `${selectedKey.rotationPeriod}天` : '不轮换'}</Descriptions.Item>
              <Descriptions.Item label="最后使用">{selectedKey.lastUsed}</Descriptions.Item>
              <Descriptions.Item label="使用次数">{selectedKey.usageCount === Infinity ? '持续使用中' : selectedKey.usageCount.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>{selectedKey.description}</Descriptions.Item>
            </Descriptions>
          )}
        </Modal>

        {/* 安全提示 */}
        <Card className="shadow-sm bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <div className="flex items-start gap-3">
            <SafetyCertificateOutlined className="text-xl text-indigo-500 mt-1" />
            <div>
              <h4 className="font-bold text-indigo-700 m-0 mb-1">加密安全最佳实践</h4>
              <p className="text-sm text-indigo-600 m-0">
                中萨数字科技交易所严格遵循PCI-DSS和等保三级加密要求。所有PII数据必须使用AES-256-GCM或更强算法加密存储；
                支付卡信息使用RSA-4096非对称加密；钱包私钥采用ChaCha20-Poly1305加密后分片存储于HSM中。
                密钥轮换周期：数据加密密钥90天，签名密钥365天，API密钥30天。
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
