import type { TaskDto, TaskCreateRequest, TaskRequestCreateRequest, TaskStatus, TaskFilter } from '../model/types';

const STORAGE_KEY = 'mock_crm_tasks';

function loadTasks(): TaskDto[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) return JSON.parse(data);
  // Default mock tasks
  const defaultTasks: TaskDto[] = [
    {
      id: 1,
      title: 'Fix login screen',
      description: 'The login screen is not responsive on mobile devices.',
      client: { id: 3, fullName: 'Client One', email: 'client@test.com', role: 'CLIENT' },
      assignedTo: { id: 2, fullName: 'Employee One', email: 'employee@test.com', role: 'EMPLOYEE' },
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      createdBy: { id: 3, fullName: 'Client One', email: 'client@test.com', role: 'CLIENT' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  saveTasks(defaultTasks);
  return defaultTasks;
}

function saveTasks(tasks: TaskDto[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export async function getTasks(filter?: TaskFilter): Promise<TaskDto[]> {
  let tasks = loadTasks();
  if (filter) {
    if (filter.status) tasks = tasks.filter(t => t.status === filter.status);
    if (filter.clientId) tasks = tasks.filter(t => t.client.id === filter.clientId);
    if (filter.assignedToId) tasks = tasks.filter(t => t.assignedTo?.id === filter.assignedToId);
  }
  return tasks;
}

export async function getTask(id: number): Promise<TaskDto> {
  const task = loadTasks().find(t => t.id === id);
  if (!task) throw new Error('Task not found');
  return task;
}

export async function createTask(request: TaskCreateRequest): Promise<TaskDto> {
  const tasks = loadTasks();
  const newTask: TaskDto = {
    id: Date.now(),
    title: request.title,
    description: request.description,
    client: { id: request.clientId, fullName: 'Mock Client', email: 'mock@client.com', role: 'CLIENT' },
    assignedTo: request.assignedToId ? { id: request.assignedToId, fullName: 'Mock Employee', email: 'mock@employee.com', role: 'EMPLOYEE' } : undefined,
    status: 'NEW',
    priority: request.priority || 'MEDIUM',
    dueDate: request.dueDate,
    createdBy: { id: 1, fullName: 'Mock Admin', email: 'admin@test.com', role: 'ADMIN' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tasks.push(newTask);
  saveTasks(tasks);
  return newTask;
}

export async function requestTask(request: TaskRequestCreateRequest): Promise<TaskDto> {
  const tasks = loadTasks();
  const newTask: TaskDto = {
    id: Date.now(),
    title: request.title,
    description: request.description,
    client: { id: 3, fullName: 'Client One', email: 'client@test.com', role: 'CLIENT' },
    status: 'NEW',
    priority: 'MEDIUM',
    createdBy: { id: 3, fullName: 'Client One', email: 'client@test.com', role: 'CLIENT' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tasks.push(newTask);
  saveTasks(tasks);
  return newTask;
}

export async function updateTaskStatus(id: number, status: TaskStatus): Promise<TaskDto> {
  const tasks = loadTasks();
  const taskIndex = tasks.findIndex(t => t.id === id);
  if (taskIndex === -1) throw new Error('Task not found');
  tasks[taskIndex].status = status;
  tasks[taskIndex].updatedAt = new Date().toISOString();
  saveTasks(tasks);
  return tasks[taskIndex];
}

export async function assignTask(id: number, assigneeId?: number): Promise<TaskDto> {
  const tasks = loadTasks();
  const taskIndex = tasks.findIndex(t => t.id === id);
  if (taskIndex === -1) throw new Error('Task not found');
  tasks[taskIndex].assignedTo = assigneeId ? { id: assigneeId, fullName: 'Mock Employee', email: 'mock@employee.com', role: 'EMPLOYEE' } : undefined;
  tasks[taskIndex].updatedAt = new Date().toISOString();
  saveTasks(tasks);
  return tasks[taskIndex];
}
