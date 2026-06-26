/**
 * 统一服务层入口
 *
 * 暴露:
 *  - http / api-client:  统一 HTTP 客户端
 *  - marketData:          真实行情 (Binance/CoinGecko)
 *  - marketAggregator:    多源聚合 (Binance/OKX/Bybit/CoinGecko/CC)
 *  - walletService:       多链钱包 (ETH/BSC/Tron/Solana)
 *  - kycService:          KYC (OCR + 活体)
 *  - api / dashboardApi / authApi / userApi ...:  业务 API
 */

export { default as http, normalizeError, ApiError, tokenManager, API_BASE_URL, USE_MOCK } from './api-client';
export { default as marketData } from './market-data';
export { default as marketAggregator, AggregatedStream } from './market-aggregator';
export { default as walletService, CHAIN_META } from './wallet-service';
export { default as kycService } from './kyc-service';

// 业务 API (auth/user/content/nft/transaction/audit/dashboard 等)
export * from './api';
