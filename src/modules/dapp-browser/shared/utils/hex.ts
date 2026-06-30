export const isHexString = (value: string): boolean => {
  return /^0x[a-fA-F0-9]*$/.test(value);
};

export const isHexAddress = (value: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
};

export const isHexChainId = (value: string): boolean => {
  return /^0x[a-fA-F0-9]+$/.test(value) && value.length >= 3;
};

export const hexToNumber = (hex: string): number | null => {
  if (!isHexString(hex)) return null;
  try {
    return parseInt(hex, 16);
  } catch {
    return null;
  }
};

export const numberToHex = (value: number): string => {
  return `0x${value.toString(16)}`;
};

export const bigIntToHex = (value: bigint): string => {
  return `0x${value.toString(16)}`;
};

export const hexToBigInt = (hex: string): bigint | null => {
  if (!isHexString(hex)) return null;
  try {
    return BigInt(hex);
  } catch {
    return null;
  }
};

export const padHex = (hex: string, length: number): string => {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const padded = cleanHex.padStart(length * 2, '0');
  return `0x${padded}`;
};

export const stripHexPrefix = (hex: string): string => {
  return hex.startsWith('0x') ? hex.slice(2) : hex;
};

export const addHexPrefix = (hex: string): string => {
  return hex.startsWith('0x') ? hex : `0x${hex}`;
};

export const normalizeAddress = (address: string): string => {
  if (!isHexAddress(address)) return address;
  return addHexPrefix(stripHexPrefix(address).toLowerCase());
};

export const isValidPrivateKey = (value: string): boolean => {
  return /^0x[a-fA-F0-9]{64}$/.test(value);
};

export const isValidPublicKey = (value: string): boolean => {
  return /^0x[a-fA-F0-9]{130}$/.test(value);
};

export const isValidSignature = (value: string): boolean => {
  return /^0x[a-fA-F0-9]{130}$/.test(value);
};