import { ReactNode } from 'react';
import { Container } from '../Container';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SectionProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  id?: string;
}

export function Section({ children, className, containerClassName, id }: SectionProps) {
  return (
    <section id={id} className={twMerge('py-24 md:py-32 relative', className)}>
      <Container className={containerClassName}>
        {children}
      </Container>
    </section>
  );
}
