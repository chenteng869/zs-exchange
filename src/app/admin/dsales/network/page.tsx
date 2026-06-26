'use client';

import React, { useState } from 'react';
import { Card, Typography, Tag, Modal, Row, Col, Descriptions, Progress, Avatar, Space } from 'antd';
import {
  ApartmentOutlined,
  TeamOutlined,
  UserAddOutlined,
  DollarOutlined,
  LineChartOutlined,
  EyeOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

interface NodeRecord {
  id: string;
  nodeId: string;
  manager: string;
  level: string;
  referrer: string;
  subordinates: number;
  performance: number;
  joinDate: string;
  status: 'active' | 'inactive' | 'suspended';
}

const mockNodes: NodeRecord[] = [
  { id: '1', nodeId: 'ND-2024-001', manager: '张伟', level: '钻石代理', referrer: '系统推荐', subordinates: 156, performance: 1250000, joinDate: '2024-01-15', status: 'active' },
  { id: '2', nodeId: 'ND-2024-002', manager: '李娜', level: '金牌代理', referrer: 'ND-2024-001', subordinates: 89, performance: 890000, joinDate: '2024-02-20', status: 'active' },
  { id: '3', nodeId: 'ND-2024-003', manager: '王强', level: '银牌代理', referrer: 'ND-2024-001', subordinates: 67, performance: 560000, joinDate: '2024-03-10', status: 'active' },
  { id: '4', nodeId: 'ND-2024-004', manager: '刘芳', level: '铜牌代理', referrer: 'ND-2024-002', subordinates: 45, performance: 340000, joinDate: '2024-03-25', status: 'active' },
  { id: '5', nodeId: 'ND-2024-005', manager: '陈明', level: '普通代理', referrer: 'ND-2024-002', subordinates: 23, performance: 180000, joinDate: '2024-04-05', status: 'active' },
  { id: '6', nodeId: 'ND-2024-006', manager: '杨丽', level: '金牌代理', referrer: '系统推荐', subordinates: 78, performance: 720000, joinDate: '2024-04-18', status: 'active' },
  { id: '7', nodeId: 'ND-2024-007', manager: '赵刚', level: '银牌代理', referrer: 'ND-2024-006', subordinates: 52, performance: 450000, joinDate: '2024-05-02', status: 'inactive' },
  { id: '8', nodeId: 'ND-2024-008', manager: '孙静', level: '铜牌代理', referrer: 'ND-2024-003', subordinates: 34, performance: 280000, joinDate: '2024-05-15', status: 'active' },
  { id: '9', nodeId: 'ND-2024-009', manager: '周涛', level: '普通代理', referrer: 'ND-2024-004', subordinates: 12, performance: 95000, joinDate: '2024-06-01', status: 'suspended' },
  { id: '10', nodeId: 'ND-2024-010', manager: '吴敏', level: '钻石代理', referrer: '系统推荐', subordinates: 134, performance: 1100000, joinDate: '2024-06-10', status: 'active' },
  { id: '11', nodeId: 'ND-2024-011', manager: '郑华', level: '银牌代理', referrer: 'ND-2024-010', subordinates: 58, performance: 480000, joinDate: '2024-06-15', status: 'active' },
  { id: '12', nodeId: 'ND-2024-012', manager: '黄磊', level: '普通代理', referrer: 'ND-2024-006', subordinates: 18, performance: 125000, joinDate: '2024-06-20', status: 'active' },
];

const getStatusTag = (status: string) => {
  const map: Record<string, { color: string; text: string }> = {
    active: { color: 'success', text: '活跃' },
    inactive: { color: 'warning', text: '休眠' },
    suspended: { color: 'error', text: '暂停' },
  };
  const item = map[status] || { color: 'default', text: status };
  return <Tag color={item.color}>{item.text}</Tag>;
};

const getLevelColor = (level: string) => {
  const map: Record<string, string> = {
    '钻石代理': '#F0B90B',
    '金牌代理': '#1677FF',
    '银牌代理': '#7C3AED',
    '铜牌代理': '#16A34A',
    '普通代理': '#6B7280',
  };
  return map[level] || '#1677FF';
};

export default function DsalesNetworkPage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NodeRecord | null>(null);

  const handleViewDetail = (record: NodeRecord) => {
    setSelectedNode(record);
    setDetailModalOpen(true);
  };

  const actions: any[] = [
    {
      key: 'view',
      label: '查看详情',
      icon: <EyeOutlined />,
      type: 'link',
      onClick: handleViewDetail,
      hidden: () => false,
    },
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      type: 'link',
      onClick: (record: NodeRecord) => console.log('编辑节点:', record.nodeId),
      hidden: () => false,
    },
  ];

  const columns = [
    {
      title: '节点ID',
      dataIndex: 'nodeId',
      key: 'nodeId',
      width: 140,
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: '负责人',
      dataIndex: 'manager',
      key: 'manager',
      width: 100,
      render: (text: string) => (
        <Space>
          <Avatar size="small" style={{ background: '#F0B90B' }}>{text[0]}</Avatar>
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 120,
      render: (text: string) => (
        <Tag color={getLevelColor(text)} style={{ fontWeight: 500 }}>
          {text}
        </Tag>
      ),
    },
    {
      title: '推荐人',
      dataIndex: 'referrer',
      key: 'referrer',
      width: 120,
    },
    {
      title: '下级数',
      dataIndex: 'subordinates',
      key: 'subordinates',
      width: 100,
      sorter: (a: NodeRecord, b: NodeRecord) => a.subordinates - b.subordinates,
      render: (val: number) => <Text strong style={{ color: '#1677FF' }}>{val}</Text>,
    },
    {
      title: '团队业绩(USDT)',
      dataIndex: 'performance',
      key: 'performance',
      width: 160,
      sorter: (a: NodeRecord, b: NodeRecord) => a.performance - b.performance,
      render: (val: number) => (
        <Text strong style={{ color: '#16A34A' }}>
          {(val / 10000).toFixed(1)}万
        </Text>
      ),
    },
    {
      title: '加入日期',
      dataIndex: 'joinDate',
      key: 'joinDate',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题区 */}
      <div>
        <Title level={2} style={{ marginBottom: 4 }}>
          全球直销网络总览
        </Title>
        <Text type="secondary">节点覆盖 · 层级管理 · 业绩追踪</Text>
      </div>

      {/* 数据统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="总节点数"
            value={2847}
            icon={<ApartmentOutlined />}
            color="#F0B90B"
            suffix="个"
            trend="up"
            trendValue="+12.5%"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="活跃节点"
            value={2156}
            icon={<TeamOutlined />}
            color="#16A34A"
            suffix="个"
            trend="up"
            trendValue="+8.3%"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="本月新增"
            value={186}
            icon={<UserAddOutlined />}
            color="#1677FF"
            suffix="个"
            trend="up"
            trendValue="+23.1%"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="总业绩(USDT)"
            value="5,680万"
            icon={<DollarOutlined />}
            color="#7C3AED"
            prefix="$"
            trend="up"
            trendValue="+15.7%"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <DataCard
            title="平均层级深度"
            value="4.2"
            icon={<LineChartOutlined />}
            color="#F59E0B"
            suffix="层"
            description="网络健康度良好"
          />
        </Col>
      </Row>

      {/* 节点列表表格 */}
      <Card bordered={false} style={{ borderRadius: 12 }}>
        <DataTable
          title="节点列表"
          columns={columns}
          dataSource={mockNodes}
          rowKey="id"
          actions={actions}
          searchPlaceholder="搜索节点ID或负责人..."
          showFilter={true}
          filterOptions={[
            { label: '全部状态', value: '' },
            { label: '活跃', value: 'active' },
            { label: '休眠', value: 'inactive' },
            { label: '暂停', value: 'suspended' },
          ]}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 节点详情弹窗 */}
      <Modal
        title={`节点详情 - ${selectedNode?.nodeId || ''}`}
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={700}
      >
        {selectedNode && (
          <div className="space-y-4">
            <Descriptions bordered column={2} size="middle">
              <Descriptions.Item label="节点ID">{selectedNode.nodeId}</Descriptions.Item>
              <Descriptions.Item label="负责人">{selectedNode.manager}</Descriptions.Item>
              <Descriptions.Item label="当前级别">
                <Tag color={getLevelColor(selectedNode.level)}>{selectedNode.level}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="推荐人">{selectedNode.referrer}</Descriptions.Item>
              <Descriptions.Item label="下级数量">{selectedNode.subordinates} 人</Descriptions.Item>
              <Descriptions.Item label="团队业绩">
                <Text strong style={{ color: '#16A34A' }}>{(selectedNode.performance / 10000).toFixed(1)} 万 USDT</Text>
              </Descriptions.Item>
              <Descriptions.Item label="加入日期">{selectedNode.joinDate}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(selectedNode.status)}</Descriptions.Item>
            </Descriptions>

            <div className="mt-4">
              <Text strong>业绩进度</Text>
              <Progress
                percent={Math.min((selectedNode.performance / 1500000) * 100, 100)}
                strokeColor="#F0B90B"
                format={(percent) => `${Number(percent).toFixed(1)}%`}
                className="mt-2"
              />
            </div>

            <div className="mt-4">
              <Text strong>层级分布</Text>
              <Row gutter={[8, 8]} className="mt-2">
                <Col span={8}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <Text type="secondary">直接下级</Text>
                    <div style={{ fontSize: 20, fontWeight: 600, color: '#1677FF' }}>
                      {Math.floor(selectedNode.subordinates * 0.3)}
                    </div>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <Text type="secondary">二级团队</Text>
                    <div style={{ fontSize: 20, fontWeight: 600, color: '#7C3AED' }}>
                      {Math.floor(selectedNode.subordinates * 0.5)}
                    </div>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <Text type="secondary">深层团队</Text>
                    <div style={{ fontSize: 20, fontWeight: 600, color: '#F59E0B' }}>
                      {Math.floor(selectedNode.subordinates * 0.2)}
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
