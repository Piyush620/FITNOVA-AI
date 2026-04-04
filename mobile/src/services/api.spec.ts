import type { AuthTokens, User } from '@/types';

type MockAxiosInstance = jest.Mock & {
  interceptors: {
    request: { use: jest.Mock };
    response: { use: jest.Mock };
  };
  get: jest.Mock;
  post: jest.Mock;
  patch: jest.Mock;
  delete: jest.Mock;
};

const createAxiosInstance = (): MockAxiosInstance => {
  const instance = jest.fn() as MockAxiosInstance;

  instance.interceptors = {
    request: {
      use: jest.fn(),
    },
    response: {
      use: jest.fn(),
    },
  };
  instance.get = jest.fn();
  instance.post = jest.fn();
  instance.patch = jest.fn();
  instance.delete = jest.fn();

  return instance;
};

const mockAxiosPost = jest.fn();
const mockAxiosCreate = jest.fn(() => createAxiosInstance());

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: mockAxiosCreate,
    post: mockAxiosPost,
  },
  create: mockAxiosCreate,
  post: mockAxiosPost,
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

const buildUser = (): User => ({
  id: 'user-1',
  email: 'demo@fitnova.ai',
  roles: ['user'],
  profile: {
    fullName: 'Demo User',
  },
  createdAt: '2026-04-01T00:00:00.000Z',
});

describe('mobile api client auth interceptors', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockAxiosCreate.mockImplementation(() => createAxiosInstance());
  });

  it('adds the access token to outgoing requests when one is stored', async () => {
    const { storage, storageKeys } = require('@/lib/storage');
    const { default: apiClient } = require('@/services/api');

    const requestHandler = (apiClient.interceptors.request.use as jest.Mock).mock.calls[0][0];
    jest.mocked(storage.getItem).mockResolvedValueOnce('stored-access-token');

    const config = await requestHandler({ headers: {} });

    expect(storage.getItem).toHaveBeenCalledWith(storageKeys.accessToken);
    expect(config.headers.Authorization).toBe('Bearer stored-access-token');
  });

  it('refreshes tokens and retries the original request after a 401', async () => {
    const nextTokens: AuthTokens = {
      accessToken: 'next-access-token',
      refreshToken: 'next-refresh-token',
    };

    const { storage, storageKeys } = require('@/lib/storage');
    const { default: apiClient } = require('@/services/api');

    const responseErrorHandler = (apiClient.interceptors.response.use as jest.Mock).mock.calls[0][1];
    const originalRequest = {
      headers: {},
    };

    jest.mocked(storage.getItem).mockResolvedValueOnce(nextTokens.refreshToken as string);
    mockAxiosPost.mockResolvedValueOnce({
      data: {
        user: buildUser(),
        tokens: nextTokens,
      },
    });
    jest.mocked(apiClient).mockResolvedValueOnce({ data: { ok: true } });

    const result = await responseErrorHandler({
      response: { status: 401 },
      config: originalRequest,
    });

    expect(mockAxiosPost).toHaveBeenCalledWith('http://10.0.2.2:4000/api/v1/auth/refresh', {
      refreshToken: nextTokens.refreshToken,
    });
    expect(storage.setItem).toHaveBeenCalledWith(storageKeys.accessToken, nextTokens.accessToken);
    expect(storage.setItem).toHaveBeenCalledWith(storageKeys.refreshToken, nextTokens.refreshToken);
    expect(apiClient).toHaveBeenCalledWith({
      ...originalRequest,
      _retry: true,
      headers: {
        Authorization: `Bearer ${nextTokens.accessToken}`,
      },
    });
    expect(result).toEqual({ data: { ok: true } });
  });

  it('clears stored auth state when refresh cannot run', async () => {
    const { storage, storageKeys } = require('@/lib/storage');
    const { default: apiClient } = require('@/services/api');

    const responseErrorHandler = (apiClient.interceptors.response.use as jest.Mock).mock.calls[0][1];

    jest.mocked(storage.getItem).mockResolvedValueOnce(null);

    await expect(
      responseErrorHandler({
        response: { status: 401 },
        config: { headers: {} },
      }),
    ).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(storage.multiRemove).toHaveBeenCalledWith([
      storageKeys.accessToken,
      storageKeys.refreshToken,
    ]);
    expect(mockAxiosPost).not.toHaveBeenCalled();
  });
});
