import { describe, it, expect } from 'vitest';
import {
  decAdd,
  decSub,
  decMul,
  decDiv,
  decCmp,
  decIsZero,
  decIsPositive,
  decIsNegative,
  decGte,
  decLte,
  decGt,
  decLt,
  decMin,
  decMax,
  decAbs,
  decTruncate,
  decMultipleOf,
  decNormalize,
} from '@/lib/matching/decimal';

describe('decimal 工具函数', () => {
  describe('decAdd', () => {
    it('正数相加', () => {
      expect(decAdd('1', '2')).toBe('3');
      expect(decAdd('0.1', '0.2')).toBe('0.300000000000000000');
    });

    it('负数相加', () => {
      expect(decAdd('-1', '-2')).toBe('-3');
    });

    it('正负数相加', () => {
      expect(decAdd('5', '-3')).toBe('2');
      expect(decAdd('3', '-5')).toBe('-2');
    });

    it('零相加', () => {
      expect(decAdd('0', '5')).toBe('5');
      expect(decAdd('5', '0')).toBe('5');
    });
  });

  describe('decSub', () => {
    it('正数相减', () => {
      expect(decSub('5', '3')).toBe('2');
      expect(decSub('3', '5')).toBe('-2');
    });

    it('负数相减', () => {
      expect(decSub('-5', '-3')).toBe('-2');
      expect(decSub('-3', '-5')).toBe('2');
    });
  });

  describe('decMul', () => {
    it('正数相乘', () => {
      expect(decMul('2', '3')).toBe('6');
      expect(decMul('0.5', '0.5')).toBe('0.25');
    });

    it('负数相乘', () => {
      expect(decMul('-2', '3')).toBe('-6');
      expect(decMul('-2', '-3')).toBe('6');
    });

    it('零相乘', () => {
      expect(decMul('0', '5')).toBe('0');
    });
  });

  describe('decDiv', () => {
    it('正数相除', () => {
      expect(decDiv('6', '2')).toBe('3');
      expect(decDiv('1', '4')).toBe('0.25');
    });

    it('指定精度', () => {
      expect(decDiv('1', '3', 4)).toBe('0.3333');
    });

    it('负数相除', () => {
      expect(decDiv('-6', '2')).toBe('-3');
      expect(decDiv('-6', '-2')).toBe('3');
    });
  });

  describe('decCmp', () => {
    it('比较大小', () => {
      expect(decCmp('5', '3')).toBe(1);
      expect(decCmp('3', '5')).toBe(-1);
      expect(decCmp('5', '5')).toBe(0);
      expect(decCmp('-5', '3')).toBe(-1);
      expect(decCmp('-3', '-5')).toBe(1);
    });
  });

  describe('decIsZero / decIsPositive / decIsNegative', () => {
    it('零判断', () => {
      expect(decIsZero('0')).toBe(true);
      expect(decIsZero('0.0')).toBe(true);
      expect(decIsZero('5')).toBe(false);
    });

    it('正数判断', () => {
      expect(decIsPositive('5')).toBe(true);
      expect(decIsPositive('0')).toBe(false);
      expect(decIsPositive('-5')).toBe(false);
    });

    it('负数判断', () => {
      expect(decIsNegative('-5')).toBe(true);
      expect(decIsNegative('0')).toBe(false);
      expect(decIsNegative('5')).toBe(false);
    });
  });

  describe('decGte / decLte / decGt / decLt', () => {
    it('大于等于', () => {
      expect(decGte('5', '3')).toBe(true);
      expect(decGte('5', '5')).toBe(true);
      expect(decGte('3', '5')).toBe(false);
    });

    it('小于等于', () => {
      expect(decLte('3', '5')).toBe(true);
      expect(decLte('5', '5')).toBe(true);
      expect(decLte('5', '3')).toBe(false);
    });

    it('大于', () => {
      expect(decGt('5', '3')).toBe(true);
      expect(decGt('5', '5')).toBe(false);
    });

    it('小于', () => {
      expect(decLt('3', '5')).toBe(true);
      expect(decLt('5', '5')).toBe(false);
    });
  });

  describe('decMin / decMax', () => {
    it('取最小值', () => {
      expect(decMin('3', '5')).toBe('3');
      expect(decMin('-3', '5')).toBe('-3');
    });

    it('取最大值', () => {
      expect(decMax('3', '5')).toBe('5');
      expect(decMax('-3', '5')).toBe('5');
    });
  });

  describe('decAbs', () => {
    it('取绝对值', () => {
      expect(decAbs('5')).toBe('5');
      expect(decAbs('-5')).toBe('5');
      expect(decAbs('0')).toBe('0');
    });
  });

  describe('decTruncate', () => {
    it('截断小数位', () => {
      expect(decTruncate('3.1415926', 2)).toBe('3.14');
      expect(decTruncate('3.1415926', 4)).toBe('3.1415');
      expect(decTruncate('-3.1415926', 2)).toBe('-3.14');
    });

    it('整数截断不变', () => {
      expect(decTruncate('100', 2)).toBe('100');
    });
  });

  describe('decMultipleOf', () => {
    it('判断是否为步长整数倍', () => {
      expect(decMultipleOf('10', '5')).toBe(true);
      expect(decMultipleOf('10.5', '0.5')).toBe(true);
      expect(decMultipleOf('10.3', '0.5')).toBe(false);
    });
  });

  describe('decNormalize', () => {
    it('规范化数字格式', () => {
      expect(decNormalize('000123.45000')).toBe('123.45');
      expect(decNormalize('0.0')).toBe('0');
      expect(decNormalize('100')).toBe('100');
    });
  });
});
