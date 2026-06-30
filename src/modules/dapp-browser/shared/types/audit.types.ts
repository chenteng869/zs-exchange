export type AuditEventType =
  | 'provider_request'
  | 'sign_message'
  | 'sign_typed_data'
  | 'send_transaction'
  | 'switch_chain'
  | 'add_chain'
  | 'watch_asset'
  | 'walletconnect_pairing'
  | 'walletconnect_session'
  | 'session_create'
  | 'session_update'
  | 'session_revoke'
  | 'security_block'
  | 'security_warning'
  | 'permission_grant'
  | 'permission_revoke'
  | 'url_navigation'
  | 'tab_create'
  | 'tab_close';

export type AuditStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'failed';

export interface AuditEvent {
  eventId: string;
  type: AuditEventType;
  timestamp: number;
  userId?: string;
  accountId: string;
  address: string;
  chainId: string;
  origin: string;
  hostname: string;
  dappId?: string;
  source: 'webview' | 'walletconnect' | 'deeplink';

  requestId?: string;
  method?: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };

  status: AuditStatus;
  approvedByUser?: boolean;
  userActionTime?: number;

  metadata?: Record<string, unknown>;
}

export interface AuditLog {
  logId: string;
  eventId: string;
  type: AuditEventType;
  timestamp: number;
  userId?: string;
  accountId: string;
  address: string;
  chainId: string;
  origin: string;
  dappId?: string;
  status: AuditStatus;
  details?: Record<string, unknown>;
}

export interface RiskEvent {
  eventId: string;
  type: 'phishing_detection' | 'malicious_contract' | 'suspicious_approval' | 'unauthorized_access';
  severity: 'medium' | 'high' | 'critical';
  timestamp: number;
  userId?: string;
  accountId?: string;
  address?: string;
  chainId?: string;
  origin?: string;
  dappId?: string;
  details: Record<string, unknown>;
  actionTaken?: 'block' | 'warn' | 'monitor';
}

export interface DappBrowserMetrics {
  totalTabs: number;
  activeSessions: number;
  requestsPerMinute: number;
  signRequestsPerHour: number;
  transactionRequestsPerHour: number;
  securityBlocksPerDay: number;
  securityWarningsPerDay: number;
  averageRequestLatencyMs: number;
  errorRate: number;
}

export interface AlertConfig {
  alertId: string;
  type: AuditEventType | RiskEvent['type'];
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
  threshold?: number;
  notifyChannels: ('email' | 'sms' | 'push' | 'dashboard')[];
  createdAt: number;
  updatedAt: number;
}