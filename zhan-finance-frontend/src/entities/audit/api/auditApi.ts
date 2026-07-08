import { apiRequest } from '@/shared/api/http';

export interface AuditLogDto {
  id: number;
  action: string;
  entityName: string;
  entityId: number;
  userId: number | null;
  details: string;
  createdAt: string;
}

export const auditApi = {
  getAuditLogs: () => apiRequest<AuditLogDto[]>('/api/admin/audit-logs'),
};
