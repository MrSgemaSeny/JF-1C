import React from 'react';
import { useApiData } from '@/shared/hooks/useApiData';
import { auditApi, AuditLogDto } from '@/entities/audit/api/auditApi';
import { Section } from '@/shared/ui/Section';
import { Container } from '@/shared/ui/Container';
import { Spinner } from '@/shared/ui/Spinner';
import { Empty } from '@/shared/ui/Empty';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

export function AdminAuditLogPage() {
  const { t } = useTranslation(['common']);
  const { data: logs, isLoading, error } = useApiData<AuditLogDto[]>(auditApi.getAuditLogs);

  if (isLoading) {
    return <div className="flex justify-center p-10"><Spinner size="lg" /></div>;
  }

  if (error) {
    return <div className="text-red-500 p-10">Error: {error.message}</div>;
  }

  return (
    <Container className="py-8">
      <Section>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('adminAuditLog.title')}</h1>
          <p className="text-gray-500 text-sm">{t('adminAuditLog.subtitle')}</p>
        </div>

        {!logs || logs.length === 0 ? (
          <Empty label={t('adminAuditLog.noLogs')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="p-3 text-sm font-medium text-gray-500">ID</th>
                  <th className="p-3 text-sm font-medium text-gray-500">{t('adminAuditLog.action')}</th>
                  <th className="p-3 text-sm font-medium text-gray-500">{t('adminAuditLog.entity')}</th>
                  <th className="p-3 text-sm font-medium text-gray-500">{t('adminAuditLog.entityId')}</th>
                  <th className="p-3 text-sm font-medium text-gray-500">{t('adminAuditLog.userId')}</th>
                  <th className="p-3 text-sm font-medium text-gray-500">{t('adminAuditLog.time')}</th>
                  <th className="p-3 text-sm font-medium text-gray-500">{t('adminAuditLog.details')}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 text-sm">#{log.id}</td>
                    <td className="p-3 text-sm font-medium">{log.action}</td>
                    <td className="p-3 text-sm text-gray-500">{log.entityName}</td>
                    <td className="p-3 text-sm text-gray-500">{log.entityId}</td>
                    <td className="p-3 text-sm text-gray-500">{log.userId ?? 'System'}</td>
                    <td className="p-3 text-sm text-gray-500">
                      {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss')}
                    </td>
                    <td className="p-3 text-sm text-gray-500 max-w-xs truncate" title={log.details}>
                      {log.details || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </Container>
  );
}
