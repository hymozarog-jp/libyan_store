import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.libyanstore.app',
  appName: 'Libyan Store',
  webDir: '.',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  }
};

export default config;
