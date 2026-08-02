import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // ป้องกันระบบ: ตัดฟิลด์แปลกปลอมที่แฮกเกอร์ส่งมาแต่ไม่ได้อยู่ใน DTO ทิ้งอัตโนมัติ
      transform: true, // แปลงประเภทข้อมูลที่รับมาให้ตรงกับชนิดใน DTO อัตโนมัติ
    }),
  );

  // app.useStaticAssets(join(__dirname, '..', 'uploads'), {
  //   prefix: '/uploads/',
  // });

  await app.listen(3001, '0.0.0.0');
}

bootstrap();
