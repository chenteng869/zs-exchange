'use client';

import React from 'react';
import { Card, Typography, Tag, Row, Col, Space, Button, Badge, message, Statistic, Tooltip } from 'antd';
import {
  ToolOutlined,
  SafetyCertificateOutlined,
  StarOutlined,
  CalculatorOutlined,
  AlertOutlined,
  LineChartOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  PlayCircleOutlined,
  ApiOutlined,
  LockOutlined,
  FileSearchOutlined,
  AuditOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';

const { Title, Text } = Typography;

// 工具数据
const toolList = [
  {
    key: 'audit',
    name: '合约审计器',
    icon: <SafetyCertificateOutlined />,
    description: '基于形式化验证的智能合约安全审计，支持Solidity/Vyper多语言检测，覆盖重入攻击、整数溢出等50+漏洞类型',
    calls: 12847,
    status: 'online' as const,
    color: '#F0B90B',
    category: '安全审计',
  },
  {
    key: 'token-score',
    name: '代币评分',
    icon: <StarOutlined />,
    description: 'AI驱动的代币经济健康度评估，从分配机制、流动性、持币集中度、解锁周期等多维度综合打分',
    calls: 8562,
    status: 'online' as const,
    color: '#1677FF',
    category: '估值分析',
  },
  {
    key: 'dcf-valuation',
    name: 'DCF估值模型',
    icon: <CalculatorOutlined />,
    description: '现金流折现估值引擎，结合链上收入预测与代币经济学参数，输出公允价值区间及敏感性分析报告',
    calls: 6234,
    status: 'online' as const,
    color: '#16A34A',
    category: '估值分析',
  },
  {
    key: 'onchain-analysis',
    name: '链上分析',
    icon: <LineChartOutlined />,
    description: '多链数据聚合分析平台，实时追踪鲸鱼动向、DEX交易深度、DeFi协议TVL变化趋势',
    calls: 15678,
    status: 'online' as const,
    color: '#7C3AED',
    category: '数据分析',
  },
  {
    key: 'risk-assessment',
    name: '风险评估',
    icon: <AlertOutlined />,
    description: '项目风险量化评级系统，涵盖市场风险、技术风险、合规风险、流动性风险四大维度矩阵评估',
    calls: 9845,
    status: 'online' as const,
    color: '#DC2626',
    category: '风险管理',
  },
  {
    key: 'compliance-check',
    name: '合规检查',
    icon: <AuditOutlined />,
    description: '全球法域合规扫描工具，自动对照SEC/MAS/FCA等监管框架，生成合规差距分析与整改建议',
    calls: 4521,
    status: 'maintenance' as const,
    color: '#F59E0B',
    category: '合规服务',
  },
  {
    key: 'economy-sim',
    name: '经济模拟',
    icon: <ExperimentOutlined />,
    description: '代币经济系统蒙特卡洛模拟器，测试不同通胀率、销毁机制、质押奖励下的长期代币价格走势',
    calls: 3890,
    status: 'online' as const,
    color: '#0891B2',
    category: '建模仿真',
  },
  {
    key: 'market-intel',
    name: '市场情报',
    icon: <LineChartOutlined />,
    description: 'AI情报聚合系统，实时抓取社交媒体情绪、项目方动态、机构持仓变动，生成可操作的市场信号',
    calls: 11234,
    status: 'online' as const,
    color: '#EC4899',
    category: '情报分析',
  },
  {
    key: 'ai-diagnosis',
    name: 'AI诊断',
    icon: <RobotOutlined />,
    description: '大语言模型驱动的项目健康诊断，输入项目白皮书或合约地址，自动生成结构化诊断报告与改进建议',
    calls: 7568,
    status: 'online' as const,
    color: '#6366F1',
    category: 'AI智能',
  },
];

export default function AiopcToolsPage() {
  const handleUseTool = (tool: typeof toolList[0]) => {
    if (tool.status === 'maintenance') {
      message.warning(`${tool.name} 正在维护中，请稍后再试`);
      return;
    }
    message.success(`正在启动 ${tool.name}...`);
  };

  const getStatusTag = (status: string) => {
    if (status === 'online') {
      return (
        <Badge status="success" text={
          <span style={{ color: '#16A34A', fontWeight: 500 }}>运行中</span>
        } />
      );
    }
    if (status === 'maintenance') {
      return (
        <Badge status="warning" text={
          <span style={{ color: '#F59E0B', fontWeight: 500 }}>维护中</span>
        } />
      );
    }
    return <Badge status="default" text="离线" />;
  };

  const getCategoryTag = (category: string) => {
    const colors: Record<string, string> = {
      '安全审计': '#F0B90B',
      '估值分析': '#1677FF',
      '数据分析': '#7C3AED',
      '风险管理': '#DC2626',
      '合规服务': '#F59E0B',
      '建模仿真': '#0891B2',
      '情报分析': '#EC4899',
      'AI智能': '#6366F1',
    };
    return <Tag color={colors[category] || 'default'}>{category}</Tag>;
  };

  // 统计各状态数量
  const onlineCount = toolList.filter(t => t.status === 'online').length;
  const maintenanceCount = toolList.filter(t => t.status === 'maintenance').length;
  const totalCalls = toolList.reduce((sum, t) => sum + t.calls, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题区 */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0F1B3D 0%, #1a2d5c 100%)',
            borderRadius: 16,
            padding: '32px 40px',
            color: '#fff',
          }}
        >
          <Space align="center">
            <ToolOutlined style={{ fontSize: 32, color: '#F0B90B' }} />
            <div>
              <Title level={2} style={{ color: '#fff', margin: 0, marginBottom: 4 }}>
                AIOPC工具服务中心
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                智能合约审计 · 代币经济设计 · DCF估值模型 · 链上数据分析
              </Text>
            </div>
          </Space>
          <div style={{ marginTop: 16 }}>
            <Row gutter={[12, 8]}>
              <Col>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>工具总数</span>}
                  value={toolList.length}
                  suffix="个"
                  valueStyle={{ color: '#F0B90B', fontSize: 20 }}
                />
              </Col>
              <Col>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>在线运行</span>}
                  value={onlineCount}
                  suffix="个"
                  valueStyle={{ color: '#16A34A', fontSize: 20 }}
                />
              </Col>
              <Col>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>累计调用</span>}
                  value={totalCalls}
                  suffix="次"
                  valueStyle={{ color: '#fff', fontSize: 20 }}
                />
              </Col>
              <Col>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>维护中</span>}
                  value={maintenanceCount}
                  suffix="个"
                  valueStyle={{ color: '#F59E0B', fontSize: 20 }}
                />
              </Col>
            </Row>
          </div>
        </div>

        {/* 工具卡片网格 - 3列布局 */}
        <Row gutter={[16, 16]}>
          {toolList.map((tool) => (
            <Col xs={24} sm={12} lg={8} key={tool.key}>
              <Card
                hoverable
                style={{
                  borderRadius: 12,
                  borderLeft: `4px solid ${tool.color}`,
                  height: '100%',
                }}
                actions={[
                  <Button
                    key="use"
                    type="primary"
                    size="small"
                    icon={<PlayCircleOutlined />}
                    disabled={tool.status === 'maintenance'}
                    onClick={() => handleUseTool(tool)}
                    style={{ marginRight: 8 }}
                  >
                    立即使用
                  </Button>,
                  <Tooltip key="doc-tip" title="查看文档">
                    <Button key="doc" size="small" icon={<FileSearchOutlined />} type="text" />
                  </Tooltip>,
                  <Tooltip key="api-tip" title="API接入">
                    <Button key="api" size="small" icon={<ApiOutlined />} type="text" />
                  </Tooltip>,
                ]}
              >
                {/* 卡片头部：图标 + 名称 + 状态 */}
                <div style={{ marginBottom: 16 }}>
                  <Space align="start">
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: `${tool.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        color: tool.color,
                        flexShrink: 0,
                      }}
                    >
                      {tool.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <Space align="center" size={8}>
                        <Text strong style={{ fontSize: 16, color: '#0F1B3D' }}>
                          {tool.name}
                        </Text>
                        {getStatusTag(tool.status)}
                      </Space>
                      <div style={{ marginTop: 4 }}>{getCategoryTag(tool.category)}</div>
                    </div>
                  </Space>
                </div>

                {/* 工具描述 */}
                <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.8, display: 'block', marginBottom: 16 }}>
                  {tool.description}
                </Text>

                {/* 调用统计 */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 12,
                    borderTop: '1px solid #F0F0F0',
                  }}
                >
                  <Space size={4}>
                    <ThunderboltOutlined style={{ color: tool.color }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>累计调用</Text>
                  </Space>
                  <Text strong style={{ color: tool.color, fontSize: 15 }}>
                    {tool.calls.toLocaleString()}
                    <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>次</Text>
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* 底部说明卡片 */}
        <Card
          style={{
            borderRadius: 12,
            background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
            borderColor: '#FDE68A',
          }}
        >
          <Space align="start" size="large">
            <LockOutlined style={{ fontSize: 28, color: '#F0B90B' }} />
            <div>
              <Title level={5} style={{ margin: 0, color: '#92400E' }}>
                安全提示
              </Title>
              <Text style={{ color: '#A16207', fontSize: 13, lineHeight: 1.8 }}>
                所有AIOPC工具均运行于隔离沙箱环境中，数据处理遵循零信任原则。
                合约审计结果仅供参考，不构成投资建议。敏感操作需二次确认，
                所有调用日志均上链存证。企业级用户可申请私有化部署方案。
              </Text>
            </div>
          </Space>
        </Card>
      </div>
    </AdminLayout>
  );
}
