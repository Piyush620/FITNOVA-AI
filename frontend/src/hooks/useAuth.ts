import { useAuthStore } from '../stores/authStore';

export const useAuth = () => {
  const {
    user,
    accessToken,
    isLoading,
    error,
    login,
    register,
    logout,
    getCurrentUser,
    clearError,
    setTokens,
  } = useAuthStore();

  const isAuthenticated = !!accessToken && !!user;

  return {
    user,
    accessToken,
    isLoading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    getCurrentUser,
    clearError,
    setTokens,
  };
};
