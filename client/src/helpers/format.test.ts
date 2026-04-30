import { describe, it, expect } from 'vitest';
import {
  formatAmount,
  formatRate,
  parseAmount,
  formatAmountInput,
} from '@/helpers/format';

describe('formatAmount', () => {
  it('formats integers with two decimals and thousand separators', () => {
    expect(formatAmount(1000)).toBe('1,000.00');
    expect(formatAmount(1234567)).toBe('1,234,567.00');
  });

  it('formats fractional values to exactly two decimals', () => {
    expect(formatAmount(1234.5)).toBe('1,234.50');
    expect(formatAmount(0.1)).toBe('0.10');
  });

  it('returns empty string for non-finite input', () => {
    expect(formatAmount(NaN)).toBe('');
    expect(formatAmount(Infinity)).toBe('');
  });
});

describe('formatRate', () => {
  it('formats rate to four decimals', () => {
    expect(formatRate(1.36)).toBe('1.3600');
    expect(formatRate(0.7353)).toBe('0.7353');
  });
});

describe('parseAmount', () => {
  it('strips thousand separators', () => {
    expect(parseAmount('1,000.50')).toBe(1000.5);
    expect(parseAmount('1,234,567')).toBe(1234567);
  });

  it('returns 0 for empty input per FSD §5', () => {
    expect(parseAmount('')).toBe(0);
  });

  it('returns 0 for negative values (negatives disallowed per FSD)', () => {
    expect(parseAmount('-50')).toBe(0);
  });

  it('returns 0 for non-numeric input', () => {
    expect(parseAmount('abc')).toBe(0);
  });
});

describe('formatAmountInput', () => {
  it('inserts thousand separators while typing', () => {
    expect(formatAmountInput('1000')).toBe('1,000');
    expect(formatAmountInput('1234567')).toBe('1,234,567');
  });

  it('preserves a partial decimal portion', () => {
    expect(formatAmountInput('1000.5')).toBe('1,000.5');
  });

  it('truncates decimals beyond two places', () => {
    expect(formatAmountInput('1000.567')).toBe('1,000.56');
  });

  it('drops non-numeric characters', () => {
    expect(formatAmountInput('1a0b0c0')).toBe('1,000');
  });

  it('drops a typed minus sign', () => {
    expect(formatAmountInput('-50')).toBe('50');
  });

  it('returns empty string for empty input', () => {
    expect(formatAmountInput('')).toBe('');
  });
});
