import { Header } from '@/widgets/header/Header';
import { Hero } from '@/widgets/hero/Hero';
import { WhyOutsource } from './sections/WhyOutsource';
import { HomeAbout } from './sections/HomeAbout';
import { HomeAdvantages } from './sections/HomeAdvantages';
import { Trust } from '@/widgets/trust/Trust';
import { HomeServices } from './sections/HomeServices';
import { PricingTable } from '@/widgets/pricing-table/PricingTable';
import { Section } from '@/shared/ui/Section';
import { Container } from '@/shared/ui/Container';
import { Reviews } from '@/widgets/reviews/Reviews';
import { Team } from '@/widgets/team/Team';
import { Offices } from '@/widgets/offices/Offices';
import { FaqContact } from '@/widgets/faq-contact';
import { Footer } from '@/widgets/footer/Footer';
import { SolutionPicker } from '@/features/solution-picker/SolutionPicker';

export function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <WhyOutsource />
        <HomeAbout />
        <HomeAdvantages />
        <Trust />
        <HomeServices />
        <Section className="bg-brand-green py-32 text-brand-beige">
          <Container>
            <div className="max-w-3xl mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 text-white/90 text-xs font-bold uppercase tracking-widest mb-6">
                <span className="w-2 h-2 rounded-full bg-brand-beige animate-pulse" />
                Тарифы обслуживания
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase leading-[1.1] tracking-tight text-white mb-6">
                Прозрачная стоимость <br />
                <span className="text-brand-beige/50">без скрытых платежей</span>
              </h2>
              <p className="text-xl text-brand-beige/80 font-medium leading-relaxed">
                Выберите подходящий тариф под масштаб вашего бизнеса или получите индивидуальный расчет.
              </p>
            </div>
            <PricingTable />
          </Container>
        </Section>
        <SolutionPicker />
        <Reviews />
        <Team />
        <Offices />
        <FaqContact />
      </main>
      <Footer />
    </>
  );
}
