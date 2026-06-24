import { apiRequest, API_BASE_URL, getAccessToken } from '@/shared/api/http';
import type { DocumentDto, DocumentUploadResponse } from '../model/types';

export async function uploadDocument(file: File, userId?: number): Promise<DocumentUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (userId) {
    formData.append('userId', userId.toString());
  }

  return apiRequest<DocumentUploadResponse>('/api/documents/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function getDocuments(userId?: number): Promise<DocumentDto[]> {
  const query = userId ? `?userId=${userId}` : '';
  return apiRequest<DocumentDto[]>(`/api/documents${query}`);
}

export async function deleteDocument(id: number): Promise<void> {
  return apiRequest<void>(`/api/documents/${id}`, {
    method: 'DELETE',
  });
}

export async function downloadDocument(id: number, fileName: string): Promise<void> {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}/api/documents/${id}/download`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
