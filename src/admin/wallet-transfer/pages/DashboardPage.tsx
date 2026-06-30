import { HotWalletPanel, WithdrawalApprovalList, ReconciliationPanel, CompensationTaskPanel } from '../components';

export function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">钱包运营后台</h1>
          <p className="text-gray-500 text-sm mt-1">监控和管理钱包充值提现业务</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HotWalletPanel />
          <WithdrawalApprovalList />
          <ReconciliationPanel />
          <CompensationTaskPanel />
        </div>
      </div>
    </div>
  );
}