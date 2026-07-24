import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { RefreshToken } from './entities/refresh-token.entity';
import { UsersModule } from '../users/users.module';
import { EmailVerification } from './entities/email-verification.entity';
import { MailModule } from '../mail/mail.module';
import { GoogleStrategy } from './google.strategy';
import { MicrosoftStrategy } from './microsoft.strategy';

@Module({
    imports: [
        UsersModule,
        PassportModule,
        MailModule,
        TypeOrmModule.forFeature([RefreshToken, EmailVerification]),
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'dev-secret-change-this-in-production',
            signOptions: { expiresIn: '15m' },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, GoogleStrategy, MicrosoftStrategy],
    exports: [AuthService],
})
export class AuthModule {}