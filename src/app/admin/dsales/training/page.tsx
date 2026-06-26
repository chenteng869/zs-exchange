'use client';

import React from 'react';
import { Card, Typography, Tag, Row, Col, Avatar, Space, Progress, Badge } from 'antd';
import {
  ReadOutlined,
  UserOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  TrophyOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

interface Course {
  id: string;
  name: string;
  instructor: string;
  duration: string;
  students: number;
  status: 'active' | 'upcoming' | 'completed';
  category: string;
}

interface CertificationRecord {
  id: string;
  studentName: string;
  nodeId: string;
  courseName: string;
  certType: string;
  certDate: string;
  score: number;
  status: 'certified' | 'expired' | 'pending' | 'failed';
}

const mockCourses: Course[] = [
  {
    id: '1',
    name: '直销基础入门',
    instructor: '张导师',
    duration: '4小时',
    students: 456,
    status: 'active',
    category: '入门',
  },
  {
    id: '2',
    name: '高级销售技巧',
    instructor: '李讲师',
    duration: '8小时',
    students: 234,
    status: 'active',
    category: '进阶',
  },
  {
    id: '3',
    name: '团队管理实战',
    instructor: '王教练',
    duration: '12小时',
    students: 189,
    status: 'active',
    category: '高级',
  },
  {
    id: '4',
    name: '合规与风控',
    instructor: '赵顾问',
    duration: '6小时',
    students: 312,
    status: 'active',
    category: '必修',
  },
  {
    id: '5',
    name: '产品知识深度解析',
    instructor: '钱专家',
    duration: '10小时',
    students: 167,
    status: 'active',
    category: '专业',
  },
  {
    id: '6',
    name: '数字化营销工具',
    instructor: '孙老师',
    duration: '5小时',
    students: 278,
    status: 'upcoming',
    category: '技能',
  },
  {
    id: '7',
    name: '客户关系管理CRM',
    instructor: '周培训师',
    duration: '7小时',
    students: 145,
    status: 'active',
    category: '进阶',
  },
  {
    id: '8',
    name: '领导力与激励艺术',
    instructor: '吴大师',
    duration: '15小时',
    students: 89,
    status: 'completed',
    category: '高级',
  },
];

const mockCertifications: CertificationRecord[] = [
  {
    id: '1',
    studentName: '张伟',
    nodeId: 'ND-2024-001',
    courseName: '团队管理实战',
    certType: '钻石认证',
    certDate: '2024-06-15',
    score: 96,
    status: 'certified',
  },
  {
    id: '2',
    studentName: '李娜',
    nodeId: 'ND-2024-002',
    courseName: '高级销售技巧',
    certType: '金牌认证',
    certDate: '2024-06-14',
    score: 92,
    status: 'certified',
  },
  {
    id: '3',
    studentName: '王强',
    nodeId: 'ND-2024-003',
    courseName: '直销基础入门',
    certType: '银牌认证',
    certDate: '2024-06-12',
    score: 85,
    status: 'certified',
  },
  {
    id: '4',
    studentName: '刘芳',
    nodeId: 'ND-2024-004',
    courseName: '合规与风控',
    certType: '必修认证',
    certDate: '2024-06-10',
    score: 78,
    status: 'certified',
  },
  {
    id: '5',
    studentName: '陈明',
    nodeId: 'ND-2024-005',
    courseName: '产品知识深度解析',
    certType: '专业认证',
    certDate: '2024-06-08',
    score: 58,
    status: 'failed',
  },
  {
    id: '6',
    studentName: '杨丽',
    nodeId: 'ND-2024-006',
    courseName: '团队管理实战',
    certType: '金牌认证',
    certDate: '2024-06-05',
    score: 0,
    status: 'pending',
  },
  {
    id: '7',
    studentName: '赵刚',
    nodeId: 'ND-2024-007',
    courseName: '客户关系管理CRM',
    certType: '银牌认证',
    certDate: '2024-03-20',
    score: 88,
    status: 'expired',
  },
  {
    id: '8',
    studentName: '孙静',
    nodeId: 'ND-2024-008',
    courseName: '高级销售技巧',
    certType: '铜牌认证',
    certDate: '2024-06-16',
    score: 82,
    status: 'certified',
  },
  {
    id: '9',
    studentName: '吴敏',
    nodeId: 'ND-2024-010',
    courseName: '领导力与激励艺术',
    certType: '钻石认证',
    certDate: '2024-06-17',
    score: 94,
    status: 'certified',
  },
  {
    id: '10',
    studentName: '郑华',
    nodeId: 'ND-2024-011',
    courseName: '合规与风控',
    certType: '必修认证',
    certDate: '2024-06-18',
    score: 91,
    status: 'certified',
  },
];

const getCourseStatusTag = (status: string) => {
  const map: Record<string, { color: string; text: string }> = {
    active: { color: 'success', text: '进行中' },
    upcoming: { color: 'processing', text: '即将开始' },
    completed: { color: 'default', text: '已结束' },
  };
  const item = map[status] || { color: 'default', text: status };
  return <Tag color={item.color}>{item.text}</Tag>;
};

const getCategoryColor = (category: string) => {
  const map: Record<string, string> = {
    '入门': '#1677FF',
    '进阶': '#7C3AED',
    '高级': '#F0B90B',
    '必修': '#DC2626',
    '专业': '#0891B2',
    '技能': '#16A34A',
  };
  return map[category] || '#6B7280';
};

const getCertStatusConfig = (status: string) => {
  const map: Record<string, { color: string; text: string }> = {
    certified: { color: 'success', text: '已认证' },
    expired: { color: 'default', text: '已过期' },
    pending: { color: 'processing', text: '待考核' },
    failed: { color: 'error', text: '未通过' },
  };
  return map[status] || { color: 'default', text: status };
};

export default function DsalesTrainingPage() {
  const actions: any[] = [
    {
      key: 'view',
      label: '查看证书',
      icon: <SafetyCertificateOutlined />,
      type: 'link',
      onClick: (record: CertificationRecord) =>
        console.log('查看证书:', record.studentName),
      hidden: (record: CertificationRecord) => record.status !== 'certified',
    },
    {
      key: 'renew',
      label: '重新认证',
      icon: <PlayCircleOutlined />,
      type: 'link',
      onClick: (record: CertificationRecord) =>
        console.log('重新认证:', record.studentName),
      hidden: (record: CertificationRecord) => record.status !== 'expired',
    },
  ];

  const certColumns = [
    {
      title: '学员姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 100,
      render: (text: string) => (
        <Space>
          <Avatar size="small" style={{ background: '#F0B90B' }}>{text[0]}</Avatar>
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: '节点ID',
      dataIndex: 'nodeId',
      key: 'nodeId',
      width: 130,
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: '课程名称',
      dataIndex: 'courseName',
      key: 'courseName',
      width: 180,
    },
    {
      title: '认证类型',
      dataIndex: 'certType',
      key: 'certType',
      width: 110,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '认证日期',
      dataIndex: 'certDate',
      key: 'certDate',
      width: 120,
    },
    {
      title: '成绩',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      sorter: (a: CertificationRecord, b: CertificationRecord) => a.score - b.score,
      render: (score: number) => {
        if (score === 0) return <Text type="secondary">--</Text>;
        const color = score >= 90 ? '#16A34A' : score >= 60 ? '#F59E0B' : '#DC2626';
        return <Text strong style={{ color }}>{score}分</Text>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = getCertStatusConfig(status);
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
  ];

  const totalStudents = mockCourses.reduce((sum, c) => sum + c.students, 0);
  const activeCourses = mockCourses.filter((c) => c.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* 页面标题区 */}
      <div>
        <Title level={2} style={{ marginBottom: 4 }}>
          培训认证中心
        </Title>
        <Text type="secondary">课程体系 · 技能提升 · 资质认证</Text>
      </div>

      {/* 数据统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="课程总数"
            value={8}
            icon={<BookOutlined />}
            color="#F0B90B"
            suffix="门"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="进行中课程"
            value={activeCourses}
            icon={<PlayCircleOutlined />}
            color="#16A34A"
            suffix="门"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="总学员数"
            value={totalStudents}
            icon={<TeamOutlined />}
            color="#1677FF"
            suffix="人"
            trend="up"
            trendValue="+23%"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="已发证书"
            value={1247}
            icon={<SafetyCertificateOutlined />}
            color="#7C3AED"
            suffix="份"
            trend="up"
            trendValue="+156份"
          />
        </Col>
      </Row>

      {/* 课程网格展示 */}
      <div className="mt-6">
        <Title level={4}>培训课程</Title>
        <Row gutter={[16, 16]}>
          {mockCourses.map((course) => (
            <Col xs={24} sm={12} lg={6} key={course.id}>
              <Card
                hoverable
                style={{ borderRadius: 12, height: '100%' }}
                bodyStyle={{ padding: 20 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: `${getCategoryColor(course.category)}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                      fontSize: 18,
                      color: getCategoryColor(course.category),
                    }}
                  >
                    <VideoCameraOutlined />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: 14 }} ellipsis>{course.name}</Text>
                    <br />
                    <Tag
                      color={getCategoryColor(course.category)}
                      style={{ fontSize: 11, marginTop: 2 }}
                    >
                      {course.category}
                    </Tag>
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <Space size={4}>
                    <UserOutlined style={{ color: '#6B7280', fontSize: 12 }} />
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {course.instructor}
                    </Text>
                  </Space>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <Space size={12}>
                    <span>
                      <ClockCircleOutlined style={{ color: '#6B7280', marginRight: 4, fontSize: 12 }} />
                      <Text type="secondary" style={{ fontSize: 13 }}>{course.duration}</Text>
                    </span>
                    <span>
                      <TeamOutlined style={{ color: '#6B7280', marginRight: 4, fontSize: 12 }} />
                      <Text type="secondary" style={{ fontSize: 13 }}>{course.students}人</Text>
                    </span>
                  </Space>
                </div>

                <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 12 }}>
                  {getCourseStatusTag(course.status)}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* 学员认证记录表格 */}
      <Card bordered={false} style={{ borderRadius: 12, marginTop: 24 }}>
        <DataTable
          title="学员认证记录"
          columns={certColumns}
          dataSource={mockCertifications}
          rowKey="id"
          actions={actions}
          searchPlaceholder="搜索学员姓名或节点..."
          showFilter={true}
          filterOptions={[
            { label: '全部状态', value: '' },
            { label: '已认证', value: 'certified' },
            { label: '待考核', value: 'pending' },
            { label: '未通过', value: 'failed' },
            { label: '已过期', value: 'expired' },
          ]}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>
    </div>
  );
}
