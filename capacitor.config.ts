import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.useadhera.app',
  appName: 'Adhera',
  webDir: 'out',
  server: {
    url: process.env.CAPACITOR_SERVER_URL || 'https://www.useadhera.com',
    cleartext: true,
    allowNavigation: [
      'useadhera.com',
      'www.useadhera.com',
      '*.supabase.co',
      '*.google.com',
      '*.googleusercontent.com',
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#F2F2F7",
      androidSplashResourceName: "splash",
      androidScaleType: "FIT_CENTER",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
