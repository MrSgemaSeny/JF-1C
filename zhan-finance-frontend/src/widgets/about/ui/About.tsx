import { Section } from '@/shared/ui/Section';
import { motion } from 'framer-motion';
import { ROUTES } from '@/shared/config/routes';
import { Link } from 'react-router-dom';

const polaroids = [
  {
    id: 1,
    src: 'https://images.unsplash.com/photo-1554200876-56c2f25224fa?q=80&w=600&auto=format&fit=crop',
    alt: 'Office 1',
    rotation: -15,
    x: -60,
    y: -10,
    hoverX: -80,
    hoverY: -15,
    zIndex: 10,
  },
  {
    id: 2,
    src: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600&auto=format&fit=crop',
    alt: 'Office 2',
    rotation: 12,
    x: 80,
    y: -60,
    hoverX: 100,
    hoverY: -70,
    zIndex: 20,
  },
  {
    id: 3,
    src: 'https://images.unsplash.com/photo-1556761175-5973dc0f32d7?q=80&w=600&auto=format&fit=crop',
    alt: 'Office 3',
    rotation: -5,
    x: 20,
    y: 100,
    hoverX: 10,
    hoverY: 80,
    zIndex: 30,
  },
];

export function About() {
  return (
    <Section className="overflow-hidden min-h-screen flex items-center bg-white relative">
      <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center relative z-10 w-full">

        {/* Left column: Typography */}
        <div className="space-y-8 order-2 lg:order-1">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 text-brand-green/60 font-bold tracking-widest uppercase text-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-brand-green" />
              О нас
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase leading-[1.1] tracking-tight text-brand-green">
              ВЫБИРАЙТЕ <span className="italic font-light">СПОКОЙСТВИЕ</span> — <br />
              И ЗАНИМАЙТЕСЬ РОСТОМ <br />
              БИЗНЕСА
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-8 max-w-xl"
          >
            <p className="text-xl text-brand-green/80 leading-relaxed font-medium">
              Мы сами проходим проверки, тестируем схемы налогообложения и продумываем каждую
              деталь в учете — чтобы вам оставалось только масштабировать компанию.
            </p>

            <Link
              to={ROUTES.ABOUT}
              className="inline-block px-8 py-4 bg-brand-green text-brand-beige rounded-2xl font-bold uppercase tracking-wider hover:bg-brand-green/90 transition-all hover:-translate-y-1 shadow-lg shadow-brand-green/20"
            >
              Подробнее о нас
            </Link>
          </motion.div>
        </div>

        {/* Right column: Polaroids */}
        <div className="relative h-[500px] lg:h-[700px] w-full flex items-center justify-center order-1 lg:order-2">
          {polaroids.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 100, rotate: 0 }}
              whileInView={{ opacity: 1, y: p.y, x: p.x, rotate: p.rotation }}
              transition={{ duration: 0.8, delay: i * 0.2, type: 'spring', bounce: 0.4 }}
              viewport={{ once: true, margin: '-100px' }}
              className="absolute bg-brand-beige p-3 pb-12 shadow-2xl rounded-sm border border-brand-green/5"
              style={{ zIndex: p.zIndex, width: '280px' }}
              whileHover={{
                scale: 1.15,
                rotate: 0,
                x: p.hoverX,
                y: p.hoverY,
                zIndex: 50,
                boxShadow: '0px 30px 60px -15px rgba(0,86,45,0.4)',
                transition: { duration: 0.4, ease: 'easeOut' },
              }}
            >
              <div className="w-full h-[280px] bg-brand-green/10 overflow-hidden relative group">
                <img
                  src={p.src}
                  alt={p.alt}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700 ease-out"
                />
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </Section>
  );
}
