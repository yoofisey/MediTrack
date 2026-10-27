package com.useadhera.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;

import org.json.JSONObject;

/**
 * Fires a dose alarm. When Adherly is in the foreground the alarm is handed to
 * the web layer (full-screen in-app alarm); otherwise a high-importance
 * notification with a full-screen intent takes over the lock screen.
 */
public class DoseAlarmReceiver extends BroadcastReceiver {

    public static final String ACTION_ALARM = "com.useadhera.app.DOSE_ALARM";
    public static final String EXTRA_PAYLOAD = "payload";
    public static final String CHANNEL_ID = "adhera-dose-alarms";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String json = intent.getStringExtra(EXTRA_PAYLOAD);
        if (json == null) return;

        JSONObject payload;
        try {
            payload = new JSONObject(json);
        } catch (Exception e) {
            return;
        }

        if (DoseAlarmPlugin.inForeground) {
            DoseAlarmPlugin.notifyAlarmFired(payload);
            return;
        }

        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        ensureChannel(context, manager);

        String title = payload.optString("title", "Dose due");
        String body = payload.optString("body", "");
        String id = payload.optString("id", String.valueOf(payload.optLong("doseTimeMs", 0L)));

        Intent fullScreen = new Intent(context, DoseAlarmActivity.class);
        fullScreen.putExtra(EXTRA_PAYLOAD, json);
        fullScreen.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent contentIntent = PendingIntent.getActivity(
            context,
            DoseAlarmPlugin.requestCode(id),
            fullScreen,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Notification notification;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            notification = new Notification.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_adhera)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new Notification.BigTextStyle().bigText(body))
                .setColor(0xFFFF3B30)
                .setCategory(Notification.CATEGORY_ALARM)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .setOngoing(true)
                .setAutoCancel(false)
                .setContentIntent(contentIntent)
                .setFullScreenIntent(contentIntent, true)
                .setVibrate(new long[] { 0, 700, 400, 700 })
                .build();
        } else {
            notification = new Notification.Builder(context)
                .setSmallIcon(R.drawable.ic_stat_adhera)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new Notification.BigTextStyle().bigText(body))
                .setColor(0xFFFF3B30)
                .setCategory(Notification.CATEGORY_ALARM)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .setOngoing(true)
                .setAutoCancel(false)
                .setPriority(Notification.PRIORITY_MAX)
                .setContentIntent(contentIntent)
                .setFullScreenIntent(contentIntent, true)
                .setVibrate(new long[] { 0, 700, 400, 700 })
                .build();
        }

        try {
            manager.notify(DoseAlarmPlugin.requestCode(id), notification);
        } catch (Exception e) {
            // notification permission may be missing - nothing else to do
        }
    }

    static void ensureChannel(Context context, NotificationManager manager) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationChannel channel = manager.getNotificationChannel(CHANNEL_ID);
        if (channel != null) return;
        channel = new NotificationChannel(CHANNEL_ID, "Dose alarms", NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("Full screen alarms when a medication dose is due");
        channel.enableVibration(true);
        channel.setVibrationPattern(new long[] { 0, 700, 400, 700 });
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        channel.setBypassDnd(false);
        try {
            channel.setSound(Uri.parse("android.resource://" + context.getPackageName() + "/" + R.raw.beep), null);
        } catch (Exception e) {
            // keep the default channel sound
        }
        manager.createNotificationChannel(channel);
    }

    /** Removes the posted alarm notification (used when the alarm is handled). */
    static void cancelNotification(Context context, String id) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;
        manager.cancel(DoseAlarmPlugin.requestCode(id));
    }
}
