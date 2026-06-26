import {
  IsNumber,
  IsString,
  IsOptional,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';

export class UpdateReviewDto {
  @IsNotEmpty({ message: 'must identify your userId' })
  @IsNumber()
  userId: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;
}
