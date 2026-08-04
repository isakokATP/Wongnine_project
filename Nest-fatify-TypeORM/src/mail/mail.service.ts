import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend;

  constructor() {
    console.log('--- ตรวจสอบการตั้งค่าอีเมล ---');
    console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'มีรหัส (Loaded)' : 'ไม่มีรหัส (Undefined)');
    console.log('---------------------------');

    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendVerificationEmail(toEmail: string, name: string, token: string) {
    const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

    try {
      await this.resend.emails.send({
        from: 'Wong Nine <onboarding@resend.dev>',
        to: toEmail,
        subject: 'ยืนยันอีเมลของคุณ - Wong Nine',
        html: `
                    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                        <h2>สวัสดีคุณ ${name}</h2>
                        <p>กรุณากดปุ่มด้านล่างเพื่อยืนยันอีเมลของคุณ</p>
                        <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background: #6E8F72; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">
                            ยืนยันอีเมล
                        </a>
                        <p style="color: #888; font-size: 13px;">ลิงก์นี้จะหมดอายุใน 24 ชั่วโมง</p>
                        <p style="color: #888; font-size: 13px;">หากปุ่มกดไม่ได้ ให้คัดลอกลิงก์นี้ไปวางในเบราว์เซอร์: ${verifyUrl}</p>
                    </div>
                `,
      });
    } catch (err) {
      this.logger.error('Failed to send verification email', err);
    }
  }
}