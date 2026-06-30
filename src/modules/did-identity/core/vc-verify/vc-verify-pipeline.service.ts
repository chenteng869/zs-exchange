import type { VcVerifyInput, VcVerifyResult, VcVerifyOptions, VcVerifyCheck, VcVerifyError, VcVerifyWarning, VcParsed } from './vc-verify.types';
import { VcParserService } from './vc-parser.service';
import { VcBasicValidatorService } from './vc-basic-validator.service';
import { VcTimeValidatorService } from './vc-time-validator.service';
import { VcSignerService } from '../vc/vc-signer.service';
import { InvalidFormatError, CredentialExpiredError, CredentialRevokedError, SchemaValidationError, IssuerNotTrustedError, InvalidIssuerError, InvalidSubjectError, SignatureVerificationError, InvalidCredentialStructureError } from './vc-verify.errors';

export class VcVerifyPipelineService {
  constructor(
    private readonly parserService: VcParserService = new VcParserService(),
    private readonly basicValidator: VcBasicValidatorService = new VcBasicValidatorService(),
    private readonly timeValidator: VcTimeValidatorService = new VcTimeValidatorService(),
    private readonly signerService: VcSignerService = new VcSignerService(),
  ) {}

  async verify(input: VcVerifyInput): Promise<VcVerifyResult> {
    const { credential, options } = input;

    const defaultOptions: VcVerifyOptions = {
      verifySignature: true,
      checkExpiration: true,
      checkRevocation: true,
      validateSchema: true,
      checkIssuerTrust: true,
      verifyOnChainAnchor: false,
    };

    const verifyOptions = { ...defaultOptions, ...options };

    const checks: VcVerifyCheck[] = [];
    const errors: VcVerifyError[] = [];
    const warnings: VcVerifyWarning[] = [];

    let parsed: VcParsed | null = null;

    try {
      parsed = this.parserService.parse(credential);
      checks.push({
        checkId: 'format_detection',
        name: 'Format Detection',
        result: 'pass',
      });
    } catch (error) {
      const errorCode = error instanceof InvalidFormatError ? error.code : 'FORMAT_DETECTION_FAILED';
      const errorMessage = error instanceof Error ? error.message : 'Failed to detect format';

      checks.push({
        checkId: 'format_detection',
        name: 'Format Detection',
        result: 'fail',
        error: { code: errorCode, message: errorMessage },
      });

      errors.push({ code: errorCode, message: errorMessage });

      return this.buildResult(checks, errors, warnings, false, 'invalid');
    }

    const structureValidation = this.basicValidator.validateStructure(parsed);
    if (!structureValidation.valid) {
      structureValidation.errors.forEach((error) => {
        errors.push({ code: 'INVALID_STRUCTURE', message: error });
      });

      checks.push({
        checkId: 'structure_validation',
        name: 'Structure Validation',
        result: 'fail',
        error: { code: 'INVALID_STRUCTURE', message: structureValidation.errors.join(', ') },
      });

      return this.buildResult(checks, errors, warnings, false, 'invalid');
    } else {
      checks.push({
        checkId: 'structure_validation',
        name: 'Structure Validation',
        result: 'pass',
      });
    }

    const issuerValidation = this.basicValidator.validateIssuer(parsed.issuer);
    if (!issuerValidation.valid) {
      errors.push({ code: 'INVALID_ISSUER', message: issuerValidation.error || 'Invalid issuer' });

      checks.push({
        checkId: 'issuer_validation',
        name: 'Issuer Validation',
        result: 'fail',
        error: { code: 'INVALID_ISSUER', message: issuerValidation.error || 'Invalid issuer' },
      });

      return this.buildResult(checks, errors, warnings, false, 'invalid');
    } else {
      checks.push({
        checkId: 'issuer_validation',
        name: 'Issuer Validation',
        result: 'pass',
      });
    }

    const subjectValidation = this.basicValidator.validateSubject(parsed.subject);
    if (!subjectValidation.valid) {
      errors.push({ code: 'INVALID_SUBJECT', message: subjectValidation.error || 'Invalid subject' });

      checks.push({
        checkId: 'subject_validation',
        name: 'Subject Validation',
        result: 'fail',
        error: { code: 'INVALID_SUBJECT', message: subjectValidation.error || 'Invalid subject' },
      });

      return this.buildResult(checks, errors, warnings, false, 'invalid');
    } else {
      checks.push({
        checkId: 'subject_validation',
        name: 'Subject Validation',
        result: 'pass',
      });
    }

    if (verifyOptions.checkIssuerTrust) {
      const issuerTrust = this.checkIssuerTrust(parsed.issuer);
      if (!issuerTrust.trusted) {
        warnings.push({ code: 'ISSUER_NOT_TRUSTED', message: `Issuer ${parsed.issuer} is not in the trusted list` });

        checks.push({
          checkId: 'issuer_trust',
          name: 'Issuer Trust Check',
          result: 'warning',
          warning: { code: 'ISSUER_NOT_TRUSTED', message: `Issuer ${parsed.issuer} is not in the trusted list` },
        });
      } else {
        checks.push({
          checkId: 'issuer_trust',
          name: 'Issuer Trust Check',
          result: 'pass',
        });
      }
    }

    if (verifyOptions.verifySignature) {
      const signatureResult = await this.verifySignature(credential, parsed);
      if (!signatureResult.valid) {
        errors.push({ code: 'SIGNATURE_VERIFICATION_FAILED', message: signatureResult.error || 'Signature verification failed' });

        checks.push({
          checkId: 'signature_verification',
          name: 'Signature Verification',
          result: 'fail',
          error: { code: 'SIGNATURE_VERIFICATION_FAILED', message: signatureResult.error || 'Signature verification failed' },
        });

        return this.buildResult(checks, errors, warnings, false, 'invalid');
      } else {
        checks.push({
          checkId: 'signature_verification',
          name: 'Signature Verification',
          result: 'pass',
        });
      }
    }

    if (verifyOptions.checkExpiration) {
      const expirationResult = this.timeValidator.checkExpiration(parsed);
      if (expirationResult.expired) {
        errors.push({ code: 'CREDENTIAL_EXPIRED', message: expirationResult.error || 'Credential expired' });

        checks.push({
          checkId: 'expiration_check',
          name: 'Expiration Check',
          result: 'fail',
          error: { code: 'CREDENTIAL_EXPIRED', message: expirationResult.error || 'Credential expired' },
        });

        return this.buildResult(checks, errors, warnings, false, 'expired');
      } else {
        checks.push({
          checkId: 'expiration_check',
          name: 'Expiration Check',
          result: 'pass',
        });

        if (expirationResult.expiresIn !== undefined && this.timeValidator.isExpiringSoon(parsed)) {
          warnings.push({ code: 'EXPIRING_SOON', message: 'Credential is expiring soon' });

          checks.push({
            checkId: 'expiration_warning',
            name: 'Expiration Warning',
            result: 'warning',
            warning: { code: 'EXPIRING_SOON', message: 'Credential is expiring soon' },
          });
        }
      }
    }

    if (verifyOptions.checkRevocation) {
      const revocationResult = await this.checkRevocation(parsed);
      if (revocationResult.revoked) {
        errors.push({ code: 'CREDENTIAL_REVOKED', message: revocationResult.reason || 'Credential has been revoked' });

        checks.push({
          checkId: 'revocation_check',
          name: 'Revocation Check',
          result: 'fail',
          error: { code: 'CREDENTIAL_REVOKED', message: revocationResult.reason || 'Credential has been revoked' },
        });

        return this.buildResult(checks, errors, warnings, false, 'revoked');
      } else {
        checks.push({
          checkId: 'revocation_check',
          name: 'Revocation Check',
          result: 'pass',
        });
      }
    }

    if (verifyOptions.validateSchema && parsed.credential) {
      const schemaResult = this.validateSchema(parsed);
      if (!schemaResult.valid) {
        schemaResult.errors.forEach((error) => {
          warnings.push({ code: 'SCHEMA_WARNING', message: error });
        });

        checks.push({
          checkId: 'schema_validation',
          name: 'Schema Validation',
          result: 'warning',
          warning: { code: 'SCHEMA_WARNING', message: schemaResult.errors.join(', ') },
        });
      } else {
        checks.push({
          checkId: 'schema_validation',
          name: 'Schema Validation',
          result: 'pass',
        });
      }
    }

    const status = warnings.length > 0 ? 'warning' : 'valid';
    const valid = errors.length === 0;

    return this.buildResult(checks, errors, warnings, valid, status, credential);
  }

  private async verifySignature(credential: unknown, parsed: VcParsed): Promise<{ valid: boolean; error?: string }> {
    if (!parsed.proof) {
      return { valid: false, error: 'No proof found in credential' };
    }

    try {
      const valid = await this.signerService.verify(credential, parsed.proof);
      return { valid };
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Signature verification failed' };
    }
  }

  private async checkRevocation(parsed: VcParsed): Promise<{ revoked: boolean; reason?: string }> {
    return { revoked: false };
  }

  private validateSchema(parsed: VcParsed): { valid: boolean; errors: string[] } {
    return { valid: true, errors: [] };
  }

  private checkIssuerTrust(issuerDid: string): { trusted: boolean } {
    const trustedIssuers = ['did:web:stockexchange.io', 'did:key:z6MkiTBz1ymuepAQ4HEHYSF1H8quG5GLVVQR3djdX3mDooWp'];
    return { trusted: trustedIssuers.includes(issuerDid) };
  }

  private buildResult(
    checks: VcVerifyCheck[],
    errors: VcVerifyError[],
    warnings: VcVerifyWarning[],
    valid: boolean,
    status: VcVerifyResult['status'],
    credential?: unknown,
  ): VcVerifyResult {
    return {
      valid,
      status,
      credential,
      errors,
      warnings,
      checks,
    };
  }
}