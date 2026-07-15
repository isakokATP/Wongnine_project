import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) {}

    async register(createUserDto: CreateUserDto) {
        const user = await this.usersService.create(createUserDto);
        return this.generateToken(user.id, user.email);
    }

    async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(loginDto.email);
    if (!user || !user.password) {
        throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
        throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    return this.generateToken(user.id, user.email);
}

    private generateToken(userId: number, email: string) {
        const payload = { sub: userId, email };
        return {
            accessToken: this.jwtService.sign(payload),
        };
    }
}