import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendEmailVerificationOtp(email: string, fullName: string, otp: string, expiresInMinutes: number) {
    const transporter = this.createTransporter();
    const from = this.configService.get<string>('email.from');

    await transporter.sendMail({
      from,
      to: email,
      subject: 'Verify your FitNova AI account',
      html: `
        <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
          <h2 style="margin-bottom: 8px;">Verify your email</h2>
          <p>Hi ${this.escapeHtml(fullName)},</p>
          <p>Your FitNova AI verification code is:</p>
          <div style="margin: 20px 0; font-size: 32px; font-weight: 700; letter-spacing: 8px;">${otp}</div>
          <p>This code expires in ${expiresInMinutes} minutes.</p>
          <p>If you did not create this account, you can ignore this email.</p>
        </div>
      `,
      text: `Hi ${fullName}, your FitNova AI verification code is ${otp}. It expires in ${expiresInMinutes} minutes.`,
    });

    this.logger.log(`Sent verification OTP to ${email}`);
  }

  private createTransporter() {
    const user = this.configService.get<string>('email.user');
    const pass = this.configService.get<string>('email.pass');

    if (!user || !pass) {
      throw new InternalServerErrorException(
        'Email delivery is not configured. Set SMTP_USER, SMTP_PASS, and EMAIL_FROM before allowing signups.',
      );
    }

    return nodemailer.createTransport({
      host: this.configService.get<string>('email.host', 'smtp.gmail.com'),
      port: this.configService.get<number>('email.port', 465),
      secure: this.configService.get<boolean>('email.secure', true),
      auth: { user, pass },
    });
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
