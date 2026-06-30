import { useState, useEffect } from 'react';
import { ReconciliationRecord } from '../types/admin.types';

export function ReconciliationPanel() {
  const [records, setRecords] = useState<ReconciliationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/wallet/admin/reconciliation?status=mismatched');
      const data = await res.json();
      if (data.success) {
        setRecords(data.data.items);
      }
    } catch (err) {
      console.error('Failed to fetch reconciliation records:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: '#2563EB',
      matched: '#16A34A',
      mismatched: '#DC2626',
      resolved: '#6B7280',
      ignored: '#9CA3AF',
    };
    return map[status] || '#6B7280';
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      pending: '待核对',
      matched: '已匹配',
      mismatched: '不匹配',
      resolved: '已解决',
      ignored: '已忽略',
    };
    return map[status] || status;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">对账异常</h2>
        <button
          onClick={fetchRecords}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
        >
          刷新
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-400">加载中...</div>
      ) : records.length === 0 ? (
        <div className="py-8 text-center text-gray-400">暂无对账异常</div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <div key={record.reconcileNo} className="p-4 border border-red-100 bg-red-50 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${getStatusColor(record.status)}15`, color: getStatusColor(record.status) }}
                  >
                    {getStatusText(record.status)}
                  </span>
                  <span className="font-medium text-gray-900">{record.reconcileNo}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">业务类型</p>
                  <p className="font-medium">{record.bizType}</p>
                </div>
                <div>
                  <p className="text-gray-500">资产</p>
                  <p className="font-medium">{record.assetSymbol}</p>
                </div>
                <div>
                  <p className="text-gray-500">差异</p>
                  <p className="font-semibold text-red-600">{record.difference}</p>
                </div>
              </div>

              <div className="mt-3 p-2 bg-white rounded">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">系统金额: <span className="font-mono">{record.systemAmount}</span></span>
                  <span className="text-gray-500">链上金额: <span className="font-mono">{record.chainAmount}</span></span>
                </div>
                {record.reason && (
                  <p className="text-gray-500 text-xs mt-2">原因: {record.reason}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}