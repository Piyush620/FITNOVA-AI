import { authAPI } from '@/services/api';
import { storage, storageKeys } from '@/lib/storage';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types';

jest.mock('@/services/api', () => ({
  authAPI: {
    login: jest.fn(),
    register: jest.fn(),
    verifyEmail: jest.fn(),
    resendEmailOtp: jest.fn(),
    getCurrentUser: jest.fn(),
  },
  getApiErrorMessage: jest.fn((message?: string | string[]) =>
    Array.isArray(message) ? message.join(', ') : message,
  ),
}));

jest.mock('@/lib/storage', () => ({
  storageKeys: {
    accessToken: 'fitnova.mobile.accessToken',
    refreshToken: 'fitnova.mobile.refreshToken',
  },
  storage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    multiRemove: jest.fn(),
  },
}));

const mockedAuthApi = jest.mocked(authAPI);
const mockedStorage = jest.mocked(storage);

const buildUser = (): User => ({
  id: 'user-1',
  email: 'demo@fitnova.ai',
  roles: ['user'],
  profile: {
    fullName: 'Demo User',
    goal: 'Fat loss',
  },
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-01T00:00:00.000Z',
});

function resetAuthStore() {
  useAuthStore.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
    hasHydrated: false,
    isLoading: false,
    error: null,
  });
}

describe('useAuthStore', () => {
  beforeEach(() => {
    resetAuthStore();
    jest.clearAllMocks();
  });

  it('hydrates persisted tokens and fetches the current user when a session exists', async () => {
    const user = buildUser();

    mockedStorage.getItem
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');
    mockedAuthApi.getCurrentUser.mockResolvedValueOnce({ data: user } as never);

    await useAuthStore.getState().hydrate();

    expect(mockedStorage.getItem).toHaveBeenNthCalledWith(1, storageKeys.accessToken);
    expect(mockedStorage.getItem).toHaveBeenNthCalledWith(2, storageKeys.refreshToken);
    expect(mockedAuthApi.getCurrentUser).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState()).toMatchObject({
      user,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      hasHydrated: true,
      error: null,
    });
  });

  it('logs in, persists tokens, and updates state', async () => {
    const user = buildUser();

    mockedAuthApi.login.mockResolvedValueOnce({
      data: {
        user,
        tokens: {
          accessToken: 'next-access-token',
          refreshToken: 'next-refresh-token',
        },
      },
    } as never);

    await useAuthStore.getState().login('demo@fitnova.ai', 'secret');

    expect(mockedAuthApi.login).toHaveBeenCalledWith({
      email: 'demo@fitnova.ai',
      password: 'secret',
    });
    expect(mockedStorage.setItem).toHaveBeenCalledWith(
      storageKeys.accessToken,
      'next-access-token',
    );
    expect(mockedStorage.setItem).toHaveBeenCalledWith(
      storageKeys.refreshToken,
      'next-refresh-token',
    );
    expect(useAuthStore.getState()).toMatchObject({
      user,
      accessToken: 'next-access-token',
      refreshToken: 'next-refresh-token',
      isLoading: false,
      error: null,
    });
  });

  it('clears persisted credentials on logout', async () => {
    useAuthStore.setState({
      user: buildUser(),
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      hasHydrated: true,
      isLoading: false,
      error: 'stale error',
    });

    await useAuthStore.getState().logout();

    expect(mockedStorage.multiRemove).toHaveBeenCalledWith([
      storageKeys.accessToken,
      storageKeys.refreshToken,
    ]);
    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      accessToken: null,
      refreshToken: null,
      error: null,
    });
  });

  it('stores a readable error when login fails', async () => {
    const loginError = Object.assign(new Error('Request failed'), {
      response: {
        data: {
          message: ['Invalid credentials'],
        },
      },
    });

    mockedAuthApi.login.mockRejectedValueOnce(loginError);

    await expect(
      useAuthStore.getState().login('demo@fitnova.ai', 'wrong-password'),
    ).rejects.toBeDefined();

    expect(useAuthStore.getState()).toMatchObject({
      isLoading: false,
      error: 'Invalid credentials',
    });
  });
});
