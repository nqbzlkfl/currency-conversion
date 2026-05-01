import { ApiError } from '@/utils/ApiError';
import { ERROR_CODES, HTTP_STATUS } from '@/helpers/constants';

export type ConversionResult = {
  result: number;
  rate: number;
};

export function convert(
  amount: number,
  from: string,
  to: string,
  rates: Readonly<Record<string, number>>,
): ConversionResult {
  const rateFrom = rates[from];
  const rateTo = rates[to];

  if (rateFrom === undefined) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.UNKNOWN_CURRENCY,
      `Currency ${from} is not supported`,
    );
  }
  if (rateTo === undefined) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.UNKNOWN_CURRENCY,
      `Currency ${to} is not supported`,
    );
  }

  const rate = rateTo / rateFrom;
  const result = amount * rate;
  return { result, rate };
}
