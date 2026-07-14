/**
 * WinePass NFT Service REST API
 * /api/v1/fjn/winepass
 *
 * 文档：H015 §3.9
 *
 * 端点：
 *  - GET  ?action=collection-list        Collection 列表
 *  - GET  ?action=asset-list             资产列表
 *  - POST action=create-collection       创建 Collection (admin)
 *  - POST action=pause-collection        暂停 Collection (admin)
 *  - POST action=resume-collection       恢复 Collection (admin)
 *  - POST action=mint-asset              铸造 NFT (admin)
 *  - POST action=freeze-asset            冻结 NFT (admin)
 *  - POST action=unfreeze-asset          解冻 NFT (admin)
 *  - POST action=burn-asset              销毁 NFT (admin)
 */

import { NextRequest } from 'next/server';
import { success, badRequest } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { withAdminAuth } from '@/lib/api/middleware';
import { FjnWinepassNftService } from '@/lib/fjn/services/winepass-nft-service';
import { FjnError } from '@/lib/fjn/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'collection-list':
      return withAdminAuth(req, () => listCollections(req));
    case 'asset-list':
      return withAdminAuth(req, () => listAssets(req));
    default:
      return badRequest('Invalid action. Supported (GET): collection-list, asset-list');
  }
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'create-collection':
      return withAdminAuth(req, (ctx) => createCollection(req, ctx.userId));
    case 'pause-collection':
      return withAdminAuth(req, (ctx) => pauseCollection(req, ctx.userId));
    case 'resume-collection':
      return withAdminAuth(req, (ctx) => resumeCollection(req, ctx.userId));
    case 'mint-asset':
      return withAdminAuth(req, (ctx) => mintAsset(req, ctx.userId));
    case 'freeze-asset':
      return withAdminAuth(req, (ctx) => freezeAsset(req, ctx.userId));
    case 'unfreeze-asset':
      return withAdminAuth(req, (ctx) => unfreezeAsset(req, ctx.userId));
    case 'burn-asset':
      return withAdminAuth(req, (ctx) => burnAsset(req, ctx.userId));
    default:
      return badRequest('Invalid action. Supported (POST): create-collection, pause-collection, resume-collection, mint-asset, freeze-asset, unfreeze-asset, burn-asset');
  }
}

async function listCollections(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const nftType = (p.get('nftType') as any) || undefined;
  const status = (p.get('status') as any) || undefined;
  try {
    const svc = new FjnWinepassNftService();
    const result = await svc.listCollections({ nftType, status, page, pageSize });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/winepass collection-list');
  }
}

async function listAssets(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const collectionId = p.get('collectionId') || undefined;
  const ownerId = p.get('ownerId') || undefined;
  const status = (p.get('status') as any) || undefined;
  try {
    const svc = new FjnWinepassNftService();
    const result = await svc.listAssets({ collectionId, ownerId, status, page, pageSize });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/winepass asset-list');
  }
}

async function createCollection(req: NextRequest, createdBy: string) {
  try {
    const body = await req.json();
    const { name, symbol, nftType, description, imageUrl, maxSupply, metadataUri, contractAddress, chainId } = body;
    if (!name || !symbol || !nftType || !maxSupply) {
      return badRequest('Missing required: name, symbol, nftType, maxSupply');
    }
    const svc = new FjnWinepassNftService();
    const result = await svc.createCollection({ name, symbol, nftType, description, imageUrl, maxSupply, metadataUri, contractAddress, chainId, createdBy });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/winepass create-collection');
  }
}

async function pauseCollection(req: NextRequest, operatorId: string) {
  try {
    const { collectionId, reason } = await req.json();
    if (!collectionId) return badRequest('Missing required: collectionId');
    const svc = new FjnWinepassNftService();
    const result = await svc.pauseCollection(collectionId, reason, operatorId);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/winepass pause-collection');
  }
}

async function resumeCollection(req: NextRequest, operatorId: string) {
  try {
    const { collectionId } = await req.json();
    if (!collectionId) return badRequest('Missing required: collectionId');
    const svc = new FjnWinepassNftService();
    const result = await svc.resumeCollection(collectionId, operatorId);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/winepass resume-collection');
  }
}

async function mintAsset(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { collectionId, ownerId, name, imageUrl, attributes, initialPower, level, sourceType, sourceId } = body;
    if (!collectionId || !ownerId || !name) return badRequest('Missing required: collectionId, ownerId, name');
    const svc = new FjnWinepassNftService();
    const result = await svc.mintAsset({ collectionId, ownerId, name, imageUrl, attributes, initialPower, level, sourceType, sourceId, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/winepass mint-asset');
  }
}

async function freezeAsset(req: NextRequest, operatorId: string) {
  try {
    const { assetId, reason } = await req.json();
    if (!assetId || !reason) return badRequest('Missing required: assetId, reason');
    const svc = new FjnWinepassNftService();
    const result = await svc.freezeAsset({ assetId, reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/winepass freeze-asset');
  }
}

async function unfreezeAsset(req: NextRequest, operatorId: string) {
  try {
    const { assetId, reason } = await req.json();
    if (!assetId) return badRequest('Missing required: assetId');
    const svc = new FjnWinepassNftService();
    const result = await svc.unfreezeAsset({ assetId, reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/winepass unfreeze-asset');
  }
}

async function burnAsset(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { assetId, userId, reason } = body;
    if (!assetId || !userId || !reason) return badRequest('Missing required: assetId, userId, reason');
    const svc = new FjnWinepassNftService();
    const result = await svc.burnAsset({ assetId, userId, reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/winepass burn-asset');
  }
}
