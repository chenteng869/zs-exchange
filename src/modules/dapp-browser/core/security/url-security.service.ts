import type { UrlRiskInfo, SecurityCheck, SecurityCheckResult } from './security.types';
import { DomainBlacklistService } from './domain-blacklist.service';
import { PhishingDetectorService } from './phishing-detector.service';
import { HomographDetectorService } from './homograph-detector.service';
import { SecurityRuleStorageService } from './security-rule-storage.service';
import { DEFAULT_SECURITY_RULES } from './default-security-rules';

export interface UrlSecurityInput {
  url: string;
  origin?: string;
  userId?: string;
}

export interface UrlSecurityResult {
  riskLevel: SecurityCheckResult;
  urlInfo: UrlRiskInfo;
  checks: SecurityCheck[];
  warnings: { title: string; message: string }[];
  allowed: boolean;
}

export class UrlSecurityService {
  constructor(
    private readonly domainBlacklist: DomainBlacklistService = new DomainBlacklistService(),
    private readonly phishingDetector: PhishingDetectorService = new PhishingDetectorService(),
    private readonly homographDetector: HomographDetectorService = new HomographDetectorService(),
    private readonly ruleStorage: SecurityRuleStorageService = new SecurityRuleStorageService(),
  ) {
    this.initDefaultRules();
  }

  private initDefaultRules(): void {
    DEFAULT_SECURITY_RULES.forEach((rule) => {
      this.ruleStorage.save(rule);
    });
  }

  async check(input: UrlSecurityInput): Promise<UrlSecurityResult> {
    const { url } = input;
    const checks: SecurityCheck[] = [];
    const warnings: { title: string; message: string }[] = [];

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      const urlInfo = await this.phishingDetector.getUrlRiskInfo(url);
      checks.push({
        checkId: 'url_parse',
        type: 'url',
        result: 'pass',
        timestamp: Date.now(),
      });

      const protocolCheck = await this.checkProtocol(urlObj.protocol, hostname);
      checks.push(protocolCheck.check);
      if (protocolCheck.warning) warnings.push(protocolCheck.warning);

      const localhostCheck = await this.checkLocalhost(hostname);
      checks.push(localhostCheck.check);

      const ipCheck = await this.checkIPAddress(hostname);
      checks.push(ipCheck.check);
      if (ipCheck.warning) warnings.push(ipCheck.warning);

      const blacklistCheck = await this.checkDomainBlacklist(hostname);
      checks.push(blacklistCheck.check);
      if (blacklistCheck.warning) warnings.push(blacklistCheck.warning);

      const phishingCheck = await this.checkPhishing(url);
      checks.push(phishingCheck.check);
      if (phishingCheck.warning) warnings.push(phishingCheck.warning);

      const homographCheck = await this.checkHomograph(hostname);
      checks.push(homographCheck.check);
      if (homographCheck.warning) warnings.push(homographCheck.warning);

      const ruleCheck = await this.checkSecurityRules(url);
      ruleCheck.forEach((r) => checks.push(r.check));
      ruleCheck.forEach((r) => {
        if (r.warning) warnings.push(r.warning);
      });

      const riskLevel = this.calculateRiskLevel(checks);
      const allowed = riskLevel !== 'block';

      return {
        riskLevel,
        urlInfo,
        checks,
        warnings,
        allowed,
      };
    } catch (error) {
      return {
        riskLevel: 'unknown',
        urlInfo: {
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
        },
        checks: [],
        warnings: [{ title: 'Invalid URL', message: 'Could not parse the URL' }],
        allowed: false,
      };
    }
  }

  private async checkProtocol(protocol: string, hostname: string): Promise<{ check: SecurityCheck; warning?: { title: string; message: string } }> {
    if (protocol !== 'https:' && !hostname.startsWith('localhost') && !hostname.startsWith('127.0.0.1')) {
      return {
        check: {
          checkId: 'protocol_https',
          type: 'url',
          result: 'block',
          timestamp: Date.now(),
        },
        warning: { title: 'Insecure Connection', message: 'This website uses HTTP instead of HTTPS, which may be insecure.' },
      };
    }
    return {
      check: {
        checkId: 'protocol_https',
        type: 'url',
        result: 'pass',
        timestamp: Date.now(),
      },
    };
  }

  private async checkLocalhost(hostname: string): Promise<{ check: SecurityCheck }> {
    const isLocalhost = hostname === 'localhost' || hostname.startsWith('127.0.0.1') || hostname.startsWith('0.0.0.0');
    return {
      check: {
        checkId: 'localhost_check',
        type: 'url',
        result: isLocalhost ? 'pass' : 'pass',
        timestamp: Date.now(),
      },
    };
  }

  private async checkIPAddress(hostname: string): Promise<{ check: SecurityCheck; warning?: { title: string; message: string } }> {
    const isIPAddress = /^\d+\.\d+\.\d+\.\d+$/.test(hostname);
    if (isIPAddress) {
      return {
        check: {
          checkId: 'ip_address_check',
          type: 'url',
          result: 'warning',
          timestamp: Date.now(),
        },
        warning: { title: 'IP Address Access', message: 'You are accessing a direct IP address. This may be a security risk.' },
      };
    }
    return {
      check: {
        checkId: 'ip_address_check',
        type: 'url',
        result: 'pass',
        timestamp: Date.now(),
      },
    };
  }

  private async checkDomainBlacklist(hostname: string): Promise<{ check: SecurityCheck; warning?: { title: string; message: string } }> {
    const { blocked, entry } = await this.domainBlacklist.isBlocked(hostname);
    if (blocked && entry) {
      return {
        check: {
          checkId: 'domain_blacklist',
          type: 'domain',
          result: 'block',
          details: { reason: entry.reason, severity: entry.severity },
          timestamp: Date.now(),
        },
        warning: { title: 'Blocked Website', message: `This website is blocked: ${entry.reason}` },
      };
    }
    return {
      check: {
        checkId: 'domain_blacklist',
        type: 'domain',
        result: 'pass',
        timestamp: Date.now(),
      },
    };
  }

  private async checkPhishing(url: string): Promise<{ check: SecurityCheck; warning?: { title: string; message: string } }> {
    const detection = await this.phishingDetector.detect(url);
    if (detection.phishing) {
      return {
        check: {
          checkId: 'phishing_detection',
          type: 'domain',
          result: 'block',
          details: { type: detection.type, details: detection.details },
          timestamp: Date.now(),
        },
        warning: { title: 'Phishing Warning', message: detection.details || 'This website may be a phishing scam.' },
      };
    }
    return {
      check: {
        checkId: 'phishing_detection',
        type: 'domain',
        result: 'pass',
        timestamp: Date.now(),
      },
    };
  }

  private async checkHomograph(hostname: string): Promise<{ check: SecurityCheck; warning?: { title: string; message: string } }> {
    const detection = await this.homographDetector.detect(hostname);
    if (detection.suspicious) {
      return {
        check: {
          checkId: 'homograph_detection',
          type: 'domain',
          result: 'block',
          details: { chars: detection.homographChars },
          timestamp: Date.now(),
        },
        warning: { title: 'Homograph Attack', message: 'This website may be using deceptive characters to impersonate a legitimate site.' },
      };
    }
    return {
      check: {
        checkId: 'homograph_detection',
        type: 'domain',
        result: 'pass',
        timestamp: Date.now(),
      },
    };
  }

  private async checkSecurityRules(url: string): Promise<{ check: SecurityCheck; warning?: { title: string; message: string } }[]> {
    const urlRules = await this.ruleStorage.findByType('url');
    const domainRules = await this.ruleStorage.findByType('domain');
    const results: { check: SecurityCheck; warning?: { title: string; message: string } }[] = [];

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      for (const rule of [...urlRules, ...domainRules]) {
        const regex = new RegExp(rule.pattern, 'i');
        const matches = regex.test(url) || regex.test(hostname);

        if (matches) {
          const check: SecurityCheck = {
            checkId: rule.ruleId,
            type: rule.type,
            result: rule.action === 'block' ? 'block' : rule.action === 'warn' ? 'warning' : 'pass',
            details: { ruleName: rule.name, ruleDescription: rule.description },
            timestamp: Date.now(),
          };

          const result: { check: SecurityCheck; warning?: { title: string; message: string } } = { check };

          if (rule.action === 'warn') {
            result.warning = {
              title: rule.name,
              message: rule.description || 'This action may be risky.',
            };
          }

          results.push(result);
        }
      }
    } catch {
      // Ignore regex errors
    }

    return results;
  }

  private calculateRiskLevel(checks: SecurityCheck[]): SecurityCheckResult {
    if (checks.some((c) => c.result === 'block')) {
      return 'block';
    }
    if (checks.some((c) => c.result === 'warning')) {
      return 'warning';
    }
    return 'pass';
  }
}