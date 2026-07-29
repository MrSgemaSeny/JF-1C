import type { StageDto } from '../model/types';

export function canMoveTaskFromStage(userRole: string, initialStage: StageDto | undefined | null): boolean {
  if (!initialStage) return true;
  if (userRole !== 'ADMIN' && (initialStage.type === 'WON' || initialStage.type === 'LOST')) {
    return false;
  }
  return true;
}

export function canMoveTaskToStage(userRole: string, targetStage: StageDto | undefined | null): boolean {
  if (!targetStage) return true;
  if (userRole === 'EMPLOYEE' && (targetStage.type === 'WON' || targetStage.type === 'LOST')) {
    return false;
  }
  return true;
}
