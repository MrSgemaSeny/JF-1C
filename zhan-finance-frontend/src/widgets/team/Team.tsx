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
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase leading-[1.05] tracking-tight text-brand-green">
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
          className="flex flex-col md:flex-row items-center gap-8 md:gap-12 p-8 md:p-11 rounded-[28px] bg-brand-green/[0.08] border border-brand-green/20 mb-14 shadow-sm"
        >
          <div className="shrink-0 w-52 h-64 md:w-56 md:h-72 rounded-[20px] overflow-hidden bg-brand-green/10 border border-brand-green/20 relative shadow-inner">
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
            <span className="inline-block text-[11px] font-black uppercase tracking-widest text-brand-green bg-brand-green/[0.06] border border-brand-green/40 rounded-full px-4 py-1.5 mb-4">
              {t(teamLeader.roleKey)}
            </span>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamSpecialists.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              viewport={{ once: true }}
              className="flex flex-col group cursor-pointer"
            >
              {/* Card with Image & Hover Overlay */}
              <div className="relative aspect-[3/4] rounded-[20px] overflow-hidden bg-brand-green/[0.08] border border-brand-green/20 shadow-sm group-hover:shadow-xl group-hover:border-brand-green/40 transition-all duration-300">
                {member.photo ? (
                  <img src={member.photo} alt={t(member.nameKey)} className="w-full h-full object-cover group-hover:blur-[2px] group-hover:brightness-75 transition-all duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-green/40 group-hover:blur-[2px] group-hover:brightness-75 transition-all duration-300">
                    <svg className="w-1/2 h-1/2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                )}

                {/* Overlay with Bio on Hover */}
                {member.bioKey && (
                  <div className="absolute inset-0 bg-[#003C1F]/95 backdrop-blur-sm p-5 flex flex-col justify-center items-center text-center opacity-0 group-hover:opacity-100 transition-opacity duration-250 z-10 text-white">
                    <p className="font-black uppercase text-sm mb-1.5 text-white tracking-wider leading-tight">
                      {t(member.nameKey)}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-beige/85 mb-3">
                      {t(member.roleKey)}
                    </p>
                    <p className="text-xs leading-relaxed text-white/90">
                      {t(member.bioKey)}
                    </p>
                  </div>
                )}
              </div>

              {/* Labels below card */}
              <div className="mt-3 px-1 text-left">
                <p className="text-sm font-black uppercase tracking-wide text-brand-green leading-tight mb-1">
                  {t(member.nameKey)}
                </p>
                <p className="text-[11px] font-bold uppercase tracking-wider text-brand-green/70">
                  {t(member.roleKey)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
