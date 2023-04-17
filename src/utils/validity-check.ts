import { validator } from '../deps/deps';

type ValidityCheckReturnType = (object: unknown, propertyName: string) => void;

/**
 * Creates a new decorator for general validation.
 * @param {Object} params - Method parameters.
 * @param {validator.ValidationOptions} params.validationOptions - The whole validation data.
 * @returns {ValidityCheckReturnType}
 */
export function ValidityCheck<T>(
  handler: (
    object: T,
    value: unknown
  ) => { message?: string; isValid: boolean },
  validationOptions?: validator.ValidationOptions
): ValidityCheckReturnType {
  return (object: Record<string, unknown>, propertyName: string) => {
    validator.registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [handler],
      validator: ValidityCheckConstraint,
    });
  };
}

@validator.ValidatorConstraint({ name: 'ValidityCheck' })
/**
 * Creates a new decorator for applying {ValidityCheck} constraint.
 */
export class ValidityCheckConstraint
  implements validator.ValidatorConstraintInterface
{
  message: string;

  /**
   * Validate the provided value.
   * @param {unknown} value The value of the field.
   * @param {validator.ValidationArguments} args Additional validation arguments.
   * @returns {boolean}
   */
  validate(value: unknown, args: validator.ValidationArguments): boolean {
    const [handler] = args.constraints;
    const { message, isValid } = handler(args.object, value);
    this.message = message ?? this.message;
    return isValid;
  }

  /**
   * Gets default message when validation for this constraint fail.
   * @returns {boolean}
   */
  defaultMessage(): string {
    return this.message;
  }
}
