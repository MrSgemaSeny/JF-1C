import { TFunction } from 'i18next';

import { i18n } from 'i18next';

export function translateServiceName(service: { title: string; titleEn?: string } | undefined, t: TFunction, i18nInstance: i18n): string {
  if (!service) return '';
  if (i18nInstance.language === 'en' && service.titleEn) return service.titleEn;
  return t(`common:serviceNames.${service.title}`, { defaultValue: service.title });
}

export function translateServiceDesc(service: { description: string; descriptionEn?: string } | undefined, t: TFunction, i18nInstance: i18n): string {
  if (!service) return '';
  if (i18nInstance.language === 'en' && service.descriptionEn) return service.descriptionEn;
  return t(`common:serviceDescriptions.${service.description}`, { defaultValue: service.description });
}

export function translateStageName(stage: { name: string; nameEn?: string } | undefined, t: TFunction, i18nInstance: i18n): string {
  if (!stage) return '';
  if (i18nInstance.language === 'en' && stage.nameEn) return stage.nameEn;
  return t(`common:stages.${stage.name}`, { defaultValue: stage.name });
}

export function translateTaskTitle(title: string | undefined, t: TFunction): string {
  if (!title) return '';
  
  let translatedTitle = title;
  
  const prefixes = [
    { ru: "Запрос на услугу:", key: "taskPrefixes.Запрос на услугу" },
    { ru: "Заказ услуги:", key: "taskPrefixes.Заказ услуги" }
  ];

  for (const prefix of prefixes) {
    if (translatedTitle.startsWith(prefix.ru)) {
      const translatedPrefix = t(`common:${prefix.key}`, { defaultValue: prefix.ru.replace(':', '') }) + ':';
      const rest = translatedTitle.substring(prefix.ru.length).trim();
      
      const translatedRest = t(`common:serviceNames.${rest}`, { defaultValue: rest });
      
      return `${translatedPrefix} ${translatedRest}`;
    }
  }
  
  return translatedTitle;
}
