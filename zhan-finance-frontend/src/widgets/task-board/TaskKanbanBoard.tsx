import React, { useMemo, useState, forwardRef, useImperativeHandle } from 'react';
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

interface TaskKanbanBoardProps {
  initialTasks: TaskDto[];
  userRole: 'ADMIN' | 'EMPLOYEE' | 'CLIENT' | 'LEARNER';
}

export interface TaskKanbanBoardRef {
  createNewTask: (task: TaskDto) => void;
  openTaskModal: (taskId: number) => void;
}

export const TaskKanbanBoard = forwardRef<TaskKanbanBoardRef, TaskKanbanBoardProps>(({ initialTasks, userRole }, ref) => {
  const [tasks, setTasks] = useState<TaskDto[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<TaskDto | null>(null);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<TaskDto | null>(null);

  const { data: pipelines, isLoading: isLoadingPipelines } = usePipelinesQuery();
  const { mutateAsync: updateTaskStage } = useUpdateTaskStage();

  const pipeline = pipelines?.[0]; // Default to first pipeline for now
  const stages = pipeline?.stages || [];

  useImperativeHandle(ref, () => ({
    createNewTask: (task: TaskDto) => {
      setTasks(prev => [task, ...prev]);
      setSelectedTaskForModal(task);
    },
    openTaskModal: async (taskId: number) => {
      const existing = tasks.find(t => t.id === taskId);
      if (existing) {
        setSelectedTaskForModal(existing);
      } else {
        try {
          const fetched = await getTask(taskId);
          setSelectedTaskForModal(fetched);
        } catch (e) {
          console.error('Task not found:', e);
          alert('Task not found');
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

  const columns = useMemo(() => {
    if (!stages.length) return [];
    
    // Create map of columns
    const cols = stages.map(stage => ({
      stage,
      tasks: tasks.filter(t => t.stageId === stage.id || t.stage?.id === stage.id),
    }));

    // Tasks without stage go to first column
    const noStageTasks = tasks.filter(t => !t.stageId && !t.stage);
    if (noStageTasks.length > 0 && cols.length > 0) {
      cols[0].tasks.push(...noStageTasks);
    }
    
    return cols;
  }, [stages, tasks]);

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    // Dropping a Task over another Task
    if (isActiveTask && isOverTask) {
      setTasks(prev => {
        const activeIndex = prev.findIndex(t => t.id === activeId);
        const overIndex = prev.findIndex(t => t.id === overId);
        
        if (prev[activeIndex].stageId !== prev[overIndex].stageId) {
          const newTasks = [...prev];
          newTasks[activeIndex].stageId = prev[overIndex].stageId;
          return arrayMove(newTasks, activeIndex, overIndex);
        }
        
        return arrayMove(prev, activeIndex, overIndex);
      });
    }

    // Dropping a Task over an empty Column
    if (isActiveTask && isOverColumn) {
      setTasks(prev => {
        const activeIndex = prev.findIndex(t => t.id === activeId);
        const newTasks = [...prev];
        newTasks[activeIndex].stageId = overId as number;
        return arrayMove(newTasks, activeIndex, activeIndex);
      });
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    
    // Find task to check its new stage
    const task = tasks.find(t => t.id === activeId);
    if (task && task.stageId) {
      // Find original task to see if stage changed
      const originalTask = initialTasks.find(t => t.id === activeId);
      const originalStageId = originalTask?.stageId || originalTask?.stage?.id;
      
      if (task.stageId !== originalStageId) {
        try {
          await updateTaskStage({ id: task.id, stageId: task.stageId });
        } catch (e) {
          console.error("Failed to update task stage", e);
          // Optional: Revert task back to original stage in UI
        }
      }
    }
  };

  if (isLoadingPipelines) {
    return <div className="flex justify-center p-12"><Spinner /></div>;
  }

  if (!stages.length) {
    return <div className="p-8 text-center text-gray-500">Воронки не настроены</div>;
  }

  const handleUpdateTask = (updatedTask: TaskDto) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  return (
    <div className="flex-1 overflow-x-auto pb-4 pt-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex gap-4 items-start min-h-[calc(100vh-200px)]">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          {columns.map(col => (
            <TaskKanbanColumn
              key={col.stage.id}
              stage={col.stage}
              tasks={col.tasks}
              onTaskClick={(id) => ref && 'current' in ref && ref.current?.openTaskModal(id)}
              userRole={userRole}
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
    </div>
  );
});
