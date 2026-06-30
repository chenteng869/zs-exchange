import { DepositRecord } from '../types/transfer.types';
import { depositStatusText, statusColor } from '../utils/status';
import { formatAmount, formatTime, formatTxHash } from '../utils/format';

interface Props {
  records: DepositRecord[];
}

export function DepositHistory({ records }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="divide-y divide-gray-100">
        {records.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p>暂无充值记录</p>
          </div>
        ) : (
          records.map((record) => (
            <div key={record.depositNo} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${statusColor(record.status)}15`, color: statusColor(record.status) }}
                    >
                      {depositStatusText(record.status)}
                    </span>
                    <span className="text-gray-400 text-xs">{record.assetSymbol}</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatAmount(record.amount, record.assetSymbol)}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">{formatTxHash(record.txHash)}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-xs">{formatTime(record.detectedAt)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}