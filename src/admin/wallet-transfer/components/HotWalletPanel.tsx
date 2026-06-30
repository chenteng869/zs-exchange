import { useState, useEffect } from 'react';
import { HotWalletSummary } from '../types/admin.types';

export function HotWalletPanel() {
  const [wallets, setWallets] = useState<HotWalletSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHotWallets();
  }, []);

  const fetchHotWallets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/wallet/hot-wallets');
      const data = await res.json();
      if (data.success) {
        setWallets(data.data.items);
      }
    } catch (err) {
      console.error('Failed to fetch hot wallets:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    const map: Record<string, string> = {
      hot: '#DC2626',
      warm: '#D97706',
      cold: '#2563EB',
      fee: '#16A34A',
      sweep: '#7C3AED',
    };
    return map[role] || '#6B7280';
  };

  const getRoleText = (role: string) => {
    const map: Record<string, string> = {
      hot: '热钱包',
      warm: '温钱包',
      cold: '冷钱包',
      fee: '手续费钱包',
      sweep: '归集钱包',
    };
    return map[role] || role;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">热钱包看板</h2>
        <button
          onClick={fetchHotWallets}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
        >
          刷新
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-400">加载中...</div>
      ) : wallets.length === 0 ? (
        <div className="py-8 text-center text-gray-400">暂无热钱包数据</div>
      ) : (
        <div className="space-y-4">
          {wallets.map((wallet) => (
            <div key={wallet.walletNo} className="p-4 border border-gray-100 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${getRoleColor(wallet.walletRole)}15`, color: getRoleColor(wallet.walletRole) }}
                    >
                      {getRoleText(wallet.walletRole)}
                    </span>
                    <span className="text-gray-500 text-xs">{wallet.assetSymbol}</span>
                  </div>
                  <p className="font-mono text-sm text-gray-900">{wallet.address}</p>
                  <p className="text-gray-400 text-xs mt-1">链: {wallet.chainType} | {wallet.chainId}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold text-gray-900">{wallet.balance}</p>
                  <p className="text-gray-400 text-xs mt-1">可用: {wallet.availableBalance}</p>
                  <p className="text-gray-400 text-xs">锁定: {wallet.lockedBalance}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}