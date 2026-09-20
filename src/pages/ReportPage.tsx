import { useState, useMemo } from 'react';
import { useData } from '@/lib/DataContext';
import type { Entry } from '@/lib/supabase';
import type { ComputedRow } from '@/lib/calculations';
import { formatNumber, formatCostPerKm, formatDate, todayStr, datesBetween, getArabicDayName, getDefaultDateRange } from '@/lib/dateUtils';
import { exportToExcel } from '@/lib/exportExcel';
import { ChevronRight, ChevronLeft, Download, CalendarRange } from 'lucide-react';
import { Field, Input, Button } from '@/components/ui';

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

export function ReportPage() {
  const { computedRows, allComputedRows, viewYear, viewMonth, setViewMonth, loading } = useData();

  const defaultRange = useMemo(() => getDefaultDateRange(), []);
  const [showRange, setShowRange] = useState(false);
  const [rangeStart, setRangeStart] = useState(defaultRange.start);
  const [rangeEnd, setRangeEnd] = useState(defaultRange.end);
  const [rangeApplied, setRangeApplied] = useState(true);

  const goPrevMonth = () => {
    if (viewMonth === 0) setViewMonth(viewYear - 1, 11);
    else setViewMonth(viewYear, viewMonth - 1);
  };

  const goNextMonth = () => {
    if (viewMonth === 11) setViewMonth(viewYear + 1, 0);
    else setViewMonth(viewYear, viewMonth + 1);
  };

  const filteredRows = useMemo(() => {
    if (!rangeApplied || (!rangeStart && !rangeEnd)) return computedRows;

    const start = rangeStart || allComputedRows[0]?.date || '';
    const end = rangeEnd || todayStr();
    if (!start || !end) return [];

    const allDates = datesBetween(start, end);
    const entriesByDate = new Map<string, ComputedRow>();
    for (const row of allComputedRows) {
      entriesByDate.set(row.date, row);
    }

    return allDates.map((dateStr): ComputedRow => {
      const existing = entriesByDate.get(dateStr);
      if (existing) return existing;
      const emptyEntry: Entry = {
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
      };
      return {
        ...emptyEntry,
        day_name: getArabicDayName(dateStr),
        distance_traveled: null,
        battery_diff: null,
        energy_kwh: null,
        meter_diff: null,
        tier: '-',
        consumption_value: null,
        cost_per_km: null,
        charger_consumption: null,
        cumulative_consumption: null,
        charger_consumption_cost: null,
        invoice_value: null,
      };
    });
  }, [rangeApplied, rangeStart, rangeEnd, computedRows, allComputedRows]);

  const handleExport = () => {
    if (rangeApplied && (rangeStart || rangeEnd)) {
      const label = `${rangeStart || 'البداية'}_إلى_${rangeEnd || 'النهاية'}`;
      exportToExcel(filteredRows, label, 0);
    } else {
      exportToExcel(computedRows, ARABIC_MONTHS[viewMonth], viewYear);
    }
  };

  const applyRange = () => {
    setRangeApplied(true);
  };

  const clearRange = () => {
    setRangeStart(defaultRange.start);
    setRangeEnd(defaultRange.end);
    setRangeApplied(true);
  };

  return (
    <div className="animate-fade-in px-4 pb-6">
      <h1 className="mb-4 text-2xl font-bold text-slate-800">التقرير</h1>

      <div className="mb-4 flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
        <button
          onClick={goPrevMonth}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
        >
          <ChevronRight size={20} />
        </button>
        <span className="font-semibold text-slate-700">
          {ARABIC_MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          onClick={goNextMonth}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      <button
        onClick={() => setShowRange(!showRange)}
        className={`mb-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold transition-all active:scale-[0.98] ${
          showRange || rangeApplied
            ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        <CalendarRange size={18} />
        {rangeApplied ? `المدى: ${rangeStart || '...'} → ${rangeEnd || '...'}` : 'اختيار المدى الزمني'}
      </button>

      {showRange && (
        <div className="mb-4 rounded-xl bg-white p-4 shadow-sm animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <Field label="تاريخ البداية">
              <Input type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} />
            </Field>
            <Field label="تاريخ النهاية">
              <Input type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} />
            </Field>
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={applyRange} className="flex-1">
              تطبيق
            </Button>
            <Button variant="secondary" onClick={clearRange} className="flex-1">
              مسح
            </Button>
          </div>
        </div>
      )}

      <button
        onClick={handleExport}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-semibold text-white shadow-sm shadow-green-600/20 transition-all hover:bg-green-700 active:scale-[0.98]"
      >
        <Download size={18} />
        {rangeApplied ? 'تصدير المحدد إلى إكسل' : 'تصدير إلى إكسل'}
      </button>

      {loading ? (
        <div className="py-20 text-center text-slate-400">جارٍ التحميل...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-center text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="whitespace-nowrap px-2 py-3 font-semibold">التاريخ</th>
                <th className="whitespace-nowrap px-2 py-3 font-semibold">اليوم</th>
                <th className="whitespace-nowrap px-2 py-3 font-semibold">المسافة الكلية</th>
                <th className="whitespace-nowrap px-2 py-3 font-semibold">المسافة المقطوعة</th>
                <th className="whitespace-nowrap px-2 py-3 font-semibold">النسبة قبل</th>
                <th className="whitespace-nowrap px-2 py-3 font-semibold">فرق النسبة</th>
                <th className="whitespace-nowrap px-2 py-3 font-semibold">الطاقة (kWh)</th>
                <th className="whitespace-nowrap px-2 py-3 font-semibold">العداد قبل</th>
                <th className="whitespace-nowrap px-2 py-3 font-semibold">العداد بعد</th>
                <th className="whitespace-nowrap px-2 py-3 font-semibold">فرق العداد</th>
                <th className="whitespace-nowrap px-2 py-3 font-semibold">قراءة الشاحن (تراكمي)</th>
                <th className="whitespace-nowrap px-2 py-3 font-semibold">كمية استهلاك السيارة</th>
                <th className="whitespace-nowrap px-2 py-3 font-semibold">إجمالي الاستهلاك الشهري</th>
                <th className="whitespace-nowrap px-2 py-3 font-semibold">قيمة استهلاك السيارة (د.أ)</th>
                <th className="whitespace-nowrap px-2 py-3 font-semibold">قيمة الفاتورة (د.أ)</th>
                <th className="whitespace-nowrap px-2 py-3 font-semibold">الشريحة</th>
                <th className="whitespace-nowrap px-2 py-3 font-semibold">قيمة الاستهلاك</th>
                <th className="whitespace-nowrap px-2 py-3 font-semibold">تكلفة الكيلومتر</th>
                <th className="whitespace-nowrap px-2 py-3 font-semibold">التحصيل</th>
                <th className="whitespace-nowrap px-2 py-3 font-semibold">مصروفات</th>
                <th className="whitespace-nowrap px-2 py-3 font-semibold">ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const hasData = row.id !== '';
                return (
                  <tr
                    key={row.date}
                    className={`border-t border-slate-100 ${hasData ? 'bg-white' : 'bg-slate-50/50'}`}
                  >
                    <td className="whitespace-nowrap px-2 py-2.5 text-slate-500">
                      {formatDate(row.date).slice(5)}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2.5 font-medium text-slate-700">
                      {row.day_name}
                    </td>
                    <td className="px-2 py-2.5 text-slate-600">{formatNumber(row.total_distance)}</td>
                    <td className="px-2 py-2.5 text-slate-600">{formatNumber(row.distance_traveled)}</td>
                    <td className="px-2 py-2.5 text-slate-600">{formatNumber(row.battery_before)}</td>
                    <td className="px-2 py-2.5 text-slate-600">{formatNumber(row.battery_diff)}</td>
                    <td className="px-2 py-2.5 text-slate-600">{formatNumber(row.energy_kwh, 1)}</td>
                    <td className="px-2 py-2.5 text-slate-600">{formatNumber(row.meter_before)}</td>
                    <td className="px-2 py-2.5 text-slate-600">{formatNumber(row.meter_after)}</td>
                    <td className="px-2 py-2.5 text-slate-600">{formatNumber(row.meter_diff, 1)}</td>
                    <td className="px-2 py-2.5 text-slate-600">{formatNumber(row.charger_reading)}</td>
                    <td className="px-2 py-2.5 text-slate-600">{formatNumber(row.charger_consumption, 1)}</td>
                    <td className="px-2 py-2.5 text-slate-600">{formatNumber(row.cumulative_consumption, 1)}</td>
                    <td className="px-2 py-2.5 text-slate-600">{formatNumber(row.charger_consumption_cost, 2)}</td>
                    <td className="px-2 py-2.5 text-slate-600">{formatNumber(row.invoice_value, 2)}</td>
                    <td className="px-2 py-2.5 text-slate-600">{row.tier}</td>
                    <td className="px-2 py-2.5 text-slate-600">{formatNumber(row.consumption_value, 2)}</td>
                    <td className="px-2 py-2.5 text-slate-600">{formatCostPerKm(row.cost_per_km)}</td>
                    <td className="px-2 py-2.5 font-medium text-green-600">{formatNumber(row.collection, 2)}</td>
                    <td className="px-2 py-2.5 font-medium text-red-500">{formatNumber(row.expenses, 2)}</td>
                    <td className="max-w-[120px] truncate px-2 py-2.5 text-slate-500" title={row.notes || ''}>
                      {row.notes || ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
