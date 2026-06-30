import type { PhishingType, UrlRiskInfo } from './security.types';
import { KNOWN_SAFE_DOMAINS, SUSPICIOUS_TLDS } from './default-security-rules';

export class PhishingDetectorService {
  private safeDomains = new Set(KNOWN_SAFE_DOMAINS);

  async detect(url: string): Promise<{ phishing: boolean; type?: PhishingType; details?: string; similarDomains?: string[] }> {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      const exactMatch = await this.checkExactMatch(hostname);
      if (exactMatch) return exactMatch;

      const similarDomain = await this.checkSimilarDomain(hostname);
      if (similarDomain) return similarDomain;

      const typosquatting = await this.checkTyposquatting(hostname);
      if (typosquatting) return typosquatting;

      const subdomain = await this.checkSubdomain(hostname);
      if (subdomain) return subdomain;

      const suspiciousTld = await this.checkSuspiciousTld(hostname);
      if (suspiciousTld) return suspiciousTld;

      return { phishing: false };
    } catch {
      return { phishing: false };
    }
  }

  private async checkExactMatch(hostname: string): Promise<{ phishing: boolean; type: PhishingType; details: string } | null> {
    if (this.safeDomains.has(hostname)) {
      return null;
    }
    return null;
  }

  private async checkSimilarDomain(hostname: string): Promise<{ phishing: boolean; type: PhishingType; details: string; similarDomains?: string[] } | null> {
    const similarDomains: string[] = [];
    for (const safeDomain of this.safeDomains) {
      const distance = this.calculateLevenshteinDistance(hostname, safeDomain);
      if (distance <= 2 && distance > 0) {
        similarDomains.push(safeDomain);
      }
    }
    if (similarDomains.length > 0) {
      return {
        phishing: true,
        type: 'similar_domain',
        details: `Domain is similar to: ${similarDomains.join(', ')}`,
        similarDomains,
      };
    }
    return null;
  }

  private async checkTyposquatting(hostname: string): Promise<{ phishing: boolean; type: PhishingType; details: string } | null> {
    const typosquatPatterns = [
      /(coinbase|binance|metamask|ethereum|uniswap|opensea|trustwallet)[0-9]/i,
      /(coinbase|binance|metamask|ethereum|uniswap|opensea|trustwallet)-(com|io|org)/i,
      /(coinbase|binance|metamask|ethereum|uniswap|opensea|trustwallet)\.(com|io|org)/i,
    ];
    for (const pattern of typosquatPatterns) {
      if (pattern.test(hostname)) {
        return {
          phishing: true,
          type: 'typosquatting',
          details: 'Domain appears to be a typosquat of a well-known service',
        };
      }
    }
    return null;
  }

  private async checkSubdomain(hostname: string): Promise<{ phishing: boolean; type: PhishingType; details: string } | null> {
    const parts = hostname.split('.');
    if (parts.length > 2) {
      const subdomain = parts[0].toLowerCase();
      if (subdomain.includes('login') || subdomain.includes('auth') || subdomain.includes('verify')) {
        for (const safeDomain of this.safeDomains) {
          if (hostname.endsWith(`.${safeDomain}`)) {
            return {
              phishing: true,
              type: 'subdomain',
              details: `Suspicious subdomain "${subdomain}" on legitimate domain`,
            };
          }
        }
      }
    }
    return null;
  }

  private async checkSuspiciousTld(hostname: string): Promise<{ phishing: boolean; type: PhishingType; details: string } | null> {
    const tld = hostname.split('.').pop()?.toLowerCase();
    if (tld && SUSPICIOUS_TLDS.includes(tld)) {
      for (const safeDomain of this.safeDomains) {
        if (hostname.includes(safeDomain.split('.')[0])) {
          return {
            phishing: true,
            type: 'suspicious_tld',
            details: `Domain uses suspicious TLD ".${tld}" with legitimate brand name`,
          };
        }
      }
    }
    return null;
  }

  private calculateLevenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  async getUrlRiskInfo(url: string): Promise<UrlRiskInfo> {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      const detection = await this.detect(url);
      const isLocalhost = hostname === 'localhost' || hostname.startsWith('127.0.0.1') || hostname.startsWith('0.0.0.0');
      const isIPAddress = /^\d+\.\d+\.\d+\.\d+$/.test(hostname);
      const tld = hostname.split('.').pop()?.toLowerCase();
      const whitelisted = this.safeDomains.has(hostname);

      return {
        url,
        origin: `${urlObj.protocol}//${urlObj.host}`,
        hostname,
        protocol: urlObj.protocol,
        pathname: urlObj.pathname,
        search: urlObj.search,
        hash: urlObj.hash,
        isHttps: urlObj.protocol === 'https:',
        isLocalhost,
        isIPAddress,
        port: urlObj.port ? parseInt(urlObj.port) : undefined,
        riskLevel: detection.phishing ? 'block' : whitelisted ? 'pass' : isIPAddress ? 'warning' : SUSPICIOUS_TLDS.includes(tld || '') ? 'warning' : 'pass',
        phishingType: detection.type,
        similarDomains: detection.similarDomains,
        blacklisted: detection.phishing,
        whitelisted,
      };
    } catch {
      return {
        url,
        origin: '',
        hostname: '',
        protocol: '',
        pathname: '',
        search: '',
        hash: '',
        isHttps: false,
        isLocalhost: false,
        isIPAddress: false,
        riskLevel: 'unknown',
      };
    }
  }

  addSafeDomain(domain: string): void {
    this.safeDomains.add(domain.toLowerCase());
  }

  removeSafeDomain(domain: string): void {
    this.safeDomains.delete(domain.toLowerCase());
  }
}
