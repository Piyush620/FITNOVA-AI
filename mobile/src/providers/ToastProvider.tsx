import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { colors } from '@/theme/colors';

type ToastTone = 'default' | 'success' | 'warning' | 'danger';

type ToastPayload = {
  title: string;
  message?: string;
  tone?: ToastTone;
};

type ToastContextValue = {
  showToast: (payload: ToastPayload) => void;
  hideToast: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function getToastColors(tone: ToastTone) {
  switch (tone) {
    case 'success':
      return { borderColor: 'rgba(0, 226, 138, 0.45)', accentColor: colors.success };
    case 'warning':
      return { borderColor: 'rgba(255, 184, 77, 0.45)', accentColor: colors.warning };
    case 'danger':
      return { borderColor: 'rgba(255, 107, 107, 0.45)', accentColor: colors.danger };
    default:
      return { borderColor: 'rgba(53, 208, 255, 0.35)', accentColor: colors.accent };
  }
}

export function ToastProvider({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<(ToastPayload & { id: number }) | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setToast(null);
      }
    });
  }, [opacity, translateY]);

  const showToast = useCallback(({ title, message, tone = 'default' }: ToastPayload) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setToast({
      id: Date.now(),
      title,
      message,
      tone,
    });
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    opacity.setValue(0);
    translateY.setValue(-20);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    timeoutRef.current = setTimeout(() => {
      hideToast();
    }, 2800);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [hideToast, opacity, toast, translateY]);

  const value = useMemo(
    () => ({
      showToast,
      hideToast,
    }),
    [hideToast, showToast],
  );

  const toastColors = toast ? getToastColors(toast.tone ?? 'default') : null;

  return (
    <ToastContext.Provider value={value}>
      <View style={styles.container}>
        {children}
        {toast && toastColors ? (
          <Animated.View
            pointerEvents="box-none"
            style={[
              styles.overlay,
              {
                paddingTop: insets.top + 10,
                opacity,
                transform: [{ translateY }],
              },
            ]}
          >
            <Pressable onPress={hideToast} style={[styles.toast, { borderColor: toastColors.borderColor }]}>
              <View style={[styles.accent, { backgroundColor: toastColors.accentColor }]} />
              <View style={styles.toastBody}>
                <AppText style={styles.toastTitle}>{toast.title}</AppText>
                {toast.message ? <AppText tone="muted" style={styles.toastMessage}>{toast.message}</AppText> : null}
              </View>
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider');
  }

  return context;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 50,
  },
  toast: {
    width: '100%',
    maxWidth: 460,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 22,
    backgroundColor: 'rgba(9, 14, 26, 0.98)',
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  accent: {
    width: 4,
  },
  toastBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  toastTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
  toastMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
});
