import { LogType } from './constants';
import { BaseLogger } from './interfaces';

export type LoggerI = Record<LogType, (...args: unknown[]) => void>;

export class Logger implements LoggerI {
  private readonly context: string;
  constructor(private baseLogger: BaseLogger, context = '') {
    this.context = context.trim();
  }

  of(context: string): Logger {
    return new Logger(
      this.baseLogger,
      this.context.length > 0 ? `${this.context}.${context}` : `${context}`
    );
  }

  debug(...args: unknown[]) {
    this.baseLogger.log(this.context, LogType.debug, ...args);
  }

  info(...args: unknown[]) {
    this.baseLogger.log(this.context, LogType.info, ...args);
  }

  error(...args: unknown[]) {
    this.baseLogger.log(this.context, LogType.error, ...args);
  }
}
