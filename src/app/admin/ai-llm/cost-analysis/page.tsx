'use client';

import { useState } from 'react';
import {
  Row, Col, Card, Tag, Button, Space, Modal, Descriptions, Typography, Tooltip, message, Progress, Divider, Table, Statistic, Select, Slider, InputNumber, Alert,
} from 'antd';
import {
  DollarCircleOutlined, EyeOutlined, DownloadOutlined, SettingOutlined, LineChartOutlined,
  RiseOutlined, FallOutlined, ThunderboltOutlined, WalletOutlined, PieChartOutlined,
  WarningOutlined, CheckCircleOutlined, AimOutlined, FilterOutlined, CalendarOutlined,
  SafetyCertificateOutlined, PercentageOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Text, Paragraph } = Typography;

// 模拟费用明细数据
const mockCosts = [
  { id: 'COST-001', date: '2024-06-08', model: 'GPT-4o', project: '安全事件响应', tokens: '2.8M', cost: '$42.50', percentage: 18.2, trend: 'up' },
  { id: 'COST-002', date: '2024-06-08', model: 'Claude 3.5 Sonnet', project: '智能客服系统', tokens: '3.2M', cost: '$38.40', percentage: 16.5, trend: 'down' },
  { id: 'COST-003', date: '2024-06-08', model: 'Qwen2.5-72B-Instruct', project: '多语言内容', tokens: '5.6M', cost: '$22.40', percentage: 9.6, trend: 'up' },
  { id: 'COST-004', date: '2024-06-08', model: 'GPT-4o', project: '代码审查助手', tokens: '1.2M', cost: '$18.20', percentage: 7.8, trend: 'stable' },
  { id: 'COST-005', date: '2024-06-08', model: 'DeepSeek-V2', project: '数据分析管道', tokens: '8.9M', cost: '$17.80', percentage: 7.6, trend: 'down' },
  { id: 'COST-006', date: '2024-06-08', model: 'Claude 3.5 Sonnet', project: 'KYC报告生成', tokens: '2.1M', cost: '$25.20', percentage: 10.8, trend: 'up' },
  { id: 'COST-007', date: '2024-06-08', model: 'LLaMA-3-70B', project: '推荐系统Rerank', tokens: '12.3M', cost: '$12.30', percentage: 5.3, trend: 'stable' },
  { id: 'COST-008', date: '2024-06-08', model: 'GPT-4o', project: 'NFT描述生成', tokens: '0.8M', cost: '$12.16', percentage: 5.2, trend: 'up' },
  { id: 'COST-009', date: '2024-06-08', model: 'Mistral Large', project: '合同条款抽取', tokens: '1.5M', cost: '$13.50', percentage: 5.8, trend: 'down' },
  { id: 'COST-010', date: '2024-06-07', model: 'GPT-4o', project: '安全事件响应', tokens: '2.5M', cost: '$37.95', percentage: 16.3, trend: 'up' },
  { id: 'COST-011', date: '2024-06-07', model: 'Claude 3.5 Sonnet', project: '智能客服系统', tokens: '2.9M', cost: '$34.80', percentage: 14.9, trend: 'stable' },
  { id: 'COST-012', date: '2024-06-07', model: 'Qwen2.5-72B-Instruct', project: '多语言内容', tokens: '5.2M', cost: '$20.80', percentage: 8.9, trend: 'down' },
];

export default function CostAnalysisPage() {
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const monthlyBudget = 7000;
  const usedBudget = 233.46;
  const budgetPercent = Math.round((usedBudget / monthlyBudget) * 100);
  const totalTokens = mockCosts.filter(c => c.date === '2024-06-08').reduce((sum, c) => sum + parseFloat(c.tokens.replace('M', '')), 0).toFixed(1);
  const avgPerCall = (usedBudget / 45000).toFixed(4);
  const savedRatio = 12.5;

  const columns = [
    { title: '日期', dataIndex: 'date', key: 'date', width: 110, render: (d: string) => <Tag color={d === '2024-06-08' ? 'blue' : 'default'}>{d}</Tag> },
    { title: '模型', dataIndex: 'model', key: 'model', width: 150, render: (m: string) => <Text code className="!text-xs">{m}</Text> },
    { title: '项目', dataIndex: 'project', key: 'project', width: 140, render: (p: string) => <span className="text-sm">{p}</span> },
    { title: 'Token用量', dataIndex: 'tokens', key: 'tokens', width: 100, align: 'right', render: (t: string) => t },
    { title: '费用', dataIndex: 'cost', key: 'cost', width: 100, align: 'right', render: (c: string) => <span className="font-semibold text-red-500">{c}</span> },
    { title: '占比', dataIndex: 'percentage', key: 'percentage', width: 100, render: (p: number) => <Progress percent={Math.round(p)} size="small" strokeColor={p > 15 ? '#DC2626' : p > 8 ? '#F59E0B' : '#16A34A'} format={percent => `${percent}%`} /> },
    { title: '趋势', dataIndex: 'trend', key: 'trend', width: 80, align: 'center', render: (t: string) => t === 'up' ? <RiseOutlined className="text-red-500" /> : t === 'down' ? <FallOutlined className="text-green-500" /> : <MinusOutlined className="text-gray-400" /> },
    { title: '操作', key: 'actions', width: 100, render: () => (<Space size="small"><Tooltip title="详情"><Button type="text" size="small" icon={<EyeOutlined />} /></Tooltip></Space>) },
  ];

  // 今日费用汇总
  const todayTotal = mockCosts.filter(c => c.date === '2024-06-08').reduce((sum, c) => sum + parseFloat(c.cost.replace('$', '')), 0).toFixed(2);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><DollarCircleOutlined className="text-2xl text-blue-600" /><h1 className="text-2xl font-bold m-0">成本分析</h1></div>
          <Space><Button icon={<DownloadOutlined />}>导出报表</Button><Button icon={<SettingOutlined />} onClick={() => setBudgetModalVisible(true)}>预算设置</Button></Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="本月费用(估)"
              value={`$${usedBudget.toFixed(0)}`}
              icon={<WalletOutlined />}
              color="#DC2626"
              trend="up"
              trendValue="+8.2%"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="Token总量"
              value={`${totalTokens}M`}
              icon={<ThunderboltOutlined />}
              color="#1677FF"
              trend="up"
              trendValue="+15%"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="单次均价"
              value={`$${avgPerCall}`}
              icon={<PercentageOutlined />}
              color="#F59E0B"
              description="/千次调用"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="预算使用率"
              value={`${budgetPercent}%`}
              icon={<AimOutlined />}
              color={budgetPercent > 80 ? '#DC2626' : budgetPercent > 60 ? '#F59E0B' : '#16A34A'}
              suffix="%"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="节省比例"
              value={`${savedRatio}%`}
              icon={<LineChartOutlined />}
              color="#16A34A"
              description="较上月同期"
              suffix="%"
            />
          </Col>
        </Row>

        {/* 预算进度条 */}
        <Card className="shadow-sm" size="small">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">月度预算进度</span>
            <span className="text-sm text-gray-500">${usedBudget.toFixed(2)} / ${monthlyBudget.toLocaleString()}</span>
          </div>
          <Progress
            percent={budgetPercent}
            strokeColor={budgetPercent > 80 ? { from: '#DC2626', to: '#EF4444' } : budgetPercent > 60 ? { from: '#F59E0B', to: '#FBBF24' } : { from: '#16A34A', to: '#22C55E' }}
            status={budgetPercent > 90 ? 'exception' : 'active'}
            format={percent => `$${(monthlyBudget * percent / 100).toFixed(0)} (${percent}%)`}
          />
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>剩余预算: ${(monthlyBudget - usedBudget).toFixed(2)}</span>
            <span>预计本月总费用: ~$${(usedBudget * 30 / 8).toFixed(0)}</span>
          </div>
        </Card>

        <DataTable
          columns={columns as any}
          dataSource={mockCosts}
          rowKey="id"
          title="费用明细列表"
          showSearch
          searchPlaceholder="搜索模型名或项目..."
          showFilter
          filterOptions={[
            { label: '全部日期', value: '' },
            { label: '今天', value: '2024-06-08' },
            { label: '昨天', value: '2024-06-07' },
          ]}
          pagination={{ pageSize: 8, showTotal: (t) => `共 ${t} 条记录` }}
        />

        {/* 费用分布与优化建议 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title={<span><PieChartOutlined /> 模型费用占比 TOP 5</span>} className="shadow-sm" size="small">
              <div className="space-y-3">
                {mockCosts.filter(c => c.date === '2024-06-08').sort((a, b) => parseFloat(b.cost.replace('$', '')) - parseFloat(a.cost.replace('$', ''))).slice(0, 5).map((item, i) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{
                      backgroundColor: ['#DC2626', '#F59E0B', '#16A34A', '#1677FF', '#7C3AED'][i]
                    }}>{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium truncate mr-2">{item.model}</span>
                        <span className="text-sm font-bold">{item.cost}</span>
                      </div>
                      <Progress percent={Math.round(item.percentage)} size="small" showInfo={false} strokeColor={['#DC2626', '#F59E0B', '#16A34A', '#1677FF', '#7C3AED'][i]} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title={<span><WarningOutlined /> 成本优化建议</span>} className="shadow-sm" size="small">
              <div className="space-y-3">
                <Alert type="warning" showIcon message="高成本预警" description="GPT-4o 在「安全事件响应」项目中费用占比过高(18.2%)，建议切换至 Qwen2.5 或 Claude Haiku 以降低成本。" />
                <Alert type="info" showIcon message="缓存优化" description="「智能客服系统」存在大量重复查询场景，启用语义缓存可预计节省 25-35% 的 Token 开销。" />
                <Alert type="success" showIcon message="模型降级" description="「推荐系统Rerank」任务使用 LLaMA-3-70B 已足够，无需调用更昂贵的模型，当前配置合理。" />
                <Alert type="error" showIcon message="预算超支风险" description="按当前消耗速度，预计本月费用将达到 $${(usedBudget * 30 / 8).toFixed(0)}，超出预算 ${(((usedBudget * 30 / 8) - monthlyBudget)).toFixed(0)}。" />
              </div>
            </Card>
          </Col>
        </Row>

        {/* 预算设置弹窗 */}
        <Modal
          title="月度预算设置"
          open={budgetModalVisible}
          onCancel={() => setBudgetModalVisible(false)}
          onOk={() => { message.success('预算设置已保存'); setBudgetModalVisible(false); }}
          okText="保存设置"
        >
          <div className="py-4 space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">月度预算上限</span>
                <InputNumber min={100} max={100000} step={100} defaultValue={monthlyBudget} prefix="$" formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} style={{ width: 160 }} />
              </div>
              <Slider min={100} max={50000} step={100} defaultValue={monthlyBudget} tooltip={{ formatter: v => `$${v?.toLocaleString()}` }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">超支告警阈值</label>
              <Select defaultValue="80" className="w-full" options={[
                { label: '70% - 提前预警', value: '70' },
                { label: '80% - 标准预警（推荐）', value: '80' },
                { label: '90% - 紧急预警', value: '90' },
              ]} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">通知方式</label>
              <Select mode="multiple" defaultValue={['email']} className="w-full" options={[
                { label: '邮件通知', value: 'email' },
                { label: '站内消息', value: 'in_app' },
                { label: 'Webhook回调', value: 'webhook' },
                { label: 'Slack通知', value: 'slack' },
              ]} />
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}

import { MinusOutlined } from '@ant-design/icons';
