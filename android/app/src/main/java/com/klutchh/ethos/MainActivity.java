package com.klutchh.ethos;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeHardwarePosePlugin.class);
        super.onCreate(savedInstanceState);
    }
}

