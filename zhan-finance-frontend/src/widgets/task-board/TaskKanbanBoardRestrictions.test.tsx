import { describe, it, expect } from 'vitest';
import type { StageDto } from '@/entities/task/model/types';
import { canMoveTaskFromStage, canMoveTaskToStage } from '@/entities/task/lib/stageAccessUtils';

describe('TaskKanbanBoard Stage Movement Restrictions', () => {

  const stages: StageDto[] = [
    { id: 1, pipelineId: 1, name: 'В работе', orderIndex: 0, type: 'OPEN', isDefault: true },
    { id: 2, pipelineId: 1, name: 'На проверке', orderIndex: 1, type: 'OPEN', isDefault: false, isPreFinal: true },
    { id: 3, pipelineId: 1, name: 'Успешно (WON)', orderIndex: 2, type: 'WON', isDefault: false },
    { id: 4, pipelineId: 1, name: 'Отменено (LOST)', orderIndex: 3, type: 'LOST', isDefault: false },
  ];

  it('запрещает обычным пользователям (EMPLOYEE, CLIENT) перетаскивать задачи из WON/LOST стадий', () => {
    const wonStage = stages.find(s => s.type === 'WON')!;
    const lostStage = stages.find(s => s.type === 'LOST')!;

    expect(canMoveTaskFromStage('EMPLOYEE', wonStage)).toBe(false);
    expect(canMoveTaskFromStage('CLIENT', wonStage)).toBe(false);
    expect(canMoveTaskFromStage('EMPLOYEE', lostStage)).toBe(false);
    expect(canMoveTaskFromStage('ADMIN', wonStage)).toBe(true);
  });

  it('запрещает EMPLOYEE переводить задачи напрямую в финальные статусы WON/LOST без администратора', () => {
    const wonStage = stages.find(s => s.type === 'WON')!;
    const openStage = stages.find(s => s.type === 'OPEN')!;

    expect(canMoveTaskToStage('EMPLOYEE', wonStage)).toBe(false);
    expect(canMoveTaskToStage('EMPLOYEE', openStage)).toBe(true);
    expect(canMoveTaskToStage('ADMIN', wonStage)).toBe(true);
  });
});
