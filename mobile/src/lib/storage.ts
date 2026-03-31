import AsyncStorage from '@react-native-async-storage/async-storage';

export const storageKeys = {
  accessToken: 'fitnova.mobile.accessToken',
  refreshToken: 'fitnova.mobile.refreshToken',
};

export const storage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
  multiRemove: (keys: string[]) => AsyncStorage.multiRemove(keys),
};
