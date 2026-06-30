import { useState, useEffect } from 'react';
import { WithdrawForm, WithdrawHistory, AddressBook } from '../components';
import { listWithdrawals } from '../api/withdraw.api';
import { WithdrawRecord, ChainOption, AssetOption } from '../types/transfer.types';

interface Props {
  userId: string;
  chains: ChainOption[];
  assets: AssetOption[];
}

export function WithdrawPage({ userId, chains, assets }: Props) {
  const [withdrawals, setWithdrawals] = useState<WithdrawRecord[]>([]);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const result = await listWithdrawals({ userId, pageSize: 10 });
      setWithdrawals(result.items);
    } catch (err) {
      console.error('获取提币记录失败:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto p-4">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">提币</h1>
          <p className="text-gray-500 text-sm mt-1">请确保提币地址正确</p>
        </header>

        <div className="space-y-4">
          <WithdrawForm chains={chains} assets={assets} userId={userId} />

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">提币记录</h3>
            <WithdrawHistory records={withdrawals} />
          </div>

          <AddressBook userId={userId} chains={chains} assets={assets} />
        </div>
      </div>
    </div>
  );
}