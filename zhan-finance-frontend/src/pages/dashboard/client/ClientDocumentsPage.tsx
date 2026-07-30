import { useEffect, useState, useRef } from 'react';
import { getDocuments, uploadDocument, downloadDocument, deleteDocument, confirmDocument, downloadZipDocuments } from '@/entities/document/api/documentApi';
import type { DocumentDto } from '@/entities/document/model/types';
import { useAuth } from '@/features/auth/AuthContext';
import { Spinner } from '@/shared/ui/Spinner';
import { Upload, Download, Trash2, FileText, FileSpreadsheet, File as FileIcon, FileImage, FileArchive, CheckCircle2, ShieldCheck, Folder, FileCheck, Clock, Layers } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { toast } from '@/shared/ui/Toast/ToastContext';

const FOLDERS = [
  { id: 'all', key: 'documents.folders.all', defaultLabel: 'Все' },
  { id: 'acts', key: 'documents.folders.acts', defaultLabel: 'Акты ВР' },
  { id: 'reports', key: 'documents.folders.reports', defaultLabel: 'Отчеты' },
  { id: 'contracts', key: 'documents.folders.contracts', defaultLabel: 'Договоры' },
  { id: 'other', key: 'documents.folders.other', defaultLabel: 'Разное' },
];

export function ClientDocumentsPage() {
  const { user } = useAuth();
  const { t } = useTranslation(['common', 'tasks']);
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isConfirmingId, setIsConfirmingId] = useState<number | null>(null);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
        const data = await getDocuments();
        setDocuments(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
    } catch (err) {
      setError('Failed to load documents');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const processFileUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      await uploadDocument(file);
      await fetchDocuments();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError('Failed to upload document');
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
      toast.error(t('documents.downloadError', { defaultValue: 'Не удалось скачать документ' }));
    }
  };

  const handleConfirm = async (docId: number) => {
    setIsConfirmingId(docId);
    try {
      await confirmDocument(docId);
      await fetchDocuments();
    } catch (err) {
      console.error('Failed to confirm document', err);
      toast.error(t('documents.confirmError', { defaultValue: 'Ошибка подписи документа' }));
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
      toast.error(t('documents.zipError', { defaultValue: 'Ошибка скачивания ZIP архива' }));
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('documents.confirmDelete', { defaultValue: 'Удалить документ?' }))) return;
    try {
      await deleteDocument(id);
      await fetchDocuments();
    } catch (err) {
      console.error('Failed to delete', err);
      toast.error(t('documents.deleteError', { defaultValue: 'Не удалось удалить документ' }));
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
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocTypeInfo = (type: string) => {
    const tLower = type.toLowerCase();
    if (tLower.includes('pdf')) return { label: 'PDF', icon: FileText, bg: 'bg-red-50 text-red-700 border-red-200' };
    if (tLower.includes('spreadsheet') || tLower.includes('excel') || tLower.includes('csv')) return { label: 'EXCEL', icon: FileSpreadsheet, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (tLower.includes('wordprocessing') || tLower.includes('word')) return { label: 'WORD', icon: FileText, bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (tLower.includes('image')) return { label: 'IMG', icon: FileImage, bg: 'bg-purple-50 text-purple-700 border-purple-200' };
    if (tLower.includes('zip') || tLower.includes('compressed')) return { label: 'ZIP', icon: FileArchive, bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: type.split('/').pop()?.toUpperCase() || 'FILE', icon: FileIcon, bg: 'bg-gray-50 text-gray-700 border-gray-200' };
  };

  const filteredDocuments = documents.filter(doc => {
    if (selectedFolder === 'all') return true;
    const docFolder = doc.folder || 'Разное';
    const fileName = doc.fileName.toLowerCase();
    if (selectedFolder === 'acts') return docFolder.includes('Акт') || docFolder.toLowerCase().includes('act') || fileName.includes('акт') || fileName.includes('act');
    if (selectedFolder === 'reports') return docFolder.includes('Отчет') || docFolder.toLowerCase().includes('report') || fileName.includes('отчет') || fileName.includes('report');
    if (selectedFolder === 'contracts') return docFolder.includes('Договор') || docFolder.toLowerCase().includes('contract') || fileName.includes('договор') || fileName.includes('contract');
    return docFolder === 'Разное' || docFolder.toLowerCase().includes('other');
  });

  const totalCount = documents.length;
  const pendingCount = documents.filter(d => d.status !== 'CONFIRMED').length;
  const confirmedCount = documents.filter(d => d.status === 'CONFIRMED').length;

  return (
    <div className="w-full max-w-[1400px] px-4 md:px-8 mx-auto space-y-6 pb-16 pt-4">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200/80 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">{t('documents.title', { defaultValue: 'Документы' })}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('documents.subtitle', { defaultValue: 'Управление вашими документами, актами и договорами' })}</p>
        </div>

        {selectedIds.size > 0 && (
          <button
            onClick={handleBulkZipDownload}
            disabled={isDownloadingZip}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-xs transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 active:scale-98"
          >
            <FileArchive size={16} />
            <span>{isDownloadingZip ? t('documents.formingZip', { defaultValue: 'Формируем ZIP...' }) : t('documents.downloadSelectedZip', { defaultValue: `Скачать выбранные (${selectedIds.size}) в ZIP`, count: selectedIds.size })}</span>
          </button>
        )}
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200/70 rounded-2xl p-5 shadow-2xs hover:shadow-sm transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Layers size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Всего документов</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200/70 rounded-2xl p-5 shadow-2xs hover:shadow-sm transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ожидают подписи</p>
            <p className="text-2xl font-black text-amber-600 mt-0.5">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200/70 rounded-2xl p-5 shadow-2xs hover:shadow-sm transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <FileCheck size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Подписано</p>
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
          "border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 relative overflow-hidden group",
          isDragging
            ? "border-brand-green bg-emerald-50/60 shadow-md scale-[1.005]"
            : "border-gray-200/80 bg-white hover:border-brand-green/50 hover:bg-gray-50/50 hover:shadow-sm"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          disabled={isUploading}
        />
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-brand-green flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
          {isUploading ? <Spinner className="w-6 h-6 text-brand-green" /> : <Upload size={22} />}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">
            {isUploading ? t('documents.uploading', { defaultValue: 'Загрузка документа...' }) : t('documents.dragOrClick', { defaultValue: 'Перетащите файл или нажмите для загрузки' })}
          </p>
          <p className="text-xs font-medium text-gray-400 mt-1">{t('documents.formats', { defaultValue: 'PDF, DOCX, XLSX, PNG, JPG, MD до 20 МБ' })}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {FOLDERS.map(f => {
          const isSelected = selectedFolder === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setSelectedFolder(f.id)}
              className={clsx(
                "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap border shadow-2xs",
                isSelected
                  ? "bg-brand-green text-white border-brand-green shadow-sm"
                  : "bg-white text-gray-600 border-gray-200/80 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Folder size={14} className={isSelected ? "text-white" : "text-gray-400"} />
              <span>{t(f.key, { defaultValue: f.defaultLabel })}</span>
            </button>
          );
        })}
      </div>

      {/* Main Document Table Card */}
      {isLoading && documents.length === 0 ? (
        <div className="py-20 flex items-center justify-center bg-white border border-gray-200/80 rounded-2xl shadow-2xs">
          <Spinner className="w-10 h-10 text-brand-green" />
        </div>
      ) : (
        <>
          {filteredDocuments.length > 0 && (
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
                      <th className="px-6 py-4">{t('documents.file', { defaultValue: 'Файл' })}</th>
                      <th className="px-6 py-4">{t('documents.fileType', { defaultValue: 'Тип' })}</th>
                      <th className="px-6 py-4">{t('documents.signatureStatus', { defaultValue: 'Статус подписи' })}</th>
                      <th className="px-6 py-4">{t('documents.size', { defaultValue: 'Размер' })}</th>
                      <th className="px-6 py-4 text-right">{t('documents.actions', { defaultValue: 'Действия' })}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {filteredDocuments.map((doc) => {
                      const info = getDocTypeInfo(doc.contentType);
                      const Icon = info.icon;
                      const isSelected = selectedIds.has(doc.id);
                      const isConfirmed = doc.status === 'CONFIRMED';

                      return (
                        <tr key={doc.id} className={clsx("hover:bg-gray-50/70 transition-colors", isSelected && "bg-emerald-50/30")}>
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
                              <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border", info.bg)}>
                                <Icon size={18} />
                              </div>
                              <span className="font-bold text-gray-900 truncate max-w-md block" title={doc.fileName}>
                                {doc.fileName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={clsx("text-xs font-bold px-2.5 py-1 rounded-lg border", info.bg)}>
                              {info.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {isConfirmed ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full font-bold text-xs shadow-2xs">
                                <ShieldCheck size={14} />
                                {t('documents.signed', { defaultValue: 'Подписано' })} {doc.confirmedAt ? new Date(doc.confirmedAt).toLocaleDateString() : ''}
                              </span>
                            ) : (
                              <button
                                onClick={() => handleConfirm(doc.id)}
                                disabled={isConfirmingId === doc.id}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-brand-green hover:bg-brand-green/90 text-white rounded-full font-bold text-xs transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 disabled:opacity-50"
                              >
                                {isConfirmingId === doc.id ? (
                                  <>
                                    <Spinner className="w-3.5 h-3.5 text-white" />
                                    <span>{t('documents.confirming', { defaultValue: 'Подтверждаем...' })}</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 size={14} />
                                    <span>{t('documents.confirm', { defaultValue: 'Подтвердить' })}</span>
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
                                onClick={() => handleDownload(doc)}
                                className="p-2 text-gray-400 hover:text-brand-green hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
                                title={t('documents.downloadFile', { defaultValue: 'Скачать документ' })}
                              >
                                <Download size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(doc.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                                title={t('documents.delete', { defaultValue: 'Удалить' })}
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

          {filteredDocuments.length === 0 && (
            <div className="text-center py-16 text-gray-400 bg-white border border-gray-200/80 rounded-2xl shadow-2xs">
              <FileText size={44} className="mx-auto mb-3 text-gray-300" />
              <p className="text-base font-bold text-gray-800">{t('documents.emptyCategory', { defaultValue: 'Нет документов в этой категории' })}</p>
              <p className="text-xs text-gray-400 mt-1">{t('documents.emptyCategoryDesc', { defaultValue: 'Загрузите новый файл или выберите другую категорию' })}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
