import { LogType } from './constants';

export type MethodResponse<T, T2 = unknown> = Promise<
  | {
      data: T;
      raw: T2;
      error?: undefined;
    }
  | {
      data?: undefined;
      raw?: undefined;
      error: object;
    }
>;

export type BaseLogger = {
  log: (context: string, type: LogType, ...args: unknown[]) => void;
};

export type RoutesImpl<T extends object> = Record<keyof T, unknown>;
