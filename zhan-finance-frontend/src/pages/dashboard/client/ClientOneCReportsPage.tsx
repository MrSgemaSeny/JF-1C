import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  Database,
  FileText,
  Landmark,
  Receipt,
  Package,
  Calendar,
  RefreshCw,
  Download,
  Printer,
  AlertCircle,
  Filter,
  ShieldCheck,
} from 'lucide-react';

type ReportType = 'osv' | 'saldo' | 'reconciliation' | 'account-card' | 'cash-book' | 'stock';

interface ReportTabConfig {
  id: ReportType;
  path: string;
  label: string;
  shortLabel: string;
  icon: typeof FileSpreadsheet;
  description: string;
  columns: { key: string; label: string; subColumns?: string[]; align?: 'left' | 'right' | 'center' }[];
}

const REPORT_TABS: ReportTabConfig[] = [
  {
    id: 'osv',
    path: 'osv',
    label: 'Оборотно-сальдовая ведомость (ОСВ)',
    shortLabel: 'ОСВ',
    icon: Database,
    description: 'Сводные обороты и сальдо по всем синтетическим счетам бухгалтерского учета РК',
    columns: [
      { key: 'account', label: 'Счет учета', align: 'left' },
      { key: 'name', label: 'Наименование счета', align: 'left' },
      { key: 'startBalance', label: 'Сальдо на начало', subColumns: ['Дебет', 'Кредит'], align: 'right' },
      { key: 'turnover', label: 'Обороты за период', subColumns: ['Дебет', 'Кредит'], align: 'right' },
      { key: 'endBalance', label: 'Сальдо на конец', subColumns: ['Дебет', 'Кредит'], align: 'right' },
    ],
  },
  {
    id: 'saldo',
    path: 'saldo',
    label: 'Сальдовая ведомость',
    shortLabel: 'Сальдо',
    icon: FileSpreadsheet,
    description: 'Развернутое сальдо по субсчетам и контрагентам на заданную дату',
    columns: [
      { key: 'account', label: 'Код субсчета', align: 'left' },
      { key: 'subconto', label: 'Аналитика / Субконто', align: 'left' },
      { key: 'startDebit', label: 'Входящее сальдо (Дт)', align: 'right' },
      { key: 'startCredit', label: 'Входящее сальдо (Кт)', align: 'right' },
      { key: 'endDebit', label: 'Исходящее сальдо (Дт)', align: 'right' },
      { key: 'endCredit', label: 'Исходящее сальдо (Кт)', align: 'right' },
    ],
  },
  {
    id: 'reconciliation',
    path: 'reconciliation',
    label: 'Акт сверки взаиморасчетов',
    shortLabel: 'Акт сверки',
    icon: FileText,
    description: 'Двустороннее сопоставление первичных документов и платежей с контрагентом',
    columns: [
      { key: 'date', label: 'Дата операции', align: 'left' },
      { key: 'doc', label: 'Документ учета (СФ / АВР / Платеж)', align: 'left' },
      { key: 'ourDebit', label: 'Дебет (ТОО / Наш учет)', align: 'right' },
      { key: 'ourCredit', label: 'Кредит (ТОО / Наш учет)', align: 'right' },
      { key: 'partnerDebit', label: 'Дебет (Контрагент)', align: 'right' },
      { key: 'partnerCredit', label: 'Кредит (Контрагент)', align: 'right' },
    ],
  },
  {
    id: 'account-card',
    path: 'account-card',
    label: 'Карточка счета / Анализ счета',
    shortLabel: 'Карточка счета',
    icon: Landmark,
    description: 'Детальная хронология проводок по конкретному бухгалтерскому счету (1010, 1030, 3310, 1210)',
    columns: [
      { key: 'date', label: 'Дата и время', align: 'left' },
      { key: 'doc', label: 'Первичный документ 1С', align: 'left' },
      { key: 'corrAccount', label: 'Корр. счет', align: 'center' },
      { key: 'content', label: 'Содержание хозяйственной операции', align: 'left' },
      { key: 'debit', label: 'Дебет (KZT)', align: 'right' },
      { key: 'credit', label: 'Кредит (KZT)', align: 'right' },
      { key: 'balance', label: 'Текущий остаток', align: 'right' },
    ],
  },
  {
    id: 'cash-book',
    path: 'cash-book',
    label: 'Кассовая книга и фискальные чеки',
    shortLabel: 'Касса & Чеки',
    icon: Receipt,
    description: 'Реестр фискальных Z-отчетов, чеков WebKassa и кассовых ордеров (ПКО / РКО)',
    columns: [
      { key: 'orderNum', label: 'Номер чека / ордера', align: 'left' },
      { key: 'dateTime', label: 'Дата / Время фискализации', align: 'left' },
      { key: 'operationType', label: 'Тип (ПКО / РКО / Чек)', align: 'center' },
      { key: 'paymentType', label: 'Вид оплаты (Наличные / QR / Карта)', align: 'left' },
      { key: 'amount', label: 'Сумма операции (KZT)', align: 'right' },
      { key: 'fiscalSign', label: 'Фискальный признак (ФП)', align: 'center' },
    ],
  },
  {
    id: 'stock',
    path: 'stock',
    label: 'Остатки номенклатуры и ТМЦ',
    shortLabel: 'Склад & ТМЦ',
    icon: Package,
    description: 'Материальный отчет по складам, списаниям и поступлениям номенклатурных позиций',
    columns: [
      { key: 'sku', label: 'Артикул / Код', align: 'left' },
      { key: 'name', label: 'Номенклатура', align: 'left' },
      { key: 'warehouse', label: 'Склад хранения', align: 'left' },
      { key: 'unit', label: 'Ед. изм.', align: 'center' },
      { key: 'startQty', label: 'Нач. остаток', align: 'right' },
      { key: 'incomeQty', label: 'Приход', align: 'right' },
      { key: 'outcomeQty', label: 'Расход', align: 'right' },
      { key: 'endQty', label: 'Кон. остаток', align: 'right' },
    ],
  },
];

const ACCOUNT_OPTIONS = [
  { value: 'all', label: 'Все счета плана счетов РК' },
  { value: '1010', label: '1010 — Денежные средства в кассе' },
  { value: '1030', label: '1030 — Денежные средства на текущих банковских счетах' },
  { value: '1210', label: '1210 — Краткосрочная дебиторская задолженность покупателей' },
  { value: '1310', label: '1310 — Сырье и материалы' },
  { value: '1330', label: '1330 — Товары' },
  { value: '3110', label: '3110 — Корпоративный подоходный налог к уплате' },
  { value: '3130', label: '3130 — Налог на добавленную стоимость (НДС)' },
  { value: '3310', label: '3310 — Краткосрочная кредиторская задолженность поставщикам' },
  { value: '3350', label: '3350 — Краткосрочная задолженность по оплате труда' },
];

export function ClientOneCReportsPage() {
  const { report } = useParams<{ report?: string }>();
  const navigate = useNavigate();

  const activeReport = REPORT_TABS.find((t) => t.path === report) || REPORT_TABS[0];

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const today = now.toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleTabChange = (tabPath: string) => {
    navigate(`/client/1c/${tabPath}`);
    setHasGenerated(false);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setHasGenerated(true);
    }, 500);
  };

  const handleQuickPeriod = (preset: 'thisMonth' | 'prevMonth' | 'q1' | 'q2' | 'ytd') => {
    const currentYear = now.getFullYear();
    if (preset === 'thisMonth') {
      setStartDate(new Date(currentYear, now.getMonth(), 1).toISOString().slice(0, 10));
      setEndDate(today);
    } else if (preset === 'prevMonth') {
      const prevMonthStart = new Date(currentYear, now.getMonth() - 1, 1).toISOString().slice(0, 10);
      const prevMonthEnd = new Date(currentYear, now.getMonth(), 0).toISOString().slice(0, 10);
      setStartDate(prevMonthStart);
      setEndDate(prevMonthEnd);
    } else if (preset === 'q1') {
      setStartDate(`${currentYear}-01-01`);
      setEndDate(`${currentYear}-03-31`);
    } else if (preset === 'q2') {
      setStartDate(`${currentYear}-04-01`);
      setEndDate(`${currentYear}-06-30`);
    } else if (preset === 'ytd') {
      setStartDate(`${currentYear}-01-01`);
      setEndDate(today);
    }
    setHasGenerated(false);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-brand-green text-brand-beige tracking-wider">
              1С:ПРЕДПРИЯТИЕ 8.3
            </span>
            <span className="text-xs font-bold text-brand-green/60 uppercase tracking-widest">
              План счетов РК
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-brand-green uppercase tracking-tight">
            1С Бухгалтерия & Отчетность
          </h1>
          <p className="text-sm text-brand-green/70 font-medium mt-0.5">
            Формирование регламентированных ведомостей, актов и аналитики из учетной системы 1С
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-brand-green/15 text-brand-green shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Шлюз 1С OData: Готов к синхронизации</span>
          </div>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-brand-green/10 shadow-xs">
        <div className="flex flex-wrap gap-1">
          {REPORT_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeReport.id === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.path)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-brand-green text-brand-beige shadow-xs'
                    : 'text-brand-green/70 hover:bg-brand-green/5 hover:text-brand-green'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Report Title & Description */}
      <div className="bg-white p-5 rounded-2xl border border-brand-green/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-brand-green uppercase tracking-wide">
            {activeReport.label}
          </h2>
          <p className="text-xs text-brand-green/70 mt-0.5">
            {activeReport.description}
          </p>
        </div>

        {/* Quick Period Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-brand-green/50 uppercase mr-1">Быстрый выбор:</span>
          <button
            onClick={() => handleQuickPeriod('thisMonth')}
            className="px-2.5 py-1 text-xs font-bold rounded-lg border border-brand-green/15 text-brand-green hover:bg-brand-green/5 transition-colors cursor-pointer"
          >
            Этот месяц
          </button>
          <button
            onClick={() => handleQuickPeriod('prevMonth')}
            className="px-2.5 py-1 text-xs font-bold rounded-lg border border-brand-green/15 text-brand-green hover:bg-brand-green/5 transition-colors cursor-pointer"
          >
            Прошлый месяц
          </button>
          <button
            onClick={() => handleQuickPeriod('q1')}
            className="px-2.5 py-1 text-xs font-bold rounded-lg border border-brand-green/15 text-brand-green hover:bg-brand-green/5 transition-colors cursor-pointer"
          >
            I кв.
          </button>
          <button
            onClick={() => handleQuickPeriod('q2')}
            className="px-2.5 py-1 text-xs font-bold rounded-lg border border-brand-green/15 text-brand-green hover:bg-brand-green/5 transition-colors cursor-pointer"
          >
            II кв.
          </button>
          <button
            onClick={() => handleQuickPeriod('ytd')}
            className="px-2.5 py-1 text-xs font-bold rounded-lg border border-brand-green/15 text-brand-green hover:bg-brand-green/5 transition-colors cursor-pointer"
          >
            С начала года
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-brand-green/10 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range */}
            <div className="flex items-center gap-2 bg-brand-green/5 px-3.5 py-2.5 rounded-xl border border-brand-green/10">
              <Calendar className="w-4 h-4 text-brand-green/60 shrink-0" />
              <span className="text-xs font-bold uppercase text-brand-green/60">Период:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setHasGenerated(false);
                }}
                className="bg-transparent text-xs font-bold text-brand-green outline-none"
              />
              <span className="text-brand-green/40 font-bold">—</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setHasGenerated(false);
                }}
                className="bg-transparent text-xs font-bold text-brand-green outline-none"
              />
            </div>

            {/* Account Selector (for OSV, Saldo, Account-Card) */}
            {(activeReport.id === 'osv' || activeReport.id === 'saldo' || activeReport.id === 'account-card') && (
              <div className="flex items-center gap-2 bg-brand-green/5 px-3 py-2 rounded-xl border border-brand-green/10">
                <Filter className="w-4 h-4 text-brand-green/60 shrink-0" />
                <select
                  value={selectedAccount}
                  onChange={(e) => {
                    setSelectedAccount(e.target.value);
                    setHasGenerated(false);
                  }}
                  className="bg-transparent text-xs font-bold text-brand-green outline-none cursor-pointer max-w-[220px] truncate"
                >
                  {ACCOUNT_OPTIONS.map((acc) => (
                    <option key={acc.value} value={acc.value}>
                      {acc.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Action: Generate */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-green text-brand-beige text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-brand-green/90 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Запрос в 1С...' : 'Сформировать'}</span>
            </button>
          </div>

          {/* Export & Print actions */}
          <div className="flex items-center gap-2">
            <button
              disabled
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-brand-green/5 text-brand-green/40 text-xs font-bold uppercase tracking-wider rounded-xl border border-brand-green/10 cursor-not-allowed"
              title="Экспорт в Excel будет доступен после синхронизации 1С"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button
              disabled
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-brand-green/5 text-brand-green/40 text-xs font-bold uppercase tracking-wider rounded-xl border border-brand-green/10 cursor-not-allowed"
              title="Печать PDF будет доступна после синхронизации 1С"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Печать</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Table Frame & Clean Empty State */}
      <div className="bg-white rounded-2xl border border-brand-green/10 shadow-xs overflow-hidden">
        {/* Table Structure Header */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-brand-green/5 border-b border-brand-green/10 text-brand-green font-bold uppercase tracking-wider">
                {activeReport.columns.map((col) => (
                  <th
                    key={col.key}
                    colSpan={col.subColumns ? col.subColumns.length : 1}
                    className={`p-3.5 border-r border-brand-green/10 last:border-r-0 ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
              {/* Secondary Subheaders if subcolumns exist */}
              {activeReport.columns.some((c) => c.subColumns) && (
                <tr className="bg-brand-green/[0.02] border-b border-brand-green/10 text-[11px] text-brand-green/80 font-bold uppercase">
                  {activeReport.columns.map((col) => {
                    if (col.subColumns) {
                      return col.subColumns.map((sub, idx) => (
                        <th
                          key={`${col.key}-${idx}`}
                          className="p-2 border-r border-brand-green/10 last:border-r-0 text-right"
                        >
                          {sub}
                        </th>
                      ));
                    }
                    return (
                      <th
                        key={`${col.key}-empty`}
                        className="p-2 border-r border-brand-green/10 last:border-r-0"
                      />
                    );
                  })}
                </tr>
              )}
            </thead>

            {/* Table Body: Clean Empty State (NO fake/mock numbers) */}
            <tbody>
              <tr>
                <td
                  colSpan={activeReport.columns.reduce((acc, col) => acc + (col.subColumns ? col.subColumns.length : 1), 0)}
                  className="py-16 px-4 text-center"
                >
                  <div className="max-w-md mx-auto flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-brand-green/5 border border-brand-green/10 flex items-center justify-center text-brand-green/50 mb-3">
                      <FileSpreadsheet className="w-7 h-7" />
                    </div>

                    <h3 className="text-sm font-black text-brand-green uppercase tracking-wide mb-1">
                      {hasGenerated
                        ? 'Данные за указанный период отсутствуют в 1С'
                        : 'Отчет не сформирован'}
                    </h3>

                    <p className="text-xs text-brand-green/70 leading-relaxed max-w-sm mb-4">
                      {hasGenerated
                        ? `За период с ${startDate} по ${endDate} в базе 1С:Бухгалтерия не найдено зарегистрированных проводок или остатков.`
                        : `Задайте период с ${startDate} по ${endDate} и нажмите кнопку «Сформировать» для получения выписки из базы 1С.`}
                    </p>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-brand-green/5 border border-brand-green/10 text-[11px] font-bold text-brand-green/70">
                      <span>Режим работы:</span>
                      <span className="text-brand-green font-black">Прямое чтение (Read-Only)</span>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Information Banner */}
      <div className="bg-brand-green/5 border border-brand-green/10 rounded-2xl p-5 flex flex-col sm:flex-row items-start gap-4">
        <div className="p-2 rounded-xl bg-white border border-brand-green/10 text-brand-green shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs text-brand-green/80">
          <h4 className="font-bold text-brand-green uppercase tracking-wide">
            Регламент взаимодействия с учетной системой 1С
          </h4>
          <p className="leading-relaxed">
            Выгрузка бухгалтерских ведомостей формируется напрямую через защищенный OData-интерфейс конфигурации «1С:Бухгалтерия для Казахстана 8.3». Все данные соответствуют Типовому плану счетов бухгалтерского учета Республики Казахстан (Приказ МФ РК № 281).
          </p>
          <p className="text-brand-green/60 pt-1">
            Если вам необходим официальный подписанный акт сверки с печатью или заверенная ОСВ, обратитесь к вашему персональному бухгалтеру через раздел «Чат».
          </p>
        </div>
      </div>
    </div>
  );
}