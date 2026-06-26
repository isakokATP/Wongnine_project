import { IsString, IsNotEmpty, IsNumber, Min, Max, IsOptional, ValidateIf, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateRestaurantDto } from '../../restaurants/dto/create-restaurant.dto';

export class CreateReviewDto {
    @IsNumber()
    @IsNotEmpty()
    userId: number; // ในอนาคตถ้าทำระบบ Login แล้ว ค่านี้จะดึงจาก Token แทน

    @IsString()
    @IsNotEmpty({ message: 'กรุณากรอกข้อความรีวิว' })
    comment: string;

    @IsNumber()
    @Min(0)
    @Max(5)
    rating: number;

    // กรณีที่ 1: มีร้านอยู่แล้ว ให้ส่ง ID ร้านมา
    @ValidateIf(o => !o.newRestaurant) // ถ้าไม่มี newRestaurant ต้องมี restaurantId
    @IsNumber()
    @IsNotEmpty()
    restaurantId?: number;

    // กรณีที่ 2: ยังไม่มีร้าน ให้ส่งข้อมูลร้านใหม่มาทั้งก้อน
    @ValidateIf(o => !o.restaurantId) // ถ้าไม่มี restaurantId ต้องมี newRestaurant
    @ValidateNested()
    @Type(() => CreateRestaurantDto) // ใช้ DTO ของร้านอาหารมาตรวจสอบความถูกต้องต่อ
    @IsOptional()
    newRestaurant?: CreateRestaurantDto;
}