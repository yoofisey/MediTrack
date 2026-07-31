export interface Profile {
  id: string;
  full_name?: string;
  avatar_emoji?: string;
  condition?: string;
  wake_time?: string;
  sleep_time?: string;
  reminder_lead?: number;
  plan?: "free" | "pro" | "family" | "enterprise";
  theme?: string;
  country?: string;
  timezone?: string;
  last_checkin_date?: string;
  goals?: string[];
  onboarded?: boolean;
  created_at?: string;
}

export interface Medication {
  id: string;
  user_id: string;
  name: string;
  dosage_amount: number;
  dosage_unit: string;
  times_per_day: number;
  dose_interval_hours?: number;
  course_duration_days: number;
  start_date: string;
  active?: boolean;
  reminder_minutes?: number;
  reminder_times?: string;
  pills_per_package?: number;
  refill_reminder_at?: number;
  cost_per_package?: number;
  cost_currency?: string;
  notes?: string;
  image_url?: string;
  doctor_name?: string;
  doctor_phone?: string;
  pharmacy_name?: string;
  pharmacy_phone?: string;
  prescription_refill?: string;
  next_refill_date?: string;
  last_refill_date?: string;
  color?: string;
  created_at?: string;
}

export interface DoseLog {
  id?: string;
  medication_id: string;
  user_id: string;
  taken_at: string;
  journal?: string;
  notes?: string;
  medications?: { name: string };
  created_at?: string;
}

export interface Vital {
  id?: string;
  user_id: string;
  type: VitalType;
  value: number;
  value_secondary?: number;
  unit: string;
  notes?: string;
  created_at?: string;
}

export type VitalType = "blood_pressure" | "weight" | "glucose" | "heart_rate" | "temperature" | "spo2" | "cholesterol" | "bmi" | "hba1c" | "water_intake" | "peak_flow";

export interface PushSubscription {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface FamilyMember {
  id: string;
  owner_id: string;
  member_email: string;
  member_name?: string;
  member_user_id?: string;
  role: string;
  status: string;
  created_at?: string;
}

export interface Visit {
  id: string;
  date: string;
  time: string;
  reason: string;
  facility?: string;
  doctor?: string;
  createdAt?: string;
}

export interface MedicalID {
  blood_type?: string;
  allergies?: string[];
  conditions?: string[];
  emergency_name?: string;
  emergency_phone?: string;
}

export interface VitalReminderConfig {
  intervalId: string;
}

export interface ThemeColors {
  bg: string;
  surf: string;
  card: string;
  txt: string;
  muted: string;
  t2: string;
  t3: string;
  t4: string;
  bar: string;
  hover: string;
  sel: string;
  input: string;
  ib1: string;
  ib2: string;
  ib3: string;
  ib4: string;
  ib5: string;
  ib6: string;
}

export interface AlarmEvent {
  med: {
    id: string;
    name: string;
    dosage_amount: number;
    dosage_unit: string;
    notes?: string;
  };
  day: string;
  streak: number;
  isReminder?: boolean;
}

export interface OfflineDoseEntry {
  userId: string;
  medId: string;
  takenAt: string;
  notes?: string;
  _queuedAt: number;
}

export interface DoseEvent {
  medId: string;
  name: string;
  dosageAmount: number;
  dosageUnit: string;
  notes?: string;
  timesPerDay: number;
  courseDays: number;
  startDate: string;
  doseAt: number;
  lead: number;
  streak: number;
}
