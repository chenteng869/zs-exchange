import { VcTemplateService } from '../vc-template.service';
import { EXCHANGE_VC_TEMPLATES } from './exchange-vc-templates';
import { COMMERCE_VC_TEMPLATES } from './commerce-vc-templates';
import { GAMING_VC_TEMPLATES } from './gaming-vc-templates';
import { FINANCIAL_VC_TEMPLATES } from './financial-vc-templates';
import { SAMOA_ENTERPRISE_VC_TEMPLATES } from './samoa-enterprise-vc-templates';

export class RegisterDefaultVcTemplatesService {
  constructor(private readonly templateService: VcTemplateService = new VcTemplateService()) {}

  async registerAll(): Promise<void> {
    await this.registerExchangeTemplates();
    await this.registerCommerceTemplates();
    await this.registerGamingTemplates();
    await this.registerFinancialTemplates();
    await this.registerSamoaEnterpriseTemplates();
  }

  async registerExchangeTemplates(): Promise<void> {
    await this.templateService.registerTemplates(EXCHANGE_VC_TEMPLATES);
  }

  async registerCommerceTemplates(): Promise<void> {
    await this.templateService.registerTemplates(COMMERCE_VC_TEMPLATES);
  }

  async registerGamingTemplates(): Promise<void> {
    await this.templateService.registerTemplates(GAMING_VC_TEMPLATES);
  }

  async registerFinancialTemplates(): Promise<void> {
    await this.templateService.registerTemplates(FINANCIAL_VC_TEMPLATES);
  }

  async registerSamoaEnterpriseTemplates(): Promise<void> {
    await this.templateService.registerTemplates(SAMOA_ENTERPRISE_VC_TEMPLATES);
  }

  getAllTemplates(): typeof EXCHANGE_VC_TEMPLATES {
    return [...EXCHANGE_VC_TEMPLATES, ...COMMERCE_VC_TEMPLATES, ...GAMING_VC_TEMPLATES, ...FINANCIAL_VC_TEMPLATES, ...SAMOA_ENTERPRISE_VC_TEMPLATES];
  }
}