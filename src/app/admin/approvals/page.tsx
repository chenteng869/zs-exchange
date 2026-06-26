/**
 * 审批管理页面
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  Table,
  Tabs,
  DatePicker,
  Select,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Descriptions,
  Timeline,
  Badge,
  Row,
  Col,
  Statistic,
  message,
} from 'antd';
import {
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
  StopOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  createApproval,
  approveApproval,
  rejectApproval,
  cancelApproval,
  queryApprovals,
  getApprovalStatistics,
  getApprovalTypeLabels,
  type ApprovalRecord,
  type ApprovalType,
  type ApprovalStatus,
} from '@/lib/admin/approval-workflow';

const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Option } = Select;

const statusColors: Record<ApprovalStatus, string> = {
  pending: 'processing',
  approved: 'success',
  rejected: 'error',
  cancelled: 'default',
  expired: 'warning',
};

const statusLabels: Record<ApprovalStatus, string> = {
  pending: '审批中',
  approved: '已通过',
  rejected: '已驳回',
  cancelled: '已取消',
  expired: '已过期',
};

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [type, setType] = useState<ApprovalType | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [detailModal, setDetailModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRecord | null>(null);
  const [form] = Form.useForm();
  const [commentForm] = Form.useForm();

  const statistics = useMemo(() => getApprovalStatistics(), [activeTab]);
  const typeLabels = getApprovalTypeLabels();

  const queryResult = useMemo(() => {
    const status = activeTab === 'all' ? undefined : (activeTab as ApprovalStatus);
    return queryApprovals({
      status,
      type,
      startTime: dateRange[0]?.toISOString(),
      endTime: dateRange[1]?.toISOString(),
      page,
      pageSize,
    });
  }, [activeTab, type, dateRange, page, pageSize]);

  const handleViewDetail = (record: ApprovalRecord) => {
    setSelectedApproval(record);
    setDetailModal(true);
  };

  const handleCreate = async (values: any) => {
    try {
      await createApproval({
        type: values.type,
        title: values.title,
        description: values.description,
      });
      message.success('审批申请已提交');
      setCreateModal(false);
      form.resetFields();
    } catch (e: any) {
      message.error(e.message || '提交失败');
    }
  };

  const handleApprove = async (values: any) => {
    if (!selectedApproval) return;
    try {
      await approveApproval(selectedApproval.id, values.comment);
      message.success('审批通过');
      setApproveModal(false);
      setDetailModal(false);
      commentForm.resetFields();
    } catch (e: any) {
      message.error(e.message || '审批失败');
    }
  };

  const handleReject = async (values: any) => {
    if (!selectedApproval) return;
    try {
      await rejectApproval(selectedApproval.id, values.reason);
      message.success('已驳回');
      setRejectModal(false);
      setDetailModal(false);
      commentForm.resetFields();
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const handleCancel = async () => {
    if (!selectedApproval) return;
    Modal.confirm({
      title: '确认取消审批',
      content: `确定要取消「${selectedApproval.title}」的审批申请吗？`,
      onOk: async () => {
        try {
          await cancelApproval(selectedApproval.id);
          message.success('已取消');
          setDetailModal(false);
        } catch (e: any) {
          message.error(e.message || '取消失败');
        }
      },
    });
  };

  const columns = [
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '审批类型',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (val: ApprovalType) => (
        <Tag color="blue">{typeLabels[val] || val}</Tag>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '申请人',
      dataIndex: 'applicantName',
      key: 'applicantName',
      width: 120,
    },
    {
      title: '当前进度',
      key: 'progress',
      width: 150,
      render: (_: any, record: ApprovalRecord) => (
        <span>
          第 {record.currentLevel} / {record.requiredLevels} 级
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (val: ApprovalStatus) => (
        <Badge status={statusColors[val] as any} text={statusLabels[val]} />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_: any, record: ApprovalRecord) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          查看
        </Button>
      ),
    },
  ];

  const tabItems = [
    { key: 'all', label: `全部 (${statistics.total})` },
    { key: 'pending', label: `待审批 (${statistics.pending})` },
    { key: 'approved', label: `已通过 (${statistics.approved})` },
    { key: 'rejected', label: `已驳回 (${statistics.rejected})` },
  ];

  return (
    <div className="space-y-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="审批总数"
              value={statistics.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="待审批"
              value={statistics.pending}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已通过"
              value={statistics.approved}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="今日新增"
              value={statistics.todayNew}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <RangePicker
              value={dateRange as any}
              onChange={(dates) => setDateRange(dates as any)}
              style={{ width: 280 }}
            />
            <Select
              placeholder="审批类型"
              allowClear
              style={{ width: 180 }}
              value={type}
              onChange={setType}
            >
              {Object.entries(typeLabels).map(([key, label]) => (
                <Option key={key} value={key}>
                  {label}
                </Option>
              ))}
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
              发起审批
            </Button>
          </Space>

          <Table
            columns={columns}
            dataSource={queryResult.list}
            rowKey="id"
            pagination={{
              current: page,
              pageSize,
              total: queryResult.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
            }}
            size="middle"
          />
        </Space>
      </Card>

      <Modal
        title="发起审批"
        open={createModal}
        onCancel={() => setCreateModal(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="type"
            label="审批类型"
            rules={[{ required: true, message: '请选择审批类型' }]}
          >
            <Select placeholder="请选择审批类型">
              {Object.entries(typeLabels).map(([key, label]) => (
                <Option key={key} value={key}>
                  {label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="title"
            label="审批标题"
            rules={[{ required: true, message: '请输入审批标题' }]}
          >
            <Input placeholder="请输入审批标题" maxLength={100} />
          </Form.Item>
          <Form.Item
            name="description"
            label="审批说明"
            rules={[{ required: true, message: '请输入审批说明' }]}
          >
            <TextArea rows={4} placeholder="请详细说明审批内容和原因" maxLength={500} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCreateModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                提交申请
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="审批详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        width={700}
        footer={
          selectedApproval?.status === 'pending' ? (
            <Space>
              <Button icon={<StopOutlined />} onClick={handleCancel}>
                取消申请
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={() => {
                  setRejectModal(true);
                }}
              >
                驳回
              </Button>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => {
                  setApproveModal(true);
                }}
              >
                通过
              </Button>
            </Space>
          ) : (
            <Button onClick={() => setDetailModal(false)}>关闭</Button>
          )
        }
      >
        {selectedApproval && (
          <div>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="审批类型" span={2}>
                <Tag color="blue">{typeLabels[selectedApproval.type]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="标题" span={2}>
                {selectedApproval.title}
              </Descriptions.Item>
              <Descriptions.Item label="申请人">
                {selectedApproval.applicantName}
              </Descriptions.Item>
              <Descriptions.Item label="申请人角色">
                {selectedApproval.applicantRole}
              </Descriptions.Item>
              <Descriptions.Item label="申请时间" span={2}>
                {dayjs(selectedApproval.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Badge
                  status={statusColors[selectedApproval.status] as any}
                  text={statusLabels[selectedApproval.status]}
                />
              </Descriptions.Item>
              <Descriptions.Item label="审批进度">
                第 {selectedApproval.currentLevel} / {selectedApproval.requiredLevels} 级
              </Descriptions.Item>
              <Descriptions.Item label="说明" span={2}>
                {selectedApproval.description}
              </Descriptions.Item>
              {selectedApproval.expiresAt && (
                <Descriptions.Item label="过期时间" span={2}>
                  {dayjs(selectedApproval.expiresAt).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
              )}
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <h4 style={{ marginBottom: 12 }}>审批流程</h4>
              <Timeline
                items={selectedApproval.steps.map((step) => ({
                  color:
                    step.status === 'approved'
                      ? 'green'
                      : step.status === 'rejected'
                      ? 'red'
                      : 'gray',
                  children: (
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        第{step.level}级 - {step.requiredRole}
                        {step.approverName && (
                          <Tag color="blue" style={{ marginLeft: 8 }}>
                            {step.approverName}
                          </Tag>
                        )}
                      </div>
                      {step.approvedAt && (
                        <div style={{ color: '#666', fontSize: 12 }}>
                          {dayjs(step.approvedAt).format('YYYY-MM-DD HH:mm:ss')}
                        </div>
                      )}
                      {step.comment && (
                        <div style={{ marginTop: 4, color: '#888' }}>
                          意见：{step.comment}
                        </div>
                      )}
                    </div>
                  ),
                }))}
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="审批通过"
        open={approveModal}
        onCancel={() => setApproveModal(false)}
        onOk={() => commentForm.submit()}
        okText="确认通过"
      >
        <Form form={commentForm} layout="vertical">
          <Form.Item name="comment" label="审批意见（可选）">
            <TextArea rows={3} placeholder="请输入审批意见" maxLength={200} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="驳回审批"
        open={rejectModal}
        onCancel={() => setRejectModal(false)}
        onOk={() => commentForm.submit()}
        okText="确认驳回"
        okButtonProps={{ danger: true }}
      >
        <Form form={commentForm} layout="vertical" onFinish={handleReject}>
          <Form.Item
            name="reason"
            label="驳回原因"
            rules={[{ required: true, message: '请输入驳回原因' }]}
          >
            <TextArea rows={4} placeholder="请输入驳回原因" maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
