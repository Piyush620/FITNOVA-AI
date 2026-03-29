import { useAuthStore } from '../stores/authStore';

export const useAuth = () => {
  const {
    user,
    accessToken,
    isLoading,
    hasHydrated,
    error,
    login,
    register,
    verifyEmailOtp,
    resendEmailOtp,
    logout,
    getCurrentUser,
    clearError,
    setTokens,
  } = useAuthStore();

  const isAuthenticated = !!accessToken && !!user;
  const hasSession = !!accessToken;

  return {
    user,
    accessToken,
    isLoading,
    hasHydrated,
    error,
    isAuthenticated,
    hasSession,
    login,
    register,
    verifyEmailOtp,
    resendEmailOtp,
    logout,
    getCurrentUser,
    clearError,
    setTokens,
  };
};
