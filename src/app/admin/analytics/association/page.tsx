'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Tag, Badge, Button, Space, Row, Col, Typography, Divider, Progress, Statistic, Alert, Tooltip, Modal, message } from 'antd';
import { FundOutlined, LineChartOutlined, ThunderboltOutlined, ApiOutlined, DatabaseOutlined, EyeOutlined, ShoppingCartOutlined, FilterOutlined, TeamOutlined, SyncOutlined, AimOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

const mockRules = [
  { id: 'AR-001', antecedent: 'BTC, ETH, USDT', consequent: 'USDC', support: 0.452, confidence: 0.783, lift: 2.34, status: 'active', transactions: 15800, description: '购买BTC/ETH/USDT的用户有78%概率同时持有USDC' },
  { id: 'AR-002', antecedent: 'DeFi质押, 借贷', consequent: '治理代币', support: 0.234, confidence: 0.651, lift: 1.89, status: 'active', transactions: 8200, description: '参与DeFi质押+借贷的用户倾向于购买治理代币' },
  { id: 'AR-003', antecedent: 'NFT交易', consequent: 'Gas消耗高', support: 0.189, confidence: 0.912, lift: 3.56, status: 'active', transactions: 6600, description: 'NFT交易用户几乎必然伴随高Gas消耗' },
  { id: 'AR-004', antecedent: '大额转账(>10万)', consequent: 'KYC高级认证', support: 0.067, confidence: 0.845, lift: 2.78, status: 'review', transactions: 2350, description: '大额转账用户通常已完成高级KYC' },
  { id: 'AR-005', antecedent: '合约交互频繁', consequent: '安全审计需求', support: 0.123, confidence: 0.723, lift: 2.15, status: 'active', transactions: 4300, description: '高频合约交互用户对安全审计服务感兴趣' },
  { id: 'AR-006', antecedent: '稳定币兑换', consequent: '跨境支付', support: 0.098, confidence: 0.567, lift: 1.67, status: 'inactive', transactions: 3400, description: '稳定币兑换行为与跨境支付有一定关联' },
  { id: 'AR-007', antecedent: '杠杆交易', consequent: '止损单设置', support: 0.156, confidence: 0.698, lift: 1.94, status: 'active', transactions: 5480, description: '杠杆用户中约70%会设置止损单' },
  { id: 'AR-008', antecedent: '新用户注册', consequent: '首次充值(<$500)', support: 0.312, confidence: 0.876, lift: 1.45, status: 'active', transactions: 10950, description: '新注册用户首充金额通常在$500以内' },
  { id: 'AR-009', antecedent: 'API调用', consequent: '量化交易工具', support: 0.045, confidence: 0.923, lift: 4.21, status: 'active', transactions: 1580, description: 'API用户高度倾向使用量化交易工具' },
  { id: 'AR-010', antecedent: '社交绑定', consequent: '推荐奖励领取', support: 0.201, confidence: 0.634, lift: 1.82, status: 'active', transactions: 7050, description: '绑定社交媒体的用户更活跃于推荐计划' },
];

export default function AssociationPage() {
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const { data: rules, isLoading } = useQuery({ queryKey: ['association-rules'], queryFn: async () => { await new Promise(r => setTimeout(r, 400)); return mockRules; } });

  const columns = [
    { title: '规则ID', dataIndex: 'id', key: 'id', width: 120, render: (t: string) => <Text code className="text-xs">{t}</Text> },
    { title: '前项(条件)', dataIndex: 'antecedent', key: 'antecedent', width: 180, render: (a: string) => <Tag color="blue">{a}</Tag> },
    { title: '后项(结果)', dataIndex: 'consequent', key: 'consequent', width: 140, render: (c: string) => <Tag color="green">{c}</Tag> },
    { title: '支持度/置信度', key: 'metrics', width: 240, render: (_: any, r: any) => (<Space direction="vertical" size={2} className="w-full"><Progress percent={Math.round(r.support * 100)} size="small" strokeColor="#1677FF" format={() => `支持 ${r.support * 100}%`} /><Progress percent={Math.round(r.confidence * 100)} size="small" strokeColor="#16A34A" format={() => `置信 ${r.confidence * 100}%`} /></Space>) },
    { title: 'Lift值', dataIndex: 'lift', key: 'lift', width: 90, render: (v: number) => <Text strong style={{ color: v >= 3 ? '#16A34A' : v >= 2 ? '#1677FF' : '#F59E0B' }}>{v.toFixed(2)}</Text> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90, render: (s: string) => <Badge status={s === 'active' ? 'success' : s === 'review' ? 'warning' : 'default'} text={s === 'active' ? '生效' : s === 'review' ? '审核中' : '停用'} /> },
    { title: '事务数', dataIndex: 'transactions', key: 'transactions', width: 100, render: (n: number) => <Text>{n.toLocaleString()}</Text> },
  ];

  const actions: any[] = [
    { key: 'view', label: '详情', icon: <EyeOutlined />, onClick: (r: any) => { setSelectedRule(r); setDetailOpen(true); } },
    { key: 'apply', label: '应用规则', icon: <FilterOutlined />, type: 'primary', hidden: () => false, onClick: (r: any) => { message.success(`应用规则 ${r.id}`); } },
  ];

  const avgLift = rules ? (rules.reduce((s: number, r: any) => s + r.lift, 0) / rules.length).toFixed(2) : 0;
  const avgConf = rules ? rules.reduce((s: number, r: any) => s + r.confidence, 0) / rules.length : 0;
  const totalTx = rules?.reduce((s: number, r: any) => s + r.transactions, 0) || 0;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><FundOutlined className="text-3xl text-violet-500" /><div><Title level={3} className="!mb-0">关联分析中心</Title><Text type="secondary">关联规则挖掘 · 购物篮分析 · 推荐依据</Text></div></div>
          <Space><Button icon={<SyncOutlined />}>刷新规则</Button><Button type="primary" icon={<ThunderboltOutlined />}>挖掘新规则</Button></Space>
        </div>
        <Row gutter={[20, 20]}>
          <Col xs={24} sm={12} lg={5}><DataCard title="规则数量" value={rules?.length || 0} icon={<ApiOutlined />} color="#1677FF" suffix="条" /></Col>
          <Col xs={24} sm={12} lg={5}><DataCard title="最大支持度" value={(Math.max(...(rules?.map(r => r.support) || [0])) * 100).toFixed(1)} icon={<LineChartOutlined />} color="#16A34A" suffix="%" /></Col>
          <Col xs={24} sm={12} lg={5}><DataCard title="置信度阈值" value={((avgConf || 0) * 100).toFixed(1)} icon={<AimOutlined />} color="#F59E0B" suffix="%min" /></Col>
          <Col xs={24} sm={12} lg={5}><DataCard title="Lift均值" value={avgLift} icon={<TeamOutlined />} color="#7C3AED" description="平均提升度" /></Col>
          <Col xs={24} sm={12} lg={4}><DataCard title="更新频率" value="每日" icon={<DatabaseOutlined />} color="#06B6D4" description="自动增量挖掘" /></Col>
        </Row>

        <Card title="关联规则列表" className="shadow-sm" extra={<Space><Tag color="processing">Apriori+FP-Growth</Tag><Tag color="blue">共 {rules?.length || 0} 条</Tag></Space>}>
          <DataTable columns={columns} dataSource={rules || []} loading={isLoading} actions={actions} rowKey="id" showSearch searchPlaceholder="搜索规则内容" showFilter filterOptions={[{ label: '全部', value: '' }, { label: '生效', value: 'active' }, { label: '审核中', value: 'review' }, { label: '停用', value: 'inactive' }]} pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (t) => `共 ${t} 条规则` }} />
        </Card>

        <Row gutter={[20, 20]}>
          <Col xs={24} lg={12}>
            <Card title={<Space><ShoppingCartOutlined /><span>规则质量分布</span></Space>} className="shadow-sm">
              <div className="space-y-3">
                {[{ range: 'Lift ≥ 3', count: rules?.filter(r => r.lift >= 3).length || 0, color: '#16A34A' }, { range: '2 ≤ Lift < 3', count: rules?.filter(r => r.lift >= 2 && r.lift < 3).length || 0, color: '#1677FF' }, { range: '1 ≤ Lift < 2', count: rules?.filter(r => r.lift >= 1 && r.lift < 2).length || 0, color: '#F59E0B' }, { range: 'Lift < 1', count: rules?.filter(r => r.lift < 1).length || 0, color: '#DC2626' }].map(item => (<div key={item.range}><div className="flex justify-between mb-1"><Text>{item.range}</Text><Text strong>{item.count} 条</Text></div><Progress percent={(item.count / (rules?.length || 1)) * 100} strokeColor={item.color} size="small" showInfo={false} /></div>))}
                <Divider /><Alert type="info" showIcon message="规则引擎运行正常" description={<Space><Badge status="success" text={`覆盖 ${totalTx.toLocaleString()} 笔事务`} /><Badge status="processing" text="自动优化中" /></Space>} />
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={<Space><FilterOutlined /><span>分析能力说明</span></Space>} className="shadow-sm">
              <div className="space-y-3">
                <Alert type="success" showIcon banner message="智能关联规则引擎" description="基于Apriori和FP-Growth算法的高效关联规则挖掘，支持实时增量更新与规则推荐" />
                <Divider />
                <div className="bg-gray-50 rounded-lg p-4"><Text strong>核心能力：</Text><ul className="mt-2 space-y-2 text-sm text-gray-600 ml-4">
                  <li><FundOutlined className="mr-2 text-blue-500" /> 多维度挖掘：支持用户行为、交易模式、产品关联等多场景分析</li>
                  <li><LineChartOutlined className="mr-2 text-green-500" /> 实时计算：增量式规则更新，新数据即时反映到规则库</li>
                  <li><TeamOutlined className="mr-2 text-orange-500" /> 智能推荐：基于关联规则的个性化商品/服务推荐</li>
                  <li><ThunderboltOutlined className="mr-2 text-purple-500" /> 可解释性：每条规则附带业务语义描述，便于理解与验证</li>
                  <li><DatabaseOutlined className="mr-2 text-red-500" /> 大数据支持：处理千万级事务记录，毫秒级响应</li>
                </ul></div>
                <div className="bg-violet-50 rounded-lg p-3 mt-3"><Text type="secondary" className="text-sm"><ShoppingCartOutlined className="mr-1 text-violet-500" /> 最小支持度可配置 | Lift阈值过滤 | 规则时效性管理</Text></div>
              </div>
            </Card>
          </Col>
        </Row>

        <Modal title={`规则详情 - ${selectedRule?.id || ''}`} open={detailOpen} onCancel={() => setDetailOpen(false)} footer={[<Button key="close" onClick={() => setDetailOpen(false)}>关闭</Button>, <Button key="apply" type="primary" icon={<FilterOutlined />} onClick={() => { message.success('规则已应用到推荐系统'); setDetailOpen(false); }}>应用到推荐系统</Button>]} width={650}>
          {selectedRule && (<div className="space-y-4 mt-4"><Row gutter={[16, 16]}><Col span={12}><Statistic title="前项条件" value="" prefix={<Tag color="blue">{selectedRule.antecedent}</Tag>} /></Col><Col span={12}><Statistic title="后项结果" value="" prefix={<Tag color="green">{selectedRule.consequent}</Tag>} /></Col><Col span={6}><Statistic title="支持度" value={(selectedRule.support * 100).toFixed(1)} suffix="%" /></Col><Col span={6}><Statistic title="置信度" value={(selectedRule.confidence * 100).toFixed(1)} suffix="%" valueStyle={{ color: '#16A34A' }} /></Col><Col span={6}><Statistic title="Lift值" value={selectedRule.lift.toFixed(2)} valueStyle={{ color: selectedRule.lift >= 2 ? '#16A34A' : '#F59E0B' }} /></Col><Col span={6}><Statistic title="事务数" value={selectedRule.transactions.toLocaleString()} /></Col></Row><Divider /><Alert type="info" showIcon message="规则说明" description={selectedRule.description} /></div>)}
        </Modal>
      </div>
    </AdminLayout>
  );
}
