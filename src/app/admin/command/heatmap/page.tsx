'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Card, Tag, Button, Space, Row, Col, Typography, Progress,
  Badge, Modal, Descriptions, List, Alert, Table,
} from 'antd';
import {
  WarningOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  EditOutlined,
  ReloadOutlined,
  PlusOutlined,
  EnvironmentOutlined,
  DashboardOutlined,
  AimOutlined,
  FireOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface RiskRegion {
  id: string;
  region: string;
  zone: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  riskScore: number;
  eventCount: number;
  coverageRate: number;
  monitorPoints: number;
  alertCount: number;
  lastIncident: string;
  owner: string;
  description: string;
  mitigationActions: string[];
}

const mockRegions: RiskRegion[] = [
  { id: 'RZ-001', region: '亚太-新加坡', zone: '核心交易区', riskLevel: 'low', riskScore: 15, eventCount: 2, coverageRate: 98.5, monitorPoints: 156, alertCount: 3, lastIncident: '2024-06-01', owner: '张伟', description: '主要交易枢纽，基础设施完善', mitigationActions: ['已完成ISO27001认证', '部署DDoS高防集群'] },
  { id: 'RZ-002', region: '欧洲-法兰克福', zone: 'DeFi协议区', riskLevel: 'medium', riskScore: 42, eventCount: 5, coverageRate: 92.3, monitorPoints: 89, alertCount: 12, lastIncident: '2024-06-05', owner: '李明', description: 'DeFi合约部署区域', mitigationActions: ['升级审计工具链', '增加自动化监控'] },
  { id: 'RZ-003', region: '北美-弗吉尼亚', zone: '数据存储区', riskLevel: 'high', riskScore: 68, eventCount: 9, coverageRate: 85.7, monitorPoints: 124, alertCount: 28, lastIncident: '2024-06-07', owner: '王芳', description: '主数据库和备份节点所在区域', mitigationActions: ['实施数据加密增强', '优化灾备方案'] },
  { id: 'RZ-004', region: '东亚-东京', zone: '用户接入区', riskLevel: 'medium', riskScore: 35, eventCount: 4, coverageRate: 94.1, monitorPoints: 67, alertCount: 8, lastIncident: '2024-06-04', owner: '刘洋', description: '日本及东亚用户主要接入点', mitigationActions: ['增加CDN节点', '启用多线路冗余'] },
  { id: 'RZ-005', region: '中东-迪拜', zone: '合规监管区', riskLevel: 'critical', riskScore: 85, eventCount: 14, coverageRate: 72.5, monitorPoints: 34, alertCount: 45, lastIncident: '2024-06-08', owner: '赵军', description: '新兴市场，合规风险极高', mitigationActions: ['建立本地合规团队', '实时监控政策变化'] },
  { id: 'RZ-006', region: '南美-圣保罗', zone: '法币通道区', riskLevel: 'high', riskScore: 62, eventCount: 7, coverageRate: 78.2, monitorPoints: 45, alertCount: 19, lastIncident: '2024-06-06', owner: '陈辉', description: '拉美法币出入金通道', mitigationActions: ['强化KYC流程', '对接本地支付机构'] },
  { id: 'RZ-007', region: '非洲-约翰内斯堡', zone: '拓展试验区', riskLevel: 'medium', riskScore: 48, eventCount: 6, coverageRate: 65.0, monitorPoints: 22, alertCount: 15, lastIncident: '2024-06-03', owner: '周杰', description: '非洲市场试运营', mitigationActions: ['建设本地节点', '培训当地团队'] },
  { id: 'RZ-008', region: '东南亚-雅加达', zone: '增长爆发区', riskLevel: 'high', riskScore: 58, eventCount: 11, coverageRate: 81.3, monitorPoints: 56, alertCount: 22, lastIncident: '2024-06-07', owner: '孙悦', description: '用户量快速增长区', mitigationActions: ['加强反作弊系统', '升级风控规则引擎'] },
  { id: 'RZ-009', region: '中亚-阿拉木图', zone: '区块链节点区', riskLevel: 'low', riskScore: 22, eventCount: 1, coverageRate: 96.8, monitorPoints: 38, alertCount: 4, lastIncident: '2024-05-20', owner: '吴婷', description: '区块链验证节点部署区', mitigationActions: ['定期硬件巡检', '密钥轮换机制'] },
  { id: 'RZ-010', region: '大洋洲-悉尼', zone: '备份容灾区', riskLevel: 'low', riskScore: 18, eventCount: 2, coverageRate: 99.2, monitorPoints: 42, alertCount: 2, lastIncident: '2024-05-28', owner: '郑浩', description: '全球灾备中心', mitigationActions: ['季度灾难演练', '数据一致性校验'] },
];

export default function HeatmapPage() {
  const [selectedRegion, setSelectedRegion] = useState<RiskRegion | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const highRiskCount = mockRegions.filter(function(r) { return r.riskLevel === 'critical' || r.riskLevel === 'high'; }).length;
  const mediumRiskCount = mockRegions.filter(function(r) { return r.riskLevel === 'medium'; }).length;
  const totalMonitorPoints = mockRegions.reduce(function(sum, r) { return sum + r.monitorPoints; }, 0);
  const totalAlerts = mockRegions.reduce(function(sum, r) { return sum + r.alertCount; }, 0);
  const avgCoverage = (mockRegions.reduce(function(sum, r) { return sum + r.coverageRate; }, 0) / mockRegions.length).toFixed(1);

  const getRiskTag = function(level: string) {
    if (level === 'critical') return <Tag color="red">极高风险</Tag>;
    if (level === 'high') return <Tag color="orange">高风险</Tag>;
    if (level === 'medium') return <Tag color="gold">中风险</Tag>;
    if (level === 'low') return <Tag color="green">低风险</Tag>;
    return <Tag>{level}</Tag>;
  };

  const getRiskColor = function(level: string): string {
    if (level === 'critical') return '#DC2626';
    if (level === 'high') return '#F59E0B';
    if (level === 'medium') return '#EAB308';
    if (level === 'low') return '#16A34A';
    return '#9CA3AF';
  };

  const handleView = function(record: RiskRegion) {
    setSelectedRegion(record);
    setDetailModalVisible(true);
  };

  const columns = [
    {
      title: '区域ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: function(id: string) { return <Text code className="text-xs">{id}</Text>; },
    },
    {
      title: '区域名称',
      key: 'region',
      width: 160,
      render: function(_: any, r: RiskRegion) {
        return (
          <div>
            <div className="font-medium flex items-center gap-2">
              <EnvironmentOutlined style={{ color: getRiskColor(r.riskLevel) }} />
              {r.region}
            </div>
            <div className="text-xs text-gray-400">{r.zone}</div>
          </div>
        );
      },
    },
    {
      title: '风险等级',
      key: 'riskLevel',
      width: 110,
      render: function(_: any, r: RiskRegion) { return getRiskTag(r.riskLevel); },
    },
    {
      title: '风险评分',
      dataIndex: 'riskScore',
      key: 'riskScore',
      width: 120,
      render: function(s: number, r: RiskRegion) {
        return (
          <div className="flex items-center gap-2">
            <Progress percent={s} size="small" strokeColor={getRiskColor(r.riskLevel)} className="flex-1" showInfo={false} />
            <span className="font-bold" style={{ color: getRiskColor(r.riskLevel) }}>{s}</span>
          </div>
        );
      },
    },
    {
      title: '事件数',
      dataIndex: 'eventCount',
      key: 'eventCount',
      width: 80,
      render: function(n: number) {
        var bgColor = n > 10 ? '#DC2626' : n > 5 ? '#F59E0B' : '#1677FF';
        return <Badge count={n} style={{ backgroundColor: bgColor }} />;
      },
    },
    {
      title: '监测点',
      dataIndex: 'monitorPoints',
      key: 'monitorPoints',
      width: 90,
      render: function(n: number) { return <span className="font-mono">{n}</span>; },
    },
    {
      title: '覆盖率',
      dataIndex: 'coverageRate',
      key: 'coverageRate',
      width: 110,
      render: function(rate: number) {
        var strokeColor = rate >= 95 ? '#16A34A' : rate >= 80 ? '#1677FF' : '#F59E0B';
        return <Progress percent={rate} size="small" format={function() { return rate + '%'; }} strokeColor={strokeColor} />;
      },
    },
    {
      title: '告警数',
      dataIndex: 'alertCount',
      key: 'alertCount',
      width: 80,
      render: function(n: number) {
        var color = n > 20 ? 'red' : n > 10 ? 'orange' : 'blue';
        return <Tag color={color}>{n}</Tag>;
      },
    },
    {
      title: '负责人',
      dataIndex: 'owner',
      key: 'owner',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: function(_: any, record: RiskRegion) {
        return (
          <Space size="small">
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={function() { handleView(record); }}>详情</Button>
            <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
          </Space>
        );
      },
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页头 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 m-0">
              <FireOutlined style={{ color: '#F59E0B' }} />
              风险热力图
            </h1>
            <p className="text-gray-500 mt-1 mb-0">区域风险热力分布 · 风险集中度分析 · 实时监测预警</p>
          </div>
          <Space>
            <Button type="primary" icon={<PlusOutlined />}>添加监测区域</Button>
            <Button icon={<ReloadOutlined />}>刷新</Button>
            <Button icon={<GlobalOutlined />}>全球视图</Button>
          </Space>
        </div>

        {/* 高风险告警 */}
        {highRiskCount > 0 && (
          <Alert
            message={'检测到 ' + highRiskCount + ' 个高风险区域需要立即关注'}
            type="error"
            showIcon
            icon={<WarningOutlined />}
            action={<Button size="small">查看详情</Button>}
          />
        )}

        {/* 数据卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={5}>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-500 text-sm">高风险区域</div>
                  <div className="text-2xl font-bold" style={{ color: '#DC2626' }}>{highRiskCount}<span className="text-sm font-normal ml-1">个</span></div>
                </div>
                <WarningOutlined style={{ fontSize: 24, color: '#DC2626' }} />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-500 text-sm">中风险区域</div>
                  <div className="text-2xl font-bold" style={{ color: '#F59E0B' }}>{mediumRiskCount}<span className="text-sm font-normal ml-1">个</span></div>
                </div>
                <AimOutlined style={{ fontSize: 24, color: '#F59E0B' }} />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-500 text-sm">监测点总数</div>
                  <div className="text-2xl font-bold" style={{ color: '#1677FF' }}>{totalMonitorPoints}<span className="text-sm font-normal ml-1">个</span></div>
                </div>
                <DashboardOutlined style={{ fontSize: 24, color: '#1677FF' }} />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-500 text-sm">告警数量</div>
                  <div className="text-2xl font-bold" style={{ color: '#F59E0B' }}>{totalAlerts}<span className="text-sm font-normal ml-1">条</span></div>
                </div>
                <FireOutlined style={{ fontSize: 24, color: '#F59E0B' }} />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-500 text-sm">平均覆盖率</div>
                  <div className="text-2xl font-bold" style={{ color: '#16A34A' }}>{avgCoverage}<span className="text-sm font-normal ml-1">%</span></div>
                </div>
                <SafetyCertificateOutlined style={{ fontSize: 24, color: '#16A34A' }} />
              </div>
            </Card>
          </Col>
        </Row>

        {/* 数据表格 */}
        <Card title="区域风险列表">
          <Table
            dataSource={mockRegions}
            columns={columns as any}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1200 }}
          />
        </Card>

        {/* 底部面板 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <span className="flex items-center gap-2">
                  <ThunderboltOutlined style={{ color: '#DC2626' }} />
                  风险等级分布
                </span>
              }
            >
              <div className="space-y-3">
                {[
                  { l: '极高风险', c: '#DC2626', n: mockRegions.filter(function(r) { return r.riskLevel === 'critical'; }).length },
                  { l: '高风险', c: '#F59E0B', n: mockRegions.filter(function(r) { return r.riskLevel === 'high'; }).length },
                  { l: '中风险', c: '#EAB308', n: mockRegions.filter(function(r) { return r.riskLevel === 'medium'; }).length },
                  { l: '低风险', c: '#16A34A', n: mockRegions.filter(function(r) { return r.riskLevel === 'low'; }).length },
                ].map(function(item) {
                  return (
                    <div key={item.l}>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>{item.l}</span>
                        <span className="font-semibold" style={{ color: item.c }}>{item.n} 个</span>
                      </div>
                      <Progress percent={(item.n / mockRegions.length) * 100} strokeColor={item.c} showInfo={false} />
                    </div>
                  );
                })}
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title={
                <span className="flex items-center gap-2">
                  <CheckCircleOutlined style={{ color: '#16A34A' }} />
                  风控建议
                </span>
              }
            >
              <List
                size="small"
                dataSource={[
                  { t: '中东迪拜区域风险评分达85分，建议立即启动专项风险评估', p: 'error' as const },
                  { t: '北美区域告警数量激增，需排查存储系统异常', p: 'warning' as const },
                  { t: '东南亚区域用户量暴增，需同步扩容风控能力', p: 'info' as const },
                ]}
                renderItem={function(item) {
                  return (
                    <List.Item>
                      <Alert message={item.t} type={item.p} showIcon banner={false} className="mb-0" />
                    </List.Item>
                  );
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* 详情弹窗 */}
        <Modal
          title={'区域风险详情 - ' + (selectedRegion ? selectedRegion.region : '')}
          open={detailModalVisible}
          onCancel={function() { setDetailModalVisible(false); }}
          width={650}
          footer={
            <Space>
              <Button icon={<EditOutlined />}>编辑配置</Button>
              <Button type="primary" icon={<EyeOutlined />}>查看历史</Button>
            </Space>
          }
        >
          {selectedRegion && (
            <div className="space-y-4">
              <Descriptions bordered column={2} size="middle">
                <Descriptions.Item label="区域ID">
                  <Text strong className="text-blue-600">{selectedRegion.id}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="功能分区">{selectedRegion.zone}</Descriptions.Item>
                <Descriptions.Item label="风险等级">{getRiskTag(selectedRegion.riskLevel)}</Descriptions.Item>
                <Descriptions.Item label="风险评分">
                  <span className="text-xl font-bold" style={{ color: getRiskColor(selectedRegion.riskLevel) }}>
                    {selectedRegion.riskScore}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="负责人">{selectedRegion.owner}</Descriptions.Item>
                <Descriptions.Item label="最近事件">{selectedRegion.lastIncident}</Descriptions.Item>
                <Descriptions.Item label="区域描述" span={2}>{selectedRegion.description}</Descriptions.Item>
              </Descriptions>
              <Card size="small" title="缓解措施">
                <List
                  size="small"
                  dataSource={selectedRegion.mitigationActions}
                  renderItem={function(item) {
                    return (
                      <List.Item>
                        <CheckCircleOutlined className="text-green-500 mr-2" />
                        {item}
                      </List.Item>
                    );
                  }}
                />
              </Card>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
