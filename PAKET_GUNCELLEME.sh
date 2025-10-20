#!/bin/bash

# Mobil Uygulama Paketlerini Yükleme Script'i
# Bu script gerekli tüm Capacitor paketlerini yükler

echo "🚀 Mobil Uygulama Paketleri Yükleniyor..."
echo ""

# Frontend dizinine git
cd frontend

echo "📦 Capacitor Core ve CLI yükleniyor..."
npm install @capacitor/core@latest @capacitor/cli@latest

echo "📱 Platform paketleri yükleniyor..."
npm install @capacitor/ios@latest @capacitor/android@latest

echo "🔌 Capacitor pluginleri yükleniyor..."
npm install \
  @capacitor/app@latest \
  @capacitor/camera@latest \
  @capacitor/filesystem@latest \
  @capacitor/haptics@latest \
  @capacitor/keyboard@latest \
  @capacitor/network@latest \
  @capacitor/splash-screen@latest \
  @capacitor/status-bar@latest

echo "🎨 Capacitor Assets (icon ve splash oluşturucu) yükleniyor..."
npm install -D @capacitor/assets@latest

echo ""
echo "✅ Tüm paketler başarıyla yüklendi!"
echo ""
echo "📋 Sonraki adımlar:"
echo "1. npx cap init (Capacitor'ı başlat)"
echo "2. npx cap add android (Android platformu ekle)"
echo "3. npx cap add ios (iOS platformu ekle - sadece Mac'te)"
echo "4. npm run build (Web build oluştur)"
echo "5. npx cap sync (Native projeleri senkronize et)"
echo ""
echo "Detaylı talimatlar için: KURULUM_ADIMLARI.md"
