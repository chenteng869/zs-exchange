/**
 * Base32 编解码（RFC 4648）
 *
 * 用于 TOTP secret 的字符串表示。
 * 兼容 Google Authenticator、Authy、1Password 等主流应用。
 *
 * @module lib/auth/base32
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const ALPHABET_MAP: Record<string, number> = (() => {
  const map: Record<string, number> = {};
  for (let i = 0; i < ALPHABET.length; i++) {
    map[ALPHABET[i]] = i;
  }
  // 兼容小写 + 解码时去除 padding
  return map;
})();

/**
 * 将字节编码为 base32（无 padding，uppercase）
 * 复杂度：O(n)
 */
export const base32Encode = (data: Uint8Array | ArrayBuffer): string => {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += ALPHABET[(value << (5 - bits)) & 0x1f];
  }
  return output;
};

/**
 * 从 base32 解码为字节
 * 自动忽略 padding、空白、大小写
 */
export const base32Decode = (input: string): Uint8Array => {
  if (!input) {
    throw new Error('base32Decode: empty input');
  }
  const cleaned = input.replace(/=+$/, '').replace(/\s/g, '').toUpperCase();
  const out: number[] = [];
  let bits = 0;
  let value = 0;

  for (let i = 0; i < cleaned.length; i++) {
    const c = cleaned[i];
    const v = ALPHABET_MAP[c];
    if (v === undefined) {
      throw new Error(`base32Decode: invalid char "${c}" at ${i}`);
    }
    value = (value << 5) | v;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
};
