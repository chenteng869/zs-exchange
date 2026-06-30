import type { WalletBindingChallenge, WalletBindingChallengeInput } from './wallet-binding.types';
import type { WalletBindingChallengeRepository } from './wallet-binding.types';
import { WalletBindingChallengeRepositoryImpl } from './wallet-binding-challenge.repository';
import { SIWEMessageService } from './siwe-message.service';
import { ChallengeExpiredError, ChallengeNotFoundError } from './wallet-binding.errors';

export class WalletBindingChallengeService {
  constructor(
    private readonly challengeRepository: WalletBindingChallengeRepository = new WalletBindingChallengeRepositoryImpl(),
    private readonly siweMessageService: SIWEMessageService = new SIWEMessageService(),
  ) {}

  async createChallenge(input: WalletBindingChallengeInput): Promise<WalletBindingChallenge> {
    await this.challengeRepository.deleteExpired();

    const existingChallenges = await this.challengeRepository.findByDid(input.did);
    for (const challenge of existingChallenges) {
      if (challenge.address.toLowerCase() === input.address.toLowerCase()) {
        await this.challengeRepository.delete(challenge.challengeId);
      }
    }

    const nonce = this.siweMessageService.generateNonce();
    const issuedAt = this.siweMessageService.formatTimestamp();
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 10);
    const expirationTime = this.siweMessageService.formatTimestamp(expirationDate);

    const chainIdNum = parseInt(input.chainId, 16) || parseInt(input.chainId, 10);

    const siweInput = {
      domain: 'stockexchange.io',
      address: input.address,
      statement: 'Sign this message to bind your wallet to your DID',
      uri: 'https://stockexchange.io',
      version: '1',
      chainId: chainIdNum,
      nonce,
      issuedAt,
      expirationTime,
    };

    const message = this.siweMessageService.build(siweInput);

    const challenge: WalletBindingChallenge = {
      challengeId: `challenge_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      did: input.did,
      address: input.address,
      chainId: input.chainId,
      nonce,
      message,
      expiresAt: expirationDate.getTime(),
      createdAt: Date.now(),
    };

    await this.challengeRepository.save(challenge);

    return challenge;
  }

  async getChallenge(challengeId: string): Promise<WalletBindingChallenge> {
    const challenge = await this.challengeRepository.get(challengeId);

    if (!challenge) {
      throw new ChallengeNotFoundError(challengeId);
    }

    if (challenge.expiresAt < Date.now()) {
      await this.challengeRepository.delete(challengeId);
      throw new ChallengeExpiredError(challengeId);
    }

    return challenge;
  }

  async deleteChallenge(challengeId: string): Promise<void> {
    await this.challengeRepository.delete(challengeId);
  }

  async deleteExpiredChallenges(): Promise<void> {
    await this.challengeRepository.deleteExpired();
  }
}