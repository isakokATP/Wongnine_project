import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: 'http://localhost:3000', // origin ของ Nuxt frontend ตรงๆ (ใช้ '*' ไม่ได้ตอนเปิด credentials)
    credentials: true,               // อนุญาตให้แนบ/รับ cookie ข้าม origin
  });

  app.use(cookieParser());

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(3001, '0.0.0.0');
}

bootstrap();