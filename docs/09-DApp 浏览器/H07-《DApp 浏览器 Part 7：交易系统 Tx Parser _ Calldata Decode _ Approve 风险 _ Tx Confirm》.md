# H07\-《DApp 浏览器 Part 7：交易系统 Tx Parser / Calldata Decode / Approve 风险 / Tx Confirm》

# 《DApp 浏览器 Part 7：交易系统 Tx Parser / Calldata Decode / Approve 风险 / Tx Confirm》



本章实现 DApp 浏览器最高风险链路：**交易系统**。



覆盖：



- `eth_sendTransaction`

- 交易权限检查

- Tx 参数标准化

- Native Transfer 解析

- ERC20 `transfer` 解析

- ERC20 `approve` 解析

- 无限授权识别

- ERC721 `approve` 解析

- ERC721 `setApprovalForAll` 风险识别

- ERC1155 `setApprovalForAll`

- 合约黑名单

- 交易模拟

- Gas 估算

- Transaction Confirm Modal

- Wallet Transaction Signer

- `eth_sendRawTransaction` 广播

- `txHash` 返回

- 交易审计

- Router 接入

    

核心原则：



```Plain Text
任何 DApp 发交易都不能静默执行。
必须：
1. 校验 DApp send_transaction 权限
2. 标准化交易参数
3. 解析交易意图
4. 检查黑名单和高危授权
5. 估算 Gas
6. 可选交易模拟
7. 展示确认弹窗
8. 用户确认
9. Wallet Core 签名
10. RPC 广播
11. 返回 txHash
12. 写审计
```



---



## 1\. 本章目录结构



```Bash
src/modules/dapp-browser/
  core/
    transaction/
      transaction.types.ts
      transaction-normalizer.service.ts
      calldata-selectors.ts
      calldata-decoder.service.ts
      erc20-parser.service.ts
      nft-parser.service.ts
      transaction-risk.service.ts
      contract-security.service.ts
      transaction-simulation.service.ts
      gas-estimation.service.ts
      transaction-confirmation.service.ts
      wallet-transaction-signer.adapter.ts
      transaction-broadcast.service.ts
      transaction-audit.service.ts
      transaction-request.service.ts
      transaction-handler.service.ts

  ui/
    modals/
      TransactionConfirmModal.tsx
      TransactionRiskBadge.tsx
```



---



## 2\. 交易类型



### `core/transaction/transaction.types.ts`



```TypeScript
export type TransactionIntentType =
  | 'native_transfer'
  | 'erc20_transfer'
  | 'erc20_approve'
  | 'erc721_transfer'
  | 'erc721_approve'
  | 'erc721_set_approval_for_all'
  | 'erc1155_set_approval_for_all'
  | 'swap'
  | 'bridge'
  | 'contract_interaction'
  | 'contract_creation'
  | 'unknown';

export type TransactionRiskLevel =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'
  | 'blocked';

export interface NormalizedTransaction {
  from: string;
  to?: string;
  value: string;
  data: string;

  gas?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: string;
  chainId?: string;
}

export interface DecodedCalldata {
  selector?: string;
  methodName?: string;
  params?: Record;
  rawData: string;
}

export interface ParsedTransactionIntent {
  type: TransactionIntentType;

  title: string;
  description: string;

  from?: string;
  to?: string;

  contractAddress?: string;
  methodSelector?: string;
  methodName?: string;

  tokenAddress?: string;
  tokenSymbol?: string;
  tokenDecimals?: number;

  nftAddress?: string;
  tokenId?: string;

  spender?: string;
  operator?: string;
  recipient?: string;

  amount?: string;
  value?: string;

  unlimitedApproval?: boolean;
  approvalForAll?: boolean;

  decoded?: DecodedCalldata;

  raw: NormalizedTransaction;
}

export interface TransactionRiskResult {
  allowed: boolean;
  riskLevel: TransactionRiskLevel;
  reasons: string[];
  warnings: string[];
  metadata?: Record;
}

export interface TransactionSimulationResult {
  supported: boolean;
  success?: boolean;
  error?: string;
  gasUsed?: string;
  nativeBalanceChange?: string;
  tokenChanges?: Array;
  raw?: unknown;
}

export interface GasEstimationResult {
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  estimatedFeeNative?: string;
  error?: string;
}

export interface TransactionConfirmationInput {
  origin: string;
  hostname: string;
  accountId: string;
  address: string;
  chainId: string;
  tx: NormalizedTransaction;
  intent: ParsedTransactionIntent;
  risk: TransactionRiskResult;
  gas: GasEstimationResult;
  simulation?: TransactionSimulationResult;
}

export interface WalletTransactionSignInput {
  accountId: string;
  address: string;
  chainId: string;
  tx: NormalizedTransaction;
}

export interface WalletTransactionSignResult {
  rawTransaction: string;
  txHash?: string;
}

export interface TransactionRequestInput {
  origin: string;
  hostname: string;
  accountId: string;
  address: string;
  chainId: string;
  source: 'webview' | 'walletconnect' | 'deeplink' | 'internal';
  params: unknown[];
}
```



---



## 3\. Tx 参数标准化



### `core/transaction/transaction-normalizer.service.ts`



```TypeScript
import { NormalizedTransaction } from './transaction.types';

export class TransactionNormalizerService {
  normalize(input: {
    params: unknown[];
    activeAddress: string;
    activeChainId: string;
  }): NormalizedTransaction {
    const tx = input.params?.[0] as any;

    if (!tx || typeof tx !== 'object') {
      throw {
        code: -32602,
        message: 'eth_sendTransaction requires transaction object',
      };
    }

    const from = normalizeAddress(tx.from ?? input.activeAddress);
    const active = normalizeAddress(input.activeAddress);

    if (from !== active) {
      throw {
        code: 4100,
        message: 'Transaction from address does not match active account',
        data: {
          from,
          active,
        },
      };
    }

    if (tx.to !== undefined && tx.to !== null && typeof tx.to !== 'string') {
      throw {
        code: -32602,
        message: 'Invalid transaction.to',
      };
    }

    const normalized: NormalizedTransaction = {
      from,
      to: tx.to ? normalizeAddress(tx.to) : undefined,
      value: normalizeHexQuantity(tx.value ?? '0x0'),
      data: normalizeHexData(tx.data ?? '0x'),
      gas: tx.gas ? normalizeHexQuantity(tx.gas) : undefined,
      gasPrice: tx.gasPrice ? normalizeHexQuantity(tx.gasPrice) : undefined,
      maxFeePerGas: tx.maxFeePerGas ? normalizeHexQuantity(tx.maxFeePerGas) : undefined,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas
        ? normalizeHexQuantity(tx.maxPriorityFeePerGas)
        : undefined,
      nonce: tx.nonce ? normalizeHexQuantity(tx.nonce) : undefined,
      chainId: tx.chainId ? normalizeHexQuantity(tx.chainId) : input.activeChainId,
    };

    if (!normalized.to && normalized.data === '0x') {
      throw {
        code: -32602,
        message: 'Contract creation requires data',
      };
    }

    return normalized;
  }
}

function normalizeAddress(value: string): string {
  if (typeof value !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw {
      code: -32602,
      message: `Invalid address: ${value}`,
    };
  }

  return value.toLowerCase();
}

function normalizeHexQuantity(value: string | number | bigint): string {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value  | undefined {
    const word0 = this.getParamWord(data, 0);
    const word1 = this.getParamWord(data, 1);
    const word2 = this.getParamWord(data, 2);

    switch (selector) {
      case '0xa9059cbb':
        return {
          to: this.wordToAddress(word0),
          amount: this.wordToUint(word1),
        };

      case '0x095ea7b3':
        return {
          spender: this.wordToAddress(word0),
          amountOrTokenId: this.wordToUint(word1),
        };

      case '0x23b872dd':
        return {
          from: this.wordToAddress(word0),
          to: this.wordToAddress(word1),
          amountOrTokenId: this.wordToUint(word2),
        };

      case '0xa22cb465':
        return {
          operator: this.wordToAddress(word0),
          approved: this.wordToBool(word1),
        };

      default:
        return undefined;
    }
  }
}

const KNOWN_METHOD_NAMES: Record = {
  '0xa9059cbb': 'transfer(address,uint256)',
  '0x23b872dd': 'transferFrom(address,address,uint256)',
  '0x095ea7b3': 'approve(address,uint256)',
  '0xa22cb465': 'setApprovalForAll(address,bool)',
  '0x42842e0e': 'safeTransferFrom(address,address,uint256)',
  '0xb88d4fde': 'safeTransferFrom(address,address,uint256,bytes)',
  '0xf242432a': 'safeTransferFrom(address,address,uint256,uint256,bytes)',
  '0x2eb2c2d6': 'safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)',
  '0x38ed1739': 'swapExactTokensForTokens',
  '0x7ff36ab5': 'swapExactETHForTokens',
  '0x18cbafe5': 'swapExactTokensForETH',
  '0x414bf389': 'exactInputSingle',
  '0xc04b8d59': 'exactInput',
};
```



---



## 6\. ERC20 Parser



### `core/transaction/erc20-parser.service.ts`



```TypeScript
import {
  DecodedCalldata,
  NormalizedTransaction,
  ParsedTransactionIntent,
} from './transaction.types';
import {
  ERC20_SELECTORS,
  MAX_UINT256,
} from './calldata-selectors';

export class Erc20ParserService {
  parse(input: {
    tx: NormalizedTransaction;
    decoded: DecodedCalldata;
  }): ParsedTransactionIntent | null {
    const selector = input.decoded.selector;

    if (!selector || !input.tx.to) return null;

    if (selector === ERC20_SELECTORS.TRANSFER) {
      const to = input.decoded.params?.to as string | undefined;
      const amount = input.decoded.params?.amount as string | undefined;

      return {
        type: 'erc20_transfer',
        title: 'Token 转账',
        description: 'DApp 请求转出 ERC20 Token',
        from: input.tx.from,
        to,
        recipient: to,
        contractAddress: input.tx.to,
        tokenAddress: input.tx.to,
        methodSelector: selector,
        methodName: input.decoded.methodName,
        amount,
        decoded: input.decoded,
        raw: input.tx,
      };
    }

    if (selector === ERC20_SELECTORS.APPROVE) {
      const spender = input.decoded.params?.spender as string | undefined;
      const amount = input.decoded.params?.amountOrTokenId as string | undefined;
      const unlimitedApproval = isMaxUint(amount);

      return {
        type: 'erc20_approve',
        title: unlimitedApproval ? '无限 Token 授权' : 'Token 授权',
        description: unlimitedApproval
          ? 'DApp 请求无限额度使用你的 Token，风险极高'
          : 'DApp 请求获得指定额度 Token 使用权限',
        from: input.tx.from,
        to: input.tx.to,
        spender,
        contractAddress: input.tx.to,
        tokenAddress: input.tx.to,
        methodSelector: selector,
        methodName: input.decoded.methodName,
        amount,
        unlimitedApproval,
        decoded: input.decoded,
        raw: input.tx,
      };
    }

    if (selector === ERC20_SELECTORS.TRANSFER_FROM) {
      const from = input.decoded.params?.from as string | undefined;
      const to = input.decoded.params?.to as string | undefined;
      const amount = input.decoded.params?.amountOrTokenId as string | undefined;

      return {
        type: 'erc20_transfer',
        title: 'Token 转账',
        description: 'DApp 请求通过 transferFrom 转移 ERC20 Token',
        from,
        to,
        recipient: to,
        contractAddress: input.tx.to,
        tokenAddress: input.tx.to,
        methodSelector: selector,
        methodName: input.decoded.methodName,
        amount,
        decoded: input.decoded,
        raw: input.tx,
      };
    }

    return null;
  }
}

function isMaxUint(value?: string): boolean {
  if (!value) return false;

  try {
    return BigInt(value) === BigInt(MAX_UINT256);
  } catch {
    return false;
  }
}
```



---



## 7\. NFT Parser



### `core/transaction/nft-parser.service.ts`



```TypeScript
import {
  DecodedCalldata,
  NormalizedTransaction,
  ParsedTransactionIntent,
} from './transaction.types';
import { ERC721_SELECTORS } from './calldata-selectors';

export class NftParserService {
  parse(input: {
    tx: NormalizedTransaction;
    decoded: DecodedCalldata;
  }): ParsedTransactionIntent | null {
    const selector = input.decoded.selector;

    if (!selector || !input.tx.to) return null;

    if (selector === ERC721_SELECTORS.SET_APPROVAL_FOR_ALL) {
      const operator = input.decoded.params?.operator as string | undefined;
      const approved = input.decoded.params?.approved as boolean | undefined;

      return {
        type: 'erc721_set_approval_for_all',
        title: approved ? 'NFT 全部授权' : '取消 NFT 全部授权',
        description: approved
          ? 'DApp 请求管理你该 NFT 合约下的全部资产，风险极高'
          : 'DApp 请求取消 NFT 全部授权',
        from: input.tx.from,
        to: input.tx.to,
        operator,
        contractAddress: input.tx.to,
        nftAddress: input.tx.to,
        methodSelector: selector,
        methodName: input.decoded.methodName,
        approvalForAll: approved,
        decoded: input.decoded,
        raw: input.tx,
      };
    }

    if (selector === ERC721_SELECTORS.APPROVE) {
      const spender = input.decoded.params?.spender as string | undefined;
      const tokenId = input.decoded.params?.amountOrTokenId as string | undefined;

      return {
        type: 'erc721_approve',
        title: 'NFT 授权',
        description: 'DApp 请求获得指定 NFT 的操作权限',
        from: input.tx.from,
        to: input.tx.to,
        spender,
        tokenId,
        contractAddress: input.tx.to,
        nftAddress: input.tx.to,
        methodSelector: selector,
        methodName: input.decoded.methodName,
        decoded: input.decoded,
        raw: input.tx,
      };
    }

    if (
      selector === ERC721_SELECTORS.TRANSFER_FROM ||
      selector === ERC721_SELECTORS.SAFE_TRANSFER_FROM ||
      selector === ERC721_SELECTORS.SAFE_TRANSFER_FROM_WITH_DATA
    ) {
      const from = input.decoded.params?.from as string | undefined;
      const to = input.decoded.params?.to as string | undefined;
      const tokenId = input.decoded.params?.amountOrTokenId as string | undefined;

      return {
        type: 'erc721_transfer',
        title: 'NFT 转账',
        description: 'DApp 请求转移 NFT',
        from,
        to,
        recipient: to,
        tokenId,
        contractAddress: input.tx.to,
        nftAddress: input.tx.to,
        methodSelector: selector,
        methodName: input.decoded.methodName,
        decoded: input.decoded,
        raw: input.tx,
      };
    }

    return null;
  }
}
```



---



## 8\. Transaction Parser 主服务



### `core/transaction/transaction-parser.service.ts`



```TypeScript
import {
  COMMON_BRIDGE_SELECTORS,
  COMMON_SWAP_SELECTORS,
} from './calldata-selectors';
import { CalldataDecoderService } from './calldata-decoder.service';
import { Erc20ParserService } from './erc20-parser.service';
import { NftParserService } from './nft-parser.service';
import {
  NormalizedTransaction,
  ParsedTransactionIntent,
} from './transaction.types';

export class TransactionParserService {
  constructor(
    private readonly calldataDecoder: CalldataDecoderService,
    private readonly erc20Parser: Erc20ParserService,
    private readonly nftParser: NftParserService,
  ) {}

  parse(tx: NormalizedTransaction): ParsedTransactionIntent {
    const decoded = this.calldataDecoder.decode(tx.data);

    if (!tx.to) {
      return {
        type: 'contract_creation',
        title: '部署合约',
        description: 'DApp 请求部署新合约',
        from: tx.from,
        value: tx.value,
        decoded,
        raw: tx,
      };
    }

    if (tx.data === '0x' && BigInt(tx.value) > 0n) {
      return {
        type: 'native_transfer',
        title: '原生币转账',
        description: 'DApp 请求转出原生资产',
        from: tx.from,
        to: tx.to,
        recipient: tx.to,
        value: tx.value,
        decoded,
        raw: tx,
      };
    }

    const erc20 = this.erc20Parser.parse({ tx, decoded });
    if (erc20) return erc20;

    const nft = this.nftParser.parse({ tx, decoded });
    if (nft) return nft;

    if (decoded.selector && COMMON_SWAP_SELECTORS.has(decoded.selector)) {
      return {
        type: 'swap',
        title: 'Swap 交易',
        description: 'DApp 请求执行代币兑换',
        from: tx.from,
        to: tx.to,
        contractAddress: tx.to,
        methodSelector: decoded.selector,
        methodName: decoded.methodName,
        value: tx.value,
        decoded,
        raw: tx,
      };
    }

    if (decoded.selector && COMMON_BRIDGE_SELECTORS.has(decoded.selector)) {
      return {
        type: 'bridge',
        title: '跨链交易',
        description: 'DApp 请求执行跨链或聚合调用',
        from: tx.from,
        to: tx.to,
        contractAddress: tx.to,
        methodSelector: decoded.selector,
        methodName: decoded.methodName,
        value: tx.value,
        decoded,
        raw: tx,
      };
    }

    return {
      type: 'contract_interaction',
      title: '合约交互',
      description: 'DApp 请求调用智能合约',
      from: tx.from,
      to: tx.to,
      contractAddress: tx.to,
      methodSelector: decoded.selector,
      methodName: decoded.methodName,
      value: tx.value,
      decoded,
      raw: tx,
    };
  }
}
```



---



## 9\. 合约安全服务



### `core/transaction/contract-security.service.ts`



```TypeScript
export interface ContractSecurityPolicy {
  blacklistedContracts: string[];
  warnedContracts: string[];
}

export class ContractSecurityService {
  private policy: ContractSecurityPolicy = {
    blacklistedContracts: [],
    warnedContracts: [],
  };

  setPolicy(policy: ContractSecurityPolicy) {
    this.policy = {
      blacklistedContracts: policy.blacklistedContracts.map((item) => item.toLowerCase()),
      warnedContracts: policy.warnedContracts.map((item) => item.toLowerCase()),
    };
  }

  check(input: {
    chainId: string;
    address?: string;
  }): {
    blocked: boolean;
    warned: boolean;
    reasons: string[];
  } {
    if (!input.address) {
      return {
        blocked: false,
        warned: false,
        reasons: [],
      };
    }

    const address = input.address.toLowerCase();

    if (this.policy.blacklistedContracts.includes(address)) {
      return {
        blocked: true,
        warned: false,
        reasons: ['CONTRACT_BLACKLISTED'],
      };
    }

    if (this.policy.warnedContracts.includes(address)) {
      return {
        blocked: false,
        warned: true,
        reasons: ['CONTRACT_WARNED'],
      };
    }

    return {
      blocked: false,
      warned: false,
      reasons: [],
    };
  }
}
```



---



## 10\. Transaction Risk Service



### `core/transaction/transaction-risk.service.ts`



```TypeScript
import {
  ParsedTransactionIntent,
  TransactionRiskResult,
} from './transaction.types';
import { ContractSecurityService } from './contract-security.service';

export class TransactionRiskService {
  constructor(
    private readonly contractSecurity: ContractSecurityService,
  ) {}

  evaluate(input: {
    chainId: string;
    intent: ParsedTransactionIntent;
  }): TransactionRiskResult {
    const reasons: string[] = [];
    const warnings: string[] = [];

    let riskLevel: TransactionRiskResult['riskLevel'] = 'low';
    let allowed = true;

    const contractCheck = this.contractSecurity.check({
      chainId: input.chainId,
      address: input.intent.contractAddress ?? input.intent.to,
    });

    if (contractCheck.blocked) {
      allowed = false;
      riskLevel = 'blocked';
      reasons.push(...contractCheck.reasons);
    }

    if (contractCheck.warned) {
      riskLevel = maxRisk(riskLevel, 'high');
      warnings.push(...contractCheck.reasons);
    }

    switch (input.intent.type) {
      case 'erc20_approve':
        if (input.intent.unlimitedApproval) {
          riskLevel = maxRisk(riskLevel, 'critical');
          warnings.push('UNLIMITED_ERC20_APPROVAL');
        } else {
          riskLevel = maxRisk(riskLevel, 'medium');
          warnings.push('ERC20_APPROVAL');
        }
        break;

      case 'erc721_set_approval_for_all':
      case 'erc1155_set_approval_for_all':
        if (input.intent.approvalForAll) {
          riskLevel = maxRisk(riskLevel, 'critical');
          warnings.push('NFT_APPROVAL_FOR_ALL');
        }
        break;

      case 'contract_creation':
        riskLevel = maxRisk(riskLevel, 'high');
        warnings.push('CONTRACT_CREATION');
        break;

      case 'contract_interaction':
      case 'unknown':
        riskLevel = maxRisk(riskLevel, 'medium');
        warnings.push('UNKNOWN_CONTRACT_INTERACTION');
        break;

      case 'bridge':
        riskLevel = maxRisk(riskLevel, 'high');
        warnings.push('BRIDGE_TRANSACTION');
        break;

      case 'swap':
        riskLevel = maxRisk(riskLevel, 'medium');
        warnings.push('SWAP_TRANSACTION');
        break;
    }

    if (input.intent.value && BigInt(input.intent.value) > 0n) {
      warnings.push('NATIVE_VALUE_TRANSFER');
    }

    return {
      allowed,
      riskLevel,
      reasons,
      warnings,
      metadata: {
        intentType: input.intent.type,
      },
    };
  }
}

const RISK_ORDER = ['low', 'medium', 'high', 'critical', 'blocked'] as const;

function maxRisk(a: T, b: T): T {
  return RISK_ORDER.indexOf(a) >= RISK_ORDER.indexOf(b) ? a : b;
}
```



---



## 11\. Gas Estimation



### `core/transaction/gas-estimation.service.ts`



```TypeScript
import { ActiveChainService } from '../chains/active-chain.service';
import { RpcClientService } from '../rpc/rpc-client.service';
import {
  GasEstimationResult,
  NormalizedTransaction,
} from './transaction.types';

export class GasEstimationService {
  constructor(
    private readonly activeChain: ActiveChainService,
    private readonly rpcClient: RpcClientService,
  ) {}

  async estimate(input: {
    tx: NormalizedTransaction;
  }): Promise {
    const chain = await this.activeChain.getActiveChain();

    try {
      const gas = await this.rpcClient.request({
        chain,
        method: 'eth_estimateGas',
        params: [input.tx],
        options: {
          timeoutMs: 15_000,
          retries: 1,
        },
      });

      const gasLimit = (gas.response as any).result as string;

      const feeHistory = await this.tryFeeHistory(chain);
      if (feeHistory) {
        return {
          gasLimit,
          maxFeePerGas: feeHistory.maxFeePerGas,
          maxPriorityFeePerGas: feeHistory.maxPriorityFeePerGas,
          estimatedFeeNative: multiplyHex(gasLimit, feeHistory.maxFeePerGas),
        };
      }

      const gasPrice = await this.rpcClient.request({
        chain,
        method: 'eth_gasPrice',
        params: [],
      });

      const gasPriceValue = (gasPrice.response as any).result as string;

      return {
        gasLimit,
        gasPrice: gasPriceValue,
        estimatedFeeNative: multiplyHex(gasLimit, gasPriceValue),
      };
    } catch (error: any) {
      return {
        error: error?.message ?? String(error),
      };
    }
  }

  private async tryFeeHistory(chain: any): Promise {
    try {
      const priority = await this.rpcClient.request({
        chain,
        method: 'eth_maxPriorityFeePerGas',
        params: [],
      });

      const maxPriorityFeePerGas = (priority.response as any).result as string;

      const gasPrice = await this.rpcClient.request({
        chain,
        method: 'eth_gasPrice',
        params: [],
      });

      const maxFeePerGas = (gasPrice.response as any).result as string;

      return {
        maxFeePerGas,
        maxPriorityFeePerGas,
      };
    } catch {
      return null;
    }
  }
}

function multiplyHex(a: string, b: string): string {
  return `0x${(BigInt(a) * BigInt(b)).toString(16)}`;
}
```



---



## 12\. Transaction Simulation



### `core/transaction/transaction-simulation.service.ts`



```TypeScript
import { ActiveChainService } from '../chains/active-chain.service';
import { RpcClientService } from '../rpc/rpc-client.service';
import {
  NormalizedTransaction,
  TransactionSimulationResult,
} from './transaction.types';

export class TransactionSimulationService {
  constructor(
    private readonly activeChain: ActiveChainService,
    private readonly rpcClient: RpcClientService,
  ) {}

  async simulate(input: {
    tx: NormalizedTransaction;
  }): Promise {
    const chain = await this.activeChain.getActiveChain();

    try {
      const result = await this.rpcClient.request({
        chain,
        method: 'eth_call',
        params: [
          {
            from: input.tx.from,
            to: input.tx.to,
            value: input.tx.value,
            data: input.tx.data,
          },
          'latest',
        ],
        options: {
          timeoutMs: 15_000,
          retries: 0,
        },
      });

      if ('error' in result.response && result.response.error) {
        return {
          supported: true,
          success: false,
          error: result.response.error.message,
          raw: result.response.error,
        };
      }

      return {
        supported: true,
        success: true,
        raw: (result.response as any).result,
      };
    } catch (error: any) {
      return {
        supported: true,
        success: false,
        error: error?.message ?? String(error),
      };
    }
  }
}
```



---



## 13\. Transaction Confirmation Service



### `core/transaction/transaction-confirmation.service.ts`



```TypeScript
import {
  ConfirmationControllerService,
  newConfirmationId,
} from '../confirmations/confirmation-controller.service';
import { TransactionConfirmationInput } from './transaction.types';

export class TransactionConfirmationService {
  constructor(
    private readonly controller: ConfirmationControllerService,
  ) {}

  async confirmTransaction(input: TransactionConfirmationInput): Promise {
    const result = await this.controller.request({
      confirmationId: newConfirmationId(),
      kind: 'send_transaction',
      origin: input.origin,
      hostname: input.hostname,
      accountId: input.accountId,
      address: input.address,
      chainId: input.chainId,
      tx: input.tx,
      intent: input.intent,
      risk: input.risk,
      gas: input.gas,
      simulation: input.simulation,
      createdAt: Date.now(),
      expiresAt: Date.now() + 180_000,
    } as any);

    return result.approved;
  }
}
```



---



## 14\. Wallet Transaction Signer



### `core/transaction/wallet-transaction-signer.adapter.ts`



```TypeScript
import {
  WalletTransactionSignInput,
  WalletTransactionSignResult,
} from './transaction.types';

export interface WalletTransactionSignerAdapter {
  signTransaction(
    input: WalletTransactionSignInput,
  ): Promise;
}

export class MockWalletTransactionSignerAdapter
  implements WalletTransactionSignerAdapter {
  async signTransaction(
    input: WalletTransactionSignInput,
  ): Promise {
    console.log('[MockWalletTxSigner] signTransaction', input);

    return {
      rawTransaction: '0xf86c808504a817c80082520894aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa880de0b6b3a76400008025a0aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa0bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    };
  }
}
```



---



## 15\. Transaction Broadcast



### `core/transaction/transaction-broadcast.service.ts`



```TypeScript
import { ActiveChainService } from '../chains/active-chain.service';
import { RpcClientService } from '../rpc/rpc-client.service';

export class TransactionBroadcastService {
  constructor(
    private readonly activeChain: ActiveChainService,
    private readonly rpcClient: RpcClientService,
  ) {}

  async broadcast(rawTransaction: string): Promise {
    const chain = await this.activeChain.getActiveChain();

    const result = await this.rpcClient.request({
      chain,
      method: 'eth_sendRawTransaction',
      params: [rawTransaction],
      options: {
        timeoutMs: 20_000,
        retries: 0,
      },
    });

    if ('error' in result.response && result.response.error) {
      throw result.response.error;
    }

    return (result.response as any).result as string;
  }
}
```



---



## 16\. Transaction Audit



### `core/transaction/transaction-audit.service.ts`



```TypeScript
import {
  ParsedTransactionIntent,
  TransactionRiskResult,
} from './transaction.types';

export interface TransactionAuditRecord {
  auditNo: string;
  action:
    | 'dapp.tx.requested'
    | 'dapp.tx.approved'
    | 'dapp.tx.rejected'
    | 'dapp.tx.blocked'
    | 'dapp.tx.broadcasted'
    | 'dapp.tx.failed';

  origin: string;
  hostname: string;

  accountId: string;
  address: string;
  chainId: string;

  intentType?: string;
  riskLevel?: string;
  riskReasons?: string[];
  warnings?: string[];

  txHash?: string;
  payload?: unknown;
  error?: unknown;

  createdAt: number;
}

export interface TransactionAuditSink {
  record(input: TransactionAuditRecord): Promise;
}

export class ConsoleTransactionAuditSink implements TransactionAuditSink {
  async record(input: TransactionAuditRecord): Promise {
    console.log('[TransactionAudit]', input);
  }
}

export class TransactionAuditService {
  constructor(
    private readonly sink: TransactionAuditSink = new ConsoleTransactionAuditSink(),
  ) {}

  async requested(input: BaseAuditInput) {
    await this.record('dapp.tx.requested', input);
  }

  async approved(input: BaseAuditInput) {
    await this.record('dapp.tx.approved', input);
  }

  async rejected(input: BaseAuditInput) {
    await this.record('dapp.tx.rejected', input);
  }

  async blocked(input: BaseAuditInput) {
    await this.record('dapp.tx.blocked', input);
  }

  async broadcasted(input: BaseAuditInput & { txHash: string }) {
    await this.record('dapp.tx.broadcasted', input);
  }

  async failed(input: BaseAuditInput & { error: unknown }) {
    await this.record('dapp.tx.failed', input);
  }

  private async record(
    action: TransactionAuditRecord['action'],
    input: BaseAuditInput & {
      txHash?: string;
      error?: unknown;
    },
  ) {
    await this.sink.record({
      auditNo: this.newAuditNo(),
      action,

      origin: input.origin,
      hostname: input.hostname,

      accountId: input.accountId,
      address: input.address,
      chainId: input.chainId,

      intentType: input.intent?.type,
      riskLevel: input.risk?.riskLevel,
      riskReasons: input.risk?.reasons,
      warnings: input.risk?.warnings,

      txHash: input.txHash,
      payload: {
        tx: input.tx,
        intent: input.intent,
        risk: input.risk,
        gas: input.gas,
        simulation: input.simulation,
      },
      error: input.error,

      createdAt: Date.now(),
    });
  }

  private newAuditNo(): string {
    return `TAUD-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

interface BaseAuditInput {
  origin: string;
  hostname: string;
  accountId: string;
  address: string;
  chainId: string;

  tx?: unknown;
  intent?: ParsedTransactionIntent;
  risk?: TransactionRiskResult;
  gas?: unknown;
  simulation?: unknown;
}
```



---



## 17\. Transaction Request Service



主交易服务。



### `core/transaction/transaction-request.service.ts`



```TypeScript
import { DappPermissionService } from '../permissions/dapp-permission.service';
import { TransactionNormalizerService } from './transaction-normalizer.service';
import { TransactionParserService } from './transaction-parser.service';
import { TransactionRiskService } from './transaction-risk.service';
import { GasEstimationService } from './gas-estimation.service';
import { TransactionSimulationService } from './transaction-simulation.service';
import { TransactionConfirmationService } from './transaction-confirmation.service';
import { WalletTransactionSignerAdapter } from './wallet-transaction-signer.adapter';
import { TransactionBroadcastService } from './transaction-broadcast.service';
import { TransactionAuditService } from './transaction-audit.service';
import { TransactionRequestInput } from './transaction.types';

export class TransactionRequestService {
  constructor(
    private readonly permissionService: DappPermissionService,
    private readonly normalizer: TransactionNormalizerService,
    private readonly parser: TransactionParserService,
    private readonly riskService: TransactionRiskService,
    private readonly gasEstimation: GasEstimationService,
    private readonly simulation: TransactionSimulationService,
    private readonly confirmation: TransactionConfirmationService,
    private readonly signer: WalletTransactionSignerAdapter,
    private readonly broadcaster: TransactionBroadcastService,
    private readonly audit: TransactionAuditService,
  ) {}

  async sendTransaction(input: TransactionRequestInput): Promise {
    await this.permissionService.assertPermission({
      origin: input.origin,
      accountId: input.accountId,
      chainId: input.chainId,
      source: input.source,
      permission: 'send_transaction',
    });

    const tx = this.normalizer.normalize({
      params: input.params,
      activeAddress: input.address,
      activeChainId: input.chainId,
    });

    const intent = this.parser.parse(tx);

    const risk = this.riskService.evaluate({
      chainId: input.chainId,
      intent,
    });

    const gas = await this.gasEstimation.estimate({ tx });

    const simulation = await this.simulation.simulate({ tx });

    await this.audit.requested({
      origin: input.origin,
      hostname: input.hostname,
      accountId: input.accountId,
      address: input.address,
      chainId: input.chainId,
      tx,
      intent,
      risk,
      gas,
      simulation,
    });

    if (!risk.allowed) {
      await this.audit.blocked({
        origin: input.origin,
        hostname: input.hostname,
        accountId: input.accountId,
        address: input.address,
        chainId: input.chainId,
        tx,
        intent,
        risk,
        gas,
        simulation,
      });

      throw {
        code: 4001,
        message: 'Transaction blocked by security policy',
        data: {
          risk,
        },
      };
    }

    const approved = await this.confirmation.confirmTransaction({
      origin: input.origin,
      hostname: input.hostname,
      accountId: input.accountId,
      address: input.address,
      chainId: input.chainId,
      tx,
      intent,
      risk,
      gas,
      simulation,
    });

    if (!approved) {
      await this.audit.rejected({
        origin: input.origin,
        hostname: input.hostname,
        accountId: input.accountId,
        address: input.address,
        chainId: input.chainId,
        tx,
        intent,
        risk,
        gas,
        simulation,
      });

      throw {
        code: 4001,
        message: 'User rejected transaction',
      };
    }

    await this.audit.approved({
      origin: input.origin,
      hostname: input.hostname,
      accountId: input.accountId,
      address: input.address,
      chainId: input.chainId,
      tx,
      intent,
      risk,
      gas,
      simulation,
    });

    try {
      const signed = await this.signer.signTransaction({
        accountId: input.accountId,
        address: input.address,
        chainId: input.chainId,
        tx: {
          ...tx,
          gas: tx.gas ?? gas.gasLimit,
          gasPrice: tx.gasPrice ?? gas.gasPrice,
          maxFeePerGas: tx.maxFeePerGas ?? gas.maxFeePerGas,
          maxPriorityFeePerGas:
            tx.maxPriorityFeePerGas ?? gas.maxPriorityFeePerGas,
        },
      });

      const txHash = signed.txHash ??
        await this.broadcaster.broadcast(signed.rawTransaction);

      await this.audit.broadcasted({
        origin: input.origin,
        hostname: input.hostname,
        accountId: input.accountId,
        address: input.address,
        chainId: input.chainId,
        tx,
        intent,
        risk,
        gas,
        simulation,
        txHash,
      });

      return txHash;
    } catch (error) {
      await this.audit.failed({
        origin: input.origin,
        hostname: input.hostname,
        accountId: input.accountId,
        address: input.address,
        chainId: input.chainId,
        tx,
        intent,
        risk,
        gas,
        simulation,
        error,
      });

      throw error;
    }
  }
}
```



---



## 18\. Transaction Handler



接入 Router。



### `core/transaction/transaction-handler.service.ts`



```TypeScript
import { DappBridgeRequest } from '../bridge/dapp-bridge.types';
import {
  DappMethodHandler,
  DappRouteResult,
} from '../router/dapp-router.types';
import { ProviderMethods } from '../provider/provider-methods';
import { TransactionRequestService } from './transaction-request.service';

export class TransactionHandlerService implements DappMethodHandler {
  constructor(
    private readonly transactionService: TransactionRequestService,
  ) {}

  async handle(input: DappBridgeRequest): Promise {
    if (input.request.method !== ProviderMethods.ETH_SEND_TRANSACTION) {
      throw {
        code: 4200,
        message: `Unsupported transaction method: ${input.request.method}`,
      };
    }

    if (!input.context.address) {
      throw {
        code: 4100,
        message: 'No active account address',
      };
    }

    const txHash = await this.transactionService.sendTransaction({
      origin: input.context.origin,
      hostname: input.context.hostname,
      accountId: input.context.accountId,
      address: input.context.address,
      chainId: input.context.chainId,
      source: input.context.source,
      params: input.request.params ?? [],
    });

    return {
      result: txHash,
    };
  }
}
```



---



## 19\. UI：Risk Badge



### `ui/modals/TransactionRiskBadge.tsx`



```TypeScript
import React from 'react';
import { Text, View } from 'react-native';

export function TransactionRiskBadge(props: {
  level: string;
}) {
  const color = getColor(props.level);

  return (
    
      
        {props.level.toUpperCase()}
      
    
  );
}

function getColor(level: string) {
  switch (level) {
    case 'low':
      return { bg: '#ECFDF5', fg: '#047857' };
    case 'medium':
      return { bg: '#FFFBEB', fg: '#92400E' };
    case 'high':
      return { bg: '#FFF7ED', fg: '#C2410C' };
    case 'critical':
    case 'blocked':
      return { bg: '#FEF2F2', fg: '#991B1B' };
    default:
      return { bg: '#F3F4F6', fg: '#374151' };
  }
}
```



---



## 20\. UI：TransactionConfirmModal



### `ui/modals/TransactionConfirmModal.tsx`



```TypeScript
import React from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  GasEstimationResult,
  ParsedTransactionIntent,
  TransactionRiskResult,
  TransactionSimulationResult,
} from '../../core/transaction/transaction.types';
import { TransactionRiskBadge } from './TransactionRiskBadge';

export function TransactionConfirmModal(props: {
  visible: boolean;
  request: {
    confirmationId: string;
    origin: string;
    hostname: string;
    address: string;
    chainId: string;
    intent: ParsedTransactionIntent;
    risk: TransactionRiskResult;
    gas: GasEstimationResult;
    simulation?: TransactionSimulationResult;
  } | null;
  onApprove: () => void;
  onReject: () => void;
}) {
  const req = props.request;

  return (
    
      
        
          
            
              交易确认
              {req?.hostname}
            

            {req?.risk && (
              
            )}
          

          
            {req?.intent.title}
            {req?.intent.description}
          

          
          
          
          

          {req?.intent.recipient && (
            
          )}

          {req?.intent.spender && (
            
          )}

          {req?.intent.operator && (
            
          )}

          {req?.intent.amount && (
            
          )}

          {req?.intent.tokenId && (
            
          )}

          {req?.intent.value && req.intent.value !== '0x0' && (
            
          )}

          
          

          {req?.risk.warnings.length ? (
            
              风险提示
              {req.risk.warnings.map((item) => (
                
                  • {item}
                
              ))}
            
          ) : null}

          {req?.simulation && (
            
              交易模拟
              
                {req.simulation.success
                  ? '模拟成功'
                  : `模拟失败：${req.simulation.error ?? '未知错误'}`}
              
            
          )}

          
            请确认交易内容。链上交易一旦广播通常不可撤销。
          

          
            
              拒绝
            

            
              确认交易
            
          
        
      
    
  );
}

function InfoRow(props: {
  label: string;
  value?: string;
}) {
  return (
    
      
        {props.label}
      
      
        {props.value ?? '-'}
      
    
  );
}

function shorten(value?: string) {
  if (!value) return '-';
  if (value.length 
```



---



## 22\. Runtime 工厂接入交易系统



在 `create-dapp-router-runtime.ts` 新增：



```TypeScript
import { TransactionNormalizerService } from '../transaction/transaction-normalizer.service';
import { CalldataDecoderService } from '../transaction/calldata-decoder.service';
import { Erc20ParserService } from '../transaction/erc20-parser.service';
import { NftParserService } from '../transaction/nft-parser.service';
import { TransactionParserService } from '../transaction/transaction-parser.service';
import { ContractSecurityService } from '../transaction/contract-security.service';
import { TransactionRiskService } from '../transaction/transaction-risk.service';
import { GasEstimationService } from '../transaction/gas-estimation.service';
import { TransactionSimulationService } from '../transaction/transaction-simulation.service';
import { TransactionConfirmationService } from '../transaction/transaction-confirmation.service';
import { MockWalletTransactionSignerAdapter } from '../transaction/wallet-transaction-signer.adapter';
import { TransactionBroadcastService } from '../transaction/transaction-broadcast.service';
import { TransactionAuditService } from '../transaction/transaction-audit.service';
import { TransactionRequestService } from '../transaction/transaction-request.service';
import { TransactionHandlerService } from '../transaction/transaction-handler.service';
```



工厂内部：



```TypeScript
const transactionNormalizer = new TransactionNormalizerService();
const calldataDecoder = new CalldataDecoderService();
const erc20Parser = new Erc20ParserService();
const nftParser = new NftParserService();

const transactionParser = new TransactionParserService(
  calldataDecoder,
  erc20Parser,
  nftParser,
);

const contractSecurity = new ContractSecurityService();

contractSecurity.setPolicy({
  blacklistedContracts: [
    '0x000000000000000000000000000000000000dead',
  ],
  warnedContracts: [],
});

const transactionRisk = new TransactionRiskService(contractSecurity);

const gasEstimation = new GasEstimationService(
  activeChain,
  rpcClient,
);

const transactionSimulation = new TransactionSimulationService(
  activeChain,
  rpcClient,
);

const transactionConfirmation = new TransactionConfirmationService(
  confirmationController,
);

const walletTransactionSigner = new MockWalletTransactionSignerAdapter();

const transactionBroadcast = new TransactionBroadcastService(
  activeChain,
  rpcClient,
);

const transactionAudit = new TransactionAuditService();

const transactionRequestService = new TransactionRequestService(
  permissionService,
  transactionNormalizer,
  transactionParser,
  transactionRisk,
  gasEstimation,
  transactionSimulation,
  transactionConfirmation,
  walletTransactionSigner,
  transactionBroadcast,
  transactionAudit,
);

const transactionHandler = new TransactionHandlerService(
  transactionRequestService,
);
```



Router 注入：



```TypeScript
const router = new DappRequestRouterService({
  accountHandler: permissionService,
  chainHandler,
  rpcHandler,
  signingHandler,
  transactionHandler,
});
```



返回对象追加：



```TypeScript
return {
  ...

  transactionNormalizer,
  calldataDecoder,
  erc20Parser,
  nftParser,
  transactionParser,
  contractSecurity,
  transactionRisk,
  gasEstimation,
  transactionSimulation,
  transactionConfirmation,
  walletTransactionSigner,
  transactionBroadcast,
  transactionAudit,
  transactionRequestService,
  transactionHandler,
};
```



---



## 23\. DApp 侧测试



### 23\.1 Native Transfer



```TypeScript
const accounts = await ethereum.request({
  method: 'eth_requestAccounts',
});

const txHash = await ethereum.request({
  method: 'eth_sendTransaction',
  params: [
    {
      from: accounts[0],
      to: '0x1111111111111111111111111111111111111111',
      value: '0x2386f26fc10000',
      data: '0x',
    },
  ],
});

console.log(txHash);
```



预期：



```Plain Text
弹出 TransactionConfirmModal
类型：原生币转账
确认后签名并广播
返回 txHash
```



---



### 23\.2 ERC20 Transfer



```TypeScript
await ethereum.request({
  method: 'eth_sendTransaction',
  params: [
    {
      from: accounts[0],
      to: '0xTokenContractAddress000000000000000000000000',
      data:
        '0xa9059cbb' +
        '0000000000000000000000002222222222222222222222222222222222222222' +
        '00000000000000000000000000000000000000000000000000000000000f4240',
      value: '0x0',
    },
  ],
});
```



预期：



```Plain Text
解析为 ERC20 transfer
展示 recipient 和 amount
```



---



### 23\.3 ERC20 Infinite Approve



```TypeScript
await ethereum.request({
  method: 'eth_sendTransaction',
  params: [
    {
      from: accounts[0],
      to: '0xTokenContractAddress000000000000000000000000',
      data:
        '0x095ea7b3' +
        '0000000000000000000000003333333333333333333333333333333333333333' +
        'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
      value: '0x0',
    },
  ],
});
```



预期：



```Plain Text
解析为 ERC20 approve
识别 unlimitedApproval
riskLevel = critical
展示 UNLIMITED_ERC20_APPROVAL
```



---



### 23\.4 NFT Approval For All



```TypeScript
await ethereum.request({
  method: 'eth_sendTransaction',
  params: [
    {
      from: accounts[0],
      to: '0xNFTContractAddress0000000000000000000000000',
      data:
        '0xa22cb465' +
        '0000000000000000000000004444444444444444444444444444444444444444' +
        '0000000000000000000000000000000000000000000000000000000000000001',
      value: '0x0',
    },
  ],
});
```



预期：



```Plain Text
解析 setApprovalForAll
riskLevel = critical
展示 NFT_APPROVAL_FOR_ALL
```



---



## 24\. 本章完成内容



本章完成：



```Plain Text
eth_sendTransaction
Tx 标准化
Native Transfer 解析
Calldata Decoder
ERC20 transfer
ERC20 approve
无限授权识别
ERC721 approve
ERC721 setApprovalForAll
NFT 高危授权识别
Swap / Bridge Selector 初步识别
合约黑名单
交易风险评分
Gas 估算
交易模拟
交易确认弹窗
Wallet Tx Signer Adapter
eth_sendRawTransaction 广播
交易审计
Transaction Handler
Runtime Router 接入
```



现在 DApp 浏览器具备完整交易链路：



```Plain Text
DApp
  -> eth_sendTransaction
  -> Provider
  -> Bridge
  -> Router
  -> Permission Check
  -> Tx Normalize
  -> Intent Parse
  -> Risk Check
  -> Gas Estimate
  -> Simulation
  -> Confirm Modal
  -> Wallet Sign
  -> Broadcast
  -> txHash
```



---



## 25\. 下一章继续



下一段继续：



**《DApp 浏览器 Part 8：Wallet Core 接口层 / 真签名适配器 / 多链签名扩展》**



将覆盖：



```Plain Text
WalletCoreAdapter
EVM Signer Interface
personal_sign 真签名
EIP-712 真签名
EIP-1559 Transaction 真签名
Legacy Transaction 真签名
HD Wallet Adapter
MPC Adapter 占位
Hardware Wallet Adapter 占位
Secure KeyStore 边界
禁止业务层接触私钥
签名错误标准化
多链 Signer Registry
Solana / Tron / Bitcoin 扩展接口
```



