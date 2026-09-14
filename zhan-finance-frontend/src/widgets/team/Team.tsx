import { motion } from 'framer-motion';
import { Section } from '@/shared/ui/Section';
import { Container } from '@/shared/ui/Container';
import { teamLeader, teamSpecialists } from '@/shared/config/content/team';
import { useTranslation } from 'react-i18next';

export function Team() {
  const { t } = useTranslation('landing');

  return (
    <Section className="bg-brand-beige py-16 lg:py-24 overflow-hidden">
      <Container className="max-w-[1200px]">
        {/* Heading */}
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase leading-[1.05] tracking-tight text-brand-green break-words">
            {t('team_title', { defaultValue: 'Команда' })} <br />
            <span className="text-brand-green/40">{t('team_subtitle', { defaultValue: 'экспертов' })}</span>
          </h2>
        </div>

        {/* --- РУКОВОДИТЕЛЬ (ВЫДЕЛЕН) --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-center gap-6 sm:gap-8 md:gap-12 p-6 sm:p-8 md:p-11 rounded-[24px] sm:rounded-[28px] bg-brand-green/[0.08] border border-brand-green/20 mb-10 sm:mb-14 shadow-sm"
        >
          <div className="shrink-0 w-44 h-56 sm:w-52 sm:h-64 md:w-56 md:h-72 rounded-[18px] sm:rounded-[20px] overflow-hidden bg-brand-green/10 border border-brand-green/20 relative shadow-inner">
            {teamLeader.photo ? (
              <img src={teamLeader.photo} alt={t(teamLeader.nameKey)} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-brand-green/40">
                <svg className="w-1/2 h-1/2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            )}
          </div>
          <div className="text-center md:text-left">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-green/70 mb-2">
              {t(teamLeader.roleKey)}
            </p>
            <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-brand-green leading-[1.15] mb-4">
              {t(teamLeader.nameKey)}
            </h3>
            {teamLeader.bioKey && (
              <p className="text-sm md:text-base text-brand-green/85 leading-relaxed max-w-xl">
                {t(teamLeader.bioKey)}
              </p>
            )}
          </div>
        </motion.div>

        {/* --- СЕТКА СПЕЦИАЛИСТОВ (4x2) --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {teamSpecialists.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              viewport={{ once: true }}
              className="group cursor-pointer"
            >
              {/* Card with Image & Hover Overlay */}
              <div className="relative aspect-[3/4] rounded-[24px] overflow-hidden bg-brand-green/[0.08] border border-brand-green/20 shadow-sm group-hover:shadow-xl group-hover:border-brand-green/40 transition-all duration-300">
                {/* Photo / Avatar */}
                {member.photo ? (
                  <img
                    src={member.photo}
                    alt={t(member.nameKey)}
                    className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105 group-hover:blur-md"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-green/40 pb-16 transition-all duration-300 group-hover:scale-105 group-hover:blur-md">
                    <svg className="w-1/2 h-1/2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                )}

                {/* Default State: Sleek floating soft green frosted-glass bottom panel */}
                <div className="absolute inset-x-3 bottom-3 p-3.5 rounded-2xl bg-brand-green/80 backdrop-blur-md border border-white/15 transition-opacity duration-300 group-hover:opacity-0 pointer-events-none text-left shadow-lg">
                  <p className="font-bold text-sm md:text-base text-brand-beige leading-snug mb-0.5">
                    {t(member.nameKey)}
                  </p>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-brand-beige/80">
                    {t(member.roleKey)}
                  </p>
                </div>

                {/* Hover State: Blurred photo underneath with soft green backdrop */}
                <div className="absolute inset-0 bg-brand-green/85 backdrop-blur-md p-6 flex flex-col justify-center items-center text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 text-brand-beige">
                  <p className="font-bold text-base md:text-lg text-brand-beige mb-1 leading-snug">
                    {t(member.nameKey)}
                  </p>
                  <p className="text-xs font-medium uppercase tracking-wider text-brand-beige/80 mb-3 pb-2 border-b border-brand-beige/20 w-3/4">
                    {t(member.roleKey)}
                  </p>
                  {member.bioKey && (
                    <p className="text-xs leading-relaxed text-brand-beige/90 font-normal">
                      {t(member.bioKey)}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
