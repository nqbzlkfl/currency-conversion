type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

type LogContext = Record<string, unknown>;

function isLevelEnabled(level: LogLevel, configured: LogLevel): boolean {
  return LEVEL_PRIORITY[level] <= LEVEL_PRIORITY[configured];
}

function getConfiguredLevel(): LogLevel {
  const raw = process.env.LOG_LEVEL?.toLowerCase();
  if (raw === 'error' || raw === 'warn' || raw === 'info' || raw === 'debug') {
    return raw;
  }
  return 'info';
}

function isProduction(): boolean {
  const env = process.env.APP_ENV?.toLowerCase();
  return env === 'preprod' || env === 'prod';
}

function format(level: LogLevel, message: string, context?: LogContext): string {
  if (isProduction()) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    });
  }
  const ctxStr = context ? ` ${JSON.stringify(context)}` : '';
  return `[${level}] ${message}${ctxStr}`;
}

function emit(level: LogLevel, message: string, context?: LogContext): void {
  if (!isLevelEnabled(level, getConfiguredLevel())) return;
  const line = format(level, message, context);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  error: (message: string, context?: LogContext) => emit('error', message, context),
  warn: (message: string, context?: LogContext) => emit('warn', message, context),
  info: (message: string, context?: LogContext) => emit('info', message, context),
  debug: (message: string, context?: LogContext) => emit('debug', message, context),
};
