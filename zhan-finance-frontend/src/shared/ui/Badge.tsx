import type { StageDto } from '@/entities/task/model/types';
import { useTranslation } from 'react-i18next';

export function StatusBadge({ stage }: { stage?: StageDto }) {
  const { t } = useTranslation(['common']);
  if (!stage) return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{t('taskPool.noStage', { defaultValue: 'Нет стадии' })}</span>;
  return (
    <span 
      className="inline-block whitespace-nowrap px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-full text-white shadow-sm"
      style={{ backgroundColor: stage.color || '#3b82f6' }}
    >
      {t(`stages.${stage.name}`, { defaultValue: stage.name })}
    </span>
  );
}

