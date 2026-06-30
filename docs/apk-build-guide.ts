/**
 * Capacitor APK 构建指南
 *
 *  模式：URL 指向（APK 壳子访问局域网/线上 dev 服务器）
 *
 *  ============================================
 *  阶段 1：本地准备（首次）
 *  ============================================
 *  1. 找到你的电脑局域网 IP（Windows: ipconfig 看 IPv4）
 *  2. 修改 capacitor.config.ts 里的 server.url 为 http://你的IP:3200
 *  3. 启动开发服务器（让手机可访问）：
 *     npm run dev:host
 *  4. 添加 Android 平台（首次会下载 Android SDK 依赖）：
 *     npx cap add android
 *  5. 同步配置到原生工程：
 *     npx cap sync android
 *  6. 打开 Android Studio：
 *     npx cap open android
 *     → Build → Build Bundle(s)/APK(s) → Build APK(s)
 *     → 在 android/app/build/outputs/apk/debug/app-debug.apk 拿到 APK
 *
 *  ============================================
 *  真机测试
 *  ============================================
 *  1. 手机打开 USB 调试，连接电脑
 *  2. 安装 APK：adb install android/app/build/outputs/apk/debug/app-debug.apk
 *  3. 手机和电脑同一 WiFi
 *  4. 打开 APP → 自动加载 http://你的IP:3200/h5
 *
 *  ============================================
 *  阶段 2：iOS（需要 Mac）
 *  ============================================
 *  1. 在 Mac 上 clone 项目
 *  2. npm install
 *  3. 改 capacitor.config.ts server.url 为 Mac 局域网 IP
 *  4. npx cap add ios
 *  5. npx cap sync ios
 *  6. cd ios/App && pod install
 *  7. npx cap open ios  （打开 Xcode）
 *  8. Xcode → Product → Archive → Distribute App → Ad Hoc
 *
 *  ============================================
 *  阶段 3：发布版本
 *  ============================================
 *  1. 把 Next.js 部署到 Vercel/自建服务器
 *  2. capacitor.config.ts 里 server.url 改为 https://你的域名
 *  3. Android：生成 keystore → Build → Generate Signed Bundle
 *  4. iOS：注册苹果开发者账号（$99/年）→ Archive → App Store
 */
export {};
