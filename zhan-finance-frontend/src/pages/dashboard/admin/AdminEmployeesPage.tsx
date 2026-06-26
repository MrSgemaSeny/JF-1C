import { useEffect, useState } from 'react';
import { getEmployees, getPendingEmployees, approveEmployee } from '@/entities/employee/api/employeeApi';
import type { EmployeeDto } from '@/entities/employee/model/types';
import { Check, Clock, UserCheck } from 'lucide-react';

export function AdminEmployeesPage() {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'PENDING'>('ACTIVE');
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [pendingEmployees, setPendingEmployees] = useState<EmployeeDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function loadData() {
    setIsLoading(true);
    try {
      const [empList, pendingList] = await Promise.all([
        getEmployees(),
        getPendingEmployees()
      ]);
      setEmployees(empList);
      setPendingEmployees(pendingList);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleApprove(id: number) {
    if (!window.confirm('Одобрить этого сотрудника? Он получит доступ в систему.')) return;
    try {
      await approveEmployee(id);
      await loadData();
    } catch (e) {
      console.error(e);
      alert('Ошибка при одобрении сотрудника');
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase text-brand-green tracking-tight">Сотрудники</h1>
          <p className="text-gray-500 mt-1">Управление доступом персонала</p>
        </div>
      </div>

      <div className="flex space-x-1 p-1 bg-gray-100/80 rounded-xl mb-6 w-max">
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
            activeTab === 'ACTIVE'
              ? 'bg-white text-brand-green shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Активные ({employees.length})
        </button>
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
            activeTab === 'PENDING'
              ? 'bg-white text-brand-green shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          Заявки
          {pendingEmployees.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-1">
              {pendingEmployees.length}
            </span>
          )}
        </button>
      </div>

      <div className="bg-white shadow-sm border border-gray-200/60 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">Загрузка...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Сотрудник
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Дата регистрации
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(activeTab === 'ACTIVE' ? employees : pendingEmployees).map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{emp.fullName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{emp.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(emp.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {activeTab === 'PENDING' ? (
                        <button
                          onClick={() => handleApprove(emp.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-green/10 text-brand-green hover:bg-brand-green/20 rounded-lg text-sm font-bold transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          Одобрить
                        </button>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          Активен
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                
                {(activeTab === 'ACTIVE' && employees.length === 0) || (activeTab === 'PENDING' && pendingEmployees.length === 0) ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-sm">
                      {activeTab === 'ACTIVE' ? 'Нет активных сотрудников' : 'Нет новых заявок'}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
