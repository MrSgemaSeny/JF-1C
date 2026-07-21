import { useEffect, useState, useRef } from 'react';
import { getDocuments, uploadDocument, downloadDocument, deleteDocument } from '@/entities/document/api/documentApi';
import type { DocumentDto } from '@/entities/document/model/types';
import { useAuth } from '@/features/auth/AuthContext';
import { Spinner } from '@/shared/ui/Spinner';
import { Upload, Download, Trash2, FileText, FileSpreadsheet, File as FileIcon, FileImage, FileArchive } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

export function ClientDocumentsPage() {
  const { user } = useAuth();
  const { t } = useTranslation(['common']);
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  return (
    <div className="h-full w-full flex flex-col max-w-[1440px] px-4 md:px-8 mx-auto space-y-8 pb-12 pt-6">
      
      {/* Header aligned to the left */}
      <div className="flex flex-col items-start border-b border-gray-200 pb-6 shrink-0">
        <h1 className="text-3xl font-bold text-gray-900">{t('documents.title')}</h1>
        <p className="text-gray-500 text-base mt-2">{t('documents.subtitle')}</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm shrink-0">
          {error}
        </div>
      )}

      {isLoading && documents.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <Spinner className="w-10 h-10 text-brand-green" />
        </div>
      ) : (
        <>
          {documents.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex-1 shadow-sm flex flex-col min-h-0">
              <div className="overflow-auto flex-1">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-gray-600">Файл</th>
                      <th className="px-6 py-4 font-semibold text-gray-600">{t('documents.fileType', { defaultValue: 'Тип' })}</th>
                      <th className="px-6 py-4 font-semibold text-gray-600">Размер</th>
                      <th className="px-6 py-4 font-semibold text-gray-600">Дата</th>
                      <th className="px-6 py-4 font-semibold text-gray-600 text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {documents.map((doc) => {
                      const info = getDocTypeInfo(doc.contentType);
                      const Icon = info.icon;
                      return (
                        <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
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
                          <td className="px-6 py-4 text-gray-500 text-sm">
                            {formatFileSize(doc.fileSize)}
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-sm">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => handleDownload(doc)}
                                className="p-2 text-gray-500 hover:text-brand-green hover:bg-green-50 rounded-lg transition-colors"
                                title={t('documents.downloadTitle')}
                              >
                                <Download size={20} />
                              </button>
                              <button
                                onClick={() => handleDelete(doc.id)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title={t('documents.deleteTitle')}
                              >
                                <Trash2 size={20} />
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

          {/* Practical Upload Zone */}
          <div 
            className={clsx(
              "border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center cursor-pointer bg-white transition-colors shrink-0",
              documents.length === 0 ? "flex-1 mt-0" : "p-10 mt-8",
              isDragging ? "border-brand-green bg-green-50" : "border-gray-300 hover:bg-gray-50"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.xlsx,.xml,.csv,.docx,.doc,.png,.jpg,.jpeg,.zip"
            />
            
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Spinner className="w-10 h-10 text-brand-green mb-4" />
                <p className="text-base font-medium text-gray-700">{t('documents.uploading')}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {documents.length === 0 ? (
                  <>
                    <Upload className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-xl font-medium text-gray-900 mb-2">{t('documents.emptyTitle')}</p>
                    <p className="text-sm text-gray-500 mb-6">{t('documents.emptySubtitle')}</p>
                    <div className="px-6 py-3 bg-brand-green text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors">
                      {t('documents.uploadTitle')}
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">{t('documents.uploadTitle')}</p>
                    <p className="text-sm text-gray-500">{t('documents.uploadSubtitle')}</p>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}
