import { Stack } from 'expo-router';

import { AppProviders } from '@/providers/AppProviders';
import { colors } from '@/theme/colors';

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      />
    </AppProviders>
  );
}
