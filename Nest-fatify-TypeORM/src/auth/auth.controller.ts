import { Controller, Post, Body, Res, Get, UseGuards, Req, HttpCode } from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

const COOKIE_NAME = 'access_token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // cookie เก็บได้สูงสุด 7 วัน

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    async register(
        @Body() createUserDto: CreateUserDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { accessToken } = await this.authService.register(createUserDto);
        this.setCookie(res, accessToken);
        return { message: 'สมัครสมาชิกสำเร็จ' };
    }

    @Post('login')
    @HttpCode(200)
    async login(
        @Body() loginDto: LoginDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { accessToken } = await this.authService.login(loginDto);
        this.setCookie(res, accessToken);
        return { message: 'เข้าสู่ระบบสำเร็จ' };
    }

    @Post('logout')
    @HttpCode(200)
    logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie(COOKIE_NAME);
        return { message: 'ออกจากระบบสำเร็จ' };
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    getMe(@Req() req: Request) {
        return req.user;
    }

    private setCookie(res: Response, token: string) {
        res.cookie(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // https เท่านั้นตอน production
            sameSite: 'lax',
            maxAge: COOKIE_MAX_AGE,
        });
    }
}