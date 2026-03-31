import { Redirect } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';

export default function IndexScreen() {
  const { hasHydrated, isAuthenticated } = useAuth();

  if (!hasHydrated) {
    return null;
  }

  return <Redirect href={isAuthenticated ? '/(tabs)/dashboard' : '/(auth)/login'} />;
}
