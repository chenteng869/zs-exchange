# 
H08\-《DApp 浏览器 Part 8：Wallet Core 接口层 / 真签名适配器 / 多链签名扩展》

# 《DApp 浏览器 Part 8：Wallet Core 接口层 / 真签名适配器 / 多链签名扩展》



本章实现 DApp 浏览器的钱包核心签名接口层，覆盖：



- `WalletCoreAdapter`

- EVM Signer Interface

- `personal_sign` 真签名

- EIP\-712 真签名

- EIP\-1559 Transaction 真签名

- Legacy Transaction 真签名

- HD Wallet Adapter

- MPC Adapter 占位

- Hardware Wallet Adapter 占位

- Secure KeyStore 边界

- 禁止业务层接触私钥

- 签名错误标准化

- 多链 Signer Registry

- Solana / Tron / Bitcoin 扩展接口

    

核心原则：



```Plain Text
DApp Browser 业务层永远不能读取 privateKey / mnemonic / seed。
业务层只能调用 WalletCoreAdapter。
WalletCoreAdapter 内部可以接 HD Wallet / MPC / Hardware / Secure Enclave。
```



---



## 1\. 钱包核心边界



DApp 浏览器调用链：



```Plain Text
DApp Request
  -> Provider
  -> Bridge
  -> Router
  -> Signing / Transaction Service
  -> WalletCoreAdapter
  -> Secure KeyStore / MPC / Hardware
  -> Signature / RawTransaction
```



禁止：



```TypeScript
const privateKey = account.privateKey;
```



允许：



```TypeScript
await walletCore.signMessage(...)
await walletCore.signTypedData(...)
await walletCore.signTransaction(...)
```



---



## 2\. 本章目录结构



```Bash
src/modules/dapp-browser/
  core/
    wallet-core/
      wallet-core.types.ts
      wallet-core.errors.ts
      wallet-core.adapter.ts
      signer-registry.service.ts

      evm/
        evm-signer.types.ts
        evm-signer.adapter.ts
        evm-hd-signer.adapter.ts
        evm-mpc-signer.adapter.ts
        evm-hardware-signer.adapter.ts
        evm-transaction-builder.service.ts

      keystore/
        secure-keystore.types.ts
        secure-keystore.service.ts
        encrypted-private-key-keystore.service.ts

      solana/
        solana-signer.adapter.ts

      tron/
        tron-signer.adapter.ts

      bitcoin/
        bitcoin-signer.adapter.ts

    signing/
      wallet-signer.adapter.ts

    transaction/
      wallet-transaction-signer.adapter.ts
```



---



## 3\. Wallet Core 类型



### `core/wallet-core/wallet-core.types.ts`



```TypeScript
export type WalletCoreNamespace =
  | 'eip155'
  | 'solana'
  | 'tron'
  | 'bitcoin'
  | 'sui'
  | 'aptos';

export type WalletAccountType =
  | 'hd'
  | 'imported'
  | 'mpc'
  | 'hardware'
  | 'watch_only';

export interface WalletCoreAccount {
  accountId: string;
  userId?: string;
  namespace: WalletCoreNamespace;
  address: string;
  publicKey?: string;
  name?: string;
  type: WalletAccountType;
  derivationPath?: string;
  hardwareDeviceId?: string;
  mpcKeyId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface WalletCoreSignMessageInput {
  accountId: string;
  namespace: WalletCoreNamespace;
  chainId: string;
  address: string;
  message: string;
  rawMessage?: unknown;
}

export interface WalletCoreSignTypedDataInput {
  accountId: string;
  namespace: 'eip155';
  chainId: string;
  address: string;
  typedData: unknown;
}

export interface WalletCoreSignTransactionInput {
  accountId: string;
  namespace: WalletCoreNamespace;
  chainId: string;
  address: string;
  transaction: unknown;
}

export interface WalletCoreSignatureResult {
  signature: string;
}

export interface WalletCoreTransactionResult {
  rawTransaction: string;
  txHash?: string;
}

export interface WalletCoreAdapter {
  getAccount(accountId: string): Promise;

  signMessage(
    input: WalletCoreSignMessageInput,
  ): Promise;

  signTypedData(
    input: WalletCoreSignTypedDataInput,
  ): Promise;

  signTransaction(
    input: WalletCoreSignTransactionInput,
  ): Promise;
}
```



---



## 4\. Wallet Core 错误



### `core/wallet-core/wallet-core.errors.ts`



```TypeScript
export class WalletCoreError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'WalletCoreError';
  }
}

export const WalletCoreErrors = {
  ACCOUNT_NOT_FOUND: (accountId: string) =>
    new WalletCoreError(
      'WALLET_CORE_ACCOUNT_NOT_FOUND',
      `Wallet account not found: ${accountId}`,
    ),

  ACCOUNT_NAMESPACE_MISMATCH: (details?: unknown) =>
    new WalletCoreError(
      'WALLET_CORE_ACCOUNT_NAMESPACE_MISMATCH',
      'Wallet account namespace mismatch',
      details,
    ),

  WATCH_ONLY_ACCOUNT: (accountId: string) =>
    new WalletCoreError(
      'WALLET_CORE_WATCH_ONLY_ACCOUNT',
      `Watch-only account cannot sign: ${accountId}`,
    ),

  UNSUPPORTED_NAMESPACE: (namespace: string) =>
    new WalletCoreError(
      'WALLET_CORE_UNSUPPORTED_NAMESPACE',
      `Unsupported namespace: ${namespace}`,
    ),

  UNSUPPORTED_METHOD: (method: string) =>
    new WalletCoreError(
      'WALLET_CORE_UNSUPPORTED_METHOD',
      `Unsupported wallet core method: ${method}`,
    ),

  KEYSTORE_LOCKED: () =>
    new WalletCoreError(
      'WALLET_CORE_KEYSTORE_LOCKED',
      'Secure keystore is locked',
    ),

  PRIVATE_KEY_UNAVAILABLE: () =>
    new WalletCoreError(
      'WALLET_CORE_PRIVATE_KEY_UNAVAILABLE',
      'Private key unavailable',
    ),

  SIGN_FAILED: (details?: unknown) =>
    new WalletCoreError(
      'WALLET_CORE_SIGN_FAILED',
      'Wallet signing failed',
      details,
    ),

  HARDWARE_REJECTED: () =>
    new WalletCoreError(
      'WALLET_CORE_HARDWARE_REJECTED',
      'Hardware wallet request rejected',
    ),

  MPC_FAILED: (details?: unknown) =>
    new WalletCoreError(
      'WALLET_CORE_MPC_FAILED',
      'MPC signing failed',
      details,
    ),
};

export function normalizeWalletCoreError(error: unknown): {
  code: string;
  message: string;
  details?: unknown;
} {
  if (error instanceof WalletCoreError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      code: 'WALLET_CORE_UNKNOWN_ERROR',
      message: error.message,
    };
  }

  return {
    code: 'WALLET_CORE_UNKNOWN_ERROR',
    message: 'Unknown wallet core error',
    details: error,
  };
}
```



---



## 5\. Secure KeyStore 类型



KeyStore 是唯一允许接触密钥材料的边界。



### `core/wallet-core/keystore/secure-keystore.types.ts`



```TypeScript
export interface SecureKeyRecord {
  accountId: string;
  namespace: 'eip155' | 'solana' | 'tron' | 'bitcoin';
  address: string;
  publicKey?: string;

  /**
   * 加密后的私钥或密钥引用。
   * 业务层不能理解此字段。
   */
  encryptedKeyMaterial?: string;

  /**
   * iOS Secure Enclave / Android Keystore / MPC / Hardware 引用。
   */
  keyRef?: string;

  derivationPath?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SecureKeyUnlockContext {
  biometric?: boolean;
  password?: string;
  pin?: string;
  reason?: string;
}

export interface SecureKeyStoreService {
  getKeyRecord(accountId: string): Promise;

  signDigest(input: {
    accountId: string;
    digest: Uint8Array;
    context?: SecureKeyUnlockContext;
  }): Promise;

  exportPrivateKeyUnsafe?(input: {
    accountId: string;
    context?: SecureKeyUnlockContext;
  }): Promise;
}
```



---



## 6\. Secure KeyStore Service



生产中这里要接：



```Plain Text
iOS Keychain + Secure Enclave
Android Keystore
硬件钱包 SDK
MPC SDK
```



本章提供接口和开发用实现。



### `core/wallet-core/keystore/secure-keystore.service.ts`



```TypeScript
import {
  SecureKeyRecord,
  SecureKeyStoreService,
  SecureKeyUnlockContext,
} from './secure-keystore.types';
import { WalletCoreErrors } from '../wallet-core.errors';

export class InMemorySecureKeyStoreService implements SecureKeyStoreService {
  private readonly records = new Map();
  private readonly privateKeys = new Map();
  private locked = false;

  importUnsafeDevPrivateKey(input: {
    accountId: string;
    namespace: SecureKeyRecord['namespace'];
    address: string;
    privateKey: Uint8Array;
    publicKey?: string;
    derivationPath?: string;
  }) {
    const now = Date.now();

    this.records.set(input.accountId, {
      accountId: input.accountId,
      namespace: input.namespace,
      address: input.address.toLowerCase(),
      publicKey: input.publicKey,
      derivationPath: input.derivationPath,
      keyRef: `memory:${input.accountId}`,
      createdAt: now,
      updatedAt: now,
    });

    this.privateKeys.set(input.accountId, input.privateKey);
  }

  setLocked(locked: boolean) {
    this.locked = locked;
  }

  async getKeyRecord(accountId: string): Promise {
    return this.records.get(accountId) ?? null;
  }

  async signDigest(input: {
    accountId: string;
    digest: Uint8Array;
    context?: SecureKeyUnlockContext;
  }): Promise {
    if (this.locked) {
      throw WalletCoreErrors.KEYSTORE_LOCKED();
    }

    /**
     * 开发用实现不直接签名 digest，因为需要 secp256k1。
     * EVM HD signer 会通过 exportPrivateKeyUnsafe 调 viem/ethers 签。
     */
    throw WalletCoreErrors.UNSUPPORTED_METHOD('signDigest');
  }

  async exportPrivateKeyUnsafe(input: {
    accountId: string;
    context?: SecureKeyUnlockContext;
  }): Promise {
    if (this.locked) {
      throw WalletCoreErrors.KEYSTORE_LOCKED();
    }

    const key = this.privateKeys.get(input.accountId);

    if (!key) {
      throw WalletCoreErrors.PRIVATE_KEY_UNAVAILABLE();
    }

    return key;
  }
}
```



> `exportPrivateKeyUnsafe` 只允许开发 / 本地 HD 钱包适配器内部调用。生产环境可以删除此方法，改为 Secure Enclave / MPC 内部签名。
> 
> 



---



## 7\. EVM Signer 类型



### `core/wallet-core/evm/evm-signer.types.ts`



```TypeScript
import { NormalizedTransaction } from '../../transaction/transaction.types';

export interface EvmSignMessageInput {
  accountId: string;
  address: string;
  chainId: string;
  message: string;
  rawMessage?: unknown;
}

export interface EvmSignTypedDataInput {
  accountId: string;
  address: string;
  chainId: string;
  typedData: unknown;
}

export interface EvmSignTransactionInput {
  accountId: string;
  address: string;
  chainId: string;
  transaction: NormalizedTransaction;
}

export interface EvmSignerAdapter {
  signMessage(input: EvmSignMessageInput): Promise;
  signTypedData(input: EvmSignTypedDataInput): Promise;
  signTransaction(input: EvmSignTransactionInput): Promise;
}
```



---



## 8\. EVM Transaction Builder



把 DApp 标准交易转成 viem/ethers 可签名对象。



### `core/wallet-core/evm/evm-transaction-builder.service.ts`



```TypeScript
import { NormalizedTransaction } from '../../transaction/transaction.types';

export interface EvmPreparedTransaction {
  to?: `0x${string}`;
  value?: bigint;
  data?: `0x${string}`;
  gas?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  nonce?: number;
  chainId: number;
}

export class EvmTransactionBuilderService {
  build(input: {
    chainId: string;
    tx: NormalizedTransaction;
  }): EvmPreparedTransaction {
    const chainId = Number.parseInt(input.chainId.replace(/^0x/, ''), 16);

    if (!Number.isSafeInteger(chainId) || chainId  {
    const account = await this.loadAccount(input.accountId);

    assertSameAddress(account.address, input.address);

    const message = normalizePersonalMessage(input.message);

    return account.signMessage({
      message,
    });
  }

  async signTypedData(input: EvmSignTypedDataInput): Promise {
    const account = await this.loadAccount(input.accountId);

    assertSameAddress(account.address, input.address);

    const typedData = normalizeTypedData(input.typedData);

    return account.signTypedData(typedData as any);
  }

  async signTransaction(input: EvmSignTransactionInput): Promise {
    const account = await this.loadAccount(input.accountId);

    assertSameAddress(account.address, input.address);

    const prepared = this.txBuilder.build({
      chainId: input.chainId,
      tx: input.transaction,
    });

    const rawTransaction = await account.signTransaction(prepared as any);

    return {
      rawTransaction,
    };
  }

  private async loadAccount(accountId: string) {
    if (!this.keyStore.exportPrivateKeyUnsafe) {
      throw WalletCoreErrors.PRIVATE_KEY_UNAVAILABLE();
    }

    const raw = await this.keyStore.exportPrivateKeyUnsafe({
      accountId,
      context: {
        biometric: true,
        reason: 'Sign DApp request',
      },
    });

    const privateKey = bytesToPrivateKey(raw);

    return privateKeyToAccount(privateKey);
  }
}

function assertSameAddress(a: string, b: string) {
  if (a.toLowerCase() !== b.toLowerCase()) {
    throw WalletCoreErrors.ACCOUNT_NAMESPACE_MISMATCH({
      signerAddress: a,
      requestAddress: b,
    });
  }
}

function normalizePersonalMessage(message: string) {
  if (typeof message !== 'string') {
    return String(message);
  }

  if (/^0x[0-9a-fA-F]*$/.test(message)) {
    return {
      raw: message as Hex,
    };
  }

  return message;
}

function normalizeTypedData(raw: unknown) {
  if (typeof raw === 'string') {
    return JSON.parse(raw);
  }

  return raw;
}

function bytesToPrivateKey(bytes: Uint8Array): Hex {
  const hex = Array.from(bytes)
    .map((item) => item.toString(16).padStart(2, '0'))
    .join('');

  return `0x${hex}` as Hex;
}
```



---



## 10\. EVM MPC Signer Adapter



这是生产占位接口。真实项目接 MPC SDK。



### `core/wallet-core/evm/evm-mpc-signer.adapter.ts`



```TypeScript
import { WalletCoreErrors } from '../wallet-core.errors';
import {
  EvmSignMessageInput,
  EvmSignTypedDataInput,
  EvmSignTransactionInput,
  EvmSignerAdapter,
} from './evm-signer.types';

export interface MpcSigningClient {
  signEvmMessage(input: EvmSignMessageInput): Promise;
  signEvmTypedData(input: EvmSignTypedDataInput): Promise;
  signEvmTransaction(input: EvmSignTransactionInput): Promise;
}

export class EvmMpcSignerAdapter implements EvmSignerAdapter {
  constructor(
    private readonly client: MpcSigningClient,
  ) {}

  async signMessage(input: EvmSignMessageInput): Promise {
    try {
      return await this.client.signEvmMessage(input);
    } catch (error) {
      throw WalletCoreErrors.MPC_FAILED(error);
    }
  }

  async signTypedData(input: EvmSignTypedDataInput): Promise {
    try {
      return await this.client.signEvmTypedData(input);
    } catch (error) {
      throw WalletCoreErrors.MPC_FAILED(error);
    }
  }

  async signTransaction(input: EvmSignTransactionInput): Promise {
    try {
      return await this.client.signEvmTransaction(input);
    } catch (error) {
      throw WalletCoreErrors.MPC_FAILED(error);
    }
  }
}
```



---



## 11\. EVM Hardware Signer Adapter



### `core/wallet-core/evm/evm-hardware-signer.adapter.ts`



```TypeScript
import { WalletCoreErrors } from '../wallet-core.errors';
import {
  EvmSignMessageInput,
  EvmSignTypedDataInput,
  EvmSignTransactionInput,
  EvmSignerAdapter,
} from './evm-signer.types';

export interface HardwareWalletClient {
  signEvmMessage(input: EvmSignMessageInput): Promise;
  signEvmTypedData(input: EvmSignTypedDataInput): Promise;
  signEvmTransaction(input: EvmSignTransactionInput): Promise;
}

export class EvmHardwareSignerAdapter implements EvmSignerAdapter {
  constructor(
    private readonly client: HardwareWalletClient,
  ) {}

  async signMessage(input: EvmSignMessageInput): Promise {
    try {
      return await this.client.signEvmMessage(input);
    } catch (error: any) {
      if (error?.code === 'USER_REJECTED') {
        throw WalletCoreErrors.HARDWARE_REJECTED();
      }

      throw WalletCoreErrors.SIGN_FAILED(error);
    }
  }

  async signTypedData(input: EvmSignTypedDataInput): Promise {
    try {
      return await this.client.signEvmTypedData(input);
    } catch (error: any) {
      if (error?.code === 'USER_REJECTED') {
        throw WalletCoreErrors.HARDWARE_REJECTED();
      }

      throw WalletCoreErrors.SIGN_FAILED(error);
    }
  }

  async signTransaction(input: EvmSignTransactionInput): Promise {
    try {
      return await this.client.signEvmTransaction(input);
    } catch (error: any) {
      if (error?.code === 'USER_REJECTED') {
        throw WalletCoreErrors.HARDWARE_REJECTED();
      }

      throw WalletCoreErrors.SIGN_FAILED(error);
    }
  }
}
```



---



## 12\. EVM Signer Adapter 聚合



根据账户类型选择 HD / MPC / Hardware。



### `core/wallet-core/evm/evm-signer.adapter.ts`



```TypeScript
import { WalletCoreAccount } from '../wallet-core.types';
import { WalletCoreErrors } from '../wallet-core.errors';
import {
  EvmSignMessageInput,
  EvmSignTypedDataInput,
  EvmSignTransactionInput,
  EvmSignerAdapter,
} from './evm-signer.types';

export interface EvmSignerAdapterMap {
  hd?: EvmSignerAdapter;
  imported?: EvmSignerAdapter;
  mpc?: EvmSignerAdapter;
  hardware?: EvmSignerAdapter;
}

export class EvmSignerRouterAdapter implements EvmSignerAdapter {
  constructor(
    private readonly getAccount: (accountId: string) => Promise,
    private readonly signers: EvmSignerAdapterMap,
  ) {}

  async signMessage(input: EvmSignMessageInput): Promise {
    const signer = await this.resolveSigner(input.accountId);
    return signer.signMessage(input);
  }

  async signTypedData(input: EvmSignTypedDataInput): Promise {
    const signer = await this.resolveSigner(input.accountId);
    return signer.signTypedData(input);
  }

  async signTransaction(input: EvmSignTransactionInput): Promise {
    const signer = await this.resolveSigner(input.accountId);
    return signer.signTransaction(input);
  }

  private async resolveSigner(accountId: string): Promise {
    const account = await this.getAccount(accountId);

    if (!account) {
      throw WalletCoreErrors.ACCOUNT_NOT_FOUND(accountId);
    }

    if (account.type === 'watch_only') {
      throw WalletCoreErrors.WATCH_ONLY_ACCOUNT(accountId);
    }

    const signer = this.signers[account.type];

    if (!signer) {
      throw WalletCoreErrors.UNSUPPORTED_METHOD(`signer:${account.type}`);
    }

    return signer;
  }
}
```



---



## 13\. Signer Registry



### `core/wallet-core/signer-registry.service.ts`



```TypeScript
import {
  WalletCoreNamespace,
} from './wallet-core.types';
import { EvmSignerAdapter } from './evm/evm-signer.types';

export interface SolanaSignerAdapter {
  signMessage(input: any): Promise;
  signTransaction(input: any): Promise;
}

export interface TronSignerAdapter {
  signMessage(input: any): Promise;
  signTransaction(input: any): Promise;
}

export interface BitcoinSignerAdapter {
  signMessage(input: any): Promise;
  signPsbt(input: any): Promise;
}

export class SignerRegistryService {
  private evmSigner?: EvmSignerAdapter;
  private solanaSigner?: SolanaSignerAdapter;
  private tronSigner?: TronSignerAdapter;
  private bitcoinSigner?: BitcoinSignerAdapter;

  registerEvmSigner(signer: EvmSignerAdapter) {
    this.evmSigner = signer;
  }

  registerSolanaSigner(signer: SolanaSignerAdapter) {
    this.solanaSigner = signer;
  }

  registerTronSigner(signer: TronSignerAdapter) {
    this.tronSigner = signer;
  }

  registerBitcoinSigner(signer: BitcoinSignerAdapter) {
    this.bitcoinSigner = signer;
  }

  requireEvmSigner(): EvmSignerAdapter {
    if (!this.evmSigner) {
      throw new Error('EVM_SIGNER_NOT_REGISTERED');
    }

    return this.evmSigner;
  }

  getSigner(namespace: WalletCoreNamespace): unknown {
    switch (namespace) {
      case 'eip155':
        return this.evmSigner;

      case 'solana':
        return this.solanaSigner;

      case 'tron':
        return this.tronSigner;

      case 'bitcoin':
        return this.bitcoinSigner;

      default:
        return undefined;
    }
  }
}
```



---



## 14\. Wallet Core Adapter



### `core/wallet-core/wallet-core.adapter.ts`



```TypeScript
import { AccountRegistryService } from '../accounts/account-registry.service';
import { SignerRegistryService } from './signer-registry.service';
import {
  WalletCoreAccount,
  WalletCoreAdapter,
  WalletCoreSignMessageInput,
  WalletCoreSignatureResult,
  WalletCoreSignTypedDataInput,
  WalletCoreSignTransactionInput,
  WalletCoreTransactionResult,
} from './wallet-core.types';
import { WalletCoreErrors } from './wallet-core.errors';

export class IndustrialWalletCoreAdapter implements WalletCoreAdapter {
  constructor(
    private readonly accountRegistry: AccountRegistryService,
    private readonly signerRegistry: SignerRegistryService,
  ) {}

  async getAccount(accountId: string): Promise {
    const account = await this.accountRegistry.getAccount(accountId);

    if (!account) return null;

    return {
      accountId: account.accountId,
      userId: account.userId,
      namespace: 'eip155',
      address: account.address,
      name: account.name,
      type: account.walletType,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }

  async signMessage(
    input: WalletCoreSignMessageInput,
  ): Promise {
    if (input.namespace !== 'eip155') {
      throw WalletCoreErrors.UNSUPPORTED_NAMESPACE(input.namespace);
    }

    const signer = this.signerRegistry.requireEvmSigner();

    const signature = await signer.signMessage({
      accountId: input.accountId,
      address: input.address,
      chainId: input.chainId,
      message: input.message,
      rawMessage: input.rawMessage,
    });

    return {
      signature,
    };
  }

  async signTypedData(
    input: WalletCoreSignTypedDataInput,
  ): Promise {
    const signer = this.signerRegistry.requireEvmSigner();

    const signature = await signer.signTypedData({
      accountId: input.accountId,
      address: input.address,
      chainId: input.chainId,
      typedData: input.typedData,
    });

    return {
      signature,
    };
  }

  async signTransaction(
    input: WalletCoreSignTransactionInput,
  ): Promise {
    if (input.namespace !== 'eip155') {
      throw WalletCoreErrors.UNSUPPORTED_NAMESPACE(input.namespace);
    }

    const signer = this.signerRegistry.requireEvmSigner();

    const signed = await signer.signTransaction({
      accountId: input.accountId,
      address: input.address,
      chainId: input.chainId,
      transaction: input.transaction as any,
    });

    return signed;
  }
}
```



---



## 15\. 替换 Signing Wallet Adapter



Part 6 中 `WalletSignerAdapter` 是 mock。现在改成调用 `WalletCoreAdapter`。



### `core/signing/wallet-signer.adapter.ts`



```TypeScript
import {
  WalletSignInput,
  WalletSignResult,
} from './signing.types';
import { WalletCoreAdapter } from '../wallet-core/wallet-core.types';

export interface WalletSignerAdapter {
  signMessage(input: WalletSignInput): Promise;
  signTypedData(input: WalletSignInput): Promise;
}

export class WalletCoreSignerAdapter implements WalletSignerAdapter {
  constructor(
    private readonly walletCore: WalletCoreAdapter,
  ) {}

  async signMessage(input: WalletSignInput): Promise {
    const result = await this.walletCore.signMessage({
      accountId: input.accountId,
      namespace: 'eip155',
      chainId: input.chainId,
      address: input.address,
      message: String(input.payload),
      rawMessage: input.payload,
    });

    return {
      signature: result.signature,
    };
  }

  async signTypedData(input: WalletSignInput): Promise {
    const result = await this.walletCore.signTypedData({
      accountId: input.accountId,
      namespace: 'eip155',
      chainId: input.chainId,
      address: input.address,
      typedData: input.payload,
    });

    return {
      signature: result.signature,
    };
  }
}
```



---



## 16\. 替换 Transaction Wallet Signer



Part 7 中 `MockWalletTransactionSignerAdapter` 替换为 Wallet Core。



### `core/transaction/wallet-transaction-signer.adapter.ts`



```TypeScript
import {
  WalletTransactionSignInput,
  WalletTransactionSignResult,
} from './transaction.types';
import { WalletCoreAdapter } from '../wallet-core/wallet-core.types';

export interface WalletTransactionSignerAdapter {
  signTransaction(
    input: WalletTransactionSignInput,
  ): Promise;
}

export class WalletCoreTransactionSignerAdapter
  implements WalletTransactionSignerAdapter {
  constructor(
    private readonly walletCore: WalletCoreAdapter,
  ) {}

  async signTransaction(
    input: WalletTransactionSignInput,
  ): Promise {
    const result = await this.walletCore.signTransaction({
      accountId: input.accountId,
      namespace: 'eip155',
      chainId: input.chainId,
      address: input.address,
      transaction: input.tx,
    });

    return {
      rawTransaction: result.rawTransaction,
      txHash: result.txHash,
    };
  }
}
```



---



## 17\. Solana Signer 扩展占位



### `core/wallet-core/solana/solana-signer.adapter.ts`



```TypeScript
export interface SolanaSignMessageInput {
  accountId: string;
  address: string;
  message: Uint8Array;
}

export interface SolanaSignTransactionInput {
  accountId: string;
  address: string;
  transaction: Uint8Array;
}

export interface SolanaSignerAdapter {
  signMessage(input: SolanaSignMessageInput): Promise;

  signTransaction(input: SolanaSignTransactionInput): Promise;
}

export class UnsupportedSolanaSignerAdapter implements SolanaSignerAdapter {
  async signMessage(): Promise {
    throw new Error('SOLANA_SIGNING_NOT_ENABLED');
  }

  async signTransaction(): Promise {
    throw new Error('SOLANA_TRANSACTION_SIGNING_NOT_ENABLED');
  }
}
```



---



## 18\. Tron Signer 扩展占位



### `core/wallet-core/tron/tron-signer.adapter.ts`



```TypeScript
export interface TronSignMessageInput {
  accountId: string;
  address: string;
  message: string;
}

export interface TronSignTransactionInput {
  accountId: string;
  address: string;
  transaction: unknown;
}

export interface TronSignerAdapter {
  signMessage(input: TronSignMessageInput): Promise;

  signTransaction(input: TronSignTransactionInput): Promise;
}

export class UnsupportedTronSignerAdapter implements TronSignerAdapter {
  async signMessage(): Promise {
    throw new Error('TRON_SIGNING_NOT_ENABLED');
  }

  async signTransaction(): Promise {
    throw new Error('TRON_TRANSACTION_SIGNING_NOT_ENABLED');
  }
}
```



---



## 19\. Bitcoin Signer 扩展占位



### `core/wallet-core/bitcoin/bitcoin-signer.adapter.ts`



```TypeScript
export interface BitcoinSignMessageInput {
  accountId: string;
  address: string;
  message: string;
}

export interface BitcoinSignPsbtInput {
  accountId: string;
  address: string;
  psbtBase64: string;
}

export interface BitcoinSignerAdapter {
  signMessage(input: BitcoinSignMessageInput): Promise;
  signPsbt(input: BitcoinSignPsbtInput): Promise;
}

export class UnsupportedBitcoinSignerAdapter implements BitcoinSignerAdapter {
  async signMessage(): Promise {
    throw new Error('BITCOIN_SIGNING_NOT_ENABLED');
  }

  async signPsbt(): Promise {
    throw new Error('BITCOIN_PSBT_SIGNING_NOT_ENABLED');
  }
}
```



---



## 20\. Runtime 工厂接入 Wallet Core



在 `create-dapp-router-runtime.ts` 中替换 Part 6/7 的 mock signer。



### 新增 imports



```TypeScript
import { InMemorySecureKeyStoreService } from '../wallet-core/keystore/secure-keystore.service';
import { EvmTransactionBuilderService } from '../wallet-core/evm/evm-transaction-builder.service';
import { EvmHdSignerAdapter } from '../wallet-core/evm/evm-hd-signer.adapter';
import { EvmSignerRouterAdapter } from '../wallet-core/evm/evm-signer.adapter';
import { SignerRegistryService } from '../wallet-core/signer-registry.service';
import { IndustrialWalletCoreAdapter } from '../wallet-core/wallet-core.adapter';
import { WalletCoreSignerAdapter } from '../signing/wallet-signer.adapter';
import { WalletCoreTransactionSignerAdapter } from '../transaction/wallet-transaction-signer.adapter';
```



### 工厂内部新增



```TypeScript
const keyStore = new InMemorySecureKeyStoreService();

/**
 * 开发环境导入私钥。
 * 生产必须替换为真实安全 KeyStore，不允许硬编码。
 */
if (input.devPrivateKey) {
  keyStore.importUnsafeDevPrivateKey({
    accountId: input.initialAccount?.accountId ?? 'account-1',
    namespace: 'eip155',
    address: input.initialAccount?.address ?? '',
    privateKey: input.devPrivateKey,
  });
}

const evmTxBuilder = new EvmTransactionBuilderService();

const evmHdSigner = new EvmHdSignerAdapter(
  keyStore,
  evmTxBuilder,
);

const signerRegistry = new SignerRegistryService();

const evmSignerRouter = new EvmSignerRouterAdapter(
  async (accountId) => walletCore.getAccount(accountId),
  {
    hd: evmHdSigner,
    imported: evmHdSigner,
  },
);

signerRegistry.registerEvmSigner(evmSignerRouter);

const walletCore = new IndustrialWalletCoreAdapter(
  accountRegistry,
  signerRegistry,
);
```



上面有循环引用 `walletCore` 在创建 `evmSignerRouter` 前未定义。生产写法应分两步：



```TypeScript
let walletCoreRef: IndustrialWalletCoreAdapter;

const evmSignerRouter = new EvmSignerRouterAdapter(
  async (accountId) => walletCoreRef.getAccount(accountId),
  {
    hd: evmHdSigner,
    imported: evmHdSigner,
  },
);

signerRegistry.registerEvmSigner(evmSignerRouter);

walletCoreRef = new IndustrialWalletCoreAdapter(
  accountRegistry,
  signerRegistry,
);

const walletCore = walletCoreRef;
```



然后替换：



```TypeScript
const walletSigner = new WalletCoreSignerAdapter(walletCore);
const walletTransactionSigner = new WalletCoreTransactionSignerAdapter(walletCore);
```



---



## 21\. Runtime Input 增加 devPrivateKey



### `create-dapp-router-runtime.ts`



```TypeScript
export interface CreateDappRouterRuntimeInput {
  initialChainId?: string;
  initialAccount?: WalletAccount | null;
  accounts?: WalletAccount[];

  /**
   * 仅开发环境使用。
   * 生产禁止从 UI / JS 层传入私钥。
   */
  devPrivateKey?: Uint8Array;

  connectConfirmService?: DappConnectConfirmService;
  chainSwitchConfirmService?: ChainSwitchConfirmService;
  chainAddConfirmService?: ChainAddConfirmService;
}
```



---



## 22\. 开发测试私钥工具



如果你需要本地测试：



### `shared/utils/private-key.ts`



```TypeScript
export function hexPrivateKeyToBytes(privateKey: string): Uint8Array {
  const clean = privateKey.startsWith('0x')
    ? privateKey.slice(2)
    : privateKey;

  if (!/^[0-9a-fA-F]{64}$/.test(clean)) {
    throw new Error('INVALID_PRIVATE_KEY_HEX');
  }

  const bytes = new Uint8Array(32);

  for (let i = 0; i  Native Module
  -> Secure Enclave sign digest
  -> 返回 signature
```



---



### Android



```Plain Text
Android Keystore
BiometricPrompt
StrongBox if available
```



---



### MPC



```Plain Text
WalletCoreAdapter
  -> MPC SDK
  -> server co-sign
  -> threshold signature
```



---



### 硬件钱包



```Plain Text
WalletCoreAdapter
  -> Ledger / Keystone / OneKey SDK
  -> device confirmation
  -> signature
```



---



## 24\. 安全约束



必须遵守：



```Plain Text
业务层不保存私钥
业务层不打印私钥
业务层不传输私钥
生产禁用 exportPrivateKeyUnsafe
签名必须经过用户确认
交易必须经过用户确认
签名请求必须写审计
交易请求必须写审计
KeyStore unlock 必须有用户意图
```



---



## 25\. DApp 侧测试



### `personal_sign`



```TypeScript
const accounts = await ethereum.request({
  method: 'eth_requestAccounts',
});

const sig = await ethereum.request({
  method: 'personal_sign',
  params: ['hello', accounts[0]],
});

console.log(sig);
```



预期：



```Plain Text
真实 EVM signature
```



---



### `eth_signTypedData_v4`



```TypeScript
const sig = await ethereum.request({
  method: 'eth_signTypedData_v4',
  params: [
    accounts[0],
    JSON.stringify(typedData),
  ],
});
```



预期：



```Plain Text
真实 EIP-712 signature
```



---



### `eth_sendTransaction`



```TypeScript
const txHash = await ethereum.request({
  method: 'eth_sendTransaction',
  params: [
    {
      from: accounts[0],
      to: '0x1111111111111111111111111111111111111111',
      value: '0x0',
      data: '0x',
    },
  ],
});
```



预期：



```Plain Text
真实签名 rawTransaction
广播后返回 txHash
```



---



## 26\. 本章完成内容



本章完成：



```Plain Text
WalletCoreAdapter
WalletCore 错误体系
SecureKeyStore 接口
开发用 InMemory KeyStore
EVM Signer Interface
EVM HD 真签名适配器
EIP-191 personal_sign
EIP-712 typed data sign
EVM Transaction Sign
EVM Transaction Builder
MPC Signer 占位
Hardware Signer 占位
Signer Registry
WalletCoreSignerAdapter
WalletCoreTransactionSignerAdapter
Solana / Tron / Bitcoin 扩展接口
Runtime 接入 Wallet Core
```



现在 DApp 浏览器已经从 mock 签名升级为：



```Plain Text
Provider
  -> Router
  -> Permission
  -> Confirmation
  -> WalletCore
  -> Real Signer
```



---



## 27\. 下一章继续



下一段继续：



**《DApp 浏览器 Part 9：DApp 列表 / 搜索 / 收藏 / 最近访问 / 首页生态》**



将覆盖：



```Plain Text
DApp Registry
DApp Category
DApp Search
DApp Featured
DApp Favorites
DApp Recent Visits
DApp Home UI
DApp Card
Search Screen
Category Tabs
Open DApp
DApp 风险等级展示
后台可管理数据结构
缓存与刷新
```



