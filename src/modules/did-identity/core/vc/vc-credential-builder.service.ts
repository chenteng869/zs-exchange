import type { VcCredential, VcIssuerInfo, VcSubject, VcCredentialSchema, VcTemplate } from './vc-issue.types';
import { VcHashService } from './vc-hash.service';
import { SchemaValidationError } from './vc-issue.errors';

export class VcCredentialBuilderService {
  constructor(private readonly hashService: VcHashService = new VcHashService()) {}

  build(
    template: VcTemplate,
    issuerInfo: VcIssuerInfo,
    subjectId: string,
    claims: Record<string, unknown>,
    options?: {
      expirationDate?: string;
      credentialSchema?: VcCredentialSchema;
    },
  ): VcCredential {
    const credentialId = this.hashService.generateCredentialId();
    const issuanceDate = new Date().toISOString();

    const credentialSubject: VcSubject = {
      id: subjectId,
      ...claims,
    };

    const credential: VcCredential = {
      id: credentialId,
      type: ['VerifiableCredential', template.type],
      issuer: issuerInfo,
      issuanceDate,
      credentialSubject,
    };

    if (options?.expirationDate) {
      credential.expirationDate = options.expirationDate;
    } else if (template.defaultExpirationDays) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + template.defaultExpirationDays);
      credential.expirationDate = expirationDate.toISOString();
    }

    if (options?.credentialSchema) {
      credential.credentialSchema = options.credentialSchema;
    }

    credential.status = 'issued';

    return credential;
  }

  buildJwtPayload(credential: VcCredential, issuerDid: string): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      iss: issuerDid,
      sub: typeof credential.credentialSubject.id === 'string' ? credential.credentialSubject.id : '',
      iat: Math.floor(new Date(credential.issuanceDate).getTime() / 1000),
      jti: credential.id,
      vc: credential,
    };

    if (credential.expirationDate) {
      payload.exp = Math.floor(new Date(credential.expirationDate).getTime() / 1000);
    }

    return payload;
  }

  validateClaims(claims: Record<string, unknown>, template: VcTemplate): string[] {
    const errors: string[] = [];

    for (const requiredClaim of template.requiredClaims) {
      if (!(requiredClaim in claims)) {
        errors.push(`Missing required claim: ${requiredClaim}`);
      }
    }

    for (const claim of template.claims) {
      const value = claims[claim.name];

      if (value === undefined) {
        if (claim.required) {
          errors.push(`Missing required claim: ${claim.name}`);
        }
        continue;
      }

      if (claim.validation) {
        if (claim.validation.min !== undefined && typeof value === 'number' && value < claim.validation.min) {
          errors.push(`Claim ${claim.name} must be at least ${claim.validation.min}`);
        }

        if (claim.validation.max !== undefined && typeof value === 'number' && value > claim.validation.max) {
          errors.push(`Claim ${claim.name} must be at most ${claim.validation.max}`);
        }

        if (claim.validation.pattern && typeof value === 'string' && !new RegExp(claim.validation.pattern).test(value)) {
          errors.push(`Claim ${claim.name} does not match pattern: ${claim.validation.pattern}`);
        }

        if (claim.validation.enum && !claim.validation.enum.includes(String(value))) {
          errors.push(`Claim ${claim.name} must be one of: ${claim.validation.enum.join(', ')}`);
        }
      }
    }

    return errors;
  }

  validateSchema(credential: VcCredential, schema?: VcCredentialSchema): string[] {
    const errors: string[] = [];

    if (!schema) {
      return errors;
    }

    const subject = credential.credentialSubject;

    if (schema.required) {
      for (const requiredProperty of schema.required) {
        if (!(requiredProperty in subject)) {
          errors.push(`Missing required property in subject: ${requiredProperty}`);
        }
      }
    }

    if (schema.properties) {
      for (const [propertyName, propertySchema] of Object.entries(schema.properties)) {
        const value = subject[propertyName];
        if (value !== undefined) {
          const propertyType = (propertySchema as Record<string, unknown>).type;
          if (propertyType && typeof value !== propertyType) {
            errors.push(`Property ${propertyName} has incorrect type: expected ${propertyType}, got ${typeof value}`);
          }
        }
      }
    }

    return errors;
  }
}