/**
 * 文件上传服务端校验工具 (P0-5 安全修复)
 *
 * 设计目标:
 *  1. 服务端文件大小校验（不受客户端限制）
 *  2. MIME 类型嗅探（魔术字节，不信任客户端声明）
 *  3. 文件名清理（防路径穿越、注入）
 *  4. 文件扩展名白名单
 *  5. Base64 字符串大小限制（防 DoS）
 *
 * 应用场景:
 *  - KYC 身份证照片（base64 → OSS）
 *  - 用户头像上传
 *  - 商户证明材料
 *  - 任何 user-uploaded file
 *
 * 审计依据: J-1.9 业务逻辑与数据安全审计 - 2.3 文件上传 (HIGH)
 */

import { SafeError } from '@/lib/api/error-handler';

// ============================================================
// 限制常量（可被环境变量覆盖）
// ============================================================

export const FILE_UPLOAD_LIMITS = {
  /** 默认最大文件大小（10MB） */
  DEFAULT_MAX_SIZE: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760'),
  /** 图片最大 5MB */
  IMAGE_MAX_SIZE: parseInt(process.env.UPLOAD_IMAGE_MAX_SIZE || '5242880'),
  /** 文档最大 20MB */
  DOCUMENT_MAX_SIZE: parseInt(process.env.UPLOAD_DOCUMENT_MAX_SIZE || '20971520'),
  /** Base64 字符串最大（默认 14MB，含 base64 膨胀系数） */
  BASE64_MAX_LENGTH: parseInt(process.env.UPLOAD_BASE64_MAX_LENGTH || '14680064'),
} as const;

// ============================================================
// MIME 类型白名单
// ============================================================

/**
 * 按用途分类的 MIME 白名单
 */
export const ALLOWED_MIME_TYPES = {
  IMAGE: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif',
  ],
  DOCUMENT: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  KYC: [
    // 身份证正面/背面/手持照
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    // PDF 证件（如护照）
    'application/pdf',
  ],
} as const;

// ============================================================
// 魔术字节（MIME 嗅探）
// ============================================================

interface MagicBytes {
  mime: string;
  ext: string;
  signature: number[];
  /** 可选：第二段签名（用于容器格式） */
  offset?: number;
}

const MAGIC_BYTES: MagicBytes[] = [
  // JPEG: FF D8 FF
  { mime: 'image/jpeg', ext: 'jpg', signature: [0xff, 0xd8, 0xff] },
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  { mime: 'image/png', ext: 'png', signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  // GIF: 47 49 46 38 (GIF8)
  { mime: 'image/gif', ext: 'gif', signature: [0x47, 0x49, 0x46, 0x38] },
  // WEBP: RIFF....WEBP
  { mime: 'image/webp', ext: 'webp', signature: [0x52, 0x49, 0x46, 0x46] },
  // PDF: 25 50 44 46 (%PDF)
  { mime: 'application/pdf', ext: 'pdf', signature: [0x25, 0x50, 0x44, 0x46] },
  // ZIP / Office Open XML: 50 4B 03 04 (PK..)
  { mime: 'application/zip', ext: 'zip', signature: [0x50, 0x4b, 0x03, 0x04] },
];

/**
 * 通过魔术字节嗅探文件真实类型
 * @returns 检测到的 MIME 和扩展名，未知返回 null
 */
export function sniffFileType(buffer: ArrayBuffer | Uint8Array): { mime: string; ext: string } | null {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes.length < 8) return null;

  for (const magic of MAGIC_BYTES) {
    let match = true;
    for (let i = 0; i < magic.signature.length; i++) {
      if (bytes[i] !== magic.signature[i]) {
        match = false;
        break;
      }
    }
    if (match) {
      // WEBP 特殊处理：RIFF + 4 字节 + WEBP
      if (magic.mime === 'image/webp') {
        if (bytes.length < 12) return null;
        const webpTag = [0x57, 0x45, 0x42, 0x50]; // WEBP
        for (let i = 8; i < 12; i++) {
          if (bytes[i] !== webpTag[i - 8]) {
            return null;
          }
        }
        return { mime: magic.mime, ext: magic.ext };
      }
      // Office Open XML 实际是 ZIP 容器，需检查内部 [Content_Types].xml
      // 此处保守返回 application/zip
      if (magic.mime === 'application/zip') {
        return { mime: 'application/zip', ext: 'zip' };
      }
      return { mime: magic.mime, ext: magic.ext };
    }
  }
  return null;
}

// ============================================================
// 文件名清理
// ============================================================

/**
 * 清理文件名，移除危险字符
 * - 移除路径分隔符（/, \）
 * - 移除空字节（\0）
 * - 移除控制字符
 * - 限制长度 255
 * - 防止 .. 路径穿越
 */
export function sanitizeFilename(name: string): string {
  if (typeof name !== 'string' || name.length === 0) {
    return `file_${Date.now()}`;
  }
  let cleaned = name
    // 移除路径分隔符
    .replace(/[\/\\]/g, '_')
    // 移除空字节
    .replace(/\0/g, '')
    // 移除控制字符
    .replace(/[\x00-\x1F\x7F]/g, '')
    // 移除 .. 路径穿越
    .replace(/\.\.+/g, '.')
    // 限制长度
    .slice(0, 200);

  // 移除前导点
  cleaned = cleaned.replace(/^\.+/, '');

  // 确保非空
  if (cleaned.length === 0) {
    cleaned = `file_${Date.now()}`;
  }

  return cleaned;
}

/**
 * 生成安全的 OSS Key / 文件路径
 * 格式: uploads/{userId}/{year}/{month}/{uuid}.{ext}
 */
export function generateOssKey(params: {
  userId: string;
  originalName: string;
  ext: string;
}): string {
  const { userId, originalName, ext } = params;
  // userId 清理（防路径注入）
  const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  // 原始名清理（作为元数据保留）
  const safeName = sanitizeFilename(originalName);
  // 时间戳
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  // UUID
  const uuid = crypto.randomUUID();
  return `uploads/${safeUserId}/${year}/${month}/${uuid}.${ext}`;
}

// ============================================================
// 主入口
// ============================================================

export interface FileValidationOptions {
  /** 允许的 MIME 类型列表（不含通配符） */
  allowedMimes: string[];
  /** 最大文件大小（字节） */
  maxSize: number;
  /** 是否必须通过魔术字节嗅探（默认 true） */
  requireMagicBytes?: boolean;
}

/**
 * 综合文件校验
 * @throws SafeError 如果校验失败
 */
export function validateFile(
  file: { name: string; type: string; size: number },
  buffer: ArrayBuffer | Uint8Array,
  options: FileValidationOptions,
): { mime: string; ext: string; safeName: string } {
  const { allowedMimes, maxSize, requireMagicBytes = true } = options;

  // 1. 大小校验
  if (file.size > maxSize) {
    throw new SafeError(
      'File too large',
      `File size ${file.size} exceeds max ${maxSize}`,
      'FILE_TOO_LARGE',
      413,
    );
  }
  if (file.size === 0) {
    throw new SafeError(
      'Empty file',
      'File is empty (0 bytes)',
      'EMPTY_FILE',
      400,
    );
  }

  // 2. 客户端声明 MIME 校验
  if (!allowedMimes.includes(file.type)) {
    throw new SafeError(
      'Disallowed file type',
      `MIME ${file.type} not in whitelist`,
      'DISALLOWED_MIME',
      415,
    );
  }

  // 3. 魔术字节嗅探（防止伪造）
  if (requireMagicBytes) {
    const sniffed = sniffFileType(buffer);
    if (!sniffed) {
      throw new SafeError(
        'Unknown file format',
        'File magic bytes do not match any known format',
        'UNKNOWN_FORMAT',
        400,
      );
    }
    if (!allowedMimes.includes(sniffed.mime)) {
      throw new SafeError(
        'File type mismatch',
        `Declared ${file.type} but actual ${sniffed.mime}`,
        'MIME_MISMATCH',
        400,
      );
    }
  }

  // 4. 文件名清理
  const safeName = sanitizeFilename(file.name);

  return {
    mime: file.type,
    ext: file.name.split('.').pop()?.toLowerCase() || 'bin',
    safeName,
  };
}

// ============================================================
// Base64 解码 + 校验
// ============================================================

/**
 * 解码并校验 base64 字符串
 * - 验证 base64 格式
 * - 解码后大小校验
 * - 魔术字节嗅探
 * - 生成 OSS Key
 */
export function validateBase64File(
  base64: string,
  filename: string,
  declaredMime: string,
  options: FileValidationOptions,
): { buffer: Uint8Array; ossKey: string; safeName: string; mime: string } {
  const { allowedMimes, maxSize } = options;

  // 1. Base64 格式校验
  if (typeof base64 !== 'string' || base64.length === 0) {
    throw new SafeError(
      'Empty base64 data',
      'No base64 data provided',
      'EMPTY_DATA',
      400,
    );
  }

  // 2. 长度校验（防 DoS）
  if (base64.length > FILE_UPLOAD_LIMITS.BASE64_MAX_LENGTH) {
    throw new SafeError(
      'Base64 data too large',
      `Base64 length ${base64.length} exceeds max ${FILE_UPLOAD_LIMITS.BASE64_MAX_LENGTH}`,
      'DATA_TOO_LARGE',
      413,
    );
  }

  // 3. 去除 data URL 前缀
  const base64Data = base64.replace(/^data:[^;]+;base64,/, '');

  // 4. 字符集校验
  if (!/^[A-Za-z0-9+/=]+$/.test(base64Data)) {
    throw new SafeError(
      'Invalid base64 characters',
      'Base64 contains invalid characters',
      'INVALID_BASE64',
      400,
    );
  }

  // 5. 解码
  let buffer: Uint8Array;
  try {
    buffer = Uint8Array.from(Buffer.from(base64Data, 'base64'));
  } catch (e) {
    throw new SafeError(
      'Base64 decode failed',
      'Failed to decode base64 data',
      'DECODE_FAILED',
      400,
    );
  }

  // 6. 大小校验（解码后）
  if (buffer.byteLength > maxSize) {
    throw new SafeError(
      'File too large',
      `Decoded size ${buffer.byteLength} exceeds max ${maxSize}`,
      'FILE_TOO_LARGE',
      413,
    );
  }
  if (buffer.byteLength === 0) {
    throw new SafeError(
      'Empty file',
      'Decoded buffer is empty',
      'EMPTY_FILE',
      400,
    );
  }

  // 7. MIME 白名单
  if (!allowedMimes.includes(declaredMime)) {
    throw new SafeError(
      'Disallowed file type',
      `MIME ${declaredMime} not in whitelist`,
      'DISALLOWED_MIME',
      415,
    );
  }

  // 8. 魔术字节嗅探
  const sniffed = sniffFileType(buffer);
  if (!sniffed) {
    throw new SafeError(
      'Unknown file format',
      'File magic bytes do not match any known format',
      'UNKNOWN_FORMAT',
      400,
    );
  }
  if (!allowedMimes.includes(sniffed.mime)) {
    throw new SafeError(
      'File type mismatch',
      `Declared ${declaredMime} but actual ${sniffed.mime}`,
      'MIME_MISMATCH',
      400,
    );
  }

  // 9. 文件名清理
  const safeName = sanitizeFilename(filename);
  const ext = sniffed.ext;

  return {
    buffer,
    ossKey: '', // 由调用方根据 context 生成
    safeName,
    mime: sniffed.mime,
  };
}

// ============================================================
// 元数据校验（OSS 直传 / URL 场景）
// ============================================================

/**
 * 仅校验文件元数据（不读 buffer），用于以下场景：
 *  - 客户端已通过 OSS 直传获取 URL，回调仅传元数据
 *  - KYC 提交时只接收 OSS URL 字符串
 *  - 管理端创建上传令牌时仅校验元数据
 *
 * 校验项：
 *  1. MIME 是否在白名单
 *  2. 大小是否超限
 *  3. 文件名清理（防路径穿越）
 *  4. 文件扩展名是否在白名单（与 MIME 匹配）
 *
 * @returns 清理后的安全元数据（含 ossKey）
 */
export interface FileMetadataInput {
  originalName: string;
  mimeType: string;
  fileSize: number;
}

export interface FileMetadataValidationOptions {
  allowedMimes: string[];
  maxSize: number;
  userId: string;
}

export function validateFileMetadata(
  input: FileMetadataInput,
  options: FileMetadataValidationOptions,
): { mime: string; ext: string; safeName: string; ossKey: string } {
  const { originalName, mimeType, fileSize } = input;
  const { allowedMimes, maxSize, userId } = options;

  // 1. MIME 白名单
  if (!allowedMimes.includes(mimeType)) {
    throw new SafeError(
      'Disallowed file type',
      `MIME ${mimeType} not in whitelist`,
      'DISALLOWED_MIME',
      415,
    );
  }

  // 2. 大小校验
  if (fileSize <= 0) {
    throw new SafeError(
      'Empty file',
      'File size must be positive',
      'EMPTY_FILE',
      400,
    );
  }
  if (fileSize > maxSize) {
    throw new SafeError(
      'File too large',
      `File size ${fileSize} exceeds max ${maxSize}`,
      'FILE_TOO_LARGE',
      413,
    );
  }

  // 3. 文件名清理
  const safeName = sanitizeFilename(originalName);
  const ext = safeName.split('.').pop()?.toLowerCase() || 'bin';

  // 4. 扩展名与 MIME 一致性（MIME → 允许的扩展名映射）
  const mimeToExts: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
    'image/gif': ['gif'],
    'image/heic': ['heic'],
    'image/heif': ['heif'],
    'application/pdf': ['pdf'],
    'application/msword': ['doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
    'application/vnd.ms-excel': ['xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
    'application/zip': ['zip'],
  };
  const allowedExts = mimeToExts[mimeType] || [];
  if (allowedExts.length > 0 && !allowedExts.includes(ext)) {
    throw new SafeError(
      'File extension mismatch',
      `Extension ${ext} does not match declared MIME ${mimeType}`,
      'EXT_MISMATCH',
      400,
    );
  }

  // 5. 生成 OSS Key
  const ossKey = generateOssKey({ userId, originalName: safeName, ext });

  return { mime: mimeType, ext, safeName, ossKey };
}

// ============================================================
// 兼容层
// ============================================================

export const fileUploadGuard = {
  sniffFileType,
  sanitizeFilename,
  generateOssKey,
  validateFile,
  validateBase64File,
  validateFileMetadata,
  ALLOWED_MIME_TYPES,
  FILE_UPLOAD_LIMITS,
};

export default fileUploadGuard;
