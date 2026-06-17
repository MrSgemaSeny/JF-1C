export interface Question {
  id: string;
  q: string;
  options: string[];
}

export const questions: Question[] = [
  { id: 'form',      q: 'Какая у вас форма бизнеса?',              options: ['ИП', 'ТОО', 'Другое'] },
  { id: 'turnover',  q: 'Примерный годовой оборот (диапазон)?',    options: ['1-3 млн', '4-10 млн', '10+ млн'] },
  { id: 'employees', q: 'Кол-во сотрудников?',                     options: ['1–10', '11–50', '50+'] },
  { id: 'needs',     q: 'Что для вас важнее прямо сейчас?',        options: ['Бухгалтерия', 'Налоги', 'Кадры', 'Юридическая защита'] },
  { id: 'timeline',  q: 'Срок внедрения решения?',                 options: ['В течение дня', '1-3 дня', 'Более 3 дней'] },
];
