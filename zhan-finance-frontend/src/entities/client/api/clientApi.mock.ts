import type { ClientDto } from '../model/types';

const STORAGE_KEY = 'mock_crm_clients';

function loadClients(): ClientDto[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) return JSON.parse(data);
  const defaultClients: ClientDto[] = [
    {
      id: 1,
      user: { id: 3, fullName: 'Client One', email: 'client@test.com', role: 'CLIENT' },
      companyName: 'Test Corp',
      phone: '+1234567890',
    },
  ];
  saveClients(defaultClients);
  return defaultClients;
}

function saveClients(clients: ClientDto[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
}

export async function getClients(): Promise<ClientDto[]> {
  return loadClients();
}

export async function getClient(id: number): Promise<ClientDto> {
  const client = loadClients().find(c => c.id === id);
  if (!client) throw new Error('Client not found');
  return client;
}

export async function assignEmployee(id: number, employeeId: number): Promise<void> {
  // In mock, we don't fully simulate the user entity relationship for simplicity
  console.log(`Assigned employee ${employeeId} to client profile ${id}`);
}
