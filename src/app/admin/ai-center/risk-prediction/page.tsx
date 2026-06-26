'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card, Tag, Badge, Button, Space, Row, Col, Typography, Divider, Progress, Statistic, Alert, Tooltip, Modal, message,
} from 'antd';
import {
  AlertOutlined, ThunderboltOutlined, AimOutlined, ClockCircleOutlined, CheckCircleOutlined, SettingOutlined,
  LineChartOutlined, SafetyCertificateOutlined, WarningOutlined, EyeOutlined, DownloadOutlined, BellOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

// Mock数据 - 风险预测记录
const mockPredictions = [
  { id: 'RP-2024062301', asset: 'BTC/USDT', riskType: '市场波动风险', probability: 78.5, confidence: 92.3, actualResult: '高风险', predictTime: '2024-06-23 08:30' },
  { id: 'RP-2024062302', asset: 'ETH/USDT', riskType: '流动性风险', probability: 45.2, confidence: 88.7, actualResult: '低风险', predictTime: '2024-06-23 08:15' },
  { id: 'RP-2024062303', asset: 'SOL/USDT', riskType: '智能合约风险', probability: 62.8, confidence: 85.4, actualResult: '中风险', predictTime: '2024-06-23 07:45' },
  { id: 'RP-2024062304', asset: 'AVAX/USDT', riskType: '市场操纵风险', probability: 35.1, confidence: 91.2, actualResult: '低风险', predictTime: '2024-06-23 07:20' },
  { id: 'RP-2024062305', asset: 'MATIC/USDT', riskType: '技术故障风险', probability: 55.6, confidence: 79.8, actualResult: '-', predictTime: '2024-06-23 06:50' },
  { id: 'RP-2024062306', asset: 'DOT/USDT', riskType: '监管合规风险', probability: 42.3, confidence: 86.5, actualResult: '低风险', predictTime: '2024-06-23 06:10' },
  { id: 'RP-2024062307', asset: 'LINK/USDT', riskType: '预言机风险', probability: 68.9, confidence: 83.2, actualResult: '中风险', predictTime: '2024-06-23 05:35' },
  { id: 'RP-2024062308', asset: 'UNI/USDT', riskType: 'DeFi协议风险', probability: 28.4, confidence: 94.1, actualResult: '低风险', predictTime: '2024-06-23 05:00' },
  { id: 'RP-2024062309', asset: 'AAVE/USDT', riskType: '清算风险', probability: 72.1, confidence: 87.6, actualResult: '高风险', predictTime: '2024-06-23 04:20' },
  { id: 'RP-2024062310', asset: 'CRV/USDT', riskType: '流动性风险', probability: 51.7, confidence: 81.3, actualResult: '-', predictTime: '2024-06-23 03:45' },
];

// 历史准确率数据
const accuracyHistory = [
  { month: '1月', accuracy: 82.3 }, { month: '2月', accuracy: 84.1 },
  { month: '3月', accuracy: 81.5 }, { month: '4月', accuracy: 85.7 },
  { month: '5月', accuracy: 87.2 }, { month: '6月', accuracy: 89.4 },
];

export default function RiskPredictionPage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const { data: predictions, isLoading } = useQuery({
    queryKey: ['ai-risk-predictions'],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 600));
      return mockPredictions;
    },
  });

  // 准确率颜色编码
  const getAccuracyColor = (val: number) => {
    if (val >= 90) return '#16A34A';
    if (val >= 80) return '#1677FF';
    if (val >= 70) return '#F59E0B';
    return '#DC2626';
  };

  // 风险等级Tag
  const getRiskTag = (result: string) => {
    if (result === '-') return <Text type="secondary">待验证</Text>;
    const map: Record<string, { color: string; text: string }> = {
      '高风险': { color: 'red', text: '高' },
      '中风险': { color: 'orange', text: '中' },
      '低风险': { color: 'green', text: '低' },
    };
    const item = map[result] || { color: 'default', text: result };
    return <Tag color={item.color}>{item.text}</Tag>;
  };

  // 风险类型颜色
  const getRiskTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      '市场波动风险': 'blue',
      '流动性风险': 'purple',
      '智能合约风险': 'orange',
      '市场操纵风险': 'red',
      '技术故障风险': 'cyan',
      '监管合规风险': 'geekblue',
      '预言机风险': 'gold',
      'DeFi协议风险': 'volcano',
      '清算风险': 'magenta',
    };
    return colors[type] || 'default';
  };

  const columns = [
    {
      title: '预测ID',
      dataIndex: 'id',
      key: 'id',
      width: 150,
      render: (text: string) => <Text code className="text-xs">{text}</Text>,
    },
    {
      title: '资产',
      dataIndex: 'asset',
      key: 'asset',
      width: 120,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '风险类型',
      dataIndex: 'riskType',
      key: 'riskType',
      width: 140,
      render: (type: string) => <Tag color={getRiskTypeColor(type)}>{type}</Tag>,
    },
    {
      title: '概率',
      dataIndex: 'probability',
      key: 'probability',
      width: 120,
      render: (val: number) => (
        <Progress
          percent={Math.round(val)}
          size="small"
          strokeColor={val >= 70 ? '#DC2626' : val >= 50 ? '#F59E0B' : '#16A34A'}
          format={(percent) => `${percent}%`}
        />
      ),
    },
    {
      title: '置信度',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 130,
      render: (val: number) => (
        <Space>
          <Progress
            percent={Math.round(val)}
            size="small"
            style={{ width: 70 }}
            strokeColor={getAccuracyColor(val)}
          />
          <Text style={{ color: getAccuracyColor(val), fontSize: 12 }} strong>{val}%</Text>
        </Space>
      ),
    },
    {
      title: '实际结果',
      dataIndex: 'actualResult',
      key: 'actualResult',
      width: 100,
      render: (result: string) => getRiskTag(result),
    },
    {
      title: '预测时间',
      dataIndex: 'predictTime',
      key: 'predictTime',
      width: 150,
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
      key: 'alert',
      label: '发送预警',
      icon: <BellOutlined />,
      type: 'primary',
      hidden: () => false,
      onClick: (record: any) => {
        message.success(`已向 ${record.asset} 发送预警通知`);
      },
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 页头 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertOutlined className="text-3xl text-red-500" />
            <div>
              <Title level={3} className="!mb-0">AI 风险预测中心</Title>
              <Text type="secondary">基于深度学习的实时风险预警与预测系统</Text>
            </div>
          </div>
          <Space>
            <Button icon={<DownloadOutlined />}>导出报告</Button>
            <Button type="primary" icon={<ThunderboltOutlined />}>立即预测</Button>
          </Space>
        </div>

        {/* DataCards - 5个 */}
        <Row gutter={[20, 20]}>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="预测任务数"
              value={1286}
              icon={<AimOutlined />}
              color="#1677FF"
              suffix="个"
              trend="up"
              trendValue="+12.5%"
              description="今日已完成预测任务"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="平均准确率"
              value={87.6}
              icon={<SafetyCertificateOutlined />}
              color="#16A34A"
              suffix="%"
              trend="up"
              trendValue="+2.3%"
              description="近30天模型准确率均值"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="今日预警"
              value={23}
              icon={<WarningOutlined />}
              color="#DC2626"
              suffix="条"
              trend="down"
              trendValue="-5.2%"
              description="高风险预警数量"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="覆盖资产"
              value={156}
              icon={<LineChartOutlined />}
              color="#7C3AED"
              suffix="个"
              description="支持预测的交易对"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="模型版本"
              value="v3.2.1"
              icon={<SettingOutlined />}
              color="#F59E0B"
              description="LSTM + Transformer"
            />
          </Col>
        </Row>

        {/* DataTable - 风险预测记录 */}
        <Card title="风险预测记录" className="shadow-sm" extra={
          <Space>
            <Tag color="processing">实时更新</Tag>
            <Tag color="blue">共 {predictions?.length || 0} 条</Tag>
          </Space>
        }>
          <DataTable
            columns={columns}
            dataSource={predictions || []}
            loading={isLoading}
            actions={actions}
            rowKey="id"
            showSearch
            searchPlaceholder="搜索资产或风险类型"
            showFilter
            filterOptions={[
              { label: '全部类型', value: '' },
              { label: '市场波动', value: '市场波动风险' },
              { label: '流动性', value: '流动性风险' },
              { label: '合约安全', value: '智能合约风险' },
              { label: '合规监管', value: '监管合规风险' },
            ]}
            pagination={{
              pageSize: 8,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条预测记录`,
            }}
          />
        </Card>

        {/* 业务特性说明区域 */}
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={12}>
            <Card title={<Space><ThunderboltOutlined /><span>模型性能指标</span></Space>} className="shadow-sm">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <Text>历史准确率趋势</Text>
                    <Text type="secondary">近6个月</Text>
                  </div>
                  <div className="flex gap-1">
                    {accuracyHistory.map((item, idx) => (
                      <Tooltip key={idx} title={`${item.month}: ${item.accuracy}%`}>
                        <div
                          className="flex-1 rounded-t-md transition-all hover:opacity-80 cursor-pointer"
                          style={{
                            height: `${item.accuracy * 0.8}px`,
                            backgroundColor: getAccuracyColor(item.accuracy),
                            minHeight: 20,
                          }}
                        />
                      </Tooltip>
                    ))}
                  </div>
                  <div className="flex gap-1 mt-1">
                    {accuracyHistory.map((item, idx) => (
                      <Text key={idx} className="flex-1 text-center" type="secondary" style={{ fontSize: 10 }}>
                        {item.month}
                      </Text>
                    ))}
                  </div>
                </div>
                <Divider />
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic title="精确率" value={91.2} suffix="%" valueStyle={{ color: '#16A34A', fontSize: 18 }} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="召回率" value={88.5} suffix="%" valueStyle={{ color: '#1677FF', fontSize: 18 }} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="F1分数" value={89.8} suffix="%" valueStyle={{ color: '#7C3AED', fontSize: 18 }} />
                  </Col>
                </Row>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={<Space><BellOutlined /><span>预警规则说明</span></Space>} className="shadow-sm">
              <div className="space-y-3">
                <Alert type="error" showIcon banner message="高风险预警（概率 ≥ 70%）" description="立即触发短信+邮件+站内信三通道告警，需人工确认后解除" />
                <Alert type="warning" showIcon banner message="中风险预警（50% ≤ 概率 < 70%）" description="触发邮件和站内信通知，系统自动标记并持续监控" />
                <Alert type="info" showIcon banner message="低风险提示（概率 < 50%）" description="仅记录日志，纳入每日汇总报告中" />
                <Divider />
                <div className="bg-gray-50 rounded-lg p-4">
                  <Text strong>核心能力：</Text>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600 ml-4">
                    <li>✓ 支持 BTC、ETH 等 156 个交易对的实时风险预测</li>
                    <li>✓ 覆盖 9 大风险类型的智能识别与分类</li>
                    <li>✓ 平均预测响应时间 &lt; 200ms，满足高频场景需求</li>
                    <li>✓ 模型每日自动训练，准确率持续提升中</li>
                  </ul>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 详情弹窗 */}
        <Modal
          title={`预测详情 - ${selectedRecord?.id || ''}`}
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalOpen(false)}>关闭</Button>,
            <Button key="alert" type="primary" icon={<BellOutlined />} onClick={() => {
              message.success('预警已发送');
              setDetailModalOpen(false);
            }}>发送预警</Button>,
          ]}
          width={650}
        >
          {selectedRecord && (
            <div className="space-y-4 mt-4">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic title="目标资产" value={selectedRecord.asset} valueStyle={{ fontSize: 20 }} />
                </Col>
                <Col span={12}>
                  <Statistic title="风险类型" value={selectedRecord.riskType} valueStyle={{ fontSize: 16 }} />
                </Col>
                <Col span={12}>
                  <Statistic title="风险概率" value={selectedRecord.probability} suffix="%" valueStyle={{ color: selectedRecord.probability >= 70 ? '#DC2626' : '#1677FF' }} />
                </Col>
                <Col span={12}>
                  <Statistic title="置信度" value={selectedRecord.confidence} suffix="%" valueStyle={{ color: '#16A34A' }} />
                </Col>
              </Row>
              <Divider />
              <div>
                <Text strong>置信度评估：</Text>
                <Progress percent={Math.round(selectedRecord.confidence)} strokeColor={getAccuracyColor(selectedRecord.confidence)} className="mt-2" />
              </div>
              <div>
                <Text strong>风险评估：</Text>
                <div className="mt-2">{getRiskTag(selectedRecord.actualResult)}</div>
              </div>
              <Text type="secondary">预测时间：{selectedRecord.predictTime}</Text>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
