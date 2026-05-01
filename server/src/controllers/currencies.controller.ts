import type { Request, Response, NextFunction } from 'express';
import { oxrService } from '@/services/oxr.service';
import type { CurrenciesResponse, Currency } from '@/types/api.types';

export async function getCurrencies(
  _req: Request,
  res: Response<CurrenciesResponse>,
  next: NextFunction,
): Promise<void> {
  try {
    const [namesMap, ratesPayload] = await Promise.all([
      oxrService.getCurrencies(),
      oxrService.getRates(),
    ]);

    const supported: Currency[] = Object.keys(ratesPayload.rates)
      .filter((code) => namesMap[code] !== undefined)
      .map((code) => ({ code, name: namesMap[code] }))
      .sort((a, b) => a.code.localeCompare(b.code));

    res.json({ currencies: supported });
  } catch (err) {
    next(err);
  }
}
