import { Container } from '@/shared/ui/Container';
import { Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { ROUTES } from '@/shared/config/routes';

export function Header() {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="fixed top-0 z-50 w-full border-b border-brand-green/10 glass-panel"
    >
      <Container>
        <div className="flex h-20 items-center justify-between">
          <Link to={ROUTES.HOME} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-brand-green flex items-center justify-center -rotate-6 shadow-lg shadow-brand-green/20">
              <Briefcase className="h-5 w-5 text-brand-beige" />
            </div>
            <span className="text-2xl font-bold text-brand-green tracking-tight">
              Zhan<span className="font-light">Finance</span>
            </span>
          </Link>

          <nav className="hidden md:flex gap-8 bg-white/50 px-8 py-3 rounded-full border border-brand-green/10">
            <Link
              to={ROUTES.HOME}
              className="text-sm font-bold text-brand-green/70 hover:text-brand-green transition-colors uppercase tracking-widest"
            >
              Главная
            </Link>
            <Link
              to={ROUTES.ABOUT}
              className="text-sm font-bold text-brand-green/70 hover:text-brand-green transition-colors uppercase tracking-widest"
            >
              О нас
            </Link>
            <Link
              to={ROUTES.SERVICES}
              className="text-sm font-bold text-brand-green/70 hover:text-brand-green transition-colors uppercase tracking-widest"
            >
              Услуги
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <a
              href="#contact"
              className="hidden sm:inline-flex px-6 py-2.5 bg-brand-green text-brand-beige rounded-full text-sm font-bold hover:bg-brand-green/90 transition-all hover:scale-105 shadow-xl shadow-brand-green/20"
            >
              Связаться
            </a>
          </div>
        </div>
      </Container>
    </motion.header>
  );
}
