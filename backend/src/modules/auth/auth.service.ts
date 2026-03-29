import {
  ConflictException,
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { StringValue } from 'ms';

import { Role } from 'src/common/enums/role.enum';
import { SubscriptionsService } from 'src/modules/subscriptions/subscriptions.service';

import { LoginDto } from './dto/login.dto';
import { ResendEmailOtpDto } from './dto/resend-email-otp.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailOtpDto } from './dto/verify-email-otp.dto';
import { EmailService } from './email.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly emailService: EmailService,
  ) {}

  async register(payload: RegisterDto) {
    const existingUser = await this.userModel.findOne({ email: payload.email.toLowerCase() }).lean();
    if (existingUser) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await this.hashValue(payload.password);
    const otp = this.generateOtp();
    const otpExpiresAt = this.createOtpExpiry();
    const user = await this.userModel.create({
      email: payload.email.toLowerCase(),
      passwordHash,
      roles: [Role.USER],
      isEmailVerified: false,
      emailVerificationOtpHash: await this.hashValue(otp),
      emailVerificationOtpExpiresAt: otpExpiresAt,
      emailVerificationSentAt: new Date(),
      profile: {
        fullName: payload.fullName,
        age: payload.age,
        gender: payload.gender,
        heightCm: payload.heightCm,
        weightKg: payload.weightKg,
        goal: payload.goal,
        activityLevel: payload.activityLevel,
      },
    });

    await this.emailService.sendEmailVerificationOtp(
      user.email,
      user.profile.fullName,
      otp,
      this.getOtpTtlMinutes(),
    );

    return {
      email: user.email,
      verificationRequired: true,
      message: 'Account created. Enter the OTP sent to your email to verify your account.',
    };
  }

  async login(payload: LoginDto) {
    const user = await this.userModel
      .findOne({ email: payload.email.toLowerCase() })
      .select('+passwordHash +refreshTokenHash');
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isPasswordValid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in.');
    }

    return this.buildAuthResponse(user);
  }

  async verifyEmailOtp(payload: VerifyEmailOtpDto) {
    const user = await this.userModel
      .findOne({ email: payload.email.toLowerCase() })
      .select('+passwordHash +refreshTokenHash +emailVerificationOtpHash +emailVerificationOtpExpiresAt');

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (user.isEmailVerified) {
      return this.buildAuthResponse(user);
    }

    if (!user.emailVerificationOtpHash || !user.emailVerificationOtpExpiresAt) {
      throw new BadRequestException('Verification code is not available. Request a new OTP.');
    }

    if (user.emailVerificationOtpExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Verification code has expired. Request a new OTP.');
    }

    const isOtpValid = await bcrypt.compare(payload.otp, user.emailVerificationOtpHash);
    if (!isOtpValid) {
      throw new BadRequestException('Invalid verification code.');
    }

    user.isEmailVerified = true;
    user.emailVerificationOtpHash = undefined;
    user.emailVerificationOtpExpiresAt = undefined;
    user.emailVerifiedAt = new Date();

    return this.buildAuthResponse(user);
  }

  async resendEmailOtp(payload: ResendEmailOtpDto) {
    const user = await this.userModel
      .findOne({ email: payload.email.toLowerCase() })
      .select('+emailVerificationOtpHash +emailVerificationOtpExpiresAt');

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified.');
    }

    const otp = this.generateOtp();
    user.emailVerificationOtpHash = await this.hashValue(otp);
    user.emailVerificationOtpExpiresAt = this.createOtpExpiry();
    user.emailVerificationSentAt = new Date();
    await user.save();

    await this.emailService.sendEmailVerificationOtp(
      user.email,
      user.profile.fullName,
      otp,
      this.getOtpTtlMinutes(),
    );

    return {
      email: user.email,
      verificationRequired: true,
      message: 'A new verification OTP has been sent to your email.',
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.userModel.findById(userId).select('+passwordHash +refreshTokenHash');
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh session is invalid.');
    }

    const isTokenValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isTokenValid) {
      throw new UnauthorizedException('Refresh session is invalid.');
    }

    return this.buildAuthResponse(user);
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const subscription = await this.subscriptionsService.getCurrentSubscription(userId);

    return {
      id: user._id.toString(),
      email: user.email,
      roles: user.roles,
      profile: user.profile,
      subscription,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private async buildAuthResponse(user: UserDocument) {
    const tokens = await this.issueTokens({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });

    user.refreshTokenHash = await this.hashValue(tokens.refreshToken);
    user.lastLoginAt = new Date();
    await user.save();

    const subscription = await this.subscriptionsService.getCurrentSubscription(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles,
        profile: user.profile,
        isEmailVerified: user.isEmailVerified,
        subscription,
      },
      tokens,
    };
  }

  private async issueTokens(payload: JwtPayload) {
    const refreshSecret = this.configService.getOrThrow<string>('auth.refreshSecret');
    const refreshTtl = this.configService.getOrThrow<string>('auth.refreshTtl') as StringValue;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshTtl,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async hashValue(value: string) {
    const saltRounds = this.configService.get<number>('auth.bcryptSaltRounds', 12);
    return bcrypt.hash(value, saltRounds);
  }

  private generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private getOtpTtlMinutes() {
    return this.configService.get<number>('auth.emailVerificationOtpTtlMinutes', 10);
  }

  private createOtpExpiry() {
    return new Date(Date.now() + this.getOtpTtlMinutes() * 60_000);
  }
}
