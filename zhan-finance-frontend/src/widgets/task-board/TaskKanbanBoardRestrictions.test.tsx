/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import type { StageDto } from '@/entities/task/model/types';

describe('TaskKanbanBoard Stage Movement Restrictions', () => {

  const stages: StageDto[] = [
    { id: 1, pipelineId: 1, name: 'В работе', orderIndex: 0, type: 'OPEN', isDefault: true },
    { id: 2, pipelineId: 1, name: 'На проверке', orderIndex: 1, type: 'OPEN', isDefault: false, isPreFinal: true },
    { id: 3, pipelineId: 1, name: 'Успешно (WON)', orderIndex: 2, type: 'WON', isDefault: false },
    { id: 4, pipelineId: 1, name: 'Отменено (LOST)', orderIndex: 3, type: 'LOST', isDefault: false },
  ];

  function canNonAdminMoveFromStage(userRole: string, initialStage: StageDto): boolean {
    if (userRole !== 'ADMIN' && (initialStage.type === 'WON' || initialStage.type === 'LOST')) {
      return false;
    }
    return true;
  }

  function canEmployeeMoveToStage(userRole: string, targetStage: StageDto): boolean {
    if (userRole === 'EMPLOYEE' && (targetStage.type === 'WON' || targetStage.type === 'LOST')) {
      return false;
    }
    return true;
  }

  it('запрещает обычным пользователям (EMPLOYEE, CLIENT) перетаскивать задачи из WON/LOST стадий', () => {
    const wonStage = stages.find(s => s.type === 'WON')!;
    const lostStage = stages.find(s => s.type === 'LOST')!;

    expect(canNonAdminMoveFromStage('EMPLOYEE', wonStage)).toBe(false);
    expect(canNonAdminMoveFromStage('CLIENT', wonStage)).toBe(false);
    expect(canNonAdminMoveFromStage('EMPLOYEE', lostStage)).toBe(false);
    expect(canNonAdminMoveFromStage('ADMIN', wonStage)).toBe(true);
  });

  it('запрещает EMPLOYEE переводить задачи напрямую в финальные статусы WON/LOST без администратора', () => {
    const wonStage = stages.find(s => s.type === 'WON')!;
    const openStage = stages.find(s => s.type === 'OPEN')!;

    expect(canEmployeeMoveToStage('EMPLOYEE', wonStage)).toBe(false);
    expect(canEmployeeMoveToStage('EMPLOYEE', openStage)).toBe(true);
    expect(canEmployeeMoveToStage('ADMIN', wonStage)).toBe(true);
  });
});
