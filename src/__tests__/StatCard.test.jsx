import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard from '../components/StatCard.jsx';

describe('StatCard', () => {
  it('renders value and label', () => {
    render(<StatCard icon="📊" value={42} label="Total Seats" change={null} />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Total Seats')).toBeInTheDocument();
  });

  it('renders — when value is undefined', () => {
    render(<StatCard label="Test" />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows positive change indicator', () => {
    render(<StatCard value={10} label="Test" change={5} />);
    expect(screen.getByText(/5%/)).toBeInTheDocument();
    expect(screen.getByText(/▲/)).toBeInTheDocument();
  });

  it('shows negative change indicator', () => {
    render(<StatCard value={10} label="Test" change={-3} />);
    expect(screen.getByText(/3%/)).toBeInTheDocument();
    expect(screen.getByText(/▼/)).toBeInTheDocument();
  });

  it('does not render change when change is null', () => {
    const { container } = render(<StatCard value={10} label="Test" change={null} />);
    expect(container.querySelector('.stat-card__change')).not.toBeInTheDocument();
  });
});
