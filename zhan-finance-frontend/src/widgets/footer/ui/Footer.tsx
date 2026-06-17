import { Container } from '@/shared/ui/Container';
import { ContactForm } from '@/features/contact-form';

export function Footer() {
  return (
    <footer id="contact" className="bg-brand-green text-brand-beige py-24 border-t border-brand-beige/20">
      <Container>
        <div className="grid lg:grid-cols-2 gap-16">
          <div className="space-y-12">
            <div>
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6">
                Остались <br />
                <span className="text-brand-beige">Вопросы?</span>
              </h2>
              <p className="text-xl font-medium text-brand-beige/80 max-w-md">
                Оставьте заявку, и наш ведущий специалист свяжется с вами для бесплатной консультации.
              </p>
            </div>

            <div className="space-y-6 text-xl font-bold uppercase tracking-widest">
              <div className="flex items-center gap-6">
                <div className="w-4 h-4 bg-brand-beige rounded-sm mt-2 shrink-0" />
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
                <div className="w-4 h-4 bg-brand-beige rounded-sm" />
                <span>г. Шымкент, Улица Байтерекова, 79а</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-4 h-4 bg-brand-beige rounded-sm" />
                <a href="mailto:zhan.finance@gmail.com" className="hover:text-brand-beige/80 transition-colors">
                  zhan.finance@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="bg-brand-beige text-brand-green p-10 md:p-12 rounded-2xl shadow-2xl">
            <ContactForm title="Связаться с нами" />
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
