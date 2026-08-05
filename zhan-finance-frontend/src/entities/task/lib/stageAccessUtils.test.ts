import { describe, it, expect } from 'vitest';
import { canMoveTaskFromStage, canMoveTaskToStage } from './stageAccessUtils';
import type { StageDto } from '../model/types';

describe('stageAccessUtils', () => {
  const wonStage: StageDto = { id: 1, pipelineId: 1, name: 'Won', type: 'WON', orderIndex: 1, isDefault: false };
  const lostStage: StageDto = { id: 2, pipelineId: 1, name: 'Lost', type: 'LOST', orderIndex: 2, isDefault: false };
  const openStage: StageDto = { id: 3, pipelineId: 1, name: 'Open', type: 'OPEN', orderIndex: 3, isDefault: true };

  const allRoles = ['ADMIN', 'EMPLOYEE', 'CLIENT', 'LEARNER', 'CURATOR', 'ADVISOR'];
  const nonAdmins = ['EMPLOYEE', 'CLIENT', 'LEARNER', 'CURATOR', 'ADVISOR'];
  const nonEmployees = ['ADMIN', 'CLIENT', 'LEARNER', 'CURATOR', 'ADVISOR'];

  describe('canMoveTaskFromStage', () => {
    it('returns true if initialStage is null or undefined for all roles', () => {
      allRoles.forEach(role => {
        expect(canMoveTaskFromStage(role, null)).toBe(true);
        expect(canMoveTaskFromStage(role, undefined)).toBe(true);
      });
    });

    it('returns false for non-ADMIN if initialStage is WON or LOST', () => {
      nonAdmins.forEach(role => {
        expect(canMoveTaskFromStage(role, wonStage)).toBe(false);
        expect(canMoveTaskFromStage(role, lostStage)).toBe(false);
      });
    });

    it('returns true for ADMIN even if initialStage is WON or LOST', () => {
      expect(canMoveTaskFromStage('ADMIN', wonStage)).toBe(true);
      expect(canMoveTaskFromStage('ADMIN', lostStage)).toBe(true);
    });

    it('returns true for any role if initialStage is OPEN', () => {
      allRoles.forEach(role => {
        expect(canMoveTaskFromStage(role, openStage)).toBe(true);
      });
    });
  });

  describe('canMoveTaskToStage', () => {
    it('returns true if targetStage is null or undefined for all roles', () => {
      allRoles.forEach(role => {
        expect(canMoveTaskToStage(role, null)).toBe(true);
        expect(canMoveTaskToStage(role, undefined)).toBe(true);
      });
    });

    it('returns false for EMPLOYEE if targetStage is WON or LOST', () => {
      expect(canMoveTaskToStage('EMPLOYEE', wonStage)).toBe(false);
      expect(canMoveTaskToStage('EMPLOYEE', lostStage)).toBe(false);
    });

    it('returns true for non-EMPLOYEE if targetStage is WON or LOST', () => {
      nonEmployees.forEach(role => {
        expect(canMoveTaskToStage(role, wonStage)).toBe(true);
        expect(canMoveTaskToStage(role, lostStage)).toBe(true);
      });
    });

    it('returns true for any role if targetStage is OPEN', () => {
      allRoles.forEach(role => {
        expect(canMoveTaskToStage(role, openStage)).toBe(true);
      });
    });
  });
});