import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import UsageTrendChart from '../components/UsageTrendChart.jsx';
import LanguageBreakdownChart from '../components/LanguageBreakdownChart.jsx';
import EditorBreakdownChart from '../components/EditorBreakdownChart.jsx';

// Recharts uses ResizeObserver — provide a stub
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
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
      { language: 'javascript', editor: 'jetbrains', suggestions_count: 40, acceptances_count: 15, lines_suggested: 100, lines_accepted: 40 },
    ],
  },
  {
    day: '2024-01-11',
    total_suggestions_count: 120,
    total_acceptances_count: 50,
    total_lines_suggested: 300,
    total_lines_accepted: 120,
    total_active_users: 10,
    breakdown: [
      { language: 'python', editor: 'vscode', suggestions_count: 70, acceptances_count: 30, lines_suggested: 180, lines_accepted: 75 },
      { language: 'typescript', editor: 'vscode', suggestions_count: 50, acceptances_count: 20, lines_suggested: 120, lines_accepted: 45 },
    ],
  },
];

// ── UsageTrendChart ───────────────────────────────────────────────────────────

describe('UsageTrendChart', () => {
  it('renders empty state when usageData is null', () => {
    render(<UsageTrendChart usageData={null} />);
    expect(screen.getByText(/No trend data available/i)).toBeInTheDocument();
  });

  it('renders empty state when usageData is an error object', () => {
    render(<UsageTrendChart usageData={{ _error: 'Forbidden' }} />);
    expect(screen.getByText(/No trend data available/i)).toBeInTheDocument();
  });

  it('renders empty state when usageData is an empty array', () => {
    render(<UsageTrendChart usageData={[]} />);
    expect(screen.getByText(/No trend data available/i)).toBeInTheDocument();
  });

  it('renders a chart container when valid data is provided', () => {
    const { container } = render(<UsageTrendChart usageData={mockUsage} />);
    // Recharts renders a .recharts-responsive-container wrapper in jsdom
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('renders with showAccepted=false without crashing', () => {
    const { container } = render(<UsageTrendChart usageData={mockUsage} showAccepted={false} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });
});

// ── LanguageBreakdownChart ────────────────────────────────────────────────────

describe('LanguageBreakdownChart', () => {
  it('renders empty state when usageData is null', () => {
    render(<LanguageBreakdownChart usageData={null} />);
    expect(screen.getByText(/No language data available/i)).toBeInTheDocument();
  });

  it('renders empty state when usageData is an error object', () => {
    render(<LanguageBreakdownChart usageData={{ _error: 'Not found' }} />);
    expect(screen.getByText(/No language data available/i)).toBeInTheDocument();
  });

  it('renders a chart when valid data is provided', () => {
    const { container } = render(<LanguageBreakdownChart usageData={mockUsage} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });
});

// ── EditorBreakdownChart ──────────────────────────────────────────────────────

describe('EditorBreakdownChart', () => {
  it('renders empty state when usageData is null', () => {
    render(<EditorBreakdownChart usageData={null} />);
    expect(screen.getByText(/No editor data available/i)).toBeInTheDocument();
  });

  it('renders empty state when usageData is an error object', () => {
    render(<EditorBreakdownChart usageData={{ _error: 'Not found' }} />);
    expect(screen.getByText(/No editor data available/i)).toBeInTheDocument();
  });

  it('renders a chart when valid data is provided', () => {
    const { container } = render(<EditorBreakdownChart usageData={mockUsage} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });
});
