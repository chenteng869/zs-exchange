# 📱 ZS Exchange APK 打包完整指南

> **生成时间**: 2026-06-12  
> **目标**: 将 ZS Exchange (Next.js) 打包为 Android APK  
> **预计时间**: 30-60 分钟

---

## 📋 方案选择

| 方案 | 难度 | 体积 | 性能 | 推荐度 |
|------|------|------|------|--------|
| **方案 A: WebView APK** | ⭐ 简单 | 5-10 MB | ⭐⭐ 中等 | ⭐⭐⭐ 快速 |
| **方案 B: PWA 转 APK** | ⭐⭐ 中等 | 3-5 MB | ⭐⭐⭐ 良好 | ⭐⭐⭐ 体验好 |
| **方案 C: Capacitor 打包** | ⭐⭐⭐ 较难 | 15-30 MB | ⭐⭐⭐⭐ 优秀 | ⭐⭐⭐⭐⭐ 推荐 |
| **方案 D: HBuilder 云打包** | ⭐ 简单 | 8-15 MB | ⭐⭐⭐ 良好 | ⭐⭐⭐ 零配置 |

---

## 🚀 方案 A: WebView APK（最快，5 分钟）

### 原理
用 Android Studio 创建一个简单的 WebView App，加载你的 Next.js 网站。

### 步骤 1: 安装 Android Studio

下载地址: https://developer.android.com/studio

```
安装包含：
- Android SDK
- Android Build Tools
- Android Emulator
- JDK 17
```

### 步骤 2: 创建项目

1. 打开 Android Studio
2. **File → New → New Project**
3. 选择 **Empty Activity**
4. 填写:
   - Name: `ZS Exchange`
   - Package: `com.zs.exchange`
   - Language: **Kotlin**
   - Min SDK: **24** (Android 7.0)
5. 点击 **Finish**

### 步骤 3: 配置 AndroidManifest.xml

`app/src/main/AndroidManifest.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="ZS Exchange"
        android:theme="@style/Theme.ZSExchange"
        android:usesCleartextTraffic="true">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### 步骤 4: 修改 MainActivity.kt

`app/src/main/java/com/zs/exchange/MainActivity.kt`:
```kotlin
package com.zs.exchange

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.KeyEvent
import android.view.WindowManager
import android.webkit.*
import androidx.appcompat.app.AppCompatActivity
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private val APP_URL = "https://yourdomain.com"  // 👈 替换为你的实际域名

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // 保持屏幕常亮
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        webView = findViewById(R.id.webView)
        
        WebView.setWebContentsDebuggingEnabled(true)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            useWideViewPort = true
            loadWithOverviewMode = true
            setSupportZoom(true)
            builtInZoomControls = false
            displayZoomControls = false
            allowFileAccess = true
            allowContentAccess = true
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            
            // 允许更多权限
            allowFileAccessFromFileURLs = true
            allowUniversalAccessFromFileURLs = true
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onJsAlert(view: WebView?, url: String?, message: String?, result: JsResult?): Boolean {
                return super.onJsAlert(view, url, message, result)
            }
            
            override fun onPermissionRequest(request: PermissionRequest) {
                runOnUiThread {
                    request.grant(request.resources)
                }
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                view?.loadUrl(request?.url.toString())
                return true
            }
            
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
            }
        }

        webView.loadUrl(APP_URL)
        
        // Cookie 同步
        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)
    }

    // 处理返回键
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }
}
```

### 步骤 5: 布局文件

`app/src/main/res/layout/activity_main.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout 
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</androidx.constraintlayout.widget.ConstraintLayout>
```

### 步骤 6: 构建 APK

```
Build → Build Bundle(s) / APK(s) → Build APK(s)
```

APK 位置:
```
app/build/outputs/apk/debug/app-debug.apk
```

### 步骤 7: 真机测试

```bash
# 连接 Android 手机（开启 USB 调试）
adb install app/build/outputs/apk/debug/app-debug.apk

# 或直接拖到手机上安装
```

---

## 🎯 方案 C: Capacitor 打包（推荐）

### 原理
Capacitor 是 Ionic 团队出品的现代混合应用框架，可将任意 Web 项目包装成原生 App。

### 步骤 1: 安装 Capacitor

```bash
# 在项目根目录
cd "d:\3、系统项目开发\trae_projects\Stock Exchange dapp20260608-01"

# 安装 Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# 初始化
npx cap init "ZS Exchange" "com.zs.exchange" --web-dir out
```

### 步骤 2: 配置 next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',           // 静态导出
  images: { unoptimized: true }, // 图片不优化
  trailingSlash: true,
  
  // 移除构建时尝试启动服务的代码
  experimental: {
    appDir: true,
  },
  
  // 禁用 swcMinify（如果遇到问题）
  // swcMinify: false,
};

module.exports = nextConfig;
```

### 步骤 3: 构建静态文件

```bash
# 清理旧文件
Remove-Item -Recurse -Force out -ErrorAction SilentlyContinue

# 构建静态站点
npx next build
```

### 步骤 4: 添加 Android 平台

```bash
# 添加 Android 平台
npx cap add android

# 同步文件到 Android 项目
npx cap sync android
```

### 步骤 5: 在 Android Studio 中打开

```bash
# 打开 Android Studio
npx cap open android
```

### 步骤 6: 修改 Capacitor 配置

`capacitor.config.ts`:
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zs.exchange',
  appName: 'ZS Exchange',
  webDir: 'out',
  
  server: {
    // 生产环境
    url: 'https://yourdomain.com',
    cleartext: true,
  },
  
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    
    backgroundColor: '#0A0E1A',
  },
  
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0A0E1A',
      androidSplashResourceName: 'splash',
    },
  },
};

export default config;
```

### 步骤 7: 构建 Release APK

```bash
# 在 Android Studio 中
# Build → Generate Signed Bundle / APK
# 选择 APK → Next
# 创建新的 keystore（首次）
# 选择 release → Finish
```

### 步骤 8: 创建 Keystore

```bash
# 在项目根目录
keytool -genkey -v -keystore zs-exchange.keystore -alias zs-exchange -keyalg RSA -keysize 2048 -validity 36500

# 备份此 keystore 到安全位置！丢失后无法更新已发布的 App
```

### 步骤 9: 优化 APK 体积

```gradle
// android/app/build.gradle
android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 步骤 10: 完整发布

```bash
# 优化 APK
npx cap sync android
cd android
./gradlew assembleRelease

# 输出位置
android/app/build/outputs/apk/release/app-release.apk
```

---

## 🌐 方案 D: HBuilder 云打包（零配置）

### 适用场景
不写原生代码，HBuilder 一键云端打包。

### 步骤 1: 创建 HBuilder 项目

```
1. 打开 HBuilder X
2. 文件 → 新建 → 项目 → 5+App（空模板）
3. 项目名: ZS_Exchange
4. 项目位置: 自定义
```

### 步骤 2: 复制 dist 文件

将 `next build` 后的 `out/` 目录内容复制到 HBuilder 项目根目录。

### 步骤 3: 修改 manifest.json

```json
{
    "id": "com.zs.exchange",
    "name": "ZS Exchange",
    "version": {
        "name": "1.0.0",
        "code": "100"
    },
    "description": "中萨数字科技交易所",
    "icons": {
        "72": "images/icon.png",
        "144": "images/icon.png"
    },
    "launch_path": "index.html",
    "developer": {
        "name": "SinoSamoa",
        "email": "dev@zs.exchange"
    }
}
```

### 步骤 4: 配置 manifest.json (App)

```json
{
    "id": "com.zs.exchange",
    "name": "ZS Exchange",
    "app-plus": {
        "distribute": {
            "google": {
                "minSdkVersion": 24,
                "targetSdkVersion": 33,
                "abiFilters": ["armeabi-v7a", "arm64-v8a"]
            },
            "ios": {
                "dSYMs": false
            }
        }
    }
}
```

### 步骤 5: 云打包

```
1. 菜单 → 发行 → 原生 App-云打包
2. 选择 Android
3. 选择 Android 证书（使用自有证书或公共测试证书）
4. 选择打包类型: apk
5. 提交打包
6. 等待 5-15 分钟
7. 下载 APK
```

---

## 📦 完整自动化脚本

我为你写一个全自动化 APK 打包脚本：

```bash
# build-apk.sh / build-apk.bat
```

```bash
#!/bin/bash
# build-apk.sh - Linux/macOS
set -e

echo "===== 1. 清理 ====="
rm -rf out/ android/

echo "===== 2. 构建静态站点 ====="
npx next build

echo "===== 3. 添加 Android 平台 ====="
npx cap add android || true
npx cap sync android

echo "===== 4. 构建 APK ====="
cd android
./gradlew assembleDebug

echo "===== 5. 复制 APK ====="
mkdir -p ../dist
cp app/build/outputs/apk/debug/app-debug.apk ../dist/zs-exchange-debug.apk

echo "✅ APK 已生成: dist/zs-exchange-debug.apk"
```

```powershell
# build-apk.ps1 - Windows
Write-Host "===== 1. 清理 =====" -ForegroundColor Cyan
Remove-Item -Recurse -Force out -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force android -ErrorAction SilentlyContinue

Write-Host "===== 2. 构建静态站点 =====" -ForegroundColor Cyan
npx next build
if ($LASTEXITCODE -ne 0) { Write-Host "❌ 构建失败" -ForegroundColor Red; exit 1 }

Write-Host "===== 3. 添加 Android 平台 =====" -ForegroundColor Cyan
npx cap add android
npx cap sync android

Write-Host "===== 4. 构建 APK =====" -ForegroundColor Cyan
Set-Location android
.\gradlew assembleDebug
Set-Location ..

Write-Host "===== 5. 复制 APK =====" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path dist | Out-Null
Copy-Item android\app\build\outputs\apk\debug\app-debug.apk dist/zs-exchange-debug.apk -Force

Write-Host "✅ APK 已生成: dist/zs-exchange-debug.apk" -ForegroundColor Green
Write-Host "📱 大小: $((Get-Item dist/zs-exchange-debug.apk).Length / 1MB) MB" -ForegroundColor Green
```

---

## 🚀 应用商店发布

### Google Play Store

```
1. 注册 Google Play Console（$25 一次性）
2. 准备发布材料（截图/描述/图标）
3. 上传 AAB（推荐）或 APK
4. 填写内容分级
5. 提交审核
```

### 国内应用商店

| 商店 | 链接 | 备注 |
|------|------|------|
| 华为应用市场 | https://developer.huawei.com | 国内主流 |
| 小米应用商店 | https://dev.mi.com | 国内主流 |
| OPPO 软件商店 | https://open.oppomobile.com | - |
| vivo 应用商店 | https://dev.vivo.com.cn | - |
| 应用宝 | https://open.qq.com | 腾讯 |
| 360 手机助手 | https://dev.360.cn | - |

国内发布需：
- 营业执照
- 软件著作权登记证书
- ICP 备案
- 安全评估报告

---

## 🔍 常见问题

### Q1: APK 安装失败？
```
A: 
1. 设置 → 安全 → 允许安装未知来源
2. 检查 minSdkVersion 是否兼容
3. 重新签名 APK
```

### Q2: WebView 加载缓慢？
```
A: 
1. 启用本地缓存（Capacitor 默认开启）
2. 压缩静态资源
3. CDN 加速
```

### Q3: HBuilder 云打包失败？
```
A:
1. 提交应用商店需要实名认证
2. 使用公共测试证书（仅测试用）
3. 检查项目 manifest.json 配置
```

### Q4: 如何减小 APK 体积？
```
A:
1. 删除 x86 模拟器 ABI（保留 arm64-v8a）
2. 启用 ProGuard 代码混淆
3. 使用 WebP 替代 PNG
4. 字体子集化
```

### Q5: iOS 版本如何打包？
```
A: 必需 Mac + Xcode + 苹果开发者账号（$99/年）
   不推荐在没有 Mac 的情况下做 iOS 打包
```

---

## 📋 发布前检查清单

- [ ] APK 安装到真机测试通过
- [ ] 所有 API 接口都能调用（域名/HTTPS）
- [ ] WebView 与原生功能集成正常
- [ ] 启动屏/图标/名称正确
- [ ] 用户登录/支付功能测试
- [ ] 多分辨率适配
- [ ] 离线模式测试
- [ ] 网络异常处理

---

## 🎯 推荐方案

| 你的情况 | 推荐方案 |
|----------|----------|
| **快速测试** | 方案 A: WebView APK（5 分钟） |
| **正式发布** | 方案 C: Capacitor（推荐） |
| **完全零配置** | 方案 D: HBuilder 云打包 |
| **iOS + Android** | 方案 C: Capacitor（最完整） |

---

## 🎉 总结

**最小成本快速出 APK**：
1. Capacitor 装一下 → 5 分钟
2. `npx cap add android` → 1 分钟
3. Android Studio 点 Build → 10 分钟
4. 拿到 APK 测试 → 5 分钟

**总耗时 30 分钟即可拿到第一个可用的 Android APK**！

需要我进一步帮你做：
- 🍎 **iOS 打包方案**（需 Mac）
- 🔄 **CI/CD 自动化打包**（GitHub Actions）
- 📊 **性能优化**（启动速度、体积）
- 🚀 **应用商店上架**（上架资料准备）
