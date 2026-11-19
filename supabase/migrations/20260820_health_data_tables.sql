-- Health data tables (migrated from localStorage to Supabase)

-- Journal entries
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_date DATE NOT NULL,
  mood TEXT,
  sleep TEXT,
  symptoms JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Medical ID / emergency profile
CREATE TABLE IF NOT EXISTS medical_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  blood_type TEXT,
  allergies JSONB DEFAULT '[]',
  conditions JSONB DEFAULT '[]',
  emergency_name TEXT,
  emergency_relation TEXT,
  emergency_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Personal details (age, demographics)
CREATE TABLE IF NOT EXISTS personal_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  dob TEXT,
  age INTEGER,
  gender TEXT,
  height TEXT,
  weight TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Side effect logs
CREATE TABLE IF NOT EXISTS side_effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  med_id TEXT,
  med_name TEXT,
  effect_type TEXT,
  severity TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Stock tracking (pill counts)
CREATE TABLE IF NOT EXISTS medication_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  medication_id TEXT NOT NULL,
  remaining INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, medication_id)
);

-- RLS
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE side_effects ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth own journal" ON journal_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Auth own medical" ON medical_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Auth own personal" ON personal_details FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Auth own side_effects" ON side_effects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Auth own stock" ON medication_stock FOR ALL USING (auth.uid() = user_id);
