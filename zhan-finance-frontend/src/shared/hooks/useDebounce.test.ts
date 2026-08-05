import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('debounces the value change', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Update value
    rerender({ value: 'updated', delay: 500 });
    
    // Should still be initial before timer runs
    expect(result.current).toBe('initial');

    // Fast-forward half the delay
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current).toBe('initial');

    // Fast-forward remaining delay
    act(() => {
      vi.advanceTimersByTime(250);
    });
    
    // Should be updated now
    expect(result.current).toBe('updated');
  });

  it('cancels previous timers on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    rerender({ value: 'update1', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(250);
    });

    rerender({ value: 'update2', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(250);
    });

    // It should NOT be update1, because its timer was cancelled when update2 happened
    expect(result.current).toBe('initial');

    // Fast-forward another 250ms to finish update2's timer
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(result.current).toBe('update2');
  });

  it('clears the timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    const { unmount, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );
    
    rerender({ value: 'update', delay: 500 });
    
    // Unmount before the timer finishes
    unmount();
    
    // clearTimeout should have been called on unmount
    expect(clearTimeoutSpy).toHaveBeenCalled();
    
    clearTimeoutSpy.mockRestore();
  });
});
