import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('handles conditional classes', () => {
    expect(cn('class1', true && 'class2', false && 'class3')).toBe('class1 class2');
  });

  it('merges tailwind conflicts correctly', () => {
    // Assuming tailwind-merge resolves this by taking the last class
    expect(cn('p-4 p-2', 'p-8')).toBe('p-8');
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('handles arrays and objects via clsx', () => {
    expect(cn('class1', ['class2', 'class3'])).toBe('class1 class2 class3');
    expect(cn('class1', { class2: true, class3: false })).toBe('class1 class2');
  });

  it('ignores null and undefined', () => {
    expect(cn('class1', null, undefined, 'class2')).toBe('class1 class2');
  });
});
