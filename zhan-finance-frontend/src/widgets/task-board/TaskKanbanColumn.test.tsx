import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskKanbanColumn } from './TaskKanbanColumn';
import type { StageDto, TaskDto } from '@/entities/task/model/types';
import { DndContext } from '@dnd-kit/core';

describe('TaskKanbanColumn', () => {
  it('renders stage name and task count correctly', () => {
    const mockStage: StageDto = {
      id: 1,
      name: 'В работе',
      orderIndex: 0,
      type: 'OPEN',
      isDefault: false,
      color: '#ff0000',
      pipelineId: 1,
    };

    const mockTasks: TaskDto[] = [
      {
        id: 101,
        title: 'Task 1',
        amount: 5000,
        currency: 'KZT',
        createdBy: { id: 1, fullName: 'Admin', email: 'a@a.com', role: 'ADMIN' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 102,
        title: 'Task 2',
        amount: 3000,
        currency: 'KZT',
        createdBy: { id: 1, fullName: 'Admin', email: 'a@a.com', role: 'ADMIN' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    render(
      <DndContext>
        <TaskKanbanColumn stage={mockStage} tasks={mockTasks} onTaskClick={vi.fn()} userRole="ADMIN" />
      </DndContext>
    );

    // Should display stage name
    expect(screen.getByText('В работе')).toBeInTheDocument();
    
    // Should display task count (2)
    expect(screen.getByText('2')).toBeInTheDocument();

    // Should display total sum (8000)
    expect(screen.getByText('8 000 тенге')).toBeInTheDocument();

    // Should render the tasks
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
  });
});
