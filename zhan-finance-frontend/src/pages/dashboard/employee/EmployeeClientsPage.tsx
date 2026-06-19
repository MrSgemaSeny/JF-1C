import { useEffect, useState } from 'react';
import { getClients } from '@/entities/client/api/clientApi';
import type { ClientDto } from '@/entities/client/model/types';

export function EmployeeClientsPage() {
  const [clients, setClients] = useState<ClientDto[]>([]);

  useEffect(() => {
    getClients().then(setClients);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Clients</h1>
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((c) => (
              <tr key={c.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.user?.fullName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.user?.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
