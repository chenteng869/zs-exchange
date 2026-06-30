export class DomainUrlUtils {
  static normalize(domain: string): string {
    let result = domain.toLowerCase().trim();
    
    result = result.replace(/^https?:\/\//, '');
    result = result.replace(/\/$/, '');
    
    return result;
  }

  static toDidWeb(domain: string): string {
    const normalized = this.normalize(domain);
    return `did:web:${normalized}`;
  }

  static fromDidWeb(did: string): string {
    if (!did.startsWith('did:web:')) {
      throw new Error('Invalid did:web format');
    }

    return did.slice(8);
  }

  static isValidDomain(domain: string): boolean {
    const normalized = this.normalize(domain);
    
    if (!normalized) {
      return false;
    }

    const domainPattern = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return domainPattern.test(normalized);
  }

  static isValidDomainOrIP(domain: string): boolean {
    const normalized = this.normalize(domain);
    
    if (!normalized) {
      return false;
    }

    if (this.isValidDomain(normalized)) {
      return true;
    }

    const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipPattern.test(normalized);
  }

  static getDidDocumentUrl(domain: string): string {
    const normalized = this.normalize(domain);
    return `https://${normalized}/.well-known/did.json`;
  }

  static getOrigin(domain: string): string {
    const normalized = this.normalize(domain);
    return `https://${normalized}`;
  }

  static isSubdomain(subdomain: string, parentDomain: string): boolean {
    const normalizedSub = this.normalize(subdomain);
    const normalizedParent = this.normalize(parentDomain);

    if (normalizedSub === normalizedParent) {
      return false;
    }

    return normalizedSub.endsWith(`.${normalizedParent}`);
  }

  static getParentDomain(domain: string): string | null {
    const normalized = this.normalize(domain);
    const parts = normalized.split('.');

    if (parts.length <= 2) {
      return null;
    }

    return parts.slice(-2).join('.');
  }

  static extractProtocol(domain: string): string | null {
    const match = domain.match(/^(https?:)/i);
    return match ? match[1].toLowerCase() : null;
  }

  static ensureHttps(domain: string): string {
    const normalized = this.normalize(domain);
    return `https://${normalized}`;
  }

  static addPath(domain: string, path: string): string {
    const origin = this.ensureHttps(domain);
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${origin}${normalizedPath}`;
  }

  static isValidTld(tld: string): boolean {
    const tldPattern = /^[a-zA-Z]{2,}$/;
    return tldPattern.test(tld);
  }

  static getTld(domain: string): string | null {
    const normalized = this.normalize(domain);
    const parts = normalized.split('.');
    
    if (parts.length === 0) {
      return null;
    }

    return parts[parts.length - 1];
  }
}