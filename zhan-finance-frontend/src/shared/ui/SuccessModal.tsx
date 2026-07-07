import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

export function SuccessModal({ isOpen, onClose, title = 'Успешно!', message }: SuccessModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-green/10">
              <CheckCircle2 className="h-8 w-8 text-brand-green" />
            </div>
            <h3 className="mb-4 text-2xl font-black uppercase text-brand-green">{title}</h3>
            <p className="mb-8 text-brand-green/70">{message}</p>
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-brand-green py-3.5 font-bold uppercase tracking-wider text-brand-beige transition hover:bg-brand-green/90"
            >
              Отлично
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
