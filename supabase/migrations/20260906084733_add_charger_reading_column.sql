/*
# Add charger_reading column to entries table

1. Modified Tables
- `entries` — add column `charger_reading` (numeric, nullable)
  - Stores the cumulative charger meter reading (قراءة الشاحن التراكمي)
  - Used to compute vehicle consumption: current charger_reading minus previous entry's charger_reading

2. Security
- No policy changes needed; existing anon CRUD policies already cover the new column.
*/

ALTER TABLE entries ADD COLUMN IF NOT EXISTS charger_reading numeric;
