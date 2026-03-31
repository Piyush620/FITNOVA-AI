import { PropsWithChildren, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

import { ToastProvider } from '@/providers/ToastProvider';
import { useAuthStore } from '@/stores/authStore';

export function AppProviders({ children }: PropsWithChildren) {
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <ToastProvider>
      <StatusBar style="light" />
      {children}
    </ToastProvider>
  );
}
