import type { Request, Response, NextFunction } from 'express';
import { oxrService } from '@/services/oxr.service';
import { convert } from '@/services/conversion.service';
import { ApiError } from '@/utils/ApiError';
import { ERROR_CODES, HTTP_STATUS } from '@/helpers/constants';
import type { ConvertResponse } from '@/types/api.types';
import type { ValidatedConvertParams } from '@/middleware/validateConvert';

export async function getConvert(
  _req: Request,
  res: Response<ConvertResponse>,
  next: NextFunction,
): Promise<void> {
  try {
    const validated = res.locals.validated as ValidatedConvertParams | undefined;
    if (!validated) {
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.INTERNAL_ERROR,
        'Validated params missing',
      );
    }

    const { from, to, amount } = validated;
    const ratesPayload = await oxrService.getRates();
    const { result, rate } = convert(amount, from, to, ratesPayload.rates);

    res.json({
      from,
      to,
      amount,
      result,
      rate,
      timestamp: ratesPayload.timestamp,
    });
  } catch (err) {
    next(err);
  }
}
