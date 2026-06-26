import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  IsIn,
  IsUrl,
  ValidateIf,
  Validate,
} from 'class-validator';
import { NavigationProvided } from '../../common/validators/navigation-provided.validator';

export class CreateRestaurantDto {
  @IsNotEmpty({ message: 'ต้องระบุชื่อร้านอาหาร' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  averagePrice?: number;

  @IsOptional()
  @IsNumber()
  capacity?: number;

  @IsOptional()
  @IsBoolean()
  isBreakfast?: boolean;

  @IsOptional()
  @IsBoolean()
  isLunch?: boolean;

  @IsOptional()
  @IsBoolean()
  isDinner?: boolean;

  @IsOptional()
  @IsBoolean()
  isQuickMeal?: boolean;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  googleMapsUrl?: string;

  @IsOptional()
  @IsString()
  directionsText?: string;

  @IsOptional()
  @IsString()
  navigationType?: string;

  @IsOptional()
  @IsNumber()
  reviewUserId?: number;

  @IsOptional()
  @IsNumber()
  reviewRating?: number;

  @IsOptional()
  @IsString()
  reviewComment?: string;
}
