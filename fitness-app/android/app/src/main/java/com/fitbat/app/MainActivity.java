package com.fitbat.app;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class MainActivity extends BridgeActivity implements SensorEventListener {
    private SensorManager sensorManager;
    private Sensor stepCounterSensor;
    private boolean hasStepSensor = false;
    private int currentTodaySteps = 0;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACTIVITY_RECOGNITION)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                        this,
                        new String[]{Manifest.permission.ACTIVITY_RECOGNITION},
                        1001
                );
            }
        }

        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager != null) {
            stepCounterSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
            if (stepCounterSensor != null) {
                hasStepSensor = true;
                sensorManager.registerListener(this, stepCounterSensor, SensorManager.SENSOR_DELAY_UI);
            }
        }

        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().addJavascriptInterface(new StepBridge(), "FitbatStepSensor");
        }
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_STEP_COUNTER) {
            int totalSinceReboot = (int) event.values[0];
            SharedPreferences prefs = getSharedPreferences("fitbat_hardware_steps", Context.MODE_PRIVATE);
            String todayKey = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
            String savedDate = prefs.getString("step_date", "");
            int baseline = prefs.getInt("step_baseline", -1);

            if (!todayKey.equals(savedDate) || baseline < 0 || totalSinceReboot < baseline) {
                baseline = totalSinceReboot;
                prefs.edit()
                        .putString("step_date", todayKey)
                        .putInt("step_baseline", baseline)
                        .apply();
            }
            currentTodaySteps = Math.max(0, totalSinceReboot - baseline);
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}

    public class StepBridge {
        @JavascriptInterface
        public boolean isHardwareSensorAvailable() {
            return hasStepSensor;
        }

        @JavascriptInterface
        public int getTodayHardwareSteps() {
            return currentTodaySteps;
        }
    }
}
