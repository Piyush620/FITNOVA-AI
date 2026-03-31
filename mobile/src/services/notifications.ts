import { Platform } from 'react-native';

let notificationHandlerConfigured = false;

async function loadNotificationsModule() {
  return import('expo-notifications');
}

async function ensureNotificationHandler() {
  if (notificationHandlerConfigured) {
    return;
  }

  const Notifications = await loadNotificationsModule();

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  notificationHandlerConfigured = true;
}

export async function requestNotificationPermission() {
  const Device = await import('expo-device');

  if (!Device.isDevice) {
    return { granted: false, reason: 'Notifications are only available on a real device or a development build.' };
  }

  const Notifications = await loadNotificationsModule();
  const settings = await Notifications.getPermissionsAsync();
  let status = settings.status;

  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== 'granted') {
    return { granted: false, reason: 'Notification permission was not granted.' };
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('fitnova-reminders', {
      name: 'FitNova Reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  return { granted: true as const };
}

export async function scheduleDailyReminder(hour = 19, minute = 0) {
  await ensureNotificationHandler();
  const Notifications = await loadNotificationsModule();

  const permission = await requestNotificationPermission();

  if (!permission.granted) {
    return permission;
  }

  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'FitNova check-in',
      body: 'Log meals, review training, and keep today moving forward.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: 'fitnova-reminders',
    },
  });

  return { granted: true as const };
}
