import express, { type Express } from 'express';
import cors from 'cors';
import { apiRouter } from '@/routes';
import { errorHandler } from '@/middleware/errorHandler';
import { notFoundHandler } from '@/middleware/notFound';
import { API_PREFIX } from '@/helpers/constants';
import { loadEnv } from '@/config/env';

/**
 * Express app factory. Separated from server.ts (which calls .listen)
 * so integration tests can use supertest against the in-memory app.
 */
export function createApp(): Express {
  const env = loadEnv();
  const app = express();

  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  app.use(API_PREFIX, apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
