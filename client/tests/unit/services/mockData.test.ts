import { describe, it, expect } from 'vitest';
import { computeMockConversion, MOCK_RATES } from '@/services/mockData';

describe('computeMockConversion', () => {
  it('converts USD to SGD using the rate table', () => {
    const result = computeMockConversion('USD', 'SGD', 1000);
    expect(result.from).toBe('USD');
    expect(result.to).toBe('SGD');
    expect(result.amount).toBe(1000);
    expect(result.result).toBeCloseTo(1000 * MOCK_RATES.SGD, 6);
    expect(result.rate).toBeCloseTo(MOCK_RATES.SGD, 6);
  });

  it('converts SGD to USD as the inverse rate', () => {
    const result = computeMockConversion('SGD', 'USD', 1000);
    expect(result.rate).toBeCloseTo(1 / MOCK_RATES.SGD, 6);
    expect(result.result).toBeCloseTo(1000 / MOCK_RATES.SGD, 6);
  });

  it('returns rate of 1 for same-currency conversion', () => {
    const result = computeMockConversion('USD', 'USD', 500);
    expect(result.rate).toBe(1);
    expect(result.result).toBe(500);
  });

  it('throws for unknown currency', () => {
    expect(() => computeMockConversion('USD', 'ZZZ', 100)).toThrow();
    expect(() => computeMockConversion('XYZ', 'USD', 100)).toThrow();
  });
});
