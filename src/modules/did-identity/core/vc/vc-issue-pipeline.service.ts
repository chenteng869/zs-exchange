import type { VcIssuePipelineInput, VcIssuePipelinePrepared, VcIssuePipelineResult, VcTemplate, VcIssuerInfo } from './vc-issue.types';
import { VcTemplateService } from './vc-template.service';
import { VcCredentialBuilderService } from './vc-credential-builder.service';
import { VcSignerService } from './vc-signer.service';
import { VcHashService } from './vc-hash.service';
import { VcIssueAuditService } from './vc-issue-audit.service';
import { TemplateNotFoundError, InvalidClaimError, MissingRequiredClaimError, InvalidIssuerError, InvalidSubjectError, SchemaValidationError, SigningError, StorageError } from './vc-issue.errors';

export class VcIssuePipelineService {
  constructor(
    private readonly templateService: VcTemplateService = new VcTemplateService(),
    private readonly credentialBuilder: VcCredentialBuilderService = new VcCredentialBuilderService(),
    private readonly signerService: VcSignerService = new VcSignerService(),
    private readonly hashService: VcHashService = new VcHashService(),
    private readonly auditService: VcIssueAuditService = new VcIssueAuditService(),
  ) {}

  async prepare(input: VcIssuePipelineInput): Promise<VcIssuePipelinePrepared> {
    const { input: issueInput, actorDid } = input;

    const template = await this.templateService.getTemplate(issueInput.templateId);

    const claimErrors = this.credentialBuilder.validateClaims(issueInput.claims, template);
    if (claimErrors.length > 0) {
      const missingClaims = claimErrors.filter((e) => e.startsWith('Missing required claim'));
      const invalidClaims = claimErrors.filter((e) => !e.startsWith('Missing required claim'));

      if (missingClaims.length > 0) {
        throw new MissingRequiredClaimError(missingClaims[0].replace('Missing required claim: ', ''));
      }
      if (invalidClaims.length > 0) {
        throw new InvalidClaimError('', invalidClaims.join(', '));
      }
    }

    const issuerInfo: VcIssuerInfo = {
      did: issueInput.issuerDid,
      name: 'Stock Exchange',
      url: 'https://stockexchange.io',
    };

    const credential = this.credentialBuilder.build(
      template,
      issuerInfo,
      issueInput.subjectDid,
      issueInput.claims,
      {
        expirationDate: issueInput.expirationDate,
        credentialSchema: issueInput.credentialSchema,
      },
    );

    if (issueInput.credentialSchema) {
      const schemaErrors = this.credentialBuilder.validateSchema(credential, issueInput.credentialSchema);
      if (schemaErrors.length > 0) {
        throw new SchemaValidationError(schemaErrors.join(', '));
      }
    }

    return {
      input: issueInput,
      credential,
      template,
      issuerInfo,
    };
  }

  async issue(input: VcIssuePipelineInput): Promise<VcIssuePipelineResult> {
    try {
      const prepared = await this.prepare(input);

      const { credential, template, issuerInfo } = prepared;
      const { options } = input.input;

      let signedCredential = credential;
      let proof = credential.proof;

      if (!options || options.sign !== false) {
        const signingResult = await this.signerService.sign({
          credential: credential,
          privateKey: '0x' + '0'.repeat(64),
          algorithm: this.signerService.getAlgorithmForProofType('EcdsaSecp256k1Signature2019'),
          proofType: 'EcdsaSecp256k1Signature2019',
          verificationMethod: `${issuerInfo.did}#key-1`,
          issuerDid: issuerInfo.did,
        });

        if (!signingResult.success) {
          throw new SigningError(signingResult.error || 'Signing failed');
        }

        signedCredential = signingResult.signedCredential as typeof credential;
        proof = signingResult.proof;
      }

      const auditRecord = await this.auditService.createAuditRecord({
        credentialId: signedCredential.id,
        issuerDid: input.input.issuerDid,
        subjectDid: input.input.subjectDid,
        actorDid: input.actorDid,
        templateId: input.input.templateId,
        format: input.input.format || template.format,
        status: 'issued',
        details: {
          claims: input.input.claims,
          hasProof: !!proof,
        },
      });

      return {
        success: true,
        credential: signedCredential,
        credentialId: signedCredential.id,
        proof,
        auditId: auditRecord.auditId,
      };
    } catch (error) {
      let errorMessage = 'VC issuance failed';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async validateIssuer(issuerDid: string): Promise<boolean> {
    const trustedIssuers = ['did:web:stockexchange.io', 'did:key:z6MkiTBz1ymuepAQ4HEHYSF1H8quG5GLVVQR3djdX3mDooWp'];
    return trustedIssuers.includes(issuerDid);
  }

  async validateSubject(subjectDid: string): Promise<boolean> {
    const didRegex = /^did:([a-zA-Z0-9]+):(.+)$/;
    return didRegex.test(subjectDid);
  }
}