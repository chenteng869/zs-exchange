import type { WalletBindingPolicyConfig } from './wallet-binding.types';

export class WalletBindingPolicyService {
  private config: WalletBindingPolicyConfig = {
    maxBindingsPerDid: 5,
    bindingExpirationDays: 365,
    challengeExpirationMinutes: 10,
    allowMultipleChains: true,
    requireVerifiedDid: false,
  };

  getConfig(): WalletBindingPolicyConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<WalletBindingPolicyConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getMaxBindingsPerDid(): number {
    return this.config.maxBindingsPerDid;
  }

  getBindingExpirationDays(): number {
    return this.config.bindingExpirationDays;
  }

  getChallengeExpirationMinutes(): number {
    return this.config.challengeExpirationMinutes;
  }

  isMultipleChainsAllowed(): boolean {
    return this.config.allowMultipleChains;
  }

  isVerifiedDidRequired(): boolean {
    return this.config.requireVerifiedDid;
  }

  isChainSupported(chainId: string): boolean {
    const supportedChains = ['1', '5', '10', '56', '97', '137', '80001', '0x1', '0x5', '0xa', '0x38', '0x61', '0x89', '0x13881'];
    return supportedChains.includes(chainId) || supportedChains.includes(parseInt(chainId, 16).toString());
  }

  isBindingExpired(bindingCreatedAt: number): boolean {
    const expirationMs = this.config.bindingExpirationDays * 24 * 60 * 60 * 1000;
    return Date.now() - bindingCreatedAt > expirationMs;
  }

  resetToDefault(): void {
    this.config = {
      maxBindingsPerDid: 5,
      bindingExpirationDays: 365,
      challengeExpirationMinutes: 10,
      allowMultipleChains: true,
      requireVerifiedDid: false,
    };
  }
}