import axios from 'axios';
import { logger } from '@/lib/logger';
import type {
  ApiResponse,
  PaginatedResponse,
  LoginRequest,
  LoginResponse,
  AdminUser,
  User,
  Content,
  NFT,
  Transaction,
  AuditLog,
} from '@/types/models';

// Next.js 同源 API 路由（3200 端口上的 /api/*）
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================================
// Mock 适配层：当后端不可达时自动返回 mock 数据，避免长时间挂起
// 默认 baseURL 是 /api（Next.js 自身路由），视为有真实后端
// 只有明确指向外部 localhost:3001 才启用 mock
// ============================================================
const _apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
const useMock = _apiUrl.includes('localhost:3001');

if (useMock && typeof window !== 'undefined') {
  logger.info('[API] 检测到无后端，启用 Mock 模式');

  api.defaults.adapter = async (config) => {
    // 模拟网络延迟
    await new Promise((r) => setTimeout(r, 100 + Math.random() * 200));

    const url = config.url || '';
    const method = (config.method || 'get').toLowerCase();

    // Mock 数据生成器
    const mockResponse = (data: unknown) => ({
      data: {
        success: true,
        data,
        message: 'OK',
        timestamp: new Date().toISOString(),
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    // 这些 mock 只用于开发态，避免页面因后端缺失挂起
    const shortCircuit = (data: unknown) => Promise.resolve(mockResponse(data));

    // Dashboard 统计
    if (url.includes('/admin/dashboard/stats')) {
      return shortCircuit({
        totalUsers: 128456,
        totalTransactions: 892341,
        totalNFTs: 4521,
        totalRevenue: 12450000,
        userGrowth: 12.5,
        transactionGrowth: 8.3,
        nftGrowth: 24.7,
        revenueGrowth: 15.6,
      });
    }

    if (url.includes('/admin/dashboard/recent-activities')) {
      return shortCircuit([
        { id: 1, type: 'user_register', user: 'user_001', time: '2分钟前', desc: '新用户注册' },
        { id: 2, type: 'trade', user: 'trader_092', time: '5分钟前', desc: '完成 12.5 BTC 交易' },
        { id: 3, type: 'kyc', user: 'user_215', time: '10分钟前', desc: 'KYC 审核通过' },
        { id: 4, type: 'withdraw', user: 'user_445', time: '15分钟前', desc: '提现 5000 USDT' },
        { id: 5, type: 'nft', user: 'artist_018', time: '20分钟前', desc: '铸造新 NFT 系列' },
      ]);
    }

    if (url.includes('/admin/dashboard/chart-data')) {
      const type = config.params?.type;
      const labels = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);
      const baseData = labels.map(() => Math.floor(Math.random() * 1000) + 200);
      return shortCircuit({
        labels,
        series: [
          { name: type === 'user-growth' ? '新增用户' : type === 'transactions' ? '交易量' : '营收', data: baseData },
        ],
      });
    }

    // 默认空数据
    return mockResponse([]);
  };
}

// 认证相关API
export const authApi = {
  login: (data: LoginRequest): Promise<ApiResponse<LoginResponse>> =>
    api.post('/admin/auth/login', data).then((res) => res.data),
  logout: (): Promise<ApiResponse> => api.post('/admin/auth/logout').then((res) => res.data),
  getProfile: (): Promise<ApiResponse<AdminUser>> =>
    api.get('/admin/auth/profile').then((res) => res.data),
};

// 用户管理API
export const userApi = {
  getUsers: (params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    userLevel?: number;
    kycStatus?: string;
  }): Promise<ApiResponse<PaginatedResponse<User>>> =>
    api.get('/admin/users', { params }).then((res) => res.data),
  getUser: (id: string): Promise<ApiResponse<User>> =>
    api.get(`/admin/users/${id}`).then((res) => res.data),
  updateUserStatus: (id: string, isActive: boolean): Promise<ApiResponse> =>
    api.put(`/admin/users/${id}/status`, { isActive }).then((res) => res.data),
  updateUserLevel: (id: string, userLevel: number): Promise<ApiResponse> =>
    api.put(`/admin/users/${id}/level`, { userLevel }).then((res) => res.data),
};

// 内容管理API
export const contentApi = {
  getContents: (params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    type?: string;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<Content>>> =>
    api.get('/admin/content', { params }).then((res) => res.data),
  getContent: (id: string): Promise<ApiResponse<Content>> =>
    api.get(`/admin/content/${id}`).then((res) => res.data),
  updateContentStatus: (id: string, status: string): Promise<ApiResponse> =>
    api.put(`/admin/content/${id}/status`, { status }).then((res) => res.data),
};

// NFT管理API
export const nftApi = {
  getNFTs: (params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<NFT>>> =>
    api.get('/admin/nfts', { params }).then((res) => res.data),
  getNFT: (id: string): Promise<ApiResponse<NFT>> =>
    api.get(`/admin/nfts/${id}`).then((res) => res.data),
  updateNFTStatus: (id: string, status: string): Promise<ApiResponse> =>
    api.put(`/admin/nfts/${id}/status`, { status }).then((res) => res.data),
};

// 交易管理API
export const transactionApi = {
  getTransactions: (params?: {
    page?: number;
    pageSize?: number;
    type?: string;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<Transaction>>> =>
    api.get('/admin/transactions', { params }).then((res) => res.data),
  getTransaction: (id: string): Promise<ApiResponse<Transaction>> =>
    api.get(`/admin/transactions/${id}`).then((res) => res.data),
};

// 操作日志API
export const auditLogApi = {
  getAuditLogs: (params?: {
    page?: number;
    pageSize?: number;
    module?: string;
    action?: string;
  }): Promise<ApiResponse<PaginatedResponse<AuditLog>>> =>
    api.get('/admin/audit-logs', { params }).then((res) => res.data),
};

// 仪表盘API
export const dashboardApi = {
  getStats: (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> =>
    api.get('/admin/dashboard/stats', { params }).then((res) => res.data),
  getRecentActivities: (params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<ApiResponse<any[]>> =>
    api.get('/admin/dashboard/recent-activities', { params }).then((res) => res.data),
  getChartData: (params?: {
    startDate?: string;
    endDate?: string;
    type?: 'user-growth' | 'transactions' | 'revenue';
  }): Promise<ApiResponse<any>> =>
    api.get('/admin/dashboard/chart-data', { params }).then((res) => res.data),
};

// ====== v3.0 新增：国际化 API ======
export const i18nApi = {
  // 语言包管理
  getLanguagePacks: (params?: { page?: number; pageSize?: number; status?: string }): Promise<ApiResponse<PaginatedResponse<any>>> =>
    api.get('/admin/i18n/language-packs', { params }).then((res) => res.data),
  getLanguagePack: (code: string): Promise<ApiResponse<any>> =>
    api.get(`/admin/i18n/language-packs/${code}`).then((res) => res.data),
  createLanguagePack: (data: any): Promise<ApiResponse<any>> =>
    api.post('/admin/i18n/language-packs', data).then((res) => res.data),
  updateLanguagePack: (code: string, data: any): Promise<ApiResponse> =>
    api.put(`/admin/i18n/language-packs/${code}`, data).then((res) => res.data),
  deleteLanguagePack: (code: string): Promise<ApiResponse> =>
    api.delete(`/admin/i18n/language-packs/${code}`).then((res) => res.data),

  // 翻译条目
  getTranslations: (langCode: string, params?: { page?: number; pageSize?: number; status?: string }): Promise<ApiResponse<PaginatedResponse<any>>> =>
    api.get(`/admin/i18n/translations/${langCode}`, { params }).then((res) => res.data),
  batchSaveTranslations: (langCode: string, entries: any[]): Promise<ApiResponse<{ saved: number }>> =>
    api.put(`/admin/i18n/translations/${langCode}`, { entries }).then((res) => res.data),

  // 导入导出
  exportTranslations: (langCode: string): Promise<ApiResponse<{ downloadUrl: string }>> =>
    api.post(`/admin/i18n/export/${langCode}`).then((res) => res.data),
  importTranslations: (langCode: string, file: FormData): Promise<ApiResponse<{ importedCount: number }>> =>
    api.post(`/admin/i18n/import/${langCode}`, file).then((res) => res.data),

  // 时区管理
  getTimezones: (params?: { status?: string }): Promise<ApiResponse<any[]>> =>
    api.get('/admin/i18n/timezones', { params }).then((res) => res.data),
  createTimezone: (data: any): Promise<ApiResponse<any>> =>
    api.post('/admin/i18n/timezones', data).then((res) => res.data),
  updateTimezone: (id: string, data: any): Promise<ApiResponse> =>
    api.put(`/admin/i18n/timezones/${id}`, data).then((res) => res.data),
  toggleTimezoneStatus: (id: string, status: string): Promise<ApiResponse> =>
    api.patch(`/admin/i18n/timezones/${id}/status`, { status }).then((res) => res.data),
  convertTimezone: (params: { time: string; fromTz: string; toTz: string }): Promise<ApiResponse<{ result: string }>> =>
    api.post('/admin/i18n/timezone-convert', params).then((res) => res.data),

  // 业务时区规则
  getBusinessRules: (): Promise<ApiResponse<any[]>> =>
    api.get('/admin/i18n/business-rules').then((res) => res.data),
  createBusinessRule: (data: any): Promise<ApiResponse<any>> =>
    api.post('/admin/i18n/business-rules', data).then((res) => res.data),
  updateBusinessRule: (id: string, data: any): Promise<ApiResponse> =>
    api.put(`/admin/i18n/business-rules/${id}`, data).then((res) => res.data),

  // 货币管理
  getCurrencies: (params?: { status?: string }): Promise<ApiResponse<PaginatedResponse<any>>> =>
    api.get('/admin/i18n/currencies', { params }).then((res) => res.data),
  createCurrency: (data: any): Promise<ApiResponse<any>> =>
    api.post('/admin/i18n/currencies', data).then((res) => res.data),
  updateCurrencyRate: (code: string, rate: number): Promise<ApiResponse> =>
    api.put(`/admin/i18n/currencies/${code}/rate`, { rate }).then((res) => res.data),
  toggleAutoUpdate: (code: string, enabled: boolean): Promise<ApiResponse> =>
    api.patch(`/admin/i18n/currencies/${code}/auto-update`, { enabled }).then((res) => res.data),
  convertCurrency: (params: { amount: number; from: string; to: string }): Promise<ApiResponse<{ result: number; rate: number }>> =>
    api.post('/admin/i18n/currency-convert', params).then((res) => res.data),
  getCurrencyStats: (): Promise<ApiResponse<any>> =>
    api.get('/admin/i18n/currency-stats').then((res) => res.data),

  // 文化适配
  getCultures: (params?: { status?: string }): Promise<ApiResponse<PaginatedResponse<any>>> =>
    api.get('/admin/i18n/cultures', { params }).then((res) => res.data),
  getCulture: (locale: string): Promise<ApiResponse<any>> =>
    api.get(`/admin/i18n/cultures/${locale}`).then((res) => res.data),
  createCulture: (data: any): Promise<ApiResponse<any>> =>
    api.post('/admin/i18n/cultures', data).then((res) => res.data),
  updateCulture: (locale: string, data: any): Promise<ApiResponse> =>
    api.put(`/admin/i18n/cultures/${locale}`, data).then((res) => res.data),
  toggleCultureStatus: (locale: string, status: string): Promise<ApiResponse> =>
    api.patch(`/admin/i18n/cultures/${locale}/status`, { status }).then((res) => res.data),
};

// ====== v3.0 新增：高级数据分析 API ======
export const analyticsApi = {
  // 预测模型
  getPredictionModels: (params?: { status?: string }): Promise<ApiResponse<PaginatedResponse<any>>> =>
    api.get('/analytics/prediction-models', { params }).then((res) => res.data),
  getModelDetail: (modelId: string): Promise<ApiResponse<any>> =>
    api.get(`/analytics/prediction-models/${modelId}`).then((res) => res.data),
  retrainModel: (modelId: string, params?: { dataRange?: string; autoTune?: boolean }): Promise<ApiResponse<{ taskId: string }>> =>
    api.post(`/analytics/prediction-models/${modelId}/retrain`, params).then((res) => res.data),
  getModelPredictions: (modelId: string, params?: { horizon?: number }): Promise<ApiResponse<any[]>> =>
    api.get(`/analytics/prediction-models/${modelId}/predictions`, { params }).then((res) => res.data),
  getModelFactors: (modelId: string): Promise<ApiResponse<any[]>> =>
    api.get(`/analytics/prediction-models/${modelId}/factors`).then((res) => res.data),
  toggleModelStatus: (modelId: string, status: string): Promise<ApiResponse> =>
    api.patch(`/analytics/prediction-models/${modelId}/status`, { status }).then((res) => res.data),

  // 时序分析
  getTimeSeriesData: (params: {
    metric: string;
    timeRange: string;
    granularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
  }): Promise<ApiResponse<any[]>> =>
    api.get('/analytics/timeseries/data', { params }).then((res) => res.data),
  getSTLDecomposition: (params: {
    metric: string;
    timeRange: string;
    period?: number;
  }): Promise<ApiResponse<any>> =>
    api.get('/analytics/timeseries/stl', { params }).then((res) => res.data),
  getForecastData: (params: {
    metric: string;
    horizon?: number;
    confidenceLevel?: number;
  }): Promise<ApiResponse<any[]>> =>
    api.get('/analytics/timeseries/forecast', { params }).then((res) => res.data),
  detectTimeSeriesAnomalies: (params: {
    metric: string;
    timeRange: string;
    algorithm?: string;
  }): Promise<ApiResponse<any[]>> =>
    api.get('/analytics/timeseries/anomalies', { params }).then((res) => res.data),

  // 关联分析
  getAssociationRules: (params?: {
    category?: string;
    minSupport?: number;
    minConfidence?: number;
  }): Promise<ApiResponse<PaginatedResponse<any>>> =>
    api.get('/analytics/association/rules', { params }).then((res) => res.data),
  runMiningTask: (params: {
    algorithm: 'apriori' | 'fp-growth' | 'eclat';
    minSupport: number;
    minConfidence: number;
    maxItemSetLength: number;
    minLift: number;
    dataRange: string;
  }): Promise<ApiResponse<{ taskId: string; rulesFound: number }>> =>
    api.post('/analytics/association/mine', params).then((res) => res.data),
  getAssociationNetwork: (params?: { limit?: number }): Promise<ApiResponse<any>> =>
    api.get('/analytics/association/network', { params }).then((res) => res.data),
  getRuleDetail: (ruleId: string): Promise<ApiResponse<any>> =>
    api.get(`/analytics/association/rules/${ruleId}`).then((res) => res.data),

  // 异常检测
  getAnomalies: (params?: {
    severity?: string;
    type?: string;
    status?: string;
    metric?: string;
  }): Promise<ApiResponse<PaginatedResponse<any>>> =>
    api.get('/analytics/anomalies', { params }).then((res) => res.data),
  getAnomalyDetail: (anomalyId: string): Promise<ApiResponse<any>> =>
    api.get(`/analytics/anomalies/${anomalyId}`).then((res) => res.data),
  handleAnomalyWorkflow: (anomalyId: string, action: 'confirm' | 'ignore' | 'resolve' | 'dispatch', note?: string): Promise<ApiResponse> =>
    api.post(`/analytics/anomalies/${anomalyId}/workflow`, { action, note }).then((res) => res.data),
  getAnomalyDistribution: (params?: { dimension: 'type' | 'severity' | 'time' | 'metric' }): Promise<ApiResponse<any>> =>
    api.get('/analytics/anomalies/distribution', { params }).then((res) => res.data),
  getDetectionAlgorithms: (): Promise<ApiResponse<any[]>> =>
    api.get('/analytics/anomalies/algorithms').then((res) => res.data),
  updateAlgorithmConfig: (algorithmId: string, config: any): Promise<ApiResponse> =>
    api.put(`/analytics/anomalies/algorithms/${algorithmId}`, config).then((res) => res.data),

  // BI自助分析
  getReportTemplates: (params?: { category?: string; keyword?: string }): Promise<ApiResponse<any[]>> =>
    api.get('/analytics/bi/templates', { params }).then((res) => res.data),
  getMyReports: (params?: { status?: string; keyword?: string }): Promise<ApiResponse<PaginatedResponse<any>>> =>
    api.get('analytics/bi/my-reports', { params }).then((res) => res.data),
  getSharedReports: (): Promise<ApiResponse<any[]>> =>
    api.get('analytics/bi/shared-reports').then((res) => res.data),
  createReport: (config: any): Promise<ApiResponse<{ reportId: string }>> =>
    api.post('analytics/bi/reports', config).then((res) => res.data),
  updateReport: (reportId: string, config: any): Promise<ApiResponse> =>
    api.put(`analytics/bi/reports/${reportId}`, config).then((res) => res.data),
  deleteReport: (reportId: string): Promise<ApiResponse> =>
    api.delete(`analytics/bi/reports/${reportId}`).then((res) => res.data),
  toggleReportFavorite: (reportId: string, favorite: boolean): Promise<ApiResponse> =>
    api.patch(`analytics/bi/reports/${reportId}/favorite`, { favorite }).then((res) => res.data),
  shareReport: (reportId: string, users: string[], permission: 'view' | 'edit'): Promise<ApiResponse> =>
    api.post(`analytics/bi/reports/${reportId}/share`, { users, permission }).then((res) => res.data),
  getReportPreview: (reportId: string, params?: any): Promise<ApiResponse<any>> =>
    api.get(`analytics/bi/reports/${reportId}/preview`, { params }).then((res) => res.data),
  exportReport: (reportId: string, format: 'pdf' | 'excel' | 'png'): Promise<ApiResponse<{ downloadUrl: string }>> =>
    api.post(`analytics/bi/reports/${reportId}/export`, { format }).then((res) => res.data),

  // 订阅管理
  getSubscriptions: (): Promise<ApiResponse<any[]>> =>
    api.get('analytics/bi/subscriptions').then((res) => res.data),
  createSubscription: (config: any): Promise<ApiResponse<any>> =>
    api.post('analytics/bi/subscriptions', config).then((res) => res.data),
  updateSubscription: (subId: string, config: any): Promise<ApiResponse> =>
    api.put(`analytics/bi/subscriptions/${subId}`, config).then((res) => res.data),
  toggleSubscription: (subId: string, active: boolean): Promise<ApiResponse> =>
    api.patch(`analytics/bi/subscriptions/${subId}`, { active }).then((res) => res.data),
  deleteSubscription: (subId: string): Promise<ApiResponse> =>
    api.delete(`analytics/bi/subscriptions/${subId}`).then((res) => res.data),
};

// ====== v3.0 新增：安全防御中心 API ======
export const securityApi = {
  getOverview: (): Promise<ApiResponse<any>> =>
    api.get('/security/overview').then((res) => res.data),
  getIntrusionEvents: (params?: { severity?: string; status?: string }): Promise<ApiResponse<PaginatedResponse<any>>> =>
    api.get('/security/intrusions', { params }).then((res) => res.data),
  getFirewallRules: (params?: { status?: string }): Promise<ApiResponse<any[]>> =>
    api.get('/security/firewall/rules', { params }).then((res) => res.data),
  createFirewallRule: (data: any): Promise<ApiResponse<any>> =>
    api.post('/security/firewall/rules', data).then((res) => res.data),
  updateFirewallRule: (ruleId: string, data: any): Promise<ApiResponse> =>
    api.put(`/security/firewall/rules/${ruleId}`, data).then((res) => res.data),
  deleteFirewallRule: (ruleId: string): Promise<ApiResponse> =>
    api.delete(`/security/firewall/rules/${ruleId}`).then((res) => res.data),
  getSecurityAlerts: (params?: { level?: string; read?: boolean }): Promise<ApiResponse<PaginatedResponse<any>>> =>
    api.get('/security/alerts', { params }).then((res) => res.data),
  markAlertRead: (alertIds: string[]): Promise<ApiResponse> =>
    api.post('/security/alerts/read', { alertIds }).then((res) => res.data),
  getWafStatistics: (params?: { period: '1h' | '24h' | '7d' | '30d' }): Promise<ApiResponse<any>> =>
    api.get('/security/waf/stats', { params }).then((res) => res.data),
  getDdosProtectionStatus: (): Promise<ApiResponse<any>> =>
    api.get('/security/ddos/status').then((res) => res.data),
  getVulnerabilityScanResults: (): Promise<ApiResponse<any[]>> =>
    api.get('/security/vulnerabilities').then((res) => res.data),
  startVulnerabilityScan: (): Promise<ApiResponse<{ scanId: string }>> =>
    api.post('/security/vulnerabilities/scan').then((res) => res.data),
};

// ====== v3.0 新增：大屏指挥台 API ======
export const commandApi = {
  getCommandOverview: (): Promise<ApiResponse<any>> =>
    api.get('/command-center/overview').then((res) => res.data),
  getRealtimeAlerts: (params?: { level?: string; acknowledged?: boolean }): Promise<ApiResponse<any[]>> =>
    api.get('/command-center/alerts/realtime', { params }).then((res) => res.data),
  acknowledgeAlert: (alertId: string): Promise<ApiResponse> =>
    api.post(`/command-center/alerts/${alertId}/acknowledge`).then((res) => res.data),
  getSystemHealth: (): Promise<ApiResponse<any>> =>
    api.get('/command-center/system-health').then((res) => res.data),
  getResourceUsage: (period: '1h' | '6h' | '24h' | '7d'): Promise<ApiResponse<any>> =>
    api.get('/command-center/resources', { params: { period } }).then((res) => res.data),
  getIncidentTimeline: (params?: { days?: number }): Promise<ApiResponse<any[]>> =>
    api.get('/command-center/incidents/timeline', { params }).then((res) => res.data),
  createIncident: (data: any): Promise<ApiResponse<any>> =>
    api.post('/command-center/incidents', data).then((res) => res.data),
  updateIncident: (incidentId: string, data: any): Promise<ApiResponse> =>
    api.put(`/command-center/incidents/${incidentId}`, data).then((res) => res.data),
  getCommandDashboard: (): Promise<ApiResponse<any>> =>
    api.get('/command-center/dashboard').then((res) => res.data),
};

// ====== v3.0 新增：AI分析中心 API ======
export const aiCenterApi = {
  getAiModels: (params?: { type?: string; status?: string }): Promise<ApiResponse<any[]>> =>
    api.get('/ai-center/models', { params }).then((res) => res.data),
  deployModel: (modelId: string, config: any): Promise<ApiResponse<{ deploymentId: string }>> =>
    api.post(`/ai-center/models/${modelId}/deploy`, config).then((res) => res.data),
  getAnalysisTasks: (params?: { status?: string }): Promise<ApiResponse<PaginatedResponse<any>>> =>
    api.get('/ai-center/tasks', { params }).then((res) => res.data),
  createAnalysisTask: (config: any): Promise<ApiResponse<{ taskId: string }>> =>
    api.post('/ai-center/tasks', config).then((res) => res.data),
  getTaskResult: (taskId: string): Promise<ApiResponse<any>> =>
    api.get(`/ai-center/tasks/${taskId}/result`).then((res) => res.data),
  cancelTask: (taskId: string): Promise<ApiResponse> =>
    api.post(`/ai-center/tasks/${taskId}/cancel`).then((res) => res.data),
  getPromptTemplates: (): Promise<ApiResponse<any[]>> =>
    api.get('/ai-center/prompts/templates').then((res) => res.data),
  chatWithAI: (messages: any[], model?: string): Promise<ApiResponse<any>> =>
    api.post('/ai-center/chat', { messages, model }).then((res) => res.data),
};

// ====== v3.0 新增：区块链 API ======
export const blockchainApi = {
  getChainOverview: (): Promise<ApiResponse<any>> =>
    api.get('/blockchain/overview').then((res) => res.data),
  getChainStatus: (chainId?: string): Promise<ApiResponse<any>> =>
    api.get('/blockchain/status', { params: { chainId } }).then((res) => res.data),
  getTransactionsByHash: (txHash: string): Promise<ApiResponse<any>> =>
    api.get(`/blockchain/transactions/${txHash}`).then((res) => res.data),
  getBlockInfo: (blockNumberOrHash: string): Promise<ApiResponse<any>> =>
    api.get(`/blockchain/blocks/${blockNumberOrHash}`).then((res) => res.data),
  getTokenBalances: (address: string): Promise<ApiResponse<any[]>> =>
    api.get(`/blockchain/address/${address}/balances`).then((res) => res.data),
  verifyContract: (contractAddress: string): Promise<ApiResponse<any>> =>
    api.post('/blockchain/contracts/verify', { contractAddress }).then((res) => res.data),
  getGasPrice: (chainId?: string): Promise<ApiResponse<any>> =>
    api.get('/blockchain/gas-price', { params: { chainId } }).then((res) => res.data),
  estimateGas: (data: any): Promise<ApiResponse<any>> =>
    api.post('/blockchain/gas/estimate', data).then((res) => res.data),
};

// ====== v3.0 新增：OpenClaw智能体 API ======
export const openClawApi = {
  getAgents: (params?: { status?: string; type?: string }): Promise<ApiResponse<any[]>> =>
    api.get('/openclaw/agents', { params }).then((res) => res.data),
  getAgentDetail: (agentId: string): Promise<ApiResponse<any>> =>
    api.get(`/openclaw/agents/${agentId}`).then((res) => res.data),
  createAgent: (config: any): Promise<ApiResponse<any>> =>
    api.post('/openclaw/agents', config).then((res) => res.data),
  updateAgentConfig: (agentId: string, config: any): Promise<ApiResponse> =>
    api.put(`/openclaw/agents/${agentId}`, config).then((res) => res.data),
  deleteAgent: (agentId: string): Promise<ApiResponse> =>
    api.delete(`/openclaw/agents/${agentId}`).then((res) => res.data),
  invokeAgent: (agentId: string, input: string): Promise<ApiResponse<any>> =>
    api.post(`/openclaw/agents/${agentId}/invoke`, { input }).then((res) => res.data),
  getAgentConversations: (agentId: string, params?: { limit?: number }): Promise<ApiResponse<any[]>> =>
    api.get(`/openclaw/agents/${agentId}/conversations`, { params }).then((res) => res.data),
  getAgentMetrics: (agentId: string): Promise<ApiResponse<any>> =>
    api.get(`/openclaw/agents/${agentId}/metrics`).then((res) => res.data),
};

// ====== v3.0 新增：n8n工作流 API ======
export const n8nApi = {
  getWorkflows: (params?: { status?: string; keyword?: string }): Promise<ApiResponse<PaginatedResponse<any>>> =>
    api.get('/n8n/workflows', { params }).then((res) => res.data),
  getWorkflowDetail: (workflowId: string): Promise<ApiResponse<any>> =>
    api.get(`/n8n/workflows/${workflowId}`).then((res) => res.data),
  createWorkflow: (config: any): Promise<ApiResponse<{ workflowId: string }>> =>
    api.post('/n8n/workflows', config).then((res) => res.data),
  updateWorkflow: (workflowId: string, config: any): Promise<ApiResponse> =>
    api.put(`/n8n/workflows/${workflowId}`, config).then((res) => res.data),
  deleteWorkflow: (workflowId: string): Promise<ApiResponse> =>
    api.delete(`/n8n/workflows/${workflowId}`).then((res) => res.data),
  activateWorkflow: (workflowId: string): Promise<ApiResponse> =>
    api.post(`/n8n/workflows/${workflowId}/activate`).then((res) => res.data),
  deactivateWorkflow: (workflowId: string): Promise<ApiResponse> =>
    api.post(`/n8n/workflows/${workflowId}/deactivate`).then((res) => res.data),
  executeWorkflow: (workflowId: string, data?: any): Promise<ApiResponse<{ executionId: string }>> =>
    api.post(`/n8n/workflows/${workflowId}/execute`, data).then((res) => res.data),
  getExecutionHistory: (workflowId: string, params?: { status?: string; limit?: number }): Promise<ApiResponse<any[]>> =>
    api.get(`/n8n/workflows/${workflowId}/executions`, { params }).then((res) => res.data),
  getExecutionDetail: (executionId: string): Promise<ApiResponse<any>> =>
    api.get(`/n8n/executions/${executionId}`).then((res) => res.data),
  getWebhookUrl: (workflowId: string): Promise<ApiResponse<{ url: string }>> =>
    api.get(`/n8n/workflows/${workflowId}/webhook`).then((res) => res.data),
};

// ====== v3.0 新增：AI大模型集成 API ======
export const aiLlmApi = {
  getAvailableModels: (): Promise<ApiResponse<any[]>> =>
    api.get('/ai-llm/models').then((res) => res.data),
  chatCompletion: (params: { model: string; messages: any[]; temperature?: number; maxTokens?: number }): Promise<ApiResponse<any>> =>
    api.post('/ai-llm/chat/completions', params).then((res) => res.data),
  streamCompletion: (params: { model: string; messages: any[] }): Promise<ApiResponse<any>> =>
    api.post('/ai-llm/chat/stream', params).then((res) => res.data),
  textEmbedding: (params: { model: string; input: string | string[] }): Promise<ApiResponse<any>> =>
    api.post('/ai-llm/embeddings', params).then((res) => res.data),
  imageGeneration: (params: { model: string; prompt: string; size?: string }): Promise<ApiResponse<any>> =>
    api.post('/ai-llm/images/generations', params).then((res) => res.data),
  getUsageStats: (params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<any>> =>
    api.get('/ai-llm/usage/stats', { params }).then((res) => res.data),
  getFineTuningJobs: (params?: { status?: string }): Promise<ApiResponse<any[]>> =>
    api.get('/ai-llm/fine-tuning/jobs', { params }).then((res) => res.data),
  createFineTuningJob: (config: any): Promise<ApiResponse<{ jobId: string }>> =>
    api.post('/ai-llm/fine-tuning/jobs', config).then((res) => res.data),
  manageRagKnowledge: (action: 'upload' | 'delete' | 'query', data: any): Promise<ApiResponse<any>> =>
    api.post(`/ai-llm/rag/${action}`, data).then((res) => res.data),
};

// ====== v3.0 新增：BPM工作流引擎 API ======
export const bpmApi = {
  getProcessDefinitions: (params?: { status?: string }): Promise<ApiResponse<any[]>> =>
    api.get('/bpm/process-definitions', { params }).then((res) => res.data),
  startProcessInstance: (processKey: string, variables?: Record<string, any>): Promise<ApiResponse<{ instanceId: string }>> =>
    api.post('/bpm/process-instances', { processKey, variables }).then((res) => res.data),
  getMyTasks: (params?: { status?: string; priority?: string }): Promise<ApiResponse<PaginatedResponse<any>>> =>
    api.get('/bpm/tasks/my', { params }).then((res) => res.data),
  completeTask: (taskId: string, variables?: Record<string, any>): Promise<ApiResponse> =>
    api.post(`/bpm/tasks/${taskId}/complete`, variables).then((res) => res.data),
  delegateTask: (taskId: string, assignee: string): Promise<ApiResponse> =>
    api.post(`/bpm/tasks/${taskId}/delegate`, { assignee }).then((res) => res.data),
  getProcessInstances: (params?: { status?: string; processKey?: string }): Promise<ApiResponse<PaginatedResponse<any>>> =>
    api.get('/bpm/process-instances', { params }).then((res) => res.data),
  getInstanceHistory: (instanceId: string): Promise<ApiResponse<any[]>> =>
    api.get(`/bpm/process-instances/${instanceId}/history`).then((res) => res.data),
  getFormVariables: (taskId: string): Promise<ApiResponse<any>> =>
    api.get(`/bpm/tasks/${taskId}/form-variables`).then((res) => res.data),
  submitForm: (taskId: string, formData: any): Promise<ApiResponse> =>
    api.post(`/bpm/tasks/${taskId}/submit-form`, formData).then((res) => res.data),
  getBpmStatistics: (params?: { period?: string }): Promise<ApiResponse<any>> =>
    api.get('/bpm/statistics', { params }).then((res) => res.data),
};

// ====== v3.0 新增：IoT设备接入 API ======
export const iotApi = {
  getDevices: (params?: { status?: string; type?: string; group?: string }): Promise<ApiResponse<PaginatedResponse<any>>> =>
    api.get('/iot/devices', { params }).then((res) => res.data),
  getDeviceDetail: (deviceId: string): Promise<ApiResponse<any>> =>
    api.get(`/iot/devices/${deviceId}`).then((res) => res.data),
  registerDevice: (data: any): Promise<ApiResponse<any>> =>
    api.post('/iot/devices', data).then((res) => res.data),
  updateDevice: (deviceId: string, data: any): Promise<ApiResponse> =>
    api.put(`/iot/devices/${deviceId}`, data).then((res) => res.data),
  deleteDevice: (deviceId: string): Promise<ApiResponse> =>
    api.delete(`/iot/devices/${deviceId}`).then((res) => res.data),
  getDeviceTelemetry: (deviceId: string, params?: { startTime?: string; endTime?: string; limit?: number }): Promise<ApiResponse<any[]>> =>
    api.get(`/iot/devices/${deviceId}/telemetry`, { params }).then((res) => res.data),
  sendDeviceCommand: (deviceId: string, command: string, payload?: any): Promise<ApiResponse<any>> =>
    api.post(`/iot/devices/${deviceId}/commands`, { command, payload }).then((res) => res.data),
  getDeviceGroups: (): Promise<ApiResponse<any[]>> =>
    api.get('/iot/device-groups').then((res) => res.data),
  createDeviceGroup: (data: any): Promise<ApiResponse<any>> =>
    api.post('/iot/device-groups', data).then((res) => res.data),
  getRulesEngine: (params?: { enabled?: boolean }): Promise<ApiResponse<any[]>> =>
    api.get('/iot/rules', { params }).then((res) => res.data),
  createRule: (data: any): Promise<ApiResponse<any>> =>
    api.post('/iot/rules', data).then((res) => res.data),
  toggleRule: (ruleId: string, enabled: boolean): Promise<ApiResponse> =>
    api.patch(`/iot/rules/${ruleId}`, { enabled }).then((res) => res.data),
  getIotDashboard: (): Promise<ApiResponse<any>> =>
    api.get('/iot/dashboard').then((res) => res.data),
};

export default api;
