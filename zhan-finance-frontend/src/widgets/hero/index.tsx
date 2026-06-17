import { Container } from '@/shared/ui/Container';
import { motion } from 'framer-motion';

export function Hero() {
  return (
    <div className="relative min-h-screen flex items-center overflow-hidden bg-brand-beige pt-24">
      <Container className="relative z-10 w-full">
        <div className="grid lg:grid-cols-12 gap-16 items-center">

          {/* Текстовый блок */}
          <div className="lg:col-span-7 flex flex-col items-start">
            <motion.h1
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="text-5xl sm:text-7xl lg:text-[6.5rem] font-black uppercase leading-[0.92] tracking-tighter text-brand-green"
            >
              Надежный<br />
              Финансовый<br />
              Партнёр
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
              className="mt-8 text-xl md:text-2xl text-brand-green/70 max-w-lg font-medium leading-relaxed"
            >
              Берем на себя бухгалтерию, налоги и кадры. Вы фокусируетесь на росте бизнеса, мы — на безопасности.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: 'easeOut' }}
              className="mt-12"
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="h-16 px-12 rounded-xl bg-brand-green text-brand-beige flex items-center justify-center text-lg font-bold uppercase tracking-wider shadow-xl shadow-brand-green/15"
              >
                Начать
              </motion.button>
            </motion.div>
          </div>

          {/* Абстрактная композиция: слои-карточки в духе отчётов/документов */}
          <div className="lg:col-span-5 hidden lg:flex items-center justify-center">
            <div className="relative w-full max-w-md aspect-square">

              {/* Задняя карточка */}
              <motion.div
                initial={{ opacity: 0, y: 24, rotate: -6 }}
                animate={{ opacity: 1, y: 0, rotate: -6 }}
                transition={{ duration: 0.8, delay: 0.25, ease: 'easeOut' }}
                className="absolute inset-0 m-auto w-[78%] h-[68%] rounded-3xl bg-brand-green/10"
              />

              {/* Средняя карточка с псевдо-графиком роста */}
              <motion.div
                initial={{ opacity: 0, y: 16, rotate: 3 }}
                animate={{ opacity: 1, y: 0, rotate: 3 }}
                transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                className="absolute inset-0 m-auto w-[72%] h-[60%] rounded-3xl bg-brand-green/20 flex items-end p-6"
              >
                <svg viewBox="0 0 200 80" className="w-full h-2/3" fill="none">
                  <path
                    d="M4 64 L40 48 L76 56 L112 28 L148 36 L196 8"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-brand-green/50"
                  />
                </svg>
              </motion.div>

              {/* Передняя карточка — основной акцент */}
              <motion.div
                initial={{ opacity: 0, y: 0, rotate: -2, scale: 0.94 }}
                animate={{
                  opacity: 1,
                  y: [0, -10, 0],
                  rotate: -2,
                  scale: 1,
                }}
                transition={{
                  opacity: { duration: 0.8, delay: 0.5 },
                  scale: { duration: 0.8, delay: 0.5 },
                  y: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 },
                }}
                className="absolute inset-0 m-auto w-[62%] h-[72%] rounded-3xl bg-brand-green shadow-2xl shadow-brand-green/30 flex flex-col justify-between p-7"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-brand-beige/90" />
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="w-12 h-1.5 rounded-full bg-brand-beige/40" />
                    <div className="w-8 h-1.5 rounded-full bg-brand-beige/40" />
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <div className="w-full h-2 rounded-full bg-brand-beige/30" />
                  <div className="w-4/5 h-2 rounded-full bg-brand-beige/30" />
                  <div className="w-3/5 h-2 rounded-full bg-brand-beige/30" />
                </div>

                <div className="flex items-end justify-between">
                  <span className="text-brand-beige/90 text-3xl font-black tracking-tight">
                    100%
                  </span>
                  <span className="text-brand-beige/60 text-xs font-semibold uppercase tracking-wider">
                    надёжность
                  </span>
                </div>
              </motion.div>

            </div>
          </div>

        </div>
      </Container>
    </div>
  );
}

/* второй вариант - фотография
import { Container } from "@/shared/ui/Container";
import { motion } from "framer-motion";
import logoZf from "@/shared/assets/icons/logo-zf-2.jpg";

export function Hero() {
  return (
    <div className="relative min-h-screen flex items-center overflow-hidden bg-brand-beige pt-24">
      <Container className="relative z-10 w-full">
        <div className="grid lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-7 flex flex-col items-start">
            <motion.h1
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="text-5xl sm:text-7xl lg:text-[6.5rem] font-black uppercase leading-[0.92] tracking-tighter text-brand-green"
            >
              Надежный
              <br />
              Финансовый
              <br />
              Партнёр
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              className="mt-8 text-xl md:text-2xl text-brand-green/70 max-w-lg font-medium leading-relaxed"
            >
              Берем на себя бухгалтерию, налоги и кадры. Вы фокусируетесь на
              росте бизнеса, мы — на безопасности.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: "easeOut" }}
              className="mt-12"
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="h-16 px-12 rounded-xl bg-brand-green text-brand-beige flex items-center justify-center text-lg font-bold uppercase tracking-wider shadow-xl shadow-brand-green/15"
              >
                Начать
              </motion.button>
            </motion.div>
          </div>

          <div className="lg:col-span-5 hidden lg:flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="w-full max-w-md"
            >
              <img
                src={logoZf}
                alt="Zhan Finance"
                className="w-full h-auto object-contain mix-blend-multiply"
              />
            </motion.div>
          </div>
        </div>
      </Container>
    </div>
  );
}
 */