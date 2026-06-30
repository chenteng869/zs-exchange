'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  User,
  Wallet,
  FileText,
  Shield,
  Copy,
  Check,
  Plus,
  ChevronRight,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';

const DID_METHOD_MAP = {
  'did:key': { color: '#38BDF8', text: 'did:key' },
  'did:pkh': { color: '#A78BFA', text: 'did:pkh' },
  'did:web': { color: '#34D399', text: 'did:web' },
  'did:ethr': { color: '#FBBF24', text: 'did:ethr' },
};

const VC_TYPE_MAP = {
  exchange: { color: '#38BDF8', text: '交易所凭证' },
  commerce: { color: '#A78BFA', text: '跨境电商凭证' },
  gaming: { color: '#34D399', text: '游戏凭证' },
  financial: { color: '#FBBF24', text: '金融凭证' },
  enterprise: { color: '#22D3EE', text: '企业凭证' },
};

export default function H5DIDIdentityPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showBindModal, setShowBindModal] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<any>(null);

  const mockUserDID = {
    did: 'did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAA',
    method: 'did:pkh',
    controller: 'did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAA',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-20T14:22:00Z',
    verificationMethods: ['EcdsaSecp256k1VerificationKey2019'],
    status: 'active',
  };

  const mockBoundWallets = [
    {
      id: 'wb-001',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f7AAA',
      chain: 'Ethereum',
      chainId: '1',
      bindingType: 'SIWE',
      createdAt: '2024-01-15T10:30:00Z',
      expiresAt: '2024-07-15T10:30:00Z',
    },
    {
      id: 'wb-002',
      address: '0x1234567890abcdef1234567890abcdef12345678',
      chain: 'Polygon',
      chainId: '137',
      bindingType: 'CAIP-10',
      createdAt: '2024-01-16T08:15:00Z',
      expiresAt: '2025-01-16T08:15:00Z',
    },
  ];

  const mockCredentials = [
    {
      id: 'vc-001',
      type: 'exchange',
      schema: 'ExchangeUserCredential',
      issuer: 'did:web:zs-exchange.com',
      issuanceDate: '2024-01-15T10:30:00Z',
      expirationDate: '2025-01-15T10:30:00Z',
      status: 'issued',
      credentialSubject: {
        userId: 'user_001',
        level: 'VIP',
        tradingVolume: '1000000',
      },
    },
    {
      id: 'vc-002',
      type: 'financial',
      schema: 'FinancialComplianceCredential',
      issuer: 'did:web:zs-exchange.com',
      issuanceDate: '2024-01-18T09:00:00Z',
      expirationDate: '2024-12-31T23:59:59Z',
      status: 'issued',
      credentialSubject: {
        entityId: 'user_001',
        complianceStatus: 'compliant',
        jurisdiction: 'Samoa',
      },
    },
  ];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const tabs = [
    { key: 'profile', label: 'DID身份', icon: User },
    { key: 'wallets', label: '绑定钱包', icon: Wallet },
    { key: 'credentials', label: '数字凭证', icon: FileText },
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
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
          href="/h5/profile"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36 }}
        >
          <ArrowLeft size={20} color="#B4C0E0" />
        </Link>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC' }}>DID身份管理</div>
      </div>

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

      {activeTab === 'profile' && (
        <div style={{ padding: '12px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 50%, #172554 100%)',
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -40,
                right: -40,
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(56, 189, 248, 0.30) 0%, transparent 70%)',
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(56, 189, 248, 0.30)',
                }}
              >
                <User size={24} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>您的DID身份</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span
                    style={{
                      fontSize: 10,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.15)',
                      color: DID_METHOD_MAP[mockUserDID.method as keyof typeof DID_METHOD_MAP].color,
                      fontWeight: 600,
                    }}
                  >
                    {DID_METHOD_MAP[mockUserDID.method as keyof typeof DID_METHOD_MAP].text}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: 'rgba(52, 211, 153, 0.20)',
                      color: '#34D399',
                      fontWeight: 600,
                    }}
                  >
                    活跃
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 14, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.60)' }}>DID标识</span>
                <button
                  onClick={() => handleCopy(mockUserDID.did)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  {copiedText === mockUserDID.did ? (
                    <span style={{ fontSize: 10, color: '#34D399', fontWeight: 600 }}>已复制</span>
                  ) : (
                    <>
                      <Copy size={12} color="rgba(255,255,255,0.60)" />
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>复制</span>
                    </>
                  )}
                </button>
              </div>
              <div
                style={{
                  background: 'rgba(0,0,0,0.30)',
                  borderRadius: 10,
                  padding: 10,
                  fontSize: 11,
                  color: '#fff',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                }}
              >
                {mockUserDID.did}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 8,
                marginTop: 14,
                paddingTop: 14,
                borderTop: '1px solid rgba(255,255,255,0.10)',
              }}
            >
              <div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)', marginBottom: 4 }}>创建时间</div>
                <div style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>{formatDate(mockUserDID.createdAt)}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)', marginBottom: 4 }}>最后更新</div>
                <div style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>{formatDate(mockUserDID.updatedAt)}</div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
              border: '1px solid rgba(148, 163, 184, 0.12)',
              borderRadius: 16,
              padding: 14,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC', marginBottom: 12 }}>安全提示</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: 'rgba(56, 189, 248, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Shield size={16} color="#38BDF8" />
                </div>
                <div>
                  <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>保护您的私钥</div>
                  <div style={{ fontSize: 11, color: '#7B89B8', marginTop: 2 }}>DID身份由您的私钥控制，请确保私钥安全</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: 'rgba(52, 211, 153, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Shield size={16} color="#34D399" />
                </div>
                <div>
                  <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>去中心化存储</div>
                  <div style={{ fontSize: 11, color: '#7B89B8', marginTop: 2 }}>您的身份数据存储在区块链上，无需依赖中心化服务</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: 'rgba(251, 191, 36, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Shield size={16} color="#FBBF24" />
                </div>
                <div>
                  <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>授权管理</div>
                  <div style={{ fontSize: 11, color: '#7B89B8', marginTop: 2 }}>注意审核DApp的权限请求，只授权必要的权限</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'wallets' && (
        <div style={{ padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC' }}>绑定钱包</div>
            <button
              onClick={() => setShowBindModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
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
              <Plus size={14} />
              绑定新钱包
            </button>
          </div>

          {mockBoundWallets.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {mockBoundWallets.map((wallet) => (
                <div
                  key={wallet.id}
                  style={{
                    background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
                    border: '1px solid rgba(148, 163, 184, 0.12)',
                    borderRadius: 14,
                    padding: 14,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: 'rgba(167, 139, 250, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Wallet size={20} color="#A78BFA" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600, fontFamily: 'monospace' }}>
                        {wallet.address.slice(0, 8)}...{wallet.address.slice(-4)}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        <span
                          style={{
                            fontSize: 10,
                            padding: '2px 8px',
                            borderRadius: 4,
                            background: 'rgba(56, 189, 248, 0.20)',
                            color: '#38BDF8',
                            fontWeight: 600,
                          }}
                        >
                          {wallet.chain}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            padding: '2px 8px',
                            borderRadius: 4,
                            background: 'rgba(52, 211, 153, 0.20)',
                            color: '#34D399',
                            fontWeight: 600,
                          }}
                        >
                          {wallet.bindingType}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: '1px solid rgba(148, 163, 184, 0.10)',
                    }}
                  >
                    <span style={{ fontSize: 11, color: '#7B89B8' }}>过期时间</span>
                    <span style={{ fontSize: 11, color: '#F8FAFC' }}>{formatDate(wallet.expiresAt)}</span>
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
              <div style={{ fontSize: 48, color: '#7B89B8', marginBottom: 12 }}>👛</div>
              <div style={{ fontSize: 14, color: '#7B89B8', marginBottom: 14 }}>暂无绑定钱包</div>
              <button
                onClick={() => setShowBindModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 24px',
                  background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} />
                绑定钱包
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'credentials' && (
        <div style={{ padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC' }}>我的凭证</div>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
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
              <Plus size={14} />
              申请凭证
            </button>
          </div>

          {mockCredentials.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {mockCredentials.map((credential) => (
                <div
                  key={credential.id}
                  onClick={() => setSelectedCredential(credential)}
                  style={{
                    background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
                    border: '1px solid rgba(148, 163, 184, 0.12)',
                    borderRadius: 14,
                    padding: 14,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: 'rgba(56, 189, 248, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <FileText size={18} color="#38BDF8" />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 700 }}>{credential.schema}</div>
                        <span
                          style={{
                            fontSize: 10,
                            padding: '2px 8px',
                            borderRadius: 4,
                            background: `rgba(0,0,0,0.20)`,
                            color: VC_TYPE_MAP[credential.type as keyof typeof VC_TYPE_MAP].color,
                            fontWeight: 600,
                          }}
                        >
                          {VC_TYPE_MAP[credential.type as keyof typeof VC_TYPE_MAP].text}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={18} color="#7B89B8" />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#7B89B8' }}>
                    <div>
                      <span>发行日期: </span>
                      <span style={{ color: '#F8FAFC' }}>{formatDate(credential.issuanceDate)}</span>
                    </div>
                    <div>
                      <span>过期: </span>
                      <span style={{ color: '#F8FAFC' }}>{formatDate(credential.expirationDate)}</span>
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: '1px solid rgba(148, 163, 184, 0.10)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: 'rgba(52, 211, 153, 0.20)',
                        color: '#34D399',
                        fontWeight: 600,
                      }}
                    >
                      已发行
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open('https://verifier.credentials.io', '_blank');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        background: 'none',
                        border: 'none',
                        color: '#38BDF8',
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      在线验证
                      <ExternalLink size={12} />
                    </button>
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
              <div style={{ fontSize: 48, color: '#7B89B8', marginBottom: 12 }}>📄</div>
              <div style={{ fontSize: 14, color: '#7B89B8', marginBottom: 14 }}>暂无数字凭证</div>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 24px',
                  background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} />
                申请凭证
              </button>
            </div>
          )}
        </div>
      )}

      {showBindModal && (
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
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'rgba(167, 139, 250, 0.20)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Wallet size={24} color="#A78BFA" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC' }}>绑定新钱包</div>
                <div style={{ fontSize: 12, color: '#7B89B8' }}>将钱包地址绑定到您的DID身份</div>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#7B89B8', marginBottom: 6 }}>选择链</div>
              <select
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(148, 163, 184, 0.08)',
                  border: '1px solid rgba(148, 163, 184, 0.15)',
                  borderRadius: 12,
                  color: '#F8FAFC',
                  fontSize: 14,
                  outline: 'none',
                }}
              >
                <option value="ethereum">Ethereum</option>
                <option value="polygon">Polygon</option>
                <option value="bsc">BSC</option>
                <option value="arbitrum">Arbitrum</option>
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#7B89B8', marginBottom: 6 }}>钱包地址</div>
              <input
                type="text"
                placeholder="0x..."
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(148, 163, 184, 0.08)',
                  border: '1px solid rgba(148, 163, 184, 0.15)',
                  borderRadius: 12,
                  color: '#F8FAFC',
                  fontSize: 14,
                  fontFamily: 'monospace',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div
              style={{
                background: 'rgba(56, 189, 248, 0.10)',
                border: '1px solid rgba(56, 189, 248, 0.20)',
                borderRadius: 10,
                padding: 12,
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Shield size={14} color="#38BDF8" />
                <span style={{ fontSize: 12, color: '#38BDF8', fontWeight: 600 }}>安全提示</span>
              </div>
              <div style={{ fontSize: 11, color: '#7B89B8' }}>绑定钱包需要进行签名验证，请确保在安全环境下操作</div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowBindModal(false)}
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
                onClick={() => setShowBindModal(false)}
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
                确认绑定
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedCredential && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.70)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              background: '#131E45',
              borderRadius: 20,
              padding: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC' }}>凭证详情</div>
              <button
                onClick={() => setSelectedCredential(null)}
                style={{ width: 32, height: 32, background: 'rgba(148, 163, 184, 0.10)', border: 'none', borderRadius: 8, color: '#7B89B8', fontSize: 20, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                background: 'rgba(56, 189, 248, 0.10)',
                border: '1px solid rgba(56, 189, 248, 0.20)',
                borderRadius: 12,
                padding: 12,
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: 'rgba(56, 189, 248, 0.20)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileText size={20} color="#38BDF8" />
                </div>
                <div>
                  <div style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 700 }}>{selectedCredential.schema}</div>
                  <span
                    style={{
                      fontSize: 10,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: `rgba(0,0,0,0.20)`,
                      color: VC_TYPE_MAP[selectedCredential.type as keyof typeof VC_TYPE_MAP].color,
                      fontWeight: 600,
                    }}
                  >
                    {VC_TYPE_MAP[selectedCredential.type as keyof typeof VC_TYPE_MAP].text}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#7B89B8' }}>发行者</span>
                <span style={{ fontSize: 12, color: '#F8FAFC', fontFamily: 'monospace' }}>{selectedCredential.issuer}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#7B89B8' }}>发行日期</span>
                <span style={{ fontSize: 12, color: '#F8FAFC' }}>{formatDate(selectedCredential.issuanceDate)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#7B89B8' }}>过期日期</span>
                <span style={{ fontSize: 12, color: '#F8FAFC' }}>{formatDate(selectedCredential.expirationDate)}</span>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(148, 163, 184, 0.05)',
                border: '1px solid rgba(148, 163, 184, 0.10)',
                borderRadius: 10,
                padding: 12,
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 12, color: '#7B89B8', marginBottom: 8 }}>凭证主题</div>
              <div style={{ fontSize: 12, color: '#F8FAFC', fontFamily: 'monospace' }}>
                {JSON.stringify(selectedCredential.credentialSubject, null, 2)}
              </div>
            </div>

            <button
              onClick={() => setSelectedCredential(null)}
              style={{
                width: '100%',
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
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}