import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { UsersService } from '../users/users.service';

// ดึง token จาก httpOnly cookie แทนที่จะเป็น Authorization header
const cookieExtractor = (req: Request): string | null => {
    if (req?.cookies?.access_token) {
        return req.cookies.access_token;
    }
    return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly usersService: UsersService) {
        super({
            jwtFromRequest: cookieExtractor,
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'dev-secret-change-this-in-production',
        });
    }

    async validate(payload: { sub: number; email: string }) {
        const user = await this.usersService.findOne(payload.sub);
        if (!user) {
            throw new UnauthorizedException();
        }
        return user; // จะถูกแนบไว้ที่ req.user
    }
}