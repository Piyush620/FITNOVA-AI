import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { Role } from 'src/common/enums/role.enum';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { User } from './schemas/user.schema';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let mockUserModel: any;
  let mockJwtService: { signAsync: jest.Mock };
  let mockConfigService: { get: jest.Mock; getOrThrow: jest.Mock };
  let mockSubscriptionsService: { getCurrentSubscription: jest.Mock };
  let mockBcryptHash: jest.Mock;
  let mockBcryptCompare: jest.Mock;

  beforeEach(async () => {
    mockUserModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };

    mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('test-token'),
    };

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: unknown) => {
        if (key === 'auth.bcryptSaltRounds') {
          return 12;
        }
        return defaultValue;
      }),
      getOrThrow: jest.fn().mockImplementation((key: string) => {
        if (key === 'auth.refreshSecret') {
          return 'refresh-secret';
        }

        if (key === 'auth.refreshTtl') {
          return '7d';
        }

        throw new Error(`Unexpected config key: ${key}`);
      }),
    };
    mockSubscriptionsService = {
      getCurrentSubscription: jest.fn().mockResolvedValue({
        tier: 'free',
        plan: 'free',
        status: 'inactive',
        hasPremiumAccess: false,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      }),
    };

    mockBcryptHash = bcrypt.hash as jest.Mock;
    mockBcryptCompare = bcrypt.compare as jest.Mock;
    mockBcryptHash.mockReset();
    mockBcryptCompare.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: 'SubscriptionsService',
          useValue: mockSubscriptionsService,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    })
      .useMocker((token) => {
        if (typeof token === 'function' && token.name === 'SubscriptionsService') {
          return mockSubscriptionsService;
        }
      })
      .compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('registers a new user and returns tokens', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        goal: 'fat loss',
        activityLevel: 'moderate',
      };

      const save = jest.fn().mockResolvedValue(undefined);
      const createdUser = {
        id: 'user-id',
        email: registerDto.email,
        roles: [Role.USER],
        profile: {
          fullName: registerDto.fullName,
          goal: registerDto.goal,
          activityLevel: registerDto.activityLevel,
        },
        save,
      };

      mockUserModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });
      mockUserModel.create.mockResolvedValue(createdUser);
      mockBcryptHash.mockResolvedValue('hashed-value');

      const result = await service.register(registerDto);

      expect(mockUserModel.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        passwordHash: 'hashed-value',
        roles: [Role.USER],
        profile: {
          fullName: 'Test User',
          age: undefined,
          gender: undefined,
          heightCm: undefined,
          weightKg: undefined,
          goal: 'fat loss',
          activityLevel: 'moderate',
        },
      });
      expect(result.user.email).toBe(registerDto.email);
      expect(result.user.subscription?.hasPremiumAccess).toBe(false);
      expect(result.tokens.accessToken).toBe('test-token');
      expect(result.tokens.refreshToken).toBe('test-token');
      expect(save).toHaveBeenCalled();
    });

    it('throws when the email already exists', async () => {
      mockUserModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ email: 'existing@example.com' }),
      });

      await expect(
        service.register({
          email: 'existing@example.com',
          password: 'password123',
          fullName: 'Existing User',
        }),
      ).rejects.toThrow('An account with this email already exists.');
    });
  });

  describe('login', () => {
    it('logs in successfully with valid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const save = jest.fn().mockResolvedValue(undefined);
      const mockUser = {
        id: 'user-id',
        email: loginDto.email,
        roles: [Role.USER],
        profile: { fullName: 'Test User' },
        passwordHash: 'stored-hash',
        save,
      };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      mockBcryptCompare.mockResolvedValue(true);
      mockBcryptHash.mockResolvedValue('hashed-refresh-token');

      const result = await service.login(loginDto);

      expect(result.user.email).toBe(loginDto.email);
      expect(result.tokens.accessToken).toBe('test-token');
      expect(result.tokens.refreshToken).toBe('test-token');
      expect(save).toHaveBeenCalled();
    });

    it('fails with an invalid email', async () => {
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow('Invalid credentials.');
    });
  });

  describe('getProfile', () => {
    it('returns the user profile payload', async () => {
      const userId = 'user-id';
      const mockUser = {
        _id: { toString: () => userId },
        email: 'test@example.com',
        roles: [Role.USER],
        profile: { fullName: 'Test User' },
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        updatedAt: new Date('2026-03-02T00:00:00.000Z'),
      };

      mockUserModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.getProfile(userId);

      expect(result).toEqual({
        id: userId,
        email: mockUser.email,
        roles: mockUser.roles,
        profile: mockUser.profile,
        subscription: {
          tier: 'free',
          plan: 'free',
          status: 'inactive',
          hasPremiumAccess: false,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        },
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });
  });

  describe('refreshTokens', () => {
    it('refreshes tokens for a valid session', async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        roles: [Role.USER],
        profile: { fullName: 'Test User' },
        refreshTokenHash: 'stored-refresh-hash',
        save,
      };

      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      mockBcryptCompare.mockResolvedValue(true);
      mockBcryptHash.mockResolvedValue('new-refresh-hash');

      const result = await service.refreshTokens('user-id', 'refresh-token');

      expect(result.tokens.accessToken).toBe('test-token');
      expect(result.tokens.refreshToken).toBe('test-token');
      expect(save).toHaveBeenCalled();
    });
  });
});
