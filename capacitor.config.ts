import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.corlukaravan.katalog',
  appName: 'Karavan Katalog',
  webDir: 'frontend/build',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    cleartext: false,
    // Development için yorum satırını kaldırın ve IP adresinizi girin:
    // url: 'http://192.168.1.XXX:3000',
    // cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: true,
      spinnerColor: '#ffffff',
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'large',
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000'
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    }
  }
};

export default config;
