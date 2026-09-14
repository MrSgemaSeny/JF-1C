import { Section } from '@/shared/ui/Section';
import { useTranslation } from 'react-i18next';

export function AboutGuarantees() {
  const { t } = useTranslation('common');
  return (
    <Section className="bg-brand-green text-brand-beige border-t border-brand-green/10">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight leading-[1.1] mb-5 break-words">
          {t('about.guarantees.title', { defaultValue: 'Гарантии, закрепленные юридически' })}
        </h2>
        <div className="text-base sm:text-lg md:text-xl leading-relaxed text-brand-beige/80 space-y-4">
          <p>{t('about.guarantees.p1', { defaultValue: 'Финансовая безопасность и качество учета закрепляются договором с материальной ответственностью за допущенные ошибки согласно стандартам МСФО.' })}</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li><strong>{t('about.guarantees.items.0.title', { defaultValue: 'Финансовая безопасность:' })}</strong> {t('about.guarantees.items.0.text', { defaultValue: 'Полная компенсация штрафов и пеней, если они возникли из-за нашей ошибки.' })}</li>
            <li><strong>{t('about.guarantees.items.1.title', { defaultValue: 'Конфиденциальность (NDA):' })}</strong> {t('about.guarantees.items.1.text', { defaultValue: 'Строгий режим коммерческой тайны. Шифрованные каналы связи и защищенные серверы.' })}</li>
            <li><strong>{t('about.guarantees.items.2.title', { defaultValue: 'Непрерывность бизнеса:' })}</strong> {t('about.guarantees.items.2.text', { defaultValue: 'Никаких больничных, отпусков или внезапных увольнений. Сервис работает непрерывно.' })}</li>
            <li><strong>{t('about.guarantees.items.3.title', { defaultValue: 'Прозрачность цены:' })}</strong> {t('about.guarantees.items.3.text', { defaultValue: 'Вы платите за объем операций и сложность контура. Никаких скрытых платежей.' })}</li>
          </ul>
        </div>
      </div>
    </Section>
  );
}
