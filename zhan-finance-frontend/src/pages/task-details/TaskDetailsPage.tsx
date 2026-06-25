import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TaskDetailCard } from '@/features/task-management/ui/TaskDetailCard';

export function TaskDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) return null;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-brand-green mb-6 transition-colors"
      >
        <ArrowLeft size={18} />
        <span>Назад к доске</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <TaskDetailCard taskId={Number(id)} isModal={false} />
        
        {/* Chat / Timeline could go in the remaining col-span-1 */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm sticky top-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">История и Чат</h2>
            <div className="bg-gray-50 rounded-xl p-4 text-center text-gray-500 text-sm">
              Чат по задаче скоро появится...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
