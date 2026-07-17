const fs = require('fs');

const ruPath = './src/shared/i18n/locales/ru/common.json';
const enPath = './src/shared/i18n/locales/en/common.json';

const ru = JSON.parse(fs.readFileSync(ruPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Delete the incorrect solutionPicker if it exists
if (ru.solutionPicker) delete ru.solutionPicker;
if (en.solutionPicker) delete en.solutionPicker;

const newDataRu = {
  quiz: {
    title: 'Поможем подобрать решение под ваш бизнес',
    subtitle: 'Ответьте на 5 вопросов — в конце появится форма для отправки.',
    success: 'Спасибо! Мы свяжемся с вами в ближайшее время.',
    questions: {
      '0': {
        q: 'В какой сфере работает ваш бизнес?',
        options: {
          'Услуги / Консалтинг': 'Услуги / Консалтинг',
          'Торговля (Опт/Розница)': 'Торговля (Опт/Розница)',
          'Производство': 'Производство',
          'IT / E-commerce': 'IT / E-commerce',
          'Другое': 'Другое'
        }
      },
      '1': {
        q: 'Сколько сотрудников в штате?',
        options: {
          'Я один / Нет сотрудников': 'Я один / Нет сотрудников',
          'От 1 до 5': 'От 1 до 5',
          'От 6 до 20': 'От 6 до 20',
          'Более 20': 'Более 20'
        }
      },
      '2': {
        q: 'Ваш текущий статус?',
        options: {
          'Только планирую открыть ИП/ТОО': 'Только планирую открыть ИП/ТОО',
          'ИП (Упрощенка)': 'ИП (Упрощенка)',
          'ИП (Общеустановленный)': 'ИП (Общеустановленный)',
          'ТОО': 'ТОО',
          'Не уверен': 'Не уверен'
        }
      }
    },
    resultsHeader: 'Результаты опроса:\n',
    questionResult: 'Вопрос:',
    answerResult: 'Ответ:',
    prev: 'Назад',
    next: 'Далее',
    nextToForm: 'Далее к форме',
    question: 'Вопрос',
    of: 'из',
    leaveContacts: 'Оставьте контакты',
    name: 'Имя',
    phoneOrEmail: 'Телефон или e-mail',
    submit: 'Отправить',
    restart: 'Пройти заново'
  },
  serviceModal: {
    validation: {
      fillContacts: 'Пожалуйста, заполните имя и телефон'
    },
    service: 'Услуга',
    close: 'Закрыть',
    about: 'О сервисе',
    includes: 'Что входит в стоимость:',
    orderForm: {
      title: 'Оставить заявку',
      descriptionLoggedIn: 'Опишите задачу или нажмите «Оставить заявку», и наш специалист свяжется с вами.',
      descriptionGuest: 'Заполните форму ниже, чтобы мы могли связаться с вами и обсудить детали.',
      name: 'Как к вам обращаться? *',
      phone: 'Номер телефона *',
      commentPlaceholder: 'Например: нужно ведение ИП на УСН...',
      comment: 'Дополнительный комментарий',
      date: 'Желаемая дата звонка (необязательно)',
      submitting: 'Отправляем...',
      submit: 'Оставить заявку',
      authRequired: 'Для отправки заявки потребуется авторизация.'
    },
    allServices: 'Все услуги'
  }
};

const newDataEn = {
  quiz: {
    title: 'Let us help you choose a solution for your business',
    subtitle: 'Answer a few questions — a form will appear at the end.',
    success: 'Thank you! We will contact you shortly.',
    questions: {
      '0': {
        q: 'What industry is your business in?',
        options: {
          'Услуги / Консалтинг': 'Services / Consulting',
          'Торговля (Опт/Розница)': 'Trade (Wholesale/Retail)',
          'Производство': 'Manufacturing',
          'IT / E-commerce': 'IT / E-commerce',
          'Другое': 'Other'
        }
      },
      '1': {
        q: 'How many employees do you have?',
        options: {
          'Я один / Нет сотрудников': 'Just me / No employees',
          'От 1 до 5': 'From 1 to 5',
          'От 6 до 20': 'From 6 to 20',
          'Более 20': 'More than 20'
        }
      },
      '2': {
        q: 'Your current status?',
        options: {
          'Только планирую открыть ИП/ТОО': 'Just planning to open IE/LLC',
          'ИП (Упрощенка)': 'IE (Simplified)',
          'ИП (Общеустановленный)': 'IE (General)',
          'ТОО': 'LLC',
          'Не уверен': 'Not sure'
        }
      }
    },
    resultsHeader: 'Survey results:\n',
    questionResult: 'Question:',
    answerResult: 'Answer:',
    prev: 'Back',
    next: 'Next',
    nextToForm: 'Next to form',
    question: 'Question',
    of: 'of',
    leaveContacts: 'Leave your contacts',
    name: 'Name',
    phoneOrEmail: 'Phone or e-mail',
    submit: 'Submit',
    restart: 'Start Over'
  },
  serviceModal: {
    validation: {
      fillContacts: 'Please fill in your name and phone number'
    },
    service: 'Service',
    close: 'Close',
    about: 'About the service',
    includes: 'What is included:',
    orderForm: {
      title: 'Leave a request',
      descriptionLoggedIn: 'Describe the task or click "Leave a request", and our specialist will contact you.',
      descriptionGuest: 'Fill out the form below so we can contact you and discuss the details.',
      name: 'How should we address you? *',
      phone: 'Phone number *',
      commentPlaceholder: 'For example: I need accounting for an LLC...',
      comment: 'Additional comment',
      date: 'Preferred call date (optional)',
      submitting: 'Submitting...',
      submit: 'Leave a request',
      authRequired: 'Authorization is required to submit a request.'
    },
    allServices: 'All services'
  }
};

Object.assign(ru, newDataRu);
Object.assign(en, newDataEn);

fs.writeFileSync(ruPath, JSON.stringify(ru, null, 2), 'utf8');
fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');

console.log('Quiz and ServiceModal translations updated successfully.');
