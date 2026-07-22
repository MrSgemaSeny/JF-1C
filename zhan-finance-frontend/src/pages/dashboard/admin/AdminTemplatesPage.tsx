import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Trash2, Plus, FileText, AlertCircle, Upload, X, FileSignature } from 'lucide-react';
import { documentTemplateApi } from '@/entities/document-template/api/documentTemplateApi';
import { DocumentTemplate } from '@/entities/document-template/model/types';
import { useToast } from '@/shared/ui/Toast/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

export function AdminTemplatesPage() {
  const { t } = useTranslation(['crm']);
  const toast = useToast();
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const data = await documentTemplateApi.getAllTemplates();
      setTemplates(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName || !uploadFile) return;

    try {
      setIsUploading(true);
      await documentTemplateApi.uploadTemplate(uploadName, uploadDescription, uploadFile);
      
      setUploadName('');
      setUploadDescription('');
      setUploadFile(null);
      
      toast.success('Шаблон успешно загружен');
      await fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;
    try {
      await documentTemplateApi.deleteTemplate(templateToDelete);
      toast.success('Шаблон удален');
      setTemplateToDelete(null);
      await fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const handleDownload = async (template: DocumentTemplate) => {
    try {
      await documentTemplateApi.downloadTemplate(template.id, template.name + '.docx');
    } catch (err: any) {
      toast.error(err.message || 'Download failed');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3 tracking-tight">
          <div className="p-2.5 bg-gradient-to-r from-brand-green to-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-200">
            <FileSignature size={28} />
          </div>
          Шаблоны документов
        </h1>
        <p className="mt-3 text-base text-gray-500 max-w-2xl leading-relaxed">
          Управляйте документами и формами для автоматической генерации. Загружайте файлы <span className="font-medium text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">.docx</span> с тегами для автозаполнения клиентскими и проектными данными.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column */}
        <motion.div 
          className="xl:col-span-1 space-y-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Upload Form */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <Upload size={20} className="text-emerald-500" /> Загрузить новый
            </h2>
            
            <form onSubmit={handleUpload} className="space-y-5 relative z-10">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Название шаблона <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-gray-800"
                  placeholder="Например: Договор оказания услуг"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Описание</label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none h-24 resize-none text-gray-800"
                  placeholder="Краткое описание шаблона"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Файл (.docx) <span className="text-red-500">*</span></label>
                <div className="relative group">
                  <input
                    type="file"
                    required
                    accept=".docx"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  />
                  <div className={`w-full px-4 py-4 border-2 border-dashed rounded-xl text-center transition-colors flex flex-col items-center justify-center gap-2 relative z-10 ${uploadFile ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 bg-gray-50 group-hover:border-emerald-400 group-hover:bg-gray-100'}`}>
                    <FileText size={24} className={uploadFile ? 'text-emerald-500' : 'text-gray-400'} />
                    <span className={`text-sm font-medium ${uploadFile ? 'text-emerald-700' : 'text-gray-500'}`}>
                      {uploadFile ? uploadFile.name : 'Нажмите или перетащите файл'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isUploading || !uploadName || !uploadFile}
                className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-gradient-to-r from-brand-green to-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none disabled:translate-y-0"
              >
                {isUploading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Загрузка...
                  </div>
                ) : (
                  <>
                    <Upload size={18} />
                    Сохранить шаблон
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Cheat Sheet */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50/80 rounded-2xl border border-amber-200/60 p-6 shadow-sm">
            <div className="flex gap-4">
              <div className="bg-amber-100 text-amber-600 p-2 rounded-lg shrink-0 h-10 w-10 flex items-center justify-center">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-amber-900">Шпаргалка по тегам</h3>
                <p className="text-sm text-amber-700/80 mt-1.5 mb-5 leading-relaxed">
                  Вставляйте эти переменные прямо в текст <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-800">.docx</code> файла. При генерации они заменятся на реальные значения.
                </p>
                
                <div className="space-y-5">
                  <div className="bg-white/60 p-3 rounded-xl border border-amber-100 hover:bg-white transition-colors">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-900/60 mb-2">Данные клиента</p>
                    <ul className="text-[13px] text-amber-900 space-y-1.5 font-mono">
                      <li className="flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:bg-amber-400 before:rounded-full">{`{{CLIENT_NAME}}`}</li>
                      <li className="flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:bg-amber-400 before:rounded-full">{`{{CLIENT_IIN}}`}</li>
                      <li className="flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:bg-amber-400 before:rounded-full">{`{{CLIENT_EMAIL}}`}</li>
                      <li className="flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:bg-amber-400 before:rounded-full">{`{{CLIENT_PHONE}}`}</li>
                      <li className="flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:bg-amber-400 before:rounded-full">{`{{CLIENT_COMPANY}}`}</li>
                    </ul>
                  </div>
                  <div className="bg-white/60 p-3 rounded-xl border border-amber-100 hover:bg-white transition-colors">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-900/60 mb-2">Данные задачи</p>
                    <ul className="text-[13px] text-amber-900 space-y-1.5 font-mono">
                      <li className="flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:bg-amber-400 before:rounded-full">{`{{TASK_TITLE}}`}</li>
                      <li className="flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:bg-amber-400 before:rounded-full">{`{{TASK_AMOUNT}}`}</li>
                      <li className="flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:bg-amber-400 before:rounded-full">{`{{TASK_DEADLINE}}`}</li>
                      <li className="flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:bg-amber-400 before:rounded-full">{`{{TASK_DESCRIPTION}}`}</li>
                      <li className="flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:bg-amber-400 before:rounded-full">{`{{TASK_SERVICE}}`}</li>
                    </ul>
                  </div>
                  <div className="bg-white/60 p-3 rounded-xl border border-amber-100 hover:bg-white transition-colors">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-900/60 mb-2">Системные значения</p>
                    <ul className="text-[13px] text-amber-900 space-y-1.5 font-mono">
                      <li className="flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:bg-amber-400 before:rounded-full">{`{{DATE_TODAY}}`}</li>
                      <li className="flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:bg-amber-400 before:rounded-full">{`{{DATE_TODAY_SHORT}}`}</li>
                      <li className="flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:bg-amber-400 before:rounded-full">{`{{YEAR}}`}</li>
                      <li className="flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:bg-amber-400 before:rounded-full">{`{{DOC_NUMBER}}`}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Templates List */}
        <motion.div 
          className="xl:col-span-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden flex flex-col h-full min-h-[500px]">
            <div className="px-6 py-5 border-b border-gray-100 bg-white/50 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Доступные шаблоны</h2>
              <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold">{templates.length} шт</span>
            </div>
            
            <div className="flex-1 p-4">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 py-20">
                  <div className="w-10 h-10 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin"></div>
                  <p className="font-medium text-gray-500">Загрузка шаблонов...</p>
                </div>
              ) : error ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                  <div className="bg-red-50 text-red-500 p-4 rounded-full mb-4">
                    <AlertCircle size={32} />
                  </div>
                  <p className="text-red-600 font-medium">{error}</p>
                </div>
              ) : templates.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full flex flex-col items-center justify-center p-12 text-center"
                >
                  <div className="bg-gray-50 p-6 rounded-full mb-6">
                    <FileText size={64} className="text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Нет загруженных шаблонов</h3>
                  <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
                    Загрузите первый <code className="bg-gray-100 px-1 rounded text-gray-700">.docx</code> шаблон, чтобы сотрудники могли быстро генерировать документы.
                  </p>
                </motion.div>
              ) : (
                <ul className="space-y-3">
                  <AnimatePresence>
                    {templates.map((template, index) => (
                      <motion.li 
                        key={template.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                        className="group bg-white border border-gray-100 rounded-xl p-5 hover:shadow-xl hover:shadow-gray-200/50 hover:border-emerald-200 transition-all duration-300 relative overflow-hidden"
                      >
                        <div className="absolute inset-y-0 left-0 w-1 bg-emerald-400 scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-bottom"></div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-5 overflow-hidden w-full sm:w-auto">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shrink-0 border border-blue-200/50 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                              <FileText size={24} className="text-blue-500 drop-shadow-sm" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-emerald-600 transition-colors">{template.name}</h3>
                              {template.description && (
                                <p className="text-sm text-gray-500 mt-0.5 truncate pr-4">{template.description}</p>
                              )}
                              <div className="flex items-center gap-3 mt-2 text-xs font-medium text-gray-400">
                                <span className="bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">{new Date(template.createdAt).toLocaleDateString('ru-RU')}</span>
                                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>{template.createdByName || 'Система'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 sm:translate-x-2 group-hover:translate-x-0 w-full sm:w-auto justify-end mt-4 sm:mt-0">
                            <button
                              onClick={() => handleDownload(template)}
                              className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-2 font-medium text-sm"
                            >
                              <Download size={18} /> Скачать
                            </button>
                            <button
                              onClick={() => setTemplateToDelete(template.id)}
                              className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Удалить шаблон"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {templateToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
              onClick={() => setTemplateToDelete(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10"
            >
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-red-50/50">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <AlertCircle size={20} className="text-red-500" /> Подтверждение удаления
                </h3>
                <button onClick={() => setTemplateToDelete(null)} className="text-gray-400 hover:text-gray-600 hover:bg-white rounded-full p-1 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <p className="text-base text-gray-600 leading-relaxed">
                  Вы уверены, что хотите удалить этот шаблон? Восстановить его будет невозможно, и сотрудники больше не смогут использовать его для генерации документов.
                </p>
                <div className="mt-8 flex justify-end gap-3">
                  <button
                    onClick={() => setTemplateToDelete(null)}
                    className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all hover:-translate-y-0.5 focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
                  >
                    Удалить навсегда
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
