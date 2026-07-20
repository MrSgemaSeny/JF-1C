import { apiRequest, apiDownload } from '@/shared/api/http';
import { DocumentTemplate } from '../model/types';

export const documentTemplateApi = {
  getAllTemplates: async (): Promise<DocumentTemplate[]> => {
    return apiRequest<DocumentTemplate[]>('/api/document-templates');
  },

  uploadTemplate: async (name: string, description: string, file: File): Promise<DocumentTemplate> => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('file', file);

    return apiRequest<DocumentTemplate>('/api/document-templates', {
      method: 'POST',
      body: formData,
    });
  },

  deleteTemplate: async (id: string): Promise<void> => {
    await apiRequest(`/api/document-templates/${id}`, { method: 'DELETE' });
  },

  downloadTemplate: async (id: string, fileName: string): Promise<void> => {
    const blob = await apiDownload(`/api/document-templates/${id}/download`);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  generateDocument: async (taskId: number, templateId: string): Promise<any> => {
    return apiRequest(`/api/crm/tasks/${taskId}/documents/generate`, {
      method: 'POST',
      body: JSON.stringify({ templateId }),
    });
  },
};
