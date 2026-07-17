import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLeads, useUpdateLeadStatus, LeadStatus } from '@/features/leads/useLeads';
import { Calendar, Phone, Mail, MessageSquare, AlertCircle, ChevronDown, CheckCircle2, XCircle, Clock, LayoutList } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const statusColors: Record<LeadStatus, string> = {
  NEW: 'bg-blue-50 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
  DONE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELED: 'bg-rose-50 text-rose-700 border-rose-200',
};

const statusLabels: Record<LeadStatus, string> = {
  NEW: 'Новая',
  IN_PROGRESS: 'В работе',
  DONE: 'Успешно',
  CANCELED: 'Отказ',
};

const quizFieldLabels: Record<string, string> = {
  form: 'Форма бизнеса',
  turnover: 'Оборот',
  employees: 'Сотрудники',
  needs: 'Что требуется',
  timeline: 'Сроки',
  tax_system: 'Система налогообложения'
};

const formatMessage = (message: string, t: any) => {
  if (!message) return <span className="text-gray-400 text-sm italic">{t('admin.leads.noMessage', { defaultValue: 'Нет сообщения' })}</span>;
  
  if (message.includes('Результаты опроса:')) {
    const parts = message.replace('Результаты опроса:\n', '').split('- Вопрос: ').filter(Boolean);
    return (
      <div className="flex flex-col gap-2 mt-1">
        <span className="text-[10px] font-bold text-brand-green/70 uppercase tracking-wider mb-0.5">{t('admin.leads.quizResults', { defaultValue: 'Результаты квиза:' })}</span>
        <div className="flex flex-wrap gap-2.5">
          {parts.map((part, i) => {
            const splitIndex = part.indexOf('\n  Ответ: ');
            if (splitIndex === -1) return null;
            const rawQuestionStr = part.substring(0, splitIndex).trim();
            const answerStr = part.substring(splitIndex + '\n  Ответ: '.length).trim();
            const questionStr = t(`admin.leads.quizFields.${rawQuestionStr}`, { defaultValue: quizFieldLabels[rawQuestionStr] || rawQuestionStr });
            return (
              <div key={i} className="flex flex-col text-sm bg-white p-3 rounded-xl border border-gray-200 shadow-sm min-w-[140px] flex-1 max-w-[240px] transition-all hover:shadow-md hover:border-brand-green/30">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 line-clamp-1" title={questionStr}>{questionStr}</span>
                <span className="font-semibold text-gray-900">{answerStr}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-start gap-3 text-sm text-gray-700 mt-1 bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
      <MessageSquare className="w-4 h-4 text-brand-green/60 shrink-0 mt-0.5" />
      <span className="leading-relaxed whitespace-pre-wrap">{message}</span>
    </div>
  );
};

export const LeadsPage = () => {
  const { t } = useTranslation();
  const { data: leads, isLoading, error } = useLeads();
  const { mutate: updateStatus, isPending } = useUpdateLeadStatus();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500 p-8">
        <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
        <p className="font-medium">{t('admin.leads.loadError', { defaultValue: 'Ошибка загрузки лидов. Пожалуйста, попробуйте позже.' })}</p>
      </div>
    );
  }

  const sortedLeads = leads ? [...leads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];

  return (
    <div className="flex flex-col h-full bg-gray-50/50 w-full">
      <header className="px-6 md:px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 border-b border-gray-200 bg-white">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-brand-green/10 text-brand-green rounded-xl">
              <LayoutList size={24} />
            </div>
            {t('admin.leads.title', { defaultValue: 'Входящие заявки' })}
            <span className="rounded-full px-2.5 py-0.5 text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
              {leads?.length || 0}
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('admin.leads.subtitle', { defaultValue: 'Обработка новых заявок с сайта и квизов' })}
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6 md:p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                  <th className="px-6 py-4 w-48">{t('admin.leads.table.date', { defaultValue: 'Дата' })}</th>
                  <th className="px-6 py-4 w-64">{t('admin.leads.table.client', { defaultValue: 'Клиент' })}</th>
                  <th className="px-6 py-4">{t('admin.leads.table.message', { defaultValue: 'Сообщение / Результат' })}</th>
                  <th className="px-6 py-4 w-48 text-right">{t('admin.leads.table.status', { defaultValue: 'Статус' })}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedLeads.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <MessageSquare size={32} className="mb-3 opacity-20" />
                        <span className="font-medium">{t('admin.leads.noLeads', { defaultValue: 'Нет новых заявок' })}</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-brand-green/[0.02] transition-colors group">
                      <td className="px-6 py-5 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-gray-900">
                            {new Date(lead.createdAt).toLocaleDateString(t('common:locale', { defaultValue: 'ru-RU' }), { day: 'numeric', month: 'long' })}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                            <Clock size={12} />
                            {new Date(lead.createdAt).toLocaleTimeString(t('common:locale', { defaultValue: 'ru-RU' }), { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="font-semibold text-gray-900 text-base mb-1.5">{lead.name}</div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone size={14} className="text-gray-400" />
                          <a href={`tel:${lead.phone}`} className="hover:text-brand-green transition-colors">{lead.phone}</a>
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        {formatMessage(lead.message || '', t)}
                      </td>
                      <td className="px-6 py-5 align-top text-right">
                        <div className="relative inline-block text-left w-full max-w-[160px]">
                          <select
                            className={twMerge(
                              "appearance-none w-full text-sm font-semibold rounded-lg px-3 py-2 pr-8 border shadow-sm cursor-pointer outline-none transition-all focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green",
                              statusColors[lead.status]
                            )}
                            value={lead.status}
                            onChange={(e) => updateStatus({ id: lead.id, status: e.target.value as LeadStatus })}
                            disabled={isPending}
                          >
                            {(Object.keys(statusLabels) as LeadStatus[]).map((status) => (
                              <option key={status} value={status} className="bg-white text-gray-900 font-medium">
                                {t(`admin.leads.status.${status}`, { defaultValue: statusLabels[status] })}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
