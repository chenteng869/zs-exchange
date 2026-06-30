import { useState, useEffect } from 'react';
import { ChainOption, AssetOption, WithdrawQuote } from '../types/transfer.types';
import { quoteWithdraw, createWithdraw } from '../api/withdraw.api';
import { isValidAddress } from '../utils/address';
import { riskLevelText, riskLevelColor } from '../utils/status';

interface Props {
  chains: ChainOption[];
  assets: AssetOption[];
  userId: string;
}

export function WithdrawForm({ chains, assets, userId }: Props) {
  const [selectedChain, setSelectedChain] = useState<ChainOption | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<AssetOption | null>(null);
  const [amount, setAmount] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [memo, setMemo] = useState('');
  const [quote, setQuote] = useState<WithdrawQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const filteredAssets = selectedChain
    ? assets.filter((a) => a.chainType === selectedChain.chainType && a.chainId === selectedChain.chainId && a.withdrawEnabled)
    : [];

  useEffect(() => {
    if (selectedChain && chains.length > 0 && !chains.find((c) => c.chainType === selectedChain.chainType && c.chainId === selectedChain.chainId)) {
      setSelectedChain(chains[0]);
    }
  }, [chains]);

  useEffect(() => {
    setQuote(null);
    setError('');
  }, [selectedChain, selectedAsset, amount, toAddress]);

  const handleQuote = async () => {
    if (!selectedChain || !selectedAsset || !amount || !toAddress) {
      setError('请填写完整信息');
      return;
    }

    if (!isValidAddress(toAddress, selectedChain.chainType)) {
      setError('请输入有效的提币地址');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await quoteWithdraw({
        chainType: selectedChain.chainType,
        chainId: selectedChain.chainId,
        assetSymbol: selectedAsset.assetSymbol,
        contractAddress: selectedAsset.contractAddress,
        amount,
        toAddress,
      });
      setQuote(result);
    } catch (err) {
      setError((err as Error).message || '获取报价失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!quote) return;

    setSubmitting(true);
    try {
      const result = await createWithdraw({
        userId,
        chainType: selectedChain!.chainType,
        chainId: selectedChain!.chainId,
        toAddress,
        assetSymbol: selectedAsset!.assetSymbol,
        contractAddress: selectedAsset!.contractAddress,
        amount,
        idempotencyKey: crypto.randomUUID(),
      });
      alert(`提币申请已提交，单号: ${result.withdrawNo}`);
      setAmount('');
      setToAddress('');
      setMemo('');
      setQuote(null);
    } catch (err) {
      setError((err as Error).message || '提币失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">提币</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">链</label>
          <select
            value={selectedChain ? `${selectedChain.chainType}-${selectedChain.chainId}` : ''}
            onChange={(e) => {
              const [chainType, chainId] = e.target.value.split('-');
              const chain = chains.find((c) => c.chainType === chainType && c.chainId === chainId);
              setSelectedChain(chain || null);
              setSelectedAsset(null);
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">提币地址</label>
          <input
            type="text"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            placeholder="请输入提币地址"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {selectedChain?.chainType === 'solana' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Memo</label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="选填"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">提币数量</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`最小提币: ${selectedAsset?.minWithdrawAmount || 0}`}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          onClick={handleQuote}
          disabled={loading || !selectedChain || !selectedAsset || !amount || !toAddress}
          className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? '获取报价中...' : '获取报价'}
        </button>

        {quote && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-sm">提币金额</p>
                <p className="font-semibold text-gray-900">{quote.amount} {selectedAsset?.assetSymbol}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">手续费</p>
                <p className="font-semibold text-gray-900">{quote.feeAmount} {selectedAsset?.assetSymbol}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">到账金额</p>
                <p className="font-semibold text-blue-600">{quote.netAmount} {selectedAsset?.assetSymbol}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">风险等级</p>
                <p className="font-semibold" style={{ color: riskLevelColor(quote.risk?.riskLevel) }}>
                  {riskLevelText(quote.risk?.riskLevel)}
                </p>
              </div>
            </div>
            {quote.risk?.reasons && quote.risk.reasons.length > 0 && (
              <div className="mt-3">
                <p className="text-gray-500 text-sm">风险提示:</p>
                <ul className="text-sm text-orange-600 mt-1">
                  {quote.risk.reasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-4 w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:bg-gray-300"
            >
              {submitting ? '提交中...' : '确认提币'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}