import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/utils/ApiError';
import { CURRENCY_CODE_LENGTH, ERROR_CODES, HTTP_STATUS } from '@/helpers/constants';

const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;

function fail(code: typeof ERROR_CODES[keyof typeof ERROR_CODES], message: string): never {
  throw new ApiError(HTTP_STATUS.BAD_REQUEST, code, message);
}

function validateCurrencyParam(name: 'from' | 'to', raw: unknown): string {
  if (raw === undefined || raw === null || raw === '') {
    fail(ERROR_CODES.MISSING_PARAM, `${name} is required`);
  }
  if (typeof raw !== 'string') {
    fail(ERROR_CODES.INVALID_CURRENCY, `${name} must be a 3-letter currency code`);
  }
  const normalised = raw.toUpperCase();
  if (
    normalised.length !== CURRENCY_CODE_LENGTH ||
    !CURRENCY_CODE_PATTERN.test(normalised)
  ) {
    fail(ERROR_CODES.INVALID_CURRENCY, `${name} must be a 3-letter currency code`);
  }
  return normalised;
}

function validateAmountParam(raw: unknown): number {
  if (raw === undefined || raw === null || raw === '') {
    fail(ERROR_CODES.MISSING_PARAM, 'amount is required');
  }
  if (typeof raw !== 'string') {
    fail(ERROR_CODES.INVALID_AMOUNT, 'amount must be a finite number');
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    fail(ERROR_CODES.INVALID_AMOUNT, 'amount must be a finite number');
  }
  if (parsed < 0) {
    fail(ERROR_CODES.INVALID_AMOUNT, 'amount must be non-negative');
  }
  return parsed;
}

export type ValidatedConvertParams = {
  from: string;
  to: string;
  amount: number;
};

declare module 'express-serve-static-core' {
  interface Locals {
    validated?: ValidatedConvertParams;
  }
}

export function validateConvert(req: Request, res: Response, next: NextFunction): void {
  try {
    const validated: ValidatedConvertParams = {
      from: validateCurrencyParam('from', req.query.from),
      to: validateCurrencyParam('to', req.query.to),
      amount: validateAmountParam(req.query.amount),
    };
    res.locals.validated = validated;
    next();
  } catch (err) {
    next(err);
  }
}
