import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '../components/Footer.jsx';

describe('Footer', () => {
  it('renders copyright text', () => {
    render(<Footer />);
    expect(screen.getByText(/Virgin Money/)).toBeInTheDocument();
  });

  it('renders GitHub API attribution link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /GitHub Copilot REST API/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://docs.github.com/en/rest/copilot');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('has contentinfo landmark role', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
