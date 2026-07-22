import { TFunction } from 'i18next';

export function translateNotificationTitle(title: string, lang: string): string {
  if (!title || lang !== 'en') return title;

  if (title.startsWith('Новый лид:')) {
    return title.replace('Новый лид:', 'New lead:');
  }

  const map: Record<string, string> = {
    'Запрос на услугу принят': 'Service request accepted',
    'Новая задача': 'New task',
    'Новая задача от клиента': 'New task from client',
    'Успешное редактирование': 'Task edited successfully',
    'Клиент отредактировал задачу': 'Client edited task',
    'Статус задачи изменен': 'Task status updated',
    'Смена исполнителя': 'Assignee changed',
    'Запрос на отказ от задачи': 'Reassignment requested',
    'Отказ подтвержден': 'Reassignment approved',
    'Отказ отклонен': 'Reassignment rejected',
    'Обновление задачи': 'Task updated',
    'Новый комментарий': 'New comment',
    'Новый комментарий от клиента': 'New comment from client',
    'Клиент удалил задачу': 'Client deleted task',
    '🔥 Горит дедлайн!': '🔥 Deadline due today!',
    '⏰ Приближается дедлайн': '⏰ Deadline approaching',
    'Новый документ': 'New document',
    'Документ прикреплен': 'Document attached',
    'Аккаунт подтвержден': 'Account approved',
  };

  return map[title] || title;
}

export function translateNotificationMessage(message: string, lang: string, t?: TFunction): string {
  if (!message || lang !== 'en') return message;

  let msg = message;

  // 1. "Ваш запрос на услугу «X» принят. Мы свяжемся с вами в ближайшее время."
  const serviceReqMatch = msg.match(/^Ваш запрос на услугу «(.+)» принят\. Мы свяжемся с вами в ближайшее время\.$/);
  if (serviceReqMatch) {
    const serviceName = serviceReqMatch[1];
    const translatedService = t ? t(`common:serviceNames.${serviceName}`, { defaultValue: serviceName }) : serviceName;
    return `Your request for service "${translatedService}" has been accepted. We will contact you shortly.`;
  }

  // 2. "Телефон: X, Email: Y" or "Телефон: X"
  if (msg.startsWith('Телефон:')) {
    msg = msg.replace('Телефон:', 'Phone:');
  }

  // 3. "Вам создана новая задача: X"
  if (msg.startsWith('Вам создана новая задача:')) {
    return msg.replace('Вам создана новая задача:', 'A new task has been created for you:');
  }

  // 4. "Создана новая задача: X для клиента Y"
  const newForClientMatch = msg.match(/^Создана новая задача: (.+) для клиента (.+)$/);
  if (newForClientMatch) {
    return `New task created: ${newForClientMatch[1]} for client ${newForClientMatch[2]}`;
  }

  // 5. "Вам назначена задача: X"
  if (msg.startsWith('Вам назначена задача:')) {
    return msg.replace('Вам назначена задача:', 'Task assigned to you:');
  }

  // 6. "Клиент X создал запрос на услугу: Y"
  const clientReqMatch = msg.match(/^Клиент (.+) создал запрос на услугу: (.+)$/);
  if (clientReqMatch) {
    return `Client ${clientReqMatch[1]} requested service: ${clientReqMatch[2]}`;
  }

  // 7. "Вы успешно отредактировали вашу задачу!"
  if (msg === 'Вы успешно отредактировали вашу задачу!') {
    return 'You have successfully edited your task!';
  }

  // 8. "Клиент X отредактировал задачу: Y"
  const clientEditMatch = msg.match(/^Клиент (.+) отредактировал задачу: (.+)$/);
  if (clientEditMatch) {
    return `Client ${clientEditMatch[1]} edited task: ${clientEditMatch[2]}`;
  }

  // 9. "Статус вашей задачи 'X' изменен на: Y" or "Статус задачи 'X' изменен на: Y"
  const statusChangeMatch1 = msg.match(/^Статус вашей задачи '(.+)' изменен на: (.+)$/);
  if (statusChangeMatch1) {
    const stageName = statusChangeMatch1[2];
    const translatedStage = t ? t(`common:stages.${stageName}`, { defaultValue: stageName }) : stageName;
    return `The status of your task '${statusChangeMatch1[1]}' was changed to: ${translatedStage}`;
  }

  const statusChangeMatch2 = msg.match(/^Статус задачи '(.+)' изменен на: (.+)$/);
  if (statusChangeMatch2) {
    const stageName = statusChangeMatch2[2];
    const translatedStage = t ? t(`common:stages.${stageName}`, { defaultValue: stageName }) : stageName;
    return `The status of task '${statusChangeMatch2[1]}' was changed to: ${translatedStage}`;
  }

  // 10. "Клиент X перевел задачу 'Y' в статус Z"
  const clientStageMatch = msg.match(/^Клиент (.+) перевел задачу '(.+)' в статус (.+)$/);
  if (clientStageMatch) {
    const stageName = clientStageMatch[3];
    const translatedStage = t ? t(`common:stages.${stageName}`, { defaultValue: stageName }) : stageName;
    return `Client ${clientStageMatch[1]} moved task '${clientStageMatch[2]}' to status ${translatedStage}`;
  }

  // 11. "Исполнитель задачи 'X' изменен на: Y"
  const assigneeMatch = msg.match(/^Исполнитель задачи '(.+)' изменен на: (.+)$/);
  if (assigneeMatch) {
    const assignee = assigneeMatch[2] === 'Не назначен' ? 'Unassigned' : assigneeMatch[2];
    return `Assignee for task '${assigneeMatch[1]}' changed to: ${assignee}`;
  }

  // 12. "Сотрудник X запросил отказ от задачи 'Y'"
  const reassignmentReqMatch = msg.match(/^Сотрудник (.+) запросил отказ от задачи '(.+)'$/);
  if (reassignmentReqMatch) {
    return `Employee ${reassignmentReqMatch[1]} requested reassignment for task '${reassignmentReqMatch[2]}'`;
  }

  // 13. "Администратор подтвердил ваш отказ от задачи 'Y'"
  const reassignmentApproveMatch = msg.match(/^Администратор подтвердил ваш отказ от задачи '(.+)'$/);
  if (reassignmentApproveMatch) {
    return `Admin approved your reassignment for task '${reassignmentApproveMatch[1]}'`;
  }

  // 14. "Администратор отклонил ваш запрос на отказ от задачи 'Y'"
  const reassignmentRejectMatch = msg.match(/^Администратор отклонил ваш запрос на отказ от задачи '(.+)'$/);
  if (reassignmentRejectMatch) {
    return `Admin rejected your reassignment request for task '${reassignmentRejectMatch[1]}'`;
  }

  // 15. "X перевел задачу 'Y' в статус Z"
  const userStageMatch = msg.match(/^(.+) перевел задачу '(.+)' в статус (.+)$/);
  if (userStageMatch) {
    const stageName = userStageMatch[3];
    const translatedStage = t ? t(`common:stages.${stageName}`, { defaultValue: stageName }) : stageName;
    return `${userStageMatch[1]} moved task '${userStageMatch[2]}' to status ${translatedStage}`;
  }

  // 16. "Новый комментарий к задаче 'X'"
  const commentMatch1 = msg.match(/^Новый комментарий к задаче '(.+)'$/);
  if (commentMatch1) {
    return `New comment on task '${commentMatch1[1]}'`;
  }

  // 17. "Клиент X оставил комментарий к задаче 'Y'"
  const commentMatch2 = msg.match(/^Клиент (.+) оставил комментарий к задаче '(.+)'$/);
  if (commentMatch2) {
    return `Client ${commentMatch2[1]} left a comment on task '${commentMatch2[2]}'`;
  }

  // 18. "Клиент X удалил задачу: Y"
  const deleteMatch = msg.match(/^Клиент (.+) удалил задачу: (.+)$/);
  if (deleteMatch) {
    return `Client ${deleteMatch[1]} deleted task: ${deleteMatch[2]}`;
  }

  // 19. "Дедлайн по задаче 'X' наступает сегодня!"
  const deadlineTodayMatch = msg.match(/^Дедлайн по задаче '(.+)' наступает сегодня!$/);
  if (deadlineTodayMatch) {
    return `Deadline for task '${deadlineTodayMatch[1]}' is today!`;
  }

  // 20. "Дедлайн по задаче 'X' наступает завтра."
  const deadlineTomorrowMatch = msg.match(/^Дедлайн по задаче '(.+)' наступает завтра\.$/);
  if (deadlineTomorrowMatch) {
    return `Deadline for task '${deadlineTomorrowMatch[1]}' is tomorrow.`;
  }

  return msg;
}
