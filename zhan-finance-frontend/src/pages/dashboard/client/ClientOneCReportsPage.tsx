import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  RefreshCw,
  Download,
  Printer,
  Filter,
} from 'lucide-react';

type ReportType = 'osv' | 'saldo' | 'reconciliation' | 'accountCard' | 'cashBook' | 'stock';

interface SubColumnConfig {
  key: string;
  labelKey: string;
  defaultLabel: string;
}

interface ColumnConfig {
  key: string;
  labelKey: string;
  defaultLabel: string;
  subColumns?: SubColumnConfig[];
  align?: 'left' | 'right' | 'center';
}

interface ReportTabConfig {
  id: ReportType;
  path: string;
  labelKey: string;
  shortLabelKey: string;
  descKey: string;
  defaultLabel: string;
  defaultShortLabel: string;
  description: string;
  columns: ColumnConfig[];
}

const REPORT_TABS: ReportTabConfig[] = [
  {
    id: 'osv',
    path: 'osv',
    labelKey: 'oneCReports.reports.osv.title',
    shortLabelKey: 'oneCReports.tabs.osv',
    descKey: 'oneCReports.reports.osv.desc',
    defaultLabel: 'Оборотно-сальдовая ведомость (ОСВ)',
    defaultShortLabel: 'ОСВ',
    description: 'Сводные обороты и сальдо по всем синтетическим счетам бухгалтерского учета РК',
    columns: [
      { key: 'account', labelKey: 'oneCReports.columns.account', defaultLabel: 'Счет учета', align: 'left' },
      { key: 'name', labelKey: 'oneCReports.columns.name', defaultLabel: 'Наименование счета', align: 'left' },
      {
        key: 'startBalance',
        labelKey: 'oneCReports.columns.startBalance',
        defaultLabel: 'Сальдо на начало',
        subColumns: [
          { key: 'debit', labelKey: 'oneCReports.columns.debit', defaultLabel: 'Дебет' },
          { key: 'credit', labelKey: 'oneCReports.columns.credit', defaultLabel: 'Кредит' },
        ],
        align: 'right',
      },
      {
        key: 'turnover',
        labelKey: 'oneCReports.columns.turnover',
        defaultLabel: 'Обороты за период',
        subColumns: [
          { key: 'debit', labelKey: 'oneCReports.columns.debit', defaultLabel: 'Дебет' },
          { key: 'credit', labelKey: 'oneCReports.columns.credit', defaultLabel: 'Кредит' },
        ],
        align: 'right',
      },
      {
        key: 'endBalance',
        labelKey: 'oneCReports.columns.endBalance',
        defaultLabel: 'Сальдо на конец',
        subColumns: [
          { key: 'debit', labelKey: 'oneCReports.columns.debit', defaultLabel: 'Дебет' },
          { key: 'credit', labelKey: 'oneCReports.columns.credit', defaultLabel: 'Кредит' },
        ],
        align: 'right',
      },
    ],
  },
  {
    id: 'saldo',
    path: 'saldo',
    labelKey: 'oneCReports.reports.saldo.title',
    shortLabelKey: 'oneCReports.tabs.saldo',
    descKey: 'oneCReports.reports.saldo.desc',
    defaultLabel: 'Сальдовая ведомость',
    defaultShortLabel: 'Сальдо',
    description: 'Развернутое сальдо по субсчетам и контрагентам на заданную дату',
    columns: [
      { key: 'account', labelKey: 'oneCReports.columns.subAccount', defaultLabel: 'Код субсчета', align: 'left' },
      { key: 'subconto', labelKey: 'oneCReports.columns.subconto', defaultLabel: 'Аналитика / Субконто', align: 'left' },
      { key: 'startDebit', labelKey: 'oneCReports.columns.startDebit', defaultLabel: 'Входящее сальдо (Дт)', align: 'right' },
      { key: 'startCredit', labelKey: 'oneCReports.columns.startCredit', defaultLabel: 'Входящее сальдо (Кт)', align: 'right' },
      { key: 'endDebit', labelKey: 'oneCReports.columns.endDebit', defaultLabel: 'Исходящее сальдо (Дт)', align: 'right' },
      { key: 'endCredit', labelKey: 'oneCReports.columns.endCredit', defaultLabel: 'Исходящее сальдо (Кт)', align: 'right' },
    ],
  },
  {
    id: 'reconciliation',
    path: 'reconciliation',
    labelKey: 'oneCReports.reports.reconciliation.title',
    shortLabelKey: 'oneCReports.tabs.reconciliation',
    descKey: 'oneCReports.reports.reconciliation.desc',
    defaultLabel: 'Акт сверки взаиморасчетов',
    defaultShortLabel: 'Акт сверки',
    description: 'Двустороннее сопоставление первичных документов и платежей с контрагентом',
    columns: [
      { key: 'date', labelKey: 'oneCReports.columns.date', defaultLabel: 'Дата операции', align: 'left' },
      { key: 'doc', labelKey: 'oneCReports.columns.doc', defaultLabel: 'Документ учета (СФ / АВР / Платеж)', align: 'left' },
      { key: 'ourDebit', labelKey: 'oneCReports.columns.ourDebit', defaultLabel: 'Дебет (ТОО / Наш учет)', align: 'right' },
      { key: 'ourCredit', labelKey: 'oneCReports.columns.ourCredit', defaultLabel: 'Кредит (ТОО / Наш учет)', align: 'right' },
      { key: 'partnerDebit', labelKey: 'oneCReports.columns.partnerDebit', defaultLabel: 'Дебет (Контрагент)', align: 'right' },
      { key: 'partnerCredit', labelKey: 'oneCReports.columns.partnerCredit', defaultLabel: 'Кредит (Контрагент)', align: 'right' },
    ],
  },
  {
    id: 'accountCard',
    path: 'account-card',
    labelKey: 'oneCReports.reports.accountCard.title',
    shortLabelKey: 'oneCReports.tabs.accountCard',
    descKey: 'oneCReports.reports.accountCard.desc',
    defaultLabel: 'Карточка счета / Анализ счета',
    defaultShortLabel: 'Карточка счета',
    description: 'Детальная хронология проводок по конкретному бухгалтерскому счету (1010, 1030, 3310, 1210)',
    columns: [
      { key: 'date', labelKey: 'oneCReports.columns.dateTime', defaultLabel: 'Дата и время', align: 'left' },
      { key: 'doc', labelKey: 'oneCReports.columns.doc1c', defaultLabel: 'Первичный документ 1С', align: 'left' },
      { key: 'corrAccount', labelKey: 'oneCReports.columns.corrAccount', defaultLabel: 'Корр. счет', align: 'center' },
      { key: 'content', labelKey: 'oneCReports.columns.content', defaultLabel: 'Содержание хозяйственной операции', align: 'left' },
      { key: 'debit', labelKey: 'oneCReports.columns.debit', defaultLabel: 'Дебет (KZT)', align: 'right' },
      { key: 'credit', labelKey: 'oneCReports.columns.credit', defaultLabel: 'Кредит (KZT)', align: 'right' },
      { key: 'balance', labelKey: 'oneCReports.columns.currentBalance', defaultLabel: 'Текущий остаток', align: 'right' },
    ],
  },
  {
    id: 'cashBook',
    path: 'cash-book',
    labelKey: 'oneCReports.reports.cashBook.title',
    shortLabelKey: 'oneCReports.tabs.cashBook',
    descKey: 'oneCReports.reports.cashBook.desc',
    defaultLabel: 'Кассовая книга и фискальные чеки',
    defaultShortLabel: 'Касса и чеки',
    description: 'Реестр фискальных Z-отчетов, чеков WebKassa и кассовых ордеров (ПКО / РКО)',
    columns: [
      { key: 'orderNum', labelKey: 'oneCReports.columns.orderNum', defaultLabel: 'Номер чека / ордера', align: 'left' },
      { key: 'dateTime', labelKey: 'oneCReports.columns.fiscalDateTime', defaultLabel: 'Дата / Время фискализации', align: 'left' },
      { key: 'operationType', labelKey: 'oneCReports.columns.operationType', defaultLabel: 'Тип (ПКО / РКО / Чек)', align: 'center' },
      { key: 'paymentType', labelKey: 'oneCReports.columns.paymentType', defaultLabel: 'Вид оплаты (Наличные / QR / Карта)', align: 'left' },
      { key: 'amount', labelKey: 'oneCReports.columns.amountKzt', defaultLabel: 'Сумма операции (KZT)', align: 'right' },
      { key: 'fiscalSign', labelKey: 'oneCReports.columns.fiscalSign', defaultLabel: 'Фискальный признак (ФП)', align: 'center' },
    ],
  },
  {
    id: 'stock',
    path: 'stock',
    labelKey: 'oneCReports.reports.stock.title',
    shortLabelKey: 'oneCReports.tabs.stock',
    descKey: 'oneCReports.reports.stock.desc',
    defaultLabel: 'Остатки номенклатуры и ТМЦ',
    defaultShortLabel: 'Склад и ТМЦ',
    description: 'Материальный отчет по складам, списаниям и поступлениям номенклатурных позиций',
    columns: [
      { key: 'sku', labelKey: 'oneCReports.columns.sku', defaultLabel: 'Артикул / Код', align: 'left' },
      { key: 'name', labelKey: 'oneCReports.columns.nomenclature', defaultLabel: 'Номенклатура', align: 'left' },
      { key: 'warehouse', labelKey: 'oneCReports.columns.warehouse', defaultLabel: 'Склад хранения', align: 'left' },
      { key: 'unit', labelKey: 'oneCReports.columns.unit', defaultLabel: 'Ед. изм.', align: 'center' },
      { key: 'startQty', labelKey: 'oneCReports.columns.startQty', defaultLabel: 'Нач. остаток', align: 'right' },
      { key: 'incomeQty', labelKey: 'oneCReports.columns.incomeQty', defaultLabel: 'Приход', align: 'right' },
      { key: 'outcomeQty', labelKey: 'oneCReports.columns.outcomeQty', defaultLabel: 'Расход', align: 'right' },
      { key: 'endQty', labelKey: 'oneCReports.columns.endQty', defaultLabel: 'Кон. остаток', align: 'right' },
    ],
  },
];

const ACCOUNT_OPTIONS = [
  { value: 'all', labelKey: 'oneCReports.accounts.all', defaultLabel: 'Все счета плана счетов РК' },
  { value: '1010', labelKey: 'oneCReports.accounts.acc1010', defaultLabel: '1010 — Денежные средства в кассе' },
  { value: '1030', labelKey: 'oneCReports.accounts.acc1030', defaultLabel: '1030 — Денежные средства на текущих банковских счетах' },
  { value: '1210', labelKey: 'oneCReports.accounts.acc1210', defaultLabel: '1210 — Краткосрочная дебиторская задолженность покупателей' },
  { value: '1310', labelKey: 'oneCReports.accounts.acc1310', defaultLabel: '1310 — Сырье и материалы' },
  { value: '1330', labelKey: 'oneCReports.accounts.acc1330', defaultLabel: '1330 — Товары' },
  { value: '3110', labelKey: 'oneCReports.accounts.acc3110', defaultLabel: '3110 — Корпоративный подоходный налог к уплате' },
  { value: '3130', labelKey: 'oneCReports.accounts.acc3130', defaultLabel: '3130 — Налог на добавленную стоимость (НДС)' },
  { value: '3310', labelKey: 'oneCReports.accounts.acc3310', defaultLabel: '3310 — Краткосрочная кредиторская задолженность поставщикам' },
  { value: '3350', labelKey: 'oneCReports.accounts.acc3350', defaultLabel: '3350 — Краткосрочная задолженность по оплате труда' },
];

export function ClientOneCReportsPage() {
  const { t } = useTranslation(['common']);
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('oneCReports.title', { defaultValue: '1С Бухгалтерия' })}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('oneCReports.subtitle', { defaultValue: 'Формирование регламентированных отчетов и ведомостей из учетной системы 1С' })}
        </p>
      </div>

      {/* Navigation Subtabs */}
      <div className="bg-white p-1.5 rounded-xl border border-gray-200 shadow-xs">
        <div className="flex flex-wrap gap-1">
          {REPORT_TABS.map((tab) => {
            const isActive = activeReport.id === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.path)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-brand-green text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {t(tab.shortLabelKey, { defaultValue: tab.defaultShortLabel })}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Report Title & Description */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            {t(activeReport.labelKey, { defaultValue: activeReport.defaultLabel })}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {t(activeReport.descKey, { defaultValue: activeReport.description })}
          </p>
        </div>

        {/* Quick Period Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-gray-400 mr-1">
            {t('oneCReports.period', { defaultValue: 'Период:' })}
          </span>
          <button
            onClick={() => handleQuickPeriod('thisMonth')}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {t('oneCReports.quickPeriod.thisMonth', { defaultValue: 'Этот месяц' })}
          </button>
          <button
            onClick={() => handleQuickPeriod('prevMonth')}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {t('oneCReports.quickPeriod.prevMonth', { defaultValue: 'Прошлый месяц' })}
          </button>
          <button
            onClick={() => handleQuickPeriod('q1')}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {t('oneCReports.quickPeriod.q1', { defaultValue: 'I кв.' })}
          </button>
          <button
            onClick={() => handleQuickPeriod('q2')}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {t('oneCReports.quickPeriod.q2', { defaultValue: 'II кв.' })}
          </button>
          <button
            onClick={() => handleQuickPeriod('ytd')}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {t('oneCReports.quickPeriod.ytd', { defaultValue: 'С начала года' })}
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range */}
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setHasGenerated(false);
                }}
                className="bg-transparent text-xs font-medium text-gray-700 outline-none"
              />
              <span className="text-gray-400 font-medium">—</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setHasGenerated(false);
                }}
                className="bg-transparent text-xs font-medium text-gray-700 outline-none"
              />
            </div>

            {/* Account Selector (for OSV, Saldo, Account-Card) */}
            {(activeReport.id === 'osv' || activeReport.id === 'saldo' || activeReport.id === 'accountCard') && (
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                <select
                  value={selectedAccount}
                  onChange={(e) => {
                    setSelectedAccount(e.target.value);
                    setHasGenerated(false);
                  }}
                  className="bg-transparent text-xs font-medium text-gray-700 outline-none cursor-pointer max-w-[240px] truncate"
                >
                  {ACCOUNT_OPTIONS.map((acc) => (
                    <option key={acc.value} value={acc.value}>
                      {t(acc.labelKey, { defaultValue: acc.defaultLabel })}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Action: Generate */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white text-xs font-semibold rounded-lg hover:bg-brand-green/90 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>
                {isGenerating
                  ? t('oneCReports.generating', { defaultValue: 'Запрос в 1С...' })
                  : t('oneCReports.generate', { defaultValue: 'Сформировать' })}
              </span>
            </button>
          </div>

          {/* Export & Print actions */}
          <div className="flex items-center gap-2">
            <button
              disabled
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 text-gray-400 text-xs font-medium rounded-lg border border-gray-200 cursor-not-allowed"
              title={t('oneCReports.actions.exportExcelTooltip', { defaultValue: 'Экспорт в Excel будет доступен после синхронизации 1С' })}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('oneCReports.actions.exportExcel', { defaultValue: 'Excel' })}</span>
            </button>
            <button
              disabled
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 text-gray-400 text-xs font-medium rounded-lg border border-gray-200 cursor-not-allowed"
              title={t('oneCReports.actions.printTooltip', { defaultValue: 'Печать PDF будет доступна после синхронизации 1С' })}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('oneCReports.actions.print', { defaultValue: 'Печать' })}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Table Frame & Clean Empty State */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold">
                {activeReport.columns.map((col) => (
                  <th
                    key={col.key}
                    colSpan={col.subColumns ? col.subColumns.length : 1}
                    className={`p-3 border-r border-gray-200 last:border-r-0 ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    }`}
                  >
                    {t(col.labelKey, { defaultValue: col.defaultLabel })}
                  </th>
                ))}
              </tr>
              {/* Secondary Subheaders if subcolumns exist */}
              {activeReport.columns.some((c) => c.subColumns) && (
                <tr className="bg-gray-50/50 border-b border-gray-200 text-[11px] text-gray-600 font-medium">
                  {activeReport.columns.map((col) => {
                    if (col.subColumns) {
                      return col.subColumns.map((sub, idx) => (
                        <th
                          key={`${col.key}-${idx}`}
                          className="p-2 border-r border-gray-200 last:border-r-0 text-right"
                        >
                          {t(sub.labelKey, { defaultValue: sub.defaultLabel })}
                        </th>
                      ));
                    }
                    return (
                      <th
                        key={`${col.key}-empty`}
                        className="p-2 border-r border-gray-200 last:border-r-0"
                      />
                    );
                  })}
                </tr>
              )}
            </thead>

            <tbody>
              <tr>
                <td
                  colSpan={activeReport.columns.reduce((acc, col) => acc + (col.subColumns ? col.subColumns.length : 1), 0)}
                  className="py-12 px-4 text-center text-sm text-gray-500"
                >
                  {hasGenerated
                    ? t('oneCReports.noData', { defaultValue: 'Данные за указанный период отсутствуют в 1С' })
                    : t('oneCReports.empty', { defaultValue: 'Нажмите «Сформировать» для получения отчёта' })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}