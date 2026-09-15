import { TFunction } from 'i18next';

export function translateNotificationTitle(title: string, lang: string): string {
  if (!title || lang === 'ru') return title;

  if (title.startsWith('Новый лид:')) {
    if (lang === 'en') return title.replace('Новый лид:', 'New lead:');
    if (lang === 'kk') return title.replace('Новый лид:', 'Жаңа өтінім:');
    if (lang === 'zh') return title.replace('Новый лид:', '新意向线索：');
  }

  const enMap: Record<string, string> = {
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
    'Горит дедлайн!': 'Deadline due today!',
    'Приближается дедлайн': 'Deadline approaching',
    'Новый документ': 'New document',
    'Документ прикреплен': 'Document attached',
    'Аккаунт подтвержден': 'Account approved',
  };

  const kkMap: Record<string, string> = {
    'Запрос на услугу принят': 'Қызметке сұраныс қабылданды',
    'Новая задача': 'Жаңа тапсырма',
    'Новая задача от клиента': 'Клиенттен жаңа тапсырма',
    'Успешное редактирование': 'Тапсырма сәтті өңделді',
    'Клиент отредактировал задачу': 'Клиент тапсырманы өңдеді',
    'Статус задачи изменен': 'Тапсырма күйі өзгертілді',
    'Смена исполнителя': 'Орындаушы ауыстырылды',
    'Запрос на отказ от задачи': 'Тапсырмадан бас тарту сұранысы',
    'Отказ подтвержден': 'Бас тарту расталды',
    'Отказ отклонен': 'Бас тарту қабылданбады',
    'Обновление задачи': 'Тапсырма жаңартылды',
    'Новый комментарий': 'Жаңа пікір',
    'Новый комментарий от клиента': 'Клиенттен жаңа пікір',
    'Клиент удалил задачу': 'Клиент тапсырманы жойды',
    'Горит дедлайн!': 'Дедлайн мерзімі бүгін!',
    'Приближается дедлайн': 'Дедлайн жақындап қалды',
    'Новый документ': 'Жаңа құжат',
    'Документ прикреплен': 'Құжат тіркелді',
    'Аккаунт подтвержден': 'Аккаунт расталды',
  };

  const zhMap: Record<string, string> = {
    'Запрос на услугу принят': '服务申请已受理',
    'Новая задача': '新任务事项',
    'Новая задача от клиента': '来自客户的新任务',
    'Успешное редактирование': '任务修改成功',
    'Клиент отредактировал задачу': '客户修改了任务',
    'Статус задачи изменен': '任务状态已更新',
    'Смена исполнителя': '执行专员已变更',
    'Запрос на отказ от задачи': '已申请任务重调',
    'Отказ подтвержден': '任务重调已批准',
    'Отказ отклонен': '任务重调已驳回',
    'Обновление задачи': '任务已更新',
    'Новый комментарий': '新增留言',
    'Новый комментарий от клиента': '来自客户的新留言',
    'Клиент удалил задачу': '客户删除了任务',
    'Горит дедлайн!': '今日截止预警！',
    'Приближается дедлайн': '截止期临近提醒',
    'Новый документ': '新单据已生成',
    'Документ прикреплен': '单据已上传',
    'Аккаунт подтвержден': '账号审核通过',
  };

  if (lang === 'en') return enMap[title] || title;
  if (lang === 'kk') return kkMap[title] || title;
  if (lang === 'zh') return zhMap[title] || title;

  return title;
}

export function translateNotificationMessage(message: string, lang: string, t?: TFunction): string {
  if (!message || lang === 'ru') return message;

  let msg = message;

  // 1. Service request accepted pattern
  const serviceReqMatch = msg.match(/^Ваш запрос на услугу «(.+)» принят\. Мы свяжемся с вами в ближайшее время\.$/);
  if (serviceReqMatch) {
    const serviceName = serviceReqMatch[1];
    const translatedService = t ? t(`common:serviceNames.${serviceName}`, { defaultValue: serviceName }) : serviceName;
    if (lang === 'en') return `Your request for service "${translatedService}" has been accepted. We will contact you shortly.`;
    if (lang === 'kk') return `«${translatedService}» қызметіне өтінішіңіз қабылданды. Жақын арада сізбен байланысамыз.`;
    if (lang === 'zh') return `您申请的“${translatedService}”服务已受理。我们将尽快与您取得联系。`;
  }

  // 2. Phone / Email prefix
  if (msg.startsWith('Телефон:')) {
    if (lang === 'en') msg = msg.replace('Телефон:', 'Phone:');
    if (lang === 'kk') msg = msg.replace('Телефон:', 'Телефон:');
    if (lang === 'zh') msg = msg.replace('Телефон:', '联系电话：');
  }

  // 3. New task created for you
  if (msg.startsWith('Вам создана новая задача:')) {
    const taskName = msg.replace('Вам создана новая задача:', '').trim();
    if (lang === 'en') return `A new task has been created for you: ${taskName}`;
    if (lang === 'kk') return `Сізге жаңа тапсырма жасалды: ${taskName}`;
    if (lang === 'zh') return `已为您创建新任务：${taskName}`;
  }

  // 4. Task assigned to you
  if (msg.startsWith('Вам назначена задача:')) {
    const taskName = msg.replace('Вам назначена задача:', '').trim();
    if (lang === 'en') return `Task assigned to you: ${taskName}`;
    if (lang === 'kk') return `Сізге тапсырма тағайындалды: ${taskName}`;
    if (lang === 'zh') return `已指派给您的任务：${taskName}`;
  }

  // 5. Client requested service
  const clientReqMatch = msg.match(/^Клиент (.+) создал запрос на услугу: (.+)$/);
  if (clientReqMatch) {
    if (lang === 'en') return `Client ${clientReqMatch[1]} requested service: ${clientReqMatch[2]}`;
    if (lang === 'kk') return `${clientReqMatch[1]} клиенті қызметке сұраныс жасады: ${clientReqMatch[2]}`;
    if (lang === 'zh') return `客户 ${clientReqMatch[1]} 提交了服务申请：${clientReqMatch[2]}`;
  }

  // 6. Status of your task changed
  const statusChangeMatch1 = msg.match(/^Статус вашей задачи '(.+)' изменен на: (.+)$/);
  if (statusChangeMatch1) {
    const stageName = statusChangeMatch1[2];
    const translatedStage = t ? t(`common:stages.${stageName}`, { defaultValue: stageName }) : stageName;
    if (lang === 'en') return `The status of your task '${statusChangeMatch1[1]}' was changed to: ${translatedStage}`;
    if (lang === 'kk') return `'${statusChangeMatch1[1]}' тапсырмаңыздың күйі келесіге өзгертілді: ${translatedStage}`;
    if (lang === 'zh') return `您的任务“${statusChangeMatch1[1]}”状态已变更为：${translatedStage}`;
  }

  const statusChangeMatch2 = msg.match(/^Статус задачи '(.+)' изменен на: (.+)$/);
  if (statusChangeMatch2) {
    const stageName = statusChangeMatch2[2];
    const translatedStage = t ? t(`common:stages.${stageName}`, { defaultValue: stageName }) : stageName;
    if (lang === 'en') return `The status of task '${statusChangeMatch2[1]}' was changed to: ${translatedStage}`;
    if (lang === 'kk') return `'${statusChangeMatch2[1]}' тапсырмасының күйі келесіге өзгертілді: ${translatedStage}`;
    if (lang === 'zh') return `任务“${statusChangeMatch2[1]}”状态已变更为：${translatedStage}`;
  }

  // 7. Deadlines
  const deadlineTodayMatch = msg.match(/^Дедлайн по задаче '(.+)' наступает сегодня!$/);
  if (deadlineTodayMatch) {
    if (lang === 'en') return `Deadline for task '${deadlineTodayMatch[1]}' is today!`;
    if (lang === 'kk') return `'${deadlineTodayMatch[1]}' тапсырмасының дедлайны бүгін аяқталады!`;
    if (lang === 'zh') return `任务“${deadlineTodayMatch[1]}”的截止期限为今天！`;
  }

  const deadlineTomorrowMatch = msg.match(/^Дедлайн по задаче '(.+)' наступает завтра\.$/);
  if (deadlineTomorrowMatch) {
    if (lang === 'en') return `Deadline for task '${deadlineTomorrowMatch[1]}' is tomorrow.`;
    if (lang === 'kk') return `'${deadlineTomorrowMatch[1]}' тапсырмасының дедлайны ертең аяқталады.`;
    if (lang === 'zh') return `任务“${deadlineTomorrowMatch[1]}”的截止期限为明天。`;
  }

  return msg;
}
