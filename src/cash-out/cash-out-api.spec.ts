import { axios } from '../deps/deps';
import { Status, XTargetEnvironment } from '../utils/constants';
import { Token } from '../utils/interfaces';
import { CashOutApi } from './cash-out-api';

describe('CashOutApi:constructor', () => {
  it('should throw on invalid param provided', () => {
    let error;
    try {
      new CashOutApi({
        apiKey: '',
        logger: { log: console.debug },
        ocpApimSubscriptionKey: '',
        targetEnvironment: XTargetEnvironment.mtnCameroon,
        userId: '',
      });
    } catch (err) {
      error = err;
    }
    expect(error).toBeDefined();
    expect(error.errors).toHaveLength(3);
  });
  it('should succeed on valid param provided', () => {
    let error;
    try {
      new CashOutApi({
        apiKey: 'API_KEY_VAR',
        logger: { log: console.debug },
        ocpApimSubscriptionKey: 'SUBSCRIPTION_KEY',
        targetEnvironment: XTargetEnvironment.mtnCameroon,
        userId: 'USER_ID',
      });
    } catch (err) {
      error = err;
    }
    expect(error).toBeUndefined();
  });
});

describe('CashOutApi:transfer', () => {
  const PAYMENT_REF01 = 'd1b9cc0a-0728-4398-8d5b-2b3947e073a9';

  const api = new CashOutApi({
    apiKey: 'API_KEY_VAR',
    logger: { log: console.debug },
    ocpApimSubscriptionKey: 'SUBSCRIPTION_KEY',
    targetEnvironment: XTargetEnvironment.mtnCameroon,
    userId: 'USER_ID',
  });

  it('should fail on invalid param provided', async () => {
    const { error, data, raw } = await api.transfer({
      amount: -1,
      externalId: '',
      payeeNote: '',
      payeeId: '',
      payerMessage: '',
      referenceId: '',
    });

    expect(data).not.toBeDefined();
    expect(raw).not.toBeDefined();
    expect(error).toBeDefined();
    expect((error as Record<string, unknown>).errors).toHaveLength(4);
  });
  it('should succeed on valid param provided', async () => {
    const requestSpy = jest
      .spyOn(axios, 'post')
      .mockImplementation()
      .mockResolvedValueOnce({
        data: <Token>{
          access_token: 'access_token',
          token_type: 'token_type',
          expires_in: 0,
        },
      })
      .mockResolvedValue({ data: {} });
    const { error, data, raw } = await api.transfer({
      amount: 1,
      externalId: 'EXTERNAL_ID',
      payeeNote: '',
      payeeId: '237612345678',
      payerMessage: '',
      referenceId: PAYMENT_REF01,
    });

    expect(error).not.toBeDefined();
    expect(data).toBe(null);
    expect(raw).toBeDefined();
    expect(requestSpy).toHaveBeenCalledTimes(2);
  });
});

describe('CashOutApi:getTransferStatus', () => {
  const PAYMENT_REF01 = 'd1b9cc0a-0728-4398-8d5b-2b3947e073a9';

  const api = new CashOutApi({
    apiKey: 'API_KEY_VAR',
    logger: { log: console.debug },
    ocpApimSubscriptionKey: 'SUBSCRIPTION_KEY',
    targetEnvironment: XTargetEnvironment.mtnCameroon,
    userId: 'USER_ID',
  });

  it('should fail on invalid param provided', async () => {
    const { error, data, raw } = await api.getTransferStatus({
      referenceId: '',
    });

    expect(data).not.toBeDefined();
    expect(raw).not.toBeDefined();
    expect(error).toBeDefined();
    expect((error as Record<string, unknown>).errors).toHaveLength(1);
  });
  it('should succeed on valid param provided', async () => {
    const succeedEg = {
      amount: 1,
      currency: 'XAF',
      financialTransactionId: 363440463,
      externalId: 83453,
      payer: {
        partyIdType: 'MSISDN',
        partyId: 698092232,
      },
      status: 'SUCCESSFUL',
    };
    const postSpy = jest
      .spyOn(axios, 'post')
      .mockImplementation()
      .mockResolvedValueOnce({
        data: <Token>{
          access_token: 'access_token',
          token_type: 'token_type',
          expires_in: 0,
        },
      });
    const getSpy = jest
      .spyOn(axios, 'get')
      .mockImplementation()
      .mockResolvedValueOnce({
        data: succeedEg,
      });
    const { error, data, raw } = await api.getTransferStatus({
      referenceId: PAYMENT_REF01,
    });

    expect(error).not.toBeDefined();
    expect(data).toBe(Status.succeeded);
    expect(raw).toBeDefined();
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(getSpy).toHaveBeenCalledTimes(1);
  });
});
