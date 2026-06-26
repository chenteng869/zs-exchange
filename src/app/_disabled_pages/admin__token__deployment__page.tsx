'use client';

import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Table,
  Progress,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Typography,
  Descriptions,
  Timeline,
  Badge,
  Tooltip,
} from 'antd';
import {
  CloudServerOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  CodeOutlined,
  RocketOutlined,
  WarningOutlined,
  FileProtectOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;
const { Title, Text } = Typography;

const mockDeployments = [
  { id: 'DEP-001', contractName: 'AIOPCToken', network: 'BSC Mainnet', address: '0x1a2b...8c9d', blockHeight: 38_456_789, gasUsed: '2,450,000', status: 'deployed', progress: 100, deployTime: '2024-03-15 14:30' },
  { id: 'DEP-002', contractName: 'ZSDEXGovernance', network: 'ETH Mainnet', address: '0x3e4f...0a1b', blockHeight: 19_234_567, gasUsed: '5,120,000', status: 'deployed', progress: 100, deployTime: '2024-04-01 09:15' },
  { id: 'DEP-003', contractName: 'DeFiPlusVault', network: 'Polygon', address: '0x5c6d...2e3f', blockHeight: 56_789_012, gasUsed: '1,890,000', status: 'deployed', progress: 100, deployTime: '2024-05-10 16:45' },
  { id: 'DEP-004', contractName: 'MetaVerseNFT', network: 'Arbitrum', address: '', blockHeight: 0, gasUsed: '0', status: 'pending', progress: 0, deployTime: '-' },
  { id: 'DEP-005', contractName: 'ChainXBridge', network: 'ETH Mainnet', address: '0x7g8h...4i5j', blockHeight: 19_567_890, gasUsed: '8,340,000', status: 'deployed', progress: 100, deployTime: '2024-06-01 11:20' },
  { id: 'DEP-006', contractName: 'NFTFIStaking', network: 'Solana', address: '', blockHeight: 0, gasUsed: '0', status: 'deploying', progress: 67, deployTime: '2024-06-08 10:00' },
  { id: 'DEP-007', contractName: 'Web3HubDAO', network: 'Avalanche', address: '', blockHeight: 0, gasUsed: '0', status: 'pending', progress: 0, deployTime: '-' },
  { id: 'DEP-008', contractName: 'OraclePriceFeed', network: 'ETH Mainnet', address: '0x9k0l...6m7n', blockHeight: 19_678_123, gasUsed: '3,210,000', status: 'deployed', progress: 100, deployTime: '2024-06-15 14:55' },
  { id: 'DEP-009', contractName: 'PrivacyShieldZK', network: 'Secret Network', address: '', blockHeight: 0, gasUsed: '0', status: 'failed', progress: 35, deployTime: '2024-06-18 08:30' },
  { id: 'DEP-010', contractName: 'YieldAggregatorV2', network: 'Optimism', address: '0x1o2p...8q9r', blockHeight: 112_345_678, gasUsed: '4,560,000', status: 'deployed', progress: 100, deployTime: '2024-06-20 17:10' },
];

const deployStatusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  deployed: { color: 'green', label: '已部署', icon: <CheckCircleOutlined /> },
  deploying: { color: 'blue', label: '部署中', icon: <SyncOutlined spin /> },
  pending: { color: 'orange', label: '待部署', icon: <ClockCircleOutlined /> },
  failed: { color: 'red', label: '失败', icon: <CloseCircleOutlined /> },
};

const networkOptions = [
  { value: 'ETH Mainnet', label: 'Ethereum Mainnet' },
  { value: 'BSC Mainnet', label: 'BNB Smart Chain' },
  { value: 'Polygon', label: 'Polygon PoS' },
  { value: 'Arbitrum', label: 'Arbitrum One' },
  { value: 'Optimism', label: 'Optimism' },
  { value: 'Avalanche', label: 'Avalanche C-Chain' },
  { value: 'Solana', label: 'Solana Mainnet' },
  { value: 'Secret Network', label: 'Secret Network' },
];

export default function TokenDeploymentPage() {
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);
  const [form] = Form.useForm();

  const columns = [
    {
      title: '部署ID',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: '合约名称',
      dataIndex: 'contractName',
      key: 'contractName',
      render: (text: string) => (
        <Space>
          <CodeOutlined style={{ color: '#1677FF' }} />
          <span className="font-mono font-semibold">{text}</span>
        </Space>
      ),
    },
    {
      title: '目标网络',
      dataIndex: 'network',
      key: 'network',
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: '合约地址',
      dataIndex: 'address',
      key: 'address',
      render: (addr: string) =>
        addr ? (
          <Tooltip title={addr}>
            <Text copyable={{ text: addr }} className="font-mono text-xs">
              {addr.slice(0, 10)}...
            </Text>
          </Tooltip>
        ) : (
          <Text type="secondary">--</Text>
        ),
    },
    {
      title: '区块高度',
      dataIndex: 'blockHeight',
      key: 'blockHeight',
      render: (val: number) => val > 0 ? val.toLocaleString() : '--',
    },
    {
      title: 'Gas消耗',
      dataIndex: 'gasUsed',
      key: 'gasUsed',
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = deployStatusConfig[status];
        if (!config) return <Tag>{status}</Tag>;
        return (
          <Badge
            status={config.color as 'success' | 'processing' | 'warning' | 'error'}
            text={
              <Space size={4}>
                {config.icon}
                <span>{config.label}</span>
              </Space>
            }
          />
        );
      },
    },
    {
      title: '部署进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 160,
      render: (val: number, record: any) => {
        const statusColor = record.status === 'failed' ? '#DC2626' : record.status === 'deploying' ? '#1677FF' : '#16A34A';
        return <Progress percent={val} size="small" strokeColor={statusColor} />;
      },
    },
  ];

  const actionColumn = {
    title: '操作',
    key: 'action',
    width: 140,
    render: (_: any, record: any) => (
      <Space size="small">
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            setCurrentRecord(record);
            setDetailModalOpen(true);
          }}
        >
          详情
        </Button>
        {record.status === 'pending' && (
          <Button type="link" size="small" icon={<RocketOutlined />} onClick={() => message.info(`开始部署 ${record.contractName}`)}>
            部署
          </Button>
        )}
        {record.status === 'failed' && (
          <Button type="link" size="small" danger icon={<WarningOutlined />} onClick={() => message.warning(`重新部署 ${record.contractName}`)}>
            重试
          </Button>
        )}
      </Space>
    ),
  };

  const allColumns = [...columns, actionColumn];

  const handleDeploySubmit = () => {
    form.validateFields().then(() => {
      message.success('合约部署任务已提交！');
      setIsDeployModalOpen(false);
      form.resetFields();
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <Title level={2} className="m-0 flex items-center gap-3">
              <CloudServerOutlined style={{ color: '#F0B90B' }} />
              智能合约部署中心
            </Title>
            <Text type="secondary" className="mt-2 block">
              多链智能合约编译、部署、验证一站式管理
            </Text>
          </div>
          <Space>
            <Button icon={<SyncOutlined />}>同步状态</Button>
            <Button type="primary" icon={<RocketOutlined />} onClick={() => setIsDeployModalOpen(true)}>
              新建部署
            </Button>
          </Space>
        </div>

        {/* 部署概览统计 */}
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card size="small" bordered>
              <Statistic title="总部署数" value={mockDeployments.length} valueStyle={{ color: '#1677FF', fontSize: 22 }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" bordered>
              <Statistic
                title="成功"
                value={mockDeployments.filter((d) => d.status === 'deployed').length}
                suffix={`/ ${mockDeployments.length}`}
                valueStyle={{ color: '#16A34A', fontSize: 22 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" bordered>
              <Statistic
                title="进行中"
                value={mockDeployments.filter((d) => d.status === 'deploying').length}
                valueStyle={{ color: '#1677FF', fontSize: 22 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" bordered>
              <Statistic
                title="失败"
                value={mockDeployments.filter((d) => d.status === 'failed').length}
                valueStyle={{ color: '#DC2626', fontSize: 22 }}
              />
            </Card>
          </Col>
        </Row>

        {/* 部署进度展示区 */}
        {mockDeployments.some((d) => d.status === 'deploying') && (
          <Card title="当前部署任务" className="mb-4" style={{ borderColor: '#1677FF' }}>
            {mockDeployments
              .filter((d) => d.status === 'deploying')
              .map((dep) => (
                <div key={dep.id} className="mb-3 last:mb-0">
                  <div className="flex items-center justify-between mb-1">
                    <Space>
                      <SyncOutlined spin style={{ color: '#1677FF' }} />
                      <Text strong>{dep.contractName}</Text>
                      <Tag color="blue">{dep.network}</Tag>
                    </Space>
                    <Text className="text-sm">{dep.progress}%</Text>
                  </div>
                  <Progress percent={dep.progress} strokeColor="#1677FF" showInfo={false} />
                </div>
              ))}
          </Card>
        )}

        {/* DataTable */}
        <Table
          columns={allColumns}
          dataSource={mockDeployments}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 条` }}
          scroll={{ x: 'max-content' }}
          bordered
          size="middle"
        />

        {/* 新建部署 Modal */}
        <Modal
          title="新建合约部署"
          open={isDeployModalOpen}
          onOk={handleDeploySubmit}
          onCancel={() => setIsDeployModalOpen(false)}
          width={600}
          okText="提交部署"
          cancelText="取消"
        >
          <Form form={form} layout="vertical" className="mt-4">
            <Form.Item label="合约名称" name="contractName" rules={[{ required: true, message: '请输入合约名称' }]}>
              <Input placeholder="例如：MyERC20Token" />
            </Form.Item>
            <Form.Item label="目标网络" name="network" rules={[{ required: true, message: '请选择目标网络' }]}>
              <Select placeholder="选择区块链网络">
                {networkOptions.map((opt) => (
                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="合约源码(Solidity)" name="sourceCode" rules={[{ required: true, message: '请上传或粘贴合约代码' }]}>
              <Input.TextArea rows={6} placeholder="粘贴 Solidity 合约源码..." />
            </Form.Item>
            <Form.Item label="构造函数参数" name="constructorArgs">
              <Input placeholder='例如：["AIOPC", "AIPC", 18, 1000000000]' />
            </Form.Item>
            <Form.Item label="Gas Price (Gwei)" name="gasPrice">
              <InputNumber style={{ width: '100%' }} min={1} max={500} step={1} defaultValue={30} />
            </Form.Item>
          </Form>
        </Modal>

        {/* 详情 Modal */}
        <Modal
          title={`部署详情 · ${currentRecord?.contractName || ''}`}
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={<Button onClick={() => setDetailModalOpen(false)}>关闭</Button>}
          width={650}
        >
          {currentRecord && (
            <div className="mt-4 space-y-5">
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="部署ID">{currentRecord.id}</Descriptions.Item>
                <Descriptions.Item label="合约名称"><span className="font-mono">{currentRecord.contractName}</span></Descriptions.Item>
                <Descriptions.Item label="目标网络"><Tag>{currentRecord.network}</Tag></Descriptions.Item>
                <Descriptions.Item label="合约地址">
                  {currentRecord.address ? <Text copyable className="font-mono">{currentRecord.address}</Text> : '--'}
                </Descriptions.Item>
                <Descriptions.Item label="区块高度">{currentRecord.blockHeight?.toLocaleString() || '--'}</Descriptions.Item>
                <Descriptions.Item label="Gas消耗"><Text code>{currentRecord.gasUsed}</Text></Descriptions.Item>
                <Descriptions.Item label="部署时间">{currentRecord.deployTime}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={deployStatusConfig[currentRecord.status]?.color}>{deployStatusConfig[currentRecord.status]?.label}</Tag>
                </Descriptions.Item>
              </Descriptions>

              <div>
                <Text strong>部署进度</Text>
                <Progress percent={currentRecord.progress} className="mt-2" strokeColor={currentRecord.status === 'failed' ? '#DC2626' : '#1677FF'} />
              </div>

              <div>
                <Text strong>部署日志</Text>
                <Timeline
                  className="mt-3"
                  items={[
                    { children: `${currentRecord.deployTime} 提交部署任务`, color: 'green' },
                    ...(currentRecord.progress >= 25 ? [{ children: '编译通过 ✓', color: 'green' }] : []),
                    ...(currentRecord.progress >= 50 ? [{ children: '字节码生成完成', color: 'blue' }] : []),
                    ...(currentRecord.progress >= 75 ? [{ children: '交易已广播至网络...', color: 'orange' }] : []),
                    ...(currentRecord.progress >= 100 ? [{ children: currentRecord.status === 'deployed' ? '部署确认 ✓' : '部署失败 ✗', color: currentRecord.status === 'deployed' ? 'green' : 'red' }] : []),
                  ]}
                />
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
