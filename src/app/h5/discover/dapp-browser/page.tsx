'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  X,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

const DAPP_CATEGORY_MAP = {
  defi: { color: '#38BDF8', text: 'DeFi' },
  nft: { color: '#A78BFA', text: 'NFT' },
  gaming: { color: '#34D399', text: '游戏' },
  social: { color: '#22D3EE', text: '社交' },
  tool: { color: '#FBBF24', text: '工具' },
};

const RISK_LEVEL_MAP = {
  low: { color: '#34D399', text: '安全' },
  medium: { color: '#FBBF24', text: '中等' },
  high: { color: '#F472B6', text: '危险' },
};

export default function H5DAppBrowserPage() {
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
      description: '去中心化交易所，支持多种代币交易',
      url: 'https://app.uniswap.org',
      category: 'defi',
      riskLevel: 'low',
      icon: 'https://app.uniswap.org/favicon.ico',
      users: '125K+',
    },
    {
      id: 'opensea',
      name: 'OpenSea',
      description: '全球最大的NFT市场',
      url: 'https://opensea.io',
      category: 'nft',
      riskLevel: 'low',
      icon: 'https://opensea.io/favicon.ico',
      users: '89K+',
    },
    {
      id: 'aave',
      name: 'Aave',
      description: '去中心化借贷协议',
      url: 'https://app.aave.com',
      category: 'defi',
      riskLevel: 'low',
      icon: 'https://app.aave.com/favicon.ico',
      users: '45K+',
    },
    {
      id: 'makerdao',
      name: 'MakerDAO',
      description: '去中心化稳定币协议',
      url: 'https://makerdao.com',
      category: 'defi',
      riskLevel: 'low',
      icon: 'https://makerdao.com/favicon.ico',
      users: '32K+',
    },
    {
      id: 'decentraland',
      name: 'Decentraland',
      description: '虚拟世界平台',
      url: 'https://decentraland.org',
      category: 'gaming',
      riskLevel: 'medium',
      icon: 'https://decentraland.org/favicon.ico',
      users: '28K+',
    },
    {
      id: 'ens',
      name: 'ENS',
      description: '以太坊域名服务',
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
    { key: 'gaming', label: '游戏', count: 67 },
    { key: 'social', label: '社交', count: 34 },
    { key: 'tool', label: '工具', count: 45 },
  ];

  useEffect(() => {
    const saved = localStorage.getItem('h5_recentDApps');
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
    localStorage.setItem('h5_recentDApps', JSON.stringify(newRecent));

    setTimeout(() => setIsLoading(false), 1500);
  };

  const handleUrlSubmit = () => {
    const url = urlInput.startsWith('http') ? urlInput : `https://${urlInput}`;
    setSelectedDApp({
      id: 'custom',
      name: url,
      description: '自定义DApp',
      url,
      category: 'tool',
      riskLevel: 'medium',
      icon: null,
      users: '未知',
    });
    setConnectModalVisible(true);
  };

  const handleCloseBrowser = () => {
    setBrowserUrl('');
    setSelectedDApp(null);
  };

  const tabs = [
    { key: 'explore', label: '探索', icon: Search },
    { key: 'recent', label: '最近', icon: Clock },
    { key: 'browser', label: '浏览器', icon: ExternalLink },
  ];

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ paddingBottom: '20px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 14px',
          paddingTop: 'max(12px, env(safe-area-inset-top))',
          background: 'rgba(15, 27, 61, 0.92)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.10)',
        }}
      >
        <Link
          href="/h5/discover"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36 }}
        >
          <ArrowLeft size={20} color="#B4C0E0" />
        </Link>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC' }}>DApp浏览器</div>
      </div>

      <div
        style={{
          background: 'rgba(15, 27, 61, 0.95)',
          padding: '10px 14px',
          borderBottom: '1px solid rgba(148, 163, 184, 0.10)',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 8,
          }}
        >
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              background: 'rgba(148, 163, 184, 0.08)',
              border: '1px solid rgba(148, 163, 184, 0.15)',
              borderRadius: 12,
            }}
          >
            <Search size={16} color="#7B89B8" />
            <input
              type="text"
              placeholder="输入DApp URL或搜索名称..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#F8FAFC',
                fontSize: 13,
              }}
            />
          </div>
          <button
            onClick={handleUrlSubmit}
            style={{
              padding: '10px 16px',
              background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)',
              border: 'none',
              borderRadius: 12,
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            访问
          </button>
        </div>
      </div>

      {browserUrl ? (
        <div style={{ padding: '12px' }}>
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
              border: '1px solid rgba(148, 163, 184, 0.12)',
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(148, 163, 184, 0.10)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {selectedDApp?.icon ? (
                  <img src={selectedDApp.icon} alt={selectedDApp.name} style={{ width: 32, height: 32, borderRadius: 8 }} />
                ) : (
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(148, 163, 184, 0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ExternalLink size={16} color="#7B89B8" />
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 600 }}>{selectedDApp?.name}</div>
                  <div style={{ fontSize: 11, color: '#7B89B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{browserUrl}</div>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: `rgba(0,0,0,0.20)`,
                    color: RISK_LEVEL_MAP[selectedDApp?.riskLevel as keyof typeof RISK_LEVEL_MAP].color,
                    fontWeight: 600,
                  }}
                >
                  {RISK_LEVEL_MAP[selectedDApp?.riskLevel as keyof typeof RISK_LEVEL_MAP].text}
                </span>
              </div>
              <button
                onClick={handleCloseBrowser}
                style={{ width: 32, height: 32, background: 'rgba(244, 114, 182, 0.10)', border: 'none', borderRadius: 8, color: '#F472B6', fontSize: 16, cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ position: 'relative', height: '500px', background: '#fff' }}>
              {isLoading && (
                <div style={{ position: 'absolute', inset: 0, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, border: '3px solid #38BDF8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <div style={{ fontSize: 12, color: '#7B89B8', marginTop: 8 }}>加载中...</div>
                  </div>
                </div>
              )}
              <iframe
                ref={iframeRef}
                src={browserUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={selectedDApp?.name}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid rgba(148, 163, 184, 0.10)',
              padding: '0 12px',
            }}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    padding: '12px 0',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  {isActive && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        width: 24,
                        height: 2,
                        background: 'linear-gradient(90deg, #38BDF8 0%, #1E40AF 100%)',
                        borderRadius: 2,
                      }}
                    />
                  )}
                  <Icon size={18} color={isActive ? '#38BDF8' : '#7B89B8'} />
                  <span style={{ fontSize: 10, color: isActive ? '#38BDF8' : '#7B89B8', fontWeight: isActive ? 600 : 500 }}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {activeTab === 'explore' && (
            <div style={{ padding: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 16 }}>
                {categories.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => {}}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      padding: 8,
                      background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
                      border: '1px solid rgba(148, 163, 184, 0.12)',
                      borderRadius: 12,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 700 }}>{cat.label}</span>
                    <span style={{ fontSize: 10, color: '#7B89B8' }}>{cat.count}</span>
                  </button>
                ))}
              </div>

              <div style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC', marginBottom: 12 }}>精选DApp</div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {featuredDApps.map((dapp) => (
                  <div
                    key={dapp.id}
                    style={{
                      background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
                      border: '1px solid rgba(148, 163, 184, 0.12)',
                      borderRadius: 14,
                      padding: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      {dapp.icon ? (
                        <img src={dapp.icon} alt={dapp.name} style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(148, 163, 184, 0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <ExternalLink size={18} color="#7B89B8" />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 700 }}>{dapp.name}</span>
                          <span
                            style={{
                              fontSize: 8,
                              padding: '1px 6px',
                              borderRadius: 3,
                              background: `rgba(0,0,0,0.20)`,
                              color: RISK_LEVEL_MAP[dapp.riskLevel as keyof typeof RISK_LEVEL_MAP].color,
                              fontWeight: 600,
                            }}
                          >
                            {RISK_LEVEL_MAP[dapp.riskLevel as keyof typeof RISK_LEVEL_MAP].text}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: '#7B89B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dapp.description}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                          <span
                            style={{
                              fontSize: 9,
                              padding: '1px 6px',
                              borderRadius: 3,
                              background: `rgba(0,0,0,0.20)`,
                              color: DAPP_CATEGORY_MAP[dapp.category as keyof typeof DAPP_CATEGORY_MAP].color,
                              fontWeight: 600,
                            }}
                          >
                            {DAPP_CATEGORY_MAP[dapp.category as keyof typeof DAPP_CATEGORY_MAP].text}
                          </span>
                          <span style={{ fontSize: 10, color: '#7B89B8' }}>{dapp.users} 用户</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleVisitDApp(dapp)}
                      style={{
                        width: '100%',
                        padding: '8px 0',
                        background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)',
                        border: 'none',
                        borderRadius: 8,
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        marginTop: 10,
                      }}
                    >
                      访问
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'recent' && (
            <div style={{ padding: '12px' }}>
              {recentDApps.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {recentDApps.map((dapp) => (
                    <div
                      key={dapp.id}
                      style={{
                        background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
                        border: '1px solid rgba(148, 163, 184, 0.12)',
                        borderRadius: 14,
                        padding: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {dapp.icon ? (
                            <img src={dapp.icon} alt={dapp.name} style={{ width: 32, height: 32, borderRadius: 8 }} />
                          ) : (
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(148, 163, 184, 0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ExternalLink size={16} color="#7B89B8" />
                            </div>
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 600 }}>{dapp.name}</div>
                            <div style={{ fontSize: 11, color: '#7B89B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dapp.url}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                          <span style={{ fontSize: 10, color: '#7B89B8' }}>{formatDate(dapp.visitedAt)}</span>
                          <button
                            onClick={() => handleVisitDApp(dapp)}
                            style={{
                              padding: '6px 12px',
                              background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)',
                              border: 'none',
                              borderRadius: 8,
                              color: '#fff',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            访问
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
                    border: '1px solid rgba(148, 163, 184, 0.12)',
                    borderRadius: 14,
                    padding: 24,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 48, color: '#7B89B8', marginBottom: 12 }}>🌐</div>
                  <div style={{ fontSize: 14, color: '#7B89B8' }}>暂无最近访问记录</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'browser' && (
            <div style={{ padding: '12px' }}>
              <div
                style={{
                  background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
                  border: '1px solid rgba(148, 163, 184, 0.12)',
                  borderRadius: 14,
                  padding: 24,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 48, color: '#7B89B8', marginBottom: 12 }}>🌐</div>
                <div style={{ fontSize: 14, color: '#7B89B8' }}>输入URL或选择一个DApp开始浏览</div>
              </div>
            </div>
          )}
        </>
      )}

      {connectModalVisible && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.70)',
            display: 'flex',
            alignItems: 'flex-end',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              background: '#131E45',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 16,
              paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              {selectedDApp?.icon ? (
                <img src={selectedDApp.icon} alt={selectedDApp.name} style={{ width: 48, height: 48, borderRadius: 14 }} />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(148, 163, 184, 0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ExternalLink size={24} color="#7B89B8" />
                </div>
              )}
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC' }}>{selectedDApp?.name}</div>
                <div style={{ fontSize: 12, color: '#7B89B8' }}>{selectedDApp?.url}</div>
                <span
                  style={{
                    fontSize: 10,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: `rgba(0,0,0,0.20)`,
                    color: RISK_LEVEL_MAP[selectedDApp?.riskLevel as keyof typeof RISK_LEVEL_MAP].color,
                    fontWeight: 600,
                  }}
                >
                  {RISK_LEVEL_MAP[selectedDApp?.riskLevel as keyof typeof RISK_LEVEL_MAP].text}
                </span>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(148, 163, 184, 0.05)',
                border: '1px solid rgba(148, 163, 184, 0.10)',
                borderRadius: 10,
                padding: 12,
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Shield size={14} color="#38BDF8" />
                <span style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 600 }}>权限请求</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={14} color="#34D399" />
                  <span style={{ fontSize: 12, color: '#7B89B8' }}>访问账户地址 (eth_accounts)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={14} color="#34D399" />
                  <span style={{ fontSize: 12, color: '#7B89B8' }}>发送交易 (eth_sendTransaction)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={14} color="#34D399" />
                  <span style={{ fontSize: 12, color: '#7B89B8' }}>签名消息 (eth_sign)</span>
                </div>
              </div>
            </div>

            {selectedDApp?.riskLevel === 'high' && (
              <div
                style={{
                  background: 'rgba(244, 114, 182, 0.10)',
                  border: '1px solid rgba(244, 114, 182, 0.20)',
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <AlertTriangle size={14} color="#F472B6" />
                  <span style={{ fontSize: 12, color: '#F472B6', fontWeight: 600 }}>安全警告</span>
                </div>
                <div style={{ fontSize: 11, color: '#7B89B8' }}>该DApp存在高风险，请谨慎操作</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConnectModalVisible(false)}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  background: 'rgba(148, 163, 184, 0.10)',
                  border: '1px solid rgba(148, 163, 184, 0.20)',
                  borderRadius: 12,
                  color: '#F8FAFC',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={handleConnect}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)',
                  border: 'none',
                  borderRadius: 12,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                连接钱包
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}