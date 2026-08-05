import { useEffect, useState, useRef, useMemo } from 'react';
import {
  getDocuments,
  uploadDocument,
  downloadDocument,
  deleteDocument,
  confirmDocument,
  downloadZipDocuments,
} from '@/entities/document/api/documentApi';
import type { DocumentDto } from '@/entities/document/model/types';
import { useAuth } from '@/features/auth/AuthContext';
import { Spinner } from '@/shared/ui/Spinner';
import {
  Upload,
  Download,
  Trash2,
  FileText,
  FileSpreadsheet,
  File as FileIcon,
  FileImage,
  FileArchive,
  CheckCircle2,
  ShieldCheck,
  Folder,
  FileCheck,
  Clock,
  Layers,
  Search,
  LayoutGrid,
  List,
  X,
  ArrowUpDown,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { toast } from '@/shared/ui/Toast/ToastContext';

const FOLDERS = [
  { id: 'all', key: 'documents.folders.all', defaultLabel: 'Все документы' },
  { id: 'acts', key: 'documents.folders.acts', defaultLabel: 'Акты ВР' },
  { id: 'reports', key: 'documents.folders.reports', defaultLabel: 'Отчеты' },
  { id: 'contracts', key: 'documents.folders.contracts', defaultLabel: 'Договоры' },
  { id: 'other', key: 'documents.folders.other', defaultLabel: 'Разное' },
];

export function ClientDocumentsPage() {
  const { user } = useAuth();
  const { t } = useTranslation('common');
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [uploaderFilter, setUploaderFilter] = useState<'all' | 'company' | 'client'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'name' | 'size'>('date-desc');

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isConfirmingId, setIsConfirmingId] = useState<number | null>(null);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploadedByClient = (doc: DocumentDto) => {
    if (doc.uploadedByRole === 'CLIENT') return true;
    if (doc.uploadedById && user?.userId && doc.uploadedById === user.userId) return true;
    return false;
  };

  useEffect(() => {
    if (user?.userId) {
      fetchDocuments();
    }
  }, [user?.userId]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (user?.userId) {
        const data = await getDocuments(user.userId);
        setDocuments(data);
      }
    } catch (err) {
      setError(t('documents.notifications.downloadError', { defaultValue: 'Не удалось загрузить документы' }));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg', '.zip'];
  const ACCEPT_ATTRIBUTE = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/png,image/jpeg,application/zip,application/x-zip-compressed';

  const processFileUpload = async (file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      const errMsg = t('documents.notifications.invalidFileType', {
        defaultValue: 'Загрузка исполняемых файлов (.exe, .sh, .js) запрещена из соображений безопасности. Разрешены: PDF, DOCX, XLSX, PNG, JPG, ZIP, MD.'
      });
      setError(errMsg);
      toast.error(errMsg);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      await uploadDocument(file);
      setUploaderFilter('all');
      setSelectedFolder('all');
      setSearchQuery('');
      await fetchDocuments();
      toast.success(t('documents.notifications.uploadSuccess', { defaultValue: 'Файл успешно загружен' }));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      const apiMsg = err?.response?.data?.message || err?.message;
      setError(apiMsg || t('documents.notifications.uploadError', { defaultValue: 'Не удалось загрузить документ' }));
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFileUpload(file);
    }
  };

  const handleDownload = async (doc: DocumentDto) => {
    try {
      await downloadDocument(doc.id, doc.fileName);
    } catch (err) {
      console.error('Failed to download', err);
      toast.error(t('documents.notifications.downloadError', { defaultValue: 'Не удалось скачать документ' }));
    }
  };

  const handleConfirm = async (docId: number) => {
    setIsConfirmingId(docId);
    try {
      await confirmDocument(docId);
      await fetchDocuments();
      toast.success(t('documents.notifications.confirmSuccess', { defaultValue: 'Документ успешно подтвержден и подписан' }));
    } catch (err) {
      console.error('Failed to confirm document', err);
      toast.error(t('documents.notifications.confirmError', { defaultValue: 'Ошибка подписи документа' }));
    } finally {
      setIsConfirmingId(null);
    }
  };

  const handleBulkZipDownload = async () => {
    if (selectedIds.size === 0) return;
    setIsDownloadingZip(true);
    try {
      await downloadZipDocuments(Array.from(selectedIds));
    } catch (err) {
      console.error('Failed zip download', err);
      toast.error(t('documents.notifications.zipError', { defaultValue: 'Ошибка скачивания ZIP архива' }));
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('documents.notifications.confirmDelete', { defaultValue: 'Вы уверены, что хотите удалить этот документ?' }))) return;
    try {
      await deleteDocument(id);
      await fetchDocuments();
      toast.success(t('documents.notifications.deleteSuccess', { defaultValue: 'Документ успешно удален' }));
    } catch (err) {
      console.error('Failed to delete', err);
      toast.error(t('documents.notifications.deleteError', { defaultValue: 'Не удалось удалить документ' }));
    }
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (filteredDocs: DocumentDto[]) => {
    if (selectedIds.size === filteredDocs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDocs.map(d => d.id)));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocTypeInfo = (type: string) => {
    const tLower = type.toLowerCase();
    if (tLower.includes('pdf')) return { label: 'PDF', icon: FileText, bg: 'bg-red-50 text-red-700 border-red-200' };
    if (tLower.includes('spreadsheet') || tLower.includes('excel') || tLower.includes('csv'))
      return { label: 'EXCEL', icon: FileSpreadsheet, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (tLower.includes('wordprocessing') || tLower.includes('word'))
      return { label: 'WORD', icon: FileText, bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (tLower.includes('image')) return { label: 'IMG', icon: FileImage, bg: 'bg-purple-50 text-purple-700 border-purple-200' };
    if (tLower.includes('zip') || tLower.includes('compressed'))
      return { label: 'ZIP', icon: FileArchive, bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: type.split('/').pop()?.toUpperCase() || 'FILE', icon: FileIcon, bg: 'bg-gray-50 text-gray-700 border-gray-200' };
  };

  const getDocCategory = (doc: DocumentDto): 'acts' | 'reports' | 'contracts' | 'other' => {
    const docFolder = (doc.folder || '').toLowerCase();
    const fileName = doc.fileName.toLowerCase();
    if (docFolder.includes('акт') || docFolder.includes('act') || fileName.includes('акт') || fileName.includes('act')) {
      return 'acts';
    }
    if (docFolder.includes('отчет') || docFolder.includes('report') || fileName.includes('отчет') || fileName.includes('report')) {
      return 'reports';
    }
    if (docFolder.includes('договор') || docFolder.includes('contract') || fileName.includes('договор') || fileName.includes('contract')) {
      return 'contracts';
    }
    return 'other';
  };

  // Filter and Sort documents
  const filteredDocuments = useMemo(() => {
    return documents
      .filter((doc) => {
        // Source uploader filter
        const clientUpload = isUploadedByClient(doc);
        if (uploaderFilter === 'company' && clientUpload) return false;
        if (uploaderFilter === 'client' && !clientUpload) return false;

        // Folder filter
        if (selectedFolder !== 'all') {
          if (getDocCategory(doc) !== selectedFolder) return false;
        }

        // Search query filter
        const matchesSearch = !searchQuery || doc.fileName.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'date-asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === 'name') return a.fileName.localeCompare(b.fileName);
        if (sortBy === 'size') return b.fileSize - a.fileSize;
        return 0;
      });
  }, [documents, uploaderFilter, selectedFolder, searchQuery, sortBy, user?.userId]);

  // Counts per folder
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = { all: documents.length, acts: 0, reports: 0, contracts: 0, other: 0 };
    documents.forEach(doc => {
      const cat = getDocCategory(doc);
      counts[cat]++;
    });
    return counts;
  }, [documents]);

  const totalCount = documents.length;
  // Pending signature applies ONLY to documents uploaded by company staff (not by client)
  const pendingCount = documents.filter(d => !isUploadedByClient(d) && d.status !== 'CONFIRMED').length;
  const confirmedCount = documents.filter(d => d.status === 'CONFIRMED').length;

  return (
    <div className="w-full max-w-[1400px] px-4 md:px-8 mx-auto space-y-6 pb-24 pt-4">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200/80 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">{t('documents.title', { defaultValue: 'Документы' })}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('documents.subtitle', { defaultValue: 'Централизованное управление вашими документами, актами и договорами' })}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-green hover:bg-brand-green/90 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-brand-green/20 cursor-pointer active:scale-98"
          >
            <Upload size={16} />
            <span>{t('documents.upload.selectFile', { defaultValue: 'Загрузить файл' })}</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200/70 rounded-2xl p-5 shadow-2xs hover:shadow-sm hover:-translate-y-0.5 transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-inner">
            <Layers size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('documents.metrics.total', { defaultValue: 'Всего документов' })}</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200/70 rounded-2xl p-5 shadow-2xs hover:shadow-sm hover:-translate-y-0.5 transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 shadow-inner">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('documents.metrics.pending', { defaultValue: 'Ожидают подписи' })}</p>
            <p className="text-2xl font-black text-amber-600 mt-0.5">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200/70 rounded-2xl p-5 shadow-2xs hover:shadow-sm hover:-translate-y-0.5 transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-inner">
            <FileCheck size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('documents.metrics.confirmed', { defaultValue: 'Подписано' })}</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">{confirmedCount}</p>
          </div>
        </div>
      </div>

      {/* Drag & Drop Upload Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={clsx(
          'border-2 border-dashed rounded-2xl p-6 md:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 relative overflow-hidden group',
          isDragging
            ? 'border-brand-green bg-emerald-50/60 shadow-md scale-[1.003]'
            : 'border-gray-200/80 bg-white hover:border-brand-green/50 hover:bg-gray-50/60 hover:shadow-2xs'
        )}
      >
        <input ref={fileInputRef} type="file" accept={ACCEPT_ATTRIBUTE} className="hidden" onChange={handleFileSelect} disabled={isUploading} />
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-brand-green flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
          {isUploading ? <Spinner className="w-6 h-6 text-brand-green" /> : <Upload size={22} />}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">
            {isUploading ? t('documents.upload.uploading', { defaultValue: 'Загрузка документа...' }) : t('documents.upload.dragOrClick', { defaultValue: 'Перетащите файл или нажмите для загрузки' })}
          </p>
          <p className="text-xs font-medium text-gray-400 mt-1">{t('documents.upload.formats', { defaultValue: 'PDF, DOCX, XLSX, PNG, JPG, ZIP до 20 МБ' })}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Navigation Controls: Folders + Search + View Switcher */}
      <div className="flex flex-col gap-3 bg-white border border-gray-200/80 p-3.5 rounded-2xl shadow-2xs">
        {/* Top bar: Folder Tabs & Source Filters */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          {/* Folder Tabs (hide empty ones except 'all') */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {FOLDERS.map((f) => {
              const isSelected = selectedFolder === f.id;
              const count = folderCounts[f.id] || 0;
              // Hide empty folders to avoid visual noise, unless selected or 'all'
              if (f.id !== 'all' && count === 0 && !isSelected) return null;

              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFolder(f.id)}
                  className={clsx(
                    'px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap border',
                    isSelected
                      ? 'bg-brand-green text-white border-brand-green shadow-xs'
                      : 'bg-gray-50 text-gray-600 border-gray-200/60 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Folder size={14} className={isSelected ? 'text-white' : 'text-gray-400'} />
                  <span>{t(f.key, { defaultValue: f.defaultLabel })}</span>
                  <span
                    className={clsx(
                      'px-1.5 py-0.5 rounded-full text-[10px] font-extrabold',
                      isSelected ? 'bg-white/20 text-white' : 'bg-gray-200/70 text-gray-600'
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Uploader Source Filter */}
          <div className="flex items-center bg-gray-100/90 p-1 rounded-xl border border-gray-200/60 shrink-0">
            <button
              type="button"
              onClick={() => setUploaderFilter('all')}
              className={clsx(
                'px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                uploaderFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              )}
            >
              {t('documents.uploaderFilter.all', { defaultValue: 'Все источники' })}
            </button>
            <button
              type="button"
              onClick={() => setUploaderFilter('company')}
              className={clsx(
                'px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                uploaderFilter === 'company' ? 'bg-white text-brand-green shadow-xs' : 'text-gray-500 hover:text-gray-900'
              )}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              {t('documents.uploaderFilter.company', { defaultValue: 'От компании' })}
            </button>
            <button
              type="button"
              onClick={() => setUploaderFilter('client')}
              className={clsx(
                'px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                uploaderFilter === 'client' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              )}
            >
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              {t('documents.uploaderFilter.client', { defaultValue: 'Загружено вами' })}
            </button>
          </div>
        </div>

        {/* Bottom bar: Search + Sort + View Mode */}
        <div className="flex items-center gap-2.5 flex-wrap justify-between pt-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('documents.searchPlaceholder', { defaultValue: 'Поиск по названию файла...' })}
              className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200/80 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-gray-50 border border-gray-200/80 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-green/20 cursor-pointer"
            >
              <option value="date-desc">Сначала новые</option>
              <option value="date-asc">Сначала старые</option>
              <option value="name">По названию (А-Я)</option>
              <option value="size">По размеру</option>
            </select>
            <ArrowUpDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/60">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={clsx(
                'p-1.5 rounded-lg transition-all cursor-pointer',
                viewMode === 'table' ? 'bg-white text-brand-green shadow-xs' : 'text-gray-400 hover:text-gray-700'
              )}
              title={t('documents.viewMode.table', { defaultValue: 'Таблица' })}
            >
              <List size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={clsx(
                'p-1.5 rounded-lg transition-all cursor-pointer',
                viewMode === 'grid' ? 'bg-white text-brand-green shadow-xs' : 'text-gray-400 hover:text-gray-700'
              )}
              title={t('documents.viewMode.grid', { defaultValue: 'Сетка' })}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Document Content */}
      {isLoading && documents.length === 0 ? (
        <div className="py-20 flex items-center justify-center bg-white border border-gray-200/80 rounded-2xl shadow-2xs">
          <Spinner className="w-10 h-10 text-brand-green" />
        </div>
      ) : (
        <>
          {filteredDocuments.length > 0 && viewMode === 'table' && (
            <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200/80 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === filteredDocuments.length && filteredDocuments.length > 0}
                          onChange={() => toggleSelectAll(filteredDocuments)}
                          className="rounded border-gray-300 text-brand-green focus:ring-brand-green cursor-pointer"
                        />
                      </th>
                      <th className="px-6 py-4">{t('documents.table.file', { defaultValue: 'Название файла' })}</th>
                      <th className="px-6 py-4">{t('documents.table.type', { defaultValue: 'Тип' })}</th>
                      <th className="px-6 py-4">{t('documents.table.signature', { defaultValue: 'Статус подписи' })}</th>
                      <th className="px-6 py-4">{t('documents.table.size', { defaultValue: 'Размер' })}</th>
                      <th className="px-6 py-4 text-right">{t('documents.table.actions', { defaultValue: 'Действия' })}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {filteredDocuments.map((doc) => {
                      const info = getDocTypeInfo(doc.contentType);
                      const Icon = info.icon;
                      const isSelected = selectedIds.has(doc.id);
                      const isConfirmed = doc.status === 'CONFIRMED';
                      const clientUploaded = isUploadedByClient(doc);

                      return (
                        <tr key={doc.id} className={clsx('hover:bg-gray-50/70 transition-colors', isSelected && 'bg-emerald-50/30')}>
                          <td className="px-4 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(doc.id)}
                              className="rounded border-gray-300 text-brand-green focus:ring-brand-green cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border', info.bg)}>
                                <Icon size={18} />
                              </div>
                              <div>
                                <span className="font-bold text-gray-900 truncate max-w-md block" title={doc.fileName}>
                                  {doc.fileName}
                                </span>
                                <span className="text-[11px] text-gray-400 font-normal">
                                  {new Date(doc.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={clsx('text-xs font-bold px-2.5 py-1 rounded-lg border', info.bg)}>
                              {info.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {clientUploaded ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-full font-bold text-xs shadow-2xs">
                                <Upload size={13} />
                                {t('documents.status.clientUploaded', { defaultValue: 'Загружено вами' })}
                              </span>
                            ) : isConfirmed ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full font-bold text-xs shadow-2xs">
                                <ShieldCheck size={14} />
                                {t('documents.status.signed', { defaultValue: 'Подписано' })} {doc.confirmedAt ? new Date(doc.confirmedAt).toLocaleDateString() : ''}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleConfirm(doc.id)}
                                disabled={isConfirmingId === doc.id}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-brand-green hover:bg-brand-green/90 text-white rounded-full font-bold text-xs transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 disabled:opacity-50"
                              >
                                {isConfirmingId === doc.id ? (
                                  <>
                                    <Spinner className="w-3.5 h-3.5 text-white" />
                                    <span>{t('documents.status.confirming', { defaultValue: 'Подтверждаем...' })}</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 size={14} />
                                    <span>{t('documents.status.confirm', { defaultValue: 'Подтвердить' })}</span>
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-xs font-semibold">
                            {formatFileSize(doc.fileSize)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleDownload(doc)}
                                className="p-2 text-gray-400 hover:text-brand-green hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
                                title={t('documents.actions.download', { defaultValue: 'Скачать' })}
                              >
                                <Download size={18} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(doc.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                                title={t('documents.actions.delete', { defaultValue: 'Удалить' })}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Grid View Mode */}
          {filteredDocuments.length > 0 && viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredDocuments.map((doc) => {
                const info = getDocTypeInfo(doc.contentType);
                const Icon = info.icon;
                const isSelected = selectedIds.has(doc.id);
                const isConfirmed = doc.status === 'CONFIRMED';
                const clientUploaded = isUploadedByClient(doc);

                return (
                  <div
                    key={doc.id}
                    className={clsx(
                      'bg-white border rounded-2xl p-5 transition-all flex flex-col justify-between relative group hover:shadow-sm',
                      isSelected ? 'border-brand-green bg-emerald-50/20 ring-2 ring-brand-green/20' : 'border-gray-200/80 hover:border-gray-300'
                    )}
                  >
                    <div>
                      {/* Card Header: Type Icon & Checkbox */}
                      <div className="flex items-center justify-between mb-4">
                        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center border', info.bg)}>
                          <Icon size={20} />
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(doc.id)}
                          className="rounded border-gray-300 text-brand-green focus:ring-brand-green cursor-pointer w-4 h-4"
                        />
                      </div>

                      {/* File Name & Info */}
                      <h4 className="font-bold text-gray-900 text-sm line-clamp-2 mb-2 leading-snug" title={doc.fileName}>
                        {doc.fileName}
                      </h4>
                      <p className="text-xs text-gray-400 font-medium mb-4">
                        {formatFileSize(doc.fileSize)} • {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Card Footer: Status & Actions */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <div>
                        {clientUploaded ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                            <Upload size={11} />
                            {t('documents.status.clientUploaded', { defaultValue: 'Загружено вами' })}
                          </span>
                        ) : isConfirmed ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                            <ShieldCheck size={12} />
                            {t('documents.status.signed', { defaultValue: 'Подписано' })}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleConfirm(doc.id)}
                            disabled={isConfirmingId === doc.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-green hover:bg-brand-green/90 text-white rounded-lg font-bold text-xs transition-all cursor-pointer"
                          >
                            <CheckCircle2 size={12} />
                            <span>{t('documents.status.confirm', { defaultValue: 'Подтвердить' })}</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDownload(doc)}
                          className="p-1.5 text-gray-400 hover:text-brand-green hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                          title={t('documents.actions.download', { defaultValue: 'Скачать' })}
                        >
                          <Download size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                          title={t('documents.actions.delete', { defaultValue: 'Удалить' })}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {filteredDocuments.length === 0 && (
            <div className="text-center py-16 text-gray-400 bg-white border border-gray-200/80 rounded-2xl shadow-2xs">
              <FileText size={44} className="mx-auto mb-3 text-gray-300" />
              <p className="text-base font-bold text-gray-800">{t('documents.empty.title', { defaultValue: 'Документы не найдены' })}</p>
              <p className="text-xs text-gray-400 mt-1">{t('documents.empty.description', { defaultValue: 'Загрузите первый файл или измените параметры поиска' })}</p>
            </div>
          )}
        </>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md text-gray-900 px-6 py-3.5 rounded-2xl shadow-xl z-40 flex items-center gap-5 border border-brand-green/20 animate-in slide-in-from-bottom-5 duration-200">
          <span className="text-xs font-bold text-gray-600">
            Выбрано документов: <strong className="text-brand-green font-black">{selectedIds.size}</strong>
          </span>
          <div className="h-4 w-px bg-gray-200" />
          <button
            type="button"
            onClick={handleBulkZipDownload}
            disabled={isDownloadingZip}
            className="flex items-center gap-2 px-4 py-2 bg-brand-green hover:bg-brand-green/90 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-brand-green/20 cursor-pointer disabled:opacity-50"
          >
            <FileArchive size={15} />
            <span>
              {isDownloadingZip
                ? t('documents.actions.formingZip', { defaultValue: 'Формируем ZIP...' })
                : t('documents.actions.downloadZip', { defaultValue: `Скачать ZIP (${selectedIds.size})`, count: selectedIds.size })}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-gray-400 hover:text-gray-700 p-1 transition-colors"
            title={t('documents.actions.deselect', { defaultValue: 'Снять выделение' })}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
