import {
  AMOUNT_DECIMAL_PLACES,
  RATE_DECIMAL_PLACES,
  NUMBER_LOCALE,
} from '@/helpers/constants';

export function formatAmount(value: number): string {
  if (!Number.isFinite(value)) return '';
  return value.toLocaleString(NUMBER_LOCALE, {
    minimumFractionDigits: AMOUNT_DECIMAL_PLACES,
    maximumFractionDigits: AMOUNT_DECIMAL_PLACES,
  });
}

export function formatRate(value: number): string {
  if (!Number.isFinite(value)) return '';
  return value.toLocaleString(NUMBER_LOCALE, {
    minimumFractionDigits: RATE_DECIMAL_PLACES,
    maximumFractionDigits: RATE_DECIMAL_PLACES,
  });
}

export function parseAmount(input: string): number {
  if (!input) return 0;
  const cleaned = input.replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

/**
 * Format a partially-typed amount for the input field. Inserts thousand
 * separators on the integer part while preserving in-progress decimal
 * input. Truncates (does not round) decimals beyond AMOUNT_DECIMAL_PLACES.
 */
export function formatAmountInput(rawInput: string): string {
  const sanitised = rawInput.replace(/[^0-9.]/g, '');
  if (!sanitised) return '';

  const [integerPart, ...decimalParts] = sanitised.split('.');
  const integerNumber = parseInt(integerPart || '0', 10);
  const formattedInteger = Number.isFinite(integerNumber)
    ? integerNumber.toLocaleString(NUMBER_LOCALE)
    : '0';

  if (decimalParts.length === 0) return formattedInteger;

  const decimalDigits = decimalParts[0].slice(0, AMOUNT_DECIMAL_PLACES);
  return `${formattedInteger}.${decimalDigits}`;
}
