import type { Entry, Settings } from './supabase';
import { getArabicDayName } from './dateUtils';

export interface ComputedRow extends Entry {
  day_name: string;
  distance_traveled: number | null;
  battery_diff: number | null;
  energy_kwh: number | null;
  meter_diff: number | null;
  tier: string;
  consumption_value: number | null;
  cost_per_km: number | null;
  charger_consumption: number | null;
  cumulative_consumption: number | null;
  charger_consumption_cost: number | null;
  invoice_value: number | null;
}

function n(v: number | null | undefined): number {
  return v === null || v === undefined ? 0 : v;
}

export function computeRow(
  entry: Entry,
  prevEntry: Entry | null,
  settings: Settings
): ComputedRow {
  const day_name = getArabicDayName(entry.date);

  // المسافة المقطوعة = المسافة الكلية الحالية - آخر مسافة كلية محفوظة
  const distance_traveled =
    prevEntry && prevEntry.total_distance != null && entry.total_distance != null
      ? Math.max(0, n(entry.total_distance) - n(prevEntry.total_distance))
      : null;

  // فرق النسبة = النسبة قبل الشحن - النسبة بعد الشحن
  const battery_diff =
    entry.battery_before != null && entry.battery_after != null
      ? n(entry.battery_before) - n(entry.battery_after)
      : null;

  // الطاقة = (فرق النسبة / 100) × 50.8
  const energy_kwh =
    battery_diff != null
      ? (battery_diff / 100) * 50.8
      : null;

  // فرق العداد = قراءة العداد بعد الشحن - قراءة العداد قبل الشحن
  const meter_diff =
    entry.meter_before != null && entry.meter_after != null
      ? n(entry.meter_after) - n(entry.meter_before)
      : null;

  // الشريحة وتكلفة الشحن بناءً على الاستهلاك الشهري التراكمي
  const cumulativeConsumption = n(entry.meter_after) - settings.meter_start_month;
  const tier = computeTier(cumulativeConsumption, settings);
  const charge_cost = computeChargeCost(
    n(entry.meter_before),
    n(entry.meter_after),
    settings
  );

  // كمية استهلاك السيارة = قراءة الشاحن الحالية - قراءة الشاحن السابقة
  const charger_consumption =
    entry.charger_reading != null && prevEntry && prevEntry.charger_reading != null
      ? Math.max(0, n(entry.charger_reading) - n(prevEntry.charger_reading))
      : null;

  // إجمالي الاستهلاك الشهري التراكمي
  const cumulative_consumption = n(entry.meter_after) - settings.meter_start_month;

  // سعر الشريحة المطبقة (بالفلس) بناءً على الاستهلاك التراكمي
  const tierRate = getTierRate(cumulativeConsumption, settings);

  // قيمة استهلاك السيارة = كمية استهلاك السيارة × سعر الشريحة المطبقة (تحويل من فلس إلى دينار)
  const charger_consumption_cost =
    charger_consumption != null
      ? (charger_consumption * tierRate) / 1000
      : null;

  // قيمة الفاتورة = إجمالي الاستهلاك الشهري × سعر الشريحة المطبقة (تحويل من فلس إلى دينار)
  const invoice_value =
    cumulative_consumption > 0
      ? (cumulative_consumption * tierRate) / 1000
      : null;

  // تكلفة الكيلومتر = تكلفة الشحن / المسافة المقطوعة
  const cost_per_km =
    distance_traveled != null && distance_traveled > 0 && charge_cost != null
      ? n(charge_cost) / distance_traveled
      : null;

  return {
    ...entry,
    day_name,
    distance_traveled,
    battery_diff,
    energy_kwh,
    meter_diff,
    tier,
    consumption_value: charge_cost,
    cost_per_km,
    charger_consumption,
    cumulative_consumption: cumulative_consumption !== 0 ? cumulative_consumption : null,
    charger_consumption_cost,
    invoice_value,
  };
}

export function computeTier(cumulativeConsumption: number, settings: Settings): string {
  if (cumulativeConsumption <= 0) return '-';
  if (cumulativeConsumption <= settings.tier1_limit) return 'الأولى';
  if (cumulativeConsumption <= settings.tier2_limit) return 'الثانية';
  return 'الثالثة';
}

export function getTierRate(cumulativeConsumption: number, settings: Settings): number {
  if (cumulativeConsumption <= 0) return settings.tier1_rate;
  if (cumulativeConsumption <= settings.tier1_limit) return settings.tier1_rate;
  if (cumulativeConsumption <= settings.tier2_limit) return settings.tier2_rate;
  return settings.tier3_rate;
}

// تكلفة الشحن = فرق العداد × سعر الشريحة المطبق (مع التدرج)
export function computeChargeCost(
  meterBefore: number,
  meterAfter: number,
  settings: Settings
): number | null {
  if (meterBefore === 0 && meterAfter === 0) return null;
  const consumed = Math.max(0, meterAfter - meterBefore);
  if (consumed === 0) return 0;

  const base = settings.meter_start_month;
  const t1Boundary = base + settings.tier1_limit;
  const t2Boundary = base + settings.tier2_limit;
  const r1 = settings.tier1_rate;
  const r2 = settings.tier2_rate;
  const r3 = settings.tier3_rate;

  let cost = 0;
  const remainingFromT1 = Math.max(0, t1Boundary - meterBefore);
  const remainingFromT2 = Math.max(0, t2Boundary - meterBefore);

  if (meterBefore < t1Boundary) {
    const inT1 = Math.min(consumed, remainingFromT1);
    cost += inT1 * r1;
    const afterT1 = consumed - inT1;
    if (afterT1 > 0) {
      const inT2 = Math.min(afterT1, t2Boundary - t1Boundary);
      cost += inT2 * r2;
      const afterT2 = afterT1 - inT2;
      if (afterT2 > 0) cost += afterT2 * r3;
    }
  } else if (meterBefore < t2Boundary) {
    const inT2 = Math.min(consumed, remainingFromT2);
    cost += inT2 * r2;
    const afterT2 = consumed - inT2;
    if (afterT2 > 0) cost += afterT2 * r3;
  } else {
    cost += consumed * r3;
  }

  // التعاريف بالفلس — تحويل إلى دينار أردني
  return cost / 1000;
}

export interface Summary {
  total_distance: number;
  total_cost: number;
  invoice_value: number;
  work_days: number;
  total_collection: number;
  total_expenses: number;
  net: number;
}

export function computeSummary(rows: ComputedRow[]): Summary {
  let total_distance = 0;
  let total_cost = 0;
  let invoice_value = 0;
  let work_days = 0;
  let total_collection = 0;
  let total_expenses = 0;

  for (const row of rows) {
    if (!row.id) continue;
    if (row.distance_traveled != null) total_distance += row.distance_traveled;
    if (row.charger_consumption_cost != null) total_cost += row.charger_consumption_cost;
    if (row.invoice_value != null) invoice_value = row.invoice_value;
    if (row.collection != null && row.collection > 0) work_days += 1;
    if (row.collection != null) total_collection += row.collection;
    if (row.expenses != null) total_expenses += row.expenses;
  }

  return {
    total_distance,
    total_cost,
    invoice_value,
    work_days,
    total_collection,
    total_expenses,
    net: total_collection - total_expenses,
  };
}
