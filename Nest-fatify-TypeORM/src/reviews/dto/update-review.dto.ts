import { IsString, IsNumber, Min, Max, IsOptional, IsArray } from 'class-validator';

export class UpdateReviewDto {
    @IsNumber()
    userId: number;

    @IsOptional()
    @IsString()
    comment?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(5)
    rating?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    imageUrls?: string[];
}