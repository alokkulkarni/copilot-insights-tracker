import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App.jsx';

// App.jsx uses Routes (no BrowserRouter) — BrowserRouter is in main.jsx.
// In tests we wrap with MemoryRouter.
function renderApp(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>
  );
}

describe('App', () => {
  it('renders header and footer', () => {
    renderApp();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('renders main content area', () => {
    renderApp();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('shows not-connected state on overview when unconfigured', () => {
    renderApp();
    // "Not connected" appears in both the header status and the overview empty state
    const matches = screen.getAllByText(/Not connected/i);
    expect(matches.length).toBeGreaterThan(0);
  });
});
