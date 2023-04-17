import { ValidationError } from 'class-validator';
import { axios, AxiosResponse } from '../deps/deps';
import { XTargetEnvironment } from './constants';
import { Logger } from './logger';
import { transferOrRequestToPay } from './transfer-or-request-to-pay-handler';

describe('transferOrRequestToPay', () => {
  const PAYMENT_REF01 = 'd1b9cc0a-0728-4398-8d5b-2b3947e073a9';

  it('should fail on invalid parameter provided', async () => {
    const { error, data, raw } = await transferOrRequestToPay({
      amount: 0,
      createAccessToken: () => Promise.reject({}),
      endPoint: '',
      externalId: '',
      logger: new Logger({ log: console.log }),
      ocpApimSubscriptionKey: '',
      payeeNote: '',
      payerMessage: '',
      targetEnvironment: XTargetEnvironment.mtnBenin,
      referenceId: '',
    });

    expect(data).not.toBeDefined();
    expect(raw).not.toBeDefined();
    expect(error).toBeDefined();
    expect((error as Record<string, unknown>).errors).toHaveLength(6);
  });

  it('should fail when neither payerId nor payeeId is provided', async () => {
    const { error, data, raw } = await transferOrRequestToPay({
      amount: 1,
      createAccessToken: () => Promise.reject({}),
      endPoint: 'https://example.com',
      externalId: 'EXTERNAL_ID_ENV',
      logger: new Logger({ log: console.log }),
      ocpApimSubscriptionKey: 'OC_APIM_SUBSCRIPTION_KEY',
      payeeNote: '',
      payerMessage: '',
      targetEnvironment: XTargetEnvironment.mtnBenin,
      referenceId: PAYMENT_REF01,
    });

    expect(data).not.toBeDefined();
    expect(raw).not.toBeDefined();
    expect(error).toBeDefined();
    expect((error as Record<string, unknown>).errors).toHaveLength(1);
    expect(
      (error as Record<string, ValidationError[]>).errors[0].constraints
    ).toEqual({
      ValidityCheck: 'One of payerId or payeeId must be provided',
    });
  });
  it('should fail when both payerId and payeeId are provided', async () => {
    const { error, data, raw } = await transferOrRequestToPay({
      amount: 1,
      createAccessToken: () => Promise.reject({}),
      endPoint: 'https://example.com',
      externalId: 'EXTERNAL_ID_ENV',
      logger: new Logger({ log: console.log }),
      ocpApimSubscriptionKey: 'OC_APIM_SUBSCRIPTION_KEY',
      payeeNote: '',
      payerMessage: '',
      payeeId: '10001000',
      payerId: '100200300',
      targetEnvironment: XTargetEnvironment.mtnBenin,
      referenceId: PAYMENT_REF01,
    });

    expect(data).not.toBeDefined();
    expect(raw).not.toBeDefined();
    expect(error).toBeDefined();
    expect((error as Record<string, unknown>).errors).toHaveLength(1);
    expect(
      (error as Record<string, ValidationError[]>).errors[0].constraints
    ).toEqual({
      ValidityCheck: 'Only one of payerId or payeeId must be provided',
    });
  });
  it('should fail on invalid phone number provided provided', async () => {
    const { error, data, raw } = await transferOrRequestToPay({
      amount: 1,
      createAccessToken: () => Promise.reject({}),
      endPoint: 'https://example.com',
      externalId: 'EXTERNAL_ID_ENV',
      logger: new Logger({ log: console.log }),
      ocpApimSubscriptionKey: 'OC_APIM_SUBSCRIPTION_KEY',
      payeeNote: '',
      payerMessage: '',
      payerId: '123456789',
      targetEnvironment: XTargetEnvironment.mtnCameroon,
      referenceId: PAYMENT_REF01,
    });

    expect(data).not.toBeDefined();
    expect(raw).not.toBeDefined();
    expect(error).toBeDefined();
    expect((error as Error).message).toEqual(
      'The provided payerId:"123456789" do not match phone number of the target environment:mtncameroon'
    );
  });
  it('should fail on access token creation failure', async () => {
    const { error, data, raw } = await transferOrRequestToPay({
      amount: 1,
      createAccessToken: () => Promise.resolve({ error: {} }),
      endPoint: 'https://example.com',
      externalId: 'EXTERNAL_ID_ENV',
      logger: new Logger({ log: console.log }),
      ocpApimSubscriptionKey: 'OC_APIM_SUBSCRIPTION_KEY',
      payeeNote: '',
      payerMessage: '',
      payerId: '612345678',
      targetEnvironment: XTargetEnvironment.mtnCameroon,
      referenceId: PAYMENT_REF01,
    });

    expect(data).not.toBeDefined();
    expect(raw).not.toBeDefined();
    expect(error).toBeDefined();
    expect((error as Error).message).toEqual('failed to generate token');
  });
  it('should fail on request failure', async () => {
    const postSpy = jest
      .spyOn(axios, 'post')
      .mockImplementation()
      .mockRejectedValue(<AxiosResponse>{
        data: {},
      });
    const { error, data, raw } = await transferOrRequestToPay({
      amount: 1,
      createAccessToken: () =>
        Promise.resolve({
          data: 'THE_ACCESS_TOKEN',
          raw: { access_token: 'ad', token_type: '', expires_in: 300 },
        }),
      endPoint: 'https://example.com',
      externalId: 'EXTERNAL_ID_ENV',
      logger: new Logger({ log: console.log }),
      ocpApimSubscriptionKey: 'OC_APIM_SUBSCRIPTION_KEY',
      payeeNote: '',
      payerMessage: '',
      payerId: '612345678',
      targetEnvironment: XTargetEnvironment.mtnCameroon,
      referenceId: PAYMENT_REF01,
    });

    expect(data).not.toBeDefined();
    expect(raw).not.toBeDefined();
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(error).toBeDefined();
    expect((error as Error).message).toEqual(
      'Error occurred while posting the request'
    );
  });
  it('should succeed on request succeed', async () => {
    const postSpy = jest
      .spyOn(axios, 'post')
      .mockImplementation()
      .mockResolvedValue(<AxiosResponse>{
        data: {},
      });
    const { error, data, raw } = await transferOrRequestToPay({
      amount: 1,
      createAccessToken: () =>
        Promise.resolve({
          data: 'THE_ACCESS_TOKEN',
          raw: { access_token: 'ad', token_type: '', expires_in: 300 },
        }),
      endPoint: 'https://example.com',
      externalId: 'EXTERNAL_ID_ENV',
      logger: new Logger({ log: console.log }),
      ocpApimSubscriptionKey: 'OC_APIM_SUBSCRIPTION_KEY',
      payeeNote: '',
      payerMessage: '',
      payerId: '612345678',
      targetEnvironment: XTargetEnvironment.mtnCameroon,
      referenceId: PAYMENT_REF01,
    });

    expect(error).not.toBeDefined();
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(raw).toEqual({});
    expect(data).toBe(null);
  });
});
