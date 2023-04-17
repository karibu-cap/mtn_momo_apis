import { axios, AxiosResponse, validator } from '../deps/deps';
import { MethodResponse } from './interfaces';
import { validInstanceOf } from './utils';

export class GenerateSandboxApiUserParam {
  /**
   * FORMAT - UUID. Resource ID for the API user to be created. UUID version 4 is required.
   */
  @validator.IsUUID('4')
  xReferenceId: string;

  @validator.IsNotEmpty()
  @validator.IsString()
  ocpApimSubscriptionKey: string;

  /**
   * Subscription key which provides access to this API.
   * Found in your [Profile](https://momodeveloper.mtn.com/developer)
   */
  @validator.IsUrl()
  providerCallbackHost: string;
}

export type GenerateSandboxKeysResponse = {
  apiUser: string;
  apiKey: string;
};

const sandboxUri = 'https://sandbox.momodeveloper.mtn.com/v1_0';

export async function generateSandboxKeys(
  param: GenerateSandboxApiUserParam
): MethodResponse<GenerateSandboxKeysResponse> {
  let parsedParam: GenerateSandboxApiUserParam;
  try {
    parsedParam = validInstanceOf(param, GenerateSandboxApiUserParam);
  } catch (error) {
    return error;
  }

  const headers = {
    'X-Reference-Id': parsedParam.xReferenceId,
    'Ocp-Apim-Subscription-Key': parsedParam.ocpApimSubscriptionKey,
  };
  const body = {
    providerCallbackHost: parsedParam.providerCallbackHost,
  };
  try {
    await axios.post(`${sandboxUri}/apiuser`, body, {
      headers,
    });
  } catch (error) {
    return {
      error: {
        message: 'Failed to generate api user',
        raw: error,
      },
    };
  }

  const apiKeyHeaders = {
    'Ocp-Apim-Subscription-Key': parsedParam.ocpApimSubscriptionKey,
  };
  const apiKeyBody = null;
  try {
    const response: AxiosResponse<{ apiKey?: string }> = await axios.post(
      `${sandboxUri}/apiuser${parsedParam.xReferenceId}/apikey`,
      apiKeyBody,
      {
        headers: apiKeyHeaders,
      }
    );

    return {
      data: {
        apiKey: `${response.data.apiKey}`,
        apiUser: parsedParam.xReferenceId,
      },
      raw: response.data,
    };
  } catch (error) {
    return {
      error: {
        message: 'Failed to generate api key',
        raw: error,
      },
    };
  }
}
