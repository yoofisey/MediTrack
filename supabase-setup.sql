-- Run this SQL in your Supabase dashboard (SQL Editor) to set up RLS policies.

-- Enable RLS on all tables (already enabled by default for new tables)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dose_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO public
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO public
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO public
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- MEDICATIONS
DROP POLICY IF EXISTS "Users can view own medications" ON medications;
CREATE POLICY "Users can view own medications" ON medications
  FOR SELECT TO public
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own medications" ON medications;
CREATE POLICY "Users can insert own medications" ON medications
  FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own medications" ON medications;
CREATE POLICY "Users can update own medications" ON medications
  FOR UPDATE TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own medications" ON medications;
CREATE POLICY "Users can delete own medications" ON medications
  FOR DELETE TO public
  USING (auth.uid() = user_id);

-- DOSE LOGS
DROP POLICY IF EXISTS "Users can view own dose logs" ON dose_logs;
CREATE POLICY "Users can view own dose logs" ON dose_logs
  FOR SELECT TO public
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own dose logs" ON dose_logs;
CREATE POLICY "Users can insert own dose logs" ON dose_logs
  FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own dose logs" ON dose_logs;
CREATE POLICY "Users can delete own dose logs" ON dose_logs
  FOR DELETE TO public
  USING (auth.uid() = user_id);
