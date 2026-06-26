'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card, Tag, Badge, Button, Space, Row, Col, Typography, Divider, Progress, Statistic, Alert, Tooltip, Modal, message,
} from 'antd';
import {
  AudioOutlined, CheckCircleOutlined, ThunderboltOutlined, ClockCircleOutlined, TeamOutlined,
  EyeOutlined, SoundOutlined, RobotOutlined, MessageOutlined, ApiOutlined, CustomerServiceOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

// Mock数据 - 语音交互日志
const mockInteractions = [
  { id: 'VI-2024062301', user: 'user_8821', intent: 'query_balance', transcript: '查询我的账户余额', response: '您的总资产为 $125,430.52，其中可用余额 $89,200.00', confidence: 96.5, duration: 1.2, status: 'success', timestamp: '2024-06-23 09:35' },
  { id: 'VI-2024062302', user: 'user_3347', intent: 'trade_order', transcript: '买入0.5个以太坊', response: '已为您创建市价买单，预计成交价 $3,420.00', confidence: 94.2, duration: 2.1, status: 'success', timestamp: '2024-06-23 09:28' },
  { id: 'VI-2024062303', user: 'user_5519', intent: 'market_info', transcript: '比特币现在多少钱', response: '当前BTC价格为 $67,842.30，24小时涨幅 +2.34%', confidence: 98.1, duration: 0.8, status: 'success', timestamp: '2024-06-23 09:15' },
  { id: 'VI-2024062304', user: 'user_9923', intent: 'transfer', transcript: '转100USDT给Tom', response: '请确认转账地址，检测到多个匹配联系人', confidence: 72.3, duration: 3.5, status: 'clarify', timestamp: '2024-06-23 08:52' },
  { id: 'VI-2024062305', user: 'user_1176', intent: 'query_kyc', transcript: '我的KYC审核通过了吗', response: '您的KYC认证已于昨日通过，等级为Lv2高级认证', confidence: 95.8, duration: 1.0, status: 'success', timestamp: '2024-06-23 08:30' },
  { id: 'VI-2024062306', user: 'user_4452', intent: 'unknown', transcript: '帮我分析一下这个项目的潜力', response: '抱歉，该功能暂不支持语音操作，请使用文字输入', confidence: 45.2, duration: 1.5, status: 'failed', timestamp: '2024-06-23 08:10' },
  { id: 'VI-2024062307', user: 'user_6681', intent: 'staking', transcript: '我要质押我的SOL', response: '当前SOL年化收益率为6.8%，是否立即开始质押？', confidence: 93.7, duration: 1.8, status: 'success', timestamp: '2024-06-23 07:45' },
  { id: 'VI-2024062308', user: 'user_2205', intent: 'risk_alert', transcript: '设置价格预警，BTC跌破65000通知我', response: '已为您设置BTC价格预警，阈值 $65,000', confidence: 91.4, duration: 2.3, status: 'success', timestamp: '2024-06-23 07:20' },
  { id: 'VI-2024062309', user: 'user_7738', intent: 'help', transcript: '怎么提现到银行卡', response: '已打开提现教程页面，请按照指引完成操作', confidence: 89.6, duration: 2.8, status: 'success', timestamp: '2024-06-23 06:55' },
  { id: 'VI-2024062310', user: 'user_3094', intent: 'nft_query', transcript: '我持有的NFT能卖多少钱', response: '您持有3件NFT，总估值约 $2,340.00，详情请查看NFT资产页', confidence: 87.9, duration: 2.0, status: 'success', timestamp: '2024-06-23 06:30' },
];

export default function VoiceInteractionPage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const { data: interactions, isLoading } = useQuery({
    queryKey: ['voice-interactions'],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 400));
      return mockInteractions;
    },
  });

  // 识别状态Badge
  const getStatusBadge = (status: string) => {
    const map: Record<string, { status: string; text: string }> = {
      success: { status: 'success', text: '成功' },
      clarify: { status: 'warning', text: '需澄清' },
      failed: { status: 'error', text: '失败' },
      processing: { status: 'processing', text: '处理中' },
    };
    const item = map[status] || { status: 'default', text: status };
    return <Badge status={item.status as any} text={item.text} />;
  };

  // 意图类型颜色
  const getIntentColor = (intent: string) => {
    const colors: Record<string, string> = {
      query_balance: 'green',
      trade_order: 'blue',
      market_info: 'purple',
      transfer: 'orange',
      query_kyc: 'cyan',
      unknown: 'default',
      staking: 'magenta',
      risk_alert: 'red',
      help: 'geekblue',
      nft_query: 'gold',
    };
    return colors[intent] || 'default';
  };

  const getIntentLabel = (intent: string) => {
    const labels: Record<string, string> = {
      query_balance: '余额查询',
      trade_order: '交易下单',
      market_info: '行情查询',
      transfer: '转账操作',
      query_kyc: 'KYC查询',
      unknown: '未识别',
      staking: '质押操作',
      risk_alert: '风险预警',
      help: '帮助咨询',
      nft_query: 'NFT查询',
    };
    return labels[intent] || intent;
  };

  const columns = [
    {
      title: '交互ID',
      dataIndex: 'id',
      key: 'id',
      width: 150,
      render: (text: string) => <Text code className="text-xs">{text}</Text>,
    },
    {
      title: '用户',
      dataIndex: 'user',
      key: 'user',
      width: 110,
      render: (user: string) => (
        <Space><CustomerServiceOutlined /><Text>{user}</Text></Space>
      ),
    },
    {
      title: '意图',
      dataIndex: 'intent',
      key: 'intent',
      width: 110,
      render: (intent: string) => <Tag color={getIntentColor(intent)}>{getIntentLabel(intent)}</Tag>,
    },
    {
      title: '语音内容',
      dataIndex: 'transcript',
      key: 'transcript',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <Space>
            <SoundOutlined className="text-green-500" />
            <Text className="cursor-pointer" style={{ maxWidth: 160 }}>{text}</Text>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: '置信度',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 110,
      render: (val: number) => (
        <Progress
          percent={Math.round(val)}
          size="small"
          strokeColor={val >= 90 ? '#16A34A' : val >= 70 ? '#1677FF' : '#F59E0B'}
          format={(percent) => `${percent}%`}
        />
      ),
    },
    {
      title: '响应时间',
      dataIndex: 'duration',
      key: 'duration',
      width: 90,
      render: (val: number) => <Text style={{ color: val <= 1.5 ? '#16A34A' : val <= 2.5 ? '#F59E0B' : '#DC2626' }}>{val}s</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => getStatusBadge(status),
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 140,
    },
  ];

  const actions: any[] = [
    {
      key: 'play',
      label: '播放录音',
      icon: <AudioOutlined />,
      onClick: (record: any) => {
        message.info(`播放 ${record.id} 的录音`);
      },
    },
    {
      key: 'view',
      label: '详情',
      icon: <EyeOutlined />,
      onClick: (record: any) => {
        setSelectedRecord(record);
        setDetailModalOpen(true);
      },
    },
  ];

  // 统计数据
  const avgAccuracy = interactions ? (interactions.reduce((sum: number, i: any) => sum + i.confidence, 0) / interactions.length).toFixed(1) : 0;
  const successRate = interactions ? ((interactions.filter((i: any) => i.status === 'success').length / interactions.length) * 100).toFixed(1) : 0;
  const avgDuration = interactions ? (interactions.reduce((sum: number, i: any) => sum + i.duration, 0) / interactions.length).toFixed(1) : 0;
  const uniqueUsers = new Set(interactions?.map((i: any) => i.user)).size;
  const uniqueIntents = new Set(interactions?.map((i: any) => i.intent)).size;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 页头 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AudioOutlined className="text-3xl text-cyan-500" />
            <div>
              <Title level={3} className="!mb-0">语音交互中心</Title>
              <Text type="secondary">语音指令 · 交互日志 · 意图识别统计</Text>
            </div>
          </div>
          <Space>
            <Button icon={<RobotOutlined />}>意图管理</Button>
            <Button type="primary" icon={<MessageOutlined />}>测试对话</Button>
          </Space>
        </div>

        {/* DataCards - 5个 */}
        <Row gutter={[20, 20]}>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="今日交互"
              value={interactions?.length || 0}
              icon={<MessageOutlined />}
              color="#1677FF"
              suffix="次"
              trend="up"
              trendValue="+15.3%"
              description="语音指令总数"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="识别准确率"
              value={avgAccuracy}
              icon={<CheckCircleOutlined />}
              color="#16A34A"
              suffix="%"
              trend="up"
              trendValue="+1.8%"
              description="意图识别平均准确率"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="平均响应"
              value={avgDuration}
              icon={<ClockCircleOutlined />}
              color="#F59E0B"
              suffix="秒"
              description="端到端响应时间"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="活跃用户"
              value={uniqueUsers}
              icon={<TeamOutlined />}
              color="#7C3AED"
              suffix="人"
              description="今日使用语音的用户"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="意图种类"
              value={uniqueIntents}
              icon={<ApiOutlined />}
              color="#06B6D4"
              suffix="种"
              description="已支持的意图类型"
            />
          </Col>
        </Row>

        {/* DataTable - 语音交互日志 */}
        <Card title="语音交互日志" className="shadow-sm" extra={
          <Space>
            <Badge count={interactions?.filter((i: any) => i.status === 'success').length || 0} style={{ backgroundColor: '#16A34A' }}>
              <Tag color="green">成功</Tag>
            </Badge>
            <Tag color="blue">成功率 {successRate}%</Tag>
          </Space>
        }>
          <DataTable
            columns={columns}
            dataSource={interactions || []}
            loading={isLoading}
            actions={actions}
            rowKey="id"
            showSearch
            searchPlaceholder="搜索用户或语音内容"
            showFilter
            filterOptions={[
              { label: '全部状态', value: '' },
              { label: '成功', value: 'success' },
              { label: '需澄清', value: 'clarify' },
              { label: '失败', value: 'failed' },
            ]}
            pagination={{
              pageSize: 8,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条交互记录`,
            }}
          />
        </Card>

        {/* 业务特性说明区域 */}
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={12}>
            <Card title={<Space><RobotOutlined /><span>意图识别分布</span></Space>} className="shadow-sm">
              <div className="space-y-3">
                {Array.from(new Set(mockInteractions.map(i => i.intent))).slice(0, 6).map(intent => {
                  const count = interactions?.filter((i: any) => i.intent === intent).length || 0;
                  const percent = (count / (interactions?.length || 1)) * 100;
                  return (
                    <div key={intent}>
                      <div className="flex justify-between mb-1">
                        <Tag color={getIntentColor(intent)}>{getIntentLabel(intent)}</Tag>
                        <Text strong>{count} 次 ({percent.toFixed(0)}%)</Text>
                      </div>
                      <Progress percent={percent} strokeColor={getIntentColor(intent)} size="small" showInfo={false} />
                    </div>
                  );
                })}
                <Divider />
                <Alert
                  type="success"
                  showIcon
                  message="ASR + NLU 引擎正常"
                  description={
                    <Space>
                      <Badge status="success" text={`识别率 ${avgAccuracy}%`} />
                      <Badge status="processing" text={`响应均值 ${avgDuration}s`} />
                    </Space>
                  }
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={<Space><SoundOutlined /><span>语音能力说明</span></Space>} className="shadow-sm">
              <div className="space-y-3">
                <Alert
                  type="info"
                  showIcon
                  banner
                  message="智能语音助手系统"
                  description="集成ASR语音识别、NLU自然语言理解、TTS语音合成的全栈语音交互方案"
                />
                <Divider />
                <div className="bg-gray-50 rounded-lg p-4">
                  <Text strong>核心能力：</Text>
                  <ul className="mt-2 space-y-2 text-sm text-gray-600 ml-4">
                    <li><AudioOutlined className="mr-2 text-blue-500" /> 多语言识别：支持中文（普通话/粤语）、英文等8种语言</li>
                    <li><RobotOutlined className="mr-2 text-green-500" /> 意图理解：基于Transformer的语义解析，支持复杂多轮对话</li>
                    <li><CheckCircleOutlined className="mr-2 text-orange-500" /> 业务集成：无缝对接交易、查询、转账等核心功能</li>
                    <li><ThunderboltOutlined className="mr-2 text-purple-500" /> 低延迟：端到端响应 &lt; 2秒，支持流式返回</li>
                    <li><SafetyCertificateOutlined className="mr-2 text-red-500" /> 安全合规：声纹验证+敏感操作二次确认</li>
                  </ul>
                </div>
                <div className="bg-cyan-50 rounded-lg p-3 mt-3">
                  <Text type="secondary" className="text-sm">
                    <CustomerServiceOutlined className="mr-1 text-cyan-500" />
                    支持中英混合 | 方言适配 | 噪声抑制 | 离线模式
                  </Text>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 详情弹窗 */}
        <Modal
          title={`交互详情 - ${selectedRecord?.id || ''}`}
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalOpen(false)}>关闭</Button>,
            <Button key="play" type="primary" icon={<AudioOutlined />} onClick={() => {
              message.success('开始播放');
              setDetailModalOpen(false);
            }}>播放录音</Button>,
          ]}
          width={700}
        >
          {selectedRecord && (
            <div className="space-y-4 mt-4">
              <Row gutter={[16, 16]}>
                <Col span={8}><Statistic title="用户" value={selectedRecord.user} /></Col>
                <Col span={8}><Statistic title="意图" value="" prefix={<Tag color={getIntentColor(selectedRecord.intent)}>{getIntentLabel(selectedRecord.intent)}</Tag>} /></Col>
                <Col span={8}><Statistic title="状态" value="" prefix={getStatusBadge(selectedRecord.status)} /></Col>
              </Row>
              <Divider />
              <div>
                <Text strong>用户语音：</Text>
                <div className="mt-2 p-3 bg-green-50 rounded-lg border-l-4 border-green-500 flex items-start gap-2">
                  <SoundOutlined className="text-green-600 mt-0.5" />
                  <Text>{selectedRecord.transcript}</Text>
                </div>
              </div>
              <div className="mt-3">
                <Text strong>系统回复：</Text>
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500 flex items-start gap-2">
                  <RobotOutlined className="text-blue-600 mt-0.5" />
                  <Text>{selectedRecord.response}</Text>
                </div>
              </div>
              <Row gutter={[16, 16]} className="mt-3">
                <Col span={8}><Statistic title="置信度" value={selectedRecord.confidence} suffix="%" valueStyle={{ color: selectedRecord.confidence >= 90 ? '#16A34A' : '#F59E0B' }} /></Col>
                <Col span={8}><Statistic title="响应时长" value={selectedRecord.duration} suffix="s" /></Col>
                <Col span={8}><Statistic title="交互时间" value={selectedRecord.timestamp} /></Col>
              </Row>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
