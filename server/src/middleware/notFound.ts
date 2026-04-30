import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/utils/ApiError';
import { ERROR_CODES, HTTP_STATUS } from '@/helpers/constants';
import type { ApiErrorResponse } from '@/types/api.types';

export function notFoundHandler(_req: Request, res: Response, _next: NextFunction): void {
  const error = new ApiError(
    HTTP_STATUS.NOT_FOUND,
    ERROR_CODES.NOT_FOUND,
    'Resource not found',
  );
  const body: ApiErrorResponse = {
    error: true,
    code: error.code,
    message: error.message,
  };
  res.status(error.statusCode).json(body);
}
