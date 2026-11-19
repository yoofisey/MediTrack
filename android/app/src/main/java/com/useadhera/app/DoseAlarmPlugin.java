package com.useadhera.app;

import android.app.AlarmManager;
import android.app.AppOpsManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Process;
import android.provider.Settings;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Iterator;

/**
 * Full-screen dose alarms.
 *
 * The stock local-notifications plugin cannot post a full-screen intent, so dose
 * alarms are scheduled here as exact alarms that fire a broadcast receiver. The
 * receiver shows a high-importance notification whose full-screen intent takes
 * over the lock screen with {@link DoseAlarmActivity}.
 *
 * Lead-time reminders keep using the stock plugin (ordinary push notifications).
 */
@CapacitorPlugin(name = "DoseAlarm")
public class DoseAlarmPlugin extends Plugin {

    public static final String PREFS = "adhera_dose_alarms";
    public static final String KEY_SCHEDULED = "scheduled";
    public static final String KEY_PENDING_LOGS = "pending_logs";
    public static final String EXTRA_PAYLOAD = "payload";

    /** AppOps operation behind the full screen intent permission (API 29+). */
    private static final String OPSTR_FULL_SCREEN_INTENT = "android:full_screen_intent";

    private static DoseAlarmPlugin instance = null;

    /** True while the app is in the foreground (alarm is handled in-app instead). */
    static volatile boolean inForeground = false;

    @Override
    public void load() {
        instance = this;
        inForeground = true;
    }

    @Override
    protected void handleOnResume() {
        inForeground = true;
        try {
            notifyListeners("doseLogsPending", new JSObject());
        } catch (Exception e) {
            // best effort
        }
    }

    @Override
    protected void handleOnPause() {
        inForeground = false;
    }

    // ---- scheduling ---------------------------------------------------------

    @PluginMethod
    public void schedule(PluginCall call) {
        String id = call.getString("id");
        long at = longValue(call, "doseTimeMs", 0L);
        if (id == null || id.isEmpty() || at <= 0) {
            call.reject("id and doseTimeMs are required");
            return;
        }
        try {
            JSONObject payload = new JSONObject();
            payload.put("id", id);
            payload.put("medId", call.getString("medId", ""));
            payload.put("doseTimeMs", at);
            payload.put("title", call.getString("title", "Dose due"));
            payload.put("body", call.getString("body", ""));
            payload.put("day", call.getString("day", ""));
            payload.put("streak", longValue(call, "streak", 0L));
            payload.put("dosageAmount", call.getString("dosageAmount", ""));
            payload.put("dosageUnit", call.getString("dosageUnit", ""));
            payload.put("notes", call.getString("notes", ""));
            scheduleAlarm(getContext(), payload, at);
            storeScheduled(getContext(), id, payload.toString());
            call.resolve();
        } catch (Exception e) {
            call.reject("Unable to schedule dose alarm", e);
        }
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        String id = call.getString("id");
        if (id == null || id.isEmpty()) {
            call.resolve();
            return;
        }
        cancelAlarm(getContext(), id);
        removeScheduled(getContext(), id);
        call.resolve();
    }

    @PluginMethod
    public void cancelAll(PluginCall call) {
        try {
            JSONObject scheduled = getScheduled(getContext());
            Iterator<String> keys = scheduled.keys();
            while (keys.hasNext()) {
                String id = keys.next();
                cancelAlarm(getContext(), id);
            }
            prefs(getContext()).edit().remove(KEY_SCHEDULED).apply();
        } catch (Exception e) {
            call.reject("Unable to cancel dose alarms", e);
            return;
        }
        call.resolve();
    }

    /**
     * Cancels the alarms of one medication that are due (or overdue) now.
     * Later doses of the same medication keep their alarm.
     */
    @PluginMethod
    public void cancelForMedication(PluginCall call) {
        String medId = call.getString("medId");
        if (medId == null || medId.isEmpty()) {
            call.resolve();
            return;
        }
        long limit = longValue(call, "doseTimeMs", 0L);
        if (limit <= 0) limit = System.currentTimeMillis();
        limit = limit + 60000L;
        try {
            JSONObject scheduled = getScheduled(getContext());
            java.util.List<String> stale = new java.util.ArrayList<>();
            Iterator<String> keys = scheduled.keys();
            while (keys.hasNext()) {
                String id = keys.next();
                try {
                    JSONObject payload = new JSONObject(scheduled.optString(id, "{}"));
                    if (!medId.equals(payload.optString("medId", ""))) continue;
                    long doseAt = payload.optLong("doseTimeMs", 0L);
                    if (doseAt > 0 && doseAt > limit) continue;
                    stale.add(id);
                } catch (Exception e) {
                    stale.add(id);
                }
            }
            for (String id : stale) {
                cancelAlarm(getContext(), id);
                removeScheduled(getContext(), id);
            }
        } catch (Exception e) {
            call.reject("Unable to cancel dose alarms", e);
            return;
        }
        call.resolve();
    }

    /**
     * Drops alarms that are no longer part of the current schedule. Snoozed
     * alarms keep the id of the dose they came from so they survive a reschedule.
     */
    @PluginMethod
    public void prune(PluginCall call) {
        try {
            JSArray keep = call.getArray("ids");
            JSONObject scheduled = getScheduled(getContext());
            java.util.List<String> stale = new java.util.ArrayList<>();
            Iterator<String> keys = scheduled.keys();
            while (keys.hasNext()) {
                String id = keys.next();
                String baseId = id;
                int idx = id.indexOf(":snooze:");
                if (idx > 0) baseId = id.substring(0, idx);
                boolean found = false;
                if (keep != null) {
                    for (int i = 0; i < keep.length(); i++) {
                        if (baseId.equals(keep.getString(i))) {
                            found = true;
                            break;
                        }
                    }
                }
                if (!found) stale.add(id);
            }
            for (String id : stale) {
                cancelAlarm(getContext(), id);
                removeScheduled(getContext(), id);
            }
        } catch (Exception e) {
            call.reject("Unable to prune dose alarms", e);
            return;
        }
        call.resolve();
    }

    // ---- permissions --------------------------------------------------------

    @PluginMethod
    public void canUseFullScreenIntent(PluginCall call) {
        JSObject ret = new JSObject();
        boolean can = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            int mode = AppOpsManager.MODE_DEFAULT;
            AppOpsManager ops = (AppOpsManager) getContext().getSystemService(Context.APP_OPS_SERVICE);
            if (ops != null) {
                try {
                    mode = ops.checkOpNoThrow(OPSTR_FULL_SCREEN_INTENT, Process.myUid(), getContext().getPackageName());
                } catch (Exception e) {
                    mode = AppOpsManager.MODE_DEFAULT;
                }
            }
            if (mode == AppOpsManager.MODE_ALLOWED) {
                can = true;
            } else if (mode == AppOpsManager.MODE_DEFAULT) {
                can = getContext().checkPermission(
                    "android.permission.USE_FULL_SCREEN_INTENT",
                    Process.myPid(),
                    Process.myUid()
                ) == PackageManager.PERMISSION_GRANTED;
            } else {
                can = false;
            }
        }
        ret.put("can", can);
        ret.put("requiresSettings", Build.VERSION.SDK_INT >= 34);
        call.resolve(ret);
    }

    @PluginMethod
    public void openFullScreenIntentSettings(PluginCall call) {
        try {
            Intent intent;
            if (Build.VERSION.SDK_INT >= 34) {
                intent = new Intent(
                    Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT,
                    Uri.parse("package:" + getContext().getPackageName())
                );
            } else {
                intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                    .putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName());
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Unable to open full screen notification settings", e);
        }
    }

    // ---- dose log queue (logged from the lock screen, synced by the app) ----

    @PluginMethod
    public void getPendingDoseLogs(PluginCall call) {
        JSONArray logs = getPendingLogs(getContext());
        JSObject ret = new JSObject();
        ret.put("logs", logs);
        call.resolve(ret);
    }

    @PluginMethod
    public void clearPendingDoseLogs(PluginCall call) {
        try {
            JSArray ids = call.getArray("ids");
            if (ids == null || ids.length() == 0) {
                prefs(getContext()).edit().remove(KEY_PENDING_LOGS).apply();
            } else {
                JSONArray logs = getPendingLogs(getContext());
                JSONArray kept = new JSONArray();
                for (int i = 0; i < logs.length(); i++) {
                    JSONObject entry = logs.getJSONObject(i);
                    String id = entry.optString("id", "");
                    boolean drop = false;
                    for (int j = 0; j < ids.length(); j++) {
                        if (id.equals(ids.getString(j))) { drop = true; break; }
                    }
                    if (!drop) kept.put(entry);
                }
                prefs(getContext()).edit().putString(KEY_PENDING_LOGS, kept.toString()).apply();
            }
        } catch (Exception e) {
            call.reject("Unable to clear pending dose logs", e);
            return;
        }
        call.resolve();
    }

    // ---- static helpers -----------------------------------------------------

    /**
     * Reads a numeric option. PluginCall.getLong only accepts Long values, the
     * bridge can also deliver Integer or Double numbers.
     */
    static long longValue(PluginCall call, String name, long defaultValue) {
        try {
            Object value = call.getData().opt(name);
            if (value instanceof Number) return ((Number) value).longValue();
        } catch (Exception e) {
            // fall through
        }
        return defaultValue;
    }

    static SharedPreferences prefs(Context ctx) {
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static void scheduleAlarm(Context ctx, JSONObject payload, long at) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        String id = payload.optString("id", String.valueOf(at));
        Intent intent = new Intent(ctx, DoseAlarmReceiver.class);
        intent.setAction(DoseAlarmReceiver.ACTION_ALARM);
        intent.putExtra(EXTRA_PAYLOAD, payload.toString());
        intent.putExtra("id", id);
        PendingIntent pi = PendingIntent.getBroadcast(
            ctx,
            requestCode(id),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        boolean exact = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            try {
                exact = am.canScheduleExactAlarms();
            } catch (SecurityException e) {
                exact = false;
            }
        }
        try {
            if (exact) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            } else {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            }
        } catch (SecurityException e) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        }
        storeScheduled(ctx, id, payload.toString());
    }

    static void cancelAlarm(Context ctx, String id) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Intent intent = new Intent(ctx, DoseAlarmReceiver.class);
        intent.setAction(DoseAlarmReceiver.ACTION_ALARM);
        PendingIntent pi = PendingIntent.getBroadcast(
            ctx,
            requestCode(id),
            intent,
            PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
        );
        if (pi != null) {
            am.cancel(pi);
            pi.cancel();
        }
    }

    static int requestCode(String id) {
        return id.hashCode();
    }

    static void storeScheduled(Context ctx, String id, String json) {
        try {
            JSONObject scheduled = getScheduled(ctx);
            scheduled.put(id, json);
            prefs(ctx).edit().putString(KEY_SCHEDULED, scheduled.toString()).apply();
        } catch (Exception e) {
            // best effort
        }
    }

    static void removeScheduled(Context ctx, String id) {
        try {
            JSONObject scheduled = getScheduled(ctx);
            scheduled.remove(id);
            prefs(ctx).edit().putString(KEY_SCHEDULED, scheduled.toString()).apply();
        } catch (Exception e) {
            // best effort
        }
    }

    static JSONObject getScheduled(Context ctx) {
        try {
            String raw = prefs(ctx).getString(KEY_SCHEDULED, "{}");
            return new JSONObject(raw == null ? "{}" : raw);
        } catch (Exception e) {
            return new JSONObject();
        }
    }

    static JSONArray getPendingLogs(Context ctx) {
        try {
            String raw = prefs(ctx).getString(KEY_PENDING_LOGS, "[]");
            return new JSONArray(raw == null ? "[]" : raw);
        } catch (Exception e) {
            return new JSONArray();
        }
    }

    static void enqueuePendingDoseLog(Context ctx, JSONObject entry) {
        try {
            JSONArray logs = getPendingLogs(ctx);
            logs.put(entry);
            prefs(ctx).edit().putString(KEY_PENDING_LOGS, logs.toString()).apply();
        } catch (Exception e) {
            // best effort
        }
    }

    /** Hands a fired alarm to the web layer when the app is in the foreground. */
    static void notifyAlarmFired(JSONObject payload) {
        DoseAlarmPlugin plugin = instance;
        if (plugin == null) return;
        try {
            plugin.notifyListeners("doseAlarm", new JSObject(payload.toString()));
        } catch (Exception e) {
            // best effort
        }
    }
}
