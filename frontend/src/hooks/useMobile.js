/**
 * Custom React Hook - Mobil platform kontrolü ve özellikler
 */

import { useState, useEffect, useCallback } from 'react';
import { IS_MOBILE, IS_IOS, IS_ANDROID, PLATFORM } from '../config';

// Capacitor plugins (lazy load - web'de hata vermemesi için)
let StatusBar, Keyboard, Haptics, App, Network;

if (IS_MOBILE) {
  try {
    ({ StatusBar } = require('@capacitor/status-bar'));
    ({ Keyboard } = require('@capacitor/keyboard'));
    ({ Haptics, ImpactStyle } = require('@capacitor/haptics'));
    ({ App } = require('@capacitor/app'));
    ({ Network } = require('@capacitor/network'));
  } catch (e) {
    console.warn('Capacitor plugins yüklenemedi:', e);
  }
}

/**
 * Platform bilgisi hook
 */
export const usePlatform = () => {
  return {
    isMobile: IS_MOBILE,
    isIOS: IS_IOS,
    isAndroid: IS_ANDROID,
    isWeb: !IS_MOBILE,
    platform: PLATFORM,
  };
};

/**
 * Klavye dinleme hook
 */
export const useKeyboard = () => {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!IS_MOBILE || !Keyboard) return;

    const showListener = Keyboard.addListener('keyboardWillShow', (info) => {
      setKeyboardVisible(true);
      setKeyboardHeight(info.keyboardHeight);
    });

    const hideListener = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  const hideKeyboard = useCallback(async () => {
    if (IS_MOBILE && Keyboard) {
      await Keyboard.hide();
    }
  }, []);

  return {
    keyboardVisible,
    keyboardHeight,
    hideKeyboard,
  };
};

/**
 * Network durumu hook
 */
export const useNetwork = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState('unknown');

  useEffect(() => {
    // İlk durumu al
    const checkNetworkStatus = async () => {
      if (IS_MOBILE && Network) {
        const status = await Network.getStatus();
        setIsOnline(status.connected);
        setConnectionType(status.connectionType);
      } else {
        // Web için navigator API kullan
        setIsOnline(navigator.onLine);
      }
    };

    checkNetworkStatus();

    // Network değişikliklerini dinle
    if (IS_MOBILE && Network) {
      const listener = Network.addListener('networkStatusChange', (status) => {
        setIsOnline(status.connected);
        setConnectionType(status.connectionType);
      });

      return () => {
        listener.remove();
      };
    } else {
      // Web için event listeners
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  return {
    isOnline,
    connectionType,
  };
};

/**
 * Haptic feedback hook
 */
export const useHaptics = () => {
  const vibrate = useCallback(async (style = 'medium') => {
    if (!IS_MOBILE || !Haptics) return;

    try {
      const { ImpactStyle } = require('@capacitor/haptics');
      const styleMap = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy,
      };

      await Haptics.impact({ style: styleMap[style] || ImpactStyle.Medium });
    } catch (e) {
      console.warn('Haptic feedback hatası:', e);
    }
  }, []);

  const notificationVibrate = useCallback(async (type = 'success') => {
    if (!IS_MOBILE || !Haptics) return;

    try {
      const { NotificationType } = require('@capacitor/haptics');
      const typeMap = {
        success: NotificationType.Success,
        warning: NotificationType.Warning,
        error: NotificationType.Error,
      };

      await Haptics.notification({ type: typeMap[type] || NotificationType.Success });
    } catch (e) {
      console.warn('Haptic notification hatası:', e);
    }
  }, []);

  return {
    vibrate,
    notificationVibrate,
  };
};

/**
 * App state hook (app background/foreground)
 */
export const useAppState = (onStateChange) => {
  const [appState, setAppState] = useState('active');

  useEffect(() => {
    if (!IS_MOBILE || !App) return;

    const listener = App.addListener('appStateChange', ({ isActive }) => {
      const state = isActive ? 'active' : 'background';
      setAppState(state);
      
      if (onStateChange) {
        onStateChange(state);
      }
    });

    return () => {
      listener.remove();
    };
  }, [onStateChange]);

  return appState;
};

/**
 * Back button handler hook (Android)
 */
export const useBackButton = (handler) => {
  useEffect(() => {
    if (!IS_ANDROID || !App) return;

    const listener = App.addListener('backButton', (event) => {
      if (handler) {
        handler(event);
      }
    });

    return () => {
      listener.remove();
    };
  }, [handler]);
};

/**
 * Safe area insets hook
 */
export const useSafeArea = () => {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    // CSS safe-area-inset değerlerini oku
    const computeSafeArea = () => {
      const style = getComputedStyle(document.documentElement);
      
      setSafeArea({
        top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
        bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0'),
        right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
      });
    };

    computeSafeArea();

    // Orientation change'de tekrar hesapla
    window.addEventListener('resize', computeSafeArea);
    
    return () => {
      window.removeEventListener('resize', computeSafeArea);
    };
  }, []);

  return safeArea;
};

/**
 * Tüm mobile utilities'i tek hook'ta topla
 */
export const useMobileUtils = () => {
  const platform = usePlatform();
  const keyboard = useKeyboard();
  const network = useNetwork();
  const haptics = useHaptics();
  const safeArea = useSafeArea();

  return {
    ...platform,
    keyboard,
    network,
    haptics,
    safeArea,
  };
};

export default useMobileUtils;
