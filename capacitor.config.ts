import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.useadhera.app',
  appName: 'Adhera',
  webDir: 'out',
  server: {
    url: process.env.CAPACITOR_SERVER_URL || 'https://useadhera.com',
    cleartext: true,
  },
};

export default config;
