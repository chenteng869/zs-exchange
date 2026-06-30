import type { PipelineContext } from '../pipeline.types';

export interface LegacyStageResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export function legacySuccess<T>(data: T): LegacyStageResult<T> {
  return { success: true, data };
}

export function legacyFailure(error: string): LegacyStageResult<never> {
  return { success: false, error };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isPipelineContext(value: unknown): value is PipelineContext {
  if (!isObject(value)) return false;
  const maybe = value as Record<string, unknown>;
  return (
    typeof maybe.pipelineId === 'string' &&
    typeof maybe.status === 'string' &&
    isObject(maybe.request) &&
    isObject(maybe.stageData)
  );
}

export function isLegacyInput(value: unknown): boolean {
  return !isPipelineContext(value);
}

export function toPipelineContext(input: unknown): PipelineContext {
  if (isPipelineContext(input)) {
    return input;
  }

  const now = new Date().toISOString();
  const payload = isObject(input) ? input : {};

  return {
    pipelineId: 'legacy-stage-test',
    status: 'running' as PipelineContext['status'],
    request: {
      id: String(payload.requestId ?? payload.id ?? 'legacy-request'),
      type: 'native_transfer' as any,
      chain: 'evm' as any,
      from: String(payload.from ?? '0x' + '0'.repeat(40)),
      to: typeof payload.to === 'string' ? payload.to : undefined,
      value: typeof payload.value === 'string' ? payload.value : undefined,
      data: typeof payload.data === 'string' ? payload.data : undefined,
      userId: typeof payload.userId === 'string' ? payload.userId : undefined,
      walletId: typeof payload.walletId === 'string' ? payload.walletId : undefined,
      tokenAddress: typeof payload.tokenAddress === 'string' ? payload.tokenAddress : undefined,
      tokenAmount: typeof payload.tokenAmount === 'string' ? payload.tokenAmount : undefined,
      metadata: isObject(payload.metadata) ? payload.metadata : {},
    },
    stageData: {
      ...(isObject(payload) ? payload : {}),
    } as PipelineContext['stageData'],
    stageMetadata: {} as PipelineContext['stageMetadata'],
    createdAt: now,
    updatedAt: now,
    skippedStages: [],
    rollbackHistory: [],
    retryCount: 0,
    maxRetries: 0,
    metadata: isObject(payload.metadata) ? payload.metadata : {},
  };
}

export async function executeWithLegacyCompat<T>(
  input: unknown,
  handler: (context: PipelineContext) => Promise<T>,
): Promise<T | LegacyStageResult<T>> {
  const isLegacyInput = !isPipelineContext(input);
  const context = toPipelineContext(input);

  try {
    const data = await handler(context);
    if (isLegacyInput) {
      return { success: true, data };
    }
    return data;
  } catch (error) {
    if (isLegacyInput) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
    throw error;
  }
}
