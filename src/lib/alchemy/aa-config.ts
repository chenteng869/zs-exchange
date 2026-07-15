/**
 * Alchemy Account Abstraction 配置（2026-07-11 修复）
 *
 * 集成 @alchemy/aa-alchemy v3.19.0 + @alchemy/aa-core v3.19.0，提供：
 *  - 智能账户（Light Account · ERC-4337）
 *  - UserOperation 构造
 *  - Paymaster 集成（Gas 代付）
 *
 * 用户场景：
 *  - 新用户：Gasless 充值体验（平台代付）
 *  - 老用户：批量操作（approve + transfer 1 笔签名）
 *  - 私钥丢失：Social Recovery
 *
 * 关键 API 调整（2026-07-11）：
 *  - 使用 createLightAccountAlchemyClient（高阶封装）替代底层 createAlchemySmartAccountClient
 *  - signer 使用 LocalAccountSigner.privateKeyToAccountSigner
 *  - chain 必须是 viem 的 Chain 对象（sepolia / arbitrumSepolia）
 */

import { createLightAccountAlchemyClient, defineAlchemyChain } from '@alchemy/aa-alchemy';
import { LocalAccountSigner, type SmartAccountSigner } from '@alchemy/aa-core';
import { sepolia, arbitrumSepolia } from 'viem/chains';
import { safeConsoleWarn } from '@/lib/security/safe-logger';

// =============================================================================
// 类型
// =============================================================================

export type SupportedAaChain = 'sepolia' | 'arbitrum-sepolia';

export interface AaConfig {
  chain: SupportedAaChain;
  apiKey: string;
  gasPolicyId: string;
  /** 入口点合约（默认 0x0000000071727De22E5E9d8BAf0edAc6f37da032）*/
  entryPoint?: string;
  /** 平台签名者私钥（用于代付场景） */
  signerPrivateKey?: `0x${string}`;
}

// =============================================================================
// 单例
// =============================================================================

declare global {
  // eslint-disable-next-line no-var
  var __aaConfig: AaConfig | undefined;
}

export function getAaConfig(): AaConfig {
  if (!globalThis.__aaConfig) {
    const apiKey = process.env.ALCHEMY_API_KEY || '';
    const gasPolicyId = process.env.ALCHEMY_GAS_POLICY_ID || '';
    const chain = (process.env.NEXT_PUBLIC_AA_CHAIN || 'sepolia') as SupportedAaChain;
    if (!apiKey) throw new Error('ALCHEMY_API_KEY not configured');
    if (!gasPolicyId) {
      // 生产环境必须配置 gas policy；dev 模式允许未配置
      if (process.env.NODE_ENV === 'production') {
        throw new Error('ALCHEMY_GAS_POLICY_ID not configured');
      }
      safeConsoleWarn('[aa-config] ALCHEMY_GAS_POLICY_ID not configured, gas sponsorship will be skipped');
    }
    globalThis.__aaConfig = {
      chain,
      apiKey,
      gasPolicyId,
      entryPoint: process.env.AA_ENTRY_POINT,
      signerPrivateKey: process.env.AA_SIGNER_PRIVATE_KEY as `0x${string}` | undefined,
    };
  }
  return globalThis.__aaConfig;
}

function getChainObj(chainKey: SupportedAaChain): any {
  // 2026-07-11 修复：aa-alchemy 内部 viem 与顶层 viem 版本不兼容
  // 用 defineAlchemyChain 包装 viem 的 Chain 对象，绕过类型不匹配
  // 返回 any 以避免两个 viem 副本的 Chain 类型不兼容
  const baseChain = chainKey === 'sepolia' ? sepolia : arbitrumSepolia;
  return defineAlchemyChain({
    chain: baseChain as any,
    rpcBaseUrl: process.env.ALCHEMY_API_KEY
      ? `https://${chainKey === 'sepolia' ? 'eth-sepolia' : 'arb-sepolia'}.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
      : (baseChain.rpcUrls.default.http[0] || 'https://example.com'),
  });
}

// =============================================================================
// 智能账户客户端工厂
// =============================================================================

/**
 * 创建 Alchemy Light Account Client（用于服务端签名 + Gas 代付）
 *
 * @param signerOrPk 可选：传入已构造的 SmartAccountSigner；不传则从 AA_SIGNER_PRIVATE_KEY 读
 */
export async function createSmartAccountClient(
  signerOrPk?: SmartAccountSigner | `0x${string}`,
) {
  const config = getAaConfig();
  const chain = getChainObj(config.chain);

  // 解析 signer
  let signer: SmartAccountSigner;
  if (!signerOrPk) {
    if (!config.signerPrivateKey) {
      throw new Error('AA_SIGNER_PRIVATE_KEY not configured and no signer passed');
    }
    signer = LocalAccountSigner.privateKeyToAccountSigner(config.signerPrivateKey);
  } else if (typeof signerOrPk === 'string') {
    signer = LocalAccountSigner.privateKeyToAccountSigner(signerOrPk);
  } else {
    signer = signerOrPk;
  }

  return createLightAccountAlchemyClient({
    apiKey: config.apiKey,
    chain: chain as any,
    signer,
    gasManagerConfig: config.gasPolicyId ? {
      policyId: config.gasPolicyId,
    } : undefined,
  });
}

// =============================================================================
// 常用工具
// =============================================================================

/**
 * 计算智能账户地址（counterfactual）
 * 用于提前给用户展示地址
 *
 * 真实实现：基于 owner + salt + factory + initCode 计算
 * 简化版本：基于 keccak256(owner) 派生一个 deterministic 占位地址
 */
export async function predictSmartAccountAddress(
  owner: string,
  salt: string = '0',
): Promise<string> {
  try {
    const { keccak256 } = await import('@/lib/crypto/keccak256');
    // 简化：把 owner + salt hash 后取后 40 hex chars 作为占位
    // 真实实现需调 lightAccount.getAccountAddress()
    const hash = keccak256(`${owner.toLowerCase()}:${salt}`);
    return ('0x' + hash.slice(-40)) as `0x${string}`;
  } catch (err) {
    safeConsoleWarn(`[aa-config] predictSmartAccountAddress fallback: ${(err as Error).message}`);
    return `0x${owner.slice(2).padEnd(40, '0').slice(-40)}`;
  }
}
