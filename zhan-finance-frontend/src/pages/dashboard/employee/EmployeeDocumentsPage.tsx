import { useEffect, useState, useRef } from 'react';
import { getAllDocuments, uploadDocument, downloadDocument, deleteDocument } from '@/entities/document/api/documentApi';
import { getClients } from '@/entities/client/api/clientApi';
import type { DocumentDto } from '@/entities/document/model/types';
import type { ClientDto } from '@/entities/client/model/types';
import { Spinner } from '@/shared/ui/Spinner';
import { Upload, Download, Trash2, FileText, FileSpreadsheet, File as FileIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

export function EmployeeDocumentsPage() {
  const { t } = useTranslation(['common']);
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [docsData, clientsData] = await Promise.all([
        getAllDocuments(),
        getClients()
      ]);
      setDocuments(docsData);
      setClients(clientsData);
    } catch (err) {
      setError(t('employeeDocuments.loadError'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const processFileUpload = async (file: File) => {
    if (!selectedClientId) {
      setError(t('employeeDocuments.selectClientError'));
      return;
    }
    
    setIsUploading(true);
    setError(null);
    try {
      await uploadDocument(file, Number(selectedClientId));
      
      const docsData = await getAllDocuments();
      setDocuments(docsData);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(t('employeeDocuments.uploadError'));
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
    if (!selectedClientId) return;
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
      alert(t('employeeDocuments.downloadError'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('employeeDocuments.deleteConfirm'))) return;
    try {
      await deleteDocument(id);
      const docsData = await getAllDocuments();
      setDocuments(docsData);
    } catch (err) {
      console.error('Failed to delete', err);
      alert(t('employeeDocuments.deleteError'));
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
    if (type.includes('pdf')) return { label: 'PDF', color: 'bg-red-100 text-red-700', icon: FileText };
    if (type.includes('spreadsheet') || type.includes('excel')) return { label: 'EXCEL', color: 'bg-emerald-100 text-emerald-700', icon: FileSpreadsheet };
    if (type.includes('wordprocessing') || type.includes('word')) return { label: 'WORD', color: 'bg-blue-100 text-blue-700', icon: FileText };
    if (type.includes('csv')) return { label: 'CSV', color: 'bg-emerald-100 text-emerald-700', icon: FileSpreadsheet };
    if (type.includes('xml')) return { label: 'XML', color: 'bg-orange-100 text-orange-700', icon: FileIcon };
    return { label: type.split('/').pop()?.toUpperCase() || 'FILE', color: 'bg-gray-100 text-gray-700', icon: FileIcon };
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('employeeDocuments.title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('employeeDocuments.subtitle')}</p>
      </div>

      {/* Upload Zone */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('employeeDocuments.uploadLabel')}</label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-brand-green focus:ring-brand-green sm:text-sm py-2.5 px-3 border"
          >
            <option value="">{t('employeeDocuments.selectClientOption')}</option>
            {clients.map(client => (
              <option key={client.id} value={client.user.id}>
                {client.user.fullName} ({client.user.email})
              </option>
            ))}
          </select>
        </div>

        <div 
          className={clsx(
            "relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all group",
            !selectedClientId ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-200" : "cursor-pointer",
            isDragging && selectedClientId ? "border-brand-green bg-green-50/50" : "",
            selectedClientId && !isDragging ? "border-gray-200 bg-white hover:border-brand-green/50 hover:bg-gray-50" : ""
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (selectedClientId) fileInputRef.current?.click();
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.xlsx,.xml,.csv,.docx"
            disabled={!selectedClientId || isUploading}
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Spinner size="lg" />
              <p className="mt-4 text-sm font-medium text-gray-900">{t('employeeDocuments.uploading')}</p>
            </div>
          ) : (
            <>
              <div className={clsx(
                "w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-colors",
                isDragging ? "bg-brand-green text-white" : "bg-gray-100 text-gray-500",
                selectedClientId && "group-hover:bg-brand-green/10 group-hover:text-brand-green"
              )}>
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {!selectedClientId ? t('employeeDocuments.selectClientFirst') : isDragging ? t('employeeDocuments.dropHere') : t('employeeDocuments.clickOrDrag')}
              </h3>
              <p className="text-gray-500 text-xs max-w-sm">
                {t('employeeDocuments.supports')}
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50/80 border border-red-100 rounded-xl flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <p className="text-red-800 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Documents Table */}
      <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Spinner />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-gray-900 font-medium mb-1">{t('employeeDocuments.noDocs')}</h3>
            <p className="text-gray-500 text-sm">{t('employeeDocuments.noDocsSubtext')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('employeeDocuments.docName')}</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('employeeDocuments.docClient')}</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('employeeDocuments.docType')}</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('employeeDocuments.docSize')}</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('employeeDocuments.docDate')}</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">{t('employeeDocuments.docActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {documents.map((doc) => {
                  const typeInfo = getDocTypeInfo(doc.contentType);
                  const Icon = typeInfo.icon;
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={clsx("p-2 rounded-lg", typeInfo.color.replace('text-', 'bg-opacity-20 text-').split(' ')[0])}>
                             <Icon className={clsx("w-4 h-4", typeInfo.color.split(' ')[1])} />
                          </div>
                          <span className="font-medium text-gray-900 truncate max-w-[200px] sm:max-w-[250px]">
                            {doc.fileName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-gray-900 font-medium">{doc.clientName || t('employeeDocuments.unknownClient')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={clsx("px-2.5 py-1 rounded-md text-xs font-semibold", typeInfo.color)}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">
                        {formatFileSize(doc.fileSize)}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(doc.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                          <button
                            onClick={() => handleDownload(doc)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
