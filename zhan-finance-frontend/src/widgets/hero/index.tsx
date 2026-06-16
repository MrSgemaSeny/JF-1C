import { Container } from '@/shared/ui/Container';
import { motion } from 'framer-motion';

export function Hero() {
  return (
    <div className="relative min-h-screen flex items-center overflow-hidden bg-brand-beige pt-20">
      <Container className="relative z-10 w-full">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-8 flex flex-col items-start space-y-10">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h1 className="text-5xl sm:text-7xl lg:text-[6.5rem] font-black uppercase leading-[0.9] tracking-tighter text-brand-green space-y-4">
                <span className="relative inline-block">
                  <span className="absolute -inset-6 bg-brand-green/10 rounded-2xl -z-10"></span>
                  Надежный
                </span><br/>
                Финансовый<br/>
                <span className="font-light italic text-brand-green/80 space-y-4">партнёр</span>
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-8 pt-8 w-full relative"
            >
              <p className="text-1.5xl md:text-3xl text-brand-green/80 max-w-xl font-medium leading-relaxed">
                Берем на себя бухгалтерию, налоги и кадры. Вы фокусируетесь на росте бизнеса, мы — на безопасности.
              </p>
              
              <div className="sm:ml-auto relative">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-40 h-16 rounded-xl bg-brand-green text-brand-beige flex items-center justify-center text-xl font-bold uppercase tracking-wider shadow-xl shadow-brand-green/20"
                >
                  Начать
                </motion.button>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-4 hidden lg:block">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="w-full aspect-[4/6] bg-brand-green rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl shadow-brand-green/20"
            >
              <div className="text-brand-beige space-y-2 relative z-10">
                <h3 className="text-5xl font-black mb-4">100%</h3>
                <p className="text-brand-beige/70 uppercase tracking-widest text-sm font-bold">Гарантия результата</p>
              </div>

              <div className="relative z-10 p-6 bg-brand-beige/10 backdrop-blur-md rounded-xl border border-white/10">
                <p className="text-brand-beige/90 text-sm font-medium leading-relaxed">
                  "Помогаем бизнесу экономить легально."
                </p>
              </div>
              <div className="relative z-10 p-6 bg-brand-beige/10 backdrop-blur-md rounded-xl border border-white/10">
                <p className="text-brand-beige/90 text-sm font-medium leading-relaxed">
                  "Берем на себя учет — вы занимаетесь ростом."
                </p>
              </div>
              <div className="relative z-10 p-6 bg-brand-beige/10 backdrop-blur-md rounded-xl border border-white/10">
                <p className="text-brand-beige/90 text-sm font-medium leading-relaxed">
                  "Каждая цифра проверена, каждый отчет — вовремя."
                </p>
              </div>
            </motion.div>
          </div>
          
        </div>
      </Container>
    </div>
  );
}
