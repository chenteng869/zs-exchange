import { useState, useEffect } from 'react';
import { DepositQRCode, DepositHistory } from '../components';
import { getDepositAddress, listDeposits } from '../api/deposit.api';
import { DepositAddress, DepositRecord, ChainOption, AssetOption } from '../types/transfer.types';

interface Props {
  userId: string;
  chains: ChainOption[];
  assets: AssetOption[];
}

export function DepositPage({ userId, chains, assets }: Props) {
  const [selectedChain, setSelectedChain] = useState<ChainOption | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<AssetOption | null>(null);
  const [address, setAddress] = useState<DepositAddress | null>(null);
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filteredAssets = selectedChain
    ? assets.filter((a) => a.chainType === selectedChain.chainType && a.chainId === selectedChain.chainId && a.depositEnabled)
    : [];

  useEffect(() => {
    if (chains.length > 0) {
      setSelectedChain(chains[0]);
    }
  }, [chains]);

  useEffect(() => {
    if (selectedChain && filteredAssets.length > 0) {
      setSelectedAsset(filteredAssets[0]);
    }
  }, [selectedChain, filteredAssets]);

  useEffect(() => {
    if (selectedChain && selectedAsset) {
      fetchAddress();
    }
  }, [selectedChain, selectedAsset]);

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchAddress = async () => {
    if (!selectedChain || !selectedAsset) return;
    setLoading(true);
    setError('');
    try {
      const result = await getDepositAddress({
        userId,
        chainType: selectedChain.chainType,
        chainId: selectedChain.chainId,
      });
      setAddress(result);
    } catch (err) {
      setError((err as Error).message || '获取地址失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeposits = async () => {
    try {
      const result = await listDeposits({ userId, pageSize: 10 });
      setDeposits(result.items);
    } catch (err) {
      console.error('获取充值记录失败:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto p-4">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">充值</h1>
          <p className="text-gray-500 text-sm mt-1">选择链和资产，获取充值地址</p>
        </header>

        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">链</label>
                <select
                  value={selectedChain ? `${selectedChain.chainType}-${selectedChain.chainId}` : ''}
                  onChange={(e) => {
                    const [chainType, chainId] = e.target.value.split('-');
                    const chain = chains.find((c) => c.chainType === chainType && c.chainId === chainId);
                    setSelectedChain(chain || null);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">请选择链</option>
                  {chains.filter((c) => c.enabled).map((chain) => (
                    <option key={`${chain.chainType}-${chain.chainId}`} value={`${chain.chainType}-${chain.chainId}`}>
                      {chain.chainName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">资产</label>
                <select
                  value={selectedAsset?.assetSymbol || ''}
                  onChange={(e) => {
                    const asset = filteredAssets.find((a) => a.assetSymbol === e.target.value);
                    setSelectedAsset(asset || null);
                  }}
                  disabled={!selectedChain}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="">请选择资产</option>
                  {filteredAssets.map((asset) => (
                    <option key={asset.assetSymbol} value={asset.assetSymbol}>
                      {asset.assetSymbol}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-xl p-8 shadow-sm flex items-center justify-center">
              <span className="text-gray-400">加载中...</span>
            </div>
          ) : address ? (
            <DepositQRCode address={address} />
          ) : (
            <div className="bg-white rounded-xl p-8 shadow-sm flex items-center justify-center">
              <span className="text-gray-400">请选择链和资产</span>
            </div>
          )}

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">充值记录</h3>
            <DepositHistory records={deposits} />
          </div>
        </div>
      </div>
    </div>
  );
}