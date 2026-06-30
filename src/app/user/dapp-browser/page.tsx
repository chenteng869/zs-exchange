'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Button,
  Space,
  Tag,
  Modal,
  message,
  Input,
  Select,
  Tabs,
  Card,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RightOutlined,
  XOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const DAPP_CATEGORY_MAP = {
  defi: { color: 'blue', text: 'DeFi' },
  nft: { color: 'purple', text: 'NFT' },
  gaming: { color: 'green', text: '娓告垙' },
  social: { color: 'cyan', text: '绀句氦' },
  tool: { color: 'orange', text: '宸ュ叿' },
};

const RISK_LEVEL_MAP = {
  low: { color: 'green', text: '瀹夊叏' },
  medium: { color: 'orange', text: '涓瓑' },
  high: { color: 'red', text: '鍗遍櫓' },
};

export default function DAppBrowserPage() {
  const [activeTab, setActiveTab] = useState('explore');
  const [urlInput, setUrlInput] = useState('');
  const [selectedDApp, setSelectedDApp] = useState<any>(null);
  const [connectModalVisible, setConnectModalVisible] = useState(false);
  const [browserUrl, setBrowserUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentDApps, setRecentDApps] = useState<any[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const featuredDApps = [
    {
      id: 'uniswap',
      name: 'Uniswap',
      description: 'Decentralized exchange with multi-token swaps',
      url: 'https://app.uniswap.org',
      category: 'defi',
      riskLevel: 'low',
      icon: 'https://app.uniswap.org/favicon.ico',
      users: '125K+',
    },
    {
      id: 'opensea',
      name: 'OpenSea',
      description: '鍏ㄧ悆鏈€澶х殑NFT甯傚満',
      url: 'https://opensea.io',
      category: 'nft',
      riskLevel: 'low',
      icon: 'https://opensea.io/favicon.ico',
      users: '89K+',
    },
    {
      id: 'aave',
      name: 'Aave',
      description: '鍘讳腑蹇冨寲鍊熻捶鍗忚',
      url: 'https://app.aave.com',
      category: 'defi',
      riskLevel: 'low',
      icon: 'https://app.aave.com/favicon.ico',
      users: '45K+',
    },
    {
      id: 'makerdao',
      name: 'MakerDAO',
      description: 'Decentralized stablecoin protocol',
      url: 'https://makerdao.com',
      category: 'defi',
      riskLevel: 'low',
      icon: 'https://makerdao.com/favicon.ico',
      users: '32K+',
    },
    {
      id: 'decentraland',
      name: 'Decentraland',
      description: '铏氭嫙涓栫晫骞冲彴',
      url: 'https://decentraland.org',
      category: 'gaming',
      riskLevel: 'medium',
      icon: 'https://decentraland.org/favicon.ico',
      users: '28K+',
    },
    {
      id: 'ens',
      name: 'ENS',
      description: 'Ethereum name service',
      url: 'https://app.ens.domains',
      category: 'tool',
      riskLevel: 'low',
      icon: 'https://app.ens.domains/favicon.ico',
      users: '56K+',
    },
  ];

  const categories = [
    { key: 'defi', label: 'DeFi', count: 156 },
    { key: 'nft', label: 'NFT', count: 89 },
    { key: 'gaming', label: '娓告垙', count: 67 },
    { key: 'social', label: '绀句氦', count: 34 },
    { key: 'tool', label: '宸ュ叿', count: 45 },
  ];

  useEffect(() => {
    const saved = localStorage.getItem('recentDApps');
    if (saved) {
      setRecentDApps(JSON.parse(saved));
    }
  }, []);

  const handleVisitDApp = async (dapp: any) => {
    setSelectedDApp(dapp);
    setConnectModalVisible(true);
  };

  const handleConnect = async () => {
    setConnectModalVisible(false);
    setIsLoading(true);
    setBrowserUrl(selectedDApp.url);
    
    const newRecent = [{ ...selectedDApp, visitedAt: Date.now() }, ...recentDApps.filter(d => d.id !== selectedDApp.id)].slice(0, 10);
    setRecentDApps(newRecent);
    localStorage.setItem('recentDApps', JSON.stringify(newRecent));
    
    setTimeout(() => setIsLoading(false), 1500);
  };

  const handleUrlSubmit = () => {
    if (!urlInput.startsWith('http')) {
      setUrlInput(`https://${urlInput}`);
    }
    setSelectedDApp({
      id: 'custom',
      name: urlInput,
      description: '鑷畾涔塂App',
      url: urlInput.startsWith('http') ? urlInput : `https://${urlInput}`,
      category: 'tool',
      riskLevel: 'medium',
      icon: null,
      users: '鏈煡',
    });
    setConnectModalVisible(true);
  };

  const handleCloseBrowser = () => {
    setBrowserUrl('');
    setSelectedDApp(null);
  };

  const tabs = [
    { key: 'explore', label: '鎺㈢储', icon: <SearchOutlined /> },
    { key: 'recent', label: 'Recent', icon: <ClockCircleOutlined /> },
    { key: 'browser', label: 'Browser', icon: <ExportOutlined /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1220] via-[#0F1830] to-[#0B1220]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">DApp Browser</h1>
            <p className="text-gray-400">瀹夊叏娴忚鍘讳腑蹇冨寲搴旂敤</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />}>
            娣诲姞DApp
          </Button>
        </div>

        <div className="bg-[#0F1830] rounded-xl p-4 mb-8">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <SearchOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="杈撳叆DApp URL鎴栨悳绱㈠悕绉?.."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onPressEnter={handleUrlSubmit}
                className="pl-12 bg-[#1E293B] border-[#334155] text-white placeholder:text-gray-500 h-12"
              />
            </div>
            <Button type="primary" onClick={handleUrlSubmit} className="h-12 px-8">
              璁块棶
            </Button>
          </div>
        </div>

        {browserUrl ? (
          <Card className="bg-[#0F1830] border-[#1E293B]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                {selectedDApp?.icon ? (
                  <img src={selectedDApp.icon} alt={selectedDApp.name} className="w-8 h-8 rounded" />
                ) : (
                  <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                    <ExportOutlined className="text-gray-400" />
                  </div>
                )}
                <div>
                  <div className="text-white font-medium">{selectedDApp?.name}</div>
                  <div className="text-gray-400 text-sm">{browserUrl}</div>
                </div>
                <Tag color={selectedDApp ? RISK_LEVEL_MAP[selectedDApp.riskLevel as keyof typeof RISK_LEVEL_MAP].color : 'default'}>
                  {selectedDApp ? RISK_LEVEL_MAP[selectedDApp.riskLevel as keyof typeof RISK_LEVEL_MAP].text : 'Unknown'}
                </Tag>
              </div>
              <Button type="text" icon={<XOutlined />} onClick={handleCloseBrowser} className="text-gray-400 hover:text-white">
                鍏抽棴
              </Button>
            </div>
            <div className="relative bg-white rounded-lg overflow-hidden" style={{ height: '600px' }}>
              {isLoading && (
                <div className="absolute inset-0 bg-white flex items-center justify-center z-10">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <span className="text-gray-500">鍔犺浇涓?..</span>
                  </div>
                </div>
              )}
              <iframe
                ref={iframeRef}
                src={browserUrl}
                className="w-full h-full border-0"
                title={selectedDApp?.name}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
          </Card>
        ) : (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabs}
            className="text-white"
            tabBarStyle={{ borderBottom: '1px solid #1E293B' }}
          >
            {activeTab === 'explore' && (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                  {categories.map((cat) => (
                    <Card
                      key={cat.key}
                      className="bg-[#0F1830] border-[#1E293B] cursor-pointer hover:border-[#1677FF] transition-colors"
                      onClick={() => message.info(`鏌ョ湅${cat.label}鍒嗙被`)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{cat.label}</span>
                        <RightOutlined className="text-gray-400" />
                      </div>
                      <div className="text-gray-400 text-sm mt-1">{cat.count} 涓狣App</div>
                    </Card>
                  ))}
                </div>

                <h2 className="text-xl font-bold text-white mb-4">绮鹃€塂App</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredDApps.map((dapp) => (
                    <Card
                      key={dapp.id}
                      className="bg-[#0F1830] border-[#1E293B] hover:border-[#1677FF] transition-all hover:-translate-y-1"
                      bodyStyle={{ padding: '16px' }}
                    >
                      <div className="flex items-start gap-4">
                        {dapp.icon ? (
                          <img src={dapp.icon} alt={dapp.name} className="w-12 h-12 rounded-lg" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                            <ExportOutlined className="text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-bold">{dapp.name}</span>
                            <Tag color={RISK_LEVEL_MAP[dapp.riskLevel as keyof typeof RISK_LEVEL_MAP].color}>
                              {RISK_LEVEL_MAP[dapp.riskLevel as keyof typeof RISK_LEVEL_MAP].text}
                            </Tag>
                          </div>
                          <p className="text-gray-400 text-sm mb-2 line-clamp-2">{dapp.description}</p>
                          <div className="flex items-center justify-between">
                            <Tag color={DAPP_CATEGORY_MAP[dapp.category as keyof typeof DAPP_CATEGORY_MAP].color}>
                              {DAPP_CATEGORY_MAP[dapp.category as keyof typeof DAPP_CATEGORY_MAP].text}
                            </Tag>
                            <span className="text-gray-400 text-xs">{dapp.users} 鐢ㄦ埛</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        type="primary"
                        block
                        className="mt-4"
                        onClick={() => handleVisitDApp(dapp)}
                      >
                        璁块棶
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'recent' && (
              <div>
                {recentDApps.length > 0 ? (
                  <div className="space-y-4">
                    {recentDApps.map((dapp) => (
                      <Card
                        key={dapp.id}
                        className="bg-[#0F1830] border-[#1E293B] hover:border-[#1677FF] transition-colors"
                        bodyStyle={{ padding: '12px 16px' }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {dapp.icon ? (
                              <img src={dapp.icon} alt={dapp.name} className="w-10 h-10 rounded" />
                            ) : (
                              <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                                <ExportOutlined className="text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="text-white font-medium">{dapp.name}</div>
                              <div className="text-gray-400 text-sm">{dapp.url}</div>
                            </div>
                          </div>
                          <Space>
                            <span className="text-gray-500 text-sm">
                              {dayjs(dapp.visitedAt).format('MM-DD HH:mm')}
                            </span>
                            <Button type="primary" onClick={() => handleVisitDApp(dapp)}>
                              璁块棶
                            </Button>
                          </Space>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ExportOutlined className="text-gray-500 text-6xl mb-4" />
                    <p className="text-gray-400">No recent visits</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'browser' && (
              <div className="text-center py-12">
                <ExportOutlined className="text-gray-500 text-6xl mb-4" />
                <p className="text-gray-400">Enter a URL or choose a DApp to start browsing</p>
              </div>
            )}
          </Tabs>
        )}

        <Modal
          title="杩炴帴閽卞寘"
          open={connectModalVisible}
          onCancel={() => setConnectModalVisible(false)}
          footer={null}
          width={500}
        >
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              {selectedDApp?.icon ? (
                <img src={selectedDApp.icon} alt={selectedDApp.name} className="w-16 h-16 rounded-lg" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                  <ExportOutlined className="text-gray-400" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold">{selectedDApp?.name}</h3>
                <p className="text-gray-500 text-sm">{selectedDApp?.url}</p>
                <Tag color={selectedDApp ? RISK_LEVEL_MAP[selectedDApp.riskLevel as keyof typeof RISK_LEVEL_MAP].color : 'default'}>
                  {selectedDApp ? RISK_LEVEL_MAP[selectedDApp.riskLevel as keyof typeof RISK_LEVEL_MAP].text : 'Unknown'}
                </Tag>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <SafetyCertificateOutlined className="text-blue-500" />
                <span className="font-medium">鏉冮檺璇锋眰</span>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircleOutlined className="text-green-500" />
                  <span>璁块棶璐︽埛鍦板潃 (eth_accounts)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleOutlined className="text-green-500" />
                  <span>鍙戦€佷氦鏄?(eth_sendTransaction)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleOutlined className="text-green-500" />
                  <span>绛惧悕娑堟伅 (eth_sign)</span>
                </li>
              </ul>
            </div>

            {selectedDApp?.riskLevel === 'high' && (
              <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                <div className="flex items-center gap-2 text-red-600">
                  <WarningOutlined />
                  <span className="font-medium">瀹夊叏璀﹀憡</span>
                </div>
                <p className="text-red-500 text-sm mt-2">This DApp is high risk. Please proceed carefully.</p>
              </div>
            )}

            <div className="flex gap-4">
              <Button type="default" onClick={() => setConnectModalVisible(false)} className="flex-1">
                鍙栨秷
              </Button>
              <Button type="primary" onClick={handleConnect} className="flex-1">
                杩炴帴閽卞寘
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
