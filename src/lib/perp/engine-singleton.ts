/**
 * PerpEnginePersistence 全局单例
 * Next.js dev 模式热重载时会复用 global 缓存
 */
import { PerpEnginePersistence } from './perp-engine-persistence';

declare global {
  // eslint-disable-next-line no-var
  var __perpEngine: PerpEnginePersistence | undefined;
}

function createEngine(): PerpEnginePersistence {
  return new PerpEnginePersistence({ enabled: true, loadFromDb: true });
}

export const perpEngine: PerpEnginePersistence =
  global.__perpEngine ?? (global.__perpEngine = createEngine());
