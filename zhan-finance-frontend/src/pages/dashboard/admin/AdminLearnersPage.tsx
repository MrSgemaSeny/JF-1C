import { useEffect, useState } from 'react';
import { UserProfileDto, getAllLearners, createLearner } from '@/entities/user/api/userApi';
import { Plus, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function AdminLearnersPage() {
  const { t } = useTranslation(['common']);
  const [learners, setLearners] = useState<UserProfileDto[]>([]);
  const [showModal, setShowModal] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loadLearners = () => {
    getAllLearners().then(setLearners).catch(console.error);
  };

  useEffect(() => {
    loadLearners();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLearner({ fullName, email, password });
      setShowModal(false);
      setFullName('');
      setEmail('');
      setPassword('');
      loadLearners();
    } catch (err: any) {
      alert(err.message || t('adminLearners.createError'));
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="text-brand-green" />
          {t('adminLearners.title')}
        </h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-brand-green text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-green/90 flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {t('adminLearners.addLearner')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">ID</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">{t('adminLearners.fullName')}</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">{t('adminLearners.email')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {learners.map(learner => (
              <tr key={learner.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-500">{learner.id}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{learner.fullName}</td>
                <td className="px-6 py-4 text-gray-600">{learner.email}</td>
              </tr>
            ))}
            {learners.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">{t('adminLearners.empty')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">{t('adminLearners.newLearnerModalTitle')}</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminLearners.fullName')}</label>
                <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminLearners.email')}</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminLearners.password')}</label>
                <input required minLength={8} type="text" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
                <p className="text-xs text-gray-500 mt-1">{t('adminLearners.passwordHint')}</p>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">{t('adminLearners.cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-brand-green/90">{t('adminLearners.create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
