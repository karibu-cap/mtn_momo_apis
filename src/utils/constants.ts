export enum LogType {
  error = 'error',
  info = 'info',
  debug = 'debug',
}

/**
 * The simplified version of transaction status.
 */
export enum Status {
  /**
   * The transaction failed.
   */
  failed = 'FAILED',

  /**
   * The transaction is pending.
   */
  pending = 'PENDING',

  /**
   * The transaction succeeded.
   */
  succeeded = 'SUCCESSFUL',
}

// Todo: verify api status
export enum ErrorCode {
  'PAYEE_NOT_FOUND' = 'PAYEE_NOT_FOUND',
  'PAYER_NOT_FOUND' = 'PAYER_NOT_FOUND',
  'NOT_ALLOWED' = 'NOT_ALLOWED',
  'NOT_ALLOWED_TARGET_ENVIRONMENT' = 'NOT_ALLOWED_TARGET_ENVIRONMENT',
  'INVALID_CALLBACK_URL_HOST' = 'INVALID_CALLBACK_URL_HOST',
  'INVALID_CURRENCY' = 'INVALID_CURRENCY',
  'SERVICE_UNAVAILABLE' = 'SERVICE_UNAVAILABLE',
  'INTERNAL_PROCESSING_ERROR' = 'INTERNAL_PROCESSING_ERROR',
  'NOT_ENOUGH_FUNDS' = 'NOT_ENOUGH_FUNDS',
  'PAYER_LIMIT_REACHED' = 'PAYER_LIMIT_REACHED',
  'PAYEE_NOT_ALLOWED_TO_RECEIVE' = 'PAYEE_NOT_ALLOWED_TO_RECEIVE',
  'PAYMENT_NOT_APPROVED' = 'PAYMENT_NOT_APPROVED',
  'RESOURCE_NOT_FOUND' = 'RESOURCE_NOT_FOUND',
  'APPROVAL_REJECTED' = 'APPROVAL_REJECTED',
  'EXPIRED' = 'EXPIRED',
  'TRANSACTION_CANCELED' = 'TRANSACTION_CANCELED',
  'RESOURCE_ALREADY_EXIST' = 'RESOURCE_ALREADY_EXIST',
}

/**
 * The supported X-Target-Environment.
 * ref: [Common Error Code](https://momodeveloper.mtn.com/api-documentation/common-error/)
 */
export enum XTargetEnvironment {
  mtnBenin = 'mtnbenin',
  mtnCameroon = 'mtncameroon',
  mtnCongo = 'mtncongo',
  mtnGhana = 'mtnghana',
  mtnGuineaConakry = 'mtnguineaconakry',
  mtnIvoryCoast = 'mtnivorycoast',
  mtnLiberia = 'mtnliberia',
  mtnSouthAfrica = 'mtnsouthafrica',
  mtnSwaziland = 'mtnswaziland',
  mtnUganda = 'mtnuganda',
  mtnZambia = 'mtnzambia',
  sandbox = 'sandbox',
}

export enum Currency {
  /**
   * The EUR currency.
   */
  eur = 'EUR',

  /**
   * The XAF currency.
   */
  xaf = 'XAF',

  /**
   * The XOF currency.
   */
  xof = 'XOF',

  /**
   * The Ghanaian cedi
   */
  ghs = 'GHS',

  /**
   * The Guinean franc
   */
  gnf = 'GNF',

  /**
   * The Liberian dollar
   */
  lrd = 'LRD',

  /**
   * The South African rand
   */
  zar = 'ZAR',

  /**
   * The Ugandan shilling
   */
  ugx = 'UGX',

  /**
   * The Swazi lilangeni
   */
  szl = 'SZL',

  /**
   * The Zambian kwacha
   */
  zmw = 'ZMW',
}

/**
 * A mapping between x-target-environment and their currency.
 * As said by the doc: we should "Use Currency Code specific to the Country".
 */
export const xTargetEnvironmentCurrency: Record<XTargetEnvironment, Currency> =
  {
    [XTargetEnvironment.mtnBenin]: Currency.xof,
    [XTargetEnvironment.mtnCameroon]: Currency.xaf,
    [XTargetEnvironment.mtnCongo]: Currency.xaf,
    [XTargetEnvironment.mtnGhana]: Currency.ghs,
    [XTargetEnvironment.mtnGuineaConakry]: Currency.gnf,
    [XTargetEnvironment.mtnIvoryCoast]: Currency.xof,
    [XTargetEnvironment.mtnLiberia]: Currency.lrd,
    [XTargetEnvironment.mtnSouthAfrica]: Currency.zar,
    [XTargetEnvironment.mtnSwaziland]: Currency.szl,
    [XTargetEnvironment.mtnUganda]: Currency.ugx,
    [XTargetEnvironment.mtnZambia]: Currency.zmw,
    [XTargetEnvironment.sandbox]: Currency.eur,
  };

export const supportedCountriesCode = {
  BJ: 229,
  CG: 242,
  CI: 225,
  CM: 237,
  GH: 233,
  GN: 224,
  LR: 231,
  SZ: 268,
  UG: 256,
  ZA: 27,
  ZM: 260,
};

/**
 * A mapping between x-target-environment and their code.
 */
export const xTargetEnvironmentCode: Record<
  XTargetEnvironment,
  keyof typeof supportedCountriesCode
> = {
  [XTargetEnvironment.mtnBenin]: 'BJ',
  [XTargetEnvironment.mtnCameroon]: 'CM',
  [XTargetEnvironment.mtnCongo]: 'CG',
  [XTargetEnvironment.mtnGhana]: 'GH',
  [XTargetEnvironment.mtnGuineaConakry]: 'GN',
  [XTargetEnvironment.mtnIvoryCoast]: 'CI',
  [XTargetEnvironment.mtnLiberia]: 'LR',
  [XTargetEnvironment.mtnSouthAfrica]: 'ZA',
  [XTargetEnvironment.mtnSwaziland]: 'SZ',
  [XTargetEnvironment.mtnUganda]: 'UG',
  [XTargetEnvironment.mtnZambia]: 'ZM',
  [XTargetEnvironment.sandbox]: 'CM', // Note: set for type mapping. however, sandbox map any country code.
};

/**
 * An enumeration of supported api product.
 */
export enum ApiProduct {
  collection = 'collection',
  disbursement = 'disbursement',
}
