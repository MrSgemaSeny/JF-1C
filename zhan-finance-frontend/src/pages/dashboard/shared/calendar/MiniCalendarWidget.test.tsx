import { render, screen } from '@testing-library/react';
import { MiniCalendarWidget } from './MiniCalendarWidget';
import { vi, describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// Mocks
vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'EMPLOYEE' } })
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'ru' }
  })
}));

vi.mock('@/entities/calendar/api/calendarApi', () => ({
  getCalendarEvents: vi.fn().mockResolvedValue([])
}));

describe('MiniCalendarWidget', () => {
  it('renders the calendar and ensures days have the relative class to prevent badge escaping', async () => {
    render(
      <BrowserRouter>
        <MiniCalendarWidget />
      </BrowserRouter>
    );
    
    // Wait for calendar to render days
    const dayCells = await screen.findAllByText(/^[1-9]$|^[1-2][0-9]$|^3[0-1]$/);
    expect(dayCells.length).toBeGreaterThan(27); // At least 28 days

    // Check that the parent div of a day cell has the 'relative' class
    const firstDayCell = dayCells[0];
    expect(firstDayCell.parentElement?.className).toContain('relative');
  });
});
