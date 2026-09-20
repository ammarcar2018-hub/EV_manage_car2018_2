import { useState, type FormEvent } from 'react';
import { useData } from '@/lib/DataContext';
import { Field, Input, TextArea, Button } from '@/components/ui';
import { todayStr, formatNumber } from '@/lib/dateUtils';

export function DataPage() {
  const { addEntry, deleteEntry, getLastRealEntry, settings, computedRows } = useData();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const today = todayStr();
  const lastReal = getLastRealEntry();

  // Pre-fill meter_before from last real entry's meter_after
  const defaultMeterBefore = lastReal?.meter_after ?? settings.meter_start_month;
  const defaultTotalDistance = lastReal?.total_distance ?? 0;

  const [date, setDate] = useState(today);
  const [totalDistance, setTotalDistance] = useState('');
  const [batteryBefore, setBatteryBefore] = useState('');
  const [meterBefore, setMeterBefore] = useState(String(defaultMeterBefore));
  const [batteryAfter, setBatteryAfter] = useState('');
  const [meterAfter, setMeterAfter] = useState('');
  const [chargerReading, setChargerReading] = useState('');
  const [collection, setCollection] = useState('');
  const [expenses, setExpenses] = useState('');
  const [notes, setNotes] = useState('');

  const existingEntry = computedRows.find((r) => r.date === date);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const entry = {
        date,
        total_distance: totalDistance ? parseFloat(totalDistance) : null,
        battery_before: batteryBefore ? parseFloat(batteryBefore) : null,
        meter_before: meterBefore ? parseFloat(meterBefore) : null,
        battery_after: batteryAfter ? parseFloat(batteryAfter) : null,
        meter_after: meterAfter ? parseFloat(meterAfter) : null,
        charger_reading: chargerReading ? parseFloat(chargerReading) : null,
        collection: collection ? parseFloat(collection) : null,
        expenses: expenses ? parseFloat(expenses) : null,
        notes: notes || null,
      };

      await addEntry(entry);
      setMessage({ type: 'success', text: 'تم إضافة البيانات بنجاح' });

      // Reset form, keep date
      setTotalDistance('');
      setBatteryBefore('');
      setMeterBefore(meterAfter || meterBefore);
      setBatteryAfter('');
      setMeterAfter('');
      setChargerReading('');
      setCollection('');
      setExpenses('');
      setNotes('');
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'حدث خطأ',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingEntry?.id) {
      setMessage({ type: 'error', text: 'لا توجد بيانات لهذا التاريخ للحذف' });
      return;
    }
    setSaving(true);
    try {
      await deleteEntry(existingEntry.id);
      setMessage({ type: 'success', text: 'تم حذف البيانات' });
    } catch {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء الحذف' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in px-4 pb-6">
      <div className="mx-auto max-w-md">
        <h1 className="mb-1 text-2xl font-bold text-slate-800">البيانات</h1>
        <p className="mb-5 text-sm text-slate-500">
          {lastReal
            ? `آخر قراءة عداد: ${formatNumber(lastReal.meter_after)} | آخر مسافة: ${formatNumber(lastReal.total_distance)} كم`
            : 'أدخل بيانات اليوم'}
        </p>

        {message && (
          <div
            className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium animate-fade-in ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleAdd} className="space-y-4">
          <Field label="التاريخ">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </Field>

          <Field label="المسافة الكلية (كم)">
            <Input
              type="number"
              inputMode="decimal"
              step="any"
              value={totalDistance}
              onChange={(e) => setTotalDistance(e.target.value)}
              placeholder={String(defaultTotalDistance)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="البطارية قبل (%)">
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                value={batteryBefore}
                onChange={(e) => setBatteryBefore(e.target.value)}
              />
            </Field>
            <Field label="العداد قبل (kWh)">
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                value={meterBefore}
                onChange={(e) => setMeterBefore(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="البطارية بعد (%)">
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                value={batteryAfter}
                onChange={(e) => setBatteryAfter(e.target.value)}
              />
            </Field>
            <Field label="العداد بعد (kWh)">
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                value={meterAfter}
                onChange={(e) => setMeterAfter(e.target.value)}
              />
            </Field>
          </div>

          <Field label="قراءة الشاحن (تراكمي)">
            <Input
              type="number"
              inputMode="decimal"
              step="any"
              value={chargerReading}
              onChange={(e) => setChargerReading(e.target.value)}
              placeholder="قراءة الشاحن التراكمية"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="التحصيل (دينار)">
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
              />
            </Field>
            <Field label="مصروفات التشغيل (دينار)">
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
              />
            </Field>
          </div>

          <Field label="ملاحظات">
            <TextArea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات إضافية..."
            />
          </Field>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'جارٍ الحفظ...' : 'إضافة'}
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={saving || !existingEntry?.id}
              onClick={handleDelete}
              className="flex-1"
            >
              حذف
            </Button>
          </div>
        </form>

        {existingEntry?.id && (
          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
            يوجد بيانات مسجلة لهذا التاريخ. الإضافة ستحدّثها.
          </div>
        )}
      </div>
    </div>
  );
}
