export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export const log = (
  level: LogLevel,
  message: string,
  meta: Record<string, any> = {}
) => {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };
  // In prod this goes to ELK/Datadog/etc.
  console.log(JSON.stringify(payload));
};
