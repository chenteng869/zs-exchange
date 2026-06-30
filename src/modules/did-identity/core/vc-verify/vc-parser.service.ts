import type { VcParsed, VcFormat } from './vc-verify.types';
import { InvalidFormatError, InvalidCredentialStructureError } from './vc-verify.errors';

export class VcParserService {
  parse(credential: unknown): VcParsed {
    if (typeof credential === 'string') {
      return this.parseJwt(credential);
    }

    if (typeof credential === 'object' && credential !== null) {
      return this.parseJsonLd(credential as Record<string, unknown>);
    }

    throw new InvalidFormatError('Unsupported credential format');
  }

  detectFormat(credential: unknown): VcFormat {
    if (typeof credential === 'string') {
      if (this.isJwt(credential)) {
        return 'jwt';
      }
    }

    if (typeof credential === 'object' && credential !== null) {
      const obj = credential as Record<string, unknown>;

      if (obj.type && Array.isArray(obj.type) && obj.type.includes('VerifiableCredential')) {
        const proof = obj.proof as Record<string, unknown> | undefined;
        if (proof?.type === 'EIP712Signature2021') {
          return 'eip712';
        }
        return 'jsonld';
      }
    }

    throw new InvalidFormatError('Cannot detect credential format');
  }

  private isJwt(credential: string): boolean {
    const parts = credential.split('.');
    return parts.length === 3 && parts.every((part) => /^[A-Za-z0-9-_=]*$/.test(part));
  }

  private parseJwt(credential: string): VcParsed {
    const parts = credential.split('.');
    if (parts.length !== 3) {
      throw new InvalidFormatError('Invalid JWT format');
    }

    try {
      const payload = JSON.parse(atob(parts[1]));
      const vc = payload.vc as Record<string, unknown>;

      if (!vc) {
        throw new InvalidCredentialStructureError('JWT does not contain VC payload');
      }

      return {
        format: 'jwt',
        credential: vc,
        proof: {
          type: 'JsonWebSignature2020',
          created: payload.iat ? new Date(payload.iat * 1000).toISOString() : new Date().toISOString(),
          proofPurpose: 'assertionMethod',
          verificationMethod: '',
          jws: credential,
        },
        issuer: payload.iss || '',
        subject: payload.sub || '',
        issuanceDate: payload.iat ? new Date(payload.iat * 1000) : new Date(),
        expirationDate: payload.exp ? new Date(payload.exp * 1000) : undefined,
        type: vc.type ? (Array.isArray(vc.type) ? vc.type : [vc.type]) : [],
      };
    } catch (error) {
      throw new InvalidFormatError('Failed to parse JWT');
    }
  }

  private parseJsonLd(credential: Record<string, unknown>): VcParsed {
    if (!credential.type || !Array.isArray(credential.type) || !credential.type.includes('VerifiableCredential')) {
      throw new InvalidCredentialStructureError('Missing or invalid type field');
    }

    if (!credential.issuer) {
      throw new InvalidCredentialStructureError('Missing issuer field');
    }

    if (!credential.credentialSubject) {
      throw new InvalidCredentialStructureError('Missing credentialSubject field');
    }

    if (!credential.issuanceDate) {
      throw new InvalidCredentialStructureError('Missing issuanceDate field');
    }

    const issuerObject = credential.issuer as Record<string, unknown>;
    const issuer = typeof credential.issuer === 'string'
      ? credential.issuer
      : typeof issuerObject?.id === 'string'
        ? issuerObject.id
        : '';
    const subject = typeof credential.credentialSubject === 'object' && credential.credentialSubject !== null
      ? String((credential.credentialSubject as Record<string, unknown>).id || '')
      : '';

    const proof = credential.proof ? (credential.proof as Record<string, unknown>) : undefined;

    return {
      format: 'jsonld',
      credential,
      proof: proof ? {
        type: proof.type as string,
        created: proof.created as string,
        proofPurpose: proof.proofPurpose as string,
        verificationMethod: proof.verificationMethod as string,
        signature: proof.signature as string | undefined,
        jws: proof.jws as string | undefined,
      } : undefined,
      issuer,
      subject,
      issuanceDate: new Date(credential.issuanceDate as string),
      expirationDate: credential.expirationDate ? new Date(credential.expirationDate as string) : undefined,
      type: credential.type as string[],
    };
  }

  extractIssuer(credential: unknown): string {
    const parsed = this.parse(credential);
    return parsed.issuer;
  }

  extractSubject(credential: unknown): string {
    const parsed = this.parse(credential);
    return parsed.subject;
  }

  extractType(credential: unknown): string[] {
    const parsed = this.parse(credential);
    return parsed.type;
  }

  extractProof(credential: unknown) {
    const parsed = this.parse(credential);
    return parsed.proof;
  }
}
