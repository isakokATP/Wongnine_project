import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  MinLength,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'กรุณากรอกชื่อผู้ใช้งาน' })
  name: string;

  @IsEmail({}, { message: 'รูปแบบ Email ไม่ถูกต้อง' })
  @IsNotEmpty({ message: 'กรุณากรอก Email' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' })
  password: string;

  @IsOptional()
  @IsEnum(UserRole, {
    message: 'สิทธิ์ผู้ใช้งานต้องเป็น user, admin หรือ owner เท่านั้น',
  })
  role?: UserRole;

  @IsBoolean()
  @IsOptional()
  IsActive?: boolean;
}
