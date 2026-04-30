import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';
import { ERROR_CODES, HTTP_STATUS } from '@/helpers/constants';
import type { ApiErrorResponse } from '@/types/api.types';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (ApiError.isApiError(err)) {
    const body: ApiErrorResponse = {
      error: true,
      code: err.code,
      message: err.message,
    };
    res.status(err.statusCode).json(body);
    return;
  }

  const errorMessage = err instanceof Error ? err.message : String(err);
  logger.error('Unhandled error', { message: errorMessage });

  const body: ApiErrorResponse = {
    error: true,
    code: ERROR_CODES.INTERNAL_ERROR,
    message: 'An unexpected error occurred',
  };
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(body);
}
