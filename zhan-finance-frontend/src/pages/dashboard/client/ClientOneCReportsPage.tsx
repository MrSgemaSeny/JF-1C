import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, FileSpreadsheet, Filter, RefreshCw, AlertCircle, Download, FileText, Database } from 'lucide-react';

export function ClientOneCReportsPage() {
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState<'saldo' | 'osv' | 'reconciliation'>('saldo');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [isGenerating, setIsGenerating] = useState(false);

  const tabs = [
    { id: 'saldo', label: 'Сальдовая ведомость', icon: FileSpreadsheet },
    { id: 'osv', label: 'Оборотно-сальдовая ведомость', icon: Database },
    { id: 'reconciliation', label: 'Акт сверки взаиморасчетов', icon: FileText },
  ] as const;

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 600);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-brand-green uppercase tracking-tight">
              1С Отчеты и ведомости
            </h1>
            <p className="text-sm text-brand-green/70 font-medium">
              Формирование финансовых ведомостей и актов напрямую из учетной системы 1С
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-green/10 text-brand-green border border-brand-green/20">
              <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
              1С OData: Готов к синхронизации
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-brand-green/10 pb-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-brand-green text-brand-beige shadow-sm'
                    : 'bg-brand-green/5 text-brand-green/70 hover:bg-brand-green/10 hover:text-brand-green'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Date Filter & Control Panel */}
        <div className="bg-white p-5 rounded-2xl border border-brand-green/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-brand-green/5 px-3.5 py-2 rounded-xl border border-brand-green/10">
              <Calendar className="w-4 h-4 text-brand-green/60" />
              <span className="text-xs font-bold uppercase text-brand-green/60">Период:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-brand-green outline-none"
              />
              <span className="text-brand-green/40">—</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-brand-green outline-none"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-green text-brand-beige text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-brand-green/90 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              Сформировать отчет
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled
              className="flex items-center gap-1.5 px-3 py-2 bg-brand-green/5 text-brand-green/40 text-xs font-bold uppercase tracking-wider rounded-xl border border-brand-green/10 cursor-not-allowed"
              title="Экспорт будет доступен после загрузки данных из 1С"
            >
              <Download className="w-3.5 h-3.5" />
              Excel / PDF
            </button>
          </div>
        </div>

        {/* Main Content / Table Stub Area */}
        <div className="bg-white rounded-2xl border border-brand-green/10 p-8 shadow-sm text-center">
          <div className="max-w-md mx-auto py-12 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-green/5 border border-brand-green/10 flex items-center justify-center text-brand-green mb-4">
              <FileSpreadsheet className="w-8 h-8 opacity-60" />
            </div>

            <h3 className="text-lg font-black text-brand-green uppercase tracking-wide mb-2">
              {activeTab === 'saldo' && 'Сальдовая ведомость за выбранный период'}
              {activeTab === 'osv' && 'Оборотно-сальдовая ведомость'}
              {activeTab === 'reconciliation' && 'Акт сверки взаимных расчетов'}
            </h3>

            <p className="text-sm text-brand-green/70 leading-relaxed mb-6">
              Период выборки: <span className="font-bold text-brand-green">{startDate} — {endDate}</span>. В текущий момент выполняется подключение защищенного шлюза 1С OData. Данные по вашей компании станут доступны автоматически после завершения регламентной синхронизации.
            </p>

            <div className="w-full bg-brand-green/5 border border-brand-green/10 rounded-xl p-4 text-left flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-brand-green/60 shrink-0 mt-0.5" />
              <div className="text-xs text-brand-green/80 space-y-1">
                <p className="font-bold text-brand-green">Информация для клиента:</p>
                <p>Если вам срочно требуется заверенная выписка или акт сверки с печатью, вы можете запросить её у вашего персонального бухгалтера через чат поддержки.</p>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}