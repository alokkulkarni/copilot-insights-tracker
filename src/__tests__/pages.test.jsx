import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { GitHubContext } from '../context/GitHubContext.jsx';
import Overview from '../pages/Overview.jsx';
import ActiveUsers from '../pages/ActiveUsers.jsx';
import CopilotInsights from '../pages/CopilotInsights.jsx';
import Reports from '../pages/Reports.jsx';
import Setup from '../pages/Setup.jsx';

// Recharts ResizeObserver stub
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// ── Context helpers ───────────────────────────────────────────────────────────

const baseData = {
  copilotUsage: null,
  copilotSeats: null,
  orgMembers: null,
  loading: false,
  error: null,
  lastFetched: null,
};

const mockUsage = [
  {
    day: '2024-01-10',
    total_suggestions_count: 100,
    total_acceptances_count: 40,
    total_lines_suggested: 250,
    total_lines_accepted: 100,
    total_active_users: 8,
    breakdown: [
      { language: 'python', editor: 'vscode', suggestions_count: 60, acceptances_count: 25, lines_suggested: 150, lines_accepted: 60 },
    ],
  },
];

const mockSeats = {
  total_seats: 10,
  seats: [
    {
      assignee: { login: 'alice', avatar_url: null, name: 'Alice' },
      last_activity_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      plan_type: 'business',
    },
  ],
};

const mockMembers = [
  { login: 'alice', avatar_url: null },
  { login: 'bob', avatar_url: null },
];

function renderWithContext(ui, contextOverrides = {}) {
  const ctx = {
    isConfigured: false,
    config: { token: '', org: '' },
    saveConfig: vi.fn(),
    fetchData: vi.fn(),
    data: { ...baseData },
    ...contextOverrides,
  };
  return render(
    <MemoryRouter>
      <GitHubContext.Provider value={ctx}>
        {ui}
      </GitHubContext.Provider>
    </MemoryRouter>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────

describe('Overview page', () => {
  it('shows not-connected state when unconfigured', () => {
    renderWithContext(<Overview />);
    expect(screen.getByText(/Not connected/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go to Settings/i })).toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    renderWithContext(<Overview />, {
      isConfigured: true,
      data: { ...baseData, loading: true },
    });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error banner when there is an error', () => {
    renderWithContext(<Overview />, {
      isConfigured: true,
      data: { ...baseData, error: 'API rate limit exceeded' },
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/API rate limit exceeded/i)).toBeInTheDocument();
  });

  it('shows retry button on error', async () => {
    const fetchData = vi.fn();
    renderWithContext(<Overview />, {
      isConfigured: true,
      data: { ...baseData, error: 'Network error' },
      fetchData,
    });
    await userEvent.click(screen.getByRole('button', { name: /Retry/i }));
    expect(fetchData).toHaveBeenCalledOnce();
  });

  it('renders stats and charts when data is available', () => {
    renderWithContext(<Overview />, {
      isConfigured: true,
      data: {
        ...baseData,
        copilotUsage: mockUsage,
        copilotSeats: mockSeats,
        orgMembers: mockMembers,
      },
    });
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText(/Total Seats/i)).toBeInTheDocument();
  });
});

// ── ActiveUsers ───────────────────────────────────────────────────────────────

describe('ActiveUsers page', () => {
  it('shows not-connected state when unconfigured', () => {
    renderWithContext(<ActiveUsers />);
    expect(screen.getByText(/Not connected/i)).toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    renderWithContext(<ActiveUsers />, {
      isConfigured: true,
      data: { ...baseData, loading: true },
    });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error banner when there is an error', () => {
    renderWithContext(<ActiveUsers />, {
      isConfigured: true,
      data: { ...baseData, error: 'Forbidden' },
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders user table when data is available', () => {
    renderWithContext(<ActiveUsers />, {
      isConfigured: true,
      data: {
        ...baseData,
        copilotSeats: mockSeats,
        orgMembers: mockMembers,
      },
    });
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('@alice')).toBeInTheDocument();
  });

  it('filters users by search input', async () => {
    const user = userEvent.setup();
    renderWithContext(<ActiveUsers />, {
      isConfigured: true,
      data: {
        ...baseData,
        copilotSeats: mockSeats,
        orgMembers: mockMembers,
      },
    });
    const search = screen.getByRole('searchbox');
    await user.type(search, 'bob');
    expect(screen.queryByText('@alice')).not.toBeInTheDocument();
  });

  it('shows empty message when search has no results', async () => {
    const user = userEvent.setup();
    renderWithContext(<ActiveUsers />, {
      isConfigured: true,
      data: {
        ...baseData,
        copilotSeats: mockSeats,
        orgMembers: mockMembers,
      },
    });
    const search = screen.getByRole('searchbox');
    await user.type(search, 'zzznomatch');
    expect(screen.getByText(/No users match/i)).toBeInTheDocument();
  });

  it('changes sort order via dropdown', async () => {
    const user = userEvent.setup();
    renderWithContext(<ActiveUsers />, {
      isConfigured: true,
      data: {
        ...baseData,
        copilotSeats: mockSeats,
        orgMembers: mockMembers,
      },
    });
    const sortSelect = screen.getByRole('combobox', { name: /Sort by/i });
    await user.selectOptions(sortSelect, 'login_asc');
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('filters by active status via dropdown', async () => {
    const user = userEvent.setup();
    renderWithContext(<ActiveUsers />, {
      isConfigured: true,
      data: {
        ...baseData,
        copilotSeats: mockSeats,
        orgMembers: mockMembers,
      },
    });
    const filterSelect = screen.getByRole('combobox', { name: /Filter by status/i });
    await user.selectOptions(filterSelect, 'active');
    expect(screen.getByText('@alice')).toBeInTheDocument();
    expect(screen.queryByText('@bob')).not.toBeInTheDocument();
  });
});

// ── CopilotInsights ───────────────────────────────────────────────────────────

describe('CopilotInsights page', () => {
  it('shows not-connected state when unconfigured', () => {
    renderWithContext(<CopilotInsights />);
    expect(screen.getByText(/Not connected/i)).toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    renderWithContext(<CopilotInsights />, {
      isConfigured: true,
      data: { ...baseData, loading: true },
    });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error banner when there is an error', () => {
    renderWithContext(<CopilotInsights />, {
      isConfigured: true,
      data: { ...baseData, error: 'Unauthorized' },
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders insights tables when data is available', () => {
    renderWithContext(<CopilotInsights />, {
      isConfigured: true,
      data: {
        ...baseData,
        copilotUsage: mockUsage,
        copilotSeats: mockSeats,
        orgMembers: mockMembers,
      },
    });
    expect(screen.getByText(/Copilot Insights/i)).toBeInTheDocument();
    expect(screen.getByText(/By Language/i)).toBeInTheDocument();
    expect(screen.getByText(/By Editor/i)).toBeInTheDocument();
  });
});

// ── Reports ───────────────────────────────────────────────────────────────────

describe('Reports page', () => {
  it('shows not-connected state when unconfigured', () => {
    renderWithContext(<Reports />);
    expect(screen.getByText(/Not connected/i)).toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    renderWithContext(<Reports />, {
      isConfigured: true,
      data: { ...baseData, loading: true },
    });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders export buttons when data is available', () => {
    renderWithContext(<Reports />, {
      isConfigured: true,
      data: {
        ...baseData,
        copilotUsage: mockUsage,
        copilotSeats: mockSeats,
        orgMembers: mockMembers,
      },
    });
    expect(screen.getByRole('button', { name: /Download Users CSV/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download Languages CSV/i })).toBeInTheDocument();
  });

  it('shows last fetched time when available', () => {
    const lastFetched = new Date('2024-01-15T10:30:00');
    renderWithContext(<Reports />, {
      isConfigured: true,
      data: {
        ...baseData,
        copilotUsage: mockUsage,
        copilotSeats: mockSeats,
        orgMembers: mockMembers,
        lastFetched,
      },
    });
    expect(screen.getByText(/Data last fetched/i)).toBeInTheDocument();
  });

  it('triggers CSV download for users when button clicked', async () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:mock');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    const clickSpy = vi.fn();
    const createElementOrig = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = createElementOrig(tag);
      if (tag === 'a') el.click = clickSpy;
      return el;
    });

    const user = userEvent.setup();
    renderWithContext(<Reports />, {
      isConfigured: true,
      data: {
        ...baseData,
        copilotUsage: mockUsage,
        copilotSeats: mockSeats,
        orgMembers: mockMembers,
      },
    });
    await user.click(screen.getByRole('button', { name: /Download Users CSV/i }));
    expect(createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('triggers CSV download for languages when button clicked', async () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:mock');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    const clickSpy = vi.fn();
    const createElementOrig = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = createElementOrig(tag);
      if (tag === 'a') el.click = clickSpy;
      return el;
    });

    const user = userEvent.setup();
    renderWithContext(<Reports />, {
      isConfigured: true,
      data: {
        ...baseData,
        copilotUsage: mockUsage,
        copilotSeats: mockSeats,
        orgMembers: mockMembers,
      },
    });
    await user.click(screen.getByRole('button', { name: /Download Languages CSV/i }));
    expect(createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});

// ── Setup ─────────────────────────────────────────────────────────────────────

describe('Setup page', () => {
  it('renders the settings form', () => {
    renderWithContext(<Setup />);
    expect(screen.getByLabelText(/Organisation name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Personal Access Token/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/API Base URL/i)).toBeInTheDocument();
  });

  it('pre-fills form with existing config', () => {
    renderWithContext(<Setup />, {
      config: { token: 'ghp_test', org: 'my-org', apiBase: 'https://api.github.com' },
    });
    expect(screen.getByLabelText(/Organisation name/i)).toHaveValue('my-org');
  });

  it('calls saveConfig on form submit', async () => {
    const saveConfig = vi.fn();
    const user = userEvent.setup();
    renderWithContext(<Setup />, { saveConfig });
    await user.clear(screen.getByLabelText(/Organisation name/i));
    await user.type(screen.getByLabelText(/Organisation name/i), 'test-org');
    await user.click(screen.getByRole('button', { name: /Save & Connect/i }));
    expect(saveConfig).toHaveBeenCalledWith(
      expect.objectContaining({ org: 'test-org' })
    );
  });

  it('shows saved confirmation after submit', async () => {
    const user = userEvent.setup();
    renderWithContext(<Setup />);
    await user.click(screen.getByRole('button', { name: /Save & Connect/i }));
    expect(screen.getByRole('button', { name: /Saved/i })).toBeInTheDocument();
  });
});
