import { verifyMessage } from 'viem';
import type { SIWEVerifyResult, SIWEMessageParsed } from './wallet-binding.types';
import { InvalidSIWEMessageError, SignatureVerificationError } from './wallet-binding.errors';

export class SIWEVerifyService {
  async verify(message: string, signature: string): Promise<SIWEVerifyResult> {
    try {
      const parsed = this.parseMessage(message);

      if (!parsed.address || !parsed.nonce) {
        return { valid: false, error: 'Missing required fields in SIWE message' };
      }

      const isValid = await verifyMessage({
        address: parsed.address as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      });

      if (!isValid) {
        return { valid: false, error: 'Signature verification failed' };
      }

      const now = new Date();
      if (parsed.expirationTime) {
        const expirationDate = new Date(parsed.expirationTime);
        if (now > expirationDate) {
          return { valid: false, error: 'SIWE message has expired' };
        }
      }

      if (parsed.notBefore) {
        const notBeforeDate = new Date(parsed.notBefore);
        if (now < notBeforeDate) {
          return { valid: false, error: 'SIWE message not yet valid' };
        }
      }

      return {
        valid: true,
        did: `did:pkh:eip155:${parsed.chainId}:${parsed.address.toLowerCase()}`,
        address: parsed.address,
        chainId: parsed.chainId,
        message: parsed,
      };
    } catch (error) {
      if (error instanceof InvalidSIWEMessageError) {
        return { valid: false, error: error.message };
      }
      return { valid: false, error: 'Signature verification failed' };
    }
  }

  parseMessage(message: string): SIWEMessageParsed {
    const lines = message.split('\n').filter((line) => line.trim());

    if (lines.length < 7) {
      throw new InvalidSIWEMessageError('Invalid SIWE message format');
    }

    const addressLine = lines[1];
    const addressMatch = addressLine.match(/^0x[a-fA-F0-9]{40}$/);
    if (!addressMatch) {
      throw new InvalidSIWEMessageError('Invalid Ethereum address');
    }

    const parsed: SIWEMessageParsed = {
      domain: lines[0].replace(' wants you to sign in with your Ethereum account:', ''),
      address: addressMatch[0],
      version: '1',
      chainId: 1,
      nonce: '',
      issuedAt: '',
      uri: '',
    };

    let statementLines: string[] = [];
    let inStatement = false;
    let inResources = false;
    const resources: string[] = [];

    for (let i = 2; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('URI:')) {
        parsed.uri = line.replace('URI: ', '');
        inStatement = false;
        continue;
      }

      if (line.startsWith('Version:')) {
        parsed.version = line.replace('Version: ', '');
        inStatement = false;
        continue;
      }

      if (line.startsWith('Chain ID:')) {
        const chainIdStr = line.replace('Chain ID: ', '');
        parsed.chainId = parseInt(chainIdStr, 10);
        if (isNaN(parsed.chainId)) {
          throw new InvalidSIWEMessageError('Invalid chain ID');
        }
        inStatement = false;
        continue;
      }

      if (line.startsWith('Nonce:')) {
        parsed.nonce = line.replace('Nonce: ', '');
        inStatement = false;
        continue;
      }

      if (line.startsWith('Issued At:')) {
        parsed.issuedAt = line.replace('Issued At: ', '');
        inStatement = false;
        continue;
      }

      if (line.startsWith('Expiration Time:')) {
        parsed.expirationTime = line.replace('Expiration Time: ', '');
        inStatement = false;
        continue;
      }

      if (line.startsWith('Not Before:')) {
        parsed.notBefore = line.replace('Not Before: ', '');
        inStatement = false;
        continue;
      }

      if (line.startsWith('Request ID:')) {
        parsed.requestId = line.replace('Request ID: ', '');
        inStatement = false;
        continue;
      }

      if (line.startsWith('Resources:')) {
        inResources = true;
        inStatement = false;
        continue;
      }

      if (inResources) {
        if (line.startsWith('- ')) {
          resources.push(line.slice(2));
        }
        continue;
      }

      if (!parsed.statement) {
        inStatement = true;
      }

      if (inStatement) {
        statementLines.push(line);
      }
    }

    if (statementLines.length > 0) {
      parsed.statement = statementLines.join('\n');
    }

    if (resources.length > 0) {
      parsed.resources = resources;
    }

    return parsed;
  }
}
