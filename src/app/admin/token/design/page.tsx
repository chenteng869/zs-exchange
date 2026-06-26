'use client';

import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Slider,
  InputNumber,
  Typography,
  Tag,
  Button,
  Space,
  Divider,
  message,
  Statistic,
} from 'antd';
import {
  PieChartOutlined,
  UnlockOutlined,
  FireOutlined,
  BankOutlined,
  ThunderboltOutlined,
  AppstoreOutlined,
  SaveOutlined,
  ReloadOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';

const { Title, Text } = Typography;

interface EconParam {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  fields: {
    name: string;
    label: string;
    type: 'slider' | 'number';
    min: number;
    max: number;
    step: number;
    unit: string;
    defaultValue: number;
  }[];
}

const econDimensions: EconParam[] = [
  {
    key: 'allocation',
    label: '分配机制',
    description: '代币初始分配比例设计，决定各方利益格局',
    icon: <PieChartOutlined />,
    color: '#1677FF',
    fields: [
      { name: 'teamAlloc', label: '团队分配', type: 'slider', min: 0, max: 30, step: 1, unit: '%', defaultValue: 15 },
      { name: 'investorAlloc', label: '投资者分配', type: 'slider', min: 10, max: 50, step: 1, unit: '%', defaultValue: 25 },
      { name: 'communityAlloc', label: '社区分配', type: 'slider', min: 20, max: 60, step: 1, unit: '%', defaultValue: 40 },
      { name: 'reserveAlloc', label: '储备金池', type: 'slider', min: 5, max: 20, step: 1, unit: '%', defaultValue: 10 },
      { name: 'ecosystemAlloc', label: '生态激励', type: 'slider', min: 5, max: 25, step: 1, unit: '%', defaultValue: 10 },
    ],
  },
  {
    key: 'vesting',
    label: '解锁计划',
    description: '代币线性/阶梯释放时间表配置',
    icon: <UnlockOutlined />,
    color: '#16A34A',
    fields: [
      { name: 'cliffPeriod', label: '锁仓期(月)', type: 'number', min: 0, max: 36, step: 1, unit: '月', defaultValue: 6 },
      { name: 'vestingDuration', label: '总解锁期(月)', type: 'number', min: 12, max: 60, step: 6, unit: '月', defaultValue: 24 },
      { name: 'teamVesting', label: '团队解锁比例/季', type: 'slider', min: 1, max: 10, step: 0.5, unit: '%', defaultValue: 3.125 },
      { name: 'investorVesting', label: '投资者解锁比例/季', type: 'slider', min: 5, max: 20, step: 1, unit: '%', defaultValue: 10 },
    ],
  },
  {
    key: 'deflation',
    label: '通缩模型',
    description: '代币销毁与通缩机制参数',
    icon: <FireOutlined />,
    color: '#DC2626',
    fields: [
      { name: 'burnRate', label: '交易手续费销毁比例', type: 'slider', min: 0, max: 50, step: 1, unit: '%', defaultValue: 10 },
      { name: 'buybackRatio', label: '回购销毁比例', type: 'slider', min: 0, max: 30, step: 1, unit: '%', defaultValue: 5 },
      { name: 'deflationTarget', label: '年度通缩目标', type: 'slider', min: 0, max: 15, step: 0.5, unit: '%', defaultValue: 3 },
      { name: 'halvingCycle', label: '减半周期(块)', type: 'number', min: 100000, max: 10000000, step: 100000, unit: 'blocks', defaultValue: 2100000 },
    ],
  },
  {
    key: 'staking',
    label: '质押收益',
    description: '质押APY及奖励分配规则',
    icon: <BankOutlined />,
    color: '#F0B90B',
    fields: [
      { name: 'baseAPY', label: '基础质押年化', type: 'slider', min: 1, max: 30, step: 0.5, unit: '%', defaultValue: 8 },
      { name: 'bonusAPY', label: '长期质押加成', type: 'slider', min: 0, max: 15, step: 0.5, unit: '%', defaultValue: 4 },
      { name: 'minStakeAmount', label: '最低质押量', type: 'number', min: 100, max: 100000, step: 100, unit: 'tokens', defaultValue: 1000 },
      { name: 'lockPeriodBonus', label: '锁定12月加成', type: 'slider', min: 0, max: 10, step: 0.5, unit: '%', defaultValue: 3 },
    ],
  },
  {
    key: 'governance',
    label: '治理权重',
    description: 'DAO治理投票权与提案门槛',
    icon: <ThunderboltOutlined />,
    color: '#7C3AED',
    fields: [
      { name: 'proposalThreshold', label: '提案最低持有量', type: 'number', min: 1000, max: 1000000, step: 1000, unit: 'tokens', defaultValue: 50000 },
      { name: 'voteWeight', label: '单Token投票权重', type: 'slider', min: 0.1, max: 5, step: 0.1, unit: 'x', defaultValue: 1 },
      { name: 'quorumReq', label: '法定人数要求', type: 'slider', min: 10, max: 60, step: 1, unit: '%', defaultValue: 33 },
      { name: 'executionDelay', label: '执行延迟(天)', type: 'number', min: 1, max: 14, step: 1, unit: '天', defaultValue: 3 },
    ],
  },
  {
    key: 'usecases',
    label: '用例场景',
    description: '代币在生态系统中的使用场景权重',
    icon: <AppstoreOutlined />,
    color: '#F59E0B',
    fields: [
      { name: 'tradingDiscount', label: '交易手续费折扣', type: 'slider', min: 0, max: 50, step: 1, unit: '%', defaultValue: 20 },
      { name: 'governanceVote', label: '治理投票消耗', type: 'slider', min: 0, max: 10, step: 0.5, unit: 'tokens', defaultValue: 1 },
      { name: 'premiumAccess', label: '高级功能准入', type: 'slider', min: 100, max: 10000, step: 100, unit: 'tokens', defaultValue: 1000 },
      { name: 'rewardMultiplier', label: '奖励乘数系数', type: 'slider', min: 1, max: 5, step: 0.1, unit: 'x', defaultValue: 1.5 },
    ],
  },
];

export default function TokenDesignPage() {
  const [formValues, setFormValues] = useState<Record<string, number>>({});

  const handleFieldChange = (fieldName: string, value: number) => {
    setFormValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSave = () => {
    message.success('经济模型参数已保存！');
  };

  const handleReset = () => {
    setFormValues({});
    message.info('已重置为默认值');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <Title level={2} className="m-0 flex items-center gap-3">
              <ExperimentOutlined style={{ color: '#F0B90B' }} />
              代币经济模型设计台
            </Title>
            <Text type="secondary" className="mt-2 block">
              可视化配置代币经济的六大核心维度 · 实时预览参数影响
            </Text>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>保存方案</Button>
          </Space>
        </div>

        {/* 经济参数 Card 网格 - 6大维度 */}
        <Row gutter={[16, 16]}>
          {econDimensions.map((dim) => (
            <Col xs={24} lg={12} key={dim.key}>
              <Card
                title={
                  <Space>
                    <span style={{ color: dim.color, fontSize: 18 }}>{dim.icon}</span>
                    <span className="font-semibold">{dim.label}</span>
                    <Tag color={dim.color}>{dim.fields.length}项参数</Tag>
                  </Space>
                }
                extra={<Text type="secondary" style={{ fontSize: 12 }}>{dim.description}</Text>}
                bordered
                style={{ borderRadius: 12 }}
              >
                <div className="space-y-5">
                  {dim.fields.map((field) => {
                    const currentValue = formValues[field.name] ?? field.defaultValue;
                    return (
                      <div key={field.name}>
                        <div className="flex items-center justify-between mb-2">
                          <Text strong>{field.label}</Text>
                          <Space>
                            {field.type === 'slider' ? (
                              <>
                                <Slider
                                  style={{ width: 200 }}
                                  min={field.min}
                                  max={field.max}
                                  step={field.step}
                                  value={currentValue}
                                  onChange={(v) => handleFieldChange(field.name, v as number)}
                                />
                                <InputNumber
                                  size="small"
                                  min={field.min}
                                  max={field.max}
                                  step={field.step}
                                  value={currentValue}
                                  onChange={(v) => v !== null && handleFieldChange(field.name, v)}
                                  style={{ width: 85 }}
                                  addonAfter={field.unit}
                                />
                              </>
                            ) : (
                              <InputNumber
                                min={field.min}
                                max={field.max}
                                step={field.step}
                                value={currentValue}
                                onChange={(v) => v !== null && handleFieldChange(field.name, v)}
                                addonAfter={field.unit}
                              />
                            )}
                          </Space>
                        </div>
                        <Divider style={{ margin: '4px 0' }} />
                      </div>
                    );
                  })}
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* 模型摘要卡片 */}
        <Card title="经济模型摘要" className="mt-4">
          <Row gutter={[24, 16]}>
            <Col xs={12} sm={8} md={4}>
              <Statistic title="总供应量" value="1,000,000,000" suffix="AIOPC" valueStyle={{ color: '#1677FF', fontSize: 18 }} />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic title="流通率" value={28.5} suffix="%" valueStyle={{ color: '#16A34A', fontSize: 18 }} />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic title="年化通胀" value="-3.0" suffix="%" prefix={'<'} valueStyle={{ color: '#DC2626', fontSize: 18 }} />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic title="质押APY" value={12} suffix="%" valueStyle={{ color: '#F0B90B', fontSize: 18 }} />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic title="治理参与率" value={34.7} suffix="%" valueStyle={{ color: '#7C3AED', fontSize: 18 }} />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic title="用例覆盖度" value={6} suffix="/6" valueStyle={{ color: '#F59E0B', fontSize: 18 }} />
            </Col>
          </Row>
        </Card>
      </div>
    </AdminLayout>
  );
}
