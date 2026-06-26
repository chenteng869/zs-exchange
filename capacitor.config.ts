/**
 * Capacitor 配置 — ZS Exchange
 *
 *  - 模式：内嵌 H5（APK 内含完整 next.js 静态产物，离线可用）
 *  - 调试：把 webDir 临时改回 'www'，并启用 server.url 指向 dev server
 *  - 生产：当前配置即可，无需 server.url
 *
 *  使用步骤（内嵌模式）：
 *    1. npm run build                  # 生成 out/ 静态产物
 *    2. npx cap sync android           # 把 out/ 复制到 android 工程
 *    3. cd android && gradlew assembleDebug
 *
 *  调试模式（URL 指向 dev server）切换：
 *    webDir: 'www',
 *    server: { url: 'http://192.168.8.3:3200' }
 */

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zhongsa.exchange',
  appName: 'ZS Exchange',
  // 内嵌 H5：next build 产物目录（100+ H5 页面 + _next 静态资源）
  webDir: 'out',
  // 内嵌模式不需要 server.url（APK 自带 H5 全部代码）
  android: {
    backgroundColor: '#0F1B3D',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#0F1B3D',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      launchAutoHide: true,
      backgroundColor: '#0F1B3D',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0F1B3D',
    },
  },
};

export default config;
