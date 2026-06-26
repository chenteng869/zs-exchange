/**
 * 设备维度评分器
 * 从设备和环境角度评估风险，包括新设备、异常位置、设备指纹等
 */

import {
  RiskContext,
  DimensionScore,
  ScoreDimension,
  RiskLevel,
} from '../risk-engine.types';

/**
 * 设备历史记录接口
 */
interface DeviceRecord {
  deviceId: string;
  firstSeen: Date;
  lastSeen: Date;
  trustLevel: number;
  isTrusted: boolean;
  userAgent?: string;
  os?: string;
  ipAddresses: string[];
  locations: string[];
}

/**
 * 设备维度评分器类
 * 用于从设备和环境角度计算风险评分
 */
export class DeviceScorer {
  readonly dimension = ScoreDimension.DEVICE;
  readonly dimensionName = '设备维度';

  private weight = 0.15;

  private userDevices: Map<string, DeviceRecord[]> = new Map();
  private trustedDevices: Set<string> = new Set();

  /**
   * 设置权重
   * @param weight 权重（0-1）
   */
  setWeight(weight: number): void {
    this.weight = Math.max(0, Math.min(1, weight));
  }

  /**
   * 获取权重
   */
  getWeight(): number {
    return this.weight;
  }

  /**
   * 记录设备使用
   * @param userId 用户 ID
   * @param deviceId 设备 ID
   * @param deviceInfo 设备信息
   */
  recordDeviceUsage(
    userId: string,
    deviceId: string,
    deviceInfo?: {
      userAgent?: string;
      os?: string;
      ipAddress?: string;
      location?: string;
    }
  ): void {
    let devices = this.userDevices.get(userId);
    if (!devices) {
      devices = [];
      this.userDevices.set(userId, devices);
    }

    const now = new Date();
    let deviceRecord = devices.find((d) => d.deviceId === deviceId);

    if (deviceRecord) {
      deviceRecord.lastSeen = now;
      if (deviceInfo?.userAgent) {
        deviceRecord.userAgent = deviceInfo.userAgent;
      }
      if (deviceInfo?.os) {
        deviceRecord.os = deviceInfo.os;
      }
      if (deviceInfo?.ipAddress && !deviceRecord.ipAddresses.includes(deviceInfo.ipAddress)) {
        deviceRecord.ipAddresses.push(deviceInfo.ipAddress);
      }
      if (deviceInfo?.location && !deviceRecord.locations.includes(deviceInfo.location)) {
        deviceRecord.locations.push(deviceInfo.location);
      }
    } else {
      deviceRecord = {
        deviceId,
        firstSeen: now,
        lastSeen: now,
        trustLevel: 0,
        isTrusted: this.trustedDevices.has(deviceId),
        userAgent: deviceInfo?.userAgent,
        os: deviceInfo?.os,
        ipAddresses: deviceInfo?.ipAddress ? [deviceInfo.ipAddress] : [],
        locations: deviceInfo?.location ? [deviceInfo.location] : [],
      };
      devices.push(deviceRecord);
    }
  }

  /**
   * 添加受信任设备
   * @param deviceId 设备 ID
   */
  addTrustedDevice(deviceId: string): void {
    this.trustedDevices.add(deviceId);

    for (const [, devices] of this.userDevices) {
      const device = devices.find((d) => d.deviceId === deviceId);
      if (device) {
        device.isTrusted = true;
        device.trustLevel = Math.min(device.trustLevel + 50, 100);
      }
    }
  }

  /**
   * 移除受信任设备
   * @param deviceId 设备 ID
   */
  removeTrustedDevice(deviceId: string): boolean {
    const removed = this.trustedDevices.delete(deviceId);

    for (const [, devices] of this.userDevices) {
      const device = devices.find((d) => d.deviceId === deviceId);
      if (device) {
        device.isTrusted = false;
      }
    }

    return removed;
  }

  /**
   * 检查设备是否受信任
   * @param deviceId 设备 ID
   */
  isTrustedDevice(deviceId: string): boolean {
    return this.trustedDevices.has(deviceId);
  }

  /**
   * 获取用户设备列表
   * @param userId 用户 ID
   */
  getUserDevices(userId: string): DeviceRecord[] {
    return this.userDevices.get(userId) || [];
  }

  /**
   * 检查是否为新设备
   * @param userId 用户 ID
   * @param deviceId 设备 ID
   */
  isNewDevice(userId: string, deviceId: string): boolean {
    const devices = this.userDevices.get(userId);
    if (!devices || devices.length === 0) return true;

    const device = devices.find((d) => d.deviceId === deviceId);
    return !device;
  }

  /**
   * 计算新设备风险分
   * @param userId 用户 ID
   * @param deviceId 设备 ID
   * @param contextIsNewDevice 上下文中的新设备标记
   */
  private calculateNewDeviceScore(
    userId: string,
    deviceId?: string,
    contextIsNewDevice?: boolean
  ): {
    score: number;
    details: string[];
    isNew: boolean;
  } {
    let isNew = false;
    let score = 0;
    const details: string[] = [];

    if (contextIsNewDevice) {
      isNew = true;
      score = 50;
      details.push('检测到新设备首次操作');
    } else if (deviceId && userId) {
      isNew = this.isNewDevice(userId, deviceId);
      if (isNew) {
        score = 40;
        details.push('首次使用该设备进行操作');
      }
    }

    return { score, details, isNew };
  }

  /**
   * 计算异常位置风险分
   * @param userId 用户 ID
   * @param deviceId 设备 ID
   * @param location 位置
   * @param contextIsAbnormal 上下文中的异常位置标记
   */
  private calculateLocationScore(
    userId: string,
    deviceId?: string,
    location?: string,
    contextIsAbnormal?: boolean
  ): {
    score: number;
    details: string[];
  } {
    let score = 0;
    const details: string[] = [];

    if (contextIsAbnormal) {
      score = 60;
      details.push('检测到异常登录位置');
      return { score, details };
    }

    if (userId && deviceId && location) {
      const devices = this.userDevices.get(userId);
      if (devices && devices.length > 0) {
        const knownLocations = new Set<string>();
        for (const device of devices) {
          device.locations.forEach((loc) => knownLocations.add(loc));
        }

        if (knownLocations.size > 0 && !knownLocations.has(location)) {
          score = 30;
          details.push('当前位置不在常用登录地点');
        }
      }
    }

    return { score, details };
  }

  /**
   * 计算设备信任度风险分
   * @param deviceId 设备 ID
   * @param userId 用户 ID
   */
  private calculateTrustScore(deviceId?: string, userId?: string): {
    score: number;
    details: string[];
    trustLevel: number;
  } {
    let score = 0;
    const details: string[] = [];
    let trustLevel = 0;

    if (deviceId) {
      if (this.trustedDevices.has(deviceId)) {
        trustLevel = 100;
        details.push('设备已标记为受信任设备');
        return { score: 0, details, trustLevel };
      }

      if (userId) {
        const devices = this.userDevices.get(userId);
        const device = devices?.find((d) => d.deviceId === deviceId);
        if (device) {
          trustLevel = device.trustLevel;

          const daysSinceFirstSeen =
            (Date.now() - device.firstSeen.getTime()) / (24 * 60 * 60 * 1000);
          if (daysSinceFirstSeen < 1) {
            score += 20;
            details.push('设备使用时间不足1天');
          } else if (daysSinceFirstSeen < 7) {
            score += 10;
            details.push('设备使用时间不足7天');
          }

          if (device.ipAddresses.length > 3) {
            score += 15;
            details.push('设备关联的 IP 地址较多');
          }
        } else {
          score = 30;
          details.push('未知设备');
        }
      }
    }

    return { score, details, trustLevel };
  }

  /**
   * 计算设备类型风险分
   * @param deviceType 设备类型
   * @param isHardwareWallet 是否硬件钱包
   */
  private calculateDeviceTypeScore(
    deviceType?: string,
    isHardwareWallet?: boolean
  ): {
    score: number;
    details: string[];
  } {
    let score = 0;
    const details: string[] = [];

    if (isHardwareWallet) {
      score = -20;
      details.push('使用硬件钱包，安全性高');
    }

    return { score, details };
  }

  /**
   * 评估风险等级
   * @param score 分数
   */
  private assessRiskLevel(score: number): RiskLevel {
    if (score >= 85) return RiskLevel.CRITICAL;
    if (score >= 60) return RiskLevel.HIGH;
    if (score >= 30) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  /**
   * 生成评分描述
   * @param score 分数
   * @param details 详情列表
   */
  private generateDescription(score: number, details: string[]): string {
    if (details.length > 0) {
      return details.join('；');
    }
    if (score <= 0) {
      return '设备环境安全';
    }
    return `设备维度风险评分：${score} 分`;
  }

  /**
   * 执行设备维度评分
   * @param context 风控上下文
   * @returns 维度评分结果
   */
  score(context: RiskContext): DimensionScore {
    const device = context.device;

    if (!device) {
      return {
        dimension: this.dimension,
        dimensionName: this.dimensionName,
        score: 0,
        weight: this.weight,
        weightedScore: 0,
        level: RiskLevel.LOW,
        description: '无设备信息，设备维度不评分',
        details: {},
      };
    }

    let totalScore = 0;
    const allDetails: string[] = [];
    let trustLevel = 0;

    const newDeviceResult = this.calculateNewDeviceScore(
      context.userId || '',
      device.deviceId,
      device.isNewDevice
    );
    totalScore += newDeviceResult.score;
    allDetails.push(...newDeviceResult.details);

    const locationResult = this.calculateLocationScore(
      context.userId || '',
      device.deviceId,
      device.location,
      device.isAbnormalLocation
    );
    totalScore += locationResult.score;
    allDetails.push(...locationResult.details);

    const trustResult = this.calculateTrustScore(device.deviceId, context.userId);
    totalScore += trustResult.score;
    allDetails.push(...trustResult.details);
    trustLevel = trustResult.trustLevel;

    const deviceTypeResult = this.calculateDeviceTypeScore(
      device.deviceType,
      device.isHardwareWallet
    );
    totalScore += deviceTypeResult.score;
    allDetails.push(...deviceTypeResult.details);

    totalScore = Math.max(0, totalScore);

    const score = Math.min(Math.round(totalScore), 100);
    const level = this.assessRiskLevel(score);
    const weightedScore = Math.round(score * this.weight * 100) / 100;

    return {
      dimension: this.dimension,
      dimensionName: this.dimensionName,
      score,
      weight: this.weight,
      weightedScore,
      level,
      description: this.generateDescription(score, allDetails),
      details: {
        deviceId: device.deviceId,
        deviceType: device.deviceType,
        isNewDevice: newDeviceResult.isNew,
        isTrusted: this.isTrustedDevice(device.deviceId || ''),
        trustLevel,
        location: device.location,
        ipAddress: device.ipAddress,
      },
    };
  }
}

export const deviceScorer = new DeviceScorer();
