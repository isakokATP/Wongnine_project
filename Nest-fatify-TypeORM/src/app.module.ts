import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
      migrations: ['dist/migrations/*.js'],
      migrationsRun: process.env.NODE_ENV === 'production', // รัน migration อัตโนมัติตอน production start
    }),
    UsersModule,
    RestaurantsModule,
    ReviewsModule,
    AuthModule,
  ],
})
export class AppModule {}
