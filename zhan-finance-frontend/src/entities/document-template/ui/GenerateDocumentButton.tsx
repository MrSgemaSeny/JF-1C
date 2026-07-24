import { useState, useRef, useEffect } from 'react';
import { FileDown, Zap, Loader2, FileText } from 'lucide-react';
import { documentTemplateApi } from '../api/documentTemplateApi';
import { DocumentTemplate } from '../model/types';

import { useToast } from '@/shared/ui/Toast/ToastContext';

interface GenerateDocumentButtonProps {
  taskId: number;
  onSuccess: () => void;
}

export function GenerateDocumentButton({ taskId, onSuccess }: GenerateDocumentButtonProps) {
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const data = await documentTemplateApi.getAllTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (templateId: string) => {
    try {
      setIsGenerating(true);
      await documentTemplateApi.generateDocument(taskId, templateId);
      setIsOpen(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isGenerating}
        className="text-brand-green hover:text-green-700 p-1 rounded transition-colors disabled:opacity-50 flex items-center gap-1 text-xs font-medium"
      >
        {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
        Сгенерировать
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Выберите шаблон</h4>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <Loader2 size={16} className="animate-spin mx-auto text-brand-green" />
              </div>
            ) : templates.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-500">Нет доступных шаблонов</div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {templates.map(t => (
                  <li key={t.id}>
                    <button
                      onClick={() => handleGenerate(t.id)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 group"
                    >
                      <FileText size={16} className="text-blue-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="block text-sm font-medium text-gray-700 group-hover:text-brand-green">{t.name}</span>
                        {t.description && <span className="block text-xs text-gray-400 mt-0.5 truncate">{t.description}</span>}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
