import { useEffect, useState } from 'react';
import { apiRequest } from '@/shared/api/http';
import { Calendar, CheckCircle2, Clock, FileText, TrendingUp, Sparkles } from 'lucide-react';

interface WeeklySummaryDto {
  completedTasksThisWeek: number;
  activeTasksCount: number;
  upcomingDeadlinesCount: number;
  pendingDocumentsCount: number;
  totalRevenueThisWeek: number;
  topWeeklyHighlights: string[];
}

export function WeeklySummaryWidget() {
  const [data, setData] = useState<WeeklySummaryDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<WeeklySummaryDto>('/api/crm/dashboard/weekly-summary')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return null;

  return (
    <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-900 text-zinc-300 rounded-lg border border-zinc-800">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-100">Итоги недели и текущий статус</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Автоматическая сводка показателей с ежедневным обновлением</p>
          </div>
        </div>
        <div className="shrink-0">
          <span className="text-xs font-medium px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-300 flex items-center gap-1.5">
            <Calendar size={12} className="text-zinc-400" />
            Текущая неделя
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800/50">
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 mb-1.5">
            <CheckCircle2 size={14} className="text-emerald-400" />
            Завершено
          </div>
          <p className="text-2xl font-bold text-zinc-100">{data.completedTasksThisWeek}</p>
        </div>

        <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800/50">
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 mb-1.5">
            <Clock size={14} className="text-blue-400" />
            В процессе
          </div>
          <p className="text-2xl font-bold text-zinc-100">{data.activeTasksCount}</p>
        </div>

        <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800/50">
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 mb-1.5">
            <Calendar size={14} className="text-amber-400" />
            Дедлайны
          </div>
          <p className="text-2xl font-bold text-zinc-100">{data.upcomingDeadlinesCount}</p>
        </div>

        <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800/50">
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 mb-1.5">
            <FileText size={14} className="text-purple-400" />
            Документы
          </div>
          <p className="text-2xl font-bold text-zinc-100">{data.pendingDocumentsCount}</p>
        </div>
      </div>

      {data.totalRevenueThisWeek > 0 && (
        <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
            <TrendingUp size={14} className="text-emerald-400" />
            Выручка по закрытым задачам
          </span>
          <span className="font-semibold text-zinc-100 text-sm">
            {data.totalRevenueThisWeek.toLocaleString()} ₸
          </span>
        </div>
      )}
    </div>
  );
}
