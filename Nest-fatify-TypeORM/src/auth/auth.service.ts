import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { EmailVerification } from './entities/email-verification.entity';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';

const REFRESH_TOKEN_DAYS = 30;
const VERIFICATION_TOKEN_HOURS = 24;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(EmailVerification)
    private readonly emailVerificationRepository: Repository<EmailVerification>,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async issueTokens(userId: number, email: string) {
    const accessToken = this.jwtService.sign({ sub: userId, email });

    const refreshTokenPlain = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date(
      Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
    );

    const refreshTokenEntity = this.refreshTokenRepository.create({
      tokenHash: this.hashToken(refreshTokenPlain),
      expiresAt,
      user: { id: userId },
    });
    await this.refreshTokenRepository.save(refreshTokenEntity);

    return { accessToken, refreshToken: refreshTokenPlain };
  }

  private async createAndSendVerification(
    userId: number,
    email: string,
    name: string,
  ) {
    const tokenPlain = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + VERIFICATION_TOKEN_HOURS * 60 * 60 * 1000,
    );

    const verification = this.emailVerificationRepository.create({
      tokenHash: this.hashToken(tokenPlain),
      expiresAt,
      user: { id: userId },
    });
    await this.emailVerificationRepository.save(verification);

    await this.mailService.sendVerificationEmail(email, name, tokenPlain);
  }

  async register(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);

    // ส่งอีเมลยืนยันแบบไม่บล็อก การสมัครสำเร็จแม้อีเมลจะส่งไม่ได้
    this.createAndSendVerification(user.id, user.email, user.name).catch(
      () => {},
    );

    return this.issueTokens(user.id, user.email);
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(
      loginDto.email,
    );
    if (!user || !user.password) {
      throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
    const isValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
    return this.issueTokens(user.id, user.email);
  }

  async refresh(refreshTokenPlain: string) {
    if (!refreshTokenPlain)
      throw new UnauthorizedException('ไม่พบ refresh token');

    const tokenHash = this.hashToken(refreshTokenPlain);
    const stored = await this.refreshTokenRepository.findOne({
      where: { tokenHash, revoked: false },
      relations: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token ไม่ถูกต้องหรือหมดอายุ');
    }

    stored.revoked = true;
    await this.refreshTokenRepository.save(stored);

    return this.issueTokens(stored.user.id, stored.user.email);
  }

  async revokeRefreshToken(refreshTokenPlain: string) {
    if (!refreshTokenPlain) return;
    const tokenHash = this.hashToken(refreshTokenPlain);
    await this.refreshTokenRepository.update({ tokenHash }, { revoked: true });
  }

  async verifyEmail(tokenPlain: string) {
    const tokenHash = this.hashToken(tokenPlain);
    const record = await this.emailVerificationRepository.findOne({
      where: { tokenHash, used: false },
      relations: { user: true },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('ลิงก์ยืนยันไม่ถูกต้องหรือหมดอายุแล้ว');
    }

    record.used = true;
    await this.emailVerificationRepository.save(record);

    await this.usersService.markAsVerified(record.user.id);

    return { message: 'ยืนยันอีเมลสำเร็จ' };
  }

  async resendVerification(userId: number) {
    const user = await this.usersService.findOne(userId);
    if (user.isVerified) {
      throw new BadRequestException('อีเมลนี้ยืนยันแล้ว');
    }
    await this.createAndSendVerification(user.id, user.email, user.name);
    return { message: 'ส่งอีเมลยืนยันใหม่แล้ว กรุณาตรวจสอบกล่องจดหมาย' };
  }
}
