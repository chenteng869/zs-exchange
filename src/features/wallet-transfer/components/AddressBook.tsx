import { useState } from 'react';
import { AddressBookEntry, ChainOption, AssetOption } from '../types/transfer.types';
import { addAddressBookEntry, listAddressBook, deleteAddressBookEntry } from '../api/address-book.api';
import { formatAddress, formatTime } from '../utils/format';
import { isValidAddress } from '../utils/address';

interface Props {
  userId: string;
  chains: ChainOption[];
  assets: AssetOption[];
}

export function AddressBook({ userId, chains, assets }: Props) {
  const [entries, setEntries] = useState<AddressBookEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    chainType: '',
    chainId: '',
    assetSymbol: '',
    address: '',
    label: '',
  });
  const [error, setError] = useState('');

  const loadEntries = async () => {
    setLoading(true);
    try {
      const result = await listAddressBook({ userId });
      setEntries(result.items);
    } catch (err) {
      setError((err as Error).message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.chainType || !formData.address || !formData.label) {
      setError('请填写完整信息');
      return;
    }

    if (!isValidAddress(formData.address, formData.chainType)) {
      setError('请输入有效的地址');
      return;
    }

    setLoading(true);
    try {
      await addAddressBookEntry({
        userId,
        chainType: formData.chainType,
        chainId: formData.chainId,
        assetSymbol: formData.assetSymbol,
        address: formData.address,
        label: formData.label,
      });
      setShowAddForm(false);
      setFormData({ chainType: '', chainId: '', assetSymbol: '', address: '', label: '' });
      await loadEntries();
    } catch (err) {
      setError((err as Error).message || '添加失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此地址？')) return;
    try {
      await deleteAddressBookEntry(id);
      await loadEntries();
    } catch (err) {
      setError((err as Error).message || '删除失败');
    }
  };

  const filteredAssets = formData.chainType
    ? assets.filter((a) => a.chainType === formData.chainType && a.chainId === formData.chainId)
    : [];

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">地址簿</h3>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setError('');
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
        >
          {showAddForm ? '取消' : '添加地址'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 text-sm">{error}</div>
      )}

      {showAddForm && (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">链</label>
            <select
              value={`${formData.chainType}-${formData.chainId}`}
              onChange={(e) => {
                const [chainType, chainId] = e.target.value.split('-');
                setFormData({ ...formData, chainType, chainId, assetSymbol: '' });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
              value={formData.assetSymbol}
              onChange={(e) => setFormData({ ...formData, assetSymbol: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">地址</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="请输入地址"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">标签</label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="请输入标签"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300"
          >
            {loading ? '添加中...' : '添加地址'}
          </button>
        </div>
      )}

      <div className="divide-y divide-gray-100">
        {loading && !showAddForm && (
          <div className="p-8 text-center text-gray-400">加载中...</div>
        )}
        {!loading && !showAddForm && entries.length === 0 && (
          <div className="p-8 text-center text-gray-400">暂无地址</div>
        )}
        {!loading && !showAddForm && entries.map((entry) => (
          <div key={entry.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
            <div>
              <p className="font-medium text-gray-900">{entry.label}</p>
              <p className="text-gray-400 text-sm">{formatAddress(entry.address)}</p>
              <p className="text-gray-400 text-xs">{entry.assetSymbol} · {formatTime(entry.createdAt)}</p>
            </div>
            <button
              onClick={() => handleDelete(entry.id)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              删除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}