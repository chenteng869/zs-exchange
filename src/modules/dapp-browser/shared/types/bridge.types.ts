export type BridgeMessageType =
  | 'provider_request'
  | 'provider_response'
  | 'provider_event'
  | 'webview_navigate'
  | 'webview_back'
  | 'webview_forward'
  | 'webview_reload'
  | 'webview_stop'
  | 'webview_title'
  | 'webview_url'
  | 'webview_loading'
  | 'webview_error'
  | 'webview_ready'
  | 'security_check'
  | 'security_response'
  | 'dapp_connect'
  | 'dapp_disconnect'
  | 'permission_request'
  | 'permission_response'
  | 'notification'
  | 'download_start'
  | 'download_progress'
  | 'download_complete'
  | 'download_cancel';

export interface BridgeMessage<T = unknown> {
  id: string;
  type: BridgeMessageType;
  payload?: T;
  timestamp: number;
  source?: string;
  destination?: string;
}

export interface BridgeProviderRequest {
  requestId: string;
  method: string;
  params?: unknown[] | Record<string, unknown>;
  origin: string;
  hostname: string;
}

export interface BridgeProviderResponse {
  requestId: string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface BridgeProviderEvent {
  eventName: string;
  args: unknown[];
}

export interface BridgeWebviewNavigate {
  url: string;
  origin?: string;
  target?: '_self' | '_blank';
}

export interface BridgeWebviewState {
  url: string;
  title?: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface BridgeSecurityCheck {
  url: string;
  origin: string;
}

export interface BridgeSecurityResponse {
  url: string;
  riskLevel: 'safe' | 'warning' | 'block';
  warnings?: string[];
  blockReason?: string;
}

export interface BridgeDappConnect {
  requestId: string;
  origin: string;
  hostname: string;
  requestedPermissions: string[];
  dappMetadata?: {
    name?: string;
    icon?: string;
    description?: string;
    url?: string;
  };
}

export interface BridgePermissionRequest {
  requestId: string;
  permission: string;
  origin: string;
  details?: Record<string, unknown>;
}

export interface BridgePermissionResponse {
  requestId: string;
  granted: boolean;
  permission?: string;
}

export interface BridgeNotification {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, unknown>;
}

export interface BridgeDownload {
  downloadId: string;
  url: string;
  filename?: string;
  mimeType?: string;
}

export interface BridgeDownloadProgress {
  downloadId: string;
  progress: number;
  bytesDownloaded: number;
  totalBytes: number;
}

export interface BridgeMessageHandler<T = unknown> {
  (message: BridgeMessage<T>): Promise<void> | void;
}

export interface BridgeChannel {
  send: <T = unknown>(message: BridgeMessage<T>) => void;
  on: <T = unknown>(type: BridgeMessageType, handler: BridgeMessageHandler<T>) => void;
  off: <T = unknown>(type: BridgeMessageType, handler: BridgeMessageHandler<T>) => void;
}