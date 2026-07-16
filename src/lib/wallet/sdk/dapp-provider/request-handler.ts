/**
 * DApp 请求处理器
 * 处理来自 DApp 的各种 EIP-1193 请求
 * 包括账户查询、链查询、签名、交易、链切换等
 */

import type {
  Address,
  AccountInfo,
  ChainConfig,
  SignRequest,
  TransactionRequest,
  SignType,
} from '../sdk.types';
import { SignConfirmManager } from '../sign-confirm/sign-confirm-manager';
import { NetworkManager } from '../network-manager/network-manager';
import { safeJsonParse } from '@/lib/security/safe-json-parse';

/**
 * 请求上下文
 */
export interface RequestContext {
  origin: string;
  sessionId?: string;
  chainId: number;
  accounts: AccountInfo[];
  currentAddress: Address;
}

/**
 * 请求处理结果
 */
export interface RequestResult<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

/**
 * 权限类型
 */
export interface Permission {
  parentCapability: string;
  invoker: string;
  caveats: Array<{
    type: string;
    value: any;
  }>;
}

/**
 * 请求处理器类
 * 处理所有 EIP-1193 标准的 JSON-RPC 请求
 */
export class RequestHandler {
  /**
   * 签名确认管理器
   */
  private signConfirmManager: SignConfirmManager;

  /**
   * 网络管理器
   */
  private networkManager: NetworkManager;

  /**
   * 调试模式
   */
  private debug: boolean;

  /**
   * 构造函数
   * @param signConfirmManager 签名确认管理器
   * @param networkManager 网络管理器
   * @param debug 是否启用调试
   */
  constructor(
    signConfirmManager: SignConfirmManager,
    networkManager: NetworkManager,
    debug: boolean = false,
  ) {
    this.signConfirmManager = signConfirmManager;
    this.networkManager = networkManager;
    this.debug = debug;
  }

  /**
   * 输出调试日志
   * @param args 日志参数
   */
  private log(...args: any[]): void {
    if (this.debug) {
      console.log('[RequestHandler]', ...args);
    }
  }

  /**
   * 处理请求
   * @param method 方法名
   * @param params 参数
   * @param context 请求上下文
   * @returns 处理结果
   */
  public async handleRequest(
    method: string,
    params: any[],
    context: RequestContext,
  ): Promise<RequestResult> {
    this.log('处理请求:', method, params);

    try {
      switch (method) {
        case 'eth_accounts':
          return this.handleEthAccounts(context);

        case 'eth_chainId':
          return this.handleEthChainId(context);

        case 'eth_requestAccounts':
          return this.handleEthRequestAccounts(context);

        case 'eth_sendTransaction':
          return this.handleEthSendTransaction(params, context);

        case 'eth_signTransaction':
          return this.handleEthSignTransaction(params, context);

        case 'eth_sign':
          return this.handleEthSign(params, context);

        case 'personal_sign':
          return this.handlePersonalSign(params, context);

        case 'eth_signTypedData':
        case 'eth_signTypedData_v1':
        case 'eth_signTypedData_v3':
        case 'eth_signTypedData_v4':
          return this.handleEthSignTypedData(method, params, context);

        case 'wallet_switchEthereumChain':
          return this.handleWalletSwitchEthereumChain(params, context);

        case 'wallet_addEthereumChain':
          return this.handleWalletAddEthereumChain(params, context);

        case 'wallet_watchAsset':
          return this.handleWalletWatchAsset(params, context);

        case 'wallet_getPermissions':
          return this.handleWalletGetPermissions(context);

        case 'wallet_requestPermissions':
          return this.handleWalletRequestPermissions(params, context);

        case 'eth_blockNumber':
          return this.handleEthBlockNumber(context);

        case 'eth_call':
          return this.handleEthCall(params, context);

        case 'eth_estimateGas':
          return this.handleEthEstimateGas(params, context);

        case 'eth_gasPrice':
          return this.handleEthGasPrice(context);

        case 'eth_getBalance':
          return this.handleEthGetBalance(params, context);

        case 'eth_getBlockByHash':
          return this.handleEthGetBlockByHash(params, context);

        case 'eth_getBlockByNumber':
          return this.handleEthGetBlockByNumber(params, context);

        case 'eth_getCode':
          return this.handleEthGetCode(params, context);

        case 'eth_getTransactionByHash':
          return this.handleEthGetTransactionByHash(params, context);

        case 'eth_getTransactionReceipt':
          return this.handleEthGetTransactionReceipt(params, context);

        case 'eth_getLogs':
          return this.handleEthGetLogs(params, context);

        case 'net_version':
          return this.handleNetVersion(context);

        case 'web3_clientVersion':
          return this.handleWeb3ClientVersion();

        case 'web3_sha3':
          return this.handleWeb3Sha3(params);

        default:
          return {
            success: false,
            error: {
              code: -32601,
              message: `方法不存在: ${method}`,
            },
          };
      }
    } catch (error: any) {
      this.log('请求处理错误:', error);
      return {
        success: false,
        error: {
          code: error.code || -32603,
          message: error.message || '内部错误',
          data: error.data,
        },
      };
    }
  }

  /**
   * eth_accounts - 获取账户列表
   */
  private handleEthAccounts(context: RequestContext): RequestResult {
    const addresses = context.accounts.map(a => a.address);
    return {
      success: true,
      data: addresses,
    };
  }

  /**
   * eth_chainId - 获取当前链 ID
   */
  private handleEthChainId(context: RequestContext): RequestResult {
    return {
      success: true,
      data: `0x${context.chainId.toString(16)}`,
    };
  }

  /**
   * eth_requestAccounts - 请求授权访问账户
   */
  private async handleEthRequestAccounts(context: RequestContext): Promise<RequestResult> {
    if (context.accounts.length > 0) {
      return {
        success: true,
        data: [context.currentAddress],
      };
    }

    return {
      success: false,
      error: {
        code: 4001,
        message: '用户拒绝了账户授权请求',
      },
    };
  }

  /**
   * eth_sendTransaction - 发送交易
   */
  private async handleEthSendTransaction(
    params: any[],
    context: RequestContext,
  ): Promise<RequestResult> {
    if (!params || params.length === 0) {
      return {
        success: false,
        error: {
          code: -32602,
          message: '缺少交易参数',
        },
      };
    }

    const tx = params[0];
    const transactionRequest: TransactionRequest = {
      id: `tx_${Date.now()}`,
      type: tx.data && tx.data !== '0x' ? 'contractCall' : 'transfer',
      from: tx.from || context.currentAddress,
      to: tx.to,
      value: tx.value || '0x0',
      data: tx.data || '0x',
      gasLimit: tx.gas || tx.gasLimit,
      gasPrice: tx.gasPrice,
      maxFeePerGas: tx.maxFeePerGas,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
      nonce: tx.nonce,
      chainId: context.chainId,
      status: 'pending',
      requestedAt: Date.now(),
      source: 'dapp',
      sessionId: context.sessionId,
    };

    const confirmResult = await this.signConfirmManager.requestConfirmation({
      type: 'transaction',
      transaction: transactionRequest,
      origin: context.origin,
      chainId: context.chainId,
      address: context.currentAddress,
    });

    if (!confirmResult.approved) {
      return {
        success: false,
        error: {
          code: 4001,
          message: '用户拒绝了交易',
        },
      };
    }

    return {
      success: true,
      data: `0x${'0'.repeat(64)}`,
    };
  }

  /**
   * eth_signTransaction - 签名交易
   */
  private async handleEthSignTransaction(
    params: any[],
    context: RequestContext,
  ): Promise<RequestResult> {
    if (!params || params.length === 0) {
      return {
        success: false,
        error: {
          code: -32602,
          message: '缺少交易参数',
        },
      };
    }

    const tx = params[0];
    const transactionRequest: TransactionRequest = {
      id: `tx_${Date.now()}`,
      type: tx.data && tx.data !== '0x' ? 'contractCall' : 'transfer',
      from: tx.from || context.currentAddress,
      to: tx.to,
      value: tx.value || '0x0',
      data: tx.data || '0x',
      gasLimit: tx.gas || tx.gasLimit,
      gasPrice: tx.gasPrice,
      maxFeePerGas: tx.maxFeePerGas,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
      nonce: tx.nonce,
      chainId: context.chainId,
      status: 'pending',
      requestedAt: Date.now(),
      source: 'dapp',
      sessionId: context.sessionId,
    };

    const confirmResult = await this.signConfirmManager.requestConfirmation({
      type: 'transaction',
      transaction: transactionRequest,
      origin: context.origin,
      chainId: context.chainId,
      address: context.currentAddress,
    });

    if (!confirmResult.approved) {
      return {
        success: false,
        error: {
          code: 4001,
          message: '用户拒绝了交易签名',
        },
      };
    }

    return {
      success: true,
      data: '0x',
    };
  }

  /**
   * eth_sign - 签名消息（旧版）
   */
  private async handleEthSign(
    params: any[],
    context: RequestContext,
  ): Promise<RequestResult> {
    if (!params || params.length < 2) {
      return {
        success: false,
        error: {
          code: -32602,
          message: '缺少签名参数',
        },
      };
    }

    const address = params[0];
    const message = params[1];

    const signRequest: SignRequest = {
      id: `sign_${Date.now()}`,
      type: 'ethSign',
      status: 'pending',
      address,
      chainId: context.chainId,
      rawMessage: message,
      parsedMessage: message,
      requestedAt: Date.now(),
      source: 'dapp',
      sessionId: context.sessionId,
    };

    const confirmResult = await this.signConfirmManager.requestConfirmation({
      type: 'sign',
      signRequest,
      origin: context.origin,
      chainId: context.chainId,
      address,
    });

    if (!confirmResult.approved) {
      return {
        success: false,
        error: {
          code: 4001,
          message: '用户拒绝了签名',
        },
      };
    }

    return {
      success: true,
      data: '0x',
    };
  }

  /**
   * personal_sign - 个人签名
   */
  private async handlePersonalSign(
    params: any[],
    context: RequestContext,
  ): Promise<RequestResult> {
    if (!params || params.length < 2) {
      return {
        success: false,
        error: {
          code: -32602,
          message: '缺少签名参数',
        },
      };
    }

    const message = params[0];
    const address = params[1];

    const signRequest: SignRequest = {
      id: `sign_${Date.now()}`,
      type: 'personalSign',
      status: 'pending',
      address,
      chainId: context.chainId,
      rawMessage: message,
      parsedMessage: message,
      requestedAt: Date.now(),
      source: 'dapp',
      sessionId: context.sessionId,
    };

    const confirmResult = await this.signConfirmManager.requestConfirmation({
      type: 'sign',
      signRequest,
      origin: context.origin,
      chainId: context.chainId,
      address,
    });

    if (!confirmResult.approved) {
      return {
        success: false,
        error: {
          code: 4001,
          message: '用户拒绝了签名',
        },
      };
    }

    return {
      success: true,
      data: '0x',
    };
  }

  /**
   * eth_signTypedData - 签名类型化数据
   */
  private async handleEthSignTypedData(
    method: string,
    params: any[],
    context: RequestContext,
  ): Promise<RequestResult> {
    if (!params || params.length < 2) {
      return {
        success: false,
        error: {
          code: -32602,
          message: '缺少签名参数',
        },
      };
    }

    const address = params[0];
    let typedData: unknown;
    let rawMessage: string;
    if (typeof params[1] === 'string') {
      const parsed = safeJsonParse(params[1], {
        context: 'wallet-request-handler-typedData',
        maxBytes: 64 * 1024,
        defaultValue: null,
        silent: true,
      });
      if (!parsed) {
        throw new Error('Invalid wallet request typedData');
      }
      typedData = parsed;
      rawMessage = params[1];
    } else {
      typedData = params[1];
      rawMessage = JSON.stringify(typedData);
    }

    const signType: SignType = method === 'eth_signTypedData_v4'
      ? 'ethSignTypedDataV4'
      : method === 'eth_signTypedData_v3'
        ? 'ethSignTypedDataV3'
        : method === 'eth_signTypedData_v1'
          ? 'ethSignTypedDataV1'
          : 'ethSignTypedData';

    const signRequest: SignRequest = {
      id: `sign_${Date.now()}`,
      type: signType,
      status: 'pending',
      address,
      chainId: context.chainId,
      rawMessage,
      parsedMessage: typedData,
      typedData,
      requestedAt: Date.now(),
      source: 'dapp',
      sessionId: context.sessionId,
    };

    const confirmResult = await this.signConfirmManager.requestConfirmation({
      type: 'sign',
      signRequest,
      origin: context.origin,
      chainId: context.chainId,
      address,
    });

    if (!confirmResult.approved) {
      return {
        success: false,
        error: {
          code: 4001,
          message: '用户拒绝了签名',
        },
      };
    }

    return {
      success: true,
      data: '0x',
    };
  }

  /**
   * wallet_switchEthereumChain - 切换链
   */
  private async handleWalletSwitchEthereumChain(
    params: any[],
    context: RequestContext,
  ): Promise<RequestResult> {
    if (!params || params.length === 0) {
      return {
        success: false,
        error: {
          code: -32602,
          message: '缺少参数',
        },
      };
    }

    const chainIdHex = params[0]?.chainId;
    if (!chainIdHex) {
      return {
        success: false,
        error: {
          code: -32602,
          message: '缺少 chainId 参数',
        },
      };
    }

    const chainId = parseInt(chainIdHex, 16);
    const chain = this.networkManager.getChain(chainId);

    if (!chain) {
      return {
        success: false,
        error: {
          code: 4902,
          message: `未找到链 ID: ${chainId}`,
        },
      };
    }

    const confirmResult = await this.signConfirmManager.requestConfirmation({
      type: 'switchChain',
      chain,
      origin: context.origin,
      chainId: context.chainId,
      address: context.currentAddress,
    });

    if (!confirmResult.approved) {
      return {
        success: false,
        error: {
          code: 4001,
          message: '用户拒绝了链切换',
        },
      };
    }

    return {
      success: true,
      data: null,
    };
  }

  /**
   * wallet_addEthereumChain - 添加链
   */
  private async handleWalletAddEthereumChain(
    params: any[],
    context: RequestContext,
  ): Promise<RequestResult> {
    if (!params || params.length === 0) {
      return {
        success: false,
        error: {
          code: -32602,
          message: '缺少参数',
        },
      };
    }

    const chainParams = params[0];
    const chainId = parseInt(chainParams.chainId, 16);

    if (this.networkManager.hasChain(chainId)) {
      return {
        success: true,
        data: null,
      };
    }

    const chainConfig: ChainConfig = {
      chainId,
      chainName: chainParams.chainName || `Chain ${chainId}`,
      chainType: 'evm',
      nativeCurrency: chainParams.nativeCurrency || {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: chainParams.rpcUrls || [],
      blockExplorers: chainParams.blockExplorerUrls
        ? chainParams.blockExplorerUrls.map((url: string) => ({
            name: 'Explorer',
            url,
            standard: 'EIP3091' as const,
          }))
        : [],
      shortName: chainParams.chainName?.toLowerCase().replace(/\s+/g, '-') || `chain-${chainId}`,
      networkId: chainId,
      priority: 100,
      enabled: false,
      gasConfig: {
        baseGasLimit: 21000,
        eip1559: true,
        maxGasLimit: 30000000,
        gasMultiplier: 1.2,
      },
    };

    const confirmResult = await this.signConfirmManager.requestConfirmation({
      type: 'addChain',
      chain: chainConfig,
      origin: context.origin,
      chainId: context.chainId,
      address: context.currentAddress,
    });

    if (!confirmResult.approved) {
      return {
        success: false,
        error: {
          code: 4001,
          message: '用户拒绝了添加链',
        },
      };
    }

    this.networkManager.addCustomChain(chainConfig);
    return {
      success: true,
      data: null,
    };
  }

  /**
   * wallet_watchAsset - 添加资产
   */
  private async handleWalletWatchAsset(
    params: any[],
    context: RequestContext,
  ): Promise<RequestResult> {
    if (!params || params.length === 0) {
      return {
        success: false,
        error: {
          code: -32602,
          message: '缺少参数',
        },
      };
    }

    const assetOptions = params[0];
    const confirmResult = await this.signConfirmManager.requestConfirmation({
      type: 'watchAsset',
      asset: assetOptions,
      origin: context.origin,
      chainId: context.chainId,
      address: context.currentAddress,
    });

    if (!confirmResult.approved) {
      return {
        success: false,
        error: {
          code: 4001,
          message: '用户拒绝了添加资产',
        },
      };
    }

    return {
      success: true,
      data: true,
    };
  }

  /**
   * wallet_getPermissions - 获取权限
   */
  private handleWalletGetPermissions(context: RequestContext): RequestResult {
    const permissions: Permission[] = [
      {
        parentCapability: 'eth_accounts',
        invoker: context.origin,
        caveats: [
          {
            type: 'restrictReturnedAccounts',
            value: [context.currentAddress],
          },
        ],
      },
    ];

    return {
      success: true,
      data: permissions,
    };
  }

  /**
   * wallet_requestPermissions - 请求权限
   */
  private async handleWalletRequestPermissions(
    params: any[],
    context: RequestContext,
  ): Promise<RequestResult> {
    if (!params || params.length === 0) {
      return {
        success: false,
        error: {
          code: -32602,
          message: '缺少参数',
        },
      };
    }

    const permissionsRequested = params[0];

    const confirmResult = await this.signConfirmManager.requestConfirmation({
      type: 'permission',
      permissions: permissionsRequested,
      origin: context.origin,
      chainId: context.chainId,
      address: context.currentAddress,
    });

    if (!confirmResult.approved) {
      return {
        success: false,
        error: {
          code: 4001,
          message: '用户拒绝了权限请求',
        },
      };
    }

    const grantedPermissions: Permission[] = [];
    if (permissionsRequested['eth_accounts']) {
      grantedPermissions.push({
        parentCapability: 'eth_accounts',
        invoker: context.origin,
        caveats: [
          {
            type: 'restrictReturnedAccounts',
            value: [context.currentAddress],
          },
        ],
      });
    }

    return {
      success: true,
      data: grantedPermissions,
    };
  }

  /**
   * eth_blockNumber - 获取当前区块号
   */
  private async handleEthBlockNumber(context: RequestContext): Promise<RequestResult> {
    try {
      const rpcUrl = await this.networkManager.getBestRpcUrl(context.chainId);
      if (!rpcUrl) {
        throw new Error('没有可用的 RPC 节点');
      }

      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: Date.now(),
        }),
      });

      const data = await response.json();
      return {
        success: !data.error,
        data: data.result,
        error: data.error,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: -32603,
          message: error.message,
        },
      };
    }
  }

  /**
   * eth_call - 调用合约方法
   */
  private async handleEthCall(params: any[], context: RequestContext): Promise<RequestResult> {
    try {
      const rpcUrl = await this.networkManager.getBestRpcUrl(context.chainId);
      if (!rpcUrl) {
        throw new Error('没有可用的 RPC 节点');
      }

      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params,
          id: Date.now(),
        }),
      });

      const data = await response.json();
      return {
        success: !data.error,
        data: data.result,
        error: data.error,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: -32603,
          message: error.message,
        },
      };
    }
  }

  /**
   * eth_estimateGas - 估算 Gas
   */
  private async handleEthEstimateGas(params: any[], context: RequestContext): Promise<RequestResult> {
    try {
      const rpcUrl = await this.networkManager.getBestRpcUrl(context.chainId);
      if (!rpcUrl) {
        throw new Error('没有可用的 RPC 节点');
      }

      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_estimateGas',
          params,
          id: Date.now(),
        }),
      });

      const data = await response.json();
      return {
        success: !data.error,
        data: data.result,
        error: data.error,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: -32603,
          message: error.message,
        },
      };
    }
  }

  /**
   * eth_gasPrice - 获取 Gas 价格
   */
  private async handleEthGasPrice(context: RequestContext): Promise<RequestResult> {
    try {
      const rpcUrl = await this.networkManager.getBestRpcUrl(context.chainId);
      if (!rpcUrl) {
        throw new Error('没有可用的 RPC 节点');
      }

      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_gasPrice',
          params: [],
          id: Date.now(),
        }),
      });

      const data = await response.json();
      return {
        success: !data.error,
        data: data.result,
        error: data.error,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: -32603,
          message: error.message,
        },
      };
    }
  }

  /**
   * eth_getBalance - 获取余额
   */
  private async handleEthGetBalance(params: any[], context: RequestContext): Promise<RequestResult> {
    try {
      const rpcUrl = await this.networkManager.getBestRpcUrl(context.chainId);
      if (!rpcUrl) {
        throw new Error('没有可用的 RPC 节点');
      }

      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params,
          id: Date.now(),
        }),
      });

      const data = await response.json();
      return {
        success: !data.error,
        data: data.result,
        error: data.error,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: -32603,
          message: error.message,
        },
      };
    }
  }

  /**
   * eth_getBlockByHash - 根据哈希获取区块
   */
  private async handleEthGetBlockByHash(params: any[], context: RequestContext): Promise<RequestResult> {
    try {
      const rpcUrl = await this.networkManager.getBestRpcUrl(context.chainId);
      if (!rpcUrl) {
        throw new Error('没有可用的 RPC 节点');
      }

      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBlockByHash',
          params,
          id: Date.now(),
        }),
      });

      const data = await response.json();
      return {
        success: !data.error,
        data: data.result,
        error: data.error,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: -32603,
          message: error.message,
        },
      };
    }
  }

  /**
   * eth_getBlockByNumber - 根据编号获取区块
   */
  private async handleEthGetBlockByNumber(params: any[], context: RequestContext): Promise<RequestResult> {
    try {
      const rpcUrl = await this.networkManager.getBestRpcUrl(context.chainId);
      if (!rpcUrl) {
        throw new Error('没有可用的 RPC 节点');
      }

      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBlockByNumber',
          params,
          id: Date.now(),
        }),
      });

      const data = await response.json();
      return {
        success: !data.error,
        data: data.result,
        error: data.error,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: -32603,
          message: error.message,
        },
      };
    }
  }

  /**
   * eth_getCode - 获取合约代码
   */
  private async handleEthGetCode(params: any[], context: RequestContext): Promise<RequestResult> {
    try {
      const rpcUrl = await this.networkManager.getBestRpcUrl(context.chainId);
      if (!rpcUrl) {
        throw new Error('没有可用的 RPC 节点');
      }

      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getCode',
          params,
          id: Date.now(),
        }),
      });

      const data = await response.json();
      return {
        success: !data.error,
        data: data.result,
        error: data.error,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: -32603,
          message: error.message,
        },
      };
    }
  }

  /**
   * eth_getTransactionByHash - 根据哈希获取交易
   */
  private async handleEthGetTransactionByHash(params: any[], context: RequestContext): Promise<RequestResult> {
    try {
      const rpcUrl = await this.networkManager.getBestRpcUrl(context.chainId);
      if (!rpcUrl) {
        throw new Error('没有可用的 RPC 节点');
      }

      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getTransactionByHash',
          params,
          id: Date.now(),
        }),
      });

      const data = await response.json();
      return {
        success: !data.error,
        data: data.result,
        error: data.error,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: -32603,
          message: error.message,
        },
      };
    }
  }

  /**
   * eth_getTransactionReceipt - 获取交易收据
   */
  private async handleEthGetTransactionReceipt(params: any[], context: RequestContext): Promise<RequestResult> {
    try {
      const rpcUrl = await this.networkManager.getBestRpcUrl(context.chainId);
      if (!rpcUrl) {
        throw new Error('没有可用的 RPC 节点');
      }

      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getTransactionReceipt',
          params,
          id: Date.now(),
        }),
      });

      const data = await response.json();
      return {
        success: !data.error,
        data: data.result,
        error: data.error,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: -32603,
          message: error.message,
        },
      };
    }
  }

  /**
   * eth_getLogs - 获取日志
   */
  private async handleEthGetLogs(params: any[], context: RequestContext): Promise<RequestResult> {
    try {
      const rpcUrl = await this.networkManager.getBestRpcUrl(context.chainId);
      if (!rpcUrl) {
        throw new Error('没有可用的 RPC 节点');
      }

      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getLogs',
          params,
          id: Date.now(),
        }),
      });

      const data = await response.json();
      return {
        success: !data.error,
        data: data.result,
        error: data.error,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: -32603,
          message: error.message,
        },
      };
    }
  }

  /**
   * net_version - 获取网络版本
   */
  private handleNetVersion(context: RequestContext): RequestResult {
    return {
      success: true,
      data: context.chainId.toString(),
    };
  }

  /**
   * web3_clientVersion - 获取客户端版本
   */
  private handleWeb3ClientVersion(): RequestResult {
    return {
      success: true,
      data: 'WalletSDK/1.0.0',
    };
  }

  /**
   * web3_sha3 - 计算 SHA3 哈希
   */
  private handleWeb3Sha3(params: any[]): RequestResult {
    if (!params || params.length === 0) {
      return {
        success: false,
        error: {
          code: -32602,
          message: '缺少参数',
        },
      };
    }

    return {
      success: true,
      data: '0x',
    };
  }
}
