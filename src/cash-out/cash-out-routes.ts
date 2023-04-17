import { validator as validator } from '../deps/deps';
import { CommonRoutes, CommonRoutesParam } from '../common/common-routes';
import { validInstanceOf } from '../utils/utils';

export class CashOutRoutesParam extends CommonRoutesParam {
  @validator.IsNotEmpty()
  @validator.IsString()
  version: string;
}

export class CashOutRoutes extends CommonRoutes {
  protected readonly config: CashOutRoutesParam;
  /**
   * Constructs a new {CashOutRoutes} and validate the provided configuration.
   * Note: Constructor throw a list of validation error when the provided config is invalid.
   * @constructor
   * @param {CashOutRoutesParam} config - The required global route configuration.
   */
  constructor(config: CashOutRoutesParam) {
    super(config);
    this.config = validInstanceOf(config, CashOutRoutesParam);
  }

  protected get routePrefix() {
    return `${super.routePrefix}/${this.config.version}`;
  }

  /**
   * This route is used to transfer an amount from the owner’s account to a payee account (customer).
   * @return {string}
   */
  get transfer(): string {
    return `${this.routePrefix}/transfer`;
  }

  /**
   * This route is used to get the status of a transfer.
   * @param {string} referenceId - The reference of the transfer.
   * @return {string}
   */
  getTransferStatus(referenceId: string): string {
    return `${this.routePrefix}/transfer/${referenceId}`;
  }
}
