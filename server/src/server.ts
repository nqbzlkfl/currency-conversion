import { createApp } from './app';
import { loadEnv } from './config/env';
import { logger } from './utils/logger';

function bootstrap(): void {
  let env;
  try {
    env = loadEnv();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Failed to load environment: ${message}`);
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info('Server started', {
      appEnv: env.appEnv,
      port: env.port,
      // Never log the full App ID
      oxrAppIdSuffix: env.oxrAppId.slice(-4),
    });
  });

  const shutdown = (signal: string) => {
    logger.info('Shutdown signal received', { signal });
    server.close((err) => {
      if (err) {
        logger.error('Error during shutdown', { message: err.message });
        process.exit(1);
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap();
