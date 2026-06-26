/**
 * Web3 钱包前端 SDK - 统一导出
 */

export * from './sdk.types';
export { WalletSDK } from './wallet-sdk';

export { NetworkManager } from './network-manager/network-manager';
export {
  ETHEREUM_MAINNET,
  BSC_MAINNET,
  POLYGON_MAINNET,
  ARBITRUM_ONE,
  OPTIMISM_MAINNET,
  BASE_MAINNET,
  AVALANCHE_C_CHAIN,
  FANTOM_OPERA,
  CRONOS_MAINNET,
  KLAYTN_MAINNET,
  ETHEREUM_SEPOLIA,
  BSC_TESTNET,
  POLYGON_AMOY,
  ARBITRUM_SEPOLIA,
  OPTIMISM_SEPOLIA,
  BASE_SEPOLIA,
  MAINNET_CHAINS,
  TESTNET_CHAINS,
  BUILTIN_CHAINS,
  getAllBuiltinChains,
  getMainnetChains,
  getTestnetChains,
  getBuiltinChain,
  getBuiltinChainsByType,
  findChainById,
  findChainByName,
  sortChainsByPriority,
} from './network-manager/chain-list';

export { WalletConnectManager } from './walletconnect/walletconnect-manager';
export type {
  ConnectionStatus,
  WCEventType,
  WCEventCallback,
  ConnectionProposal,
  WCRequestHandler,
} from './walletconnect/walletconnect-manager';

export { WCSessionManager } from './walletconnect/wc-session';
export type {
  WCPairingInfo,
  SessionEventType,
  SessionEventCallback,
} from './walletconnect/wc-session';

export { WCProvider } from './walletconnect/wc-provider';
export type {
  ProviderEventType,
  ProviderEventCallback as WCProviderEventCallback,
  RequestHandler as WCRequestHandlerType,
  WCProviderConfig,
} from './walletconnect/wc-provider';

export {
  WC_PROTOCOL_VERSION,
  WC_DEFAULT_RELAY_URL,
  parseWalletConnectUri,
  generateWalletConnectUri,
  toCaip2ChainId,
  fromCaip2ChainId,
  toCaip10Account,
  fromCaip10Account,
  isStandardEvmMethod,
  isStandardEvmEvent,
  extractChainIdsFromNamespaces,
  buildSessionNamespaces,
  generateRandomId,
  generateRandomHex,
  isSessionExpired,
  formatSessionRemainingTime,
  truncateAddress,
  isValidAddress,
  delay,
  debounce,
  throttle,
} from './walletconnect/wc-utils';
export type {
  WCPairingProposal,
  WCNamespace,
  WCMetadata,
  WCSession as IWCSession,
  WCRequestEvent,
} from './walletconnect/wc-utils';

export { EIP1193Provider } from './dapp-provider/eip1193-provider';
export type {
  ProviderEvent,
  ProviderEventCallback,
  ProviderStatus,
  EIP1193ProviderConfig,
} from './dapp-provider/eip1193-provider';

export { ProviderMiddleware } from './dapp-provider/provider-middleware';
export type {
  MiddlewareContext,
  NextFunction,
  MiddlewareFunction,
  MiddlewareType,
  MiddlewareConfig,
  LogMiddlewareOptions,
  CacheMiddlewareOptions,
  RateLimitMiddlewareOptions,
  ErrorHandlerMiddlewareOptions,
} from './dapp-provider/provider-middleware';

export { RequestHandler } from './dapp-provider/request-handler';
export type {
  RequestContext,
  RequestResult,
  Permission,
} from './dapp-provider/request-handler';

export { SignConfirmManager } from './sign-confirm/sign-confirm-manager';
export type {
  ConfirmationType,
  ConfirmationResult,
  RiskLevel,
  RiskItem,
  RiskAssessment,
  TransactionAction,
  ParsedTransactionDetail,
  ConfirmationRequest,
  SignConfirmationRequest,
  TransactionConfirmationRequest,
  SwitchChainConfirmationRequest,
  AddChainConfirmationRequest,
  PermissionConfirmationRequest,
  WatchAssetConfirmationRequest,
  ConfirmationStatus,
  SignConfirmOptions,
} from './sign-confirm/sign-confirm.interface';

export { AddressBookService } from './address-book/address-book.service';
export type {
  ContactCategory,
  ContactGroup,
  ContactDetail,
  ContactTransaction,
  ImportFormat,
  ExportFormat,
  SearchContactOptions,
  ContactStats,
  RiskLevel as ContactRiskLevel,
} from './address-book/contact.types';

export { NotificationService } from './notification/notification.service';
