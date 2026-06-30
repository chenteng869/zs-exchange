import type { VcIssueInput, VcIssuePipelineResult, VcCredential, VcTemplate } from './vc-issue.types';
import { VcIssuePipelineService } from './vc-issue-pipeline.service';
import { VcTemplateService } from './vc-template.service';
import { VcIssueAuditService } from './vc-issue-audit.service';
import { TemplateNotFoundError, InvalidIssuerError, InvalidSubjectError, IssuerNotTrustedError } from './vc-issue.errors';

export class VcIssuerService {
  constructor(
    private readonly pipelineService: VcIssuePipelineService = new VcIssuePipelineService(),
    private readonly templateService: VcTemplateService = new VcTemplateService(),
    private readonly auditService: VcIssueAuditService = new VcIssueAuditService(),
  ) {}

  async issue(input: VcIssueInput, actorDid: string = input.issuerDid): Promise<VcIssuePipelineResult> {
    const template = await this.templateService.getTemplate(input.templateId);

    const isIssuerValid = await this.pipelineService.validateIssuer(input.issuerDid);
    if (!isIssuerValid) {
      throw new IssuerNotTrustedError(input.issuerDid);
    }

    const isSubjectValid = await this.pipelineService.validateSubject(input.subjectDid);
    if (!isSubjectValid) {
      throw new InvalidSubjectError(input.subjectDid, 'Invalid DID format');
    }

    const result = await this.pipelineService.issue({
      input,
      actorDid,
    });

    return result;
  }

  async prepare(input: VcIssueInput, actorDid: string = input.issuerDid) {
    return this.pipelineService.prepare({
      input,
      actorDid,
    });
  }

  async getTemplate(templateId: string): Promise<VcTemplate> {
    return this.templateService.getTemplate(templateId);
  }

  async getAllTemplates(): Promise<VcTemplate[]> {
    return this.templateService.getAllTemplates();
  }

  async registerTemplate(template: Omit<VcTemplate, 'templateId' | 'createdAt' | 'updatedAt'>): Promise<VcTemplate> {
    return this.templateService.createTemplate(template);
  }

  async revokeCredential(credentialId: string, actorDid: string): Promise<VcIssuePipelineResult> {
    const auditRecords = await this.auditService.getAuditRecordsByCredentialId(credentialId);
    if (auditRecords.length === 0) {
      return { success: false, error: 'Credential not found' };
    }

    const lastRecord = auditRecords[auditRecords.length - 1];

    await this.auditService.createAuditRecord({
      credentialId,
      issuerDid: lastRecord.issuerDid,
      subjectDid: lastRecord.subjectDid,
      actorDid,
      templateId: lastRecord.templateId,
      format: lastRecord.format,
      status: 'revoked',
      details: {
        reason: 'Revoked by request',
      },
    });

    return {
      success: true,
      credentialId,
    };
  }

  async getCredentialAudit(credentialId: string) {
    return this.auditService.getAuditRecordsByCredentialId(credentialId);
  }
}