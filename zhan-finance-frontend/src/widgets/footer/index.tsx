import { Container } from '@/shared/ui/Container';

export function Footer() {
  return (
    <footer className="bg-brand-green text-brand-beige py-24 border-t border-brand-beige/20">
      <Container>
        <div className="grid lg:grid-cols-2 gap-16">
          
          <div className="space-y-12">
            <div>
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6">
                Остались <br/>
                <span className="text-brand-beige">Вопросы?</span>
              </h2>
              <p className="text-xl font-medium text-brand-beige/80 max-w-md">
                Оставьте заявку, и наш ведущий специалист свяжется с вами для бесплатной консультации.
              </p>
            </div>

            <div className="space-y-6 text-xl font-bold uppercase tracking-widest">
              <div className="flex items-center gap-6">
                <div className="w-4 h-4 bg-brand-beige rounded-sm mt-2 shrink-0"></div>
                <div className="flex flex-col gap-2 normal-case tracking-normal">
                  <a href="tel:+77759573787" className="hover:text-brand-beige/80 transition-colors">
                    +7‒775‒957‒37‒87
                  </a>
                  <a href="tel:+77252522309" className="hover:text-brand-beige/80 transition-colors">
                    +7 (7252) 52‒23‒09
                  </a>
                  <a href="tel:+77753855077" className="hover:text-brand-beige/80 transition-colors">
                    +7‒775‒385‒50‒77
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-4 h-4 bg-brand-beige rounded-sm"></div>
                <span>​г. Шымкент, Улица Байтерекова, 79а</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-4 h-4 bg-brand-beige rounded-sm"></div>
                <a href="mailto:zhan.finance@gmail.com" className="hover:text-brand-beige/80 transition-colors">zhan.finance@gmail.com</a>
              </div>
            </div>
          </div>

          <div className="bg-brand-beige text-brand-green p-10 md:p-12 rounded-2xl shadow-2xl">
            <h3 className="text-3xl font-black uppercase mb-8">Связаться с нами</h3>
            
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wider text-brand-green/70">Ваше имя</label>
                <input type="text" className="w-full bg-brand-green/5 border-b-2 border-brand-green/20 px-4 py-3 focus:outline-none focus:border-brand-green transition-colors rounded-t-xl font-medium" placeholder="Иван Иванов" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wider text-brand-green/70">Телефон</label>
                <input type="tel" className="w-full bg-brand-green/5 border-b-2 border-brand-green/20 px-4 py-3 focus:outline-none focus:border-brand-green transition-colors rounded-t-xl font-medium" placeholder="+7 (___) ___-__-__" />
              </div>
              <button type="button" className="w-full mt-4 bg-brand-green text-brand-beige py-5 rounded-xl text-lg font-bold uppercase tracking-wider hover:bg-brand-green/90 hover:text-white transition-all">
                Отправить заявку
              </button>
            </form>
          </div>

        </div>

        <div className="mt-24 pt-8 border-t border-brand-beige/10 flex flex-col md:flex-row justify-between items-center text-sm text-brand-beige/50 font-medium">
          <p>© 2026 Zhan Finance. Все права защищены.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-brand-beige/80">Политика конфиденциальности</a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
