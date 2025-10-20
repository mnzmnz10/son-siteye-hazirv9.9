# Mobil Uygulama Kurulum Adımları

Bu dosya, projenizi mobil uygulamaya dönüştürmek için gerekli adımları sırayla içerir.

## 🚀 Hızlı Başlangıç

### Adım 1: Gerekli Paketleri Yükleyin

```bash
cd frontend

# Capacitor Core ve CLI
npm install @capacitor/core @capacitor/cli

# Platform paketleri
npm install @capacitor/ios @capacitor/android

# Capacitor pluginleri
npm install @capacitor/app @capacitor/haptics @capacitor/keyboard @capacitor/status-bar @capacitor/splash-screen @capacitor/network @capacitor/filesystem @capacitor/camera
```

### Adım 2: Capacitor'ı Başlatın

```bash
npx cap init
```

Sorulan sorulara cevaplar:
- **App name**: `Karavan Katalog` (veya istediğiniz isim)
- **App ID**: `com.corlukaravan.katalog` (tersine domain formatı, benzersiz olmalı)
- **Web asset directory**: `build`

### Adım 3: Platform Ekleyin

```bash
# Android ekle (herkeste çalışır)
npx cap add android

# iOS ekle (sadece Mac'te)
npx cap add ios
```

### Adım 4: Web Build Oluşturun

```bash
npm run build
```

### Adım 5: Native Projeleri Senkronize Edin

```bash
npx cap sync
```

## ✅ Kurulum Tamamlandı!

Artık mobil uygulamanız hazır. Şimdi test etme zamanı.

## 📱 Test Etme

### Emulator/Simulator'da Test

**Android:**
```bash
npx cap open android
```
Android Studio açılacak. Bir emulator seçin ve ▶️ Run butonuna basın.

**iOS (sadece Mac):**
```bash
npx cap open ios
```
Xcode açılacak. Bir simulator seçin ve ▶️ Run butonuna basın.

### Gerçek Cihazda Test

**Android:**
1. Telefonda USB debugging'i açın (Geliştirici Seçenekleri > USB Hata Ayıklama)
2. Telefonu bilgisayara bağlayın
3. Android Studio'da cihazı seçin
4. Run yapın

**iOS (sadece Mac):**
1. iPhone'u Mac'e bağlayın
2. Xcode'da cihazı seçin
3. Gerekirse Team ve Signing ayarları yapın
4. Run yapın

## 🔧 Her Değişiklikten Sonra

Kod değiştirdikten sonra:

```bash
# 1. Build
npm run build

# 2. Sync
npx cap sync

# 3. IDE'de test et (veya)
npx cap open android
npx cap open ios
```

## 🔄 Canlı Reload İle Geliştirme

Daha hızlı geliştirme için canlı reload kullanın:

### 1. IP Adresinizi Öğrenin

```bash
# Linux/Mac
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr IPv4
```

Örnek: `192.168.1.100`

### 2. Development Server'ı Başlatın

```bash
npm start
```

### 3. capacitor.config.ts Dosyasını Güncelleyin

```typescript
server: {
  url: 'http://192.168.1.100:3000',  // Kendi IP'nizi yazın
  cleartext: true
}
```

### 4. Sync ve Run

```bash
npx cap sync
npx cap run android
# veya
npx cap run ios
```

Artık kodda yaptığınız değişiklikler anında mobil cihazda görünecek! 🎉

## 🎨 Icon ve Splash Screen

### App Icon Oluşturma

1. 1024x1024 PNG formatında app icon oluşturun
2. https://www.appicon.co/ adresini kullanarak tüm boyutları oluşturun
3. İndirdiğiniz dosyaları ilgili klasörlere kopyalayın:
   - **iOS**: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
   - **Android**: `android/app/src/main/res/` (mipmap klasörleri)

### Splash Screen Oluşturma

1. 2732x2732 PNG formatında splash image oluşturun
2. Otomatik oluşturma için:

```bash
npm install -D @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor '#000000' --splashBackgroundColor '#000000'
```

## 🌐 Backend Yapılandırması

### API URL'ini Ayarlayın

**frontend/.env** dosyası oluşturun:

```bash
# Development (localhost)
REACT_APP_API_URL=http://localhost:8000/api

# Production (gerçek sunucu)
# REACT_APP_API_URL=https://your-domain.com/api
```

### Backend CORS Ayarları

Backend'inizde (`backend/server.py`) CORS ayarlarının mobil için uygun olduğundan emin olun:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Production'da spesifik originlere kısıtlayın
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### HTTPS Gereksinimi

⚠️ **ÖNEMLİ**: Mobil uygulamalar HTTPS gerektirir!

Backend'inizi HTTPS ile sunmalısınız. Seçenekler:

1. **Cloudflare Tunnel** (en kolay, ücretsiz)
   - Zaten `cloudflare-tunnel.yml` dosyanız var
   - Cloudflare dashboard'dan tunnel oluşturun
   - HTTPS URL'inizi alın

2. **Let's Encrypt + Nginx**
   - `nginx.conf` dosyanız var
   - Let's Encrypt ile SSL sertifikası alın

3. **Cloud Hosting**
   - AWS, Google Cloud, Azure, DigitalOcean vb.
   - Çoğu otomatik HTTPS sağlar

## 📦 Production Build

### Android APK/AAB Oluşturma

```bash
cd android

# APK (test için)
./gradlew assembleRelease

# AAB (Google Play için önerilen)
./gradlew bundleRelease
```

Dosyalar:
- APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

### iOS IPA Oluşturma (Mac'te)

1. Xcode'da projeyi açın: `npx cap open ios`
2. **Product > Archive**
3. **Organizer** açılacak
4. **Distribute App** > App Store Connect
5. Follow the wizard

## 🐛 Sorun Giderme

### Build Hatası

```bash
# Cache temizle
rm -rf node_modules package-lock.json
npm install
npx cap sync
```

### iOS Pod Hatası

```bash
cd ios/App
pod deintegrate
pod install
cd ../..
npx cap sync
```

### Android Gradle Hatası

```bash
cd android
./gradlew clean
cd ..
npx cap sync
```

### CORS Hatası

- Backend CORS ayarlarını kontrol edin
- Backend'in HTTPS ile erişilebilir olduğundan emin olun
- capacitor.config.ts'de server URL'inin doğru olduğunu kontrol edin

## 📚 Yararlı Komutlar

```bash
# Capacitor sağlık kontrolü
npx cap doctor

# Kurulu pluginleri listele
npx cap ls

# Capacitor güncelle
npm install @capacitor/core@latest @capacitor/cli@latest
npx cap sync

# Eski build'leri temizle
npm run build && npx cap sync

# Android log izle
npx cap run android -l

# iOS log izle
npx cap run ios -l
```

## ✨ Eklenen Dosyalar

Mobil uygulama için şu dosyalar eklendi:

1. **capacitor.config.ts** - Ana Capacitor yapılandırması
2. **frontend/src/config.js** - Platform ve API yapılandırması
3. **frontend/src/utils/api.js** - Mobil destekli API client
4. **frontend/src/hooks/useMobile.js** - Mobil özellikler için React hooks

## 🎯 Sonraki Adımlar

1. [ ] Mevcut API çağrılarını `src/utils/api.js` kullanacak şekilde güncelleyin
2. [ ] Mobil UI'ı test edin ve iyileştirme yapın
3. [ ] Icon ve splash screen ekleyin
4. [ ] Backend'i HTTPS ile erişilebilir hale getirin
5. [ ] Production API URL'ini ayarlayın
6. [ ] App Store / Google Play için metadata hazırlayın
7. [ ] Yayınlayın! 🚀

## 📖 Daha Fazla Bilgi

Detaylı rehber için: `MOBIL_UYGULAMA_REHBERI.md`

## 💬 Yardım

Sorun yaşarsanız:
1. `MOBIL_UYGULAMA_REHBERI.md` dosyasında "Sorun Giderme" bölümüne bakın
2. [Capacitor Dokümantasyonu](https://capacitorjs.com/docs)
3. [Capacitor Community Forums](https://forum.ionicframework.com/c/capacitor/)

Başarılar! 🎉
