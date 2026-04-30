import { Router } from 'express';
import { getHealth } from '@/controllers/health.controller';
import { getCurrencies } from '@/controllers/currencies.controller';
import { getRates } from '@/controllers/rates.controller';
import { getConvert } from '@/controllers/convert.controller';
import { validateConvert } from '@/middleware/validateConvert';
import { ROUTES } from '@/helpers/constants';

const router = Router();

router.get(ROUTES.health, getHealth);
router.get(ROUTES.currencies, getCurrencies);
router.get(ROUTES.rates, getRates);
router.get(ROUTES.convert, validateConvert, getConvert);

export { router as apiRouter };
