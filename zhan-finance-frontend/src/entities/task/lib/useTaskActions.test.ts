import { describe, it, expect } from 'vitest';
import { useTaskActions } from './useTaskActions';
import type { TaskDto, UserDto } from '../model/types';

describe('useTaskActions', () => {
  const adminUser = { id: 1, role: 'ADMIN' } as UserDto;
  const employeeUser = { id: 2, role: 'EMPLOYEE' } as UserDto;
  const otherEmployeeUser = { id: 3, role: 'EMPLOYEE' } as UserDto;
  const clientUser = { id: 4, role: 'CLIENT' } as UserDto;
  const learnerUser = { id: 5, role: 'LEARNER' } as UserDto;
  const curatorUser = { id: 6, role: 'CURATOR' } as UserDto;
  const advisorUser = { id: 7, role: 'ADVISOR' } as UserDto;

  const unassignedTask = { id: 100 } as TaskDto;
  const assignedToMeTask = { id: 101, assignedToId: 2, assignedTo: { id: 2 } } as unknown as TaskDto;
  const assignedToOtherTask = { id: 102, assignedToId: 3, assignedTo: { id: 3 } } as unknown as TaskDto;

  const nonAdmins = [employeeUser, clientUser, learnerUser, curatorUser, advisorUser];
  const nonEmployees = [adminUser, clientUser, learnerUser, curatorUser, advisorUser];

  it('allows ADMIN to assign any task', () => {
    expect(useTaskActions(unassignedTask, adminUser).canAssign).toBe(true);
    expect(useTaskActions(assignedToMeTask, adminUser).canAssign).toBe(true);
    expect(useTaskActions(assignedToOtherTask, adminUser).canAssign).toBe(true);
  });

  it('does not allow non-ADMIN to assign tasks', () => {
    nonAdmins.forEach(user => {
      expect(useTaskActions(unassignedTask, user).canAssign).toBe(false);
    });
  });

  it('allows EMPLOYEE to take unassigned task', () => {
    expect(useTaskActions(unassignedTask, employeeUser).canTake).toBe(true);
  });

  it('does not allow EMPLOYEE to take assigned task', () => {
    expect(useTaskActions(assignedToOtherTask, employeeUser).canTake).toBe(false);
    expect(useTaskActions(assignedToMeTask, employeeUser).canTake).toBe(false); // already theirs
  });

  it('does not allow non-EMPLOYEE to take unassigned task', () => {
    nonEmployees.forEach(user => {
      expect(useTaskActions(unassignedTask, user).canTake).toBe(false);
    });
  });

  it('allows EMPLOYEE to drop their own task', () => {
    expect(useTaskActions(assignedToMeTask, employeeUser).canDrop).toBe(true);
  });

  it('does not allow EMPLOYEE to drop other employee task', () => {
    expect(useTaskActions(assignedToOtherTask, employeeUser).canDrop).toBe(false);
  });

  it('does not allow non-EMPLOYEE to drop tasks', () => {
    nonEmployees.forEach(user => {
      expect(useTaskActions(assignedToMeTask, user).canDrop).toBe(false);
    });
  });

  it('correctly computes isUnassigned', () => {
    expect(useTaskActions(unassignedTask, employeeUser).isUnassigned).toBe(true);
    expect(useTaskActions(assignedToMeTask, employeeUser).isUnassigned).toBe(false);
  });

  it('correctly computes isAssignedToMe', () => {
    expect(useTaskActions(assignedToMeTask, employeeUser).isAssignedToMe).toBe(true);
    expect(useTaskActions(assignedToOtherTask, employeeUser).isAssignedToMe).toBe(false);
    expect(useTaskActions(unassignedTask, employeeUser).isAssignedToMe).toBe(false);
  });
});
