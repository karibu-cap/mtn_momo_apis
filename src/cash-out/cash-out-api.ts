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
import { CashOutRoutes } from './cash-out-routes';

export class CashOutApiParam extends CommonApiParam {
  @validator.IsEnum(XTargetEnvironment)
  targetEnvironment: XTargetEnvironment;
}

export class TransferParam {
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
  payeeId: string;

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
export class TransferStatusParam {
  /**
   * Reference-Id that was passed to the pay request.
   */
  @validator.IsNotEmpty()
  @validator.IsString()
  referenceId: string;
}

type TransferStatusResponse = {
  amount: string;
  currency: string;
  financialTransactionId: string;
  externalId: string;
  payee: {
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
export class CashOutApi extends CommonApi implements RoutesImpl<CashOutRoutes> {
  protected readonly config: CashOutApiParam;
  protected readonly routes: CashOutRoutes;
  protected readonly logging: Logger;
  /**
   * Constructs a new {CashOutApi} and validate the provided configuration.
   * Note: Constructor throw a list of validation error when the provided config is invalid.
   * @constructor
   * @param {CashOutApiParam} config - The required global route configuration.
   */
  constructor(config: CashOutApiParam) {
    const validConfig = validInstanceOf(config, CashOutApiParam);
    const routes = new CashOutRoutes({
      environment: config.targetEnvironment,
      product: ApiProduct.collection,
      version: apiRouteVersion,
    });
    super(config, routes);

    this.config = validConfig;
    this.logging = new Logger(this.config.logger, 'CashOutApi');
    this.logging.of('constructor').debug({
      message: 'Config set',
      config,
    });
  }

  /**
   * Transfer operation is used to transfer an amount from the own account to a payee account.
   * @param {TransferParam} param -  The required refund request parameter.
   * @return {MethodResponse<void>}
   */
  async transfer(param: TransferParam): MethodResponse<null> {
    return transferOrRequestToPay({
      ...param,
      endPoint: this.routes.transfer,
      targetEnvironment: this.config.targetEnvironment,
      createAccessToken: this.createAccessToken,
      ocpApimSubscriptionKey: this.config.ocpApimSubscriptionKey,
      logger: this.logging.of('transfer'),
    });
  }

  /**
   * This route is used to get the status of a transfer request.
   * @param {TransferStatusParam} param - The reference of the refund request.
   * @return {string}
   */
  async getTransferStatus(
    param: TransferStatusParam
  ): MethodResponse<Status, TransferStatusResponse> {
    return transferOrRequestToPayTransactionStatus({
      getEndPoint: this.routes.getTransferStatus,
      targetEnvironment: this.config.targetEnvironment,
      createAccessToken: this.createAccessToken,
      ocpApimSubscriptionKey: this.config.ocpApimSubscriptionKey,
      referenceId: param.referenceId,
      logger: this.logging.of('getTransferStatus'),
    });
  }
}
