/*
# Create vehicle/electricity tracking tables (single-tenant, no auth)

1. New Tables
- `entries` — daily data entries for vehicle/electricity tracking
  - id (uuid, primary key)
  - date (date, not null) — the day this row represents
  - total_distance (numeric) — total distance (المسافة الكلية)
  - battery_before (numeric) — battery percentage before charging (نسبة البطارية قبل الشحن)
  - meter_before (numeric) — meter reading before charging (قراءة العداد قبل الشحن)
  - battery_after (numeric) — battery percentage after charging (نسبة البطارية بعد الشحن)
  - meter_after (numeric) — meter reading after charging (قراءة العداد بعد الشحن)
  - collection (numeric) — money collected (التحصيل)
  - expenses (numeric) — operating expenses (مصروفات التشغيل)
  - notes (text) — notes (ملاحظات)
  - created_at (timestamptz)

- `settings` — app configuration (single row)
  - id (int, primary key, always 1)
  - meter_start_month (numeric, default 3037) — meter reading at start of month
  - tier1_limit (numeric, default 300) — first tier limit (الشريحة الأولى)
  - tier2_limit (numeric, default 600) — second tier limit (الشريحة الثانية)
  - tier1_rate (numeric, default 50) — first tier rate (تعرفة الشريحة الأولى)
  - tier2_rate (numeric, default 100) — second tier rate (تعرفة الشريحة الثانية)
  - tier3_rate (numeric, default 200) — third tier rate (تعرفة الشريحة الثالثة)
  - updated_at (timestamptz)

2. Security
- Enable RLS on both tables.
- Allow anon + authenticated full CRUD (single-tenant, intentionally shared data, no sign-in).
*/

CREATE TABLE IF NOT EXISTS entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  total_distance numeric,
  battery_before numeric,
  meter_before numeric,
  battery_after numeric,
  meter_after numeric,
  collection numeric DEFAULT 0,
  expenses numeric DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_entries" ON entries;
CREATE POLICY "anon_select_entries" ON entries FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_entries" ON entries;
CREATE POLICY "anon_insert_entries" ON entries FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_entries" ON entries;
CREATE POLICY "anon_update_entries" ON entries FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_entries" ON entries;
CREATE POLICY "anon_delete_entries" ON entries FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS settings (
  id int PRIMARY KEY DEFAULT 1,
  meter_start_month numeric NOT NULL DEFAULT 3037,
  tier1_limit numeric NOT NULL DEFAULT 300,
  tier2_limit numeric NOT NULL DEFAULT 600,
  tier1_rate numeric NOT NULL DEFAULT 50,
  tier2_rate numeric NOT NULL DEFAULT 100,
  tier3_rate numeric NOT NULL DEFAULT 200,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT settings_single_row CHECK (id = 1)
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_settings" ON settings;
CREATE POLICY "anon_select_settings" ON settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_settings" ON settings;
CREATE POLICY "anon_insert_settings" ON settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_settings" ON settings;
CREATE POLICY "anon_update_settings" ON settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Seed default settings row
INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
