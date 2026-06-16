import { Container } from '@/shared/ui/Container';
import { mockServices } from '@/entities/service/model';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

export function ServicesList() {
  return (
    <section id="services" className="py-24 bg-white">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-brand-green mb-4">Наши услуги</h2>
          <p className="text-lg text-slate-600">
            Мы предлагаем решения, которые снимают с вас рутину и защищают от штрафов.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {mockServices.map((service) => (
            <div 
              key={service.id} 
              className="bg-brand-beige/30 rounded-2xl p-8 border border-brand-green/10 hover:border-brand-green/30 transition-colors flex flex-col"
            >
              <h3 className="text-2xl font-bold text-brand-green mb-3">{service.title}</h3>
              <p className="text-slate-600 mb-6 flex-grow">{service.description}</p>
              
              <div className="text-xl font-semibold text-slate-900 mb-6">
                {service.price}
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                {service.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button variant="outline" className="w-full bg-white">Подробнее</Button>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
