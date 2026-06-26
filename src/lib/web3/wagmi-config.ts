/**
 * wagmi v2 配置
 *
 *  - 4 条 EVM 主网：Ethereum / BSC / Polygon / Arbitrum
 *  - 3 个钱包连接器：MetaMask / WalletConnect / Coinbase
 *  - WC Project ID 用占位（"YOUR_WC_PROJECT_ID"），生产前替换
 *  - 客户端侧只构造（避免 SSR 报错）
 */

import { http, createConfig } from 'wagmi';
import { mainnet, bsc, polygon, arbitrum } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

// =============================================================================
// WalletConnect Project ID
//
//  - 申请地址：https://cloud.walletconnect.com
//  - 占位 ID 仍可运行，但 mobile H5 上 WalletConnect 扫码会失败
//  - 真正上线前请申请并替换
// =============================================================================
const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'YOUR_WC_PROJECT_ID';

// =============================================================================
// 链定义
// =============================================================================
export const SUPPORTED_CHAINS = [mainnet, bsc, polygon, arbitrum] as const;

// =============================================================================
// wagmi config
//
//  - 客户端构造（getConfig 套在 useState/useEffect 中）
//  - 公共 RPC（无 API key）：来自 chainlist.org 公共节点
//  - Alchemy/Infura key 放 .env，可提升稳定性
// =============================================================================
export function getWagmiConfig() {
  return createConfig({
    chains: SUPPORTED_CHAINS,
    connectors: [
      injected({ shimDisconnect: true }),     // MetaMask / Brave / OKX 等
      walletConnect({
        projectId: WC_PROJECT_ID,
        metadata: {
          name: 'ZS Exchange',
          description: '中萨数字科技交易所 — 真实行情 · Web3 钱包',
          url: 'https://zsexchange.app',
          icons: ['https://zsexchange.app/icon-192.png'],
        },
        showQrModal: true,
      }),
      coinbaseWallet({ appName: 'ZS Exchange' }),
    ],
    transports: {
      [mainnet.id]:   http(process.env.NEXT_PUBLIC_RPC_ETH     || 'https://eth.llamarpc.com'),
      [bsc.id]:       http(process.env.NEXT_PUBLIC_RPC_BSC     || 'https://bsc-dataseed.binance.org'),
      [polygon.id]:   http(process.env.NEXT_PUBLIC_RPC_POLYGON || 'https://polygon-rpc.com'),
      [arbitrum.id]:  http(process.env.NEXT_PUBLIC_RPC_ARBITRUM || 'https://arb1.arbitrum.io/rpc'),
    },
    ssr: true,
  });
}

// =============================================================================
// 工具：地址显示
// =============================================================================
export function shortAddress(addr?: string, head = 6, tail = 4): string {
  if (!addr) return '';
  if (addr.length <= head + tail) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}
