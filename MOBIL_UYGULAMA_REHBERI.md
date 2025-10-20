# Mobil Uygulama Dönüştürme Rehberi

## Genel Bakış

Bu rehber, mevcut React web uygulamanızı mobil uygulamaya dönüştürmek için adım adım talimatlar içerir. **Capacitor** kullanarak iOS ve Android için native mobil uygulamalar oluşturacağız.

## Neden Capacitor?

- ✅ Mevcut React kodunuzu %95 oranında yeniden kullanabilirsiniz
- ✅ iOS ve Android için tek kod tabanı
- ✅ Native özelliklere erişim (kamera, dosya sistemi, bildirimler, vb.)
- ✅ App Store ve Google Play'e yayınlanabilir
- ✅ Web versiyonu da aynen çalışmaya devam eder
- ✅ Kolay entegrasyon ve hızlı geliştirme

## Adım Adım Kurulum

### 1. Capacitor'ı Yükleyin

Frontend dizinine gidin ve gerekli paketleri yükleyin:

```bash
cd frontend

# Capacitor CLI ve core paketlerini yükle
npm install @capacitor/core @capacitor/cli

# iOS ve Android platformlarını yükle
npm install @capacitor/ios @capacitor/android

# Gerekli eklentileri yükle
npm install @capacitor/app @capacitor/haptics @capacitor/keyboard @capacitor/status-bar @capacitor/splash-screen @capacitor/network @capacitor/filesystem @capacitor/camera
```

### 2. Capacitor'ı Başlatın

```bash
npx cap init
```

Sizden şunları soracak:
- **App name**: Örnek: "Karavan Katalog"
- **App ID**: Örnek: "com.corlukaravan.katalog" (tersine domain formatında)
- **Web asset directory**: `build` (React build klasörü)

### 3. Platformları Ekleyin

```bash
# iOS platformu ekle (sadece Mac'te gerekli)
npx cap add ios

# Android platformu ekle
npx cap add android
```

### 4. Web Uygulamasını Build Edin

```bash
npm run build
```

### 5. Native Projeleri Senkronize Edin

```bash
npx cap sync
```

Bu komut:
- Web build'i native projelere kopyalar
- Eklentileri yükler
- Native bağımlılıkları günceller

## Mobil için Kod Optimizasyonları

### API URL Yapılandırması

Web'de `localhost` kullanabilirsiniz, ancak mobilde gerçek bir sunucu URL'i gerekir. `src` klasöründe bir yapılandırma dosyası oluşturun:

**src/config.js**
```javascript
import { Capacitor } from '@capacitor/core';

export const API_BASE_URL = Capacitor.isNativePlatform() 
  ? 'https://your-server-domain.com/api'  // Mobil için gerçek sunucu
  : 'http://localhost:8000/api';          // Web geliştirme için localhost

export const IS_MOBILE = Capacitor.isNativePlatform();
export const PLATFORM = Capacitor.getPlatform(); // 'ios', 'android', veya 'web'
```

### Axios İsteklerini Güncelleyin

Tüm axios isteklerinizde API_BASE_URL kullanın:

```javascript
import axios from 'axios';
import { API_BASE_URL } from './config';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
```

### Mobil Uyumlu UI Güncellemeleri

1. **Status Bar Entegrasyonu** - `src/App.jsx`:

```javascript
import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

function App() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Light });
      StatusBar.setBackgroundColor({ color: '#000000' });
    }
  }, []);
  
  // ... geri kalan kod
}
```

2. **Klavye Davranışı**:

```javascript
import { Keyboard } from '@capacitor/keyboard';

// Input focus olduğunda
Keyboard.addListener('keyboardWillShow', info => {
  // UI'yi klavye yüksekliğine göre ayarla
});

Keyboard.addListener('keyboardWillHide', () => {
  // UI'yi normale döndür
});
```

3. **Safe Area (Güvenli Alan) Desteği** - CSS:

```css
/* iOS notch ve Android status bar için alan bırak */
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

## Capacitor Yapılandırması

**capacitor.config.json** (veya `.ts`) dosyanızı özelleştirin:

```json
{
  "appId": "com.corlukaravan.katalog",
  "appName": "Karavan Katalog",
  "webDir": "build",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https",
    "cleartext": false
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#000000",
      "showSpinner": true,
      "spinnerColor": "#ffffff"
    },
    "StatusBar": {
      "style": "dark",
      "backgroundColor": "#000000"
    },
    "Keyboard": {
      "resize": "body",
      "style": "dark"
    }
  }
}
```

## Geliştirme Döngüsü

### Her değişiklikten sonra:

```bash
# 1. Web build
npm run build

# 2. Native projeleri güncelle
npx cap sync

# 3. İlgili IDE'de aç
npx cap open ios      # Xcode'da aç (Mac)
npx cap open android  # Android Studio'da aç
```

### Canlı Reload İçin (Geliştirme):

```bash
# package.json'a ekleyin:
"scripts": {
  "dev:mobile": "CAPACITOR_SERVER_URL=http://YOUR_IP:3000 npm start"
}
```

Ardından `capacitor.config.json` dosyasına development için:

```json
{
  "server": {
    "url": "http://192.168.1.XXX:3000",
    "cleartext": true
  }
}
```

Şimdi mobil cihazda canlı reload çalışacak!

## Icon ve Splash Screen

### App Icon:

1. 1024x1024 PNG icon oluşturun
2. Bu dosyayı kullanarak tüm boyutları oluşturun: https://www.appicon.co/
3. Oluşturulan dosyaları ilgili klasörlere kopyalayın:
   - iOS: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
   - Android: `android/app/src/main/res/` (mipmap klasörleri)

### Splash Screen:

1. 2732x2732 PNG splash image oluşturun
2. `@capacitor/assets` kullanarak otomatik oluştur:

```bash
npm install -D @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor '#000000' --splashBackgroundColor '#000000'
```

## Native Özellikler Kullanımı

### Kamera Erişimi:

```javascript
import { Camera, CameraResultType } from '@capacitor/camera';

const takePicture = async () => {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.Uri
  });
  
  const imageUrl = image.webPath;
  // imageUrl'i kullan
};
```

### Dosya Sistemi:

```javascript
import { Filesystem, Directory } from '@capacitor/filesystem';

const writeFile = async (data, filename) => {
  await Filesystem.writeFile({
    path: filename,
    data: data,
    directory: Directory.Documents
  });
};
```

### Network Durumu:

```javascript
import { Network } from '@capacitor/network';

const checkNetwork = async () => {
  const status = await Network.getStatus();
  console.log('Network status:', status);
  // { connected: true, connectionType: 'wifi' }
};

Network.addListener('networkStatusChange', status => {
  console.log('Network status changed', status);
});
```

## iOS Build (Mac Gerekli)

### Gereksinimler:
- macOS işletim sistemi
- Xcode (App Store'dan ücretsiz)
- Apple Developer hesabı ($99/yıl)

### Adımlar:

```bash
# Projeyi Xcode'da aç
npx cap open ios
```

Xcode'da:
1. **Signing & Capabilities** sekmesine gidin
2. Team'inizi seçin (Apple Developer hesabınız)
3. Bundle Identifier'ı değiştirin (benzersiz olmalı)
4. Bir simulator veya gerçek cihaz seçin
5. ▶️ Play butonuna basın

### App Store'a Yüklemek İçin:

1. Xcode'da **Product > Archive**
2. Organizer'da **Distribute App**
3. App Store Connect'e yükleyin
4. App Store Connect'te uygulamanızı yapılandırın
5. Review için gönderin

## Android Build

### Gereksinimler:
- Android Studio
- Java JDK 11+
- Android SDK

### Adımlar:

```bash
# Projeyi Android Studio'da aç
npx cap open android
```

Android Studio'da:
1. **Build > Build Bundle(s) / APK(s) > Build APK(s)**
2. APK dosyasını bulun ve test edin

### Google Play'e Yüklemek İçin:

```bash
# Release build oluştur
cd android
./gradlew assembleRelease

# AAB (App Bundle) oluştur (önerilen)
./gradlew bundleRelease
```

Dosyalar şurada olacak:
- APK: `android/app/build/outputs/apk/release/`
- AAB: `android/app/build/outputs/bundle/release/`

#### Signing Yapılandırması:

1. Keystore oluşturun:

```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. `android/app/build.gradle` dosyasını güncelleyin:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('my-release-key.keystore')
            storePassword 'your-password'
            keyAlias 'my-key-alias'
            keyPassword 'your-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

## Backend Düzenlemeleri

Backend'iniz zaten FastAPI kullanıyor. Mobil uygulama için CORS ayarlarını kontrol edin:

**backend/server.py**:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Production'da spesifik domainlere kısıtlayın
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### HTTPS Zorunluluğu:

Mobil uygulamalar HTTPS gerektirir. Backend'inizi HTTPS ile sunmalısınız:

1. **Nginx** kullanarak SSL sertifikası (Let's Encrypt ile ücretsiz)
2. **Cloudflare** reverse proxy
3. Backend'i bir cloud serviste host edin (AWS, Google Cloud, Azure)

## Test Etme

### Emulator/Simulator'da Test:

```bash
# iOS Simulator
npx cap run ios

# Android Emulator
npx cap run android
```

### Gerçek Cihazda Test:

**iOS**:
1. iPhone'u Mac'e bağlayın
2. Xcode'da cihazı seçin
3. Run yapın

**Android**:
1. Android cihazda USB debugging'i açın
2. Cihazı bilgisayara bağlayın
3. Android Studio'da cihazı seçin
4. Run yapın

## Performans Optimizasyonları

### 1. Code Splitting:

React lazy loading kullanın:

```javascript
import { lazy, Suspense } from 'react';

const ProductsPage = lazy(() => import('./pages/ProductsPage'));

function App() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <ProductsPage />
    </Suspense>
  );
}
```

### 2. Image Optimization:

```javascript
// Resimleri optimize edin
// WebP formatı kullanın
// Lazy loading uygulayın
<img loading="lazy" src="..." alt="..." />
```

### 3. Bundle Size:

```bash
# Bundle boyutunu analiz edin
npm run build:analyze

# Gereksiz bağımlılıkları kaldırın
npm uninstall unused-package
```

### 4. Offline Support (PWA):

```bash
npm install @capacitor/app @capacitor/storage

# Service Worker ekleyin
# Cache stratejileri uygulayın
```

## Sorun Giderme

### CORS Hataları:

- Backend CORS ayarlarını kontrol edin
- Mobilde `http://localhost` yerine gerçek IP kullanın

### Build Hataları:

```bash
# Cache'i temizle
rm -rf node_modules package-lock.json
npm install

# Capacitor'ı yeniden sync et
npx cap sync
```

### iOS Hataları:

```bash
# Pods'u temizle ve yeniden yükle
cd ios/App
pod deintegrate
pod install
```

### Android Hataları:

```bash
# Gradle cache'i temizle
cd android
./gradlew clean
./gradlew build
```

## Checklist

- [ ] Capacitor kuruldu
- [ ] iOS ve/veya Android platformları eklendi
- [ ] API URL yapılandırması yapıldı
- [ ] Mobil UI optimizasyonları yapıldı
- [ ] Icon ve splash screen eklendi
- [ ] Status bar yapılandırıldı
- [ ] Keyboard handling eklendi
- [ ] Safe area insets uygulandı
- [ ] Backend HTTPS ile çalışıyor
- [ ] CORS düzgün yapılandırıldı
- [ ] Emulator'da test edildi
- [ ] Gerçek cihazda test edildi
- [ ] Performance optimizasyonları yapıldı
- [ ] Signing yapılandırması tamamlandı

## Yararlı Komutlar

```bash
# Build ve sync (her değişiklikten sonra)
npm run build && npx cap sync

# iOS'u aç
npx cap open ios

# Android'i aç
npx cap open android

# Canlı reload (geliştirme)
npm start
# Başka bir terminalde:
npx cap run android --livereload --external
npx cap run ios --livereload --external

# Capacitor versiyon kontrolü
npx cap doctor

# Plugin listesi
npx cap ls

# Tüm platformları güncelle
npx cap sync

# Sadece iOS güncelle
npx cap sync ios

# Sadece Android güncelle
npx cap sync android
```

## Ek Kaynaklar

- [Capacitor Dokümantasyonu](https://capacitorjs.com/docs)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)
- [iOS Deployment](https://developer.apple.com/documentation/)
- [Android Deployment](https://developer.android.com/studio/publish)
- [Capacitor Community Plugins](https://github.com/capacitor-community)

## Sonraki Adımlar

1. **Bu rehberi takip ederek Capacitor'ı kurun**
2. **Önce emulator'da test edin**
3. **Gerçek cihazda test edin**
4. **Performance optimizasyonları yapın**
5. **App Store / Google Play'e yayınlayın**

Başarılar! 🚀
