'use client';

import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Alert,
  Tag,
  Badge,
  Space,
  Typography,
} from 'antd';
import {
  SafetyCertificateOutlined,
  AlertOutlined,
  AuditOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  FileTextOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

export default function ComplianceDashboardPage() {
  const [alertData, setAlertData] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  useEffect(() => {
    fetch('/api/admin/compliance/alerts?pageSize=100').then(r => r.json()).then(d => {
      if (d.data?.items) setAlertData(d.data.items);
      setLoadingAlerts(false);
    }).catch(() => setLoadingAlerts(false));
  }, []);

  const getLevelColor = (level: string) => {
    const colorMap: Record<string, string> = {
      critical: '#DC2626',
      high: '#F59E0B',
      medium: '#F97316',
      low: '#16A34A',
    };
    return colorMap[level] || '#9CA3AF';
  };

  const getLevelTag = (level: string) => {
    const tagMap: Record<string, { color: string; text: string }> = {
      critical: { color: 'error', text: '严重' },
      high: { color: 'warning', text: '高' },
      medium: { color: 'orange', text: '中' },
      low: { color: 'success', text: '低' },
    };
    const config = tagMap[level] || { color: 'default', text: level };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'red', text: '待处理' },
      reviewing: { color: 'orange', text: '审查中' },
      resolved: { color: 'green', text: '已解决' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '预警ID',
      dataIndex: 'id',
      key: 'id',
      width: 140,
      render: (text: string) => (
        <Text copyable style={{ fontFamily: 'monospace', fontSize: 13 }}>
          {text}
        </Text>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 160,
    },
    {
      title: '风险等级',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: string) => getLevelTag(level),
    },
    {
      title: '来源实体',
      dataIndex: 'entity',
      key: 'entity',
      width: 180,
      render: (text: string) => (
        <Text code style={{ fontSize: 13 }}>
          {text}
        </Text>
      ),
    },
    {
      title: '检测时间',
      dataIndex: 'time',
      key: 'time',
      width: 180,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
  ];

  const actions: any[] = [
    {
      key: 'view',
      label: '查看详情',
      icon: <EyeOutlined />,
      type: 'link',
      onClick: (record: any) => console.log('查看:', record.id),
    },
    {
      key: 'process',
      label: '处理',
      icon: <EditOutlined />,
      type: 'link',
      hidden: () => false,
      onClick: (record: any) => console.log('处理:', record.id),
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      type: 'link',
      danger: true,
      hidden: (record: any) => record.status === 'resolved',
      onClick: (record: any) => console.log('删除:', record.id),
    },
  ];

  const criticalCount = alertData.filter((item: any) => item.level === 'critical').length;
  const highCount = alertData.filter((item: any) => item.level === 'high').length;

  return (
    <AdminLayout>
      <div className="p-6" style={{ background: '#F5F7FA', minHeight: '100vh' }}>
        {/* 页面标题 */}
        <div className="mb-6">
          <Title level={2} style={{ margin: 0, color: '#111827' }}>
            合规风控总览
          </Title>
          <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: 'block' }}>
            全球多法域合规监控 · AML/KYC/Sanctions · AI驱动风险识别
          </Text>
        </div>

        {/* 最高级别预警提示 */}
        {(criticalCount > 0 || highCount > 0) && (
          <Alert
            message={
              <Space>
                <WarningOutlined />
                <span>发现 {criticalCount + highCount} 条高级别预警需要立即处理</span>
                <Badge count={criticalCount} style={{ backgroundColor: '#DC2626' }} />
                <Badge count={highCount} style={{ backgroundColor: '#F59E0B' }} />
              </Space>
            }
            description="系统已自动识别到严重和高风险级别的合规预警，请合规团队优先处理"
            type="error"
            showIcon
            closable
            className="mb-6"
          />
        )}

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="合规评分"
              value={92.5}
              suffix="分"
              icon={<SafetyCertificateOutlined />}
              color="#1677FF"
              trend="up"
              trendValue="+2.3%"
              description="较上月提升"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="待处理预警"
              value={18}
              suffix="条"
              icon={<AlertOutlined />}
              color="#DC2626"
              trend="down"
              trendValue="-12%"
              description="需立即关注"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="本月审查数"
              value={342}
              suffix="次"
              icon={<AuditOutlined />}
              color="#7C3AED"
              trend="up"
              trendValue="+28%"
              description="审查效率提升"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="通过率"
              value={96.8}
              suffix="%"
              icon={<CheckCircleOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="+1.5%"
              description="符合监管标准"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="违规事件"
              value={3}
              suffix="件"
              icon={<WarningOutlined />}
              color="#F59E0B"
              trend="down"
              trendValue="-40%"
              description="持续改善中"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="监管报告"
              value={24}
              suffix="份"
              icon={<FileTextOutlined />}
              color="#06B6D4"
              trend="up"
              trendValue="+8%"
              description="按时提交率100%"
            />
          </Col>
        </Row>

        {/* 预警数据表格 */}
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <DataTable
            columns={columns}
            dataSource={alertData}
            loading={loadingAlerts}
            title="实时预警监控"
            rowKey="id"
            actions={actions}
            showAdd={false}
            searchPlaceholder="搜索预警ID或实体..."
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条预警`,
            }}
          />
        </Card>
      </div>
    </AdminLayout>
  );
}
