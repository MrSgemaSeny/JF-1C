import { Section } from '@/shared/ui/Section';
import { motion } from 'framer-motion';
import { teamRows } from '@/entities/team-member';
import type { TeamMember } from '@/entities/team-member';

function TeamCard({
  member,
  delay,
  isLead = false,
  isGreen = false,
}: {
  member: TeamMember;
  delay: number;
  isLead?: boolean;
  isGreen?: boolean;
}) {
  const useGreenTheme = isLead || isGreen;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className={[
        'rounded-3xl border p-5 shadow-lg shadow-brand-green/5 transition-transform duration-300 hover:-translate-y-1',
        useGreenTheme
          ? 'border-brand-green/20 bg-brand-green text-brand-beige'
          : 'border-brand-green/10 bg-brand-beige text-brand-green',
      ].join(' ')}
    >
      <div className="space-y-5">
        <div
          className={[
            'relative overflow-hidden rounded-[28px] border',
            useGreenTheme ? 'border-brand-beige/15 bg-brand-beige/10' : 'border-brand-green/10 bg-brand-green/5',
          ].join(' ')}
        >
          <div
            className={[
              'aspect-[3/4] w-full bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.45),_transparent_40%),linear-gradient(145deg,_rgba(0,86,45,0.08),_rgba(0,86,45,0.02))]',
              isLead ? 'mx-auto max-w-[320px]' : '',
            ].join(' ')}
          >
            {member.photo ? (
              <img src={member.photo} alt={member.name} className="h-full w-full object-cover" />
            ) : (
              <div
                className={[
                  'flex h-full w-full flex-col items-center justify-center p-5 text-center',
                  useGreenTheme ? 'text-brand-beige' : 'text-brand-green',
                ].join(' ')}
              >
                <div
                  className={[
                    'mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border text-sm font-black uppercase tracking-[0.3em] backdrop-blur-sm',
                    useGreenTheme
                      ? 'border-brand-beige/20 bg-brand-beige/10'
                      : 'border-brand-green/15 bg-brand-beige/70',
                  ].join(' ')}
                >
                  Фото
                </div>
                <p className="text-sm uppercase tracking-[0.28em] font-bold opacity-70">
                  Шаблон под фотографию 3:4
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 px-1">
          <p
            className={[
              'text-sm uppercase tracking-[0.2em] font-bold',
              isLead ? 'text-brand-beige/75' : 'text-brand-green/60',
            ].join(' ')}
          >
            {isLead ? 'Начальник' : 'Команда'}
          </p>
          <h3 className="mt-2 text-xl font-black uppercase leading-tight">{member.name}</h3>
          <p
            className={[
              'mt-3 text-sm font-medium leading-relaxed',
              isLead ? 'text-brand-beige/80' : 'text-brand-green/70',
            ].join(' ')}
          >
            {member.role}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function Team() {
  return (
    <Section className="bg-white text-brand-green border-t border-brand-green/10" id="team">
      <div className="mb-14 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 text-brand-green/60 font-bold tracking-widest uppercase text-sm mb-4"
        >
          <span className="w-2 h-2 rounded-full bg-brand-green" />
          Наша команда
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-black uppercase tracking-tight"
        >
          Люди, которые ведут ваш учет
        </motion.h2>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 justify-items-center">
          <div className="w-full max-w-xl">
            <TeamCard member={teamRows[0][0]} delay={0} isLead />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {teamRows[1].map((member, index) => (
            <TeamCard key={member.name + member.role} member={member} delay={0.1 + index * 0.08} />
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
          {teamRows[2].map((member, index) => (
            <TeamCard key={member.name + member.role} member={member} delay={0.2 + index * 0.08} isGreen />
          ))}
        </div>
      </div>
    </Section>
  );
}
