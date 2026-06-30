import { useState, useEffect } from 'react';
import { CompensationTask } from '../types/admin.types';

export function CompensationTaskPanel() {
  const [tasks, setTasks] = useState<CompensationTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/wallet/admin/compensation-tasks');
      const data = await res.json();
      if (data.success) {
        setTasks(data.data.items);
      }
    } catch (err) {
      console.error('Failed to fetch compensation tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: '#D97706',
      processing: '#2563EB',
      completed: '#16A34A',
      failed: '#DC2626',
    };
    return map[status] || '#6B7280';
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      pending: '待处理',
      processing: '处理中',
      completed: '已完成',
      failed: '处理失败',
    };
    return map[status] || status;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">补偿任务</h2>
        <button
          onClick={fetchTasks}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
        >
          刷新
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-400">加载中...</div>
      ) : tasks.length === 0 ? (
        <div className="py-8 text-center text-gray-400">暂无补偿任务</div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.taskNo} className="p-4 border border-gray-100 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${getStatusColor(task.status)}15`, color: getStatusColor(task.status) }}
                  >
                    {getStatusText(task.status)}
                  </span>
                  <span className="font-medium text-gray-900">{task.taskNo}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                <div>
                  <p className="text-gray-500">提币单号</p>
                  <p className="font-mono text-xs">{task.withdrawNo}</p>
                </div>
                <div>
                  <p className="text-gray-500">用户</p>
                  <p className="font-medium">{task.userId}</p>
                </div>
                <div>
                  <p className="text-gray-500">补偿金额</p>
                  <p className="font-semibold">{task.amount} {task.assetSymbol}</p>
                </div>
              </div>

              {task.status === 'pending' && (
                <button className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors">
                  执行补偿
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}