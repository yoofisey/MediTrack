import { test } from "node:test";
import assert from "node:assert/strict";
import { doseIntervalMs, nextDoseDue } from "../lib/data.js";
import { expectedDosesToday, medLogState, missedDoses } from "../lib/household.js";

// ---- doseIntervalMs -------------------------------------------------------

test("doseIntervalMs defaults to daily when times_per_day is 1", () => {
  assert.equal(doseIntervalMs({ times_per_day: 1 }), 24 * 3600000);
  assert.equal(doseIntervalMs({}), 24 * 3600000);
});

test("doseIntervalMs halves the day for twice-daily meds", () => {
  assert.equal(doseIntervalMs({ times_per_day: 2 }), 12 * 3600000);
});

test("doseIntervalMs honors an explicit dose_interval_hours", () => {
  assert.equal(doseIntervalMs({ dose_interval_hours: 8, times_per_day: 1 }), 8 * 3600000);
});

// ---- nextDoseDue ----------------------------------------------------------

test("nextDoseDue is null when the med has no logs yet", () => {
  assert.equal(nextDoseDue({ id: "m1" }, []), null);
});

test("nextDoseDue = last log + interval", () => {
  const med = { id: "m1", times_per_day: 2 }; // 12h interval
  const logs = [{ medication_id: "m1", taken_at: new Date(2026, 0, 1, 8, 0, 0).toISOString() }];
  const due = nextDoseDue(med, logs);
  assert.equal(due.getTime(), new Date(2026, 0, 1, 20, 0, 0).getTime());
});

// ---- expectedDosesToday (multi-dose slots) ---------------------------------

const baseNow = new Date(2026, 0, 5, 10, 0, 0); // Jan 5 2026 10:00 local

function member(meds, logs) {
  return { id: "mem1", pending: false, meds, logs };
}

test("one slot per daily med", () => {
  const m = member(
    [{ id: "m1", active: true, start_date: "2026-01-01", course_duration_days: 30, times_per_day: 1 }],
    []
  );
  const slots = expectedDosesToday(m, baseNow);
  assert.equal(slots.length, 1);
  assert.equal(slots[0].logged, false);
});

test("times_per_day=2 yields two slots, not one", () => {
  // Bug regression: previously one med → one slot regardless of times_per_day,
  // so a half-taken med showed as fully done.
  const m = member(
    [{ id: "m1", active: true, start_date: "2026-01-01", course_duration_days: 30, times_per_day: 2 }],
    [
      { medication_id: "m1", taken_at: new Date(2026, 0, 5, 8, 0, 0).toISOString() },
    ]
  );
  const slots = expectedDosesToday(m, baseNow);
  assert.equal(slots.length, 2);
  assert.equal(slots.filter(s => s.logged).length, 1);
  assert.deepEqual(slots.filter(s => !s.logged).map(s => s.time.length > 0), [true]);
});

test("medLogState counts logged doses correctly for multi-dose meds", () => {
  const m = member(
    [{ id: "m1", active: true, start_date: "2026-01-01", course_duration_days: 30, times_per_day: 3 }],
    [
      { medication_id: "m1", taken_at: new Date(2026, 0, 5, 7, 0, 0).toISOString() },
      { medication_id: "m1", taken_at: new Date(2026, 0, 5, 11, 0, 0).toISOString() },
    ]
  );
  const state = medLogState(m, m.meds[0], baseNow);
  assert.equal(state.total, 3);
  assert.equal(state.loggedCount, 2);
  assert.equal(state.allLogged, false);
});

test("allLogged only when every expected dose is taken", () => {
  const m = member(
    [{ id: "m1", active: true, start_date: "2026-01-01", course_duration_days: 30, times_per_day: 2 }],
    [
      { medication_id: "m1", taken_at: new Date(2026, 0, 5, 8, 0, 0).toISOString() },
      { medication_id: "m1", taken_at: new Date(2026, 0, 5, 20, 0, 0).toISOString() },
    ]
  );
  const state = medLogState(m, m.meds[0], baseNow);
  assert.equal(state.loggedCount, 2);
  assert.equal(state.allLogged, true);
});

test("inactive and expired meds contribute no slots", () => {
  const m = member(
    [
      { id: "m1", active: false, start_date: "2026-01-01", course_duration_days: 30, times_per_day: 1 },
      { id: "m2", active: true, start_date: "2025-12-01", course_duration_days: 30, times_per_day: 1 }, // ended Dec 31
    ],
    []
  );
  assert.equal(expectedDosesToday(m, baseNow).length, 0);
});

// ---- missedDoses ------------------------------------------------------------

test("missedDoses only flags overdue unfilled slots", () => {
  const m = member(
    [{ id: "m1", active: true, start_date: "2026-01-01", course_duration_days: 30, times_per_day: 1 }],
    []
  );
  // No logs yet → nextDoseDue null → dueMs = now. Not yet 20 min overdue.
  assert.equal(missedDoses(m, baseNow).length, 0);

  const m2 = member(
    [{ id: "m1", active: true, start_date: "2026-01-01", course_duration_days: 30, times_per_day: 1 }],
    [{ medication_id: "m1", taken_at: new Date(2026, 0, 4, 8, 0, 0).toISOString() }]
  );
  // Last taken Jan 4 08:00 + 24h = Jan 5 08:00, now is Jan 5 11:00 → overdue.
  const overdue = missedDoses(m2, baseNow);
  assert.equal(overdue.length, 1);
  assert.equal(overdue[0].med.id, "m1");
});