import { useEffect, useState } from 'react';
import { apiRequest } from '@/shared/api/http';
import { Calendar, CheckCircle2, Clock, FileText, TrendingUp, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface WeeklySummaryDto {
  completedTasksThisWeek: number;
  activeTasksCount: number;
  upcomingDeadlinesCount: number;
  pendingDocumentsCount: number;
  totalRevenueThisWeek: number;
  topWeeklyHighlights: string[];
}

export function WeeklySummaryWidget() {
  const { t } = useTranslation(['common']);
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
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {t('weeklySummary.title', { defaultValue: 'Итоги недели и текущий статус' })}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('weeklySummary.subtitle', { defaultValue: 'Автоматическая сводка показателей с ежедневным обновлением' })}
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <span className="text-xs font-medium px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-gray-700 flex items-center gap-1.5">
            <Calendar size={12} className="text-gray-500" />
            {t('weeklySummary.currentWeek', { defaultValue: 'Текущая неделя' })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
            <CheckCircle2 size={14} className="text-emerald-500" />
            {t('weeklySummary.completed', { defaultValue: 'Завершено' })}
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.completedTasksThisWeek}</p>
        </div>

        <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
            <Clock size={14} className="text-blue-500" />
            {t('weeklySummary.inProgress', { defaultValue: 'В процессе' })}
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.activeTasksCount}</p>
        </div>

        <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
            <Calendar size={14} className="text-amber-500" />
            {t('weeklySummary.deadlines', { defaultValue: 'Дедлайны' })}
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.upcomingDeadlinesCount}</p>
        </div>

        <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
            <FileText size={14} className="text-purple-500" />
            {t('weeklySummary.documents', { defaultValue: 'Документы' })}
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.pendingDocumentsCount}</p>
        </div>
      </div>

      {data.totalRevenueThisWeek > 0 && (
        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <TrendingUp size={14} className="text-emerald-500" />
            {t('weeklySummary.revenue', { defaultValue: 'Выручка по закрытым задачам' })}
          </span>
          <span className="font-semibold text-gray-900 text-sm">
            {data.totalRevenueThisWeek.toLocaleString()} ₸
          </span>
        </div>
      )}
    </div>
  );
}
