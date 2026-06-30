import type { VcTemplate, VcTemplateRepository } from './vc-issue.types';
import { TemplateNotFoundError, TemplateAlreadyExistsError } from './vc-issue.errors';

export class VcTemplateRepositoryImpl implements VcTemplateRepository {
  private storage = new Map<string, VcTemplate>();

  async save(template: VcTemplate): Promise<void> {
    this.storage.set(template.templateId, template);
  }

  async get(templateId: string): Promise<VcTemplate | undefined> {
    return this.storage.get(templateId);
  }

  async findByType(type: string): Promise<VcTemplate[]> {
    return Array.from(this.storage.values()).filter((t) => t.type === type);
  }

  async getAll(): Promise<VcTemplate[]> {
    return Array.from(this.storage.values());
  }

  async update(template: VcTemplate): Promise<void> {
    this.storage.set(template.templateId, template);
  }

  async delete(templateId: string): Promise<void> {
    this.storage.delete(templateId);
  }
}

export class VcTemplateService {
  constructor(private readonly templateRepository: VcTemplateRepository = new VcTemplateRepositoryImpl()) {}

  async createTemplate(template: Omit<VcTemplate, 'templateId' | 'createdAt' | 'updatedAt'>): Promise<VcTemplate> {
    const existing = await this.templateRepository.get(template.type);
    if (existing) {
      throw new TemplateAlreadyExistsError(template.type);
    }

    const newTemplate: VcTemplate = {
      ...template,
      templateId: template.type,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.templateRepository.save(newTemplate);
    return newTemplate;
  }

  async getTemplate(templateId: string): Promise<VcTemplate> {
    const template = await this.templateRepository.get(templateId);
    if (!template) {
      throw new TemplateNotFoundError(templateId);
    }
    return template;
  }

  async updateTemplate(templateId: string, updates: Partial<VcTemplate>): Promise<VcTemplate> {
    const template = await this.getTemplate(templateId);
    const updatedTemplate: VcTemplate = {
      ...template,
      ...updates,
      updatedAt: Date.now(),
    };
    await this.templateRepository.update(updatedTemplate);
    return updatedTemplate;
  }

  async deleteTemplate(templateId: string): Promise<void> {
    const template = await this.getTemplate(templateId);
    await this.templateRepository.delete(templateId);
  }

  async getAllTemplates(): Promise<VcTemplate[]> {
    return this.templateRepository.getAll();
  }

  async findTemplatesByType(type: string): Promise<VcTemplate[]> {
    return this.templateRepository.findByType(type);
  }

  async registerTemplates(templates: VcTemplate[]): Promise<void> {
    for (const template of templates) {
      const existing = await this.templateRepository.get(template.templateId);
      if (existing) {
        await this.templateRepository.update({ ...template, updatedAt: Date.now() });
      } else {
        await this.templateRepository.save(template);
      }
    }
  }
}