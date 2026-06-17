import { Header } from '@/widgets/header';
import { Hero } from '@/widgets/hero';
import { About } from '@/widgets/about';
import { Advantages } from '@/widgets/advantages';
import { Trust } from '@/widgets/trust';
import { Services } from '@/widgets/services';
import { SolutionPicker } from '@/widgets/solutionPicker';
import { Reviews } from '@/widgets/reviews';
import { Team } from '@/widgets/team';
import { Footer } from '@/widgets/footer';

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
