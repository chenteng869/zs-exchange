'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseEther,
  formatEther,
  type Address,
  type Hash,
  type TransactionReceipt,
} from 'viem';
import { baseSepolia } from 'viem/chains';
import { FUJIAN_WINE_ABI, FUJIAN_WINE_CONTRACTS, PRICE_TIERS } from './abi';

export interface OrderInfo {
  orderId: bigint;
  buyer: Address;
  referrer: Address;
  priceTier: bigint;
  productCost: bigint;
  aiopcCommission: bigint;
  profitPoolTotal: bigint;
  zsVentureShare: bigint;
  overseasCryptoShare: bigint;
  businessSchoolShare: bigint;
  techTeamShare: bigint;
  operationsShare: bigint;
  affairsDeptShare: bigint;
  referrerShare: bigint;
  timestamp: bigint;
  processed: boolean;
}

export interface ProfitBreakdown {
  productCost: bigint;
  aiopcCommission: bigint;
  profitPool: bigint;
  zsVentureShare: bigint;
  overseasCryptoShare: bigint;
  businessSchoolShare: bigint;
  techTeamShare: bigint;
  operationsShare: bigint;
  affairsDeptShare: bigint;
  referrerShare: bigint;
}

export interface UseFujianWineOptions {
  chainId?: number;
  contractAddress?: Address;
}

export function useFujianWine(options: UseFujianWineOptions = {}) {
  const [chainId, setChainId] = useState<number>(options.chainId || 84532);
  const [contractAddress, setContractAddress] = useState<Address>(
    options.contractAddress || (FUJIAN_WINE_CONTRACTS[options.chainId || 84532] as Address)
  );
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPublicClient = useCallback(() => {
    return createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });
  }, []);

  const getWalletClient = useCallback(async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      throw new Error('MetaMask not installed');
    }
    return createWalletClient({
      chain: baseSepolia,
      transport: custom((window as any).ethereum),
    });
  }, []);

  // 连接钱包
  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const walletClient = await getWalletClient();
      const [address] = await walletClient.requestAddresses();
      setAccount(address);
      setIsConnected(true);

      // 监听账户变化
      if ((window as any).ethereum) {
        (window as any).ethereum.on('accountsChanged', (accounts: Address[]) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          } else {
            setAccount(null);
            setIsConnected(false);
          }
        });
      }

      return address;
    } catch (err: any) {
      setError(err.message || '连接钱包失败');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getWalletClient]);

  // 断开连接
  const disconnect = useCallback(() => {
    setAccount(null);
    setIsConnected(false);
  }, []);

  // 查询订单数量
  const getOrderCount = useCallback(async (): Promise<bigint> => {
    const publicClient = getPublicClient();
    const result = await publicClient.readContract({
      address: contractAddress,
      abi: FUJIAN_WINE_ABI,
      functionName: 'orderCount',
      authorizationList: [],
    });
    return result as bigint;
  }, [contractAddress, getPublicClient]);

  // 查询用户订单数量
  const getUserOrderCount = useCallback(async (user: Address): Promise<bigint> => {
    const publicClient = getPublicClient();
    const result = await publicClient.readContract({
      address: contractAddress,
      abi: FUJIAN_WINE_ABI,
      functionName: 'getUserOrderCount',
      args: [user],
      authorizationList: [],
    });
    return result as bigint;
  }, [contractAddress, getPublicClient]);

  // 查询用户订单列表
  const getUserOrders = useCallback(async (
    user: Address,
    offset: bigint = 0n,
    limit: bigint = 10n
  ): Promise<OrderInfo[]> => {
    const publicClient = getPublicClient();
    const result = await publicClient.readContract({
      address: contractAddress,
      abi: FUJIAN_WINE_ABI,
      functionName: 'getUserOrders',
      args: [user, offset, limit],
      authorizationList: [],
    });
    return (result as any[]).map((order) => ({
      orderId: order[0],
      buyer: order[1],
      referrer: order[2],
      priceTier: order[3],
      productCost: order[4],
      aiopcCommission: order[5],
      profitPoolTotal: order[6],
      zsVentureShare: order[7],
      overseasCryptoShare: order[8],
      businessSchoolShare: order[9],
      techTeamShare: order[10],
      operationsShare: order[11],
      affairsDeptShare: order[12],
      referrerShare: order[13],
      timestamp: order[14],
      processed: order[15],
    }));
  }, [contractAddress, getPublicClient]);

  // 查询分润明细（纯计算）
  const getProfitBreakdown = useCallback(async (priceTier: number): Promise<ProfitBreakdown> => {
    const publicClient = getPublicClient();
    const result = await publicClient.readContract({
      address: contractAddress,
      abi: FUJIAN_WINE_ABI,
      functionName: 'getProfitBreakdown',
      args: [parseEther(priceTier.toString())],
      authorizationList: [],
    });
    return {
      productCost: result[0] as bigint,
      aiopcCommission: result[1] as bigint,
      profitPool: result[2] as bigint,
      zsVentureShare: result[3] as bigint,
      overseasCryptoShare: result[4] as bigint,
      businessSchoolShare: result[5] as bigint,
      techTeamShare: result[6] as bigint,
      operationsShare: result[7] as bigint,
      affairsDeptShare: result[8] as bigint,
      referrerShare: result[9] as bigint,
    };
  }, [contractAddress, getPublicClient]);

  // 查询累计收益
  const getTotalEarned = useCallback(async (wallet: Address): Promise<bigint> => {
    const publicClient = getPublicClient();
    const result = await publicClient.readContract({
      address: contractAddress,
      abi: FUJIAN_WINE_ABI,
      functionName: 'totalEarned',
      args: [wallet],
      authorizationList: [],
    });
    return result as bigint;
  }, [contractAddress, getPublicClient]);

  // 创建订单（下单）
  const createOrder = useCallback(async (
    priceTier: number,
    referrer?: Address
  ): Promise<{ hash: Hash; orderId: bigint }> => {
    setIsLoading(true);
    setError(null);
    try {
      const walletClient = await getWalletClient();
      const [sender] = await walletClient.requestAddresses();

      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: FUJIAN_WINE_ABI,
        functionName: 'createOrder',
        args: [referrer || '0x0000000000000000000000000000000000000000', parseEther(priceTier.toString())],
        value: parseEther(priceTier.toString()),
        account: sender,
        chain: baseSepolia,
      });

      // 等待交易确认并获取事件
      const publicClient = getPublicClient();
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // 从事件中解析 orderId
      let orderId = 0n;
      if (receipt.logs && receipt.logs.length > 0) {
        try {
          const firstLog = receipt.logs[0] as any;
          const decoded = (publicClient as any).decodeEventLog({
            abi: FUJIAN_WINE_ABI,
            data: firstLog.data,
            topics: firstLog.topics,
          });
          if (decoded && decoded.args && decoded.args.orderId) {
            orderId = decoded.args.orderId;
          }
        } catch {
          // 忽略解析错误
        }
      }

      return { hash, orderId };
    } catch (err: any) {
      setError(err.message || '下单失败');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, getPublicClient, getWalletClient]);

  // 更新合约地址
  const updateContractAddress = useCallback((address: Address, newChainId?: number) => {
    setContractAddress(address);
    if (newChainId) {
      setChainId(newChainId);
    }
  }, []);

  // 辅助函数：格式化金额
  const formatAmount = useCallback((amount: bigint, decimals: number = 2): string => {
    return parseFloat(formatEther(amount)).toFixed(decimals);
  }, []);

  return {
    // 状态
    chainId,
    contractAddress,
    isConnected,
    account,
    isLoading,
    error,
    // 方法
    connect,
    disconnect,
    getOrderCount,
    getUserOrderCount,
    getUserOrders,
    getProfitBreakdown,
    getTotalEarned,
    createOrder,
    updateContractAddress,
    formatAmount,
    // 常量
    PRICE_TIERS,
  };
}

export default useFujianWine;
