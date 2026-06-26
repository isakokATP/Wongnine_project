import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'NavigationProvided', async: false })
export class NavigationProvided implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
        const obj = args.object as any;

        const hasGoogle = !!(obj.googleMapsUrl && obj.googleMapsUrl.toString().trim().length > 0);
        const hasText = !!(obj.directionsText && obj.directionsText.toString().trim().length > 0);

        return hasGoogle || hasText;
    }

    defaultMessage(args: ValidationArguments) {
        return 'Provide navigation either via googleMapsUrl (Google Maps URL) or directionsText (text directions). At least one is required.';
    }
}
