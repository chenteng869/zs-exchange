package com.zhongsa.exchange;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 在 BridgeActivity 初始化前，通过 intent extra 调整启动 URL
        // Capacitor 6.x 已移除 getLaunchUrl() override，改为使用 serverPath 配置
        // 这里仅做基础初始化，URL 重定向由 assets/public/index.html 完成
        super.onCreate(savedInstanceState);
    }
}
