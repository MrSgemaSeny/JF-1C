import { useEffect, useState } from 'react';
import { getClients, getClientStats, ClientStatsDto } from '@/entities/client/api/clientApi';
import type { ClientDto } from '@/entities/client/model/types';
import { useApiData } from '@/shared/hooks/useApiData';
import { Spinner } from '@/shared/ui/Spinner';

export function AdminClientsPage() {
  const { data: clients, isLoading: isClientsLoading, error: clientsError, refetch: refetchClients } = useApiData(getClients);
  const { data: statsData, isLoading: isStatsLoading, error: statsError } = useApiData(getClientStats);

  const [stats, setStats] = useState<Record<number, ClientStatsDto>>({});

  useEffect(() => {
    if (statsData) {
      const statsMap = statsData.reduce((acc, stat) => {
        acc[stat.clientId] = stat;
        return acc;
      }, {} as Record<number, ClientStatsDto>);
      setStats(statsMap);
    }
  }, [statsData]);

  if (isClientsLoading) return <Spinner />;
  if (clientsError) return <div className="p-4 text-red-500">Error loading data</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Clients</h1>
      {statsError && <div className="mb-4 p-2 bg-yellow-50 text-yellow-700 text-sm rounded">Failed to load client statistics. Task counts may be 0.</div>}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients?.map((c) => {
              const clientStat = c.user?.id ? stats[c.user.id] : undefined;
              return (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.user?.fullName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.companyName || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.user?.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {c.assignedEmployee?.fullName || <span className="text-yellow-600 font-medium">Unassigned</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {isStatsLoading ? (
                      <span className="text-gray-400 text-xs">...</span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {clientStat?.taskCount || 0}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
