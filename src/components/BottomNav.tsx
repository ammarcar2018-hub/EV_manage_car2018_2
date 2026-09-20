import { FileText, ClipboardList, Settings, PieChart } from 'lucide-react';
import type { ReactNode } from 'react';

export type PageId = 'data' | 'report' | 'settings' | 'summary';

interface NavItem {
  id: PageId;
  label: string;
  icon: ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'data', label: 'البيانات', icon: <FileText size={22} /> },
  { id: 'report', label: 'التقرير', icon: <ClipboardList size={22} /> },
  { id: 'settings', label: 'الإعدادات', icon: <Settings size={22} /> },
  { id: 'summary', label: 'الخلاصة', icon: <PieChart size={22} /> },
];

interface BottomNavProps {
  active: PageId;
  onChange: (page: PageId) => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 transition-all active:scale-95 ${
                isActive ? 'text-brand-600' : 'text-slate-400'
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                  isActive ? 'bg-brand-50 scale-110' : ''
                }`}
              >
                {item.icon}
              </span>
              <span className={`text-[11px] font-medium ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
