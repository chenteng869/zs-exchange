import { Did, DidDocument, AuditEvent, AuditAction, AuditActorType } from '@/modules/did-identity/shared/types';

export class DidAuditService {
  private events: AuditEvent[] = [];

  async logAction(
    did: Did,
    action: AuditAction,
    actorId: string,
    actorType: AuditActorType,
    details?: Record<string, unknown>
  ): Promise<AuditEvent> {
    const event: AuditEvent = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      did,
      action,
      actorId,
      actorType,
      timestamp: new Date().toISOString(),
      details: details || {},
    };

    this.events.push(event);
    return event;
  }

  async logDidCreation(did: Did, actorId: string, actorType: AuditActorType): Promise<AuditEvent> {
    return this.logAction(did, 'did_created', actorId, actorType);
  }

  async logDidUpdate(
    did: Did,
    actorId: string,
    actorType: AuditActorType,
    changes: Record<string, unknown>
  ): Promise<AuditEvent> {
    return this.logAction(did, 'did_updated', actorId, actorType, { changes });
  }

  async logDidDeletion(did: Did, actorId: string, actorType: AuditActorType): Promise<AuditEvent> {
    return this.logAction(did, 'did_deleted', actorId, actorType);
  }

  async logKeyAdded(did: Did, keyId: string, actorId: string, actorType: AuditActorType): Promise<AuditEvent> {
    return this.logAction(did, 'key_added', actorId, actorType, { keyId });
  }

  async logKeyRevoked(did: Did, keyId: string, actorId: string, actorType: AuditActorType): Promise<AuditEvent> {
    return this.logAction(did, 'key_revoked', actorId, actorType, { keyId });
  }

  async logAnchor(did: Did, chainId: string, transactionHash: string, actorId: string): Promise<AuditEvent> {
    return this.logAction(did, 'did_anchored', actorId, 'system', { chainId, transactionHash });
  }

  async logCredentialIssued(did: Did, credentialId: string, issuerId: string): Promise<AuditEvent> {
    return this.logAction(did, 'credential_issued', issuerId, 'issuer', { credentialId });
  }

  async logCredentialRevoked(did: Did, credentialId: string, issuerId: string): Promise<AuditEvent> {
    return this.logAction(did, 'credential_revoked', issuerId, 'issuer', { credentialId });
  }

  async getAuditHistory(did: Did): Promise<AuditEvent[]> {
    return this.events.filter(e => e.did === did).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async getAuditHistoryByActor(actorId: string): Promise<AuditEvent[]> {
    return this.events.filter(e => e.actorId === actorId).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async getAuditHistoryByAction(action: AuditAction): Promise<AuditEvent[]> {
    return this.events.filter(e => e.action === action).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async getAuditHistoryByTimeRange(startTime: string, endTime: string): Promise<AuditEvent[]> {
    return this.events.filter(e => 
      e.timestamp >= startTime && e.timestamp <= endTime
    ).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async getRecentEvents(limit: number = 100): Promise<AuditEvent[]> {
    return [...this.events].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, limit);
  }

  async exportAuditLog(): Promise<string> {
    return JSON.stringify(this.events, null, 2);
  }

  async clearAuditLog(): Promise<void> {
    this.events = [];
  }

  async getStatistics(): Promise<{
    totalEvents: number;
    didCreated: number;
    didUpdated: number;
    didDeleted: number;
    keysAdded: number;
    keysRevoked: number;
    credentialsIssued: number;
    credentialsRevoked: number;
  }> {
    const counts = {
      totalEvents: this.events.length,
      didCreated: 0,
      didUpdated: 0,
      didDeleted: 0,
      keysAdded: 0,
      keysRevoked: 0,
      credentialsIssued: 0,
      credentialsRevoked: 0,
    };

    for (const event of this.events) {
      switch (event.action) {
        case 'did_created':
          counts.didCreated++;
          break;
        case 'did_updated':
          counts.didUpdated++;
          break;
        case 'did_deleted':
          counts.didDeleted++;
          break;
        case 'key_added':
          counts.keysAdded++;
          break;
        case 'key_revoked':
          counts.keysRevoked++;
          break;
        case 'credential_issued':
          counts.credentialsIssued++;
          break;
        case 'credential_revoked':
          counts.credentialsRevoked++;
          break;
      }
    }

    return counts;
  }
}