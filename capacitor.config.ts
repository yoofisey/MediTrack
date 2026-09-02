import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.useadhera.app',
  appName: 'Adhera',
  webDir: 'out',
  server: {
    url: process.env.CAPACITOR_SERVER_URL || 'https://www.useadhera.com',
    allowNavigation: [
      'useadhera.com',
      'www.useadhera.com',
      'luxtopkzdyflbejwgniq.supabase.co',
      'accounts.google.com',
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
    LocalNotifications: {
      smallIcon: "ic_stat_adhera",
      iconColor: "#0E9F6E",
      presentationOptions: ["badge", "sound", "banner", "list"],
    },
  },
};

export default config;
