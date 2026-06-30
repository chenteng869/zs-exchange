import { describe, it, beforeEach, expect, vi } from 'vitest';
import { VcIssuerService } from '../src/modules/did-identity/core/vc/vc-issuer.service';
import { VcIssuePipelineService } from '../src/modules/did-identity/core/vc/vc-issue-pipeline.service';
import { VcTemplateService } from '../src/modules/did-identity/core/vc/vc-template.service';
import { VcIssueAuditService } from '../src/modules/did-identity/core/vc/vc-issue-audit.service';
import { VcCredentialBuilderService } from '../src/modules/did-identity/core/vc/vc-credential-builder.service';
import { VcSignerService } from '../src/modules/did-identity/core/vc/vc-signer.service';
import { VcHashService } from '../src/modules/did-identity/core/vc/vc-hash.service';
import { TemplateNotFoundError, IssuerNotTrustedError } from '../src/modules/did-identity/core/vc/vc-issue.errors';

const TRUSTED_ISSUER = 'did:web:stockexchange.io';

describe('VC Issuance Service', () => {
  let issuerService: VcIssuerService;
  let pipelineService: VcIssuePipelineService;
  let templateService: VcTemplateService;
  let auditService: VcIssueAuditService;

  beforeEach(() => {
    templateService = new VcTemplateService();
    auditService = new VcIssueAuditService();
    const credentialBuilder = new VcCredentialBuilderService();
    pipelineService = new VcIssuePipelineService(templateService, credentialBuilder, new VcSignerService(), new VcHashService(), auditService);
    issuerService = new VcIssuerService(pipelineService, templateService, auditService);
  });

  describe('VcTemplateService', () => {
    it('createTemplate creates a new template', async () => {
      const template = await templateService.createTemplate({
        name: 'Test Template',
        description: 'A test template',
        type: 'test-exchange',
        schemaId: 'https://example.com/schema/test',
        format: 'jwt',
        claims: [
          { name: 'userId', type: 'string', required: true },
          { name: 'level', type: 'string', required: true },
        ],
        requiredClaims: ['userId', 'level'],
        optionalClaims: [],
        defaultExpirationDays: 365,
      });

      expect(template.templateId).toBe('test-exchange');
      expect(template.name).toBe('Test Template');
      expect(template.type).toBe('test-exchange');
      expect(template.format).toBe('jwt');
      expect(template.createdAt).toBeDefined();
    });

    it('getTemplate returns existing template', async () => {
      const template = await templateService.createTemplate({
        name: 'Test Template',
        description: 'A test template',
        type: 'test-template',
        schemaId: 'https://example.com/schema/test',
        format: 'jwt',
        claims: [{ name: 'userId', type: 'string', required: true }],
        requiredClaims: ['userId'],
        optionalClaims: [],
      });

      const retrieved = await templateService.getTemplate(template.templateId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Test Template');
      expect(retrieved?.templateId).toBe(template.templateId);
    });

    it('getTemplate throws error for non-existent template', async () => {
      await expect(templateService.getTemplate('non-existent')).rejects.toThrow(TemplateNotFoundError);
    });

    it('getAllTemplates returns all templates', async () => {
      await templateService.createTemplate({
        name: 'Template 1',
        type: 'template-1',
        schemaId: 'https://example.com/schema/1',
        format: 'jwt',
        claims: [{ name: 'userId', type: 'string', required: true }],
        requiredClaims: ['userId'],
        optionalClaims: [],
      });

      await templateService.createTemplate({
        name: 'Template 2',
        type: 'template-2',
        schemaId: 'https://example.com/schema/2',
        format: 'jsonld',
        claims: [{ name: 'entityId', type: 'string', required: true }],
        requiredClaims: ['entityId'],
        optionalClaims: [],
      });

      const templates = await templateService.getAllTemplates();

      expect(templates.length).toBeGreaterThanOrEqual(2);
    });

    it('findTemplatesByType returns templates of specified type', async () => {
      await templateService.createTemplate({
        name: 'Exchange Template',
        type: 'exchange-type',
        schemaId: 'https://example.com/schema/exchange',
        format: 'jwt',
        claims: [{ name: 'userId', type: 'string', required: true }],
        requiredClaims: ['userId'],
        optionalClaims: [],
      });

      await templateService.createTemplate({
        name: 'Financial Template',
        type: 'financial-type',
        schemaId: 'https://example.com/schema/financial',
        format: 'jsonld',
        claims: [{ name: 'entityId', type: 'string', required: true }],
        requiredClaims: ['entityId'],
        optionalClaims: [],
      });

      const exchangeTemplates = await templateService.findTemplatesByType('exchange-type');
      const financialTemplates = await templateService.findTemplatesByType('financial-type');

      expect(exchangeTemplates.length).toBe(1);
      expect(financialTemplates.length).toBe(1);
    });
  });

  describe('VcIssuerService', () => {
    it('issue creates a new credential', async () => {
      const template = await templateService.createTemplate({
        name: 'Exchange User Credential',
        type: 'exchange-user',
        schemaId: 'https://zs-exchange.com/schema/exchange-user',
        format: 'jwt',
        claims: [
          { name: 'userId', type: 'string', required: true },
          { name: 'level', type: 'string', required: true },
        ],
        requiredClaims: ['userId', 'level'],
        optionalClaims: [],
        defaultExpirationDays: 365,
      });

      const result = await issuerService.issue({
        templateId: template.templateId,
        issuerDid: TRUSTED_ISSUER,
        subjectDid: 'did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
        claims: {
          userId: 'user_001',
          level: 'VIP',
        },
        format: 'jwt',
        options: { includeProof: false, sign: false, store: false, anchorOnChain: false },
      });

      expect(result.success).toBe(true);
      expect(result.credentialId).toBeDefined();
      expect(result.credential).toBeDefined();
      expect(result.credential?.issuer).toBeDefined();
      expect(result.credential?.credentialSubject).toBeDefined();
    });

    it('issue throws error for non-existent template', async () => {
      await expect(issuerService.issue({
        templateId: 'non-existent',
        issuerDid: TRUSTED_ISSUER,
        subjectDid: 'did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
        claims: { userId: 'user_001' },
      })).rejects.toThrow(TemplateNotFoundError);
    });

    it('issue throws error for untrusted issuer', async () => {
      const template = await templateService.createTemplate({
        name: 'Test Template',
        type: 'test-untrusted',
        schemaId: 'https://example.com/schema/test',
        format: 'jwt',
        claims: [{ name: 'userId', type: 'string', required: true }],
        requiredClaims: ['userId'],
        optionalClaims: [],
      });

      await expect(issuerService.issue({
        templateId: template.templateId,
        issuerDid: 'did:web:untrusted.com',
        subjectDid: 'did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
        claims: { userId: 'user_001' },
      })).rejects.toThrow(IssuerNotTrustedError);
    });

    it('prepare returns prepared credential without issuing', async () => {
      const template = await templateService.createTemplate({
        name: 'Test Template',
        type: 'test-prepare',
        schemaId: 'https://example.com/schema/test',
        format: 'jwt',
        claims: [{ name: 'userId', type: 'string', required: true }],
        requiredClaims: ['userId'],
        optionalClaims: [],
      });

      const result = await issuerService.prepare({
        templateId: template.templateId,
        issuerDid: TRUSTED_ISSUER,
        subjectDid: 'did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
        claims: { userId: 'user_001' },
      });

      expect(result).toBeDefined();
      expect(result.input).toBeDefined();
      expect(result.credential).toBeDefined();
      expect(result.template).toBeDefined();
      expect(result.issuerInfo).toBeDefined();
    });

    it('getTemplate returns template via issuer service', async () => {
      const template = await templateService.createTemplate({
        name: 'Test Template',
        type: 'test-get',
        schemaId: 'https://example.com/schema/test',
        format: 'jwt',
        claims: [{ name: 'userId', type: 'string', required: true }],
        requiredClaims: ['userId'],
        optionalClaims: [],
      });

      const retrieved = await issuerService.getTemplate(template.templateId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.templateId).toBe(template.templateId);
    });

    it('registerTemplate registers a new template', async () => {
      const template = await issuerService.registerTemplate({
        name: 'New Template',
        type: 'gaming-new',
        schemaId: 'https://example.com/schema/gaming',
        format: 'jsonld',
        claims: [{ name: 'gameId', type: 'string', required: true }],
        requiredClaims: ['gameId'],
        optionalClaims: [],
      });

      expect(template.templateId).toBe('gaming-new');
      expect(template.name).toBe('New Template');
      expect(template.type).toBe('gaming-new');
    });
  });

  describe('VcIssueAuditService', () => {
    it('createAuditRecord creates an audit record', async () => {
      const record = await auditService.createAuditRecord({
        credentialId: 'vc-001',
        issuerDid: TRUSTED_ISSUER,
        subjectDid: 'did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
        actorDid: TRUSTED_ISSUER,
        templateId: 'template-001',
        format: 'jwt',
        status: 'issued',
        details: { reason: 'Test issuance' },
      });

      expect(record.auditId).toBeDefined();
      expect(record.credentialId).toBe('vc-001');
      expect(record.status).toBe('issued');
      expect(record.createdAt).toBeDefined();
    });

    it('getAuditRecordsByCredentialId returns records for credential', async () => {
      await auditService.createAuditRecord({
        credentialId: 'vc-001',
        issuerDid: TRUSTED_ISSUER,
        subjectDid: 'did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
        actorDid: TRUSTED_ISSUER,
        templateId: 'template-001',
        format: 'jwt',
        status: 'issued',
      });

      await auditService.createAuditRecord({
        credentialId: 'vc-001',
        issuerDid: TRUSTED_ISSUER,
        subjectDid: 'did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
        actorDid: TRUSTED_ISSUER,
        templateId: 'template-001',
        format: 'jwt',
        status: 'revoked',
      });

      const records = await auditService.getAuditRecordsByCredentialId('vc-001');

      expect(records.length).toBe(2);
      expect(records[0].status).toBe('issued');
      expect(records[1].status).toBe('revoked');
    });

    it('getCredentialAudit returns audit records', async () => {
      await auditService.createAuditRecord({
        credentialId: 'vc-002',
        issuerDid: TRUSTED_ISSUER,
        subjectDid: 'did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
        actorDid: TRUSTED_ISSUER,
        templateId: 'template-002',
        format: 'jsonld',
        status: 'issued',
      });

      const records = await issuerService.getCredentialAudit('vc-002');

      expect(records.length).toBe(1);
      expect(records[0].credentialId).toBe('vc-002');
    });
  });

  describe('VcIssuePipelineService', () => {
    it('validateIssuer returns true for trusted DID', async () => {
      const result = await pipelineService.validateIssuer(TRUSTED_ISSUER);

      expect(result).toBe(true);
    });

    it('validateIssuer returns false for untrusted DID', async () => {
      const result = await pipelineService.validateIssuer('did:web:untrusted.com');

      expect(result).toBe(false);
    });

    it('validateIssuer returns false for invalid DID', async () => {
      const result = await pipelineService.validateIssuer('invalid-did');

      expect(result).toBe(false);
    });

    it('validateSubject returns true for valid DID', async () => {
      const result = await pipelineService.validateSubject('did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB');

      expect(result).toBe(true);
    });

    it('validateSubject returns false for invalid DID', async () => {
      const result = await pipelineService.validateSubject('invalid-did');

      expect(result).toBe(false);
    });

    it('issue pipeline creates credential with proof', async () => {
      const template = await templateService.createTemplate({
        name: 'Test Pipeline Template',
        type: 'pipeline-test',
        schemaId: 'https://example.com/schema/pipeline',
        format: 'jwt',
        claims: [{ name: 'userId', type: 'string', required: true }],
        requiredClaims: ['userId'],
        optionalClaims: [],
      });

      const result = await pipelineService.issue({
        input: {
          templateId: template.templateId,
          issuerDid: TRUSTED_ISSUER,
          subjectDid: 'did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
          claims: { userId: 'user_001' },
          format: 'jwt',
          options: { includeProof: false, sign: false, store: false, anchorOnChain: false },
        },
        actorDid: TRUSTED_ISSUER,
      });

      expect(result.success).toBe(true);
      expect(result.credentialId).toBeDefined();
      expect(result.credential).toBeDefined();
    });
  });

  describe('VC Revocation', () => {
    it('revokeCredential revokes a credential', async () => {
      const template = await templateService.createTemplate({
        name: 'Revocable Template',
        type: 'revocable-test',
        schemaId: 'https://example.com/schema/revocable',
        format: 'jwt',
        claims: [{ name: 'userId', type: 'string', required: true }],
        requiredClaims: ['userId'],
        optionalClaims: [],
      });

      const issueResult = await issuerService.issue({
        templateId: template.templateId,
        issuerDid: TRUSTED_ISSUER,
        subjectDid: 'did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
        claims: { userId: 'user_001' },
        format: 'jwt',
        options: { includeProof: false, sign: false, store: false, anchorOnChain: false },
      });

      expect(issueResult.success).toBe(true);

      const revokeResult = await issuerService.revokeCredential(issueResult.credentialId!, TRUSTED_ISSUER);

      expect(revokeResult.success).toBe(true);

      const auditRecords = await issuerService.getCredentialAudit(issueResult.credentialId!);
      expect(auditRecords.length).toBe(2);
      expect(auditRecords[auditRecords.length - 1].status).toBe('revoked');
    });

    it('revokeCredential returns error for non-existent credential', async () => {
      const result = await issuerService.revokeCredential('non-existent', TRUSTED_ISSUER);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Credential not found');
    });
  });

  describe('VC Credential Builder', () => {
    it('build builds a valid credential', async () => {
      const builder = new VcCredentialBuilderService();

      const credential = builder.build(
        {
          templateId: 'template-001',
          name: 'Test Template',
          type: 'exchange',
          schemaId: 'https://example.com/schema/test',
          format: 'jwt',
          claims: [
            { name: 'userId', type: 'string', required: true },
            { name: 'level', type: 'string', required: true },
          ],
          requiredClaims: ['userId', 'level'],
          optionalClaims: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          did: TRUSTED_ISSUER,
          name: 'Stock Exchange',
          url: 'https://stockexchange.io',
        },
        'did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
        { userId: 'user_001', level: 'VIP' },
      );

      expect(credential.id).toBeDefined();
      expect(credential.type).toContain('VerifiableCredential');
      expect(credential.type).toContain('exchange');
      expect(credential.issuer).toBeDefined();
      expect(credential.credentialSubject).toBeDefined();
      expect(credential.credentialSubject.userId).toBe('user_001');
      expect(credential.credentialSubject.level).toBe('VIP');
      expect(credential.issuanceDate).toBeDefined();
      expect(credential.status).toBe('issued');
    });

    it('validateClaims returns errors for missing required claims', () => {
      const builder = new VcCredentialBuilderService();

      const errors = builder.validateClaims(
        { userId: 'user_001' },
        {
          templateId: 'template-001',
          name: 'Test Template',
          type: 'exchange',
          schemaId: 'https://example.com/schema/test',
          format: 'jwt',
          claims: [
            { name: 'userId', type: 'string', required: true },
            { name: 'level', type: 'string', required: true },
          ],
          requiredClaims: ['userId', 'level'],
          optionalClaims: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      );

      expect(errors.length).toBe(2);
      expect(errors.some(e => e.includes('level'))).toBe(true);
    });

    it('validateClaims returns empty array for valid claims', () => {
      const builder = new VcCredentialBuilderService();

      const errors = builder.validateClaims(
        { userId: 'user_001', level: 'VIP' },
        {
          templateId: 'template-001',
          name: 'Test Template',
          type: 'exchange',
          schemaId: 'https://example.com/schema/test',
          format: 'jwt',
          claims: [
            { name: 'userId', type: 'string', required: true },
            { name: 'level', type: 'string', required: true },
          ],
          requiredClaims: ['userId', 'level'],
          optionalClaims: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      );

      expect(errors.length).toBe(0);
    });
  });
});