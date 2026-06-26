'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Row, Col, Card, Table, Tag, Button, Modal, Form, Input, Select, Space, message, Popconfirm, Switch, Badge, Statistic, Progress, Descriptions, Tooltip } from 'antd';
import {
  SafetyCertificateOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  FireOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  DashboardOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

// WAF规则接口
interface WAFRule {
  id: string;
  name: string;
  matchCondition: string; // 匹配条件描述
  matchType: 'regex' | 'exact' | 'contains' | 'pattern' | 'owasp_crs' | 'custom';
  action: 'block' | 'allow' | 'captcha' | 'log_only' | 'rate_limit';
  hitCount: number;
  lastHit?: string;
  status: 'enabled' | 'disabled' | 'testing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'sqli' | 'xss' | 'rce' | 'lfi' | 'ssrf' | 'csrf' | 'bot' | 'scanner' | 'custom';
  description: string;
  createdAt: string;
}

// 模拟WAF规则数据
const mockWAFRules: WAFRule[] = [
  { id: 'WAF-001', name: 'SQL注入防护-基础规则集', matchCondition: "匹配UNION SELECT、OR 1=1、DROP TABLE等SQL注入特征", matchType: 'regex', action: 'block', hitCount: 158420, lastHit: '2024-06-08 14:35:00', status: 'enabled', severity: 'critical', category: 'sqli', description: '基于OWASP CRS规则的SQL注入核心检测规则集，覆盖主流注入手法', createdAt: '2024-01-01' },
  { id: 'WAF-002', name: 'XSS跨站脚本防护', matchCondition: '检测<script>、onerror=、javascript:等XSS攻击向量', matchType: 'regex', action: 'block', hitCount: 85620, lastHit: '2024-06-08 14:28:00', status: 'enabled', severity: 'critical', category: 'xss', description: '覆盖存储型、反射型和DOM型XSS的全面检测规则', createdAt: '2024-01-01' },
  { id: 'WAF-003', name: '远程代码执行(RCE)检测', matchCondition: '匹配system()、exec()、eval()、反序列化等RCE模式', matchType: 'pattern', action: 'block', hitCount: 3250, lastHit: '2024-06-08 13:15:00', status: 'enabled', severity: 'critical', category: 'rce', description: '针对PHP/Java/Python/Node.js等多语言RCE漏洞的检测', createdAt: '2024-02-01' },
  { id: 'WAF-004', name: '路径遍历(LFI/RFI)防护', matchCondition: '检测../、%2e%2e/、file://等路径遍历模式', matchType: 'regex', action: 'block', hitCount: 12580, lastHit: '2024-06-08 13:45:00', status: 'enabled', severity: 'high', category: 'lfi', description: '防止本地和远程文件包含攻击', createdAt: '2024-01-15' },
  { id: 'WAF-005', name: 'SSRF服务器端请求伪造防护', matchCondition: '检测内网IP(127.0.0.1、10.x、172.16-31.x、169.254.x)请求', matchType: 'pattern', action: 'block', hitCount: 5680, lastHit: '2024-06-08 12:30:00', status: 'enabled', severity: 'high', category: 'ssrf', description: '阻止通过应用服务器发起的内网探测和SSRF攻击', createdAt: '2024-02-15' },
  { id: 'WAF-006', name: 'CSRF跨站请求伪造防护', matchCondition: '验证Referer头和CSRF Token有效性', matchType: 'pattern', action: 'block', hitCount: 2450, lastHit: '2024-06-08 11:20:00', status: 'enabled', severity: 'medium', category: 'csrf', description: '对状态变更操作强制CSRF Token校验', createdAt: '2024-03-01' },
  { id: 'WAF-007', name: '恶意爬虫/机器人识别', matchCondition: 'User-Agent特征匹配 + 行为分析(请求频率/IP信誉)', matchType: 'pattern', action: 'captcha', hitCount: 524800, lastHit: '2024-06-08 14:38:00', status: 'enabled', severity: 'low', category: 'bot', description: '识别并拦截恶意爬虫、数据抓取工具和自动化攻击脚本', createdAt: '2024-03-15' },
  { id: 'WAF-008', name: '安全扫描器指纹识别', matchCondition: '匹配Nmap、Nikto、SQLMap、DirBuster等扫描器特征', matchType: 'pattern', action: 'block', hitCount: 89200, lastHit: '2024-06-08 10:15:00', status: 'enabled', severity: 'medium', category: 'scanner', description: '主动拦截已知安全扫描器和渗透测试工具的探测', createdAt: '2024-04-01' },
  { id: 'WAF-009', name: 'API速率限制-交易接口', matchCondition: '单IP对/api/v1/trade/* 接口每分钟不超过30次请求', matchType: 'pattern', action: 'rate_limit', hitCount: 3560, lastHit: '2024-06-08 14:32:00', status: 'enabled', severity: 'medium', category: 'custom', description: '保护核心交易接口免受高频调用和资源耗尽攻击', createdAt: '2024-05-01' },
  { id: 'WAF-010', name: '区块链特有攻击防护(测试中)', matchCondition: '检测重放攻击、前序交易篡改、MEV提取等链上攻击模式', matchType: 'custom', action: 'log_only', hitCount: 120, lastHit: '2024-06-08 09:00:00', status: 'testing', severity: 'high', category: 'custom', description: '针对DeFi和区块链应用的专用防护规则，目前处于测试观察阶段', createdAt: '2024-06-01' },
];

// 攻击类型分布图
const attackDistOption = {
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  series: [{
    type: 'pie',
    radius: ['35%', '65%'],
    data: [
      { value: 42, name: 'SQL注入', itemStyle: { color: '#DC2626' } },
      { value: 23, name: '恶意爬虫', itemStyle: { color: '#F59E0B' } },
      { value: 15, name: '扫描器', itemStyle: { color: '#7C3AED' } },
      { value: 10, name: 'XSS攻击', itemStyle: { color: '#ff7a45' } },
      { value: 6, name: '路径遍历', itemStyle: { color: '#1677FF' } },
      { value: 4, name: '其他', itemStyle: { color: '#8c8c8c' } },
    ],
    label: { formatter: '{b}\n{c}%', fontSize: 11 },
  }],
};

// WAF统计面板模拟数据
const mockWAFStats = {
  totalRequests: 5842300,
  blockedRequests: 28650,
  allowedRequests: 5813650,
  captchaChallenged: 15200,
  falsePositiveRate: 0.12,
  avgResponseTimeAddition: 2.3, // ms
  rulesEnabled: 9,
  rulesTesting: 1,
};

export default function WAFPage() {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedRule, setSelectedRule] = useState<WAFRule | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // 切换规则状态
  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      await new Promise(r => setTimeout(r, 300));
      return { id, enabled };
    },
    onSuccess: () => message.success('规则状态已更新'),
  });

  // 删除规则
  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      await new Promise(r => setTimeout(r, 300));
      return id;
    },
    onSuccess: () => {
      message.success('规则删除成功');
      queryClient.invalidateQueries({ queryKey: ['waf-rules'] });
    },
  });

  const filteredRules = mockWAFRules.filter(rule => {
    const matchSearch = !searchText || rule.name.toLowerCase().includes(searchText.toLowerCase()) || rule.id.toLowerCase().includes(searchText.toLowerCase());
    const matchCategory = !categoryFilter || rule.category === categoryFilter;
    const matchStatus = !statusFilter || rule.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  // 类别映射
  const categoryLabels: Record<string, { label: string; color: string }> = {
    sqli: { label: 'SQL注入', color: 'red' }, xss: { label: 'XSS', color: 'orange' }, rce: { label: 'RCE', color: 'magenta' },
    lfi: { label: '路径遍历', color: 'volcano' }, ssrf: { label: 'SSRF', color: 'purple' }, csrf: { label: 'CSRF', color: 'gold' },
    bot: { label: '恶意爬虫', color: 'cyan' }, scanner: { label: '扫描器', color: 'geekblue' }, custom: { label: '自定义', color: 'blue' },
  };

  // 动作映射
  const actionLabels: Record<string, { label: string; color: string }> = {
    block: { label: '拦截', color: 'red' }, allow: { label: '放行', color: 'green' }, captcha: { label: '人机验证', color: 'orange' },
    log_only: { label: '仅记录', color: 'blue' }, rate_limit: { label: '限速', color: 'gold' },
  };

  // 表格列
  const columns = [
    {
      title: '规则信息',
      key: 'info',
      render: (_: any, r: WAFRule) => (
        <div>
          <div className="font-semibold flex items-center gap-2">{r.name}</div>
          <div className="text-xs text-gray-400">{r.id}</div>
        </div>
      ),
    },
    {
      title: '类别', dataIndex: 'category', key: 'category', width: 100,
      render: (cat: string) => <Tag color={categoryLabels[cat]?.color}>{categoryLabels[cat]?.label}</Tag>,
    },
    {
      title: '匹配条件', dataIndex: 'matchCondition', key: 'matchCondition', ellipsis: true,
      width: 220,
      render: (cond: string, r: WAFRule) => (
        <Tooltip title={cond}>
          <span className="text-sm">{cond.length > 30 ? cond.substring(0, 30) + '...' : cond}</span>
          <Tag className="ml-1">{{ regex: '正则', exact: '精确', contains: '包含', pattern: '模式', owasp_crs: 'CRS' }[r.matchType]}</Tag>
        </Tooltip>
      ),
    },
    {
      title: '动作', dataIndex: 'action', key: 'action', width: 90,
      render: (action: string) => <Tag color={actionLabels[action]?.color}>{actionLabels[action]?.label}</Tag>,
    },
    {
      title: '命中次数', dataIndex: 'hitCount', key: 'hitCount', width: 100,
      sorter: (a: WAFRule, b: WAFRule) => a.hitCount - b.hitCount,
      render: (count: number) => count.toLocaleString(),
    },
    {
      title: '严重度', dataIndex: 'severity', key: 'severity', width: 80,
      render: (sev: string) => <Tag color={{ critical: 'red', high: 'orange', medium: 'gold', low: 'green' }[sev]}>{{ critical: '严重', high: '高危', medium: '中危', low: '低危' }[sev]}</Tag>,
    },
    {
      title: '状态', key: 'status', width: 90,
      render: (_: any, r: WAFRule) => (
        <Switch
          size="small"
          checked={r.status === 'enabled'}
          disabled={r.status === 'testing'}
          onChange={(checked) => toggleRuleMutation.mutate({ id: r.id, enabled: checked })}
          checkedChildren="开"
          unCheckedChildren="关"
        />
      ),
    },
    {
      title: '操作', key: 'actions', width: 160,
      render: (_: any, r: WAFRule) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedRule(r); setDetailVisible(true); }}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => deleteRuleMutation.mutate(r.id)} okText="确定" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3 mb-6">
          <SafetyCertificateOutlined className="text-2xl text-blue-500" />
          <h1 className="text-2xl font-bold m-0">Web应用防火墙 (WAF)</h1>
          <Badge status="processing" text="运行正常" />
        </div>

        {/* 统计面板 */}
        <Card className="shadow-sm" title={<><DashboardOutlined className="mr-2" />WAF 运行统计</>}>
          <Row gutter={[24, 16]}>
            <Col xs={12} sm={6}>
              <Statistic title="今日请求总量" value={mockWAFStats.totalRequests} prefix={<FireOutlined />} valueStyle={{ color: '#1677FF' }} />
              <div className="text-xs text-gray-400 mt-1">较昨日 +12.5%</div>
            </Col>
            <Col xs={12} sm={6}>
              <Statistic title="拦截请求数" value={mockWAFStats.blockedRequests} prefix={<WarningOutlined />} valueStyle={{ color: '#DC2626' }} />
              <div className="text-xs text-red-400 mt-1">拦截率 {(mockWAFStats.blockedRequests / mockWAFStats.totalRequests * 100).toFixed(3)}%</div>
            </Col>
            <Col xs={12} sm={6}>
              <Statistic title="误报率" value={mockWAFStats.falsePositiveRate} suffix="%" precision={2} valueStyle={{ color: mockWAFStats.falsePositiveRate < 0.5 ? '#16A34A' : '#F59E0B' }} />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic title="平均延迟增加" value={mockWAFStats.avgResponseTimeAddition} suffix="ms" precision={1} valueStyle={{ color: '#7C3AED' }} />
            </Col>
            <Col xs={12} sm={6}><Statistic title="生效规则" value={mockWAFStats.rulesEnabled} suffix={`/ ${mockWAFStats.rulesEnabled + mockWAFStats.rulesTesting}`} valueStyle={{ color: '#16A34A' }} /></Col>
            <Col xs={12} sm={6}><Statistic title="人机验证" value={mockWAFStats.captchaChallenged} /></Col>
            <Col xs={12} sm={6}><Statistic title="放行请求" value={mockWAFStats.allowedRequests} valueStyle={{ color: '#16A34A' }} /></Col>
          </Row>
        </Card>

        {/* 图表与规则列表 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={9}>
            <Card title="攻击类型分布" className="shadow-sm">
              <SafeECharts option={attackDistOption} style={{ height: 320 }} title="攻击分布" />
            </Card>
          </Col>
          <Col xs={24} lg={15}>
            <Card
              title="WAF 规则列表"
              className="shadow-sm"
              extra={
                <Space>
                  <Input.Search placeholder="搜索规则..." allowClear style={{ width: 200 }} value={searchText} onChange={(e) => setSearchText(e.target.value)} enterButton={<SearchOutlined />} />
                  <Select placeholder="类别" style={{ width: 110 }} allowClear value={categoryFilter || undefined} onChange={setCategoryFilter} options={Object.entries(categoryLabels).map(([k, v]) => ({ label: v.label, value: k }))} />
                  <Select placeholder="状态" style={{ width: 100 }} allowClear value={statusFilter || undefined} onChange={setStatusFilter} options={[{ label: '启用', value: 'enabled' }, { label: '测试中', value: 'testing' }, { label: '禁用', value: 'disabled' }]} />
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalVisible(true); }}>新增规则</Button>
                </Space>
              }
            >
              <Table dataSource={filteredRules} columns={columns} rowKey="id" pagination={{ pageSize: 6, showTotal: t => `共${t}条规则` }} size="middle" scroll={{ x: 1100 }} />
            </Card>
          </Col>
        </Row>

        {/* 新增规则弹窗 */}
        <Modal title="新增WAF规则" open={modalVisible} onCancel={() => setModalVisible(false)} width={650} okText="创建" onOk={async () => {
          try {
            await form.validateFields();
            await new Promise(r => setTimeout(r, 500));
            message.success('WAF规则创建成功');
            setModalVisible(false);
          } catch {}
        }}>
          <Form form={form} layout="vertical" className="mt-4">
            <Form.Item name="name" label="规则名称" rules={[{ required: true }]}>
              <Input placeholder="例如: 自定义API限流规则" prefix={<SafetyCertificateOutlined />} />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="category" label="规则类别" rules={[{ required: true }]}>
                  <Select options={Object.entries(categoryLabels).map(([k, v]) => ({ label: v.label, value: k }))} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="matchType" label="匹配类型" initialValue="regex">
                  <Select options={[{ label: '正则表达式', value: 'regex' }, { label: '精确匹配', value: 'exact' }, { label: '包含匹配', value: 'contains' }, { label: '模式匹配', value: 'pattern' }]} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="matchCondition" label="匹配条件" rules={[{ required: true }]}>
              <Input.TextArea rows={3} placeholder="描述匹配条件或输入正则表达式" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="action" label="执行动作" initialValue="block">
                  <Select options={Object.entries(actionLabels).map(([k, v]) => ({ label: v.label, value: k }))} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="severity" label="严重程度" initialValue="high">
                  <Select options={[{ label: '严重', value: 'critical' }, { label: '高危', value: 'high' }, { label: '中危', value: 'medium' }, { label: '低危', value: 'low' }]} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="status" label="初始状态" valuePropName="checked" initialValue={true}>
                  <Switch checkedChildren="启用" unCheckedChildren="测试中" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="description" label="规则描述">
              <Input.TextArea rows={2} placeholder="请描述该规则的用途和适用场景" />
            </Form.Item>
          </Form>
        </Modal>

        {/* 规则详情弹窗 */}
        <Modal title={`WAF规则详情 - ${selectedRule?.name || ''}`} open={detailVisible} onCancel={() => setDetailVisible(false)} width={700} footer={<Button onClick={() => setDetailVisible(false)}>关闭</Button>}>
          {selectedRule && (
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="规则ID">{selectedRule.id}</Descriptions.Item>
              <Descriptions.Item label="规则名称"><span className="font-bold">{selectedRule.name}</span></Descriptions.Item>
              <Descriptions.Item label="类别"><Tag color={categoryLabels[selectedRule.category]?.color}>{categoryLabels[selectedRule.category]?.label}</Tag></Descriptions.Item>
              <Descriptions.Item label="严重度"><Tag color={{ critical: 'red', high: 'orange', medium: 'gold', low: 'green' }[selectedRule.severity]}>{{ critical: '严重', high: '高危', medium: '中危', low: '低危' }[selectedRule.severity]}</Tag></Descriptions.Item>
              <Descriptions.Item label="动作"><Tag color={actionLabels[selectedRule.action]?.color}>{actionLabels[selectedRule.action]?.label}</Tag></Descriptions.Item>
              <Descriptions.Item label="状态"><Badge status={selectedRule.status === 'enabled' ? 'success' : selectedRule.status === 'testing' ? 'warning' : 'default'} text={{ enabled: '启用', testing: '测试中', disabled: '禁用' }[selectedRule.status]} /></Descriptions.Item>
              <Descriptions.Item label="匹配类型">{{ regex: '正则表达式', exact: '精确匹配', contains: '包含匹配', pattern: '模式匹配', owasp_crs: 'OWASP CRS' }[selectedRule.matchType]}</Descriptions.Item>
              <Descriptions.Item label="命中次数">{selectedRule.hitCount.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="最后命中">{selectedRule.lastHit || '-'}</Descriptions.Item>
              <Descriptions.Item label="匹配条件" span={2}><pre className="bg-orange-50 p-2 rounded text-sm whitespace-pre-wrap">{selectedRule.matchCondition}</pre></Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>{selectedRule.description}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{selectedRule.createdAt}</Descriptions.Item>
            </Descriptions>
          )}
        </Modal>

        {/* 安全提示 */}
        <Card className="shadow-sm bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <div className="flex items-start gap-3">
            <SafetyCertificateOutlined className="text-xl text-blue-500 mt-1" />
            <div>
              <h4 className="font-bold text-blue-700 m-0 mb-1">WAF运维建议</h4>
              <p className="text-sm text-blue-600 m-0">
                当前WAF误报率为{mockWAFStats.falsePositiveRate}%，处于健康水平。建议每日审查误报日志，
                定期更新OWASP Core Rule Set(CRS)规则库。区块链相关自定义规则(WAF-010)正在测试阶段，
                请密切观察其行为表现。所有规则变更需在业务低峰期进行。
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
