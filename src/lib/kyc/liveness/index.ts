/**
 * 活体检测多厂商模块统一导出
 *
 * 适配器：
 *  - BaiduLivenessClient    百度智能云
 *  - TencentLivenessClient   腾讯云（TC3-HMAC-SHA256 签名）
 *  - MegviiLivenessClient    旷视 Face++
 *  - AliCloudFaceVerification 阿里云（来自 J-01，向上兼容）
 *
 * 业务层：
 *  - LivenessService        多厂商切换 / 聚合 / 统计 / 事件
 *
 * @module lib/kyc/liveness
 */

export * from './types';
export * from './baidu-client';
export * from './tencent-client';
export * from './megvii-client';
export * from './liveness-service';
