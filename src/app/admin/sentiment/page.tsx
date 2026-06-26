'use client';

import React from 'react';
import {
  Row,
  Col,
  Card,
  Tag,
  Progress,
  Typography,
} from 'antd';
import {
  HeartOutlined,
  FireOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  FallOutlined,
  SmileOutlined,
  FrownOutlined,
  MehOutlined,
  DashboardOutlined,
  ApiOutlined,
  MessageOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Text } = Typography;

const mockSources = [
  { id: 'S-001', name: 'Twitter/X 社交', indexValue: 72, trend: 'up', updateTime: '2024-06-23 14:30', confidence: 88, postsCount: 158000 },
  { id: 'S-002', name: 'Reddit 论坛', indexValue: 65, trend: 'up', updateTime: '2024-06-23 14:28', confidence: 82, postsCount: 42500 },
  { id: 'S-003', name: 'Telegram 群组', indexValue: 78, trend: 'up', updateTime: '2024-06-23 14:25', confidence: 75, postsCount: 89000 },
  { id: 'S-004', name: 'Discord 社区', indexValue: 58, trend: 'down', updateTime: '2024-06-23 14:20', confidence: 70, postsCount: 32000 },
  { id: 'S-005', name: '新闻媒体聚合', indexValue: 68, trend: 'stable', updateTime: '2024-06-23 14:15', confidence: 92, postsCount: 12500 },
  { id: 'S-006', name: '链上数据信号', indexValue: 74, trend: 'up', updateTime: '2024-06-23 14:10', confidence: 95, postsCount: 0 },
  { id: 'S-007', name: 'Google Trends', indexValue: 55, trend: 'down', updateTime: '2024-06-23 14:05', confidence: 85, postsCount: 0 },
  { id: 'S-008', name: 'GitHub 开发活跃度', indexValue: 62, trend: 'stable', updateTime: '2024-06-23 14:00', confidence: 90, postsCount: 0 },
  { id: 'S-009', name: 'Weibo 微博', indexValue: 45, trend: 'down', updateTime: '2024-06-23 13:55', confidence: 68, postsCount: 68000 },
  { id: 'S-010', name: 'AI 大模型分析', indexValue: 71, trend: 'up', updateTime: '2024-06-23 13:50', confidence: 93, postsCount: 0 },
];

const currentSentiment = 67;
const fearGreedIndex = 58;

function getSentimentLabel(value: number) {
  if (value >= 75) return { label: '极度贪婪', color: '#16A34A', icon: <SmileOutlined />, bg: '#F0FDF4' };
  if (value >= 55) return { label: '贪婪', color: '#52c41a', icon: <SmileOutlined />, bg: '#F6FFED' };
  if (value >= 45) return { label: '中性', color: '#1677FF', icon: <MehOutlined />, bg: '#E6F4FF' };
  if (value >= 25) return { label: '恐惧', color: '#FA8C16', icon: <FrownOutlined />, bg: '#FFF7E6' };
  return { label: '极度恐惧', color: '#DC2626', icon: <FrownOutlined />, bg: '#FFF2F0' };
}

function getTrendTag(trend: string) {
  const map: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
    up: { color: 'green', text: '上升', icon: <RiseOutlined /> },
    down: { color: 'red', text: '下降', icon: <FallOutlined /> },
    stable: { color: 'blue', text: '平稳', icon: <MehOutlined /> },
  };
  const item = map[trend];
  return item ? (
    <Tag color={item.color} icon={item.icon}>
      {item.text}
    </Tag>
  ) : <Tag>{trend}</Tag>;
}

export default function SentimentPage() {
  const sentimentConfig = getSentimentLabel(currentSentiment);
  const fgConfig = getSentimentLabel(fearGreedIndex);

  const columns = [
    {
      title: '数据源',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: '指数值',
      dataIndex: 'indexValue',
      key: 'indexValue',
      width: 100,
      render: (val: number) => {
        const cfg = getSentimentLabel(val);
        return (
          <Text strong style={{ color: cfg.color, fontSize: 15 }}>
            {val}
          </Text>
        );
      },
      sorter: (a: any, b: any) => a.indexValue - b.indexValue,
    },
    {
      title: '趋势',
      dataIndex: 'trend',
      key: 'trend',
      width: 90,
      render: (trend: string) => getTrendTag(trend),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: 150,
    },
    {
      title: '置信度',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 160,
      render: (val: number) => (
        <Progress
          percent={val}
          size="small"
          strokeColor={val >= 85 ? '#16A34A' : val >= 70 ? '#1677FF' : '#FA8C16'}
          format={(percent) => `${percent}%`}
        />
      ),
    },
    {
      title: '数据量',
      dataIndex: 'postsCount',
      key: 'postsCount',
      width: 100,
      render: (val: number) =>
        val > 0 ? (
          <span>
            <MessageOutlined className="mr-1" />
            {(val / 1000).toFixed(1)}K
          </span>
        ) : (
          <span className="text-gray-400">实时</span>
        ),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 标题区 */}
        <div>
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            style={{ color: '#0F1B3D' }}
          >
            <HeartOutlined style={{ color: '#F0B90B' }} />
            市场情绪指数系统
          </h1>
          <p className="text-gray-500 mt-2">
            社交媒体情绪 · 恐慌贪婪指数 · 趋势预测 · AI情绪分析
          </p>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="当前情绪指数"
              value={currentSentiment}
              suffix="/100"
              icon={<FireOutlined />}
              color="#1677FF"
              description={sentimentConfig.label}
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="恐惧贪婪分"
              value={fearGreedIndex}
              suffix="/100"
              icon={<ThunderboltOutlined />}
              color="#7C3AED"
              description={fgConfig.label}
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="社交热度"
              value="394.5"
              suffix="K"
              icon={<MessageOutlined />}
              color="#F59E0B"
              trend="up"
              trendValue="+12.8%"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="舆情正负面比"
              value={1.85}
              suffix=":1"
              icon={<RiseOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="+0.15"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="预测准确率"
              value={86.2}
              suffix="%"
              icon={<ApiOutlined />}
              color="#06B6D4"
              description="近30日均值"
            />
          </Col>
        </Row>

        {/* 情绪仪表盘 + 数据源列表 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={9}>
            <Card
              title="情绪仪表盘"
              bordered={false}
              style={{ borderRadius: 12 }}
            >
              {/* 主情绪仪表 */}
              <div className="flex justify-center mb-6">
                <div
                  className="rounded-full flex items-center justify-center"
                  style={{
                    width: 200,
                    height: 200,
                    background: `conic-gradient(
                      #DC2626 0deg ${(100 - currentSentiment) * 3.6}deg,
                      #FA8C16 ${(100 - currentSentiment) * 3.6}deg ${(100 - currentSentiment + 10) * 3.6}deg,
                      #1677FF ${(100 - currentSentiment + 10) * 3.6}deg ${(100 - currentSentiment + 20) * 3.6}deg,
                      #16A34A ${(100 - currentSentiment + 20) * 3.6}deg 360deg
                    )`.replace(/currentSentient/g, String(currentSentiment)),
                  }}
                >
                  <div
                    className="rounded-full bg-white flex flex-col items-center justify-center"
                    style={{ width: 160, height: 160 }}
                  >
                    <DashboardOutlined style={{ fontSize: 28, color: sentimentConfig.color }} />
                    <Text
                      strong
                      style={{
                        fontSize: 36,
                        color: sentimentConfig.color,
                        lineHeight: 1.2,
                      }}
                    >
                      {currentSentiment}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      情绪指数
                    </Text>
                  </div>
                </div>
              </div>

              {/* 恐惧贪婪条 */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <Text strong style={{ fontSize: 13 }}>恐惧贪婪指数</Text>
                    <Tag color={fgConfig.color}>{fgConfig.label}</Tag>
                  </div>
                  <Progress
                    percent={fearGreedIndex}
                    strokeColor={{
                      '0%': '#DC2626',
                      '25%': '#FA8C16',
                      '50%': '#1677FF',
                      '75%': '#52c41a',
                      '100%': '#16A34A',
                    }}
                    format={(percent) => (
                      <Text strong style={{ fontSize: 13 }}>{percent}</Text>
                    )}
                  />
                  <div className="flex justify-between mt-1">
                    <Text type="secondary" style={{ fontSize: 11 }}>极度恐惧</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>极度贪婪</Text>
                  </div>
                </div>

                {/* 快速指标 */}
                <Row gutter={[12, 12]} className="mt-4">
                  <Col span={12}>
                    <div
                      className="rounded-lg p-3 text-center"
                      style={{ background: sentimentConfig.bg }}
                    >
                      <div style={{ color: sentimentConfig.color, fontSize: 11 }}>
                        市场情绪
                      </div>
                      <Text strong style={{ color: sentimentConfig.color, fontSize: 16 }}>
                        {sentimentConfig.label}
                      </Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div
                      className="rounded-lg p-3 text-center"
                      style={{ background: fgConfig.bg }}
                    >
                      <div style={{ color: fgConfig.color, fontSize: 11 }}>
                        投资者心理
                      </div>
                      <Text strong style={{ color: fgConfig.color, fontSize: 16 }}>
                        {fgConfig.label}
                      </Text>
                    </div>
                  </Col>
                </Row>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={15}>
            <Card
              bordered={false}
              style={{ borderRadius: 12 }}
            >
              <DataTable
                columns={columns}
                dataSource={mockSources}
                rowKey="id"
                title="多源情绪数据监控"
                searchPlaceholder="搜索数据源..."
                showAdd={false}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 个数据源`,
                }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </AdminLayout>
  );
}
