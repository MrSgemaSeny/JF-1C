import { ReactNode, forwardRef } from 'react';
import { Container } from '../Container';
import { twMerge } from 'tailwind-merge';

interface SectionProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  id?: string;
}

export const Section = forwardRef<HTMLElement, SectionProps>(
  ({ children, className, containerClassName, id }, ref) => {
    return (
      <section ref={ref} id={id} className={twMerge('py-24 md:py-32 relative', className)}>
        <Container className={containerClassName}>
          {children}
        </Container>
      </section>
    );
  }
);
Section.displayName = 'Section';
