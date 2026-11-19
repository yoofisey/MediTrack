-- The vitals table was created without a type constraint (see
-- 20260803000000_add_vitals_family.sql), but a dashboard-era CHECK
-- constraint ("vitals_type_check") was later added that only allows a
-- subset of types (blood_pressure, weight, glucose, heart_rate,
-- temperature, spo2). The app supports 11 vital types; without dropping
-- this constraint, logging cholesterol, bmi, hba1c, water_intake or
-- peak_flow silently fails. Drop it so all app-supported types are valid.

alter table public.vitals drop constraint if exists vitals_type_check;
