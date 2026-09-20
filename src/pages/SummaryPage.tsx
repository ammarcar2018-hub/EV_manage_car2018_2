import { useState, useMemo, useEffect } from 'react';
import { useData } from '@/lib/DataContext';
import { computeSummary, type Summary } from '@/lib/calculations';
import { formatNumber, getDefaultDateRange } from '@/lib/dateUtils';
import { Route, Calendar, TrendingUp, Wallet, Banknote, Receipt } from 'lucide-react';
import type { ReactNode } from 'react';
import { Field, Input, Button } from '@/components/ui';

function SummaryCard({
  icon,
  label,
  value,
  unit,
  color,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm transition-all active:scale-[0.98]">
      <div className="mb-3 flex items-center gap-2">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
          {icon}
        </div>
        <span className="text-sm font-medium text-slate-500">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-slate-800">{value}</span>
        <span className="text-xs text-slate-400">{unit}</span>
      </div>
    </div>
  );
}

function SummaryResults({ summary }: { summary: Summary }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard
          icon={<Route size={18} className="text-brand-600" />}
          label="إجمالي المسافة"
          value={formatNumber(summary.total_distance)}
          unit="كم"
          color="bg-brand-50"
        />
        <SummaryCard
          icon={<Banknote size={18} className="text-blue-500" />}
          label="قيمة الفاتورة"
          value={formatNumber(summary.invoice_value, 2)}
          unit="د.أ"
          color="bg-blue-50"
        />
        <SummaryCard
          icon={<Receipt size={18} className="text-orange-500" />}
          label="قيمة استهلاك السيارة"
          value={formatNumber(summary.total_cost, 2)}
          unit="د.أ"
          color="bg-orange-50"
        />
        <SummaryCard
          icon={<Calendar size={18} className="text-brand-600" />}
          label="أيام العمل"
          value={String(summary.work_days)}
          unit="يوم"
          color="bg-brand-50"
        />
        <SummaryCard
          icon={<TrendingUp size={18} className="text-green-600" />}
          label="التحصيل"
          value={formatNumber(summary.total_collection, 2)}
          unit="د.أ"
          color="bg-green-50"
        />
        <SummaryCard
          icon={<Wallet size={18} className="text-red-500" />}
          label="المصروفات"
          value={formatNumber(summary.total_expenses, 2)}
          unit="د.أ"
          color="bg-red-50"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl bg-gradient-to-l from-brand-600 to-brand-700 p-5 shadow-lg shadow-brand-600/20">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
            <Banknote size={24} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-medium text-brand-100">الصافي</div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white">
                {formatNumber(summary.net, 2)}
              </span>
              <span className="text-sm text-brand-100">د.أ</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function SummaryPage() {
  const { allComputedRows, loading } = useData();

  const defaultRange = useMemo(() => getDefaultDateRange(), []);
  const [rangeStart, setRangeStart] = useState(defaultRange.start);
  const [rangeEnd, setRangeEnd] = useState(defaultRange.end);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [mode, setMode] = useState<'none' | 'range' | 'full'>('none');

  const computeRange = () => {
    const filtered = allComputedRows.filter((row) => {
      if (rangeStart && row.date < rangeStart) return false;
      if (rangeEnd && row.date > rangeEnd) return false;
      return true;
    });
    setSummary(computeSummary(filtered));
    setMode('range');
  };

  useEffect(() => {
    if (!loading && allComputedRows.length >= 0) {
      computeRange();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const computeFull = () => {
    setSummary(computeSummary(allComputedRows));
    setMode('full');
  };

  return (
    <div className="animate-fade-in px-4 pb-6">
      <h1 className="mb-5 text-2xl font-bold text-slate-800">الخلاصة</h1>

      {loading ? (
        <div className="py-20 text-center text-slate-400">جارٍ التحميل...</div>
      ) : (
        <>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              <Field label="تاريخ البداية">
                <Input type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} />
              </Field>
              <Field label="تاريخ النهاية">
                <Input type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} />
              </Field>
            </div>
            <Button onClick={computeRange} className="mt-3 w-full">
              احسب
            </Button>
          </div>

          <button
            onClick={computeFull}
            className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold transition-all active:scale-[0.98] ${
              mode === 'full'
                ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            عرض الإجمالي الكامل
          </button>

          {summary && mode === 'range' && (
            <div className="mt-4 animate-fade-in">
              <div className="mb-3 text-center text-sm font-medium text-slate-500">
                النتائج للمدى: {rangeStart || 'البداية'} → {rangeEnd || 'النهاية'}
              </div>
              <SummaryResults summary={summary} />
            </div>
          )}

          {summary && mode === 'full' && (
            <div className="mt-4 animate-fade-in">
              <div className="mb-3 text-center text-sm font-medium text-slate-500">
                الإجمالي الكامل لجميع البيانات
              </div>
              <SummaryResults summary={summary} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
