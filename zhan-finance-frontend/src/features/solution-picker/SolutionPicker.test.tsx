/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SolutionPicker } from './SolutionPicker';
import * as http from '@/shared/api/http';

vi.mock('@/shared/api/http', () => ({
  apiRequest: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  }
}));

// Mock framer-motion to skip animations in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('SolutionPicker Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => render(<SolutionPicker />);

  it('completes the survey and submits the contact request', async () => {
    const apiRequestMock = vi.mocked(http.apiRequest).mockResolvedValueOnce({});
    
    renderComponent();
    
    // Step 1: select answer and next
    fireEvent.click(screen.getByText('ИП'));
    fireEvent.click(screen.getByRole('button', { name: /Далее/i }));
    
    // Step 2
    fireEvent.click(screen.getByText('1-3 млн'));
    fireEvent.click(screen.getByRole('button', { name: /Далее/i }));
    
    // Step 3
    fireEvent.click(screen.getByText('1–10'));
    fireEvent.click(screen.getByRole('button', { name: /Далее/i }));
    
    // Step 4
    fireEvent.click(screen.getByText('Бухгалтерия'));
    fireEvent.click(screen.getByRole('button', { name: /Далее/i }));
    
    // Step 5
    fireEvent.click(screen.getByText('1-3 дня'));
    fireEvent.click(screen.getByRole('button', { name: /Далее/i }));
    
    // Contact form
    expect(screen.getByText('Оставьте контакты')).toBeInTheDocument();
    
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'Ivan' } }); // name
    fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value: '7771112233' } }); // phone
    
    fireEvent.click(screen.getByRole('button', { name: /Отправить/i }));
    
    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith('/api/contact-requests', {
        method: 'POST',
        body: expect.stringContaining('"name":"Ivan","phone":"7771112233"')
      });
      expect(apiRequestMock.mock.calls[0][1]?.body).toContain('ИП');
    });
    
    expect(screen.getByText(/Спасибо! Мы свяжемся с вами в ближайшее время/i)).toBeInTheDocument();
  });
});
