import { IsOptional, IsString, IsNumber, Min, Max, IsIn, IsUrl, ValidateIf, IsNotEmpty, Validate } from 'class-validator';
import { NavigationProvided } from '../../common/validators/navigation-provided.validator';

export class UpdateRestaurantDto {
	@IsString()
	@IsOptional()
	address?: string;

	@IsNumber()
	@Min(0)
	@Max(5)
	@IsOptional()
	rating?: number;

	@IsOptional()
	@IsIn(['google', 'text'])
	@Validate(NavigationProvided)
	navigationType?: 'google' | 'text';

	@ValidateIf(o => o.navigationType === 'google')
	@IsUrl({}, { message: 'googleMapsUrl must be a valid URL' })
	@IsNotEmpty()
	googleMapsUrl?: string;

	@ValidateIf(o => o.navigationType === 'text')
	@IsString()
	@IsNotEmpty()
	directionsText?: string;
}