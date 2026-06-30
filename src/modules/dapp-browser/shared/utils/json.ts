export const parseJson = <T = unknown>(input: string): T | null => {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
};

export const stringifyJson = (value: unknown, replacer?: (key: string, value: unknown) => unknown, space?: number): string => {
  try {
    return JSON.stringify(value, replacer, space);
  } catch {
    return '{}';
  }
};

export const safeParseJson = <T = unknown>(input: string, defaultValue: T): T => {
  const result = parseJson<T>(input);
  return result !== null ? result : defaultValue;
};

export const isJsonString = (input: string): boolean => {
  try {
    JSON.parse(input);
    return true;
  } catch {
    return false;
  }
};

export const cloneDeep = <T>(value: T): T => {
  return JSON.parse(JSON.stringify(value));
};

export const jsonEqual = (a: unknown, b: unknown): boolean => {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
};

export const jsonDiff = (a: unknown, b: unknown): string[] => {
  const keysA = new Set(Object.keys(a as object));
  const keysB = new Set(Object.keys(b as object));
  const allKeys = new Set([...keysA, ...keysB]);
  const differences: string[] = [];

  for (const key of allKeys) {
    const valueA = (a as Record<string, unknown>)[key];
    const valueB = (b as Record<string, unknown>)[key];

    if (valueA !== valueB) {
      differences.push(key);
    }
  }

  return differences;
};