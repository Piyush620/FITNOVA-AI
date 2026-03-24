import {
  ConflictException,
  Injectable,
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

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async register(payload: RegisterDto) {
    const existingUser = await this.userModel.findOne({ email: payload.email.toLowerCase() }).lean();
    if (existingUser) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await this.hashValue(payload.password);
    const user = await this.userModel.create({
      email: payload.email.toLowerCase(),
      passwordHash,
      roles: [Role.USER],
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

    return this.buildAuthResponse(user);
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

    return this.buildAuthResponse(user);
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

    return {
      id: user._id.toString(),
      email: user.email,
      roles: user.roles,
      profile: user.profile,
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

    return {
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles,
        profile: user.profile,
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
}
