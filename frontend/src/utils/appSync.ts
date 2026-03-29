const dispatchWindowEvent = (eventName: string) => {
  window.dispatchEvent(new Event(eventName));
};

const writeStorageSignal = (key: string) => {
  try {
    localStorage.setItem(key, `${Date.now()}`);
  } catch {
    // Ignore storage write failures and still dispatch the in-tab event.
  }
};

export const notifyCaloriesChanged = () => {
  dispatchWindowEvent('fitnova:calories-sync');
  writeStorageSignal('fitnova-calories-sync');
};
