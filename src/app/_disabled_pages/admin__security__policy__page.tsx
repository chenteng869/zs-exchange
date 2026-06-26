'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Row, Col, Card, Table, Tag, Button, Modal, Form, Input, Select, Space, message, Popconfirm, Switch, Badge, Descriptions, InputNumber, Typography, Tooltip, Empty } from 'antd';
import {
  FileProtectOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
  CodeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HistoryOutlined,
  SettingOutlined,
  CopyOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
const { Text, Paragraph } = Typography;

// 策略类别
type PolicyCategory = 'access_control' | 'network_security' | 'data_protection' | 'endpoint_security' | 'application_security' | 'compliance' | 'blockchain_security' | 'incident_response';

// 安全策略接口
interface SecurityPolicy {
  id: string;
  name: string;
  category: PolicyCategory;
  version: string;
  status: 'active' | 'inactive' | 'draft' | 'archived';
  effectiveDate: string;
  expiryDate?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  config: Record<string, any>; // JSON配置
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  complianceTags: string[];
}

// 模拟安全策略数据
const mockPolicies: SecurityPolicy[] = [
  {
    id: 'POL-001', name: '强密码策略', category: 'access_control', version: 'v2.1', status: 'active',
    effectiveDate: '2024-01-01', priority: 'critical',
    description: '规定全系统密码复杂度要求、有效期和重置规则',
    config: {
      minLength: 12, maxLength: 64, requireUppercase: true, requireLowercase: true,
      requireNumbers: true, requireSpecialChars: true, maxAgeDays: 90,
      historyCount: 12, lockoutThreshold: 5, lockoutDurationMinutes: 30,
      forbiddenPatterns: ['password', '123456', 'guoxue', 'admin'],
    },
    createdBy: 'zhang_wei', createdAt: '2024-01-01', updatedAt: '2024-05-15',
    complianceTags: ['等保三级', 'PCI-DSS', 'ISO27001'],
  },
  {
    id: 'POL-002', name: '多因素认证(MFA)策略', category: 'access_control', version: 'v1.5', status: 'active',
    effectiveDate: '2024-02-01', priority: 'critical',
    description: '强制关键操作和多风险场景下的多因素身份验证要求',
    config: {
      enforceForRoles: ['super_admin', 'security_admin', 'finance_admin'],
      enforceForOperations: ['login', 'fund_withdrawal', 'api_key_create', 'role_change', 'large_transfer'],
      mfaMethods: ['totp', 'sms', 'hardware_key'],
      totpPeriodSeconds: 30, smsCooldownSeconds: 60, backupCodesCount: 10,
      trustedDeviceDays: 7,
    },
    createdBy: 'admin', createdAt: '2024-02-01', updatedAt: '2024-06-01',
    complianceTags: ['等保三级', 'SOC2-Type2'],
  },
  {
    id: 'POL-003', name: '网络安全分段策略', category: 'network_security', version: 'v3.0', status: 'active',
    effectiveDate: '2024-03-01', priority: 'high',
    description: '定义网络区域划分、VLAN隔离和跨区域通信规则',
    config: {
      zones: ['DMZ', 'Application', 'Database', 'Management', 'Blockchain', 'Backup'],
      defaultDenyAll: true,
      rules: [
        { from: 'DMZ', to: 'Application', protocols: ['HTTPS/443'], action: 'allow' },
        { from: 'Application', to: 'Database', protocols: ['MySQL/3306', 'Redis/6379'], action: 'allow' },
        { from: 'Management', to: '*', protocols: ['SSH/22'], action: 'allow', sourceRestriction: 'VPN_ONLY' },
        { from: 'Blockchain', to: 'Database', protocols: ['Custom/8545'], action: 'allow' },
      ],
    },
    createdBy: 'chen_hui', createdAt: '2024-03-01', updatedAt: '2024-05-20',
    complianceTags: ['等保三级', 'ISO27001'],
  },
  {
    id: 'POL-004', name: '数据分类与加密策略', category: 'data_protection', version: 'v2.0', status: 'active',
    effectiveDate: '2024-02-15', priority: 'critical',
    description: '定义数据敏感级别分类标准和对应的加密/脱敏要求',
    config: {
      classifications: [
        { level: 4, label: '绝密', examples: ['私钥种子短语', 'HSM主密钥'], encryptAtRest: 'AES-256-GCM', encryptInTransit: 'TLS1.3', maskRule: 'full_replace' },
        { level: 3, label: '机密', examples: ['身份证号', '银行卡号', '钱包私钥'], encryptAtRest: 'AES-256-GCM', encryptInTransit: 'TLS1.3', maskRule: 'partial_mask' },
        { level: 2, label: '内部', examples: ['手机号', '邮箱', '交易额'], encryptAtRest: 'AES-256-GCM', encryptInTransit: 'TLS1.2+', maskRule: 'partial_mask' },
        { level: 1, label: '公开', examples: ['用户昵称', '头像'], encryptAtRest: 'none', encryptInTransit: 'TLS1.2+', maskRule: 'none' },
      ],
      dlpEnabled: true, dlpActionOnMatch: 'block_and_alert',
    },
    createdBy: 'zhao_jun', createdAt: '2024-02-15', updatedAt: '2024-05-10',
    complianceTags: ['等保三级', 'PCI-DSS', 'GDPR', '个人信息保护法'],
  },
  {
    id: 'POL-005', name: '智能合约安全审计策略', category: 'blockchain_security', version: 'v1.2', status: 'active',
    effectiveDate: '2024-04-01', priority: 'critical',
    description: '规定智能合约上线前的安全审计要求和流程',
    config: {
      mandatoryAudit: true, auditProviders: ['SlowMist', 'CertiK', 'Trail_of_Bits'],
      minAuditScore: 95, reAuditIntervalMonths: 6,
      criticalFindingsBlockDeploy: true, gasOptimizationRequired: true,
      testCoverageMinPercent: 95,
    },
    createdBy: 'li_ming', createdAt: '2024-04-01', updatedAt: '2024-06-05',
    complianceTags: ['等保三级', '内部标准'],
  },
  {
    id: 'POL-006', name: 'API速率限制策略', category: 'application_security', version: 'v1.8', status: 'active',
    effectiveDate: '2024-03-15', priority: 'high',
    description: 'API接口调用频率限制和防滥用规则',
    config: {
      globalLimit: { requestsPerMinute: 1000, burst: 100 },
      perUserLimits: [
        { endpointPattern: '/api/v1/trade/*', rpm: 30, burst: 5 },
        { endpointPattern: '/api/v1/auth/login', rpm: 10, burst: 2 },
        { endpointPattern: '/api/v1/user/*', rpm: 60, burst: 10 },
        { endpointPattern: '/api/v1/wallet/*', rpm: 20, burst: 3 },
      ],
      rateLimitHeaders: true, rateLimitResponseCode: 429,
    },
    createdBy: 'chen_hui', createdAt: '2024-03-15', updatedAt: '2024-05-28',
    complianceTags: ['OWASP API Security'],
  },
  {
    id: 'POL-007', name: '日志留存与监控策略', category: 'compliance', version: 'v1.3', status: 'active',
    effectiveDate: '2024-01-15', priority: 'high',
    description: '定义各类日志的留存期限、采集范围和监控告警阈值',
    config: {
      retentionRules: [
        { logType: 'access_log', retentionDays: 180, storage: 'cold_s3' },
        { logType: 'security_event', retentionDays: 730, storage: 'hot_elasticsearch' },
        { logType: 'audit_log', retentionDays: 2555, storage: 'cold_s3', immutable: true },
        { logType: 'transaction_log', retentionDays: 2555, storage: 'cold_s3', immutable: true },
      ],
      realTimeMonitoring: true, alertChannels: ['dingtalk', 'sms', 'email'],
    },
    createdBy: 'zhao_jun', createdAt: '2024-01-15', updatedAt: '2024-04-20',
    complianceTags: ['等保三级', 'PCI-DSS', '个人信息保护法'],
  },
  {
    id: 'POL-008', name: '旧版传输加密策略(已归档)', category: 'network_security', version: 'v1.0', status: 'archived',
    effectiveDate: '2022-01-01', expiryDate: '2024-01-01', priority: 'low',
    description: '早期版本的TLS配置策略，已被POL-003取代',
    config: { tlsVersions: ['TLS1.0', 'TLS1.1', 'TLS1.2'], cipherSuites: ['legacy'] },
    createdBy: 'ops_team', createdAt: '2022-01-01', updatedAt: '2024-01-01',
    complianceTags: [],
  },
];

// 类别映射
const categoryMap: Record<PolicyCategory, { label: string; color: string; icon: React.ReactNode }> = {
  access_control: { label: '访问控制', color: 'blue', icon: <SettingOutlined /> },
  network_security: { label: '网络安全', color: 'green', icon: <CodeOutlined /> },
  data_protection: { label: '数据保护', color: 'purple', icon: <FileProtectOutlined /> },
  endpoint_security: { label: '端点安全', color: 'orange', icon: <SettingOutlined /> },
  application_security: { label: '应用安全', color: 'cyan', icon: <CodeOutlined /> },
  compliance: { label: '合规管理', color: 'gold', icon: <HistoryOutlined /> },
  blockchain_security: { label: '区块链安全', color: 'magenta', icon: <SettingOutlined /> },
  incident_response: { label: '应急响应', color: 'red', icon: <SettingOutlined /> },
};

export default function SecurityPolicyPage() {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<SecurityPolicy | null>(null);
  const [editingPolicy, setEditingPolicy] = useState<SecurityPolicy | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // 切换策略状态
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await new Promise(r => setTimeout(r, 400));
      return { id, status };
    },
    onSuccess: (_, vars) => {
      message.success(`策略已${vars.status === 'active' ? '启用' : '禁用'}`);
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
  });

  const filteredPolicies = mockPolicies.filter(p => {
    const matchSearch = !searchText || p.name.toLowerCase().includes(searchText.toLowerCase()) || p.description.toLowerCase().includes(searchText.toLowerCase());
    const matchCategory = !categoryFilter || p.category === categoryFilter;
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  // 表格列
  const columns = [
    {
      title: '策略名称', key: 'name',
      render: (_: any, p: SecurityPolicy) => (
        <div>
          <div className="font-semibold flex items-center gap-2">{categoryMap[p.category]?.icon}{p.name}</div>
          <div className="text-xs text-gray-400">{p.id} | {p.version}</div>
        </div>
      ),
    },
    {
      title: '类别', dataIndex: 'category', key: 'category', width: 110,
      render: (cat: PolicyCategory) => <Tag color={categoryMap[cat]?.color}>{categoryMap[cat]?.label}</Tag>,
    },
    {
      title: '优先级', dataIndex: 'priority', key: 'priority', width: 90,
      render: (pri: string) => <Tag color={{ critical: 'red', high: 'orange', medium: 'gold', low: 'default' }[pri as string]}>{{ critical: '关键', high: '高', medium: '中', low: '低' }[pri]}</Tag>,
    },
    {
      title: '状态', key: 'status', width: 100,
      render: (_: any, p: SecurityPolicy) => (
        <div className="flex items-center gap-2">
          <Switch
            size="small"
            checked={p.status === 'active'}
            disabled={p.status === 'archived' || p.status === 'draft'}
            onChange={(checked) => toggleStatusMutation.mutate({ id: p.id, status: checked ? 'active' : 'inactive' })}
          />
          <Badge status={{ active: 'success', inactive: 'default', draft: 'processing', archived: 'default' }[p.status] as any} text={{ active: '生效中', inactive: '已停用', draft: '草稿', archived: '已归档' }[p.status]} />
        </div>
      ),
    },
    { title: '生效日期', dataIndex: 'effectiveDate', key: 'effectiveDate', width: 120 },
    {
      title: '合规标签', dataIndex: 'complianceTags', key: 'complianceTags', width: 200,
      render: (tags: string[]) => tags.map(t => <Tag key={t} size="small">{t}</Tag>),
    },
    {
      title: '操作', key: 'actions', width: 160,
      render: (_: any, p: SecurityPolicy) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedPolicy(p); setDetailVisible(true); }}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditingPolicy(p); form.setFieldsValue(p); setModalVisible(true); }}>编辑</Button>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3 mb-6">
          <FileProtectOutlined className="text-2xl text-emerald-600" />
          <h1 className="text-2xl font-bold m-0">安全策略管理中心</h1>
        </div>

        {/* 统计 */}
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}><Card size="small" className="shadow-sm"><Statistic title="策略总数" value={mockPolicies.length} /></Card></Col>
          <Col xs={12} sm={6}><Card size="small" className="shadow-sm"><Statistic title="生效中" value={mockPolicies.filter(p => p.status === 'active').length} valueStyle={{ color: '#16A34A' }} /></Card></Col>
          <Col xs={12} sm={6}><Card size="small" className="shadow-sm"><Statistic title="草稿/停用" value={mockPolicies.filter(p => ['draft', 'inactive'].includes(p.status)).length} valueStyle={{ color: '#F59E0B' }} /></Card></Col>
          <Col xs={12} sm={6}><Card size="small" className="shadow-sm"><Statistic title="关键策略" value={mockPolicies.filter(p => p.priority === 'critical').length} valueStyle={{ color: '#B91C1C' }} /></Card></Col>
        </Row>

        {/* 策略列表 */}
        <Card className="shadow-sm" extra={
          <Space>
            <Input.Search placeholder="搜索策略名称..." allowClear style={{ width: 230 }} value={searchText} onChange={(e) => setSearchText(e.target.value)} enterButton={<SearchOutlined />} />
            <Select placeholder="类别" style={{ width: 130 }} allowClear value={categoryFilter || undefined} onChange={setCategoryFilter} options={Object.entries(categoryMap).map(([k, v]) => ({ label: v.label, value: k }))} />
            <Select placeholder="状态" style={{ width: 110 }} allowClear value={statusFilter || undefined} onChange={setStatusFilter} options={[{ label: '生效中', value: 'active' }, { label: '已停用', value: 'inactive' }, { label: '草稿', value: 'draft' }, { label: '已归档', value: 'archived' }]} />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingPolicy(null); form.resetFields(); setModalVisible(true); }}>新增策略</Button>
          </Space>
        }>
          <Table dataSource={filteredPolicies} columns={columns} rowKey="id" pagination={{ pageSize: 7, showTotal: t => `共${t}条策略` }} size="middle" />
        </Card>

        {/* 策略详情弹窗 */}
        <Modal title={`策略详情 - ${selectedPolicy?.name || ''}`} open={detailVisible} onCancel={() => setDetailVisible(false)} width={750} footer={<Button onClick={() => setDetailVisible(false)}>关闭</Button>}>
          {selectedPolicy && (
            <div className="space-y-4">
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="策略ID">{selectedPolicy.id}</Descriptions.Item>
                <Descriptions.Item label="版本">{selectedPolicy.version}</Descriptions.Item>
                <Descriptions.Item label="类别"><Tag color={categoryMap[selectedPolicy.category]?.color}>{categoryMap[selectedPolicy.category]?.label}</Tag></Descriptions.Item>
                <Descriptions.Item label="优先级"><Tag color={{ critical: 'red', high: 'orange', medium: 'gold', low: 'default' }[selectedPolicy.priority]}>{{ critical: '关键', high: '高', medium: '中', low: '低' }[selectedPolicy.priority]}</Tag></Descriptions.Item>
                <Descriptions.Item label="状态"><Badge status={{ active: 'success', inactive: 'default', draft: 'processing', archived: 'default' }[selectedPolicy.status] as any} text={{ active: '生效中', inactive: '已停用', draft: '草稿', archived: '已归档' }[selectedPolicy.status]} /></Descriptions.Item>
                <Descriptions.Item label="生效日期">{selectedPolicy.effectiveDate}</Descriptions.Item>
                <Descriptions.Item label="创建者">{selectedPolicy.createdBy}</Descriptions.Item>
                <Descriptions.Item label="更新时间">{selectedPolicy.updatedAt}</Descriptions.Item>
                <Descriptions.Item label="描述" span={2}>{selectedPolicy.description}</Descriptions.Item>
                <Descriptions.Item label="合规标签" span={2}>{selectedPolicy.complianceTags.map(t => <Tag key={t}>{t}</Tag>)}</Descriptions.Item>
              </Descriptions>

              <div>
                <h4 className="font-bold mb-2 flex items-center gap-2"><CodeOutlined /> 配置详情 (JSON)</h4>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto max-h-[300px] font-mono">
                  {JSON.stringify(selectedPolicy.config, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </Modal>

        {/* 新增/编辑策略弹窗 */}
        <Modal title={editingPolicy ? '编辑安全策略' : '新增安全策略'} open={modalVisible} onCancel={() => setModalVisible(false)} width={650} okText={editingPolicy ? '更新' : '创建'} onOk={async () => {
          try {
            await form.validateFields();
            await new Promise(r => setTimeout(r, 500));
            message.success(editingPolicy ? '策略更新成功' : '策略创建成功');
            setModalVisible(false);
          } catch {}
        }}>
          <Form form={form} layout="vertical" className="mt-4">
            <Form.Item name="name" label="策略名称" rules={[{ required: true }]}>
              <Input placeholder="请输入策略名称" prefix={<FileProtectOutlined />} />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="category" label="策略类别" rules={[{ required: true }]}>
                  <Select options={Object.entries(categoryMap).map(([k, v]) => ({ label: `${v.label}`, value: k }))} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="priority" label="优先级" initialValue="high">
                  <Select options={[{ label: '关键(Critical)', value: 'critical' }, { label: '高(High)', value: 'high' }, { label: '中(Medium)', value: 'medium' }, { label: '低(Low)', value: 'low' }]} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="description" label="策略描述" rules={[{ required: true }]}>
              <Input.TextArea rows={3} placeholder="请输入策略描述" />
            </Form.Item>
            <Form.Item name="config" label="策略配置 (JSON)">
              <Input.TextArea rows={6} placeholder='{"key": "value"}' className="font-mono text-xs" />
            </Form.Item>
          </Form>
        </Modal>

        {/* 安全提示 */}
        <Card className="shadow-sm bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
          <div className="flex items-start gap-3">
            <SafetyCertificateOutlined className="text-xl text-emerald-500 mt-1" />
            <div>
              <h4 className="font-bold text-emerald-700 m-0 mb-1">安全策略管理规范</h4>
              <p className="text-sm text-emerald-600 m-0">
                中萨数字科技交易所的安全策略体系覆盖访问控制、网络安全、数据保护、区块链安全等多个维度。
                所有关键级策略变更需要经过安全委员会审批。策略变更需提前通知相关方，变更后需进行回归测试。
                当前共有{mockPolicies.filter(p => p.priority === 'critical').length}条关键策略生效运行。
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
