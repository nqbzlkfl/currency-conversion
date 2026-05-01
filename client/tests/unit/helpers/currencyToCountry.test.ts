import { describe, it, expect } from 'vitest';
import { getCountryCode, FALLBACK_COUNTRY_CODE } from '@/helpers/currencyToCountry';

describe('getCountryCode', () => {
  it('maps common currencies to ISO 3166 codes', () => {
    expect(getCountryCode('USD')).toBe('US');
    expect(getCountryCode('SGD')).toBe('SG');
    expect(getCountryCode('MYR')).toBe('MY');
    expect(getCountryCode('JPY')).toBe('JP');
    expect(getCountryCode('GBP')).toBe('GB');
  });

  it('maps EUR to the EU regional code', () => {
    expect(getCountryCode('EUR')).toBe('EU');
  });

  it('handles lowercase input', () => {
    expect(getCountryCode('usd')).toBe('US');
  });

  it('returns fallback for unmapped codes', () => {
    expect(getCountryCode('XYZ')).toBe(FALLBACK_COUNTRY_CODE);
    expect(getCountryCode('ZZZ')).toBe(FALLBACK_COUNTRY_CODE);
  });
});
