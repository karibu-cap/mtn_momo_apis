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
 * Encode the data to w3 x form encoded url.
 * @param {Record<string, string>} data the data to encode.
 * @return {string} the encoded value.
 */
export function encodeDataToXFormUrl(data: Record<string, string>): string {
  const segments: string[] = [];
  for (const key in data) {
    if (Object.hasOwnProperty.call(data, key)) {
      const encodedKey = encodeURIComponent(key);
      const encodedValue = encodeURIComponent(data[key]);
      segments.push(`${encodedKey}=${encodedValue}`);
    }
  }
  return segments.join('&');
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
        requestFailed: error.request,
      };
    } else {
      err = {
        configFailed: error.message,
      };
    }
  }
  return err;
}
