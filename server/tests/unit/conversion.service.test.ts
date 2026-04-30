import { describe, it, expect } from 'vitest';
import { convert } from '@/services/conversion.service';
import { ApiError } from '@/utils/ApiError';
import { ERROR_CODES } from '@/helpers/constants';

const RATES = {
  USD: 1.0,
  SGD: 1.36,
  EUR: 0.92,
  MYR: 4.725,
};

describe('convert', () => {
  it('converts USD to SGD using the rate ratio', () => {
    const { result, rate } = convert(1000, 'USD', 'SGD', RATES);
    expect(rate).toBeCloseTo(1.36, 6);
    expect(result).toBeCloseTo(1360, 6);
  });

  it('converts SGD to USD as the inverse', () => {
    const { result, rate } = convert(1360, 'SGD', 'USD', RATES);
    expect(rate).toBeCloseTo(1 / 1.36, 6);
    expect(result).toBeCloseTo(1000, 6);
  });

  it('handles cross-currency via implicit USD base (EUR to MYR)', () => {
    const { rate } = convert(100, 'EUR', 'MYR', RATES);
    expect(rate).toBeCloseTo(RATES.MYR / RATES.EUR, 6);
  });

  it('returns rate of 1 for same-currency conversion', () => {
    const { result, rate } = convert(500, 'USD', 'USD', RATES);
    expect(rate).toBe(1);
    expect(result).toBe(500);
  });

  it('handles zero amount', () => {
    const { result, rate } = convert(0, 'USD', 'SGD', RATES);
    expect(result).toBe(0);
    expect(rate).toBeCloseTo(1.36, 6);
  });

  it('throws UNKNOWN_CURRENCY for missing from-rate', () => {
    expect(() => convert(100, 'ZZZ', 'USD', RATES)).toThrow(ApiError);
    try {
      convert(100, 'ZZZ', 'USD', RATES);
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).code).toBe(ERROR_CODES.UNKNOWN_CURRENCY);
      expect((err as ApiError).statusCode).toBe(404);
    }
  });

  it('throws UNKNOWN_CURRENCY for missing to-rate', () => {
    expect(() => convert(100, 'USD', 'XYZ', RATES)).toThrow(ApiError);
  });
});
