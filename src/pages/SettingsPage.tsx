import { useState, useEffect } from 'react';
import { useData } from '@/lib/DataContext';
import { Field, Input, Button } from '@/components/ui';

export function SettingsPage() {
  const { settings, updateSettings } = useData();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await updateSettings(form);
      setMessage({ type: 'success', text: 'تم حفظ الإعدادات' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'حدث خطأ',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in px-4 pb-6">
      <div className="mx-auto max-w-md">
        <h1 className="mb-5 text-2xl font-bold text-slate-800">الإعدادات</h1>

        {message && (
          <div
            className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          <Field label="قراءة العداد بداية الشهر">
            <Input
              type="number"
              inputMode="decimal"
              step="any"
              value={form.meter_start_month}
              onChange={(e) =>
                setForm({ ...form, meter_start_month: parseFloat(e.target.value) || 0 })
              }
            />
          </Field>

          <div className="rounded-xl bg-slate-50 p-4">
            <h2 className="mb-3 text-sm font-bold text-slate-700">شرائح الاستهلاك</h2>
            <div className="space-y-3">
              <Field label="الشريحة الأولى (kWh)">
                <Input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={form.tier1_limit}
                  onChange={(e) =>
                    setForm({ ...form, tier1_limit: parseFloat(e.target.value) || 0 })
                  }
                />
              </Field>
              <Field label="الشريحة الثانية (kWh)">
                <Input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={form.tier2_limit}
                  onChange={(e) =>
                    setForm({ ...form, tier2_limit: parseFloat(e.target.value) || 0 })
                  }
                />
              </Field>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <h2 className="mb-3 text-sm font-bold text-slate-700">التعاريف (مليم/قرش لكل kWh)</h2>
            <div className="space-y-3">
              <Field label="تعرفة الشريحة الأولى">
                <Input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={form.tier1_rate}
                  onChange={(e) =>
                    setForm({ ...form, tier1_rate: parseFloat(e.target.value) || 0 })
                  }
                />
              </Field>
              <Field label="تعرفة الشريحة الثانية">
                <Input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={form.tier2_rate}
                  onChange={(e) =>
                    setForm({ ...form, tier2_rate: parseFloat(e.target.value) || 0 })
                  }
                />
              </Field>
              <Field label="تعرفة الشريحة الثالثة">
                <Input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={form.tier3_rate}
                  onChange={(e) =>
                    setForm({ ...form, tier3_rate: parseFloat(e.target.value) || 0 })
                  }
                />
              </Field>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        </div>
      </div>
    </div>
  );
}
