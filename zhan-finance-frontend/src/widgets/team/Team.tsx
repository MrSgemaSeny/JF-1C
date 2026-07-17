import { motion } from 'framer-motion';
import { Section } from '@/shared/ui/Section';
import { Container } from '@/shared/ui/Container';
import { teamRows } from '@/shared/config/content/team';
import { useTranslation } from 'react-i18next';

export function Team() {
  const { t } = useTranslation('common');
  return (
    <Section className="bg-brand-beige py-24 overflow-hidden">
      <Container>
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase leading-[1.1] tracking-tight text-brand-green">
            {t('team.title1', { defaultValue: 'Команда' })} <br />
            <span className="text-brand-green/40">{t('team.title2', { defaultValue: 'Zhan Finance' })}</span>
          </h2>
        </div>

        <div className="flex flex-col gap-8 md:gap-12 items-center">
          {teamRows.map((row, rowIndex) => (
            <div 
              key={rowIndex} 
              className={`w-full grid gap-x-4 gap-y-10 sm:gap-6 md:gap-8 justify-items-center mx-auto ${
                row.length === 1 ? 'grid-cols-1 max-w-sm' :
                row.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl' :
                row.length === 6 ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 max-w-[90rem]' :
                'flex flex-wrap justify-center'
              }`}
            >
              {row.map((member, colIndex) => (
                <motion.div
                  key={`${rowIndex}-${colIndex}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: colIndex * 0.1 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center text-center group w-full"
                >
                  <div className={`relative overflow-hidden rounded-[2rem] bg-brand-green/10 mb-6 transition-transform duration-500 group-hover:scale-105 aspect-[3/4] ${
                    member.highlight ? 'w-56 md:w-72' : 'w-40 md:w-48'
                  }`}>
                    {member.photo ? (
                      <img src={member.photo} alt={member.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-green/20">
                        <svg className="w-1/2 h-1/2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className={`font-black uppercase tracking-wider text-brand-green leading-tight mb-2 ${
                    member.highlight ? 'text-xl md:text-2xl' : 'text-sm md:text-base max-w-[200px]'
                  }`}>
                    {t(`team.members.${rowIndex}_${colIndex}.name`, { defaultValue: member.name })}
                  </h3>
                  <p className={`font-bold uppercase tracking-widest text-brand-green/50 ${
                    member.highlight ? 'text-sm' : 'text-[10px] md:text-xs'
                  }`}>
                    {t(`team.members.${rowIndex}_${colIndex}.role`, { defaultValue: member.role })}
                  </p>
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
