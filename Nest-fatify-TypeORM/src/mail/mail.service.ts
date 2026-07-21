import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter;

  constructor() {

    console.log('--- ตรวจสอบการตั้งค่าอีเมล ---');
    console.log('GMAIL_USER:', process.env.GMAIL_USER);
    console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? 'มีรหัส (Loaded)' : 'ไม่มีรหัส (Undefined)');
    console.log('---------------------------');
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  async sendVerificationEmail(toEmail: string, name: string, token: string) {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: `"Wong Nine" <${process.env.GMAIL_USER}>`,
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
