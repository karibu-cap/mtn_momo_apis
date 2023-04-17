import { CommonApi, CommonApiParam } from '../common/common-api';
import { validator as validator } from '../deps/deps';
import {
  XTargetEnvironment,
  ApiProduct,
  Currency,
  Status,
  ErrorCode,
} from '../utils/constants';
import { MethodResponse, RoutesImpl } from '../utils/interfaces';
import { Logger } from '../utils/logger';
import { transferOrRequestToPay } from '../utils/transfer-or-request-to-pay-handler';
import { transferOrRequestToPayTransactionStatus } from '../utils/transfer-or-request-to-pay-status-handler';
import { validInstanceOf } from '../utils/utils';
import { CashInRoutes } from './cash-in-routes';

export class CashInApiParam extends CommonApiParam {
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
export class CashInApi extends CommonApi implements RoutesImpl<CashInRoutes> {
  protected readonly config: CashInApiParam;
  protected readonly routes: CashInRoutes;
  protected readonly logging: Logger;
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
    this.logging = new Logger(this.config.logger, 'CashInApi');
    this.logging.of('constructor').debug({
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
    return transferOrRequestToPay({
      ...param,
      endPoint: this.routes.requestToPay,
      targetEnvironment: this.config.targetEnvironment,
      createAccessToken: this.createAccessToken,
      ocpApimSubscriptionKey: this.config.ocpApimSubscriptionKey,
      logger: this.logging.of('requestToPay'),
    });
  }

  /**
   * This route is used to get the status of a request to pay.
   * @param {RTPTransactionStatusParam} param - The reference of the pay request.
   * @return {string}
   */
  async requestToPayTransactionStatus(
    param: RTPTransactionStatusParam
  ): MethodResponse<Status, RTPTransactionStatusResponse> {
    return transferOrRequestToPayTransactionStatus({
      getEndPoint: this.routes.requestToPayTransactionStatus,
      targetEnvironment: this.config.targetEnvironment,
      createAccessToken: this.createAccessToken,
      ocpApimSubscriptionKey: this.config.ocpApimSubscriptionKey,
      referenceId: param.referenceId,
      logger: this.logging.of('requestToPayTransactionStatus'),
    });
  }
}
