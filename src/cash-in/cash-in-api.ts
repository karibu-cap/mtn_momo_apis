import { CoreApi, CoreApiParam } from '../core/core-api';
import { axios, AxiosResponse, validator as validator } from '../deps/deps';
import {
  XTargetEnvironment,
  ApiProduct,
  xTargetEnvironmentCode,
  Currency,
  xTargetEnvironmentCurrency,
  Status,
  ErrorCode,
} from '../utils/constants';
import { MethodResponse, RoutesImpl } from '../utils/interfaces';
import { Logger } from '../utils/logger';
import { parseAxiosError, validInstanceOf } from '../utils/utils';
import { CashInRoutes } from './cash-in-routes';

export class CashInApiParam extends CoreApiParam {
  @validator.IsEnum(XTargetEnvironment)
  targetEnvironment: XTargetEnvironment;
}

export class RequestToPayParam {
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
  @validator.IsNumberString()
  payerId: string;

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
}
export class RTPTransactionStatusParam {
  /**
   * Reference-Id that was passed to the pay request.
   */
  @validator.IsNotEmpty()
  @validator.IsString()
  referenceId: string;
}

type RTPTransactionStatusResponse = {
  amount: string;
  currency: string;
  financialTransactionId: string;
  externalId: string;
  payer: {
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
 * The supported route version.
 */
const apiRouteVersion = 'v1_0';

/**
 * Utility class that list a set of used api route.
 * @class
 */
export class CashInApi extends CoreApi implements RoutesImpl<CashInRoutes> {
  protected readonly config: CashInApiParam;
  protected readonly routes: CashInRoutes;
  protected readonly logger: Logger;
  /**
   * Constructs a new {CashInApi} and validate the provided configuration.
   * Note: Constructor throw a list of validation error when the provided config is invalid.
   * @constructor
   * @param {CashInApiParam} config - The required global route configuration.
   */
  constructor(config: CashInApiParam) {
    const validConfig = validInstanceOf(config, CashInApiParam);
    const routes = new CashInRoutes({
      environment: config.targetEnvironment,
      product: ApiProduct.collection,
      version: apiRouteVersion,
    });
    super(config, routes);

    this.config = validConfig;
    this.logger = new Logger(this.config.logger, 'CashInApi');
    this.logger.of('constructor').debug({
      message: 'Config set',
      config,
    });
  }

  /**
   * This operation is used to request a payment from a consumer (Payer).
   * The payer will be asked to authorize the payment.
   * The transaction will be executed once the payer has authorized the payment.
   * The requestToPay will be in status PENDING until the transaction is
   * authorized, declined by the payer or timed out by the system.
   * Status of the transaction can be validated by using the {requestToPayTransactionStatus}
   * @param {RequestToPayParam} param -  The required pay request parameter.
   * @return {MethodResponse<void>}
   */
  async requestToPay(param: RequestToPayParam): MethodResponse<null> {
    const logger = this.logger.of('requestToPay');
    logger.debug(':start with param', param);
    let parsedParam: RequestToPayParam;
    try {
      parsedParam = validInstanceOf(param, RequestToPayParam);
      // Check if in live environments phone number is valid.
      if (this.config.targetEnvironment !== XTargetEnvironment.sandbox) {
        const phoneNumberIsValid = validator.isPhoneNumber(
          parsedParam.payerId,
          xTargetEnvironmentCode[this.config.targetEnvironment]
        );
        if (!phoneNumberIsValid) {
          throw new Error(
            `The provided payerId:"${parsedParam.payerId}" do not match phone number of the target environment:${this.config.targetEnvironment}`
          );
        }
      }
    } catch (error) {
      logger.error('parameter validation failed', error);
      return { error };
    }

    const { data: tokenData, error: tokenError } =
      await this.createAccessToken();

    if (tokenError) {
      return {
        error: { message: 'failed to generate token', raw: tokenError },
      };
    }
    const endPoint = this.routes.requestToPay;
    const header = {
      Authorization: `Bearer ${tokenData}`,
      'X-Reference-Id': parsedParam.referenceId,
      'X-Target-Environment': this.config.targetEnvironment,
      'Ocp-Apim-Subscription-Key': this.config.ocpApimSubscriptionKey,
    };
    const body = {
      amount: parsedParam.amount,
      currency:
        parsedParam.currency ??
        xTargetEnvironmentCurrency[this.config.targetEnvironment],
      externalId: parsedParam.externalId,
      payer: {
        partyIdType: 'MSISDN',
        partyId: parsedParam.payerId,
      },
      payerMessage: parsedParam.payerMessage,
      payeeNote: parsedParam.payeeNote,
    };
    logger.debug('Requesting payment', {
      header,
      body,
      endPoint,
      method: 'POST',
    });

    try {
      const resp: AxiosResponse = await axios.post(endPoint, body, {
        headers: header,
      });

      this.logger.debug('Pay request succeeded', {
        data: resp.data,
        headers: resp.headers,
        status: resp.status,
      });

      return { data: null, raw: resp.data };
    } catch (error) {
      this.logger.error('Pay request failed', error);

      return {
        error: {
          message: 'Cash in initialization failed',
          raw: parseAxiosError(error),
        },
      };
    }
  }

  /**
   * This route is used to get the status of a request to pay.
   * @param {string} referenceId - The reference of the pay request.
   * @return {string}
   */
  async requestToPayTransactionStatus(
    param: RTPTransactionStatusParam
  ): MethodResponse<Status, RTPTransactionStatusResponse> {
    const logger = this.logger.of('requestToPayTransactionStatus');
    logger.debug(':start with param', param);

    let parsedParam: RTPTransactionStatusParam;

    try {
      parsedParam = validInstanceOf(param, RTPTransactionStatusParam);
    } catch (error) {
      logger.error('parameter validation failed', error);
      return { error };
    }

    const { data: tokenData, error: tokenError } =
      await this.createAccessToken();

    if (tokenError) {
      return {
        error: { message: 'failed to generate token', raw: tokenError },
      };
    }

    const endPoint = this.routes.requestToPayTransactionStatus(
      parsedParam.referenceId
    );
    const header = {
      Authorization: `Bearer ${tokenData}`,
      'X-Target-Environment': this.config.targetEnvironment,
      'Ocp-Apim-Subscription-Key': this.config.ocpApimSubscriptionKey,
    };
    const body = null;
    logger.debug('Requesting payment', {
      header,
      body,
      endPoint,
      method: 'GET',
    });

    try {
      const resp: AxiosResponse<RTPTransactionStatusResponse> = await axios.get(
        endPoint,
        {
          headers: header,
        }
      );

      this.logger.debug('Pay request succeeded', {
        data: resp.data,
        headers: resp.headers,
        status: resp.status,
      });

      return {
        data: resp.data.status,
        raw: resp.data,
      };
    } catch (error) {
      this.logger.error('Pay request failed', error);

      return {
        error: {
          message: 'Cash in initialization failed',
          raw: parseAxiosError(error),
        },
      };
    }
  }
}
