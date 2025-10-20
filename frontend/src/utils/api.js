/**
 * API Client - Axios instance with mobile support
 */

import axios from 'axios';
import { API_BASE_URL, APP_CONFIG, IS_MOBILE } from '../config';

/**
 * Axios instance yapılandırması
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: APP_CONFIG.requestTimeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Her istek öncesi çalışır
 */
api.interceptors.request.use(
  (config) => {
    // Platform bilgisini header'a ekle
    config.headers['X-Platform'] = IS_MOBILE ? 'mobile' : 'web';
    
    // Auth token varsa ekle
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debug log (sadece development)
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request:', config.method?.toUpperCase(), config.url);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Her response sonrası çalışır
 */
api.interceptors.response.use(
  (response) => {
    // Debug log (sadece development)
    if (process.env.NODE_ENV === 'development') {
      console.log('API Response:', response.status, response.config.url);
    }
    
    return response;
  },
  (error) => {
    // Network hatası kontrolü
    if (!error.response) {
      console.error('Network Error:', error.message);
      
      // Mobilde kullanıcı dostu hata mesajı
      if (IS_MOBILE) {
        error.userMessage = 'İnternet bağlantınızı kontrol edin';
      } else {
        error.userMessage = 'Sunucuya bağlanılamıyor';
      }
    } else {
      // HTTP hata kodlarına göre mesaj
      const status = error.response.status;
      
      switch (status) {
        case 401:
          error.userMessage = 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
          // Token'ı temizle
          localStorage.removeItem('auth_token');
          // Login sayfasına yönlendir (gerekirse)
          break;
        case 403:
          error.userMessage = 'Bu işlem için yetkiniz yok.';
          break;
        case 404:
          error.userMessage = 'İstenen kaynak bulunamadı.';
          break;
        case 500:
          error.userMessage = 'Sunucu hatası oluştu.';
          break;
        default:
          error.userMessage = error.response.data?.message || 'Bir hata oluştu.';
      }
    }
    
    // Debug log
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', error.userMessage, error);
    }
    
    return Promise.reject(error);
  }
);

/**
 * API Helper Methods
 */
export const apiHelpers = {
  /**
   * GET request
   */
  get: async (url, config = {}) => {
    try {
      const response = await api.get(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * POST request
   */
  post: async (url, data, config = {}) => {
    try {
      const response = await api.post(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * PUT request
   */
  put: async (url, data, config = {}) => {
    try {
      const response = await api.put(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * DELETE request
   */
  delete: async (url, config = {}) => {
    try {
      const response = await api.delete(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * File upload
   */
  upload: async (url, file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default api;
