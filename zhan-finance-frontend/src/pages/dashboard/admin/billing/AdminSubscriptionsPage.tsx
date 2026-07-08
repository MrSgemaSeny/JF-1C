import React, { useState } from 'react';
import { useApiData } from '@/shared/hooks/useApiData';
import { billingApi, SubscriptionDto } from '@/entities/billing/api/billingApi';
import { Section } from '@/shared/ui/Section';
import { Container } from '@/shared/ui/Container';
import { Button } from '@/shared/ui/Button';
import { Spinner } from '@/shared/ui/Spinner';
import { Empty } from '@/shared/ui/Empty';
import { format } from 'date-fns';

export function AdminSubscriptionsPage() {
  const { data: subscriptions, isLoading, error, refetch } = useApiData<SubscriptionDto[]>(billingApi.getSubscriptions);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) {
    return <div className="flex justify-center p-10"><Spinner size="lg" /></div>;
  }

  if (error) {
    return <div className="text-red-500 p-10">Error: {error.message}</div>;
  }

  return (
    <Container className="py-8">
      <Section>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
            <p className="text-gray-500 text-sm">Manage client subscriptions</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>Create Subscription</Button>
        </div>

        {!subscriptions || subscriptions.length === 0 ? (
          <Empty label="No subscriptions found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="p-3 text-sm font-medium text-gray-500">ID</th>
                  <th className="p-3 text-sm font-medium text-gray-500">Plan Name</th>
                  <th className="p-3 text-sm font-medium text-gray-500">Monthly Price</th>
                  <th className="p-3 text-sm font-medium text-gray-500">Status</th>
                  <th className="p-3 text-sm font-medium text-gray-500">Starts At</th>
                  <th className="p-3 text-sm font-medium text-gray-500">Ends At</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 text-sm">#{sub.id}</td>
                    <td className="p-3 text-sm font-medium">{sub.planName}</td>
                    <td className="p-3 text-sm">${sub.monthlyPrice.toFixed(2)}</td>
                    <td className="p-3 text-sm">
                      {sub.status === 'ACTIVE' ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium">ACTIVE</span>
                      ) : sub.status === 'CANCELLED' ? (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-xs font-medium">CANCELLED</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-md text-xs font-medium">{sub.status}</span>
                      )}
                    </td>
                    <td className="p-3 text-sm text-gray-500">
                      {format(new Date(sub.startsAt), 'MMM d, yyyy')}
                    </td>
                    <td className="p-3 text-sm text-gray-500">
                      {sub.endsAt ? format(new Date(sub.endsAt), 'MMM d, yyyy') : '-'}
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
