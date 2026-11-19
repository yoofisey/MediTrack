package com.useadhera.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ExactAlarmPlugin.class);
        registerPlugin(DoseAlarmPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
