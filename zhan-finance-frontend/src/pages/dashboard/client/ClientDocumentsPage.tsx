import { useEffect, useState, useRef } from 'react';
import { getDocuments, uploadDocument, downloadDocument, deleteDocument, confirmDocument, downloadZipDocuments } from '@/entities/document/api/documentApi';
import type { DocumentDto } from '@/entities/document/model/types';
import { useAuth } from '@/features/auth/AuthContext';
import { Spinner } from '@/shared/ui/Spinner';
import { Upload, Download, Trash2, FileText, FileSpreadsheet, File as FileIcon, FileImage, FileArchive, CheckCircle2, ShieldCheck, Folder } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

const FOLDERS = ['Все', 'Акты ВР', 'Отчеты', 'Договоры', 'Разное'];

export function ClientDocumentsPage() {
  const { user } = useAuth();
  const { t } = useTranslation(['common', 'tasks']);
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedFolder, setSelectedFolder] = useState<string>('Все');
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
      alert('Failed to download document');
    }
  };

  const handleConfirm = async (docId: number) => {
    setIsConfirmingId(docId);
    try {
      await confirmDocument(docId);
      await fetchDocuments();
    } catch (err) {
      console.error('Failed to confirm document', err);
      alert(t('documents.confirmError', { defaultValue: 'Ошибка подписи документа' }));
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
      alert(t('documents.zipError', { defaultValue: 'Ошибка скачивания ZIP архива' }));
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('documents.confirmDelete'))) return;
    try {
      await deleteDocument(id);
      await fetchDocuments();
    } catch (err) {
      console.error('Failed to delete', err);
      alert('Failed to delete document');
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
    if (tLower.includes('pdf')) return { label: 'PDF', icon: FileText, color: 'text-red-600' };
    if (tLower.includes('spreadsheet') || tLower.includes('excel') || tLower.includes('csv')) return { label: 'EXCEL', icon: FileSpreadsheet, color: 'text-green-600' };
    if (tLower.includes('wordprocessing') || tLower.includes('word')) return { label: 'WORD', icon: FileText, color: 'text-blue-600' };
    if (tLower.includes('image')) return { label: 'IMG', icon: FileImage, color: 'text-amber-600' };
    if (tLower.includes('zip') || tLower.includes('compressed')) return { label: 'ZIP', icon: FileArchive, color: 'text-purple-600' };
    return { label: type.split('/').pop()?.toUpperCase() || 'FILE', icon: FileIcon, color: 'text-gray-500' };
  };

  const filteredDocuments = documents.filter(doc => {
    if (selectedFolder === 'Все') return true;
    const docFolder = doc.folder || 'Разное';
    if (selectedFolder === 'Акты ВР') return docFolder.includes('Акт') || doc.fileName.toLowerCase().includes('акт');
    if (selectedFolder === 'Отчеты') return docFolder.includes('Отчет') || doc.fileName.toLowerCase().includes('отчет');
    if (selectedFolder === 'Договоры') return docFolder.includes('Договор') || doc.fileName.toLowerCase().includes('договор');
    return docFolder === 'Разное';
  });

  return (
    <div className="h-full w-full flex flex-col max-w-[1440px] px-4 md:px-8 mx-auto space-y-6 pb-12 pt-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('documents.title')}</h1>
          <p className="text-gray-500 text-base mt-1">{t('documents.subtitle')}</p>
        </div>

        {selectedIds.size > 0 && (
          <button
            onClick={handleBulkZipDownload}
            disabled={isDownloadingZip}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold text-xs transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            <FileArchive size={16} />
            <span>{isDownloadingZip ? t('documents.formingZip', { defaultValue: 'Формируем ZIP...' }) : t('documents.downloadSelectedZip', { defaultValue: `Скачать выбранные (${selectedIds.size}) в ZIP`, count: selectedIds.size })}</span>
          </button>
        )}
      </div>

      {/* Folders Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {FOLDERS.map(f => (
          <button
            key={f}
            onClick={() => setSelectedFolder(f)}
            className={clsx(
              "px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap border",
              selectedFolder === f
                ? "bg-brand-green text-white border-brand-green shadow-xs"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            )}
          >
            <Folder size={14} className={selectedFolder === f ? "text-white" : "text-gray-400"} />
            {f}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm shrink-0">
          {error}
        </div>
      )}

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={clsx(
          "border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2",
          isDragging ? "border-brand-green bg-green-50/50" : "border-gray-200 bg-white hover:bg-gray-50/50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          disabled={isUploading}
        />
        <div className="p-3 bg-brand-green/10 text-brand-green rounded-full">
          <Upload size={20} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {isUploading ? t('documents.uploading', { defaultValue: 'Загрузка документа...' }) : t('documents.dragOrClick', { defaultValue: 'Перетащите файл или нажмите для загрузки' })}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{t('documents.formats', { defaultValue: 'PDF, DOCX, XLSX, PNG, JPG до 20 МБ' })}</p>
        </div>
      </div>

      {isLoading && documents.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <Spinner className="w-10 h-10 text-brand-green" />
        </div>
      ) : (
        <>
          {filteredDocuments.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex-1 shadow-sm flex flex-col min-h-0">
              <div className="overflow-x-auto w-full flex-1">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === filteredDocuments.length && filteredDocuments.length > 0}
                          onChange={() => toggleSelectAll(filteredDocuments)}
                          className="rounded border-gray-300 text-brand-green focus:ring-brand-green cursor-pointer"
                        />
                      </th>
                      <th className="px-6 py-4 font-semibold text-gray-600">{t('documents.file', { defaultValue: 'Файл' })}</th>
                      <th className="px-6 py-4 font-semibold text-gray-600">{t('documents.fileType', { defaultValue: 'Тип' })}</th>
                      <th className="px-6 py-4 font-semibold text-gray-600">{t('documents.signatureStatus', { defaultValue: 'Статус подписи' })}</th>
                      <th className="px-6 py-4 font-semibold text-gray-600">{t('documents.size', { defaultValue: 'Размер' })}</th>
                      <th className="px-6 py-4 font-semibold text-gray-600 text-right">{t('documents.actions', { defaultValue: 'Действия' })}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredDocuments.map((doc) => {
                      const info = getDocTypeInfo(doc.contentType);
                      const Icon = info.icon;
                      const isSelected = selectedIds.has(doc.id);
                      const isConfirmed = doc.status === 'CONFIRMED';

                      return (
                        <tr key={doc.id} className={clsx("hover:bg-gray-50 transition-colors", isSelected && "bg-blue-50/40")}>
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
                              <Icon className={clsx("w-6 h-6", info.color)} />
                              <span className="font-medium text-gray-900 truncate max-w-md block" title={doc.fileName}>
                                {doc.fileName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded">
                              {info.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {isConfirmed ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full font-semibold text-xs">
                                <ShieldCheck size={14} />
                                {t('documents.signed', { defaultValue: 'Подписано' })} {doc.confirmedAt ? new Date(doc.confirmedAt).toLocaleDateString() : ''}
                              </span>
                            ) : (
                              <button
                                onClick={() => handleConfirm(doc.id)}
                                disabled={isConfirmingId === doc.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-green hover:bg-brand-green/90 text-white rounded-full font-semibold text-xs transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                              >
                                <CheckCircle2 size={14} />
                                {isConfirmingId === doc.id ? t('documents.confirming', { defaultValue: 'Подтверждаем...' }) : t('documents.confirm', { defaultValue: 'Подтвердить' })}
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-sm">
                            {formatFileSize(doc.fileSize)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleDownload(doc)}
                                className="p-2 text-gray-500 hover:text-brand-green hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                                title={t('documents.downloadFile', { defaultValue: 'Скачать документ' })}
                              >
                                <Download size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(doc.id)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
            <div className="text-center py-12 text-gray-400 bg-white border border-gray-200 rounded-2xl">
              <FileText size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-base font-semibold text-gray-700">{t('documents.emptyCategory', { defaultValue: 'Нет документов в этой категории' })}</p>
              <p className="text-xs text-gray-400 mt-1">{t('documents.emptyCategoryDesc', { defaultValue: 'Загрузите новый файл или выберите другую категорию' })}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
