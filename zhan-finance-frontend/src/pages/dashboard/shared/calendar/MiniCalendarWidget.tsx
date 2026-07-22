import { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X, Clock, AlignLeft, Tag } from 'lucide-react';
import { getCalendarEvents, createCalendarEvent, deleteCalendarEvent, CalendarEventDto } from '@/entities/calendar/api/calendarApi';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/config/routes';
import { useAuth } from '@/features/auth/AuthContext';
import { Spinner } from '@/shared/ui/Spinner';
import { useTranslation } from 'react-i18next';
const COLORS = [
  { value: 'BLUE', bg: 'bg-blue-100', text: 'text-blue-800' },
  { value: 'RED', bg: 'bg-red-100', text: 'text-red-800' },
  { value: 'GREEN', bg: 'bg-green-100', text: 'text-green-800' },
  { value: 'YELLOW', bg: 'bg-amber-100', text: 'text-amber-800' },
  { value: 'PURPLE', bg: 'bg-purple-100', text: 'text-purple-800' }
];

export function MiniCalendarWidget() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation(['common']);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEventDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');
  const [color, setColor] = useState('BLUE');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const locale = i18n.language === 'en' ? 'en-US' : 'ru-RU';
  
  const currentMonthName = useMemo(() => {
    const name = new Intl.DateTimeFormat(locale, { month: 'long' }).format(currentDate);
    return name.charAt(0).toUpperCase() + name.slice(1);
  }, [currentDate, locale]);

  const dayNames = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      // 2021-11-01 is Monday
      const d = new Date(2021, 10, i + 1);
      const name = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d);
      return name.charAt(0).toUpperCase() + name.slice(1);
    });
  }, [locale]);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      // Load current month
      const startDate = `${year}-${month}-01`;
      const endDate = `${year}-${month}-${new Date(year, currentDate.getMonth() + 1, 0).getDate()}`;
      
      const data = await getCalendarEvents(startDate, endDate);
      setEvents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setTitle('');
    setDescription('');
    setTime('');
    setColor('BLUE');
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !title.trim()) return;
    setIsSaving(true);
    try {
      const newEvent = await createCalendarEvent({
        date: selectedDate,
        title,
        description,
        time: time || undefined,
        color
      });
      setEvents(prev => [...prev, newEvent]);
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId: string, isTask: boolean) => {
    if (isTask) return; // Cannot delete tasks from calendar
    try {
      const originalId = parseInt(eventId.replace('event_', ''));
      await deleteCalendarEvent(originalId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (e) {
      console.error(e);
    }
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-8"></div>);
  }

  const todayStr = new Date().toISOString().split('T')[0];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayEvents = events.filter(e => e.date === dateStr);
    const isToday = dateStr === todayStr;

    let cellBg = isToday ? 'border-2 border-brand-green shadow-sm' : 'hover:bg-gray-100 bg-transparent';
    let textColor = isToday ? 'text-brand-green font-bold' : 'text-gray-700';

    if (dayEvents.length > 0) {
      const primaryEvent = dayEvents.find(e => e.color === 'RED') || dayEvents[0];
      const colorObj = COLORS.find(c => c.value === primaryEvent.color) || COLORS[0];
      cellBg = `${colorObj.bg} shadow-sm`;
      if (isToday) cellBg += ' border-2 border-brand-green';
      textColor = `${colorObj.text} font-semibold`;
    }

    days.push(
      <div 
        key={d} 
        onClick={() => handleDayClick(dateStr)}
        className={`h-8 flex items-center justify-center rounded-md cursor-pointer transition-all ${cellBg}`}
      >
        <span className={`text-xs ${textColor}`}>{d}</span>
        {dayEvents.length === 1 && (
          <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-current rounded-full" />
        )}
        {dayEvents.length > 1 && (
          <div className={`absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold text-white shadow-sm z-10 ${
            dayEvents.some(e => e.color === 'RED') ? 'bg-red-500' : 'bg-blue-500'
          }`}>
            {dayEvents.length}
          </div>
        )}
      </div>
    );
  }

  const calendarLink = user?.role === 'EMPLOYEE' ? ROUTES.EMPLOYEE_CALENDAR : ROUTES.CLIENT_CALENDAR;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-brand-green" />
            {t('calendarWidget.title')}
          </h2>
          <p className="text-sm text-gray-500 mt-1">{t('calendarWidget.currentMonth')}</p>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg">
          <button 
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="p-1 hover:bg-white rounded-md text-gray-600 transition-colors shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-medium text-sm w-24 text-center">
            {currentMonthName} {currentDate.getFullYear()}
          </span>
          <button 
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="p-1 hover:bg-white rounded-md text-gray-600 transition-colors shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center min-h-[220px]">
          <Spinner className="w-6 h-6 text-brand-green" />
        </div>
      ) : (
        <div className="flex-1">
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {dayNames.map(d => (
              <div key={d} className="text-[10px] font-medium text-gray-400 uppercase">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days}
          </div>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-100 flex justify-center">
        <Link 
          to={calendarLink}
          className="text-sm font-medium text-brand-green hover:text-brand-green/80 transition-colors flex items-center gap-1"
        >
          {t('calendarWidget.openFull')} <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Day Modal */}
      {isModalOpen && selectedDate && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-900">
                {t('calendarWidget.eventsOn')} {new Date(selectedDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
              {/* Existing Events List */}
              <div className="space-y-3 mb-8">
                {events.filter(e => e.date === selectedDate).length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4 bg-white rounded-xl border border-dashed border-gray-200">
                    {t('calendarWidget.noEvents')}
                  </p>
                ) : (
                  events.filter(e => e.date === selectedDate).map(e => {
                    const colorObj = COLORS.find(c => c.value === e.color) || COLORS[0];
                    return (
                      <div key={e.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start gap-3">
                        <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${colorObj.bg}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`font-medium ${e.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                              {e.title}
                            </p>
                            {e.time && <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">{e.time.substring(0, 5)}</span>}
                          </div>
                          {e.description && (
                            <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap">{e.description}</p>
                          )}
                          {e.type === 'TASK' && (
                            <span className="inline-block mt-2 text-[10px] uppercase tracking-wider font-bold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded">
                              Задача в системе
                            </span>
                          )}
                        </div>
                        {e.type === 'EVENT' && (
                          <button 
                            onClick={() => handleDeleteEvent(e.id, false)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                            title="Удалить"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add New Event Form */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-brand-green" />
                  Добавить событие
                </h4>
                <form onSubmit={handleSaveEvent} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Название события (напр. Оплата ИПН)"
                      className="w-full text-sm font-medium border-0 border-b-2 border-gray-100 focus:border-brand-green focus:ring-0 px-0 py-2 transition-colors bg-transparent placeholder-gray-400"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <input
                        type="time"
                        value={time}
                        onChange={e => setTime(e.target.value)}
                        className="flex-1 text-sm border-gray-200 rounded-lg focus:ring-brand-green focus:border-brand-green"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <select
                        value={color}
                        onChange={e => setColor(e.target.value)}
                        className="flex-1 text-sm border-gray-200 rounded-lg focus:ring-brand-green focus:border-brand-green"
                      >
                        {COLORS.map(c => (
                          <option key={c.value} value={c.value}>{c.value === 'BLUE' ? 'Синий' : c.value === 'RED' ? 'Красный' : c.value === 'GREEN' ? 'Зеленый' : c.value === 'YELLOW' ? 'Желтый' : 'Фиолетовый'}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Description Input (Optional) */}
                  <div className="flex items-start gap-3 mt-4">
                    <AlignLeft className="w-4 h-4 text-gray-400 mt-2" />
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Описание (необязательно)"
                      rows={2}
                      className="flex-1 text-sm border-gray-200 rounded-lg focus:ring-brand-green focus:border-brand-green resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving || !title.trim()}
                    className="w-full mt-4 bg-brand-green hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
