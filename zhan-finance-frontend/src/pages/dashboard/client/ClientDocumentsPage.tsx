import { useEffect, useState, useRef } from 'react';
import { getDocuments, uploadDocument, downloadDocument, deleteDocument } from '@/entities/document/api/documentApi';
import type { DocumentDto } from '@/entities/document/model/types';
import { useAuth } from '@/features/auth/AuthContext';
import { Spinner } from '@/shared/ui/Spinner';

export function ClientDocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
        setDocuments(data);
      }
    } catch (err) {
      setError('Failed to load documents');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  const handleDownload = async (doc: DocumentDto) => {
    try {
      await downloadDocument(doc.id, doc.fileName);
    } catch (err) {
      console.error('Failed to download', err);
      alert('Failed to download document');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
        <p className="text-gray-600 text-sm mt-1">Upload and manage your documents</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="bg-white p-6 shadow-sm rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900">Documents</h2>
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.xlsx,.xml,.csv,.docx"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2 bg-brand-green hover:bg-green-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </div>

        {isLoading ? (
          <Spinner />
        ) : documents.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No documents found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3">File Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{doc.fileName}</td>
                    <td className="px-4 py-3">{doc.contentType.split('/').pop() || doc.contentType}</td>
                    <td className="px-4 py-3">{formatFileSize(doc.fileSize)}</td>
                    <td className="px-4 py-3">{new Date(doc.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <button
                        onClick={() => handleDownload(doc)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
