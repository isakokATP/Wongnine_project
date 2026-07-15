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
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'Mypass123',
      database: 'Wongnine',
      autoLoadEntities: true,
      synchronize: true,
    }),
    UsersModule,
    RestaurantsModule,
    ReviewsModule,
    AuthModule,
  ],
})
export class AppModule {}