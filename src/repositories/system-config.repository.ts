import { BaseRepository } from './base/base.repository';
import { Prisma } from '@prisma/client';

export class SystemConfigRepository extends BaseRepository<
  Prisma.CoreSystemConfigGetPayload<{}>,
  Prisma.CoreSystemConfigCreateInput,
  Prisma.CoreSystemConfigUpdateInput,
  Prisma.CoreSystemConfigWhereInput
> {
  constructor() {
    super('coreSystemConfig');
  }

  async findByKey(key: string) {
    return this.model.findUnique({ where: { key } });
  }

  async findByCategory(category: string) {
    return this.model.findMany({
      where: { category },
      orderBy: { key: 'asc' },
    });
  }

  async getValue<T = any>(key: string): Promise<T | null> {
    const config = await this.findByKey(key);
    return config ? (config.value as T) : null;
  }

  async setValue(key: string, value: any, category?: string, description?: string) {
    return this.model.upsert({
      where: { key },
      create: { key, value, category: category || 'system', description },
      update: { value, ...(description && { description }) },
    });
  }

  async getByPrefix(prefix: string) {
    return this.model.findMany({
      where: { key: { startsWith: prefix } },
      orderBy: { key: 'asc' },
    });
  }

  async bulkSet(configs: Array<{ key: string; value: any; category?: string; description?: string }>) {
    const results = [];
    for (const config of configs) {
      results.push(await this.setValue(config.key, config.value, config.category, config.description));
    }
    return results;
  }
}

export const systemConfigRepository = new SystemConfigRepository();
export default systemConfigRepository;