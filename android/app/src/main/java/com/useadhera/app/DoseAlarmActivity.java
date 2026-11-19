package com.useadhera.app;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

import org.json.JSONObject;

/**
 * Lock-screen takeover for a due dose. Mirrors the in-app alarm screen:
 * shows the medication, and lets the user log the dose, snooze or dismiss.
 */
public class DoseAlarmActivity extends Activity {

    private static final long SNOOZE_MS = 5 * 60 * 1000L;

    private String payloadJson = null;
    private JSONObject payload = null;

    private Vibrator vibrator = null;
    private MediaPlayer player = null;
    private final Handler handler = new Handler(Looper.getMainLooper());

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            );
        }

        setContentView(R.layout.activity_dose_alarm);

        payloadJson = getIntent() != null ? getIntent().getStringExtra(DoseAlarmReceiver.EXTRA_PAYLOAD) : null;
        if (payloadJson == null) {
            finish();
            return;
        }
        try {
            payload = new JSONObject(payloadJson);
        } catch (Exception e) {
            finish();
            return;
        }

        bind();
        startFeedback();
    }

    private void bind() {
        String name = payload.optString("title", "Dose due");
        String amount = payload.optString("dosageAmount", "");
        String unit = payload.optString("dosageUnit", "");
        String notes = payload.optString("notes", "");
        String day = payload.optString("day", "");
        int streak = payload.optInt("streak", 0);

        TextView nameView = findViewById(R.id.alarm_name);
        TextView dosageView = findViewById(R.id.alarm_dosage);
        TextView notesView = findViewById(R.id.alarm_notes);
        TextView metaView = findViewById(R.id.alarm_meta);

        nameView.setText(name);
        if (!amount.isEmpty()) {
            dosageView.setText(amount + (unit.isEmpty() ? "" : " " + unit));
            dosageView.setVisibility(View.VISIBLE);
        } else {
            dosageView.setVisibility(View.GONE);
        }
        if (!notes.isEmpty()) {
            notesView.setText(notes);
            notesView.setVisibility(View.VISIBLE);
        } else {
            notesView.setVisibility(View.GONE);
        }
        StringBuilder meta = new StringBuilder();
        if (!day.isEmpty()) meta.append(day);
        if (streak > 0) {
            if (meta.length() > 0) meta.append("  ·  ");
            meta.append(streak).append(streak == 1 ? " day streak" : " day streak");
        }
        metaView.setText(meta.toString());
        metaView.setVisibility(meta.length() > 0 ? View.VISIBLE : View.GONE);

        Button logButton = findViewById(R.id.alarm_log);
        Button snoozeButton = findViewById(R.id.alarm_snooze);
        Button dismissButton = findViewById(R.id.alarm_dismiss);

        logButton.setOnClickListener(v -> onLogDose());
        snoozeButton.setOnClickListener(v -> onSnooze());
        dismissButton.setOnClickListener(v -> onDismiss());
    }

    private void onLogDose() {
        try {
            JSONObject entry = new JSONObject();
            entry.put("id", payload.optString("id", "dose") + ":" + System.currentTimeMillis());
            entry.put("medId", payload.optString("medId", ""));
            entry.put("doseTimeMs", payload.optLong("doseTimeMs", 0L));
            entry.put("takenAt", System.currentTimeMillis());
            DoseAlarmPlugin.enqueuePendingDoseLog(this, entry);
        } catch (Exception e) {
            // continue - the app will still be opened
        }
        dismissNotification();
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.putExtra("doseAlarmAction", "log");
        startActivity(intent);
        finish();
    }

    private void onSnooze() {
        long at = System.currentTimeMillis() + SNOOZE_MS;
        try {
            JSONObject snoozed = new JSONObject(payloadJson);
            snoozed.put("id", payload.optString("id", "dose") + ":snooze:" + at);
            DoseAlarmPlugin.scheduleAlarm(this, snoozed, at);
        } catch (Exception e) {
            // nothing to snooze
        }
        dismissNotification();
        finish();
    }

    private void onDismiss() {
        dismissNotification();
        finish();
    }

    private void dismissNotification() {
        String id = payload != null ? payload.optString("id", "dose") : "dose";
        DoseAlarmReceiver.cancelNotification(this, id);
    }

    private void startFeedback() {
        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator != null && vibrator.hasVibrator()) {
            long[] pattern = new long[] { 0, 800, 500, 800, 500, 800 };
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
                } else {
                    vibrator.vibrate(pattern, 0);
                }
            } catch (Exception e) {
                // vibration is best effort
            }
        }
        try {
            player = new MediaPlayer();
            player.setAudioAttributes(
                new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
            );
            player.setDataSource(this, android.net.Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.beep));
            player.setLooping(true);
            player.prepare();
            player.start();
        } catch (Exception e) {
            player = null;
        }
    }

    private void stopFeedback() {
        if (vibrator != null) {
            try { vibrator.cancel(); } catch (Exception e) {}
            vibrator = null;
        }
        if (player != null) {
            try { if (player.isPlaying()) player.stop(); } catch (Exception e) {}
            try { player.release(); } catch (Exception e) {}
            player = null;
        }
        handler.removeCallbacksAndMessages(null);
    }

    @Override
    protected void onDestroy() {
        stopFeedback();
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        onDismiss();
    }
}
