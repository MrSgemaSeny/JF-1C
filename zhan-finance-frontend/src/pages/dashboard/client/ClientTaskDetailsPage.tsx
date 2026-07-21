import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/config/routes';
import { useTaskQuery, useUpdateTaskStage } from '@/entities/task/api/taskQueries';
import { usePipelinesQuery } from '@/entities/pipeline/api/pipelineQueries';
import type { StageDto } from '@/entities/task/model/types';
import { TaskRejectModal } from '@/widgets/task-reject/TaskRejectModal';
import { Spinner } from '@/shared/ui/Spinner';
import { ArrowLeft, Clock, MessageSquare, AlertCircle, CheckCircle2, XCircle, FileText, Download, Activity, Archive } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { twMerge } from 'tailwind-merge';
import { downloadDocument } from '@/entities/document/api/documentApi';

// Reusing colors from Kanban config for the stepper
export function ClientTaskDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('crm');

  const taskId = parseInt(id || '0', 10);
  const { data: task, isLoading: isTaskLoading } = useTaskQuery(taskId, !!taskId);
  const { data: pipelines, isLoading: isPipelinesLoading } = usePipelinesQuery();
  
  const { mutateAsync: updateStage, isPending: isUpdatingStage } = useUpdateTaskStage();

  const [showRejectModal, setShowRejectModal] = useState(false);

  if (isTaskLoading || isPipelinesLoading) {
    return <div className="flex h-screen items-center justify-center"><Spinner /></div>;
  }

  if (!task) {
    return (
      <div className="p-8 text-center text-gray-500">
        <h2 className="text-2xl font-bold mb-2">Задача не найдена</h2>
        <button onClick={() => navigate(ROUTES.CLIENT)} className="text-brand-green hover:underline">Вернуться назад</button>
      </div>
    );
  }

  const stages: StageDto[] = pipelines?.[0]?.stages || [];
  const currentStageIndex = stages.findIndex((s: StageDto) => s.id === task.stage?.id);

  const isWon = task.stage?.type === 'WON';
  const isLost = task.stage?.type === 'LOST';
  const isArchived = task.archived;
  const isFinished = isWon || isLost;

  const handleRejectSubmit = async (reason: string) => {
    // Find a LOST stage
    const lostStage = stages.find((s: StageDto) => s.type === 'LOST');
    if (!lostStage) return;
    
    try {
      await updateStage({ id: task.id, stageId: lostStage.id, lostReason: reason });
      setShowRejectModal(false);
    } catch (err) {
      console.error('Failed to reject task', err);
    }
  };

  const handleConfirm = async () => {
    const wonStage = stages.find((s: StageDto) => s.type === 'WON');
    if (!wonStage) return;
    try {
      await updateStage({ id: task.id, stageId: wonStage.id });
    } catch (err) {
      console.error('Failed to confirm task', err);
    }
  };

  const handleRework = async () => {
    const reworkStage = stages.find((s: StageDto) => s.name === 'Доработка');
    if (!reworkStage) return;
    try {
      await updateStage({ id: task.id, stageId: reworkStage.id });
    } catch (err) {
      console.error('Failed to send to rework', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in duration-300">
      <button 
        onClick={() => navigate(ROUTES.CLIENT)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Назад к списку
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{task.title}</h1>
                {isArchived && (
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold uppercase flex items-center gap-1">
                    <Archive size={14} /> Архив
                  </span>
                )}
              </div>
              <p className="text-gray-500 flex items-center gap-2 text-sm">
                <Clock size={16} /> Создано {new Date(task.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            {!isArchived && (
              <div className="flex flex-wrap items-center gap-3">
                {task.stage?.name === 'На проверке' && (
                  <>
                    <button
                      onClick={handleConfirm}
                      disabled={isUpdatingStage}
                      className="px-4 py-2 bg-brand-green text-white hover:bg-brand-green/90 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle2 size={16} /> Подтвердить
                    </button>
                    <button
                      onClick={handleRework}
                      disabled={isUpdatingStage}
                      className="px-4 py-2 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <Activity size={16} /> На доработку
                    </button>
                  </>
                )}
                {!isFinished && task.stage?.name !== 'На проверке' && (
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                  >
                    <XCircle size={16} /> Отказаться
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status Stepper */}
        <div className="p-6 md:p-8 bg-gray-50/50 border-b border-gray-100 overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="flex items-center justify-between relative">
              {/* Connecting Line background */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
              
              {stages.filter((s: StageDto) => s.type !== 'LOST').map((stage: StageDto, index: number) => {
                const isActive = task.stage?.id === stage.id;
                const isPassed = currentStageIndex > index || isWon;
                const isCancelledHere = isLost && currentStageIndex === index;
                
                let stepBgStyle: React.CSSProperties = { backgroundColor: '#e5e7eb' }; // gray-200
                let stepBorderStyle: React.CSSProperties = {};
                let textStyle: React.CSSProperties = { color: '#9ca3af' }; // gray-400
                let icon = <div className="w-2.5 h-2.5 rounded-full bg-white" />;
                let stepClasses = 'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500';
                let textClasses = 'text-xs text-center max-w-[80px] leading-tight';

                if (isPassed && !isLost) {
                  stepBgStyle = { backgroundColor: stage.color || '#9ca3af' };
                  textStyle = { color: stage.color || '#111827' };
                  stepClasses += ' border-4 border-gray-50 shadow-sm';
                  icon = <CheckCircle2 size={16} className="text-white" />;
                } else if (isActive) {
                  stepBgStyle = { backgroundColor: stage.color || '#9ca3af' };
                  textStyle = { color: stage.color || '#111827' };
                  stepClasses += ' border-4 border-gray-50 shadow-sm';
                  textClasses += ' font-bold';
                  icon = <Activity size={16} className="text-white animate-pulse" />;
                } else {
                  // Для будущих этапов
                  stepBgStyle = { backgroundColor: 'white' };
                  stepBorderStyle = { borderColor: stage.color || '#9ca3af' };
                  textStyle = { color: stage.color || '#9ca3af', opacity: 0.6 };
                  stepClasses += ' border-2 border-dashed';
                  icon = <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color || '#9ca3af' }} />;
                }

                // If task is lost, maybe show the lost stage
                if (isLost && task.stage?.id === stage.id) {
                   stepBgStyle = { backgroundColor: '#ef4444' };
                   textStyle = { color: '#dc2626' };
                   textClasses += ' font-bold';
                   stepClasses += ' border-4 border-gray-50 shadow-sm';
                   icon = <XCircle size={16} className="text-white" />;
                }

                return (
                  <div key={stage.id} className="relative z-10 flex flex-col items-center gap-2 flex-1">
                    <div className={stepClasses} style={{ ...stepBgStyle, ...stepBorderStyle }}>
                      {icon}
                    </div>
                    <span className={textClasses} style={textStyle}>
                      {t(`stages.${stage.name}`, { defaultValue: stage.name })}
                    </span>
                  </div>
                );
              })}
            </div>
            {isLost && (
              <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm flex gap-2">
                <AlertCircle size={18} className="shrink-0" />
                <div>
                  <p className="font-semibold mb-1">{t('taskDetails.cancelled', { defaultValue: 'Задача отменена' })}</p>
                  {task.lostReason && <p>{t('taskDetails.reason', { defaultValue: 'Причина:' })} {task.lostReason}</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Описание</h3>
              <div className="bg-gray-50 p-4 rounded-xl text-gray-700 text-sm whitespace-pre-wrap min-h-[100px] border border-gray-100">
                {task.description || <span className="text-gray-400 italic">Описание отсутствует...</span>}
              </div>
            </div>

            {task.services && task.services.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Связанные услуги</h3>
                <div className="flex flex-wrap gap-2">
                  {task.services.map(service => (
                    <span key={service.id} className="px-3 py-1.5 bg-brand-green/10 text-brand-green rounded-lg text-sm font-medium border border-brand-green/20">
                      {service.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            
            {/* Документы из истории */}
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText size={16} /> Последние события
              </h3>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4 max-h-[300px] overflow-y-auto">
                {task.history && task.history.length > 0 ? (
                  task.history.slice(0, 5).map(h => (
                    <div key={h.id} className="flex gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 text-gray-400">
                        <Activity size={14} />
                      </div>
                      <div>
                        <p className="text-gray-800 font-medium">{h.actionText}</p>
                        <p className="text-xs text-gray-400">{new Date(h.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 text-center italic">История пуста</p>
                )}
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {showRejectModal && (
        <TaskRejectModal 
          taskTitle={task.title}
          onClose={() => setShowRejectModal(false)}
          onSubmit={handleRejectSubmit}
          isLoading={isUpdatingStage}
        />
      )}
    </div>
  );
}
