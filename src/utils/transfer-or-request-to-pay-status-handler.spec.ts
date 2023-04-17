import { ValidationError } from 'class-validator';
import { axios, AxiosResponse } from '../deps/deps';
import { Status, XTargetEnvironment } from './constants';
import { Logger } from './logger';
import { transferOrRequestToPayTransactionStatus } from './transfer-or-request-to-pay-status-handler';

describe('transferOrRequestToPayTransactionStatus', () => {
  const PAYMENT_REF01 = 'd1b9cc0a-0728-4398-8d5b-2b3947e073a9';

  it('should fail on invalid parameter provided', async () => {
    const { error, data, raw } = await transferOrRequestToPayTransactionStatus({
      createAccessToken: () => Promise.reject({}),
      getEndPoint: ()=>'',
      logger: new Logger({ log() {} }),
      ocpApimSubscriptionKey: '',
      targetEnvironment: '' as XTargetEnvironment,
      referenceId: '',
    });

    expect(data).not.toBeDefined();
    expect(raw).not.toBeDefined();
    expect(error).toBeDefined();
    expect((error as Record<string, unknown>).errors).toHaveLength(3);
  });

  it('should fail on access token creation failure', async () => {
    const { error, data, raw } = await transferOrRequestToPayTransactionStatus({
      createAccessToken: () => Promise.resolve({ error: {} }),
      getEndPoint: ()=>'https://example.com',
      logger: new Logger({ log: console.log }),
      ocpApimSubscriptionKey: 'OC_APIM_SUBSCRIPTION_KEY',
      targetEnvironment: XTargetEnvironment.mtnCameroon,
      referenceId: PAYMENT_REF01,
    });

    expect(data).not.toBeDefined();
    expect(raw).not.toBeDefined();
    expect(error).toBeDefined();
    expect((error as Error).message).toBe('Failed to generate token');
  });
  it('should fail on request failure', async () => {
    const requestSpy = jest
      .spyOn(axios, 'get')
      .mockImplementation()
      .mockRejectedValue(<AxiosResponse>{
        data: {}
      });
    const { error, data, raw } = await transferOrRequestToPayTransactionStatus({
      createAccessToken: () =>
        Promise.resolve({
          data: 'THE_ACCESS_TOKEN',
          raw: { access_token: 'ad', token_type: '', expires_in: 300 },
        }),
      getEndPoint: ()=>'https://example.com',
      logger: new Logger({ log: console.log }),
      ocpApimSubscriptionKey: 'OC_APIM_SUBSCRIPTION_KEY',
      targetEnvironment: XTargetEnvironment.mtnCameroon,
      referenceId: PAYMENT_REF01,
    });

    expect(data).not.toBeDefined();
    expect(raw).not.toBeDefined();
    expect(requestSpy).toHaveBeenCalledTimes(1);
    expect(error).toBeDefined();
    expect((error as Error).message).toBe('Error occurred while getting transaction status');
  });
  it('should succeed on request succeed', async () => {
    const succeedEg = {
      "amount": 1,
      "currency": "XAF",
      "financialTransactionId": 363440463,
      "externalId": 83453,
      "payee": {
        "partyIdType": "MSISDN",
        "partyId": 698092232
      },
      "status": "SUCCESSFUL"
    };
    const requestSpy = jest
      .spyOn(axios, 'get')
      .mockImplementation()
      .mockResolvedValue(<AxiosResponse>{
        data: Object(succeedEg)
      });
    const { error, data, raw } = await transferOrRequestToPayTransactionStatus({
      createAccessToken: () =>
      Promise.resolve({
        data: 'THE_ACCESS_TOKEN',
        raw: { access_token: 'ad', token_type: '', expires_in: 300 },
      }),
    getEndPoint: ()=>'https://example.com',
    logger: new Logger({ log: console.log }),
    ocpApimSubscriptionKey: 'OC_APIM_SUBSCRIPTION_KEY',
    targetEnvironment: XTargetEnvironment.mtnCameroon,
    referenceId: PAYMENT_REF01,
    });

    expect(error).not.toBeDefined();
    expect(requestSpy).toHaveBeenCalledTimes(1);
    expect(raw).toEqual(succeedEg);
    expect(data).toBe(Status.succeeded);
  });
});
