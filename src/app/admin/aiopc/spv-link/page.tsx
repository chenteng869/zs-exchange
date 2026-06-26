'use client';

import React from 'react';
import { Card, Typography, Tag, Row, Col, Space, Button, Progress, Modal, Descriptions, Divider, Tooltip } from 'antd';
import {
  LinkOutlined,
  SafetyCertificateOutlined,
  DollarOutlined,
  PercentageOutlined,
  AuditOutlined,
  EyeOutlined,
  EditOutlined,
  FileProtectOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  SyncOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

// Mock数据 - SPV列表
const spvData = [
  { id: 'SPV-001', name: '萨摩亚数字资产SPV-I', type: 'Tokenization', createDate: '2024-01-20', assetScale: '¥5.2亿', yieldRate: 18.5, status: 'active', enterprise: '萨摩亚数字资产控股' },
  { id: 'SPV-002', name: '链上科技IPO载体', type: 'IPO', createDate: '2024-02-15', assetScale: '¥8.6亿', yieldRate: 22.3, status: 'active', enterprise: '链上科技(新加坡)' },
  { id: 'SPV-003', name: 'AIOPC审计隔离池', type: 'RTO', createDate: '2024-03-08', assetScale: '¥2.1亿', yieldRate: 15.8, status: 'active', enterprise: 'AIOPC智能合约实验室' },
  { id: 'SPV-004', name: '跨境支付通道SPV', type: 'Tokenization', createDate: '2024-04-12', assetScale: '¥12.3亿', yieldRate: 12.6, status: 'pending', enterprise: '中萨跨境支付中心' },
  { id: 'SPV-005', name: 'Web3孵化器基金SPV', type: 'RTO', createDate: '2024-02-28', assetScale: '¥3.8亿', yieldRate: 25.1, status: 'active', enterprise: 'Web3孵化器亚太总部' },
  { id: 'SPV-006', name: '代币经济研究载体', type: 'Tokenization', createDate: '2024-05-20', assetScale: '¥0.9亿', yieldRate: 10.2, status: 'audit', enterprise: '代币经济研究院' },
  { id: 'SPV-007', name: '合规托管隔离实体', type: 'RTO', createDate: '2024-03-30', assetScale: '¥7.5亿', yieldRate: 16.9, status: 'active', enterprise: '合规托管服务公司' },
  { id: 'SPV-008', name: 'DCF估值模型载体', type: 'IPO', createDate: '2024-06-05', assetScale: '¥1.5亿', yieldRate: 19.4, status: 'pending', enterprise: 'DCF估值模型中心' },
  { id: 'SPV-009', name: '链上数据资产SPV', type: 'Tokenization', createDate: '2024-04-18', assetScale: '¥4.2亿', yieldRate: 21.7, status: 'active', enterprise: '链上数据分析平台' },
  { id: 'SPV-010', name: '税务优化架构载体', type: 'RTO', createDate: '2024-07-10', assetScale: '¥6.8亿', yieldRate: 14.3, status: 'audit', enterprise: '税务优化咨询集团' },
];

export default function AiopcSpvLinkPage() {
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [selectedSpv, setSelectedSpv] = React.useState<any>(null);

  const handleViewDetail = (record: any) => {
    setSelectedSpv(record);
    setDetailModalOpen(true);
  };

  const getTypeTag = (type: string) => {
    const map: Record<string, { color: string; text: string }> = {
      IPO: { color: '#F0B90B', text: 'IPO' },
      RTO: { color: '#1677FF', text: 'RTO' },
      Tokenization: { color: '#16A34A', text: 'Tokenization' },
    };
    const item = map[type] || { color: 'default', text: type };
    return <Tag color={item.color}>{item.text}</Tag>;
  };

  const getStatusTag = (status: string) => {
    const map: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
      active: { color: 'success', icon: <CheckCircleOutlined />, text: '运行中' },
      pending: { color: 'warning', icon: <ClockCircleOutlined />, text: '待激活' },
      audit: { color: 'processing', icon: <AuditOutlined />, text: '审计中' },
    };
    const item = map[status] || { color: 'default', icon: null, text: status };
    return <Tag color={item.color} icon={item.icon}>{item.text}</Tag>;
  };

  const getYieldColor = (rate: number) => {
    if (rate >= 20) return '#16A34A';
    if (rate >= 15) return '#F0B90B';
    return '#1677FF';
  };

  const actions: any[] = [
    {
      key: 'view',
      label: '查看详情',
      icon: <EyeOutlined />,
      type: 'link' as const,
      onClick: handleViewDetail,
    },
    {
      key: 'edit',
      label: '编辑配置',
      icon: <EditOutlined />,
      type: 'link' as const,
      onClick: (record: any) => console.log('编辑SPV:', record.name),
    },
  ];

  const columns = [
    {
      title: 'SPV名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <FileProtectOutlined style={{ color: '#1677FF' }} />
          <Text strong style={{ color: '#0F1B3D' }}>{text}</Text>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => getTypeTag(type),
      filters: [
        { text: 'IPO', value: 'IPO' },
        { text: 'RTO', value: 'RTO' },
        { text: 'Tokenization', value: 'Tokenization' },
      ],
      onFilter: (value: any, record: any) => record.type === value,
    },
    {
      title: '创建日期',
      dataIndex: 'createDate',
      key: 'createDate',
      sorter: (a: any, b: any) => a.createDate.localeCompare(b.createDate),
    },
    {
      title: '资产规模',
      dataIndex: 'assetScale',
      key: 'assetScale',
      render: (text: string) => <Text strong>{text}</Text>,
      sorter: (a: any, b: any) =>
        parseFloat(a.assetScale.replace(/[^0-9.]/g, '')) -
        parseFloat(b.assetScale.replace(/[^0-9.]/g, '')),
    },
    {
      title: '收益率',
      dataIndex: 'yieldRate',
      key: 'yieldRate',
      render: (rate: number) => (
        <div style={{ minWidth: 120 }}>
          <Progress
            percent={Math.min(rate * 3, 100)}
            size="small"
            strokeColor={getYieldColor(rate)}
            format={() => (
              <span style={{ fontWeight: 600, color: getYieldColor(rate), fontSize: 13 }}>
                {rate}%
              </span>
            )}
          />
        </div>
      ),
      sorter: (a: any, b: any) => a.yieldRate - b.yieldRate,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '关联企业',
      dataIndex: 'enterprise',
      key: 'enterprise',
      render: (text: string) => (
        <Tooltip title={text}>
          <Text ellipsis style={{ maxWidth: 150 }}>{text}</Text>
        </Tooltip>
      ),
    },
  ];

  // 计算汇总数据
  const totalAssets = spvData.reduce((sum, s) => sum + parseFloat(s.assetScale.replace(/[^0-9.]/g, '')), 0);
  const avgYield = (spvData.reduce((sum, s) => sum + s.yieldRate, 0) / spvData.length).toFixed(1);
  const passRate = ((spvData.filter(s => s.status === 'active').length / spvData.length) * 100).toFixed(0);

  return (
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
          <LinkOutlined style={{ fontSize: 32, color: '#F0B90B' }} />
          <div>
            <Title level={2} style={{ color: '#fff', margin: 0, marginBottom: 4 }}>
              SPV架构链接中心
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
              特殊目的载体(SPV)全生命周期管理 · 资产隔离 · 风险隔离
            </Text>
          </div>
        </Space>
        <div style={{ marginTop: 16 }}>
          <Tag color="#F0B90B" style={{ border: 'none', color: '#0F1B3D', fontWeight: 600 }}>资产隔离</Tag>
          <Tag style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.8)' }}>风险阻断</Tag>
          <Tag style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.8)' }}>税务优化</Tag>
          <Tag style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.8)' }}>合规托管</Tag>
        </div>
      </div>

      {/* 数据统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="活跃SPV"
            value={spvData.filter(s => s.status === 'active').length}
            suffix={`/ ${spvData.length}`}
            icon={<SafetyCertificateOutlined />}
            color="#F0B90B"
            trend="up"
            trendValue="+2"
            description="运行中载体"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="总资产规模"
            value={totalAssets.toFixed(1)}
            suffix="亿"
            prefix="¥"
            icon={<DollarOutlined />}
            color="#1677FF"
            trend="up"
            trendValue="+18%"
            description="隔离资产总值"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="平均收益率"
            value={avgYield}
            suffix="%"
            icon={<PercentageOutlined />}
            color="#16A34A"
            trend="up"
            trendValue="+1.2%"
            description="年化收益率均值"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="合规审计通过率"
            value={passRate}
            suffix="%"
            icon={<AuditOutlined />}
            color="#7C3AED"
            trend="none"
            description="审计合格比例"
          />
        </Col>
      </Row>

      {/* SPV列表 */}
      <DataTable
        title="SPV载体列表"
        columns={columns}
        dataSource={spvData}
        actions={actions}
        rowKey="id"
        searchPlaceholder="搜索SPV名称/企业..."
        showAdd={true}
        addButtonText="新建SPV"
        onAdd={() => console.log('新建SPV')}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 个SPV`,
        }}
      />

      {/* SPV详情弹窗 */}
      <Modal
        title={
          <Space>
            <BankOutlined style={{ color: '#F0B90B' }} />
            <span>SPV详情 - {selectedSpv?.name}</span>
          </Space>
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>
            关闭
          </Button>,
          <Button key="sync" icon={<SyncOutlined />} onClick={() => {}}>
            同步状态
          </Button>,
          <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => {}}>
            编辑配置
          </Button>,
        ]}
        width={720}
      >
        {selectedSpv && (
          <>
            <Descriptions bordered column={2} size="middle">
              <Descriptions.Item label="SPV ID">{selectedSpv.id}</Descriptions.Item>
              <Descriptions.Item label="SPV名称">{selectedSpv.name}</Descriptions.Item>
              <Descriptions.Item label="载体类型">{getTypeTag(selectedSpv.type)}</Descriptions.Item>
              <Descriptions.Item label="创建日期">{selectedSpv.createDate}</Descriptions.Item>
              <Descriptions.Item label="资产规模">
                <Text strong style={{ fontSize: 16 }}>{selectedSpv.assetScale}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="当前收益率">
                <span style={{ fontWeight: 600, color: getYieldColor(selectedSpv.yieldRate), fontSize: 18 }}>
                  {selectedSpv.yieldRate}%
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="运营状态">{getStatusTag(selectedSpv.status)}</Descriptions.Item>
              <Descriptions.Item label="关联企业">{selectedSpv.enterprise}</Descriptions.Item>
            </Descriptions>

            <Divider>收益与风险分析</Divider>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Text type="secondary">预期年化收益</Text>
                  <div style={{ fontSize: 22, fontWeight: 700, color: getYieldColor(selectedSpv.yieldRate), marginTop: 4 }}>
                    {selectedSpv.yieldRate}%
                  </div>
                  <Progress percent={Math.min(selectedSpv.yieldRate * 4, 100)} showInfo={false} strokeColor={getYieldColor(selectedSpv.yieldRate)} size="small" />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Text type="secondary">风险等级</Text>
                  <div style={{ fontSize: 22, fontWeight: 700, color: selectedSpv.yieldRate > 20 ? '#DC2626' : selectedSpv.yieldRate > 15 ? '#F59E0B' : '#16A34A', marginTop: 4 }}>
                    {selectedSpv.yieldRate > 20 ? '中高' : selectedSpv.yieldRate > 15 ? '中等' : '低'}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>基于波动率评估</Text>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Text type="secondary">资产隔离度</Text>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#1677FF', marginTop: 4 }}>
                    100%
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>完全独立法人</Text>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Modal>
    </div>
  );
}
