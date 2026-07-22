import React, { useState, forwardRef, useImperativeHandle, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { TaskKanbanColumn } from './TaskKanbanColumn';
import { TaskKanbanCard } from './TaskKanbanCard';
import type { TaskDto, StageDto } from '@/entities/task/model/types';
import { usePipelinesQuery } from '@/entities/pipeline/api/pipelineQueries';
import { useUpdateTaskStage } from '@/entities/task/api/taskQueries';
import { Spinner } from '@/shared/ui/Spinner';
import { getTask } from '@/entities/task/api/taskApi';
import { TaskDetailsModal } from '@/entities/task/ui/TaskDetailsModal';
import { ChatDrawer } from '@/widgets/chat/ChatDrawer';
import { useTranslation } from 'react-i18next';

interface TaskKanbanBoardProps {
  initialTasks: TaskDto[];
  userRole: 'ADMIN' | 'EMPLOYEE' | 'CLIENT' | 'LEARNER';
}

export interface TaskKanbanBoardRef {
  createNewTask: (task: TaskDto) => void;
  openTaskModal: (taskId: number) => void;
}

export const TaskKanbanBoard = forwardRef<TaskKanbanBoardRef, TaskKanbanBoardProps>(({ initialTasks, userRole }, ref) => {
  const { t } = useTranslation('crm');
  const [columns, setColumns] = useState<Record<string, TaskDto[]>>({});
  const [activeTask, setActiveTask] = useState<TaskDto | null>(null);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<TaskDto | null>(null);
  const [chatClientId, setChatClientId] = useState<number | null>(null);
  const [chatClientName, setChatClientName] = useState<string>('');

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const isDraggingScroll = React.useRef(false);
  const startX = React.useRef(0);
  const scrollLeft = React.useRef(0);

  const { data: pipelines, isLoading: isLoadingPipelines } = usePipelinesQuery();
  const { mutateAsync: updateTaskStage } = useUpdateTaskStage();

  const pipeline = pipelines?.[0]; // Default to first pipeline for now
  const stages = pipeline?.stages || [];

  // Sync state with initialTasks when NOT dragging
  const isDragging = activeTask !== null;
  useEffect(() => {
    if (!stages.length || isDragging) return;

    const nextCols: Record<string, TaskDto[]> = {};
    stages.forEach(stage => {
      nextCols[`stage-${stage.id}`] = [];
    });
    
    if (stages.length > 0) {
      const defaultStageKey = `stage-${stages[0].id}`;
      initialTasks.forEach(task => {
        const stageKey = task.stageId ? `stage-${task.stageId}` : task.stage?.id ? `stage-${task.stage.id}` : defaultStageKey;
        if (nextCols[stageKey]) {
          nextCols[stageKey].push(task);
        } else {
          nextCols[defaultStageKey].push(task);
        }
      });
    }
    setColumns(nextCols);
  }, [stages, initialTasks, isDragging]);

  useImperativeHandle(ref, () => ({
    createNewTask: (task: TaskDto) => {
      if (!stages.length) return;
      const defaultStageKey = `stage-${stages[0].id}`;
      const taskStageKey = task.stageId ? `stage-${task.stageId}` : defaultStageKey;
      setColumns(prev => {
        const next = { ...prev };
        const key = next[taskStageKey] ? taskStageKey : defaultStageKey;
        next[key] = [task, ...(next[key] || [])];
        return next;
      });
      setSelectedTaskForModal(task);
    },
    openTaskModal: async (taskId: number) => {
      let existing: TaskDto | undefined;
      for (const col of Object.values(columns)) {
        existing = col.find(t => t.id === taskId);
        if (existing) break;
      }
      
      if (existing) {
        setSelectedTaskForModal(existing);
      } else {
        try {
          const fetched = await getTask(taskId);
          setSelectedTaskForModal(fetched);
        } catch (e) {
          console.error('Task not found:', e);
          alert(t('errors.taskNotFound', { defaultValue: 'Task not found' }));
        }
      }
    }
  }));

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findContainer = (id: string | number) => {
    if (typeof id === 'string' && id.startsWith('stage-')) {
      return id;
    }
    for (const [key, tasks] of Object.entries(columns)) {
      if (tasks.find(t => t.id === id)) {
        return key;
      }
    }
    return null;
  };

  const [activeTaskInitialStageId, setActiveTaskInitialStageId] = useState<number | null>(null);

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const container = findContainer(active.id);
    if (container) {
      const task = columns[container].find(t => t.id === active.id);
      if (task) {
        setActiveTask(task);
        setActiveTaskInitialStageId(task.stageId || task.stage?.id || null);
      }
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setColumns((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];

      const activeIndex = activeItems.findIndex(t => t.id === active.id);
      const overIndex = over.id.toString().startsWith('stage-')
        ? overItems.length
        : overItems.findIndex(t => t.id === over.id);

      const newActive = [...activeItems];
      const newOver = [...overItems];
      const [item] = newActive.splice(activeIndex, 1);
      
      // Optimitically update stageId so it renders correctly
      const stageIdStr = overContainer.replace('stage-', '');
      item.stageId = parseInt(stageIdStr, 10);
      
      newOver.splice(overIndex >= 0 ? overIndex : overItems.length, 0, item);

      return {
        ...prev,
        [activeContainer]: newActive,
        [overContainer]: newOver,
      };
    });
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const currentActiveTask = activeTask;
    setActiveTask(null);
    
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer) return;

    // Handle reordering within the same column
    if (activeContainer === overContainer) {
      const activeIndex = columns[activeContainer].findIndex(t => t.id === active.id);
      const overIndex = columns[overContainer].findIndex(t => t.id === over.id);

      if (activeIndex !== overIndex) {
        setColumns(prev => ({
          ...prev,
          [activeContainer]: arrayMove(prev[activeContainer], activeIndex, overIndex)
        }));
      }
    }

    // Check if stage actually changed from its initial state
    const task = columns[overContainer].find(t => t.id === active.id);
    if (task && task.stageId) {
      if (task.stageId !== activeTaskInitialStageId) {
        try {
          await updateTaskStage({ id: task.id, stageId: task.stageId });
        } catch (e) {
          console.error("Failed to update task stage", e);
        }
      }
    }
    setActiveTaskInitialStageId(null);
  };

  const handleUpdateTask = (updatedTask: TaskDto) => {
    setColumns(prev => {
      const next = { ...prev };
      let found = false;
      for (const key of Object.keys(next)) {
        const idx = next[key].findIndex(t => t.id === updatedTask.id);
        if (idx !== -1) {
          next[key][idx] = updatedTask;
          found = true;
          // check if stage changed
          const expectedKey = updatedTask.stageId ? `stage-${updatedTask.stageId}` : key;
          if (expectedKey !== key && next[expectedKey]) {
            next[key] = next[key].filter(t => t.id !== updatedTask.id);
            next[expectedKey] = [updatedTask, ...next[expectedKey]];
          }
          break;
        }
      }
      return next;
    });
  };

  if (isLoadingPipelines) {
    return <div className="flex justify-center p-12"><Spinner /></div>;
  }

  if (!stages.length) {
    return <div className="p-8 text-center text-gray-500">{t('kanban.noPipelines', { defaultValue: 'Воронки не настроены' })}</div>;
  }

  const handleOpenChat = (clientId: number, clientName: string) => {
    setChatClientId(clientId);
    setChatClientName(clientName);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('.task-kanban-card') ||
      target.closest('a')
    ) return;

    isDraggingScroll.current = true;
    if (scrollContainerRef.current) {
      startX.current = e.pageX;
      scrollLeft.current = scrollContainerRef.current.scrollLeft;
      scrollContainerRef.current.style.cursor = 'grabbing';
      scrollContainerRef.current.style.userSelect = 'none';
    }
  };

  const handleMouseLeaveOrUp = () => {
    isDraggingScroll.current = false;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = '';
      scrollContainerRef.current.style.userSelect = '';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingScroll.current) return;
    if (scrollContainerRef.current) {
      e.preventDefault();
      const dx = e.pageX - startX.current;
      scrollContainerRef.current.scrollLeft = scrollLeft.current - dx;
    }
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    if (!scrollContainerRef.current) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    scrollContainerRef.current.scrollLeft += e.deltaY * 1.5;
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  return (
    <div 
      ref={scrollContainerRef}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeaveOrUp}
      onMouseUp={handleMouseLeaveOrUp}
      onMouseMove={handleMouseMove}
      className="flex-1 overflow-x-auto pb-4 pt-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 snap-x snap-mandatory hide-scrollbar select-none"
    >
      <div className="flex gap-4 items-start min-h-[calc(100vh-200px)]">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          {stages.map(stage => (
            <TaskKanbanColumn
              key={stage.id}
              stage={stage}
              tasks={columns[`stage-${stage.id}`] || []}
              onTaskClick={(id) => ref && 'current' in ref && ref.current?.openTaskModal(id)}
              userRole={userRole}
              onOpenChat={handleOpenChat}
            />
          ))}

          <DragOverlay>
            {activeTask ? (
              <TaskKanbanCard task={activeTask} onClick={() => {}} userRole={userRole} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {selectedTaskForModal && (
        <TaskDetailsModal
          task={selectedTaskForModal}
          onClose={() => setSelectedTaskForModal(null)}
          onUpdateTask={(updated) => {
            handleUpdateTask(updated);
            setSelectedTaskForModal(updated);
          }}
          userRole={userRole}
        />
      )}

      <ChatDrawer
        isOpen={chatClientId !== null}
        onClose={() => setChatClientId(null)}
        otherUserId={chatClientId}
        otherUserName={chatClientName}
      />
    </div>
  );
});

