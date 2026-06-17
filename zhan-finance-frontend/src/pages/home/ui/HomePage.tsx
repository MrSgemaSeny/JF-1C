import { Header } from '@/widgets/header';
import { Hero } from '@/widgets/hero';
import { About } from '@/widgets/about';
import { Advantages } from '@/widgets/advantages';
import { Trust } from '@/widgets/trust';
import { Services } from '@/widgets/services';
import { Reviews } from '@/widgets/reviews';
import { Team } from '@/widgets/team';
import { Footer } from '@/widgets/footer';
import { SolutionPicker } from '@/features/solution-picker';

export function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Advantages />
        <Trust />
        <Services />
        <SolutionPicker />
        <Reviews />
        <Team />
      </main>
      <Footer />
    </>
  );
}
