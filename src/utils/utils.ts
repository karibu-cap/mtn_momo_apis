import { AxiosError, classTransformer, validator } from '../deps/deps';

/**
 * Returns a validated instance of the provided class.
 * @param {T} plain The object source to validate
 * @param {classTransformer.ClassConstructor<T>} cls The class type needed for the returned instance.
 * @return {T}
 */
export function validInstanceOf<T extends object>(
  plain: T,
  cls: classTransformer.ClassConstructor<T>
): T {
  const instance = classTransformer.plainToInstance(cls, plain);
  const validationResponse = validator.validateSync(instance);
  if (validationResponse.length > 0) {
    throw { errors: validationResponse };
  }

  return instance;
}

/**
 * Returns the base 64 hash code for the provided data.
 * @param {string} key The login or customer key.
 * @param {string} secret The password or customer secret.
 * @returns
 */
export function hash(key: string, secret: string): string {
  const toHash = `${key}:${secret}`;
  if (!btoa) {
    return Buffer.from(toHash).toString('base64');
  }
  return btoa(toHash);
}

/**
 * Parse a given axios error.
 * @param error The error that occurred.
 * @returns The passed error if error instanceof AxiosError.
 */
export function parseAxiosError(
  error: Record<string, unknown>
): Record<string, unknown> {
  let err = error;
  if (error instanceof AxiosError) {
    if (error.response) {
      err = {
        responseError: {
          data: error.response.data,
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
        },
        requestBody: error.request.body,
      };
    } else if (error.request) {
      err = {
        requestFailed: {
          headers: error.config.headers,
          data: error.config.data,
        },
      };
    } else {
      err = {
        configFailed: error.message,
      };
    }
  }
  return err;
}
