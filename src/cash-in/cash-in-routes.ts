import { validator as validator } from '../deps/deps';
import { CoreRoutes, CoreRoutesParam } from '../core/core-routes';
import { validInstanceOf } from '../utils/utils';

export class CashInRoutesParam extends CoreRoutesParam {
  @validator.IsNotEmpty()
  @validator.IsString()
  version: string;
}

export class CashInRoutes extends CoreRoutes {
  protected readonly config: CashInRoutesParam;
  /**
   * Constructs a new {CashInRoutes} and validate the provided configuration.
   * Note: Constructor throw a list of validation error when the provided config is invalid.
   * @constructor
   * @param {CashInRoutesParam} config - The required global route configuration.
   */
  constructor(config: CashInRoutesParam) {
    super(config);
    this.config = validInstanceOf(config, CashInRoutesParam);
  }

  protected get routePrefix() {
    return `${super.routePrefix}/${this.config.version}`;
  }

  /**
   * This route is used to request a payment from a consumer (Payer).
   * @return {string}
   */
  get requestToPay(): string {
    return `${this.routePrefix}/requesttopay`;
  }

  /**
   * This route is used to get the status of a request to pay.
   * @param {string} referenceId - The reference of the pay request.
   * @return {string}
   */
  requestToPayTransactionStatus(referenceId: string): string {
    return `${this.routePrefix}/requesttopay/${referenceId}`;
  }
}
