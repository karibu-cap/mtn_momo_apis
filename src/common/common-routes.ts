import { validator as validator } from '../deps/deps';
import { XTargetEnvironment, ApiProduct } from '../utils/constants';

const liveHost = 'https://proxy.momoapi.mtn.com';
const sandboxLocation = 'https://sandbox.momodeveloper.mtn.com';

export abstract class CommonRoutesParam {
  @validator.IsEnum(XTargetEnvironment)
  environment: XTargetEnvironment;

  @validator.IsEnum(ApiProduct)
  product: ApiProduct;
}

/**
 * Utility class that list a set of used api route.
 * @class
 */
export abstract class CommonRoutes {
  /**
   * Constructs a new {CommonRoutes} and validate the provided configuration.
   * @constructor
   * @param {CommonRoutesParam} config - The required global route configuration.
   */
  constructor(protected readonly config: CommonRoutesParam) {}

  /**
   * e.g: https://sandbox.momodeveloper.mtn.com
   */
  private get envHost() {
    switch (this.config.environment) {
      case XTargetEnvironment.sandbox:
        return sandboxLocation;
      case XTargetEnvironment.mtnBenin:
      case XTargetEnvironment.mtnCameroon:
      case XTargetEnvironment.mtnCongo:
      case XTargetEnvironment.mtnGhana:
      case XTargetEnvironment.mtnGuineaConakry:
      case XTargetEnvironment.mtnIvoryCoast:
      case XTargetEnvironment.mtnLiberia:
      case XTargetEnvironment.mtnSouthAfrica:
      case XTargetEnvironment.mtnSwaziland:
      case XTargetEnvironment.mtnUganda:
      case XTargetEnvironment.mtnZambia:
        return liveHost;
    }
  }

  /**
   * e.g: https://sandbox.momodeveloper.mtn.com/disbursement
   */
  protected get baseRoutePrefix() {
    return `${this.envHost}/${this.config.product}`;
  }

  /**
   * This route is used to create an access token which can then be used to authorize and authenticate towards the other end-points of the API.
   * @return {string}
   */
  get createAccessToken(): string {
    return `${this.baseRoutePrefix}/token/`; // Note the ending slash is required. Removing it can produce unwanted behavior.
  }
}
