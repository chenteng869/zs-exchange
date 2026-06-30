'use client';

import { useState } from 'react';
import {
  Button,
  Space,
  Tag,
  Modal,
  message,
  Tabs,
  Card,
  Descriptions,
  Divider,
  Input,
  Select,
} from 'antd';
import {
  UserOutlined,
  WalletOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  CopyOutlined,
  CheckOutlined,
  PlusOutlined,
  ExportOutlined,
  RightOutlined,
  EditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const DID_METHOD_MAP = {
  'did:key': { color: 'blue', text: 'did:key' },
  'did:pkh': { color: 'purple', text: 'did:pkh' },
  'did:web': { color: 'green', text: 'did:web' },
  'did:ethr': { color: 'orange', text: 'did:ethr' },
};

const VC_TYPE_MAP = {
  exchange: { color: 'blue', text: '浜ゆ槗鎵€鍑瘉' },
  commerce: { color: 'purple', text: '璺ㄥ鐢靛晢鍑瘉' },
  gaming: { color: 'green', text: '娓告垙鍑瘉' },
  financial: { color: 'orange', text: '閲戣瀺鍑瘉' },
  enterprise: { color: 'cyan', text: '浼佷笟鍑瘉' },
};

export default function DIDIdentityPage() {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBindModal, setShowBindModal] = useState(false);

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
    { key: 'profile', label: 'DID韬唤', icon: <UserOutlined /> },
    { key: 'wallets', label: '缁戝畾閽卞寘', icon: <WalletOutlined /> },
    { key: 'credentials', label: '鏁板瓧鍑瘉', icon: <FileTextOutlined /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1220] via-[#0F1830] to-[#0B1220]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">DID韬唤绠＄悊</h1>
            <p className="text-gray-400">绠＄悊鎮ㄧ殑鍘讳腑蹇冨寲韬唤</p>
          </div>
        </div>

        <Tabs
          activeKey="profile"
          items={tabs}
          className="text-white"
          tabBarStyle={{ borderBottom: '1px solid #1E293B' }}
        >
          <div className="space-y-6 mt-6">
            <Card className="bg-[#0F1830] border-[#1E293B]">
              <div className="flex items-center gap-6 pb-6 border-b border-[#1E293B]">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <UserOutlined className="text-white text-3xl" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white mb-1">鎮ㄧ殑DID韬唤</h2>
                  <div className="flex items-center gap-2">
                    <Tag color={DID_METHOD_MAP[mockUserDID.method as keyof typeof DID_METHOD_MAP].color}>
                      {DID_METHOD_MAP[mockUserDID.method as keyof typeof DID_METHOD_MAP].text}
                    </Tag>
                    <Tag color="green">娲昏穬</Tag>
                  </div>
                </div>
                <Button type="primary" icon={<EditOutlined />}>
                  缂栬緫
                </Button>
              </div>

              <div className="py-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400">DID鏍囪瘑</span>
                  <Button
                    type="text"
                    icon={copiedText === mockUserDID.did ? <CheckOutlined /> : <CopyOutlined />}
                    onClick={() => handleCopy(mockUserDID.did)}
                    className="text-gray-400 hover:text-blue-500"
                  >
                    {copiedText === mockUserDID.did ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <div className="bg-[#1E293B] rounded-lg p-4 font-mono text-sm text-white break-all">
                  {mockUserDID.did}
                </div>
              </div>

              <Divider className="bg-[#1E293B]" />

              <Descriptions bordered column={2} className="text-white">
                <Descriptions.Item label="Controller">
                  <div className="font-mono text-sm text-gray-300">{mockUserDID.controller}</div>
                </Descriptions.Item>
                <Descriptions.Item label="鍒涘缓鏃堕棿">
                  {dayjs(mockUserDID.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item label="楠岃瘉鏂规硶">
                  {mockUserDID.verificationMethods?.join(', ')}
                </Descriptions.Item>
                <Descriptions.Item label="Last Updated">
                  {dayjs(mockUserDID.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card className="bg-[#0F1830] border-[#1E293B]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">瀹夊叏鎻愮ず</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <SafetyCertificateOutlined className="text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white font-medium">淇濇姢鎮ㄧ殑绉侀挜</div>
                    <div className="text-gray-400 text-sm">DID identity is controlled by your private key. Keep it secure.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <SafetyCertificateOutlined className="text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white font-medium">鍘讳腑蹇冨寲瀛樺偍</div>
                    <div className="text-gray-400 text-sm">Your identity data is anchored on-chain without relying on a centralized service.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <SafetyCertificateOutlined className="text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white font-medium">鎺堟潈绠＄悊</div>
                    <div className="text-gray-400 text-sm">娉ㄦ剰瀹℃牳DApp鐨勬潈闄愯姹傦紝鍙巿鏉冨繀瑕佺殑鏉冮檺</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">缁戝畾閽卞寘鍒楄〃</h2>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowBindModal(true)}>
                缁戝畾鏂伴挶鍖?              </Button>
            </div>

            {mockBoundWallets.length > 0 ? (
              <div className="space-y-4">
                {mockBoundWallets.map((wallet) => (
                  <Card
                    key={wallet.id}
                    className="bg-[#0F1830] border-[#1E293B]"
                    bodyStyle={{ padding: '16px' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                          <WalletOutlined className="text-purple-600" />
                        </div>
                        <div>
                          <div className="text-white font-medium">{wallet.address}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Tag color="blue">{wallet.chain}</Tag>
                            <Tag color="green">{wallet.bindingType}</Tag>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-400 text-sm">杩囨湡鏃堕棿</div>
                        <div className="text-white">{dayjs(wallet.expiresAt).format('YYYY-MM-DD')}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-[#0F1830] border-[#1E293B]">
                <div className="text-center py-12">
                  <WalletOutlined className="text-gray-500 text-6xl mb-4" />
                  <p className="text-gray-400">鏆傛棤缁戝畾閽卞寘</p>
                  <Button type="primary" icon={<PlusOutlined />} className="mt-4" onClick={() => setShowBindModal(true)}>
                    缁戝畾閽卞寘
                  </Button>
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">鎴戠殑鍑瘉</h2>
              <Button type="primary" icon={<PlusOutlined />}>
                鐢宠鍑瘉
              </Button>
            </div>

            {mockCredentials.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockCredentials.map((credential) => (
                  <Card
                    key={credential.id}
                    className="bg-[#0F1830] border-[#1E293B] cursor-pointer hover:border-[#1677FF] transition-colors"
                    bodyStyle={{ padding: '16px' }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <FileTextOutlined className="text-blue-500" />
                          <span className="text-white font-bold">{credential.schema}</span>
                        </div>
                        <Tag color={VC_TYPE_MAP[credential.type as keyof typeof VC_TYPE_MAP].color}>
                          {VC_TYPE_MAP[credential.type as keyof typeof VC_TYPE_MAP].text}
                        </Tag>
                      </div>
                      <RightOutlined className="text-gray-400" />
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Issuer</span>
                        <span className="text-gray-300 font-mono text-xs">{credential.issuer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">鍙戣鏃ユ湡</span>
                        <span className="text-gray-300">{dayjs(credential.issuanceDate).format('YYYY-MM-DD')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">杩囨湡鏃ユ湡</span>
                        <span className="text-gray-300">{dayjs(credential.expirationDate).format('YYYY-MM-DD')}</span>
                      </div>
                    </div>

                    <Divider className="bg-[#1E293B] my-4" />

                    <div className="flex items-center justify-between">
                      <Tag color="green">Issued</Tag>
                      <Button type="text" className="text-blue-500">
                        鏌ョ湅璇︽儏
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-[#0F1830] border-[#1E293B]">
                <div className="text-center py-12">
                  <FileTextOutlined className="text-gray-500 text-6xl mb-4" />
                  <p className="text-gray-400">鏆傛棤鏁板瓧鍑瘉</p>
                  <Button type="primary" icon={<PlusOutlined />} className="mt-4">
                    鐢宠鍑瘉
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </Tabs>

        <Modal
          title="缁戝畾閽卞寘"
          open={showBindModal}
          onCancel={() => setShowBindModal(false)}
          footer={null}
          width={500}
        >
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                <WalletOutlined className="text-purple-600 text-3xl" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Bind New Wallet</h3>
                <p className="text-gray-500 text-sm">灏嗛挶鍖呭湴鍧€缁戝畾鍒版偍鐨凞ID韬唤</p>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Select Chain</label>
              <Select
                defaultValue="ethereum"
                options={[
                  { value: 'ethereum', label: 'Ethereum' },
                  { value: 'polygon', label: 'Polygon' },
                  { value: 'bsc', label: 'BSC' },
                  { value: 'arbitrum', label: 'Arbitrum' },
                ]}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">閽卞寘鍦板潃</label>
              <Input
                placeholder="0x..."
                className="font-mono"
              />
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <SafetyCertificateOutlined />
                <span className="font-medium">瀹夊叏鎻愮ず</span>
              </div>
              <p className="text-blue-500 text-sm">
                缁戝畾閽卞寘闇€瑕佽繘琛岀鍚嶉獙璇侊紝璇风‘淇濆湪瀹夊叏鐜涓嬫搷浣?              </p>
            </div>

            <div className="flex gap-4">
              <Button type="default" onClick={() => setShowBindModal(false)} className="flex-1">
                鍙栨秷
              </Button>
              <Button type="primary" className="flex-1">
                纭缁戝畾
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
