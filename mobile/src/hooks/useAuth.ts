import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const store = useAuthStore();

  return {
    ...store,
    isAuthenticated: Boolean(store.accessToken && store.user),
    hasSession: Boolean(store.accessToken),
  };
}
