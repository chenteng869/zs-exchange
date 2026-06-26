'use client';

import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Typography,
  List,
  Avatar,
  Divider,
  Statistic,
} from 'antd';
import {
  AppstoreOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  FundOutlined,
  LineChartOutlined,
  ApiOutlined,
  SettingOutlined,
  AuditOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  StarOutlined,
  InfoCircleOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;
const { Text, Title, Paragraph } = Typography;

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  price: string;
  priceUnit: string;
  icon: React.ReactNode;
  color: string;
  category: string;
  features: string[];
  popular?: boolean;
}

const services: ServiceItem[] = [
  {
    id: 'svc-001', name: 'IPO上市咨询', description: '从项目评估到挂牌交易的全流程IPO咨询服务，覆盖萨摩亚、香港、美国等多市场',
    price: '50,000', priceUnit: 'USD', icon: <RocketOutlined />, color: '#1677FF', category: '上市服务',
    features: ['尽职调查', '招股书撰写', '路演策划', '投资者关系'],
    popular: true,
  },
  {
    id: 'svc-002', name: '合规审计服务', description: '针对数字资产企业的全面合规审计，包括KYC/AML、数据保护、反洗钱等维度',
    price: '25,000', priceUnit: 'USD', icon: <SafetyCertificateOutlined />, color: '#16A34A', category: '合规服务',
    features: ['法规对标审查', '内控流程审计', '风险评估报告', '整改建议'],
  },
  {
    id: 'svc-003', name: '代币发行顾问', description: 'ERC-20/BEP-20等多链代币经济模型设计、智能合约部署及社区运营支持',
    price: '35,000', priceUnit: 'USD', icon: <FundOutlined />, color: '#F0B90B', category: '代币服务',
    features: ['经济模型设计', '合约安全审计', '流动性规划', '社区建设'],
    popular: true,
  },
  {
    id: 'svc-004', name: '量化策略定制', description: '基于AI的量化交易策略研发与回测，支持多市场、多品种的算法交易系统搭建',
    price: '80,000', priceUnit: 'USD', icon: <LineChartOutlined />, color: '#7C3AED', category: '交易服务',
    features: ['策略研发', '回测验证', '实盘部署', '风控体系'],
  },
  {
    id: 'svc-005', name: '技术集成服务', description: '交易所核心系统对接，包括API集成、行情接入、清算系统、风控引擎等模块化部署',
    price: '60,000', priceUnit: 'USD', icon: <ApiOutlined />, color: '#DC2626', category: '技术服务',
    features: ['API网关部署', '行情数据接入', '清算对账系统', '监控告警'],
  },
  {
    id: 'svc-006', name: 'SPV架构设计', description: '特殊目的载体(SPV)的架构设计与设立，实现资产隔离与税务优化',
    price: '40,000', priceUnit: 'USD', icon: <SettingOutlined />, color: '#F59E0B', category: '架构服务',
    features: ['SPV架构设计', '法律文件起草', '银行账户开设', '税务筹划'],
  },
  {
    id: 'svc-007', name: '年度合规维护', description: '持续性的合规监控与报告服务，确保企业全年符合监管要求',
    price: '15,000', priceUnit: 'USD/年', icon: <AuditOutlined />, color: '#0891B2', category: '合规服务',
    features: ['季度合规检查', '监管动态跟踪', '年报编制', '培训支持'],
  },
  {
    id: 'svc-008', name: '品牌与营销', description: 'Web3品牌全案策划，包括品牌定位、社媒运营、KOL合作、活动策划等一站式服务',
    price: '30,000', priceUnit: 'USD', icon: <StarOutlined />, color: '#EC4899', category: '增值服务',
    features: ['品牌战略', '社媒运营', 'KOL合作', '活动策划'],
  },
];

const categories = [...new Set(services.map((s) => s.category))];

export default function EnterpriseServicesPage() {
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [form] = Form.useForm();

  const handleOrder = (service: ServiceItem) => {
    setSelectedService(service);
    setOrderModalOpen(true);
  };

  const handleOrderSubmit = () => {
    form.validateFields().then(() => {
      message.success(`${selectedService?.name} 订单已提交！我们的团队将在24小时内与您联系。`);
      setOrderModalOpen(false);
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
              <AppstoreOutlined style={{ color: '#F0B90B' }} />
              企业服务产品目录
            </Title>
            <Text type="secondary" className="mt-2 block">
              为企业提供全方位的数字资产领域专业服务 · 一站式解决方案
            </Text>
          </div>
          <Space>
            <Button icon={<PhoneOutlined />}>联系销售</Button>
          </Space>
        </div>

        {/* 统计概览 */}
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card size="small" bordered>
              <Statistic title="服务产品数" value={services.length} valueStyle={{ color: '#1677FF', fontSize: 22 }} prefix={<AppstoreOutlined />} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" bordered>
              <Statistic title="热门推荐" value={services.filter((s) => s.popular).length} valueStyle={{ color: '#F0B90B', fontSize: 22 }} prefix={<StarOutlined />} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" bordered>
              <Statistic title="服务分类" value={categories.length} valueStyle={{ color: '#16A34A', fontSize: 22 }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" bordered>
              <Statistic title="平均交付周期" value="30" suffix="天" valueStyle={{ color: '#7C3AED', fontSize: 22 }} />
            </Card>
          </Col>
        </Row>

        {/* 服务卡片网格 - 8项服务 */}
        <Row gutter={[20, 20]}>
          {services.map((service) => (
            <Col xs={24} sm={12} lg={12} xl={6} key={service.id}>
              <Card
                hoverable
                style={{
                  borderRadius: 12,
                  height: '100%',
                  borderTop: `3px solid ${service.color}`,
                }}
                actions={[
                  <Button
                    key="order"
                    type="primary"
                    size="small"
                    icon={<ShoppingCartOutlined />}
                    onClick={() => handleOrder(service)}
                    block
                  >
                    立即订购
                  </Button>,
                ]}
              >
                <div className="space-y-3">
                  {/* 头部：图标 + 名称 + 标签 */}
                  <div className="flex items-start justify-between">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl"
                      style={{ backgroundColor: service.color }}
                    >
                      {service.icon}
                    </div>
                    <Space size={4}>
                      {service.popular && <Tag color="gold" icon={<StarOutlined />}>热门</Tag>}
                      <Tag color={service.color}>{service.category}</Tag>
                    </Space>
                  </div>

                  {/* 名称和描述 */}
                  <div>
                    <Title level={5} className="m-0">{service.name}</Title>
                    <Paragraph
                      type="secondary"
                      ellipsis={{ rows: 2 }}
                      className="mt-1 mb-0"
                      style={{ fontSize: 13 }}
                    >
                      {service.description}
                    </Paragraph>
                  </div>

                  <Divider style={{ margin: '8px 0' }} />

                  {/* 价格 */}
                  <div className="flex items-baseline gap-1">
                    <Text type="secondary" style={{ fontSize: 12 }}>起价</Text>
                    <Text strong style={{ fontSize: 22, color: service.color }}>
                      ${service.price}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{service.priceUnit}</Text>
                  </div>

                  {/* 特性列表 */}
                  <List
                    size="small"
                    dataSource={service.features}
                    renderItem={(item) => (
                      <List.Item style={{ padding: '2px 0', border: 'none' }}>
                        <CheckCircleOutlined style={{ color: '#16A34A', marginRight: 6, fontSize: 12 }} />
                        <Text style={{ fontSize: 12 }}>{item}</Text>
                      </List.Item>
                    )}
                  />
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* 订购 Modal */}
        <Modal
          title={`订购服务 · ${selectedService?.name || ''}`}
          open={orderModalOpen}
          onOk={handleOrderSubmit}
          onCancel={() => setOrderModalOpen(false)}
          width={550}
          okText="提交订单"
          cancelText="取消"
        >
          {selectedService && (
            <div className="mt-4 space-y-4">
              <Card size="small" className="bg-blue-50">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: selectedService.color }}
                  >
                    {selectedService.icon}
                  </div>
                  <div>
                    <Text strong>{selectedService.name}</Text>
                    <br />
                    <Text type="secondary">${selectedService.price} {selectedService.priceUnit} 起</Text>
                  </div>
                </div>
              </Card>

              <Form form={form} layout="vertical">
                <Form.Item label="企业名称" name="companyName" rules={[{ required: true, message: '请输入企业名称' }]}>
                  <Input placeholder="您的企业全称" />
                </Form.Item>
                <Form.Item label="联系人姓名" name="contactName" rules={[{ required: true, message: '请输入联系人姓名' }]}>
                  <Input placeholder="联系人真实姓名" />
                </Form.Item>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="联系电话" name="phone" rules={[{ required: true, message: '请输入联系电话' }]}>
                      <Input placeholder="+86 xxx xxxx xxxx" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="电子邮箱" name="email" rules={[{ required: true, message: '请输入邮箱' }]}>
                      <Input placeholder="email@example.com" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item label="预算范围" name="budget">
                  <Select placeholder="选择大致预算范围">
                    <Option value="<30k">{'< $30,000'}</Option>
                    <Option value="30k-60k">$30,000 - $60,000</Option>
                    <Option value="60k-100k">$60,000 - $100,000</Option>
                    <Option value=">100k">{'> $100,000'}</Option>
                  </Select>
                </Form.Item>
                <Form.Item label="补充说明" name="notes">
                  <Input.TextArea rows={3} placeholder="请描述您的具体需求或期望..." />
                </Form.Item>
              </Form>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
