#!/usr/bin/env node
/**
 * 构建时生成 APK 元信息 JSON
 * 用法：
 *   node scripts/generate-apk-info.js [path/to/apk]
 *
 * 读取 APK 文件，计算 SHA256/MD5/大小，生成 /public/apk-info.json
 * 默认从项目根的 app-release.apk 读取
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function parseApkVersion(apkPath) {
  // 简单方案：从路径或文件名解析版本
  // 若需要从 APK 内部读取，需使用 aapt 工具
  return {
    version: '1.0.0',
    versionCode: 1,
  };
}

function main() {
  const args = process.argv.slice(2);
  const root = path.resolve(__dirname, '..');
  const apkPath = args[0]
    ? path.resolve(root, args[0])
    : path.join(root, 'app-release.apk');
  const publicDir = path.join(root, 'public');
  const outputPath = path.join(publicDir, 'apk-info.json');

  if (!fs.existsSync(apkPath)) {
    console.warn(`[apk-info] APK not found: ${apkPath}`);
    console.warn('[apk-info] Skipping generation. Existing apk-info.json will be used.');
    process.exit(0);
  }

  console.log(`[apk-info] Reading: ${apkPath}`);
  const buffer = fs.readFileSync(apkPath);
  const stat = fs.statSync(apkPath);

  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  const md5 = crypto.createHash('md5').update(buffer).digest('hex');
  const { version, versionCode } = parseApkVersion(apkPath);

  const info = {
    version,
    versionCode,
    fileSize: stat.size,
    fileSizeFormatted: formatFileSize(stat.size),
    downloadUrl: '/zs-exchange.apk',
    packageName: 'com.smy.exchange.smy_exchange_mobile',
    minAndroidVersion: '5.1 (API 22)',
    targetAndroidVersion: '14 (API 34)',
    architecture: ['arm64-v8a', 'armeabi-v7a', 'x86_64'],
    releaseDate: new Date().toISOString().split('T')[0],
    buildTime: stat.mtime.toISOString(),
    sha256,
    md5,
    features: [
      '实时行情推送',
      '毫秒级订单撮合',
      'KYC 实名认证',
      'DeFi 流动性挖矿',
      'NFT 市场',
      '合约交易',
      '多语言支持',
    ],
  };

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(info, null, 2) + '\n', 'utf8');
  console.log(`[apk-info] Generated: ${outputPath}`);
  console.log(`[apk-info]   version: ${version} (${versionCode})`);
  console.log(`[apk-info]   size:    ${info.fileSizeFormatted}`);
  console.log(`[apk-info]   sha256:  ${sha256.substring(0, 16)}...`);
}

main();
