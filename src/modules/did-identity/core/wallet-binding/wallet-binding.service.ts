import type { WalletBindingRecord, WalletBindingInput, WalletBindingCreateInput, WalletBindingResult } from './wallet-binding.types';
import type { WalletBindingRepository } from './wallet-binding.types';
import { WalletBindingRepositoryImpl } from './wallet-binding.repository';
import { WalletBindingChallengeService } from './wallet-binding-challenge.service';
import { SIWEVerifyService } from './siwe-verify.service';
import { WalletBindingPolicyService } from './wallet-binding-policy.service';
import { ChallengeExpiredError, ChallengeNotFoundError, InvalidSignatureError, BindingAlreadyExistsError, MaxBindingsExceededError, BindingNotFoundError } from './wallet-binding.errors';

export class WalletBindingService {
  constructor(
    private readonly bindingRepository: WalletBindingRepository = new WalletBindingRepositoryImpl(),
    private readonly challengeService: WalletBindingChallengeService = new WalletBindingChallengeService(),
    private readonly siweVerifyService: SIWEVerifyService = new SIWEVerifyService(),
    private readonly policyService: WalletBindingPolicyService = new WalletBindingPolicyService(),
  ) {}

  async bind(input: WalletBindingInput): Promise<WalletBindingResult> {
    try {
      const challenge = await this.challengeService.getChallenge(input.challengeId);

      const verifyResult = await this.siweVerifyService.verify(challenge.message, input.signature);

      if (!verifyResult.valid) {
        throw new InvalidSignatureError(verifyResult.error);
      }

      const existingBinding = await this.bindingRepository.findByDidAndAddress(challenge.did, challenge.address);
      if (existingBinding) {
        if (existingBinding.status === 'revoked') {
          const updatedBinding: WalletBindingRecord = {
            ...existingBinding,
            status: 'verified',
            signature: input.signature,
            signedMessage: challenge.message,
            verifiedAt: Date.now(),
            revokedAt: undefined,
            updatedAt: Date.now(),
          };
          await this.bindingRepository.update(updatedBinding);
          await this.challengeService.deleteChallenge(input.challengeId);
          return { success: true, binding: updatedBinding, message: 'Binding reactivated' };
        }
        throw new BindingAlreadyExistsError(challenge.did, challenge.address);
      }

      const didBindings = await this.bindingRepository.findByDid(challenge.did);
      const activeBindings = didBindings.filter((b) => b.status === 'verified');
      const maxBindings = this.policyService.getMaxBindingsPerDid();

      if (activeBindings.length >= maxBindings) {
        throw new MaxBindingsExceededError(challenge.did, maxBindings);
      }

      const newBinding: WalletBindingRecord = {
        bindingId: `binding_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        did: challenge.did,
        address: challenge.address,
        chainId: challenge.chainId,
        method: 'siwe',
        status: 'verified',
        signedMessage: challenge.message,
        signature: input.signature,
        verifiedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await this.bindingRepository.save(newBinding);
      await this.challengeService.deleteChallenge(input.challengeId);

      return { success: true, binding: newBinding, message: 'Wallet successfully bound to DID' };
    } catch (error) {
      if (error instanceof ChallengeExpiredError) {
        return { success: false, error: 'Challenge has expired, please request a new one' };
      }
      if (error instanceof ChallengeNotFoundError) {
        return { success: false, error: 'Challenge not found' };
      }
      if (error instanceof InvalidSignatureError) {
        return { success: false, error: error.message };
      }
      if (error instanceof BindingAlreadyExistsError) {
        return { success: false, error: 'Binding already exists' };
      }
      if (error instanceof MaxBindingsExceededError) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Wallet binding failed' };
    }
  }

  async createBinding(input: WalletBindingCreateInput): Promise<WalletBindingResult> {
    const existingBinding = await this.bindingRepository.findByDidAndAddress(input.did, input.address);
    if (existingBinding && existingBinding.status !== 'revoked') {
      throw new BindingAlreadyExistsError(input.did, input.address);
    }

    const didBindings = await this.bindingRepository.findByDid(input.did);
    const activeBindings = didBindings.filter((b) => b.status === 'verified');
    const maxBindings = this.policyService.getMaxBindingsPerDid();

    if (activeBindings.length >= maxBindings) {
      throw new MaxBindingsExceededError(input.did, maxBindings);
    }

    let status: WalletBindingRecord['status'] = 'pending';
    let verifiedAt: number | undefined;

    if (input.signature) {
      const challenge = await this.challengeService.createChallenge({
        did: input.did,
        address: input.address,
        chainId: input.chainId,
      });

      const verifyResult = await this.siweVerifyService.verify(challenge.message, input.signature);

      if (verifyResult.valid) {
        status = 'verified';
        verifiedAt = Date.now();
        await this.challengeService.deleteChallenge(challenge.challengeId);
      }
    }

    const binding: WalletBindingRecord = {
      bindingId: `binding_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      did: input.did,
      address: input.address,
      chainId: input.chainId,
      method: input.method,
      status,
      signature: input.signature,
      verifiedAt,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.bindingRepository.save(binding);

    return {
      success: true,
      binding,
      message: status === 'verified' ? 'Binding created and verified' : 'Binding created, waiting for verification',
    };
  }

  async getBinding(bindingId: string): Promise<WalletBindingRecord | undefined> {
    return this.bindingRepository.get(bindingId);
  }

  async getBindingsByDid(did: string): Promise<WalletBindingRecord[]> {
    return this.bindingRepository.findByDid(did);
  }

  async getBindingsByAddress(address: string): Promise<WalletBindingRecord[]> {
    return this.bindingRepository.findByAddress(address);
  }

  async revokeBinding(bindingId: string): Promise<WalletBindingResult> {
    const binding = await this.bindingRepository.get(bindingId);

    if (!binding) {
      throw new BindingNotFoundError(bindingId);
    }

    const updatedBinding: WalletBindingRecord = {
      ...binding,
      status: 'revoked',
      revokedAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.bindingRepository.update(updatedBinding);

    return { success: true, binding: updatedBinding, message: 'Binding revoked' };
  }

  async revokeBindingsByDid(did: string): Promise<void> {
    await this.bindingRepository.revokeByDid(did);
  }

  async deleteBinding(bindingId: string): Promise<void> {
    await this.bindingRepository.delete(bindingId);
  }

  async getAllBindings(): Promise<WalletBindingRecord[]> {
    return this.bindingRepository.getAll();
  }

  async isAddressBound(did: string, address: string): Promise<boolean> {
    const binding = await this.bindingRepository.findByDidAndAddress(did, address);
    return !!binding && binding.status === 'verified';
  }
}