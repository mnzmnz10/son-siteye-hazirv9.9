/**
 * ÖRNEK: App.jsx Mobil Entegrasyonu
 * 
 * Bu dosya, mevcut App.jsx dosyanıza mobil özelliklerin nasıl ekleneceğini gösterir.
 * Bu dosyayı doğrudan kullanmayın, sadece referans olarak kullanın.
 */

import { useEffect, useState } from 'react';
import './App.css';
import './mobile.css'; // Mobil CSS'i import edin

// Mobil konfigürasyon ve hooks
import { IS_MOBILE, IS_IOS, IS_ANDROID } from './config';
import { useNetwork, useAppState } from './hooks/useMobile';

// Capacitor (sadece mobilde yüklenir)
let StatusBar, SplashScreen, Keyboard;
if (IS_MOBILE) {
  try {
    ({ StatusBar, Style } = require('@capacitor/status-bar'));
    ({ SplashScreen } = require('@capacitor/splash-screen'));
    ({ Keyboard } = require('@capacitor/keyboard'));
  } catch (e) {
    console.warn('Capacitor plugins yüklenemedi:', e);
  }
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const { isOnline } = useNetwork();

  // Uygulama başlangıcında çalışacak mobile setup
  useEffect(() => {
    const setupMobile = async () => {
      if (!IS_MOBILE) return;

      try {
        // Status bar ayarları
        if (StatusBar) {
          await StatusBar.setStyle({ style: Style.Light });
          if (IS_ANDROID) {
            await StatusBar.setBackgroundColor({ color: '#000000' });
          }
        }

        // Keyboard ayarları
        if (Keyboard) {
          // Keyboard açıldığında
          Keyboard.addListener('keyboardWillShow', (info) => {
            document.body.classList.add('keyboard-open');
            document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
          });

          // Keyboard kapandığında
          Keyboard.addListener('keyboardWillHide', () => {
            document.body.classList.remove('keyboard-open');
            document.body.style.removeProperty('--keyboard-height');
          });
        }

        // Splash screen'i gizle (uygulama hazır olduğunda)
        if (SplashScreen) {
          setTimeout(async () => {
            await SplashScreen.hide();
            setIsLoading(false);
          }, 1000);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Mobil setup hatası:', error);
        setIsLoading(false);
      }
    };

    setupMobile();
  }, []);

  // App state değişikliklerini dinle
  useAppState((state) => {
    console.log('App state changed:', state);
    
    // App background'a giderse veri senkronizasyonunu durdur
    if (state === 'background') {
      // Cleanup işlemleri
    }
    
    // App foreground'a gelirse veriyi yenile
    if (state === 'active') {
      // Refresh işlemleri
    }
  });

  // Network durumunu göster
  useEffect(() => {
    if (!isOnline) {
      // Offline mesajı göster
      console.warn('İnternet bağlantısı yok');
    }
  }, [isOnline]);

  // Loading ekranı (splash screen için)
  if (isLoading && IS_MOBILE) {
    return (
      <div className="splash-screen">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {/* Network offline indicator */}
      {!isOnline && (
        <div className="offline-indicator">
          ⚠️ İnternet bağlantısı yok
        </div>
      )}

      {/* Platform indicator (sadece development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-0 right-0 bg-blue-500 text-white px-2 py-1 text-xs z-50">
          {IS_IOS && '📱 iOS'}
          {IS_ANDROID && '🤖 Android'}
          {!IS_MOBILE && '💻 Web'}
        </div>
      )}

      {/* Buraya mevcut App.jsx içeriğinizi ekleyin */}
      <main className="full-screen">
        <h1>Karavan Katalog</h1>
        
        {/* Mobil için özel buttonlar */}
        <button 
          className="mobile-full-width"
          onClick={() => {
            // Haptic feedback (sadece mobil)
            if (IS_MOBILE && window.Haptics) {
              window.Haptics.impact({ style: 'medium' });
            }
          }}
        >
          Tıkla
        </button>
      </main>
    </div>
  );
}

export default App;

/**
 * ENTEGRASYON ADIMLARI:
 * 
 * 1. import './mobile.css'; satırını App.jsx'e ekleyin
 * 
 * 2. Config ve hooks'ları import edin:
 *    import { IS_MOBILE } from './config';
 *    import { useNetwork } from './hooks/useMobile';
 * 
 * 3. Mobile setup useEffect'ini ekleyin (yukarıdaki örneği kullanın)
 * 
 * 4. Network indicator'ı ekleyin (isteğe bağlı)
 * 
 * 5. Keyboard handling ekleyin (form sayfalarında)
 * 
 * 6. Test edin:
 *    - npm run build
 *    - npx cap sync
 *    - npx cap open android/ios
 */
