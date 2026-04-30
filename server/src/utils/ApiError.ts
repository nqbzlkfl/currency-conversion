import { ERROR_CODES, type ErrorCode } from '@/helpers/constants';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;

  constructor(statusCode: number, code: ErrorCode, message: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }

  static isApiError(err: unknown): err is ApiError {
    return err instanceof ApiError;
  }
}

export { ERROR_CODES };
