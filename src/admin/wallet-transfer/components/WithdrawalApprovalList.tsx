import { useState, useEffect } from 'react';
import { WithdrawalApproval } from '../types/admin.types';
import { riskLevelColor, riskLevelText } from '@/features/wallet-transfer/utils/status';

export function WithdrawalApprovalList() {
  const [approvals, setApprovals] = useState<WithdrawalApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<WithdrawalApproval | null>(null);
  const [decision, setDecision] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/wallet/admin/withdrawals?status=waiting_approval');
      const data = await res.json();
      if (data.success) {
        setApprovals(data.data.items);
      }
    } catch (err) {
      console.error('Failed to fetch approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDecision = async () => {
    if (!selectedApproval || !decision) return;

    try {
      const res = await fetch(`/api/v1/wallet/withdrawals/approvals/${selectedApproval.withdrawNo}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, reason }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedApproval(null);
        setDecision('');
        setReason('');
        fetchApprovals();
      }
    } catch (err) {
      console.error('Failed to submit decision:', err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">提币审核</h2>
        <button
          onClick={fetchApprovals}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
        >
          刷新
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-400">加载中...</div>
      ) : approvals.length === 0 ? (
        <div className="py-8 text-center text-gray-400">暂无待审核提币</div>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => (
            <div
              key={approval.withdrawNo}
              onClick={() => setSelectedApproval(approval)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedApproval?.withdrawNo === approval.withdrawNo
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-100 hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{approval.withdrawNo}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${riskLevelColor(approval.riskLevel)}15`, color: riskLevelColor(approval.riskLevel) }}
                    >
                      {riskLevelText(approval.riskLevel)}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm">用户: {approval.userId}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">{approval.amount} {approval.assetSymbol}</p>
                  <p className="text-gray-400 text-xs mt-1">{approval.approvalStatus}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedApproval && (
        <div className="mt-6 p-4 border border-blue-500 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-4">审核详情</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-gray-500 text-sm">提币单号</p>
              <p className="font-medium">{selectedApproval.withdrawNo}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">风险等级</p>
              <p style={{ color: riskLevelColor(selectedApproval.riskLevel) }}>
                {riskLevelText(selectedApproval.riskLevel)}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">金额</p>
              <p className="font-semibold">{selectedApproval.amount} {selectedApproval.assetSymbol}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">收款地址</p>
              <p className="font-mono text-sm">{selectedApproval.toAddress}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">审核决定</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setDecision('approve')}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    decision === 'approve'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-green-100'
                  }`}
                >
                  通过
                </button>
                <button
                  onClick={() => setDecision('reject')}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    decision === 'reject'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-red-100'
                  }`}
                >
                  拒绝
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">备注 (可选)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>

            <button
              onClick={handleSubmitDecision}
              disabled={!decision}
              className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300"
            >
              提交审核
            </button>
          </div>
        </div>
      )}
    </div>
  );
}