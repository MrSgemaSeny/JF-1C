import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskKanbanCard } from './TaskKanbanCard';
import type { TaskDto } from '@/entities/task/model/types';
import { DndContext } from '@dnd-kit/core';

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({
    user: { userId: 1, email: 'admin@test.com', role: 'ADMIN' },
  }),
}));

describe('TaskKanbanCard', () => {
  const mockTask: TaskDto = {
    id: 1,
    title: 'Настройка учета 1С',
    amount: 150000,
    currency: 'KZT',
    reassignmentRequested: true,
    isSlaBreached: true,
    client: { id: 10, fullName: 'ТОО КазахФинанс', email: 'kazakh@finance.kz' },
    assignedTo: { id: 1, fullName: 'Иван Иванов', email: 'ivan@test.com', role: 'EMPLOYEE' },
    createdBy: { id: 1, fullName: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any;

  it('renders task title and client name correctly', () => {
    render(
      <DndContext>
        <TaskKanbanCard task={mockTask} onClick={() => {}} userRole="ADMIN" />
      </DndContext>
    );

    expect(screen.getByText('Настройка учета 1С')).toBeInTheDocument();
    expect(screen.getByText('ТОО КазахФинанс')).toBeInTheDocument();
  });

  it('displays rejection badge when reassignmentRequested is true', () => {
    render(
      <DndContext>
        <TaskKanbanCard task={mockTask} onClick={() => {}} userRole="ADMIN" />
      </DndContext>
    );

    expect(screen.getByText('Отказ')).toBeInTheDocument();
  });

  it('displays SLA breached badge when isSlaBreached is true', () => {
    render(
      <DndContext>
        <TaskKanbanCard task={mockTask} onClick={() => {}} userRole="ADMIN" />
      </DndContext>
    );

    expect(screen.getByText('SLA просрочен')).toBeInTheDocument();
  });
});
