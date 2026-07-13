import type { TaskDto, UserDto } from '../model/types';

export function useTaskActions(task: TaskDto, currentUser: UserDto) {
  const isUnassigned = !task.assignedToId && !task.assignedTo;
  const isAssignedToMe = task.assignedTo?.id === currentUser.id || task.assignedToId === currentUser.id;
  const isAdmin = currentUser.role === 'ADMIN';
  const isEmployee = currentUser.role === 'EMPLOYEE';

  const canAssign = isAdmin; // Only admins can arbitrarily assign tasks to ANYONE
  const canTake = (isEmployee || isAdmin) && isUnassigned; // Employees and Admins can take unassigned tasks
  const canDrop = (isEmployee || isAdmin) && isAssignedToMe; // Employees and Admins can drop their OWN tasks
  
  return {
    canAssign,
    canTake,
    canDrop,
    isUnassigned,
    isAssignedToMe
  };
}
