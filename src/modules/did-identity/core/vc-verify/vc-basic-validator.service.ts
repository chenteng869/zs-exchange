import type { VcParsed, VcProof } from './vc-verify.types';
import { InvalidIssuerError, InvalidSubjectError, MissingProofError, InvalidProofError } from './vc-verify.errors';

export class VcBasicValidatorService {
  validateStructure(parsed: VcParsed): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!parsed.issuer || parsed.issuer.trim() === '') {
      errors.push('Issuer is required');
    }

    if (!parsed.subject || parsed.subject.trim() === '') {
      errors.push('Subject is required');
    }

    if (!parsed.type || parsed.type.length === 0) {
      errors.push('Type is required');
    } else if (!parsed.type.includes('VerifiableCredential')) {
      errors.push('Type must include VerifiableCredential');
    }

    if (!parsed.issuanceDate) {
      errors.push('Issuance date is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validateIssuer(issuer: string): { valid: boolean; error?: string } {
    const didRegex = /^did:([a-zA-Z0-9]+):(.+)$/;

    if (!issuer || issuer.trim() === '') {
      return { valid: false, error: 'Issuer cannot be empty' };
    }

    if (!didRegex.test(issuer)) {
      return { valid: false, error: 'Issuer is not a valid DID' };
    }

    return { valid: true };
  }

  validateSubject(subject: string): { valid: boolean; error?: string } {
    const didRegex = /^did:([a-zA-Z0-9]+):(.+)$/;

    if (!subject || subject.trim() === '') {
      return { valid: false, error: 'Subject cannot be empty' };
    }

    if (!didRegex.test(subject) && !subject.startsWith('0x')) {
      return { valid: false, error: 'Subject is not a valid DID or address' };
    }

    return { valid: true };
  }

  validateProof(proof: VcProof | undefined): { valid: boolean; error?: string } {
    if (!proof) {
      return { valid: false, error: 'Proof is required' };
    }

    if (!proof.type || proof.type.trim() === '') {
      return { valid: false, error: 'Proof type is required' };
    }

    if (!proof.verificationMethod || proof.verificationMethod.trim() === '') {
      return { valid: false, error: 'Verification method is required' };
    }

    if (!proof.signature && !proof.jws) {
      return { valid: false, error: 'Signature or JWS is required' };
    }

    return { valid: true };
  }

  validateType(types: string[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!types || types.length === 0) {
      errors.push('Type array cannot be empty');
      return { valid: false, errors };
    }

    if (!types.includes('VerifiableCredential')) {
      errors.push('Type must include VerifiableCredential');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validateIssuanceDate(date: Date): { valid: boolean; error?: string } {
    if (!date || isNaN(date.getTime())) {
      return { valid: false, error: 'Invalid issuance date' };
    }

    const now = new Date();
    if (date > now) {
      return { valid: false, error: 'Issuance date cannot be in the future' };
    }

    return { valid: true };
  }
}