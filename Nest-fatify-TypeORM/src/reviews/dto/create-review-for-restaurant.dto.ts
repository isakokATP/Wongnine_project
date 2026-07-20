import { IsString, IsNotEmpty, IsNumber, Min, Max, IsOptional, IsArray } from 'class-validator';

export class CreateReviewForRestaurantDto {
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

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    imageUrls?: string[];
}