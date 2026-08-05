import { describe, it, expect } from 'vitest';
import { canMoveTaskFromStage, canMoveTaskToStage } from './stageAccessUtils';
import type { StageDto } from '../model/types';

describe('stageAccessUtils', () => {
  const wonStage = { id: 1, name: 'Won', type: 'WON', position: 1, isDeletable: false } as StageDto;
  const lostStage = { id: 2, name: 'Lost', type: 'LOST', position: 2, isDeletable: false } as StageDto;
  const openStage = { id: 3, name: 'Open', type: 'OPEN', position: 3, isDeletable: true } as StageDto;

  describe('canMoveTaskFromStage', () => {
    it('returns true if initialStage is null or undefined', () => {
      expect(canMoveTaskFromStage('EMPLOYEE', null)).toBe(true);
      expect(canMoveTaskFromStage('EMPLOYEE', undefined)).toBe(true);
    });

    it('returns false for non-ADMIN if initialStage is WON', () => {
      expect(canMoveTaskFromStage('EMPLOYEE', wonStage)).toBe(false);
      expect(canMoveTaskFromStage('CLIENT', wonStage)).toBe(false);
    });

    it('returns false for non-ADMIN if initialStage is LOST', () => {
      expect(canMoveTaskFromStage('EMPLOYEE', lostStage)).toBe(false);
      expect(canMoveTaskFromStage('CLIENT', lostStage)).toBe(false);
    });

    it('returns true for ADMIN even if initialStage is WON or LOST', () => {
      expect(canMoveTaskFromStage('ADMIN', wonStage)).toBe(true);
      expect(canMoveTaskFromStage('ADMIN', lostStage)).toBe(true);
    });

    it('returns true for any role if initialStage is OPEN', () => {
      expect(canMoveTaskFromStage('EMPLOYEE', openStage)).toBe(true);
      expect(canMoveTaskFromStage('ADMIN', openStage)).toBe(true);
      expect(canMoveTaskFromStage('CLIENT', openStage)).toBe(true);
    });
  });

  describe('canMoveTaskToStage', () => {
    it('returns true if targetStage is null or undefined', () => {
      expect(canMoveTaskToStage('EMPLOYEE', null)).toBe(true);
      expect(canMoveTaskToStage('EMPLOYEE', undefined)).toBe(true);
    });

    it('returns false for EMPLOYEE if targetStage is WON or LOST', () => {
      expect(canMoveTaskToStage('EMPLOYEE', wonStage)).toBe(false);
      expect(canMoveTaskToStage('EMPLOYEE', lostStage)).toBe(false);
    });

    it('returns true for ADMIN if targetStage is WON or LOST', () => {
      expect(canMoveTaskToStage('ADMIN', wonStage)).toBe(true);
      expect(canMoveTaskToStage('ADMIN', lostStage)).toBe(true);
    });

    it('returns true for CLIENT if targetStage is WON or LOST', () => {
      expect(canMoveTaskToStage('CLIENT', wonStage)).toBe(true);
      expect(canMoveTaskToStage('CLIENT', lostStage)).toBe(true);
    });

    it('returns true for any role if targetStage is OPEN', () => {
      expect(canMoveTaskToStage('EMPLOYEE', openStage)).toBe(true);
      expect(canMoveTaskToStage('ADMIN', openStage)).toBe(true);
      expect(canMoveTaskToStage('CLIENT', openStage)).toBe(true);
    });
  });
});
