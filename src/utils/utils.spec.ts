import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { hash, parseAxiosError } from './utils';

describe('hash', () => {
  const btoaRef = btoa;
  it('should still Hash if the btao function is not available', () => {
    global.btoa = undefined as unknown as typeof btoaRef;
    const hashResponse = hash('key', 'secret');
    expect(hashResponse).toBe('a2V5OnNlY3JldA==');
    global.btoa = btoaRef;
  });
});

describe('parseAxiosError', () => {
  it('should return initial obj if not instance of axios error', () => {
    const initialObj = { key: 'ERROR_100' };
    const parsedResponse = parseAxiosError(initialObj);
    expect(parsedResponse).toBe(initialObj);
  });

  it('should have the configuration failed message when config failed', () => {
    const message = 'configuration failed';
    const parsedResponse = parseAxiosError(
      new AxiosError(message) as unknown as Record<string, unknown>
    );
    expect(parsedResponse).toEqual({
      configFailed: message,
    });
  });

  it('should return request failed when axios is unable to send the request.', () => {
    const request = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const config = <InternalAxiosRequestConfig>{
      headers: request.headers,
    };
    const parsedResponse = parseAxiosError(
      new AxiosError('message', '400', config, request) as unknown as Record<
        string,
        unknown
      >
    );
    expect(parsedResponse).toEqual({
      requestFailed: {
        data: undefined,
        headers: request.headers,
      },
    });
  });

  it('should return response error when the request response fail to be retrieve.', () => {
    const request = {
      headers: {
        'Content-Type': 'application/json',
      },
      body: '',
    };
    const response = <AxiosResponse>{
      data: '',
      status: 201,
      statusText: 'created',
      headers: {},
      request: request,
    };

    const config = <InternalAxiosRequestConfig>{
      headers: request.headers,
      data: request.body,
    };
    const parsedResponse = parseAxiosError(
      new AxiosError(
        'message',
        '400',
        config,
        request,
        response
      ) as unknown as Record<string, unknown>
    );
    expect(parsedResponse).toEqual({
      requestHeader: request.headers,
      responseData: response.data,
      responseStatus: response.status,
      responseStatusText: response.statusText,
      responseHeaders: response.headers,
      requestBody: request.body,
    });
  });
});
