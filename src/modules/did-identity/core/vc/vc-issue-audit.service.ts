import type { VcIssueAuditRecord, VcIssueAuditRepository } from './vc-issue.types';

export class VcIssueAuditRepositoryImpl implements VcIssueAuditRepository {
  private storage = new Map<string, VcIssueAuditRecord>();

  async save(record: VcIssueAuditRecord): Promise<void> {
    this.storage.set(record.auditId, record);
  }

  async get(auditId: string): Promise<VcIssueAuditRecord | undefined> {
    return this.storage.get(auditId);
  }

  async findByCredentialId(credentialId: string): Promise<VcIssueAuditRecord[]> {
    return Array.from(this.storage.values()).filter((r) => r.credentialId === credentialId);
  }

  async findByActorDid(actorDid: string): Promise<VcIssueAuditRecord[]> {
    return Array.from(this.storage.values()).filter((r) => r.actorDid === actorDid);
  }

  async findByIssuerDid(issuerDid: string): Promise<VcIssueAuditRecord[]> {
    return Array.from(this.storage.values()).filter((r) => r.issuerDid === issuerDid);
  }

  async getAll(): Promise<VcIssueAuditRecord[]> {
    return Array.from(this.storage.values());
  }
}

export class VcIssueAuditService {
  constructor(private readonly auditRepository: VcIssueAuditRepository = new VcIssueAuditRepositoryImpl()) {}

  async createAuditRecord(input: Omit<VcIssueAuditRecord, 'auditId' | 'createdAt'>): Promise<VcIssueAuditRecord> {
    const record: VcIssueAuditRecord = {
      ...input,
      auditId: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: Date.now(),
    };

    await this.auditRepository.save(record);
    return record;
  }

  async getAuditRecord(auditId: string): Promise<VcIssueAuditRecord | undefined> {
    return this.auditRepository.get(auditId);
  }

  async getAuditRecordsByCredentialId(credentialId: string): Promise<VcIssueAuditRecord[]> {
    return this.auditRepository.findByCredentialId(credentialId);
  }

  async getAuditRecordsByActorDid(actorDid: string): Promise<VcIssueAuditRecord[]> {
    return this.auditRepository.findByActorDid(actorDid);
  }

  async getAuditRecordsByIssuerDid(issuerDid: string): Promise<VcIssueAuditRecord[]> {
    return this.auditRepository.findByIssuerDid(issuerDid);
  }

  async getAllAuditRecords(): Promise<VcIssueAuditRecord[]> {
    return this.auditRepository.getAll();
  }
}