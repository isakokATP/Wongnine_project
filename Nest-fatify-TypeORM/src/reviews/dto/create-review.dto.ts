import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsArray,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateRestaurantDto } from '../../restaurants/dto/create-restaurant.dto';

export class CreateReviewDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty({ message: 'กรุณากรอกข้อความรีวิว' })
  comment: string;

  @IsNumber()
  @Min(0)
  @Max(5)
  rating: number;

  // เพิ่มใหม่
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @ValidateIf((o) => !o.newRestaurant)
  @IsNumber()
  @IsNotEmpty()
  restaurantId?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  reviewImageUrls?: string[];

  @ValidateIf((o) => !o.restaurantId)
  @ValidateNested()
  @Type(() => CreateRestaurantDto)
  @IsOptional()
  newRestaurant?: CreateRestaurantDto;
}
