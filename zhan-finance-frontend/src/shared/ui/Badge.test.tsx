import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './Badge';
import type { StageDto } from '@/entities/task/model/types';

describe('StatusBadge', () => {
  it('renders correctly with a stage', () => {
    const mockStage: StageDto = {
      id: 1,
      name: 'В работе',
      orderIndex: 0,
      type: 'OPEN',
      isDefault: false,
      color: '#ff0000',
      pipelineId: 1
    };
    render(<StatusBadge stage={mockStage} />);
    
    const badge = screen.getByText('В работе');
    expect(badge).toBeInTheDocument();
    // Use getAttribute to check style string
    expect(badge.getAttribute('style')).toContain('background-color: rgb(255, 0, 0)');
  });

  it('renders default message without a stage', () => {
    render(<StatusBadge />);
    
    const badge = screen.getByText('Нет стадии');
    expect(badge).toBeInTheDocument();
  });
});
