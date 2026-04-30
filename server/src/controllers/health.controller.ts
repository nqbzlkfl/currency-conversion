import type { Request, Response } from 'express';
import type { HealthResponse } from '@/types/api.types';

const SECONDS_PRECISION = 1;

export function getHealth(_req: Request, res: Response<HealthResponse>): void {
  const uptime = Number(process.uptime().toFixed(SECONDS_PRECISION));
  res.json({ status: 'ok', uptime });
}
