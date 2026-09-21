import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'kz.zhanfinance.app',
  appName: 'ZHAN FINANCE',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1500,
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#0a0a0c',
    },
  },
};

export default config;
