import { apiRequest, apiDownload } from '@/shared/api/http';
import type { DocumentDto, DocumentUploadResponse } from '../model/types';

export async function uploadDocument(file: File, userId?: number, taskId?: number): Promise<DocumentDto> {
  const formData = new FormData();
  formData.append('file', file);
  if (userId) {
    formData.append('userId', userId.toString());
  }
  if (taskId) {
    formData.append('taskId', taskId.toString());
  }

  return apiRequest<DocumentDto>('/api/v1/documents/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function getTaskDocuments(taskId: number): Promise<DocumentDto[]> {
  return apiRequest<DocumentDto[]>(`/api/v1/documents/task/${taskId}`);
}

export async function updateDocumentStatus(id: number, status: string): Promise<DocumentDto> {
  return apiRequest<DocumentDto>(`/api/v1/documents/${id}/status?status=${status}`, {
    method: 'PATCH',
  });
}

export async function getDocuments(userId?: number): Promise<DocumentDto[]> {
  const query = userId ? `?userId=${userId}` : '';
  return apiRequest<DocumentDto[]>(`/api/v1/documents${query}`);
}

export async function getAllDocuments(): Promise<DocumentDto[]> {
  return apiRequest<DocumentDto[]>('/api/v1/documents/all');
}

export async function deleteDocument(id: number): Promise<void> {
  return apiRequest<void>(`/api/v1/documents/${id}`, {
    method: 'DELETE',
  });
}

export async function downloadDocument(id: number, fileName: string): Promise<void> {
  const blob = await apiDownload(`/api/v1/documents/${id}/download`);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function confirmDocument(id: number): Promise<DocumentDto> {
  return apiRequest<DocumentDto>(`/api/v1/documents/${id}/confirm`, {
    method: 'POST',
  });
}

export async function downloadZipDocuments(ids: number[], zipName = 'documents_archive.zip'): Promise<void> {
  const query = ids.join(',');
  const blob = await apiDownload(`/api/v1/documents/download-zip?ids=${query}`);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
