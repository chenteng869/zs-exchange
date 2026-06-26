'use client';

import { useState } from 'react';
import {
  Card,
  Button,
  Row,
  Col,
  Divider,
  Table,
  Collapse,
  Form,
  Input,
  Select,
  Space,
  Typography,
  Timeline
} from 'antd';
import {
  HomeOutlined,
  TeamOutlined,
  SafetyOutlined,
  BarChartOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  ApiOutlined,
  DatabaseOutlined,
  SecurityScanOutlined,
  CloudOutlined,
  StarOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

const arbitrationData = [
  { key: '1', pair: 'BTC/USDT', exchange1: 'Binance', exchange2: 'Coinbase', price1: '$45,200', price2: '$45,350', spread: '0.33%', volume: '1.2M', profit: '$1,800' },
  { key: '2', pair: 'ETH/USDT', exchange1: 'Binance', exchange2: 'Kraken', price1: '$2,850', price2: '$2,870', spread: '0.70%', volume: '3.5M', profit: '$5,250' },
  { key: '3', pair: 'SOL/USDT', exchange1: 'FTX', exchange2: 'OKX', price1: '$156', price2: '$158', spread: '1.28%', volume: '850K', profit: '$3,400' },
  { key: '4', pair: 'DOGE/USDT', exchange1: 'KuCoin', exchange2: 'Gate.io', price1: '$0.15', price2: '$0.152', spread: '1.33%', volume: '2.1M', profit: '$6,200' },
  { key: '5', pair: 'AVAX/USDT', exchange1: 'Huobi', exchange2: 'Bybit', price1: '$35.2', price2: '$35.8', spread: '1.70%', volume: '1.8M', profit: '$4,500' },
  { key: '6', pair: 'MATIC/USDT', exchange1: 'Binance', exchange2: 'Coinbase', price1: '$0.85', price2: '$0.865', spread: '1.76%', volume: '2.8M', profit: '$7,200' }
];

const faqItems = [
  { key: '1', question: 'What is arbitrage trading in cryptocurrency?', answer: 'Crypto arbitrage is a trading strategy that involves buying and selling the same cryptocurrency across different exchanges to profit from price differences. When the same asset is priced differently on two platforms, traders can buy low and sell high.' },
  { key: '2', question: 'How does NEURAL TECHNOLOGY work?', answer: 'Our platform uses advanced algorithms to monitor multiple exchanges simultaneously, detecting price inefficiencies and executing trades automatically at optimal times to maximize your profits.' },
  { key: '3', question: 'What are the fees for using the platform?', answer: 'We charge a competitive 2% performance fee on profits generated. There are no subscription fees or hidden costs. You only pay when you make money.' },
  { key: '4', question: 'Which exchanges are supported?', answer: 'We support all major exchanges including Binance, Coinbase, Kraken, KuCoin, OKX, Bybit, and many more. We are continuously adding new exchanges to our platform.' },
  { key: '5', question: 'How do I get started with NEURAL TECHNOLOGY?', answer: 'Simply click the "GET STARTED" button, complete the registration form, connect your exchange APIs, and you can begin arbitrage trading immediately. Our team provides onboarding support.' }
];

const partners = [
  { name: 'MetaMask', icon: <RobotOutlined /> },
  { name: 'Chainlink', icon: <ThunderboltOutlined /> },
  { name: 'Uniswap', icon: <ApiOutlined /> },
  { name: 'Aave', icon: <DatabaseOutlined /> },
  { name: 'Security', icon: <SecurityScanOutlined /> },
  { name: 'Cloud', icon: <CloudOutlined /> }
];

const roadmapItems = [
  { color: '#722ed1', children: 'Q1 2024 - Platform Launch & Beta Testing' },
  { color: '#13c2c2', children: 'Q2 2024 - Multi-Exchange Integration' },
  { color: '#52c41a', children: 'Q3 2024 - Advanced AI Algorithms' },
  { color: '#faad14', children: 'Q4 2024 - Institutional Features' }
];

export default function PortalHome() {
  const [form] = Form.useForm();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a2e] via-[#2d1b4e] to-[#1a0a2e]">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-50 backdrop-blur-lg bg-black/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                <StarOutlined className="text-white text-lg" />
              </div>
            </div>
            <Button type="primary" className="bg-gradient-to-r from-purple-600 to-pink-600 border-0 px-6">
              Registration here
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Hero区域 */}
        <div className="relative mb-16">
          <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{
            backgroundImage: 'linear-gradient(135deg, rgba(114,46,209,0.2), rgba(168,85,247,0.1))'
          }} />
          <div className="relative py-20">
            <Row align="middle" gutter={[48, 32]}>
              <Col xs={24} lg={12}>
                <Title className="text-white text-4xl md:text-6xl font-bold mb-4" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                  NEURAL TECHNOLOGY
                </Title>
                <Title level={2} className="text-white text-2xl md:text-3xl font-light mb-8" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                  FOR ARBITRAGE TRADING IN THE CRYPTO INDUSTRY
                </Title>
                <Button size="large" className="bg-gradient-to-r from-purple-600 to-pink-600 border-0 text-white px-12 py-6 text-lg">
                  GET STARTED
                </Button>
              </Col>
              <Col xs={24} lg={12} className="text-center">
                <div className="inline-block bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10">
                  {/* 空占位，模拟右侧内容 */}
                </div>
              </Col>
            </Row>

            {/* 统计数据 */}
            <Row gutter={[32, 16]} className="mt-12">
              <Col xs={12} md={6}>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">1639</div>
                  <div className="text-white/70 text-sm">Active users</div>
                </div>
              </Col>
              <Col xs={12} md={6}>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">$542</div>
                  <div className="text-white/70 text-sm">Total trades</div>
                </div>
              </Col>
              <Col xs={12} md={6}>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">$20K+</div>
                  <div className="text-white/70 text-sm">Volume</div>
                </div>
              </Col>
              <Col xs={12} md={6}>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">$10.8M</div>
                  <div className="text-white/70 text-sm">Total profit</div>
                </div>
              </Col>
            </Row>
          </div>
        </div>

        {/* Our Features */}
        <div className="mb-16">
          <Title level={2} className="text-white text-center mb-8">Our Features</Title>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <Card className="bg-white/5 backdrop-blur-lg border-white/10 rounded-2xl hover:border-purple-500/30 transition-all h-full">
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600/30 to-pink-600/30 flex items-center justify-center mx-auto mb-4">
                    <TeamOutlined className="text-3xl text-purple-400" />
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-2">Broker</h3>
                  <p className="text-white/60 text-sm">Connect to all major exchanges</p>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card className="bg-white/5 backdrop-blur-lg border-white/10 rounded-2xl hover:border-purple-500/30 transition-all h-full">
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600/30 to-pink-600/30 flex items-center justify-center mx-auto mb-4">
                    <SafetyOutlined className="text-3xl text-purple-400" />
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-2">Arbitration</h3>
                  <p className="text-white/60 text-sm">Automatic price monitoring</p>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card className="bg-white/5 backdrop-blur-lg border-white/10 rounded-2xl hover:border-purple-500/30 transition-all h-full">
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600/30 to-pink-600/30 flex items-center justify-center mx-auto mb-4">
                    <BarChartOutlined className="text-3xl text-purple-400" />
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-2">Analytics</h3>
                  <p className="text-white/60 text-sm">Real-time performance data</p>
                </div>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Arbitration details */}
        <div className="mb-16">
          <Title level={2} className="text-white text-center mb-8">Arbitration details</Title>
          <Card className="bg-white/5 backdrop-blur-lg border-white/10 rounded-2xl">
            <Table
              dataSource={arbitrationData}
              pagination={false}
              columns={[
                { title: 'Pair', dataIndex: 'pair', key: 'pair', render: (text) => <span className="text-white">{text}</span> },
                { title: 'Exchange 1', dataIndex: 'exchange1', key: 'exchange1', render: (text) => <span className="text-white/80">{text}</span> },
                { title: 'Exchange 2', dataIndex: 'exchange2', key: 'exchange2', render: (text) => <span className="text-white/80">{text}</span> },
                { title: 'Price 1', dataIndex: 'price1', key: 'price1', render: (text) => <span className="text-danger">{text}</span> },
                { title: 'Price 2', dataIndex: 'price2', key: 'price2', render: (text) => <span className="text-green-400">{text}</span> },
                { title: 'Spread', dataIndex: 'spread', key: 'spread', render: (text) => <span className="text-purple-400 font-semibold">{text}</span> },
                { title: 'Volume', dataIndex: 'volume', key: 'volume', render: (text) => <span className="text-white/80">{text}</span> },
                { title: 'Profit', dataIndex: 'profit', key: 'profit', render: (text) => <span className="text-green-400 font-semibold">{text}</span> }
              ]}
              rowClassName="hover:bg-white/5 transition-colors"
            />
          </Card>
          <div className="text-center mt-8">
            <Button type="primary" className="bg-gradient-to-r from-purple-600 to-pink-600 border-0">
              Start trading
            </Button>
          </div>
        </div>

        {/* For investors & One Day Token */}
        <div className="mb-16">
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-white/10 rounded-2xl h-full">
                <Title level={3} className="text-white mb-4">For Investors</Title>
                <Paragraph className="text-white/70">
                  Professional arbitrage opportunities with institutional-grade execution and transparent reporting.
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card className="bg-gradient-to-br from-pink-900/30 to-purple-900/30 border-white/10 rounded-2xl h-full">
                <Title level={3} className="text-white mb-4">One Day Token</Title>
                <Paragraph className="text-white/70">
                  Native token providing utility, governance, and additional profit sharing opportunities.
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Our partners */}
        <div className="mb-16">
          <Title level={2} className="text-white text-center mb-8">Our partners</Title>
          <Row gutter={[16, 16]} justify="center">
            {partners.map((partner, index) => (
              <Col xs={12} md={8} lg={4} key={index}>
                <Card className="bg-white/5 backdrop-blur-lg border-white/10 rounded-2xl text-center py-8 hover:border-purple-500/30 transition-all">
                  <div className="text-4xl text-purple-400 mb-4">{partner.icon}</div>
                  <div className="text-white/80">{partner.name}</div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* Roadmap */}
        <div className="mb-16">
          <Title level={2} className="text-white mb-8">Roadmap</Title>
          <Card className="bg-white/5 backdrop-blur-lg border-white/10 rounded-2xl">
            <Timeline
              mode="left"
              items={roadmapItems.map((item, index) => ({
                color: item.color,
                children: <div className="py-2"><span className="text-white">{item.children}</span></div>
              }))}
            />
          </Card>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <Title level={2} className="text-white text-center mb-8">FAQ</Title>
          <Collapse
            ghost
            className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden"
            items={faqItems.map(item => ({
              key: item.key,
              label: <span className="text-white">{item.question}</span>,
              children: <p className="text-white/70">{item.answer}</p>
            }))}
          />
        </div>

        {/* Company Registration */}
        <div className="mb-16">
          <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-white/10 rounded-2xl">
            <Title level={3} className="text-white mb-2">Company registration</Title>
            <Form form={form} layout="vertical">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Form.Item name="name">
                    <Input placeholder="Name" className="bg-white/10 border-white/20 text-white placeholder-white/50" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="email">
                    <Input placeholder="Email" className="bg-white/10 border-white/20 text-white placeholder-white/50" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="country">
                    <Select placeholder="Country" className="w-full" style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }}>
                      <Option value="cn">China</Option>
                      <Option value="us">United States</Option>
                      <Option value="uk">United Kingdom</Option>
                      <Option value="jp">Japan</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <div className="flex gap-4 justify-center">
                <Button type="primary" className="bg-gradient-to-r from-purple-600 to-pink-600 border-0 px-8">
                  Send request
                </Button>
                <Button className="bg-white/10 border-white/20 text-white px-8">
                  FAQ
                </Button>
              </div>
            </Form>
          </Card>
        </div>

        {/* 页脚 */}
        <Divider className="border-white/10" />
        <div className="py-8">
          <Row gutter={[32, 32]}>
            <Col xs={24} md={8}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                  <StarOutlined className="text-white" />
                </div>
                <span className="text-lg font-bold text-white">NEURAL</span>
              </div>
              <p className="text-white/60 text-sm mb-4">
                Building the future of crypto arbitrage
              </p>
              <div className="flex gap-4">
                {['Twitter', 'Telegram', 'Discord', 'Medium', 'Github'].map((social, idx) => (
                  <div key={idx} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 cursor-pointer hover:bg-white/20 hover:text-white">
                    {social.charAt(0)}
                  </div>
                ))}
              </div>
            </Col>
            <Col xs={12} md={4}>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Arbitration</a></li>
                <li><a href="#" className="hover:text-white">Partners</a></li>
                <li><a href="#" className="hover:text-white">Roadmap</a></li>
              </ul>
            </Col>
            <Col xs={12} md={4}>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
              </ul>
            </Col>
            <Col xs={12} md={4}>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Disclaimer</a></li>
                <li><a href="#" className="hover:text-white">Cookies</a></li>
              </ul>
            </Col>
            <Col xs={12} md={4}>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </Col>
          </Row>
          
          <div className="border-t border-white/10 mt-8 pt-6 text-center">
            <p className="text-white/40 text-sm">
              © 2024 NEURAL TECHNOLOGY. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
