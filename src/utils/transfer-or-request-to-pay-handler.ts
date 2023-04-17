import { ValidityCheck } from './validity-check';
import { axios, AxiosResponse, validator as validator } from '../deps/deps';
import {
  Currency,
  XTargetEnvironment,
  xTargetEnvironmentCode,
  xTargetEnvironmentCurrency,
} from './constants';
import { parseAxiosError, validInstanceOf } from './utils';
import { MethodResponse, Token } from './interfaces';
import { Logger } from './logger';

class TransferOrRtpParam {
  /**
   * Amount that will be debited from the payer account.
   */
  @validator.IsNumber({
    allowInfinity: false,
    allowNaN: false,
    maxDecimalPlaces: 0,
  })
  amount: number;

  /**
   * Resource ID of the created request to pay transaction.
   * This ID is used, for example, validating the status of the request.
   * ‘Universal Unique ID’ for the transaction generated using UUID version 4.
   */
  @validator.IsUUID('4')
  referenceId: string;

  /**
   * ISO4217 Currency of the provided amount.
   * If not set, The currency will be automatically set to match your target environment.
   */
  @validator.IsISO4217CurrencyCode()
  @validator.IsOptional()
  currency?: Currency;

  /**
   * External id is used as a reference to the transaction.
   * External id is used for reconciliation.
   * The external id will be included in transaction history report.
   * External id is not required to be unique.
   */
  externalId: string;

  /**
   * Mobile Number validated according to ITU-T E.164
   */
  @ValidityCheck<TransferOrRtpParam>((o) => {
    if (o.payerId && o.payeeId) {
      return {
        isValid: false,
        message: 'Only one of payerId or payeeId must be provided',
      };
    }
    if (!o.payerId && !o.payeeId) {
      return {
        isValid: false,
        message: 'One of payerId or payeeId must be provided',
      };
    }
    return { isValid: true };
  })
  @validator.IsNumberString()
  @validator.IsOptional()
  payeeId?: string;

  @validator.IsNumberString()
  @validator.IsOptional()
  payerId?: string;

  /**
   * Message that will be written in the payer transaction history message field.
   */
  @validator.IsString()
  payerMessage: string;

  /**
   * Message that will be written in the payee transaction history note field.
   */
  @validator.IsString()
  payeeNote: string;

  /**
   * Handler that return the access token.
   */
  @validator.IsObject()
  createAccessToken: () => MethodResponse<string, Token>;

  @validator.IsEnum(XTargetEnvironment)
  targetEnvironment: XTargetEnvironment;
  /**
   * Handler that return the endpoint.
   */
  @validator.IsUrl()
  endPoint: string;

  @validator.IsNotEmpty()
  @validator.IsString()
  ocpApimSubscriptionKey: string;

  @validator.IsObject()
  logger: Logger;
}

/**
 * This operation is used to request a payment(or transfer) from(or to) a consumer.
 * @param {TransferOrRtpParam} param - The required pay or transfer request parameter.
 * @return {MethodResponse<void>}
 */
export async function transferOrRequestToPay(
  param: TransferOrRtpParam
): MethodResponse<null> {
  const logger = param.logger;
  logger.debug(':start with param', param);
  let parsedParam: TransferOrRtpParam;
  try {
    parsedParam = validInstanceOf(param, TransferOrRtpParam);
    // Check if in live environments phone number is valid.
    if (parsedParam.targetEnvironment !== XTargetEnvironment.sandbox) {
      const idProvided = parsedParam.payeeId ? 'payeeId' : 'payerId';
      const phoneNumber = `${parsedParam[idProvided]}`;
      const phoneNumberIsValid = validator.isPhoneNumber(
        phoneNumber,
        xTargetEnvironmentCode[parsedParam.targetEnvironment]
      );
      if (!phoneNumberIsValid) {
        throw new Error(
          `The provided ${idProvided}:"${phoneNumber}" do not match phone number of the target environment:${parsedParam.targetEnvironment}`
        );
      }
    }
  } catch (error) {
    logger.error('parameter validation failed', error);
    return { error };
  }

  const { data: tokenData, error: tokenError } =
    await parsedParam.createAccessToken();

  if (tokenError) {
    return {
      error: { message: 'failed to generate token', raw: tokenError },
    };
  }
  const endPoint = parsedParam.endPoint;
  const header = {
    Authorization: `Bearer ${tokenData}`,
    'X-Reference-Id': parsedParam.referenceId,
    'X-Target-Environment': parsedParam.targetEnvironment,
    'Ocp-Apim-Subscription-Key': parsedParam.ocpApimSubscriptionKey,
  };
  const body = {
    amount: parsedParam.amount,
    currency:
      parsedParam.currency ??
      xTargetEnvironmentCurrency[parsedParam.targetEnvironment],
    externalId: parsedParam.externalId,
    payee: {
      partyIdType: 'MSISDN',
      partyId: parsedParam.payeeId || parsedParam.payerId,
    },
    payerMessage: parsedParam.payerMessage,
    payeeNote: parsedParam.payeeNote,
  };
  logger.debug('Sending request...', {
    header,
    body,
    endPoint,
    method: 'POST',
  });

  try {
    const resp: AxiosResponse = await axios.post(endPoint, body, {
      headers: header,
    });

    logger.debug('Request succeeded', {
      data: resp.data,
      headers: resp.headers,
      status: resp.status,
    });

    return { data: null, raw: resp.data };
  } catch (error) {
    logger.error('Request failed', error);

    return {
      error: {
        message: 'Error occurred',
        raw: parseAxiosError(error),
      },
    };
  }
}