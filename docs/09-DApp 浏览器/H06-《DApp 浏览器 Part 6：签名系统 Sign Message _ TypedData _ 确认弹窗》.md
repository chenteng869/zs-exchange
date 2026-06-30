# H06\-《DApp 浏览器 Part 6：签名系统 Sign Message / TypedData / 确认弹窗》

有，而且还很多。前面只是把 **WebView / Provider / RPC / Session / 连接确认 / 切链加链 UI** 打完了。真正工业级 DApp 浏览器后面还必须继续写：



```Plain Text
Part 6：签名系统 Sign Message / TypedData / Confirm Modal
Part 7：交易系统 Tx Parser / Calldata Decode / Approve 风险 / Tx Confirm
Part 8：Wallet Core 接口层 / Signer Adapter / 广播交易
Part 9：DApp 列表 / 搜索 / 收藏 / 最近访问
Part 10：WalletConnect v2
Part 11：安全风控黑名单 / 钓鱼域名 / 合约黑名单
Part 12：审计日志 / 监控指标 / 后台管理
Part 13：完整联调验收清单
```



继续。



---



# 《DApp 浏览器 Part 6：签名系统 Sign Message / TypedData / 确认弹窗》



本章实现 DApp 浏览器的签名系统，覆盖：



- `personal_sign`

- `eth_sign`

- `eth_signTypedData`

- `eth_signTypedData_v3`

- `eth_signTypedData_v4`

- 签名权限检查

- 签名内容解析

- Hex 消息解码

- UTF\-8 展示

- TypedData 结构化展示

- 高危签名提示

- 用户确认弹窗

- Wallet Core 签名适配器

- 签名审计事件

- Router 接入

    

核心原则：



```Plain Text
任何 DApp 签名请求都不能静默签名。
必须：
1. 校验 DApp Session 权限
2. 解析签名内容
3. 展示 DApp 域名、账户、网络、原文
4. 用户确认
5. 调用 Wallet Core
6. 返回 signature
7. 写审计
```



---



# 1\. 本章目录结构



```Bash
src/modules/dapp-browser/
  core/
    signing/
      signing.types.ts
      message-parser.service.ts
      typed-data-parser.service.ts
      signing-confirmation.service.ts
      wallet-signer.adapter.ts
      signing-audit.service.ts
      signing-request.service.ts
      signing-handler.service.ts

  ui/
    modals/
      SignMessageModal.tsx
      SignTypedDataModal.tsx

  core/
    confirmations/
      signing-confirmation-controller.service.ts
```



---



# 2\. 签名类型



## `core/signing/signing.types.ts`



```TypeScript
export type SigningMethod =
  | 'personal_sign'
  | 'eth_sign'
  | 'eth_signTypedData'
  | 'eth_signTypedData_v3'
  | 'eth_signTypedData_v4';

export type SigningDisplayType =
  | 'utf8'
  | 'hex'
  | 'typed_data'
  | 'unknown';

export type SigningRiskLevel =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export interface ParsedSignMessage {
  method: SigningMethod;
  displayType: SigningDisplayType;

  address: string;
  rawMessage: unknown;
  displayMessage: string;

  hex?: string;
  utf8?: string;

  riskLevel: SigningRiskLevel;
  riskReasons: string[];

  metadata?: Record;
}

export interface ParsedTypedData {
  method: SigningMethod;
  address: string;

  rawTypedData: unknown;

  domain?: Record;
  primaryType?: string;
  message?: Record;
  types?: Record;

  displayJson: string;

  riskLevel: SigningRiskLevel;
  riskReasons: string[];
}

export interface SigningRequestInput {
  method: SigningMethod;
  params: unknown[];

  origin: string;
  hostname: string;

  accountId: string;
  address: string;
  chainId: string;

  source: 'webview' | 'walletconnect' | 'deeplink' | 'internal';
}

export interface SigningConfirmationInput {
  origin: string;
  hostname: string;
  accountId: string;
  address: string;
  chainId: string;
  method: SigningMethod;
  parsed: ParsedSignMessage | ParsedTypedData;
}

export interface SigningConfirmationResult {
  approved: boolean;
  reason?: string;
}

export interface WalletSignInput {
  accountId: string;
  address: string;
  chainId: string;
  method: SigningMethod;
  payload: unknown;
}

export interface WalletSignResult {
  signature: string;
}
```



---



# 3\. Message Parser



处理：



```Plain Text
personal_sign
eth_sign
```



规则：



- `personal_sign` 常见参数顺序：

    ```Plain Text
    [message, address]
    ```

- 部分 DApp 错误传：

    ```Plain Text
    [address, message]
    ```

- `eth_sign` 通常：

    ```Plain Text
    [address, message]
    ```

    

## `core/signing/message-parser.service.ts`



```TypeScript
import {
  ParsedSignMessage,
  SigningMethod,
} from './signing.types';

export class MessageParserService {
  parse(input: {
    method: SigningMethod;
    params: unknown[];
    expectedAddress: string;
  }): ParsedSignMessage {
    if (
      input.method !== 'personal_sign' &&
      input.method !== 'eth_sign'
    ) {
      throw new Error(`UNSUPPORTED_MESSAGE_SIGN_METHOD:${input.method}`);
    }

    const { address, message } = this.extractAddressAndMessage(input);

    const normalizedAddress = address.toLowerCase();
    const expected = input.expectedAddress.toLowerCase();

    const riskReasons: string[] = [];
    let riskLevel: ParsedSignMessage['riskLevel'] = 'low';

    if (normalizedAddress !== expected) {
      riskLevel = 'high';
      riskReasons.push('SIGN_ADDRESS_NOT_ACTIVE_ACCOUNT');
    }

    const decoded = this.decodeMessage(message);

    if (input.method === 'eth_sign') {
      riskLevel = maxRisk(riskLevel, 'high');
      riskReasons.push('ETH_SIGN_IS_HIGH_RISK');
    }

    if (looksLikeBlindSigning(decoded.displayMessage)) {
      riskLevel = maxRisk(riskLevel, 'medium');
      riskReasons.push('MESSAGE_LOOKS_LIKE_BLIND_SIGNING');
    }

    return {
      method: input.method,
      displayType: decoded.displayType,
      address,
      rawMessage: message,
      displayMessage: decoded.displayMessage,
      hex: decoded.hex,
      utf8: decoded.utf8,
      riskLevel,
      riskReasons,
      metadata: {
        originalParams: input.params,
      },
    };
  }

  private extractAddressAndMessage(input: {
    method: SigningMethod;
    params: unknown[];
    expectedAddress: string;
  }): {
    address: string;
    message: unknown;
  } {
    const [p0, p1] = input.params;

    if (input.method === 'eth_sign') {
      if (typeof p0 !== 'string' || typeof p1 !== 'string') {
        throw {
          code: -32602,
          message: 'eth_sign requires [address, message]',
        };
      }

      return {
        address: p0,
        message: p1,
      };
    }

    /**
     * personal_sign 标准常见：[message, address]
     */
    if (typeof p0 === 'string' && typeof p1 === 'string') {
      if (isAddress(p0) && !isAddress(p1)) {
        return {
          address: p0,
          message: p1,
        };
      }

      return {
        address: p1,
        message: p0,
      };
    }

    throw {
      code: -32602,
      message: 'personal_sign requires [message, address]',
    };
  }

  private decodeMessage(message: unknown): {
    displayType: ParsedSignMessage['displayType'];
    displayMessage: string;
    hex?: string;
    utf8?: string;
  } {
    if (typeof message !== 'string') {
      return {
        displayType: 'unknown',
        displayMessage: String(message),
      };
    }

    if (isHex(message)) {
      const utf8 = tryHexToUtf8(message);

      return {
        displayType: utf8 ? 'utf8' : 'hex',
        displayMessage: utf8 ?? message,
        hex: message,
        utf8: utf8 ?? undefined,
      };
    }

    return {
      displayType: 'utf8',
      displayMessage: message,
      utf8: message,
    };
  }
}

function isAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function isHex(value: string): boolean {
  return /^0x[a-fA-F0-9]*$/.test(value);
}

function tryHexToUtf8(hex: string): string | null {
  try {
    const clean = hex.startsWith('0x') ? hex.slice(2) : hex;

    if (clean.length % 2 !== 0) return null;

    const bytes = clean.match(/.{1,2}/g);
    if (!bytes) return null;

    const text = decodeURIComponent(
      bytes
        .map((byte) => `%${byte}`)
        .join(''),
    );

    if (!text || /[\u0000-\u0008\u000E-\u001F]/.test(text)) {
      return null;
    }

    return text;
  } catch {
    return null;
  }
}

function looksLikeBlindSigning(message: string): boolean {
  const lower = message.toLowerCase();

  return [
    'sign this message to prove',
    'i accept',
    'login',
    'nonce',
  ].some((item) => lower.includes(item));
}

const RISK_ORDER = ['low', 'medium', 'high', 'critical'] as const;

function maxRisk(a: T, b: T): T {
  return RISK_ORDER.indexOf(a) >= RISK_ORDER.indexOf(b) ? a : b;
}
```



---



# 4\. TypedData Parser



处理：



```Plain Text
eth_signTypedData
eth_signTypedData_v3
eth_signTypedData_v4
```



要解析：



```Plain Text
domain
types
primaryType
message
```



## `core/signing/typed-data-parser.service.ts`



```TypeScript
import {
  ParsedTypedData,
  SigningMethod,
} from './signing.types';

export class TypedDataParserService {
  parse(input: {
    method: SigningMethod;
    params: unknown[];
    expectedAddress: string;
    activeChainId: string;
  }): ParsedTypedData {
    if (!input.method.includes('TypedData')) {
      throw new Error(`UNSUPPORTED_TYPED_DATA_METHOD:${input.method}`);
    }

    const { address, typedData } = this.extractAddressAndTypedData(input);

    const riskReasons: string[] = [];
    let riskLevel: ParsedTypedData['riskLevel'] = 'low';

    if (address.toLowerCase() !== input.expectedAddress.toLowerCase()) {
      riskLevel = 'high';
      riskReasons.push('TYPED_DATA_ADDRESS_NOT_ACTIVE_ACCOUNT');
    }

    const parsed = this.normalizeTypedData(typedData);

    const domainChainId = parsed.domain?.chainId;

    if (
      domainChainId !== undefined &&
      normalizeChainIdValue(domainChainId) !== normalizeChainIdValue(input.activeChainId)
    ) {
      riskLevel = maxRisk(riskLevel, 'high');
      riskReasons.push('TYPED_DATA_CHAIN_ID_MISMATCH');
    }

    if (looksLikePermit(parsed)) {
      riskLevel = maxRisk(riskLevel, 'high');
      riskReasons.push('TYPED_DATA_PERMIT_APPROVAL');
    }

    if (looksLikePermit2(parsed)) {
      riskLevel = maxRisk(riskLevel, 'critical');
      riskReasons.push('TYPED_DATA_PERMIT2_APPROVAL');
    }

    return {
      method: input.method,
      address,
      rawTypedData: typedData,
      domain: parsed.domain,
      primaryType: parsed.primaryType,
      message: parsed.message,
      types: parsed.types,
      displayJson: JSON.stringify(parsed, null, 2),
      riskLevel,
      riskReasons,
    };
  }

  private extractAddressAndTypedData(input: {
    method: SigningMethod;
    params: unknown[];
  }): {
    address: string;
    typedData: unknown;
  } {
    const [p0, p1] = input.params;

    if (typeof p0 !== 'string') {
      throw {
        code: -32602,
        message: `${input.method} requires address as first param`,
      };
    }

    return {
      address: p0,
      typedData: p1,
    };
  }

  private normalizeTypedData(raw: unknown): {
    domain?: Record;
    primaryType?: string;
    message?: Record;
    types?: Record;
  } {
    let value = raw;

    if (typeof raw === 'string') {
      try {
        value = JSON.parse(raw);
      } catch {
        throw {
          code: -32602,
          message: 'Invalid typed data JSON',
        };
      }
    }

    if (!value || typeof value !== 'object') {
      throw {
        code: -32602,
        message: 'Invalid typed data',
      };
    }

    const typed = value as any;

    return {
      domain: typed.domain,
      primaryType: typed.primaryType,
      message: typed.message,
      types: typed.types,
    };
  }
}

function normalizeChainIdValue(value: unknown): string {
  if (typeof value === 'number') {
    return `0x${value.toString(16)}`;
  }

  if (typeof value === 'bigint') {
    return `0x${value.toString(16)}`;
  }

  if (typeof value === 'string') {
    if (value.startsWith('0x')) {
      return value.toLowerCase();
    }

    if (/^[0-9]+$/.test(value)) {
      return `0x${Number(value).toString(16)}`;
    }

    return value.toLowerCase();
  }

  return String(value);
}

function looksLikePermit(input: {
  primaryType?: string;
  message?: Record;
}): boolean {
  const primary = input.primaryType?.toLowerCase() ?? '';

  if (primary.includes('permit')) return true;

  if (
    input.message &&
    'spender' in input.message &&
    ('value' in input.message || 'amount' in input.message)
  ) {
    return true;
  }

  return false;
}

function looksLikePermit2(input: {
  domain?: Record;
  primaryType?: string;
}): boolean {
  const name = String(input.domain?.name ?? '').toLowerCase();
  const primary = String(input.primaryType ?? '').toLowerCase();

  return name.includes('permit2') || primary.includes('permittransferfrom');
}

const RISK_ORDER = ['low', 'medium', 'high', 'critical'] as const;

function maxRisk(a: T, b: T): T {
  return RISK_ORDER.indexOf(a) >= RISK_ORDER.indexOf(b) ? a : b;
}
```



---



# 5\. Wallet Signer Adapter



业务层不直接碰私钥。这里定义 Wallet Core 适配器。



真实项目里可以接：



```Plain Text
HD Wallet
MPC
硬件钱包
Secure Enclave
Keystore
服务端 KMS
```



## `core/signing/wallet-signer.adapter.ts`



```TypeScript
import {
  WalletSignInput,
  WalletSignResult,
} from './signing.types';

export interface WalletSignerAdapter {
  signMessage(input: WalletSignInput): Promise;
  signTypedData(input: WalletSignInput): Promise;
}

export class MockWalletSignerAdapter implements WalletSignerAdapter {
  async signMessage(input: WalletSignInput): Promise {
    console.log('[MockWalletSigner] signMessage', input);

    return {
      signature:
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1b',
    };
  }

  async signTypedData(input: WalletSignInput): Promise {
    console.log('[MockWalletSigner] signTypedData', input);

    return {
      signature:
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb1c',
    };
  }
}
```



---



# 6\. Signing Confirmation Service



## `core/signing/signing-confirmation.service.ts`



```TypeScript
import {
  ConfirmationControllerService,
  newConfirmationId,
} from '../confirmations/confirmation-controller.service';
import {
  ParsedSignMessage,
  ParsedTypedData,
  SigningMethod,
} from './signing.types';

export interface SignConfirmationRequest {
  confirmationId: string;
  kind: 'sign_message' | 'sign_typed_data';
  origin: string;
  hostname: string;
  address: string;
  accountId: string;
  chainId: string;
  method: SigningMethod;
  parsed: ParsedSignMessage | ParsedTypedData;
  createdAt: number;
  expiresAt: number;
}

export class SigningConfirmationService {
  constructor(
    private readonly controller: ConfirmationControllerService,
  ) {}

  async confirmSign(input: {
    origin: string;
    hostname: string;
    address: string;
    accountId: string;
    chainId: string;
    method: SigningMethod;
    parsed: ParsedSignMessage | ParsedTypedData;
  }): Promise {
    const kind = input.method.includes('TypedData')
      ? 'sign_typed_data'
      : 'sign_message';

    const result = await this.controller.request({
      confirmationId: newConfirmationId(),
      kind,
      origin: input.origin,
      hostname: input.hostname,
      address: input.address,
      accountId: input.accountId,
      chainId: input.chainId,
      method: input.method,
      parsed: input.parsed,
      createdAt: Date.now(),
      expiresAt: Date.now() + 120_000,
    } as any);

    return result.approved;
  }
}
```



> 当前 `ConfirmationRequest` 在 Part 5 里还没有包含 `sign_message / sign_typed_data`，本章后面会升级 `DappConfirmationHost` 支持这两类请求。
> 
> 



---



# 7\. Signing Audit Service



## `core/signing/signing-audit.service.ts`



```TypeScript
import { SigningMethod } from './signing.types';

export interface SigningAuditRecord {
  auditNo: string;
  action:
    | 'dapp.sign.requested'
    | 'dapp.sign.approved'
    | 'dapp.sign.rejected'
    | 'dapp.sign.failed';

  origin: string;
  hostname: string;
  accountId: string;
  address: string;
  chainId: string;
  method: SigningMethod;

  riskLevel?: string;
  riskReasons?: string[];

  payload?: unknown;
  error?: unknown;

  createdAt: number;
}

export interface SigningAuditSink {
  record(input: SigningAuditRecord): Promise;
}

export class ConsoleSigningAuditSink implements SigningAuditSink {
  async record(input: SigningAuditRecord): Promise {
    console.log('[SigningAudit]', input);
  }
}

export class SigningAuditService {
  constructor(
    private readonly sink: SigningAuditSink = new ConsoleSigningAuditSink(),
  ) {}

  async requested(input: Omit) {
    await this.record('dapp.sign.requested', input);
  }

  async approved(input: Omit) {
    await this.record('dapp.sign.approved', input);
  }

  async rejected(input: Omit) {
    await this.record('dapp.sign.rejected', input);
  }

  async failed(input: Omit) {
    await this.record('dapp.sign.failed', input);
  }

  private async record(
    action: SigningAuditRecord['action'],
    input: Omit,
  ) {
    await this.sink.record({
      auditNo: this.newAuditNo(),
      action,
      ...input,
      createdAt: Date.now(),
    });
  }

  private newAuditNo(): string {
    return `SAUD-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }
}
```



---



# 8\. Signing Request Service



签名主服务。



## `core/signing/signing-request.service.ts`



```TypeScript
import { DappPermissionService } from '../permissions/dapp-permission.service';
import { MessageParserService } from './message-parser.service';
import { TypedDataParserService } from './typed-data-parser.service';
import { SigningConfirmationService } from './signing-confirmation.service';
import { WalletSignerAdapter } from './wallet-signer.adapter';
import { SigningAuditService } from './signing-audit.service';
import {
  SigningMethod,
  SigningRequestInput,
} from './signing.types';

export class SigningRequestService {
  constructor(
    private readonly permissionService: DappPermissionService,
    private readonly messageParser: MessageParserService,
    private readonly typedDataParser: TypedDataParserService,
    private readonly confirmation: SigningConfirmationService,
    private readonly signer: WalletSignerAdapter,
    private readonly audit: SigningAuditService,
  ) {}

  async sign(input: SigningRequestInput): Promise {
    const permission = input.method.includes('TypedData')
      ? 'sign_typed_data'
      : 'sign_message';

    await this.permissionService.assertPermission({
      origin: input.origin,
      accountId: input.accountId,
      chainId: input.chainId,
      source: input.source,
      permission,
    });

    const parsed = input.method.includes('TypedData')
      ? this.typedDataParser.parse({
          method: input.method,
          params: input.params,
          expectedAddress: input.address,
          activeChainId: input.chainId,
        })
      : this.messageParser.parse({
          method: input.method,
          params: input.params,
          expectedAddress: input.address,
        });

    await this.audit.requested({
      origin: input.origin,
      hostname: input.hostname,
      accountId: input.accountId,
      address: input.address,
      chainId: input.chainId,
      method: input.method,
      riskLevel: parsed.riskLevel,
      riskReasons: parsed.riskReasons,
      payload: parsed,
    });

    const approved = await this.confirmation.confirmSign({
      origin: input.origin,
      hostname: input.hostname,
      accountId: input.accountId,
      address: input.address,
      chainId: input.chainId,
      method: input.method,
      parsed,
    });

    if (!approved) {
      await this.audit.rejected({
        origin: input.origin,
        hostname: input.hostname,
        accountId: input.accountId,
        address: input.address,
        chainId: input.chainId,
        method: input.method,
        riskLevel: parsed.riskLevel,
        riskReasons: parsed.riskReasons,
        payload: parsed,
      });

      throw {
        code: 4001,
        message: 'User rejected signature',
      };
    }

    try {
      const result = input.method.includes('TypedData')
        ? await this.signer.signTypedData({
            accountId: input.accountId,
            address: input.address,
            chainId: input.chainId,
            method: input.method,
            payload: parsed.rawTypedData,
          })
        : await this.signer.signMessage({
            accountId: input.accountId,
            address: input.address,
            chainId: input.chainId,
            method: input.method,
            payload: parsed.rawMessage,
          });

      await this.audit.approved({
        origin: input.origin,
        hostname: input.hostname,
        accountId: input.accountId,
        address: input.address,
        chainId: input.chainId,
        method: input.method,
        riskLevel: parsed.riskLevel,
        riskReasons: parsed.riskReasons,
        payload: {
          parsed,
          signature: maskSignature(result.signature),
        },
      });

      return result.signature;
    } catch (error) {
      await this.audit.failed({
        origin: input.origin,
        hostname: input.hostname,
        accountId: input.accountId,
        address: input.address,
        chainId: input.chainId,
        method: input.method,
        riskLevel: parsed.riskLevel,
        riskReasons: parsed.riskReasons,
        payload: parsed,
        error,
      });

      throw error;
    }
  }
}

function maskSignature(sig: string): string {
  if (!sig || sig.length  {
    const method = input.request.method;

    if (!isSigningMethod(method)) {
      throw {
        code: 4200,
        message: `Unsupported signing method: ${method}`,
      };
    }

    if (!input.context.address) {
      throw {
        code: 4100,
        message: 'No active account address',
      };
    }

    const signature = await this.signingService.sign({
      method,
      params: input.request.params ?? [],
      origin: input.context.origin,
      hostname: input.context.hostname,
      accountId: input.context.accountId,
      address: input.context.address,
      chainId: input.context.chainId,
      source: input.context.source,
    });

    return {
      result: signature,
    };
  }
}
```



---



# 10\. UI：SignMessageModal



## `ui/modals/SignMessageModal.tsx`



```TypeScript
import React from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ParsedSignMessage } from '../../core/signing/signing.types';

export function SignMessageModal(props: {
  visible: boolean;
  request: {
    confirmationId: string;
    origin: string;
    hostname: string;
    address: string;
    chainId: string;
    method: string;
    parsed: ParsedSignMessage;
  } | null;
  onApprove: () => void;
  onReject: () => void;
}) {
  const req = props.request;

  return (
    
      
        
          签名请求

          {req?.hostname}

          
          
          

          {req?.parsed.riskReasons.length ? (
            
              
                风险等级：{req.parsed.riskLevel.toUpperCase()}
              

              {req.parsed.riskReasons.map((item) => (
                
                  • {item}
                
              ))}
            
          ) : null}

          签名内容

          
            
              {req?.parsed.displayMessage}
            
          

          
            请确认你理解签名内容。签名可能用于登录、授权或证明资产所有权。不要签署你不理解的内容。
          

          
            
              拒绝
            

            
              签名
            
          
        
      
    
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

function shorten(address?: string) {
  if (!address) return '-';
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

const backdrop = {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.45)',
  justifyContent: 'flex-end' as const,
};

const sheet = {
  maxHeight: '88%' as const,
  backgroundColor: '#FFFFFF',
  padding: 20,
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
};

const title = {
  fontSize: 22,
  fontWeight: '800' as const,
  color: '#111827',
};

const hostname = {
  marginTop: 6,
  fontSize: 14,
  color: '#6B7280',
};

const sectionTitle = {
  marginTop: 16,
  marginBottom: 8,
  fontSize: 14,
  fontWeight: '800' as const,
  color: '#374151',
};

const messageBox = {
  maxHeight: 220,
  padding: 12,
  borderRadius: 12,
  backgroundColor: '#F9FAFB',
};

const messageText = {
  fontSize: 13,
  lineHeight: 19,
  color: '#111827',
};

const warning = {
  marginTop: 14,
  padding: 12,
  borderRadius: 12,
  backgroundColor: '#FFFBEB',
  color: '#92400E',
  fontSize: 13,
  lineHeight: 18,
};

const riskBox = {
  marginTop: 14,
  padding: 12,
  borderRadius: 12,
  backgroundColor: '#FEF2F2',
};

const riskTitle = {
  color: '#991B1B',
  fontWeight: '800' as const,
  marginBottom: 6,
};

const riskItem = {
  color: '#991B1B',
  fontSize: 12,
  marginTop: 3,
};

const actions = {
  flexDirection: 'row' as const,
  gap: 12,
  marginTop: 20,
};

const rejectButton = {
  flex: 1,
  height: 48,
  borderRadius: 14,
  backgroundColor: '#F3F4F6',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const approveButton = {
  flex: 1,
  height: 48,
  borderRadius: 14,
  backgroundColor: '#111827',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const rejectText = {
  color: '#111827',
  fontWeight: '800' as const,
};

const approveText = {
  color: '#FFFFFF',
  fontWeight: '800' as const,
};
```



---



# 11\. UI：SignTypedDataModal



## `ui/modals/SignTypedDataModal.tsx`



```TypeScript
import React from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ParsedTypedData } from '../../core/signing/signing.types';

export function SignTypedDataModal(props: {
  visible: boolean;
  request: {
    confirmationId: string;
    origin: string;
    hostname: string;
    address: string;
    chainId: string;
    method: string;
    parsed: ParsedTypedData;
  } | null;
  onApprove: () => void;
  onReject: () => void;
}) {
  const req = props.request;

  return (
    
      
        
          TypedData 签名

          {req?.hostname}

          
          
          
          

          {req?.parsed.riskReasons.length ? (
            
              
                风险等级：{req.parsed.riskLevel.toUpperCase()}
              

              {req.parsed.riskReasons.map((item) => (
                
                  • {item}
                
              ))}
            
          ) : null}

          Domain
          

          Message
          

          
            TypedData 签名可能包含授权、Permit 或资产操作。请确认字段内容和授权对象。
          

          
            
              拒绝
            

            
              签名
            
          
        
      
    
  );
}

function JsonBox(props: {
  value?: unknown;
}) {
  return (
    
      
        {JSON.stringify(props.value ?? {}, null, 2)}
      
    
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

function shorten(address?: string) {
  if (!address) return '-';
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

const backdrop = {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.45)',
  justifyContent: 'flex-end' as const,
};

const sheet = {
  maxHeight: '90%' as const,
  backgroundColor: '#FFFFFF',
  padding: 20,
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
};

const title = {
  fontSize: 22,
  fontWeight: '800' as const,
  color: '#111827',
};

const hostname = {
  marginTop: 6,
  fontSize: 14,
  color: '#6B7280',
};

const sectionTitle = {
  marginTop: 14,
  marginBottom: 8,
  fontSize: 14,
  fontWeight: '800' as const,
  color: '#374151',
};

const jsonBox = {
  maxHeight: 130,
  padding: 12,
  borderRadius: 12,
  backgroundColor: '#F9FAFB',
};

const jsonText = {
  fontSize: 12,
  lineHeight: 17,
  color: '#111827',
  fontFamily: 'Menlo',
};

const warning = {
  marginTop: 14,
  padding: 12,
  borderRadius: 12,
  backgroundColor: '#FFFBEB',
  color: '#92400E',
  fontSize: 13,
  lineHeight: 18,
};

const riskBox = {
  marginTop: 14,
  padding: 12,
  borderRadius: 12,
  backgroundColor: '#FEF2F2',
};

const riskTitle = {
  color: '#991B1B',
  fontWeight: '800' as const,
  marginBottom: 6,
};

const riskItem = {
  color: '#991B1B',
  fontSize: 12,
  marginTop: 3,
};

const actions = {
  flexDirection: 'row' as const,
  gap: 12,
  marginTop: 20,
};

const rejectButton = {
  flex: 1,
  height: 48,
  borderRadius: 14,
  backgroundColor: '#F3F4F6',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const approveButton = {
  flex: 1,
  height: 48,
  borderRadius: 14,
  backgroundColor: '#111827',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const rejectText = {
  color: '#111827',
  fontWeight: '800' as const,
};

const approveText = {
  color: '#FFFFFF',
  fontWeight: '800' as const,
};
```



---



# 12\. 升级 DappConfirmationHost



在 Part 5 的 `DappConfirmationHost.tsx` 中增加签名弹窗支持。



## `ui/modals/DappConfirmationHost.tsx`



```TypeScript
import React, { useEffect, useState } from 'react';
import {
  AddChainConfirmationRequest,
  ConfirmationRequest,
  ConnectConfirmationRequest,
  SwitchChainConfirmationRequest,
} from '../../core/confirmations/confirmation.types';
import { ConfirmationControllerService } from '../../core/confirmations/confirmation-controller.service';
import { ConnectConfirmModal } from './ConnectConfirmModal';
import { ChainSwitchModal } from './ChainSwitchModal';
import { AddChainModal } from './AddChainModal';
import { SignMessageModal } from './SignMessageModal';
import { SignTypedDataModal } from './SignTypedDataModal';

export function DappConfirmationHost(props: {
  controller: ConfirmationControllerService;
}) {
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    return props.controller.onRequest((request) => {
      setCurrent(request);
    });
  }, [props.controller]);

  function approve() {
    if (!current) return;

    props.controller.approve(current.confirmationId);
    setCurrent(null);
  }

  function reject() {
    if (!current) return;

    props.controller.reject(current.confirmationId);
    setCurrent(null);
  }

  return (
    <>
      

      

      

      

      
    
  );
}
```



---



# 13\. Runtime 工厂接入签名系统



升级 Part 4 的 `create-dapp-router-runtime.ts`。



关键新增：



```TypeScript
ConfirmationControllerService
SigningConfirmationService
MessageParserService
TypedDataParserService
MockWalletSignerAdapter
SigningAuditService
SigningRequestService
SigningHandlerService
```



## `core/router/create-dapp-router-runtime.ts` 新增片段



```TypeScript
import { ConfirmationControllerService } from '../confirmations/confirmation-controller.service';
import { ConnectConfirmationService } from '../confirmations/connect-confirmation.service';
import { ChainConfirmationService } from '../confirmations/chain-confirmation.service';

import { MessageParserService } from '../signing/message-parser.service';
import { TypedDataParserService } from '../signing/typed-data-parser.service';
import { SigningConfirmationService } from '../signing/signing-confirmation.service';
import { MockWalletSignerAdapter } from '../signing/wallet-signer.adapter';
import { SigningAuditService } from '../signing/signing-audit.service';
import { SigningRequestService } from '../signing/signing-request.service';
import { SigningHandlerService } from '../signing/signing-handler.service';
```



工厂内部新增：



```TypeScript
const confirmationController = new ConfirmationControllerService();

const connectConfirmation = new ConnectConfirmationService(
  confirmationController,
);

const chainConfirmation = new ChainConfirmationService(
  confirmationController,
);
```



然后替换：



```TypeScript
connectConfirmService: connectConfirmation
chainSwitchConfirmService: chainConfirmation
chainAddConfirmService: chainConfirmation
```



新增签名服务：



```TypeScript
const messageParser = new MessageParserService();
const typedDataParser = new TypedDataParserService();

const signingConfirmation = new SigningConfirmationService(
  confirmationController,
);

const walletSigner = new MockWalletSignerAdapter();
const signingAudit = new SigningAuditService();

const signingRequestService = new SigningRequestService(
  permissionService,
  messageParser,
  typedDataParser,
  signingConfirmation,
  walletSigner,
  signingAudit,
);

const signingHandler = new SigningHandlerService(
  signingRequestService,
);
```



Router 注入：



```TypeScript
const router = new DappRequestRouterService({
  accountHandler: permissionService,
  chainHandler,
  rpcHandler,
  signingHandler,
});
```



返回对象新增：



```TypeScript
return {
  router,

  confirmationController,
  connectConfirmation,
  chainConfirmation,

  messageParser,
  typedDataParser,
  signingConfirmation,
  walletSigner,
  signingAudit,
  signingRequestService,
  signingHandler,

  ...
};
```



---



# 14\. DappBrowserScreen 挂载 ConfirmationHost



## `ui/screens/DappBrowserScreen.tsx` 关键新增



```TypeScript
import { DappConfirmationHost } from '../modals/DappConfirmationHost';
```



在 `return` 里：



```TypeScript
return (
  
    

    
  
);
```



这样：



```Plain Text
DApp 请求连接
DApp 请求切链
DApp 请求加链
DApp 请求签名
```



都会自动弹出对应 Modal。



---



# 15\. DApp 侧测试



## 15\.1 personal\_sign



```TypeScript
const accounts = await ethereum.request({
  method: 'eth_requestAccounts',
});

const sig = await ethereum.request({
  method: 'personal_sign',
  params: [
    'Hello DApp Browser',
    accounts[0],
  ],
});

console.log(sig);
```



预期：



```Plain Text
弹出 SignMessageModal
用户确认后返回 signature
```



---



## 15\.2 eth\_sign



```TypeScript
const sig = await ethereum.request({
  method: 'eth_sign',
  params: [
    accounts[0],
    '0x48656c6c6f',
  ],
});
```



预期：



```Plain Text
弹出高风险提示
riskReasons 包含 ETH_SIGN_IS_HIGH_RISK
```



---



## 15\.3 eth\_signTypedData\_v4



```TypeScript
const typedData = {
  domain: {
    name: 'Demo DApp',
    version: '1',
    chainId: 1,
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
  },
  primaryType: 'Mail',
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    Mail: [
      { name: 'contents', type: 'string' },
    ],
  },
  message: {
    contents: 'Hello',
  },
};

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
弹出 SignTypedDataModal
展示 Domain / Message
确认后返回 signature
```



---



# 16\. 本章完成内容



本章完成：



```Plain Text
Signing 类型系统
personal_sign 解析
eth_sign 解析
Hex -> UTF-8 展示
eth_sign 高危提示
TypedData v3/v4 解析
Permit 风险提示
Permit2 高危提示
Signing Confirmation Service
Wallet Signer Adapter
Signing Audit
Signing Request Service
Signing Handler
SignMessageModal
SignTypedDataModal
ConfirmationHost 支持签名
Runtime 接入 signingHandler
```



现在 DApp 浏览器已经支持完整签名链路：



```Plain Text
DApp
  -> window.ethereum.request(personal_sign / typedData)
  -> Provider
  -> Bridge
  -> Router
  -> Permission Check
  -> Parser
  -> Confirmation Modal
  -> Wallet Signer
  -> Signature
  -> DApp
```



---



# 17\. 下一章继续



下一段必须继续：



**《DApp 浏览器 Part 7：交易系统 Tx Parser / Calldata Decode / Approve 风险 / Tx Confirm》**



将覆盖：



```Plain Text
eth_sendTransaction
交易权限检查
Tx 参数标准化
Native Transfer 解析
ERC20 transfer 解析
ERC20 approve 解析
无限授权识别
ERC721 approve 解析
setApprovalForAll 风险识别
ERC1155 setApprovalForAll
合约黑名单
交易模拟
Gas 估算
TransactionConfirmModal
Wallet Transaction Signer
eth_sendRawTransaction 广播
txHash 返回
交易审计
```



这是 DApp 浏览器最核心、最高风险的一章。

