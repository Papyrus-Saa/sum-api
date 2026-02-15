import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'AtLeastOne', async: false })
export class AtLeastOneConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const fields = Object.values(value).filter((v) => v !== undefined && v !== null && v !== '');
    return fields.length > 0;
  }

  defaultMessage() {
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
