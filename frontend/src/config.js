/**
 * Mobil ve Web platformları için yapılandırma
 */

// Capacitor import - mobil platform kontrolü için
let Capacitor;
try {
  Capacitor = require('@capacitor/core').Capacitor;
} catch (e) {
  // Capacitor henüz yüklenmemişse, web platformu varsayımı
  Capacitor = {
    isNativePlatform: () => false,
    getPlatform: () => 'web'
  };
}

/**
 * API Base URL
 * - Mobil platformlarda: Gerçek sunucu URL'i kullanılır
 * - Web platformunda: Localhost kullanılır (geliştirme için)
 */
export const API_BASE_URL = Capacitor.isNativePlatform() 
  ? process.env.REACT_APP_API_URL || 'https://your-server-domain.com/api'  // Production sunucu URL'inizi buraya girin
  : process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

/**
 * Platform kontrolü
 */
export const IS_MOBILE = Capacitor.isNativePlatform();
export const PLATFORM = Capacitor.getPlatform(); // 'ios', 'android', veya 'web'
export const IS_IOS = PLATFORM === 'ios';
export const IS_ANDROID = PLATFORM === 'android';
export const IS_WEB = PLATFORM === 'web';

/**
 * Uygulama yapılandırması
 */
export const APP_CONFIG = {
  // Mobilde daha az sayfa başına öğe göster (performans için)
  itemsPerPage: IS_MOBILE ? 20 : 50,
  
  // Mobilde animasyonları azalt
  enableAnimations: !IS_MOBILE,
  
  // Image quality (mobilde daha düşük kalite kullan)
  imageQuality: IS_MOBILE ? 75 : 90,
  
  // Request timeout
  requestTimeout: 10000,
  
  // Cache TTL (milliseconds)
  cacheTTL: 5 * 60 * 1000, // 5 dakika
};

/**
 * Feature flags
 */
export const FEATURES = {
  // Kamera erişimi (sadece mobil)
  camera: IS_MOBILE,
  
  // Push notifications (sadece mobil)
  pushNotifications: IS_MOBILE,
  
  // Offline mode (sadece mobil)
  offlineMode: IS_MOBILE,
  
  // File system access (sadece mobil)
  fileSystem: IS_MOBILE,
};

export default {
  API_BASE_URL,
  IS_MOBILE,
  IS_IOS,
  IS_ANDROID,
  IS_WEB,
  PLATFORM,
  APP_CONFIG,
  FEATURES,
};
