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
    <div className="bg-gradient-to-r from-brand-green/10 via-emerald-50 to-teal-50 border border-brand-green/20 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-brand-green text-white rounded-xl shadow-xs">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Итоги недели и текущий статус</h3>
            <p className="text-xs text-gray-500">Автоматическая сводка показателей с ежедневным обновлением</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-white/80 border border-gray-200 rounded-full text-gray-600 flex items-center gap-1.5 shadow-2xs">
          <Calendar size={12} className="text-brand-green" />
          Текущая неделя
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur-xs p-4 rounded-xl border border-gray-100 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
            <CheckCircle2 size={14} className="text-green-500" />
            Завершено на неделе
          </div>
          <p className="text-xl font-bold text-gray-900">{data.completedTasksThisWeek}</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xs p-4 rounded-xl border border-gray-100 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
            <Clock size={14} className="text-blue-500" />
            Задач в процессе
          </div>
          <p className="text-xl font-bold text-gray-900">{data.activeTasksCount}</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xs p-4 rounded-xl border border-gray-100 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
            <Calendar size={14} className="text-amber-500" />
            Ближайшие дедлайны
          </div>
          <p className="text-xl font-bold text-gray-900">{data.upcomingDeadlinesCount}</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xs p-4 rounded-xl border border-gray-100 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
            <FileText size={14} className="text-purple-500" />
            Документы на подпись
          </div>
          <p className="text-xl font-bold text-gray-900">{data.pendingDocumentsCount}</p>
        </div>
      </div>

      {data.totalRevenueThisWeek > 0 && (
        <div className="mt-4 pt-3 border-t border-brand-green/10 flex items-center justify-between text-xs text-gray-700">
          <span className="flex items-center gap-1 font-medium">
            <TrendingUp size={14} className="text-brand-green" />
            Выручка по закрытым задачам за неделю:
          </span>
          <span className="font-bold text-gray-900 text-sm">
            {data.totalRevenueThisWeek.toLocaleString()} ₸
          </span>
        </div>
      )}
    </div>
  );
}
