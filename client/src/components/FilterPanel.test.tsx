import { render, screen, fireEvent } from '@testing-library/react';
import "@testing-library/jest-dom";
import { describe, it, expect, vi } from 'vitest';
import { FilterPanel } from './FilterPanel';

describe('FilterPanel', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    timeWindow: 'any' as const,
    setTimeWindow: vi.fn(),
    selectedTags: [],
    toggleTag: vi.fn(),
    sortBy: 'recommended' as const,
    setSortBy: vi.fn(),
    allTags: ['Music', 'Art'],
    onClear: vi.fn(),
    onApply: vi.fn(),
  };

  it('renders nothing when closed', () => {
    render(<FilterPanel {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders filter options when open', () => {
    render(<FilterPanel {...defaultProps} />);
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('Sort')).toBeInTheDocument();
  });

  it('calls setTimeWindow when a time option is clicked', () => {
    render(<FilterPanel {...defaultProps} />);
    const todayOption = screen.getByText('Today');
    fireEvent.click(todayOption);
    expect(defaultProps.setTimeWindow).toHaveBeenCalledWith('today');
  });

  it('calls toggleTag when a tag is clicked', () => {
    render(<FilterPanel {...defaultProps} />);
    const musicTag = screen.getByText('Music');
    fireEvent.click(musicTag);
    expect(defaultProps.toggleTag).toHaveBeenCalledWith('Music');
  });

  it('calls setSortBy when a sort option is clicked', () => {
    render(<FilterPanel {...defaultProps} />);
    const soonestOption = screen.getByText('Soonest');
    fireEvent.click(soonestOption);
    expect(defaultProps.setSortBy).toHaveBeenCalledWith('soonest');
  });

  it('calls onClear and onApply when buttons are clicked', () => {
    render(<FilterPanel {...defaultProps} />);

    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);
    expect(defaultProps.onClear).toHaveBeenCalled();

    const applyButton = screen.getByText('Apply');
    fireEvent.click(applyButton);
    expect(defaultProps.onApply).toHaveBeenCalled();
  });
});
