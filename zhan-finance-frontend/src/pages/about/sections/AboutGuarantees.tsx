import { ShieldCheck } from 'lucide-react';
import { Section } from '@/shared/ui/Section';

export function AboutGuarantees() {
  return (
    <Section className="bg-brand-green text-brand-beige border-t border-brand-green/10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 text-brand-beige/70 font-bold tracking-widest uppercase text-sm mb-3">
          <ShieldCheck className="h-4 w-4" />
          Ответственность
        </div>
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-[1.1] mb-5">
          Гарантии, закрепленные юридически
        </h2>
        <div className="text-lg md:text-xl leading-relaxed text-brand-beige/80 space-y-4">
          <p>Слова &quot;мы профессионалы&quot; ничего не стоят без финансовой ответственности. Наша уверенность в своих процессах позволяет нам брать на себя 100% материальных рисков.</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li><strong>Финансовая безопасность:</strong> Полная компенсация штрафов и пеней, если они возникли из-за нашей ошибки.</li>
            <li><strong>Конфиденциальность (NDA):</strong> Строгий режим коммерческой тайны. Шифрованные каналы связи и защищенные серверы.</li>
            <li><strong>Непрерывность бизнеса:</strong> Никаких больничных, отпусков или внезапных увольнений. Сервис работает непрерывно.</li>
            <li><strong>Прозрачность цены:</strong> Вы платите за объем операций и сложность контура. Никаких скрытых платежей.</li>
          </ul>
        </div>
      </div>
    </Section>
  );
}
