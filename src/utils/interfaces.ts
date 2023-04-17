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

export type Token = {
  access_token: 'string';
  token_type: 'string';
  expires_in: 0;
};

export type BaseLogger = {
  log: (context: string, type: LogType, ...args: unknown[]) => void;
};

export type RoutesImpl<T extends object> = Record<keyof T, unknown>;
