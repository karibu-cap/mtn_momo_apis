import { axios, AxiosResponse, validator as validator } from '../deps/deps';
import {
  BaseLogger,
  MethodResponse,
  RoutesImpl,
  Token,
} from '../utils/interfaces';
import { Logger } from '../utils/logger';
import { hash, parseAxiosError } from '../utils/utils';
import { CommonRoutes } from './common-routes';

export abstract class CommonApiParam {
  @validator.IsNotEmpty()
  @validator.IsString()
  userId: string;

  @validator.IsNotEmpty()
  @validator.IsString()
  apiKey: string;

  @validator.IsNotEmpty()
  @validator.IsString()
  ocpApimSubscriptionKey: string;

  @validator.IsObject()
  logger: BaseLogger;
}

/**
 * Utility class that list a set of used api route.
 * @class
 */
export abstract class CommonApi implements RoutesImpl<CommonRoutes> {
  protected readonly logging: Logger;

  /**
   * Constructs a new {CommonApi} and validate the provided configuration.
   * @constructor
   * @param {CommonApiParam} config - The required global route configuration.
   */
  constructor(
    protected readonly config: CommonApiParam,
    protected routes: CommonRoutes
  ) {
    this.logging = new Logger(this.config.logger, 'CommonApi');

    this.logging.of('constructor').debug({
      message: 'Config set',
      config,
    });
  }

  /**
   * This operation is used to create an access token which can then be used to authorize and authenticate towards the other end-points of the API.
   * @return {MethodResponse<string, Token>}
   */
  async createAccessToken(): MethodResponse<string, Token> {
    const logger = this.logging.of('createAccessToken');

    const authorization = hash(this.config.userId, this.config.apiKey);
    const header = {
      'Ocp-Apim-Subscription-Key': this.config.ocpApimSubscriptionKey,
      Authorization: `Basic ${authorization}`,
    };
    const body = null;

    try {
      logger.debug({ header, body }, 'Posting...');
      const response: AxiosResponse<Token> = await axios.post(
        this.routes.createAccessToken,
        body
      );

      logger.debug('response', {
        response: response.data,
        status: response.status,
        statusText: response.statusText,
      });

      return { data: response.data.access_token, raw: response.data };
    } catch (error) {
      const parsedError = parseAxiosError(error);
      logger.error(parsedError);
      return { error: parsedError };
    }
  }
}
