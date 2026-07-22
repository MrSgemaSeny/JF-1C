import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { twMerge } from 'tailwind-merge';

interface DatePickerProps {
  value: string; // ISO format 'YYYY-MM-DD'
  onChange: (date: string) => void;
  min?: string; // 'YYYY-MM-DD'
  placeholder?: string;
  className?: string;
}

export function DatePicker({ value, onChange, min, placeholder, className }: DatePickerProps) {
  const { t, i18n } = useTranslation(['common']);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const lang = i18n.language === 'en' ? 'en' : 'ru';
  const locale = lang === 'en' ? 'en-US' : 'ru-RU';

  // Parse current value or fallback to today for view month
  const selectedDateObj = useMemo(() => {
    if (!value) return null;
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [value]);

  const [viewDate, setViewDate] = useState<Date>(() => selectedDateObj || new Date());

  useEffect(() => {
    if (selectedDateObj) {
      setViewDate(selectedDateObj);
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const monthName = useMemo(() => {
    const name = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(viewDate);
    return name.charAt(0).toUpperCase() + name.slice(1);
  }, [viewDate, locale]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      // 2021-11-01 is a Monday
      const d = new Date(2021, 10, i + 1);
      const name = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d);
      return name.charAt(0).toUpperCase() + name.slice(1);
    });
  }, [locale]);

  const calendarDays = useMemo(() => {
    const days: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean; isDisabled: boolean; isToday: boolean; isSelected: boolean }> = [];

    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);

    // Monday-based indexing: 0 = Mon, ..., 6 = Sun
    let startDayIndex = firstDayOfMonth.getDay() - 1;
    if (startDayIndex === -1) startDayIndex = 6;

    // Previous month padding
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const d = new Date(viewYear, viewMonth - 1, dayNum);
      const dateStr = formatDateStr(d);
      days.push({
        dateStr,
        dayNum,
        isCurrentMonth: false,
        isDisabled: isDateDisabled(dateStr, min),
        isToday: isSameDay(d, new Date()),
        isSelected: value === dateStr,
      });
    }

    // Current month days
    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      const dateObj = new Date(viewYear, viewMonth, d);
      const dateStr = formatDateStr(dateObj);
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isDisabled: isDateDisabled(dateStr, min),
        isToday: isSameDay(dateObj, new Date()),
        isSelected: value === dateStr,
      });
    }

    // Next month padding (total cells 35 or 42)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const dateObj = new Date(viewYear, viewMonth + 1, i);
      const dateStr = formatDateStr(dateObj);
      days.push({
        dateStr,
        dayNum: i,
        isCurrentMonth: false,
        isDisabled: isDateDisabled(dateStr, min),
        isToday: isSameDay(dateObj, new Date()),
        isSelected: value === dateStr,
      });
    }

    return days;
  }, [viewYear, viewMonth, value, min]);

  function formatDateStr(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  }

  function isDateDisabled(dateStr: string, minStr?: string): boolean {
    if (!minStr) return false;
    return dateStr < minStr;
  }

  const formattedDisplay = useMemo(() => {
    if (!selectedDateObj) return '';
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(selectedDateObj);
  }, [selectedDateObj, locale]);

  const handlePrevMonth = () => setViewDate(new Date(viewYear, viewMonth - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(viewYear, viewMonth + 1, 1));

  const handleSelectDay = (dateStr: string) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const todayStr = formatDateStr(new Date());
    if (!isDateDisabled(todayStr, min)) {
      onChange(todayStr);
      setViewDate(new Date());
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block w-full sm:w-auto" ref={containerRef}>
      <div
        onClick={() => setIsOpen(prev => !prev)}
        className={twMerge(
          "flex items-center justify-between gap-3 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100/80 transition-all font-medium text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-green/20 select-none shadow-sm",
          isOpen ? "border-brand-green ring-2 ring-brand-green/20 bg-white" : "",
          className
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <CalendarIcon size={18} className="text-brand-green shrink-0" />
          <span className={twMerge("truncate", !formattedDisplay ? "text-gray-400 font-normal" : "text-gray-800 font-semibold")}>
            {formattedDisplay || placeholder || (lang === 'en' ? 'Select date' : 'Выберите дату')}
          </span>
        </div>

        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 rounded-full transition-colors shrink-0"
            title={lang === 'en' ? 'Clear' : 'Очистить'}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 p-4 animate-in fade-in zoom-in-95 duration-150">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 text-gray-500 hover:text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-bold text-gray-900 text-sm">{monthName}</span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 text-gray-500 hover:text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 text-center mb-2">
            {weekDays.map((day, i) => (
              <span key={i} className="text-[11px] font-bold text-gray-400 uppercase tracking-wider py-1">
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarDays.map((cell, idx) => (
              <button
                key={idx}
                type="button"
                disabled={cell.isDisabled}
                onClick={() => handleSelectDay(cell.dateStr)}
                className={twMerge(
                  "h-9 w-9 m-auto flex items-center justify-center rounded-xl text-xs font-semibold transition-all select-none",
                  cell.isDisabled ? "opacity-25 cursor-not-allowed text-gray-400" : "hover:bg-brand-green/10 hover:text-brand-green text-gray-700",
                  !cell.isCurrentMonth && !cell.isDisabled ? "text-gray-400 font-normal" : "",
                  cell.isToday && !cell.isSelected ? "border border-brand-green text-brand-green font-bold" : "",
                  cell.isSelected ? "bg-brand-green text-white font-bold shadow-md shadow-brand-green/20 scale-105 hover:bg-brand-green hover:text-white" : ""
                )}
              >
                {cell.dayNum}
              </button>
            ))}
          </div>

          {/* Calendar Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-xs">
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-red-500 font-medium transition-colors"
            >
              {lang === 'en' ? 'Clear' : 'Очистить'}
            </button>
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-brand-green font-bold hover:underline transition-colors"
            >
              {lang === 'en' ? 'Today' : 'Сегодня'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
