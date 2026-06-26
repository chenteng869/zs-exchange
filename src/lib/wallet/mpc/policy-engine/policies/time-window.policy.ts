/**
 * 时间窗口策略 (Time Window Policy)
 *
 * 功能：
 *  - 仅在指定时间段内允许签名
 *  - 支持工作日/周末配置
 *  - 支持节假日配置
 *  - 支持时区配置
 *  - 非工作时间需要额外审批
 */

import {
  PolicyType,
  SignaturePolicy,
  PolicyEvaluationContext,
  PolicyEvaluationResult,
  ApprovalMode,
  WalletTier,
} from '../../mpc.types';
import { BasePolicyEvaluator } from '../policy-evaluator';

// =============================================================================
// 时间窗口策略参数接口
// =============================================================================

export interface TimeWindowPolicyParams {
  /** 时区（IANA 时区标识符，如 Asia/Shanghai） */
  timezone: string;
  /** 工作日配置 */
  workdays: TimeWindowDayConfig;
  /** 周末配置 */
  weekends?: TimeWindowDayConfig;
  /** 节假日列表（YYYY-MM-DD 格式） */
  holidays?: string[];
  /** 特殊日期配置 */
  specialDates?: Array<{
    date: string;
    config: TimeWindowDayConfig;
  }>;
  /** 非工作时间操作策略：reject / require_approval / warn */
  offHoursAction: 'reject' | 'require_approval' | 'warn';
  /** 非工作时间审批配置 */
  offHoursApproval?: {
    mode: ApprovalMode;
    approvers: string[];
    timeoutSeconds: number;
  };
}

/**
 * 单日时间窗口配置
 */
export interface TimeWindowDayConfig {
  /** 是否允许签名 */
  allowed: boolean;
  /** 允许的时间段（24小时制，如 ["09:00-18:00"]） */
  windows?: string[];
  /** 风险等级加成 */
  riskAdjustment?: number;
}

// =============================================================================
// 时间信息接口
// =============================================================================

interface TimeInfo {
  hour: number;
  minute: number;
  dayOfWeek: number;
  date: string;
  isWeekend: boolean;
  isHoliday: boolean;
  isSpecialDate: boolean;
}

// =============================================================================
// 时间窗口策略评估器
// =============================================================================

export class TimeWindowPolicyEvaluator extends BasePolicyEvaluator {
  readonly policyType = PolicyType.TIME_WINDOW;

  /**
   * 评估时间窗口策略
   */
  async evaluate(
    policy: SignaturePolicy,
    context: PolicyEvaluationContext,
  ): Promise<PolicyEvaluationResult> {
    const params = this.parseParams(policy);
    const timeInfo = this.getTimeInfo(context.requestTime, params);

    const triggeredRules: string[] = [];
    const dayConfig = this.getDayConfig(timeInfo, params);

    if (!dayConfig.allowed) {
      triggeredRules.push('time_window_day_not_allowed');

      const reason = this.getDisallowedReason(timeInfo, params);

      if (params.offHoursAction === 'reject') {
        const result = this.reject(policy, reason, 60);
        result.triggeredRules = triggeredRules;
        return result;
      }

      if (params.offHoursAction === 'require_approval') {
        const approvalConfig = params.offHoursApproval || {
          mode: ApprovalMode.SINGLE,
          approvers: ['operation_manager'],
          timeoutSeconds: 14400,
        };

        const approvalLevel = this.determineApprovalLevel(context.wallet.tier);
        const result = this.requireApproval(
          policy,
          reason,
          {
            ...approvalConfig,
            allowDelegation: true,
            approvalLevel,
          },
          50,
        );
        result.triggeredRules = triggeredRules;
        return result;
      }

      const result = this.warn(policy, reason, 30);
      result.triggeredRules = triggeredRules;
      return result;
    }

    if (dayConfig.windows && dayConfig.windows.length > 0) {
      const inWindow = this.isInAnyTimeWindow(timeInfo, dayConfig.windows);

      if (!inWindow) {
        triggeredRules.push('time_window_outside_hours');
        const reason = `当前时间 ${this.formatTime(timeInfo)} 不在允许的时间窗口内`;

        if (params.offHoursAction === 'reject') {
          const result = this.reject(policy, reason, 50);
          result.triggeredRules = triggeredRules;
          return result;
        }

        if (params.offHoursAction === 'require_approval') {
          const approvalConfig = params.offHoursApproval || {
            mode: ApprovalMode.SINGLE,
            approvers: ['operation_manager'],
            timeoutSeconds: 14400,
          };

          const approvalLevel = this.determineApprovalLevel(context.wallet.tier);
          const result = this.requireApproval(
            policy,
            reason,
            {
              ...approvalConfig,
              allowDelegation: true,
              approvalLevel,
            },
            40,
          );
          result.triggeredRules = triggeredRules;
          return result;
        }

        const result = this.warn(policy, reason, 25);
        result.triggeredRules = triggeredRules;
        return result;
      }

      triggeredRules.push('time_window_within_hours');
    }

    let riskScore = 10;
    if (dayConfig.riskAdjustment) {
      riskScore = Math.max(0, Math.min(100, riskScore + dayConfig.riskAdjustment));
    }

    if (timeInfo.isWeekend) {
      riskScore += 10;
      triggeredRules.push('time_window_weekend');
    }

    if (timeInfo.isHoliday) {
      riskScore += 15;
      triggeredRules.push('time_window_holiday');
    }

    const result = this.allow(policy, '时间窗口检查通过');
    result.riskScore = Math.min(100, riskScore);
    result.triggeredRules = triggeredRules;
    return result;
  }

  /**
   * 解析策略参数
   */
  private parseParams(policy: SignaturePolicy): TimeWindowPolicyParams {
    return {
      timezone: this.getParam<string>(policy, 'timezone', 'Asia/Shanghai'),
      workdays: this.getParam<TimeWindowDayConfig>(policy, 'workdays', {
        allowed: true,
        windows: ['09:00-18:00'],
      }),
      weekends: this.getParam<TimeWindowDayConfig>(policy, 'weekends', {
        allowed: false,
      }),
      holidays: this.getParam<string[]>(policy, 'holidays', []),
      specialDates: this.getParam<
        Array<{ date: string; config: TimeWindowDayConfig }>
      >(policy, 'specialDates', []),
      offHoursAction: this.getParam<'reject' | 'require_approval' | 'warn'>(
        policy,
        'offHoursAction',
        'require_approval',
      ),
      offHoursApproval: this.getParam<{
        mode: ApprovalMode;
        approvers: string[];
        timeoutSeconds: number;
      }>(policy, 'offHoursApproval', {
        mode: ApprovalMode.SINGLE,
        approvers: ['operation_manager'],
        timeoutSeconds: 14400,
      }),
    };
  }

  /**
   * 获取时间信息
   */
  private getTimeInfo(date: Date, params: TimeWindowPolicyParams): TimeInfo {
    const localDate = this.convertToTimezone(date, params.timezone);
    const dayOfWeek = localDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dateStr = this.formatDateString(localDate);
    const isHoliday = (params.holidays || []).includes(dateStr);
    const isSpecialDate = (params.specialDates || []).some((d) => d.date === dateStr);

    return {
      hour: localDate.getHours(),
      minute: localDate.getMinutes(),
      dayOfWeek,
      date: dateStr,
      isWeekend,
      isHoliday,
      isSpecialDate,
    };
  }

  /**
   * 转换到时区（简化实现，实际应使用 Intl.DateTimeFormat）
   */
  private convertToTimezone(date: Date, timezone: string): Date {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      const parts = formatter.formatToParts(date);
      const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '0';

      return new Date(
        parseInt(getPart('year')),
        parseInt(getPart('month')) - 1,
        parseInt(getPart('day')),
        parseInt(getPart('hour')),
        parseInt(getPart('minute')),
        parseInt(getPart('second')),
      );
    } catch {
      return date;
    }
  }

  /**
   * 格式化日期字符串
   */
  private formatDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 获取当日配置
   */
  private getDayConfig(
    timeInfo: TimeInfo,
    params: TimeWindowPolicyParams,
  ): TimeWindowDayConfig {
    if (timeInfo.isSpecialDate && params.specialDates) {
      const specialDate = params.specialDates.find((d) => d.date === timeInfo.date);
      if (specialDate) {
        return specialDate.config;
      }
    }

    if (timeInfo.isHoliday) {
      return params.weekends || { allowed: false };
    }

    if (timeInfo.isWeekend) {
      return params.weekends || { allowed: false };
    }

    return params.workdays;
  }

  /**
   * 检查是否在任何时间窗口内
   */
  private isInAnyTimeWindow(timeInfo: TimeInfo, windows: string[]): boolean {
    const currentMinutes = timeInfo.hour * 60 + timeInfo.minute;

    for (const window of windows) {
      if (this.isInTimeWindow(currentMinutes, window)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 检查是否在单个时间窗口内
   */
  private isInTimeWindow(currentMinutes: number, window: string): boolean {
    const [startStr, endStr] = window.split('-');
    if (!startStr || !endStr) return false;

    const [startHour, startMin] = startStr.split(':').map(Number);
    const [endHour, endMin] = endStr.split(':').map(Number);

    if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
      return false;
    }

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  }

  /**
   * 获取不允许的原因描述
   */
  private getDisallowedReason(timeInfo: TimeInfo, params: TimeWindowPolicyParams): string {
    if (timeInfo.isSpecialDate) {
      return `特殊日期 ${timeInfo.date} 不允许签名操作`;
    }
    if (timeInfo.isHoliday) {
      return `节假日 ${timeInfo.date} 不允许签名操作`;
    }
    if (timeInfo.isWeekend) {
      return '周末不允许签名操作';
    }
    return '当前时间不允许签名操作';
  }

  /**
   * 格式化时间显示
   */
  private formatTime(timeInfo: TimeInfo): string {
    return `${String(timeInfo.hour).padStart(2, '0')}:${String(timeInfo.minute).padStart(2, '0')}`;
  }

  /**
   * 确定审批级别
   */
  private determineApprovalLevel(tier: WalletTier): number {
    switch (tier) {
      case WalletTier.HOT:
        return 2;
      case WalletTier.WARM:
        return 3;
      case WalletTier.COLD:
        return 4;
      default:
        return 2;
    }
  }

  /**
   * 检查日期是否为工作日
   */
  isWorkDay(date: Date, params: TimeWindowPolicyParams): boolean {
    const timeInfo = this.getTimeInfo(date, params);
    const config = this.getDayConfig(timeInfo, params);
    return config.allowed;
  }

  /**
   * 获取下一个工作时间
   */
  getNextWorkTime(fromDate: Date, params: TimeWindowPolicyParams): Date {
    let checkDate = new Date(fromDate);
    checkDate.setDate(checkDate.getDate() + 1);
    checkDate.setHours(9, 0, 0, 0);

    for (let i = 0; i < 14; i++) {
      const timeInfo = this.getTimeInfo(checkDate, params);
      const config = this.getDayConfig(timeInfo, params);
      if (config.allowed) {
        if (config.windows && config.windows.length > 0) {
          const firstWindow = config.windows[0];
          const [startStr] = firstWindow.split('-');
          const [hour, minute] = startStr.split(':').map(Number);
          checkDate.setHours(hour || 9, minute || 0, 0, 0);
        }
        return checkDate;
      }
      checkDate.setDate(checkDate.getDate() + 1);
    }

    return checkDate;
  }
}
