import { useState } from 'react';
import { DataProvider, useData } from '@/lib/DataContext';
import { BottomNav, type PageId } from '@/components/BottomNav';
import { DataPage } from '@/pages/DataPage';
import { ReportPage } from '@/pages/ReportPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { SummaryPage } from '@/pages/SummaryPage';
import { Zap } from 'lucide-react';

function AppContent() {
  const [page, setPage] = useState<PageId>('data');
  const { error } = useData();

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-lg items-center justify-center gap-2 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-slate-800">تتبع الكهرباء</span>
        </div>
      </header>

      {error && (
        <div className="mx-4 mt-3 rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <main className="mx-auto max-w-lg pt-2">
        {page === 'data' && <DataPage />}
        {page === 'report' && <ReportPage />}
        {page === 'settings' && <SettingsPage />}
        {page === 'summary' && <SummaryPage />}
      </main>

      <BottomNav active={page} onChange={setPage} />
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}
