import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

export interface Entry {
  id: string;
  date: string;
  total_distance: number | null;
  battery_before: number | null;
  meter_before: number | null;
  battery_after: number | null;
  meter_after: number | null;
  charger_reading: number | null;
  collection: number | null;
  expenses: number | null;
  notes: string | null;
}

export interface Settings {
  id: number;
  meter_start_month: number;
  tier1_limit: number;
  tier2_limit: number;
  tier1_rate: number;
  tier2_rate: number;
  tier3_rate: number;
}

export const DEFAULT_SETTINGS: Settings = {
  id: 1,
  meter_start_month: 3037,
  tier1_limit: 300,
  tier2_limit: 600,
  tier1_rate: 50,
  tier2_rate: 100,
  tier3_rate: 200,
};
