import type { Request, Response, NextFunction } from 'express';
import { oxrService } from '@/services/oxr.service';
import type { RatesResponse } from '@/types/api.types';

export async function getRates(
  _req: Request,
  res: Response<RatesResponse>,
  next: NextFunction,
): Promise<void> {
  try {
    const payload = await oxrService.getRates();
    res.json({
      base: payload.base,
      timestamp: payload.timestamp,
      rates: payload.rates,
    });
  } catch (err) {
    next(err);
  }
}
