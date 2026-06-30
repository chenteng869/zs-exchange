export function depositStatusText(status: string) {
  const map: Record<string, string> = {
    detected: '已检测',
    confirming: '确认中',
    confirmed: '已确认',
    credited: '已入账',
    failed: '失败',
    ignored: '已忽略',
    orphaned: '链回滚',
  };
  return map[status] ?? status;
}

export function withdrawStatusText(status: string) {
  const map: Record<string, string> = {
    created: '已创建',
    risk_checking: '风控检查中',
    waiting_approval: '待审核',
    approved: '已审核',
    hot_wallet_locking: '锁定热钱包',
    building: '构建交易',
    signing: '签名中',
    signed: '已签名',
    broadcasting: '广播中',
    broadcasted: '已广播',
    confirming: '确认中',
    confirmed: '已完成',
    failed: '失败',
    rejected: '已拒绝',
    canceled: '已取消',
    compensation_required: '需补偿',
    manual_review: '人工处理',
  };
  return map[status] ?? status;
}

export function statusColor(status: string) {
  if (['credited', 'confirmed', 'approved'].includes(status)) return '#16A34A';
  if (['failed', 'rejected', 'orphaned'].includes(status)) return '#DC2626';
  if (['waiting_approval', 'manual_review', 'compensation_required'].includes(status)) return '#D97706';
  return '#2563EB';
}

export function riskLevelText(riskLevel?: string) {
  const map: Record<string, string> = {
    low: '低风险',
    medium: '中风险',
    high: '高风险',
    critical: '极高风险',
  };
  return map[riskLevel ?? ''] ?? '-';
}

export function riskLevelColor(riskLevel?: string) {
  const map: Record<string, string> = {
    low: '#16A34A',
    medium: '#D97706',
    high: '#EA580C',
    critical: '#DC2626',
  };
  return map[riskLevel ?? ''] ?? '#6B7280';
}