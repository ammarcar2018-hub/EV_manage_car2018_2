import * as XLSX from 'xlsx';
import type { ComputedRow } from './calculations';
import { computeSummary } from './calculations';
import { formatDate } from './dateUtils';

const FULL_HEADERS = [
  'التاريخ', 'اليوم', 'المسافة الكلية', 'المسافة المقطوعة',
  'النسبة قبل', 'فرق النسبة', 'كمية الطاقة (kWh)',
  'قراءة العداد قبل', 'قراءة العداد بعد', 'فرق العداد',
  'قراءة الشاحن (تراكمي)', 'كمية استهلاك السيارة', 'إجمالي الاستهلاك الشهري',
  'قيمة استهلاك السيارة (د.أ)', 'قيمة الفاتورة (د.أ)',
  'الشريحة', 'قيمة الاستهلاك', 'تكلفة الكيلومتر',
  'التحصيل', 'مصروفات', 'ملاحظات',
];

const FULL_COLS = [
  { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 14 },
  { wch: 10 }, { wch: 10 }, { wch: 16 },
  { wch: 16 }, { wch: 16 }, { wch: 12 },
  { wch: 18 }, { wch: 16 }, { wch: 18 },
  { wch: 18 }, { wch: 16 },
  { wch: 10 }, { wch: 14 }, { wch: 14 },
  { wch: 12 }, { wch: 12 }, { wch: 20 },
];

const RANGE_HEADERS = [
  'التاريخ', 'اليوم', 'المسافة المقطوعة',
  'قراءة العداد قبل', 'قراءة العداد بعد',
  'قراءة الشاحن (تراكمي)', 'كمية استهلاك السيارة',
  'قيمة استهلاك السيارة (د.أ)', 'قيمة الفاتورة (د.أ)',
  'التحصيل', 'مصروفات',
];

const RANGE_COLS = [
  { wch: 12 }, { wch: 10 }, { wch: 14 },
  { wch: 16 }, { wch: 16 },
  { wch: 18 }, { wch: 16 },
  { wch: 18 }, { wch: 16 },
  { wch: 12 }, { wch: 12 },
];

function mapFullRow(row: ComputedRow) {
  return {
    'التاريخ': formatDate(row.date),
    'اليوم': row.day_name,
    'المسافة الكلية': row.total_distance ?? '',
    'المسافة المقطوعة': row.distance_traveled ?? '',
    'النسبة قبل': row.battery_before ?? '',
    'فرق النسبة': row.battery_diff ?? '',
    'كمية الطاقة (kWh)': row.energy_kwh != null ? Number(row.energy_kwh.toFixed(2)) : '',
    'قراءة العداد قبل': row.meter_before ?? '',
    'قراءة العداد بعد': row.meter_after ?? '',
    'فرق العداد': row.meter_diff != null ? Number(row.meter_diff.toFixed(2)) : '',
    'قراءة الشاحن (تراكمي)': row.charger_reading ?? '',
    'كمية استهلاك السيارة': row.charger_consumption != null ? Number(row.charger_consumption.toFixed(2)) : '',
    'إجمالي الاستهلاك الشهري': row.cumulative_consumption != null ? Number(row.cumulative_consumption.toFixed(2)) : '',
    'قيمة استهلاك السيارة (د.أ)': row.charger_consumption_cost != null ? Number(row.charger_consumption_cost.toFixed(4)) : '',
    'قيمة الفاتورة (د.أ)': row.invoice_value != null ? Number(row.invoice_value.toFixed(4)) : '',
    'الشريحة': row.tier,
    'قيمة الاستهلاك': row.consumption_value != null ? Number(row.consumption_value.toFixed(4)) : '',
    'تكلفة الكيلومتر': row.cost_per_km != null ? Number(row.cost_per_km.toFixed(6)) : '',
    'التحصيل': row.collection ?? '',
    'مصروفات': row.expenses ?? '',
    'ملاحظات': row.notes ?? '',
  };
}

function mapRangeRow(row: ComputedRow) {
  return {
    'التاريخ': formatDate(row.date),
    'اليوم': row.day_name,
    'المسافة المقطوعة': row.distance_traveled ?? '',
    'قراءة العداد قبل': row.meter_before ?? '',
    'قراءة العداد بعد': row.meter_after ?? '',
    'قراءة الشاحن (تراكمي)': row.charger_reading ?? '',
    'كمية استهلاك السيارة': row.charger_consumption != null ? Number(row.charger_consumption.toFixed(2)) : '',
    'قيمة استهلاك السيارة (د.أ)': row.charger_consumption_cost != null ? Number(row.charger_consumption_cost.toFixed(4)) : '',
    'قيمة الفاتورة (د.أ)': row.invoice_value != null ? Number(row.invoice_value.toFixed(4)) : '',
    'التحصيل': row.collection ?? '',
    'مصروفات': row.expenses ?? '',
  };
}

function buildSummarySheet(rows: ComputedRow[]): XLSX.WorkSheet {
  const summary = computeSummary(rows);
  const data = [
    { 'البند': 'إجمالي المسافة', 'القيمة': Number(summary.total_distance.toFixed(2)), 'الوحدة': 'كم' },
    { 'البند': 'إجمالي قيمة الفاتورة', 'القيمة': Number(summary.invoice_value.toFixed(4)), 'الوحدة': 'د.أ' },
    { 'البند': 'إجمالي قيمة استهلاك السيارة', 'القيمة': Number(summary.total_cost.toFixed(4)), 'الوحدة': 'د.أ' },
    { 'البند': 'إجمالي التحصيل', 'القيمة': Number(summary.total_collection.toFixed(2)), 'الوحدة': 'د.أ' },
    { 'البند': 'إجمالي المصروفات', 'القيمة': Number(summary.total_expenses.toFixed(2)), 'الوحدة': 'د.أ' },
    { 'البند': 'الصافي', 'القيمة': Number(summary.net.toFixed(2)), 'الوحدة': 'د.أ' },
  ];
  const ws = XLSX.utils.json_to_sheet(data, { header: ['البند', 'القيمة', 'الوحدة'] });
  ws['!cols'] = [{ wch: 24 }, { wch: 14 }, { wch: 8 }];
  return ws;
}

export function exportToExcel(
  rows: ComputedRow[],
  monthName: string,
  year: number
) {
  const isRange = year === 0;
  const dataRows = rows.filter((r) => r.id);

  const reportData = isRange
    ? dataRows.map(mapRangeRow)
    : dataRows.map(mapFullRow);

  const headers = isRange ? RANGE_HEADERS : FULL_HEADERS;
  const cols = isRange ? RANGE_COLS : FULL_COLS;

  const ws = XLSX.utils.json_to_sheet(
    reportData.length > 0 ? reportData : [headers.reduce((acc, h) => ({ ...acc, [h]: '' }), {} as Record<string, string>)],
    { header: headers }
  );
  ws['!cols'] = cols;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'التقرير');

  if (isRange) {
    const summaryWs = buildSummarySheet(dataRows);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'الخلاصة');
  }

  if (wb.Workbook == null) wb.Workbook = {};
  (wb.Workbook as Record<string, unknown>).WBProps = { rtl: true };
  (wb.Workbook as Record<string, unknown>).Views = [{ RTL: true }];

  XLSX.writeFile(wb, year > 0 ? `تقرير_${monthName}_${year}.xlsx` : `تقرير_${monthName}.xlsx`);
}
