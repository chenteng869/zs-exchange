'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card, Tag, Badge, Button, Space, Row, Col, Typography, Divider, Progress, Statistic, Alert, Tooltip, Modal, message,
} from 'antd';
import {
  ExperimentOutlined, CheckCircleOutlined, ThunderboltOutlined, ClockCircleOutlined, DollarOutlined,
  BulbOutlined, EyeOutlined, LineChartOutlined, TeamOutlined, FileSearchOutlined, AimOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

// Mock数据 - 决策记录
const mockDecisions = [
  { id: 'DC-2024062301', topic: 'BTC持仓策略调整', type: 'trading', aiSuggestion: '建议减仓15%，将资金转入稳定币收益池', humanDecision: '采纳，执行减仓12%', result: 'success', decisionTime: '2024-06-23 10:30' },
  { id: 'DC-2024062302', topic: '新上币种评估-SOL生态', type: 'listing', aiSuggestion: '综合评分82分，建议通过上线审核', humanDecision: '暂缓，需补充合规材料', result: 'pending', decisionTime: '2024-06-23 09:45' },
  { id: 'DC-2024062303', topic: '流动性危机应对方案', type: 'risk', aiSuggestion: '启动应急流动性协议，调用DeFi储备金500万USDT', humanDecision: '采纳，启动预案B', result: 'success', decisionTime: '2024-06-23 09:00' },
  { id: 'DC-2024062304', topic: '用户KYC流程优化', type: 'operation', aiSuggestion: '引入AI预审+人工复核双通道，预计效率提升40%', humanDecision: '部分采纳，保留人工终审环节', result: 'partial', decisionTime: '2024-06-23 08:20' },
  { id: 'DC-2024062305', topic: 'Gas费用补贴策略', type: 'cost', aiSuggestion: '对VIP用户实施阶梯式Gas返还，预算控制在月均50ETH', humanDecision: '未采纳，维持现有策略', result: 'rejected', decisionTime: '2024-06-23 07:35' },
  { id: 'DC-2024062306', topic: '智能合约升级评估', type: 'technical', aiSuggestion: 'Swap V2→V3升级风险可控，建议分阶段迁移', humanDecision: '采纳，制定3阶段迁移计划', result: 'success', decisionTime: '2024-06-23 06:50' },
  { id: 'DC-2024062307', topic: '市场推广渠道分配', type: 'marketing', aiSuggestion: 'KOL投放占比60%，社区建设25%，品牌广告15%', humanDecision: '调整为KOL50%/社区30%/品牌20%', result: 'partial', decisionTime: '2024-06-23 06:00' },
  { id: 'DC-2024062308', topic: 'API限流策略调整', type: 'technical', aiSuggestion: '高频用户限流阈值提升至1000req/min，配合动态令牌桶', humanDecision: '完全采纳', result: 'success', decisionTime: '2024-06-23 05:15' },
  { id: 'DC-2024062309', topic: '风控模型参数调优', type: 'risk', aiSuggestion: '将异常交易检测灵敏度从0.85提升至0.92', humanDecision: '采纳并设置灰度测试', result: 'testing', decisionTime: '2024-06-23 04:30' },
  { id: 'DC-2024062310', topic: '跨链桥接入评估', type: 'technical', aiSuggestion: 'LayerZero方案综合最优，安全性评分95/100', humanDecision: '进入POC验证阶段', result: 'pending', decisionTime: '2024-06-23 03:45' },
];

export default function SmartDecisionPage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const { data: decisions, isLoading } = useQuery({
    queryKey: ['ai-decisions'],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 600));
      return mockDecisions;
    },
  });

  // 决策类型Tag颜色
  const getTypeConfig = (type: string) => {
    const map: Record<string, { color: string; text: string }> = {
      trading: { color: 'green', text: '交易决策' },
      listing: { color: 'blue', text: '上币评估' },
      risk: { color: 'red', text: '风控决策' },
      operation: { color: 'orange', text: '运营决策' },
      cost: { color: 'purple', text: '成本决策' },
      technical: { color: 'cyan', text: '技术决策' },
      marketing: { color: 'magenta', text: '营销决策' },
    };
    return map[type] || { color: 'default', text: type };
  };

  // 结果Badge状态
  const getResultBadge = (result: string) => {
    const map: Record<string, { status: string; text: string }> = {
      success: { status: 'success', text: '已采纳' },
      partial: { status: 'warning', text: '部分采纳' },
      rejected: { status: 'error', text: '已拒绝' },
      pending: { status: 'default', text: '待定' },
      testing: { status: 'processing', text: '验证中' },
    };
    const item = map[result] || { status: 'default', text: result };
    return <Badge status={item.status as any} text={item.text} />;
  };

  // 采纳率计算
  const adoptionRate = decisions ? ((decisions.filter((d: any) => d.result === 'success').length / decisions.length) * 100).toFixed(1) : 0;

  const columns = [
    {
      title: '决策ID',
      dataIndex: 'id',
      key: 'id',
      width: 150,
      render: (text: string) => <Text code className="text-xs">{text}</Text>,
    },
    {
      title: '决策主题',
      dataIndex: 'topic',
      key: 'topic',
      width: 200,
      render: (topic: string) => <Text strong className="cursor-pointer hover:text-blue-600">{topic}</Text>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (type: string) => {
        const config = getTypeConfig(type);
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'AI建议',
      dataIndex: 'aiSuggestion',
      key: 'aiSuggestion',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={<div style={{ maxWidth: 300 }}>{text}</div>}>
          <Space>
            <BulbOutlined className="text-yellow-500" />
            <Text className="cursor-pointer" style={{ maxWidth: 180 }}>{text}</Text>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: '人工决策',
      dataIndex: 'humanDecision',
      key: 'humanDecision',
      width: 180,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text type="secondary" className="cursor-pointer">{text}</Text>
        </Tooltip>
      ),
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      width: 100,
      render: (result: string) => getResultBadge(result),
    },
    {
      title: '时间',
      dataIndex: 'decisionTime',
      key: 'decisionTime',
      width: 140,
    },
  ];

  const actions: any[] = [
    {
      key: 'view',
      label: '查看详情',
      icon: <EyeOutlined />,
      onClick: (record: any) => {
        setSelectedRecord(record);
        setDetailModalOpen(true);
      },
    },
    {
      key: 'trace',
      label: '决策追溯',
      icon: <FileSearchOutlined />,
      hidden: () => false,
      onClick: (record: any) => {
        message.info(`正在追溯 ${record.id} 的完整决策链路`);
      },
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 页头 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ExperimentOutlined className="text-3xl text-purple-500" />
            <div>
              <Title level={3} className="!mb-0">AI 智能决策中心</Title>
              <Text type="secondary">数据驱动决策 · 方案对比 · 全程可追溯</Text>
            </div>
          </div>
          <Space>
            <Button icon={<LineChartOutlined />}>决策报表</Button>
            <Button type="primary" icon={<BulbOutlined />}>发起决策请求</Button>
          </Space>
        </div>

        {/* DataCards - 5个 */}
        <Row gutter={[20, 20]}>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="决策请求数"
              value={856}
              icon={<AimOutlined />}
              color="#1677FF"
              suffix="次"
              trend="up"
              trendValue="+18.2%"
              description="累计决策请求数"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="采纳率"
              value={adoptionRate}
              icon={<CheckCircleOutlined />}
              color="#16A34A"
              suffix="%"
              trend="up"
              trendValue="+3.5%"
              description="AI建议被采纳比例"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="平均决策时长"
              value={2.4}
              icon={<ClockCircleOutlined />}
              color="#F59E0B"
              suffix="小时"
              trend="down"
              trendValue="-0.8小时"
              description="从请求到确认"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="节省成本"
              value={128.5}
              icon={<DollarOutlined />}
              color="#7C3AED"
              prefix="$"
              suffix="万"
              trend="up"
              trendValue="+22.3%"
              description="本月累计节省"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="AI建议数"
              value={decisions?.length || 0}
              icon={<BulbOutlined />}
              color="#06B6D4"
              suffix="条"
              description="今日生成建议"
            />
          </Col>
        </Row>

        {/* DataTable - 决策记录 */}
        <Card title="决策记录" className="shadow-sm" extra={
          <Space>
            <Badge count={decisions?.filter((d: any) => d.result === 'success').length || 0} style={{ backgroundColor: '#16A34A' }}>
              <Tag color="green">已采纳</Tag>
            </Badge>
            <Tag color="blue">共 {decisions?.length || 0} 条</Tag>
          </Space>
        }>
          <DataTable
            columns={columns}
            dataSource={decisions || []}
            loading={isLoading}
            actions={actions}
            rowKey="id"
            showSearch
            searchPlaceholder="搜索决策主题或类型"
            showFilter
            filterOptions={[
              { label: '全部类型', value: '' },
              { label: '交易决策', value: 'trading' },
              { label: '风控决策', value: 'risk' },
              { label: '技术决策', value: 'technical' },
              { label: '运营决策', value: 'operation' },
            ]}
            pagination={{
              pageSize: 8,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条决策记录`,
            }}
          />
        </Card>

        {/* 业务特性说明区域 */}
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={12}>
            <Card title={<Space><TeamOutlined /><span>决策类型分布</span></Space>} className="shadow-sm">
              <div className="space-y-3">
                {Object.entries({
                  trading: { label: '交易决策', icon: <LineChartOutlined /> },
                  risk: { label: '风控决策', icon: <ThunderboltOutlined /> },
                  technical: { label: '技术决策', icon: <ExperimentOutlined /> },
                  operation: { label: '运营决策', icon: <ClockCircleOutlined /> },
                  marketing: { label: '营销决策', icon: <DollarOutlined /> },
                }).map(([key, config]) => {
                  const count = decisions?.filter((d: any) => d.type === key).length || 0;
                  const percent = (count / (decisions?.length || 1)) * 100;
                  return (
                    <div key={key}>
                      <div className="flex justify-between mb-1">
                        <Space>{config.icon}<Text>{config.label}</Text></Space>
                        <Text strong>{count} ({percent.toFixed(0)}%)</Text>
                      </div>
                      <Progress percent={percent} strokeColor={getTypeConfig(key).color} size="small" showInfo={false} />
                    </div>
                  );
                })}
                <Divider />
                <Alert
                  type="success"
                  showIcon
                  message="决策引擎运行正常"
                  description={
                    <Space wrap>
                      <Badge status="success" text={`采纳率 ${adoptionRate}%`} />
                      <Badge status="processing" text="模型版本 v2.1.0" />
                      <Badge status="warning" text="平均响应 1.2s" />
                    </Space>
                  }
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={<Space><BulbOutlined /><span>决策能力说明</span></Space>} className="shadow-sm">
              <div className="space-y-3">
                <Alert
                  type="info"
                  showIcon
                  banner
                  message="智能决策辅助系统"
                  description="基于多维度数据分析，为每个业务场景提供量化决策建议，支持人机协同决策模式"
                />
                <Divider />
                <div className="bg-gray-50 rounded-lg p-4">
                  <Text strong>核心能力矩阵：</Text>
                  <ul className="mt-2 space-y-2 text-sm text-gray-600 ml-4">
                    <li><ExperimentOutlined className="mr-2 text-blue-500" /> 多方案对比：自动生成3-5个备选方案及优劣分析</li>
                    <li><LineChartOutlined className="mr-2 text-green-500" /> 预测模拟：基于历史数据推演各方案的预期效果</li>
                    <li><TeamOutlined className="mr-2 text-orange-500" /> 协同决策：支持多人评审、投票、注释等协作功能</li>
                    <li><FileSearchOutlined className="mr-2 text-purple-500" /> 完整追溯：记录决策全过程，支持审计与复盘</li>
                    <li><ThunderboltOutlined className="mr-2 text-red-500" /> 实时学习：根据决策反馈持续优化推荐质量</li>
                  </ul>
                </div>
                <div className="bg-green-50 rounded-lg p-3 mt-3">
                  <Text type="secondary" className="text-sm">
                    <CheckCircleOutlined className="mr-1 text-green-500" />
                    覆盖 6 大业务域 | 支持中英文 | 平均准确率 89.2%
                  </Text>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 详情弹窗 */}
        <Modal
          title={`决策详情 - ${selectedRecord?.id || ''}`}
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalOpen(false)}>关闭</Button>,
            <Button key="trace" type="primary" icon={<FileSearchOutlined />} onClick={() => {
              message.success('已打开决策追溯视图');
              setDetailModalOpen(false);
            }}>查看追溯</Button>,
          ]}
          width={700}
        >
          {selectedRecord && (
            <div className="space-y-4 mt-4">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic title="决策主题" value={selectedRecord.topic} valueStyle={{ fontSize: 16 }} />
                </Col>
                <Col span={12}>
                  <Statistic title="决策类型" value="" valueStyle={{ fontSize: 14 }} prefix={
                    <Tag color={getTypeConfig(selectedRecord.type).color}>{getTypeConfig(selectedRecord.type).text}</Tag>
                  } />
                </Col>
              </Row>
              <Divider />
              <div>
                <Text strong>AI 建议：</Text>
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <Text>{selectedRecord.aiSuggestion}</Text>
                </div>
              </div>
              <div className="mt-3">
                <Text strong>人工决策：</Text>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border-l-4 border-gray-400">
                  <Text>{selectedRecord.humanDecision}</Text>
                </div>
              </div>
              <Row gutter={[16, 16]} className="mt-3">
                <Col span={12}>
                  <Statistic title="执行结果" value="" prefix={getResultBadge(selectedRecord.result)} />
                </Col>
                <Col span={12}>
                  <Statistic title="决策时间" value={selectedRecord.decisionTime} />
                </Col>
              </Row>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
