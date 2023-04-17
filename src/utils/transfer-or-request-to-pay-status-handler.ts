import { axios, AxiosResponse, validator as validator } from '../deps/deps';
import { ErrorCode, Status, XTargetEnvironment } from './constants';
import { parseAxiosError, validInstanceOf } from './utils';
import { MethodResponse, Token } from './interfaces';
import { Logger } from './logger';

class TransferOrRtpTransactionStatusParam {
  /**
   * Reference-Id that was passed to the pay or transfer request.
   */
  @validator.IsUUID('4')
  referenceId: string;

  /**
   * Handler that return the endpoint.
   */
  @validator.IsObject()
  getEndPoint: (ref: string) => string;

  /**
   * Handler that return the access token.
   */
  @validator.IsObject()
  createAccessToken: () => MethodResponse<string, Token>;

  @validator.IsEnum(XTargetEnvironment)
  targetEnvironment: XTargetEnvironment;

  @validator.IsNotEmpty()
  @validator.IsString()
  ocpApimSubscriptionKey: string;

  @validator.IsObject()
  logger: Logger;
}

type TransferOrRtpTransactionStatusResponse = {
  amount: string;
  currency: string;
  financialTransactionId: string;
  externalId: string;
  payee?: {
    partyIdType: 'MSISDN';
    partyId: string;
  };
  payer?: {
    partyIdType: 'MSISDN';
    partyId: string;
  };
  payerMessage: string;
  payeeNote: string;
  status: Status;
  reason?: {
    code: ErrorCode;
    message: string;
  };
};

/**
 * This handler is used to get the status of a transfer or request to pay.
 * @param {string} param - The parameter reference of the transfer or pay request.
 * @return {string}
 */
export async function transferOrRequestToPayTransactionStatus<
  T extends TransferOrRtpTransactionStatusResponse
>(param: TransferOrRtpTransactionStatusParam): MethodResponse<Status, T> {
  const logger = param.logger;
  logger.debug(':start with param', param);

  let parsedParam: TransferOrRtpTransactionStatusParam;

  try {
    parsedParam = validInstanceOf(param, TransferOrRtpTransactionStatusParam);
  } catch (error) {
    logger.error('Parameter validation failed', error);
    return { error };
  }

  const { data: tokenData, error: tokenError } =
    await parsedParam.createAccessToken();

  if (tokenError) {
    return {
      error: { message: 'Failed to generate token', raw: tokenError },
    };
  }

  const endPoint = parsedParam.getEndPoint(parsedParam.referenceId);

  const header = {
    Authorization: `Bearer ${tokenData}`,
    'X-Target-Environment': parsedParam.targetEnvironment,
    'Ocp-Apim-Subscription-Key': parsedParam.ocpApimSubscriptionKey,
  };
  const body = null;
  logger.debug('Sending request...', {
    header,
    body,
    endPoint,
    method: 'GET',
  });

  try {
    const resp: AxiosResponse<T> = await axios.get(endPoint, {
      headers: header,
    });

    logger.debug('Request succeeded', {
      data: resp.data,
      headers: resp.headers,
      status: resp.status,
    });

    return {
      data: resp.data.status,
      raw: resp.data,
    };
  } catch (error) {
    logger.error('Request failed', error);

    return {
      error: {
        message: 'Error occurred while getting transaction status',
        raw: parseAxiosError(error),
      },
    };
  }
}
