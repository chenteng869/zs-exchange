import { NextRequest } from 'next/server';
import { success, badRequest, notFound } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { apiKeyRepository } from '@/repositories/api-key.repository';
import { parsePagination, formatPaginatedResult } from '@/lib/api/pagination';
import { randomBytes, createHash } from 'node:crypto';

function generateApiKey(): { apiKey: string; secretKey: string; secretHash: string } {
  const apiKey = `zs_${randomBytes(16).toString('hex')}`;
  const secretKey = randomBytes(32).toString('hex');
  const secretHash = createHash('sha256').update(secretKey).digest('hex');
  return { apiKey, secretKey, secretHash };
}

export async function GET(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const pagination = parsePagination(req.nextUrl.searchParams);
    const result = await apiKeyRepository.findByUserId(ctx.userId, pagination);
    return success(formatPaginatedResult(result));
  });
}

export async function POST(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const body = await req.json();
    const action = String(body.action || 'create');

    if (action === 'create') {
      const { label, permissions, ipWhitelist, expiresAt } = body;

      if (!label) return badRequest('Label is required');

      const existing = await apiKeyRepository.findActiveByUserId(ctx.userId);
      if (existing.length >= 10) {
        return badRequest('Maximum 10 API keys allowed per account');
      }

      const { apiKey, secretKey, secretHash } = generateApiKey();

      const created = await apiKeyRepository.create({
        userId: ctx.userId,
        label: String(label).slice(0, 64),
        apiKey,
        secretKey: secretHash,
        permissions: permissions || ['read'],
        ipWhitelist: ipWhitelist || [],
        status: 'active',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      } as any);

      return success({
        ...created,
        secretKey,
        secretKeyNote: 'Store this secret key — it will not be shown again',
      });
    }

    if (action === 'revoke') {
      const { id } = body;
      if (!id) return badRequest('API key ID is required');

      const key = await apiKeyRepository.findById(id);
      if (!key || (key as any).userId !== ctx.userId) {
        return notFound('API key not found');
      }

      const updated = await apiKeyRepository.update(id, { status: 'revoked' } as any);
      return success(updated);
    }

    if (action === 'rotate') {
      const { id } = body;
      if (!id) return badRequest('API key ID is required');

      const key = await apiKeyRepository.findById(id);
      if (!key || (key as any).userId !== ctx.userId) {
        return notFound('API key not found');
      }

      const { secretKey: newSecret, secretHash: newHash } = generateApiKey();
      await apiKeyRepository.rotateSecret(id, newHash);

      return success({
        id,
        secretKey: newSecret,
        secretKeyNote: 'New secret key — store it securely',
      });
    }

    return badRequest('Unsupported action');
  });
}
