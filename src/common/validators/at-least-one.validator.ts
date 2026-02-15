import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'AtLeastOne', async: false })
export class AtLeastOneConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const valueObj = value as Record<string, unknown>;
    const fields = Object.values(valueObj).filter(
      (v) => v !== undefined && v !== null && v !== '',
    );
    return fields.length > 0;
  }

  defaultMessage(): string {
    return 'At least one field must be provided';
  }
}

export function AtLeastOne(validationOptions?: ValidationOptions) {
  return function (target: object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: AtLeastOneConstraint,
    });
  };
}
