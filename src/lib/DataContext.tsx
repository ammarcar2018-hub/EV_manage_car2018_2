import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { supabase, type Entry, type Settings, DEFAULT_SETTINGS } from './supabase';
import { getDaysInMonth, todayStr, getArabicDayName } from './dateUtils';
import { computeRow, type ComputedRow } from './calculations';

interface DataContextValue {
  entries: Entry[];
  computedRows: ComputedRow[];
  allComputedRows: ComputedRow[];
  settings: Settings;
  loading: boolean;
  error: string | null;
  viewYear: number;
  viewMonth: number;
  setViewMonth: (year: number, month: number) => void;
  addEntry: (entry: Omit<Entry, 'id'>) => Promise<void>;
  updateEntry: (id: string, updates: Partial<Entry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  updateSettings: (settings: Settings) => Promise<void>;
  getLastRealEntry: () => Entry | null;
}

const DataContext = createContext<DataContextValue | null>(null);

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const fetchEntries = useCallback(async () => {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .order('date', { ascending: true });
    if (error) {
      setError(error.message);
      return;
    }
    setEntries((data as Entry[]) || []);
  }, []);

  const fetchSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    if (error) {
      setError(error.message);
      return;
    }
    if (data) setSettings(data as Settings);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchEntries(), fetchSettings()]);
      setLoading(false);
    })();
  }, [fetchEntries, fetchSettings]);

  const addEntry = useCallback(async (entry: Omit<Entry, 'id'>) => {
    const { error } = await supabase.from('entries').insert(entry);
    if (error) throw new Error(error.message);
    await fetchEntries();
  }, [fetchEntries]);

  const updateEntry = useCallback(async (id: string, updates: Partial<Entry>) => {
    const { error } = await supabase.from('entries').update(updates).eq('id', id);
    if (error) throw new Error(error.message);
    await fetchEntries();
  }, [fetchEntries]);

  const deleteEntry = useCallback(async (id: string) => {
    const { error } = await supabase.from('entries').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await fetchEntries();
  }, [fetchEntries]);

  const updateSettings = useCallback(async (s: Settings) => {
    const { error } = await supabase
      .from('settings')
      .update({
        meter_start_month: s.meter_start_month,
        tier1_limit: s.tier1_limit,
        tier2_limit: s.tier2_limit,
        tier1_rate: s.tier1_rate,
        tier2_rate: s.tier2_rate,
        tier3_rate: s.tier3_rate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);
    if (error) throw new Error(error.message);
    setSettings(s);
  }, []);

  const changeViewMonth = useCallback((year: number, month: number) => {
    setViewYear(year);
    setViewMonth(month);
  }, []);

  // Build the full month grid: every day of the month, filled with entry data or empty
  const computedRows: ComputedRow[] = (() => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const rows: ComputedRow[] = [];
    const entriesByDate = new Map<string, Entry>();
    for (const e of entries) entriesByDate.set(e.date, e);

    // Track the last real entry (has total_distance and meter data) for computing diffs
    let prevRealEntry: Entry | null = null;

    // We need to find the last real entry BEFORE the first day of this month
    const monthStart = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-01`;
    const beforeMonth = entries.filter(
      (e) =>
        e.date < monthStart &&
        e.total_distance != null &&
        e.meter_before != null &&
        e.meter_after != null
    );
    if (beforeMonth.length > 0) {
      prevRealEntry = beforeMonth[beforeMonth.length - 1];
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const entry =
        entriesByDate.get(dateStr) ||
        ({
          id: '',
          date: dateStr,
          total_distance: null,
          battery_before: null,
          meter_before: null,
          battery_after: null,
          meter_after: null,
          charger_reading: null,
          collection: null,
          expenses: null,
          notes: null,
        } as Entry);

      const computed = computeRow(entry, prevRealEntry, settings);
      rows.push(computed);

      // Update prevRealEntry when we encounter a real entry with data
      if (
        entry.id !== '' &&
        entry.total_distance != null &&
        entry.meter_before != null &&
        entry.meter_after != null
      ) {
        prevRealEntry = entry;
      }
    }

    return rows;
  })();

  // Build computed rows across ALL entries (not just current month) for full-range summary
  const allComputedRows: ComputedRow[] = (() => {
    const rows: ComputedRow[] = [];
    let prevRealEntry: Entry | null = null;
    for (const entry of entries) {
      const computed = computeRow(entry, prevRealEntry, settings);
      rows.push(computed);
      if (
        entry.total_distance != null &&
        entry.meter_before != null &&
        entry.meter_after != null
      ) {
        prevRealEntry = entry;
      }
    }
    return rows;
  })();

  const getLastRealEntry = useCallback((): Entry | null => {
    const real = entries.filter(
      (e) => e.total_distance != null && e.meter_before != null && e.meter_after != null
    );
    if (real.length === 0) return null;
    return real[real.length - 1];
  }, [entries]);

  return (
    <DataContext.Provider
      value={{
        entries,
        computedRows,
        allComputedRows,
        settings,
        loading,
        error,
        viewYear,
        viewMonth,
        setViewMonth: changeViewMonth,
        addEntry,
        updateEntry,
        deleteEntry,
        updateSettings,
        getLastRealEntry,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
