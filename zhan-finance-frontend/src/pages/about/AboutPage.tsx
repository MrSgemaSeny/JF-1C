import { Header } from '@/widgets/header/Header';
import { Footer } from '@/widgets/footer/Footer';
import { AboutHero } from './sections/AboutHero';
import { AboutStats } from './sections/AboutStats';
import { AboutIdeology } from './sections/AboutIdeology';
import { AboutProcess } from './sections/AboutProcess';
import { AboutGuarantees } from './sections/AboutGuarantees';

export function AboutPage() {
  return (
    <>
      <Header />
      <main>
        <AboutHero />
        <AboutStats />
        <AboutIdeology />
        <AboutProcess />
        <AboutGuarantees />
      </main>
      <Footer />
    </>
  );
}
