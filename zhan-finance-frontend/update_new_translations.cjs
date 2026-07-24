const fs = require('fs');

const commonRuPath = 'src/shared/i18n/locales/ru/common.json';
const commonEnPath = 'src/shared/i18n/locales/en/common.json';
const tasksRuPath = 'src/shared/i18n/locales/ru/tasks.json';
const tasksEnPath = 'src/shared/i18n/locales/en/tasks.json';

const commonRu = JSON.parse(fs.readFileSync(commonRuPath, 'utf8'));
const commonEn = JSON.parse(fs.readFileSync(commonEnPath, 'utf8'));
const tasksRu = JSON.parse(fs.readFileSync(tasksRuPath, 'utf8'));
const tasksEn = JSON.parse(fs.readFileSync(tasksEnPath, 'utf8'));

// common namespace additions
commonRu.documents = {
  ...commonRu.documents,
  confirmError: 'Ошибка подписи документа',
  zipError: 'Ошибка скачивания ZIP архива',
  formingZip: 'Формируем ZIP...',
  downloadSelectedZip: 'Скачать выбранные ({{count}}) в ZIP',
  uploading: 'Загрузка документа...',
  dragOrClick: 'Перетащите файл или нажмите для загрузки',
  formats: 'PDF, DOCX, XLSX, PNG, JPG до 20 МБ',
  file: 'Файл',
  fileType: 'Тип',
  signatureStatus: 'Статус подписи',
  size: 'Размер',
  actions: 'Действия',
  signed: 'Подписано',
  confirming: 'Подтверждаем...',
  confirm: 'Подтвердить',
  downloadFile: 'Скачать документ',
  delete: 'Удалить',
  emptyCategory: 'Нет документов в этой категории',
  emptyCategoryDesc: 'Загрузите новый файл или выберите другую категорию'
};

commonEn.documents = {
  ...commonEn.documents,
  confirmError: 'Document signature error',
  zipError: 'Error downloading ZIP archive',
  formingZip: 'Forming ZIP...',
  downloadSelectedZip: 'Download selected ({{count}}) as ZIP',
  uploading: 'Uploading document...',
  dragOrClick: 'Drag file or click to upload',
  formats: 'PDF, DOCX, XLSX, PNG, JPG up to 20 MB',
  file: 'File',
  fileType: 'Type',
  signatureStatus: 'Signature status',
  size: 'Size',
  actions: 'Actions',
  signed: 'Signed',
  confirming: 'Confirming...',
  confirm: 'Confirm',
  downloadFile: 'Download document',
  delete: 'Delete',
  emptyCategory: 'No documents in this category',
  emptyCategoryDesc: 'Upload a new file or select another category'
};

commonRu.clientServices = {
  ...commonRu.clientServices,
  requestError: 'Ошибка при отправке запроса. Попробуйте позже.'
};

commonEn.clientServices = {
  ...commonEn.clientServices,
  requestError: 'Error submitting request. Please try again later.'
};

commonRu.learnerCourseDetail = {
  ...commonRu.learnerCourseDetail,
  progress: 'Прогресс',
  congrats: 'Поздравляем! 🎉',
  completedMsg: 'Вы успешно завершили этот курс и освоили все материалы.',
  student: 'Студент'
};

commonEn.learnerCourseDetail = {
  ...commonEn.learnerCourseDetail,
  progress: 'Progress',
  congrats: 'Congratulations! 🎉',
  completedMsg: 'You have successfully completed this course and mastered all materials.',
  student: 'Student'
};

commonRu.courseCertificate = {
  ...commonRu.courseCertificate,
  download: 'Скачать сертификат',
  certificate: 'СЕРТИФИКАТ',
  subtitle: 'об успешном окончании курса',
  confirms: 'Настоящий сертификат подтверждает, что',
  completed: 'успешно завершил(а) обучение по программе',
  issueDate: 'Дата выдачи'
};

commonEn.courseCertificate = {
  ...commonEn.courseCertificate,
  download: 'Download certificate',
  certificate: 'CERTIFICATE',
  subtitle: 'of successful course completion',
  confirms: 'This certificate confirms that',
  completed: 'has successfully completed the program',
  issueDate: 'Date of issue'
};

commonRu.learnerLesson = {
  ...commonRu.learnerLesson,
  additionalMaterial: 'Дополнительный материал',
  attachedDoc: 'Прикрепленный документ',
  downloadOpen: 'Скачать / Открыть',
  passed: 'Пройдено ✅',
  completeAndNext: 'Завершить урок и перейти к следующему',
  finishCurrentFirst: 'Сначала завершите текущий урок'
};

commonEn.learnerLesson = {
  ...commonEn.learnerLesson,
  additionalMaterial: 'Additional material',
  attachedDoc: 'Attached document',
  downloadOpen: 'Download / Open',
  passed: 'Passed ✅',
  completeAndNext: 'Complete lesson and go to next',
  finishCurrentFirst: 'Finish the current lesson first'
};

// tasks namespace additions
tasksRu.details = {
  ...tasksRu.details,
  download: 'Скачать'
};

tasksEn.details = {
  ...tasksEn.details,
  download: 'Download'
};

fs.writeFileSync(commonRuPath, JSON.stringify(commonRu, null, 2), 'utf8');
fs.writeFileSync(commonEnPath, JSON.stringify(commonEn, null, 2), 'utf8');
fs.writeFileSync(tasksRuPath, JSON.stringify(tasksRu, null, 2), 'utf8');
fs.writeFileSync(tasksEnPath, JSON.stringify(tasksEn, null, 2), 'utf8');

console.log('JSON translations updated successfully.');
