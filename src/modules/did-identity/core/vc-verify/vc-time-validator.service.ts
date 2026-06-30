import type { VcParsed } from './vc-verify.types';

export class VcTimeValidatorService {
  checkExpiration(parsed: VcParsed): { expired: boolean; error?: string; expiresIn?: number } {
    if (!parsed.expirationDate) {
      return { expired: false };
    }

    const now = new Date();
    const expirationDate = parsed.expirationDate;

    if (now > expirationDate) {
      return {
        expired: true,
        error: `Credential expired on ${expirationDate.toISOString()}`,
      };
    }

    const expiresIn = expirationDate.getTime() - now.getTime();
    return {
      expired: false,
      expiresIn,
    };
  }

  checkIssuance(parsed: VcParsed): { valid: boolean; error?: string } {
    if (!parsed.issuanceDate) {
      return { valid: false, error: 'Issuance date is missing' };
    }

    const now = new Date();
    const issuanceDate = parsed.issuanceDate;

    if (issuanceDate > now) {
      return {
        valid: false,
        error: `Issuance date ${issuanceDate.toISOString()} is in the future`,
      };
    }

    return { valid: true };
  }

  checkNotBefore(parsed: VcParsed, notBefore?: string): { valid: boolean; error?: string } {
    if (!notBefore) {
      return { valid: true };
    }

    const now = new Date();
    const notBeforeDate = new Date(notBefore);

    if (isNaN(notBeforeDate.getTime())) {
      return { valid: false, error: 'Invalid notBefore date' };
    }

    if (now < notBeforeDate) {
      return {
        valid: false,
        error: `Credential is not yet valid (valid from ${notBeforeDate.toISOString()})`,
      };
    }

    return { valid: true };
  }

  getTimeUntilExpiration(parsed: VcParsed): number | null {
    if (!parsed.expirationDate) {
      return null;
    }

    const now = new Date();
    const expirationDate = parsed.expirationDate;

    if (now > expirationDate) {
      return 0;
    }

    return expirationDate.getTime() - now.getTime();
  }

  isExpiringSoon(parsed: VcParsed, days: number = 30): boolean {
    const timeUntilExpiration = this.getTimeUntilExpiration(parsed);

    if (timeUntilExpiration === null) {
      return false;
    }

    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const daysUntilExpiration = timeUntilExpiration / millisecondsPerDay;

    return daysUntilExpiration > 0 && daysUntilExpiration <= days;
  }

  getStatus(parsed: VcParsed): 'valid' | 'expired' | 'expiring_soon' | 'not_yet_valid' {
    const issuanceCheck = this.checkIssuance(parsed);
    if (!issuanceCheck.valid) {
      return 'not_yet_valid';
    }

    const expirationCheck = this.checkExpiration(parsed);
    if (expirationCheck.expired) {
      return 'expired';
    }

    if (this.isExpiringSoon(parsed)) {
      return 'expiring_soon';
    }

    return 'valid';
  }
}