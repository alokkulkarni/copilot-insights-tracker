import { describe, it, expect } from 'vitest';
import {
  deriveStats,
  buildTrendData,
  deriveLanguageRows,
  deriveEditorRows,
  buildUserRows,
} from '../utils/dataHelpers.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

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
      { language: 'javascript', editor: 'vscode', suggestions_count: 40, acceptances_count: 15, lines_suggested: 100, lines_accepted: 40 },
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
      { language: 'typescript', editor: 'jetbrains', suggestions_count: 50, acceptances_count: 20, lines_suggested: 120, lines_accepted: 45 },
    ],
  },
];

const mockSeats = {
  total_seats: 20,
  seats: [
    {
      assignee: { login: 'alice', avatar_url: 'https://example.com/alice.png', name: 'Alice Smith' },
      last_activity_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      plan_type: 'business',
    },
    {
      assignee: { login: 'bob', avatar_url: null, name: 'Bob Jones' },
      last_activity_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
      plan_type: 'business',
    },
  ],
};

const mockMembers = [
  { login: 'alice', avatar_url: 'https://example.com/alice.png' },
  { login: 'bob', avatar_url: null },
  { login: 'carol', avatar_url: null },
];

// ── deriveStats ───────────────────────────────────────────────────────────────

describe('deriveStats', () => {
  it('returns zero stats when data is empty', () => {
    const stats = deriveStats({ copilotUsage: null, copilotSeats: null });
    expect(stats.totalSeats).toBe(0);
    expect(stats.activeUsers).toBe(0);
    expect(stats.totalSuggestions).toBe(0);
    expect(stats.acceptanceRate).toBe(0);
  });

  it('counts total seats from seats API', () => {
    const stats = deriveStats({ copilotUsage: mockUsage, copilotSeats: mockSeats });
    expect(stats.totalSeats).toBe(20);
  });

  it('counts only users active within 30 days', () => {
    const stats = deriveStats({ copilotUsage: mockUsage, copilotSeats: mockSeats });
    // alice is 2 days ago (active), bob is 45 days ago (inactive)
    expect(stats.activeUsers).toBe(1);
  });

  it('sums suggestions from last 7 days', () => {
    const stats = deriveStats({ copilotUsage: mockUsage, copilotSeats: mockSeats });
    expect(stats.totalSuggestions).toBe(220); // 100 + 120
  });

  it('calculates acceptance rate correctly', () => {
    const stats = deriveStats({ copilotUsage: mockUsage, copilotSeats: mockSeats });
    // (40 + 50) / (100 + 120) = 90/220 ≈ 41%
    expect(stats.acceptanceRate).toBe(41);
  });

  it('handles _error in copilotSeats gracefully', () => {
    const stats = deriveStats({ copilotUsage: mockUsage, copilotSeats: { _error: 'Forbidden' } });
    expect(stats.totalSeats).toBe(0);
    expect(stats.activeUsers).toBe(0);
  });
});

// ── buildTrendData ────────────────────────────────────────────────────────────

describe('buildTrendData', () => {
  it('returns empty array for null input', () => {
    expect(buildTrendData(null)).toEqual([]);
  });

  it('returns empty array for error object', () => {
    expect(buildTrendData({ _error: 'Not found' })).toEqual([]);
  });

  it('maps usage days to chart data points', () => {
    const result = buildTrendData(mockUsage);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ suggestions: 100, accepted: 40 });
    expect(result[1]).toMatchObject({ suggestions: 120, accepted: 50 });
  });

  it('formats date as M/D', () => {
    const result = buildTrendData(mockUsage);
    expect(result[0].date).toBe('1/10');
  });
});

// ── deriveLanguageRows ────────────────────────────────────────────────────────

describe('deriveLanguageRows', () => {
  it('returns empty array for null input', () => {
    expect(deriveLanguageRows(null)).toEqual([]);
  });

  it('aggregates suggestions by language across days', () => {
    const rows = deriveLanguageRows(mockUsage);
    const python = rows.find((r) => r.language === 'python');
    expect(python).toBeDefined();
    expect(python.suggestions).toBe(130); // 60 + 70
    expect(python.accepted).toBe(55); // 25 + 30
  });

  it('calculates acceptance rate per language', () => {
    const rows = deriveLanguageRows(mockUsage);
    const python = rows.find((r) => r.language === 'python');
    expect(python.rate).toBe(Math.round((55 / 130) * 100));
  });

  it('sorts by suggestions descending', () => {
    const rows = deriveLanguageRows(mockUsage);
    expect(rows[0].suggestions).toBeGreaterThanOrEqual(rows[1].suggestions);
  });
});

// ── deriveEditorRows ──────────────────────────────────────────────────────────

describe('deriveEditorRows', () => {
  it('returns empty array for null input', () => {
    expect(deriveEditorRows(null)).toEqual([]);
  });

  it('aggregates by editor', () => {
    const rows = deriveEditorRows(mockUsage);
    const vscode = rows.find((r) => r.editor === 'vscode');
    expect(vscode).toBeDefined();
    // day1: 60+40=100, day2: 70 = 170 total for vscode
    expect(vscode.suggestions).toBe(170);
  });
});

// ── buildUserRows ─────────────────────────────────────────────────────────────

describe('buildUserRows', () => {
  it('returns empty array when no members and no seats', () => {
    const rows = buildUserRows({ copilotSeats: null, orgMembers: null });
    expect(rows).toEqual([]);
  });

  it('marks users with seats as active', () => {
    const rows = buildUserRows({ copilotSeats: mockSeats, orgMembers: mockMembers });
    const alice = rows.find((r) => r.login === 'alice');
    expect(alice.isActive).toBe(true);
  });

  it('marks users without seats as inactive', () => {
    const rows = buildUserRows({ copilotSeats: mockSeats, orgMembers: mockMembers });
    const carol = rows.find((r) => r.login === 'carol');
    expect(carol.isActive).toBe(false);
  });

  it('includes seat holders not in org members list', () => {
    const rows = buildUserRows({
      copilotSeats: {
        total_seats: 1,
        seats: [{ assignee: { login: 'external-user' }, last_activity_at: null, plan_type: 'business' }],
      },
      orgMembers: [],
    });
    expect(rows.some((r) => r.login === 'external-user')).toBe(true);
  });

  it('handles _error in orgMembers gracefully', () => {
    const rows = buildUserRows({ copilotSeats: mockSeats, orgMembers: { _error: 'Forbidden' } });
    // Should still include seat holders
    expect(rows.length).toBeGreaterThan(0);
  });
});
