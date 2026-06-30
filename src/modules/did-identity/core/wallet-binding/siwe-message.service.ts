import type { SIWEMessageInput, SIWEMessageParsed } from './wallet-binding.types';
import { InvalidSIWEMessageError } from './wallet-binding.errors';

export class SIWEMessageService {
  build(input: SIWEMessageInput): string {
    const lines: string[] = [];

    lines.push(`${input.domain} wants you to sign in with your Ethereum account:`);
    lines.push(input.address);
    lines.push('');

    if (input.statement) {
      lines.push(input.statement);
      lines.push('');
    }

    lines.push(`URI: ${input.uri}`);
    lines.push(`Version: ${input.version}`);
    lines.push(`Chain ID: ${input.chainId}`);
    lines.push(`Nonce: ${input.nonce}`);
    lines.push(`Issued At: ${input.issuedAt}`);

    if (input.expirationTime) {
      lines.push(`Expiration Time: ${input.expirationTime}`);
    }

    if (input.notBefore) {
      lines.push(`Not Before: ${input.notBefore}`);
    }

    if (input.requestId) {
      lines.push(`Request ID: ${input.requestId}`);
    }

    if (input.resources && input.resources.length > 0) {
      lines.push('');
      lines.push('Resources:');
      input.resources.forEach((resource) => lines.push(`- ${resource}`));
    }

    return lines.join('\n');
  }

  parse(message: string): SIWEMessageParsed {
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
        parsed.chainId = parseInt(line.replace('Chain ID: ', ''), 10);
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

  generateNonce(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  formatTimestamp(date?: Date): string {
    const d = date || new Date();
    return d.toISOString().replace('Z', '+00:00');
  }
}