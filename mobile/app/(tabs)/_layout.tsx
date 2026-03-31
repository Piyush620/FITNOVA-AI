import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/theme/colors';

const iconMap = {
  dashboard: 'grid',
  workouts: 'barbell',
  diet: 'restaurant',
  coach: 'chatbubbles',
  calories: 'flame',
  profile: 'person-circle',
} as const;

export default function TabsLayout() {
  const { hasHydrated, isAuthenticated } = useAuth();

  if (!hasHydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: 'rgba(10, 15, 27, 0.96)',
          borderTopColor: 'rgba(255,255,255,0.05)',
          borderTopWidth: 1,
          height: 78,
          paddingTop: 8,
          paddingBottom: 12,
        },
        tabBarIcon: ({ color, size }) => {
          const iconName = iconMap[route.name as keyof typeof iconMap] || 'ellipse';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="workouts" options={{ title: 'Workouts' }} />
      <Tabs.Screen name="diet" options={{ title: 'Diet' }} />
      <Tabs.Screen name="coach" options={{ title: 'AI Coach' }} />
      <Tabs.Screen name="calories" options={{ title: 'Calories' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
