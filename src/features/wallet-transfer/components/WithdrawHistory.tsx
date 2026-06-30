import { WithdrawRecord } from '../types/transfer.types';
import { withdrawStatusText, statusColor, riskLevelText, riskLevelColor } from '../utils/status';
import { formatAmount, formatTime, formatTxHash } from '../utils/format';

interface Props {
  records: WithdrawRecord[];
}

export function WithdrawHistory({ records }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="divide-y divide-gray-100">
        {records.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p>暂无提币记录</p>
          </div>
        ) : (
          records.map((record) => (
            <div key={record.withdrawNo} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${statusColor(record.status)}15`, color: statusColor(record.status) }}
                    >
                      {withdrawStatusText(record.status)}
                    </span>
                    {record.riskLevel && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${riskLevelColor(record.riskLevel)}15`, color: riskLevelColor(record.riskLevel) }}
                      >
                        {riskLevelText(record.riskLevel)}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs mb-1">{record.assetSymbol}</p>
                  <p className="text-lg font-semibold text-gray-900">
                    -{formatAmount(record.amount, record.assetSymbol)}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">{formatTxHash(record.txHash)}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-xs">{formatTime(record.requestedAt)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}