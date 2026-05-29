import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { GitHubContext } from '../context/GitHubContext.jsx';

// Mock context value
const mockContext = {
  isConfigured: false,
  data: { lastFetched: null, loading: false, error: null },
  config: { token: '', org: '' },
  saveConfig: vi.fn(),
  fetchData: vi.fn(),
};

function renderHeader(contextOverrides = {}) {
  const ctx = { ...mockContext, ...contextOverrides };
  return render(
    <MemoryRouter>
      <GitHubContext.Provider value={ctx}>
        <Header />
      </GitHubContext.Provider>
    </MemoryRouter>
  );
}

describe('Header', () => {
  it('renders the logo text', () => {
    renderHeader();
    // Use getAllByText since "Copilot Insights" appears in both logo and nav link
    const matches = screen.getAllByText('Copilot Insights');
    expect(matches.length).toBeGreaterThan(0);
  });

  it('renders all nav items', () => {
    renderHeader();
    // Use getAllByText to handle desktop + mobile nav duplication
    expect(screen.getAllByText('Overview').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Active Users').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Copilot Insights').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Reports').length).toBeGreaterThan(0);
  });

  it('shows "Not connected" when not configured', () => {
    renderHeader({ isConfigured: false });
    expect(screen.getByText('Not connected')).toBeInTheDocument();
  });

  it('shows "Connected" when configured', () => {
    renderHeader({ isConfigured: true });
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('shows last updated time when data has been fetched', () => {
    const lastFetched = new Date('2024-01-15T10:30:00');
    renderHeader({ data: { lastFetched, loading: false, error: null } });
    expect(screen.getByText(/Updated/)).toBeInTheDocument();
  });

  it('renders hamburger button for mobile', () => {
    renderHeader();
    const hamburger = screen.getByRole('button', { name: /open navigation menu/i });
    expect(hamburger).toBeInTheDocument();
  });

  it('toggles mobile menu on hamburger click', async () => {
    const user = userEvent.setup();
    renderHeader();
    const hamburger = screen.getByRole('button', { name: /open navigation menu/i });
    await user.click(hamburger);
    expect(hamburger).toHaveAttribute('aria-expanded', 'true');
  });

  it('has a settings link', () => {
    renderHeader();
    const settingsLinks = screen.getAllByText(/Settings/i);
    expect(settingsLinks.length).toBeGreaterThan(0);
  });
});
