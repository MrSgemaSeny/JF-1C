import { Header } from '@/widgets/header/Header';
import { Hero } from '@/widgets/hero/Hero';
import { HomeAbout } from './sections/HomeAbout';
import { HomeAdvantages } from './sections/HomeAdvantages';
import { Trust } from '@/widgets/trust/Trust';
import { HomeServices } from './sections/HomeServices';
import { Reviews } from '@/widgets/reviews/Reviews';
import { Team } from '@/widgets/team/Team';
import { Footer } from '@/widgets/footer/Footer';
import { SolutionPicker } from '@/features/solution-picker/SolutionPicker';

export function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <HomeAbout />
        <HomeAdvantages />
        <Trust />
        <HomeServices />
        <SolutionPicker />
        <Reviews />
        <Team />
      </main>
      <Footer />
    </>
  );
}
