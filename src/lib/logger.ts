/* Minimal server logger. Structured enough for Railway logs, no dependency. */
type Level = 'info' | 'warn' | 'error';

function emit(level: Level, msg: string, meta?: unknown) {
  const line = `[${level.toUpperCase()}] ${msg}`;
  if (level === 'error') console.error(line, meta ?? '');
  else if (level === 'warn') console.warn(line, meta ?? '');
  else console.log(line, meta ?? '');
}

const logger = {
  info: (msg: string, meta?: unknown) => emit('info', msg, meta),
  warn: (msg: string, meta?: unknown) => emit('warn', msg, meta),
  error: (msg: string, meta?: unknown) => emit('error', msg, meta),
};

export default logger;
