import { AuthController } from 'src/modules/auth/auth.controller';
import { AuthService } from 'src/modules/auth/auth.service';
import { RefreshJwtAuthGuard } from 'src/modules/auth/guards/refresh-jwt-auth.guard';

import { authHeaders, createTestApp } from './support/test-app';

describe('Auth HTTP flows', () => {
  const authService = {
    register: jest.fn(),
    verifyEmailOtp: jest.fn(),
    resendEmailOtp: jest.fn(),
    login: jest.fn(),
    refreshTokens: jest.fn(),
    getProfile: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(() => {
    jest
      .spyOn(RefreshJwtAuthGuard.prototype, 'canActivate')
      .mockImplementation((context) => {
        const request = context.switchToHttp().getRequest<{ headers: { authorization?: string }; user?: { sub: string } }>();
        const authorizationHeader = request.headers.authorization;

        if (authorizationHeader === 'Bearer free-token') {
          request.user = { sub: 'user-free' };
          return true;
        }

        return false;
      });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('validates registration payloads before hitting the service', async () => {
    const { app } = await createTestApp({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    });

    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'not-an-email',
        password: 'short',
        fullName: 'Test User',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(authService.register).not.toHaveBeenCalled();

    await app.close();
  });

  it('registers a user through the HTTP controller flow', async () => {
    authService.register.mockResolvedValue({
      email: 'user@fitnova.test',
      verificationRequired: true,
      message: 'OTP sent',
    });

    const { app } = await createTestApp({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    });

    const payload = {
      email: 'user@fitnova.test',
      password: 'password123',
      fullName: 'FitNova Tester',
      age: 26,
      gender: 'male',
      goal: 'fat loss',
      activityLevel: 'moderate',
    };

    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload,
    });

    expect(response.statusCode).toBe(201);
    expect(authService.register).toHaveBeenCalledWith(payload);
    expect(response.json()).toEqual({
      email: 'user@fitnova.test',
      verificationRequired: true,
      message: 'OTP sent',
    });

    await app.close();
  });

  it('refreshes tokens with the authenticated refresh-session user', async () => {
    authService.refreshTokens.mockResolvedValue({
      tokens: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      },
    });

    const { app } = await createTestApp({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    });

    const response = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      headers: authHeaders('free-token'),
      payload: {
        refreshToken: 'refresh-token-value-123456',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(authService.refreshTokens).toHaveBeenCalledWith(
      'user-free',
      'refresh-token-value-123456',
    );

    await app.close();
  });

  it('returns the current user profile for authenticated requests', async () => {
    authService.getProfile.mockResolvedValue({
      id: 'user-free',
      email: 'free@fitnova.test',
    });

    const { app } = await createTestApp({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    });

    const response = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: authHeaders('free-token'),
    });

    expect(response.statusCode).toBe(200);
    expect(authService.getProfile).toHaveBeenCalledWith('user-free');
    expect(response.json()).toEqual({
      id: 'user-free',
      email: 'free@fitnova.test',
    });

    await app.close();
  });
});
