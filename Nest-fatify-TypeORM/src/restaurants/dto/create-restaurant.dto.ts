import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  IsInt,
  Matches,
  IsArray,
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
  capacity?: number;

  @IsInt()
  @Min(0)
  minPrice: number;

  @IsInt()
  @Min(0)
  maxPrice: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  reviewImageUrls?: string[];

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'รูปแบบเวลาต้องเป็น HH:mm เช่น 11:00',
  })
  openTime: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'รูปแบบเวลาต้องเป็น HH:mm เช่น 18:00',
  })
  closeTime: string;

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
