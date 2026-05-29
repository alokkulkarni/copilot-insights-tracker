/**
 * dataHelpers.js
 * Pure utility functions for transforming GitHub Copilot API responses
 * into display-ready data structures.
 *
 * GitHub Copilot Usage API shape (per day):
 * {
 *   day: "2024-01-15",
 *   total_suggestions_count: 120,
 *   total_acceptances_count: 45,
 *   total_lines_suggested: 300,
 *   total_lines_accepted: 110,
 *   total_active_users: 12,
 *   breakdown: [
 *     { language: "python", editor: "vscode", suggestions_count: 60, acceptances_count: 25, ... }
 *   ]
 * }
 *
 * GitHub Copilot Seats API shape:
 * {
 *   total_seats: 50,
 *   seats: [
 *     { assignee: { login, avatar_url, name }, last_activity_at, plan_type, ... }
 *   ]
 * }
 */

/**
 * Derive top-level summary statistics from raw API data.
 */
export function deriveStats(data) {
  const { copilotUsage, copilotSeats } = data;

  const totalSeats =
    copilotSeats && !copilotSeats._error ? copilotSeats.total_seats ?? 0 : 0;

  // Active users: count of seats with activity in last 30 days
  const activeUsers =
    copilotSeats && !copilotSeats._error && Array.isArray(copilotSeats.seats)
      ? copilotSeats.seats.filter((s) => {
          if (!s.last_activity_at) return false;
          const diff = Date.now() - new Date(s.last_activity_at).getTime();
          return diff < 30 * 24 * 60 * 60 * 1000;
        }).length
      : 0;

  // Aggregate last 7 days of usage
  const recentDays = getRecentDays(copilotUsage, 7);
  const totalSuggestions = recentDays.reduce(
    (sum, d) => sum + (d.total_suggestions_count ?? 0),
    0
  );
  const totalAccepted = recentDays.reduce(
    (sum, d) => sum + (d.total_acceptances_count ?? 0),
    0
  );
  const acceptanceRate =
    totalSuggestions > 0
      ? Math.round((totalAccepted / totalSuggestions) * 100)
      : 0;

  return {
    totalSeats,
    activeUsers,
    totalSuggestions,
    totalAccepted,
    acceptanceRate,
    activeUsersChange: null,
    acceptanceRateChange: null,
  };
}

/**
 * Build chart-ready trend data from usage array.
 */
export function buildTrendData(copilotUsage) {
  if (!copilotUsage || copilotUsage._error || !Array.isArray(copilotUsage)) {
    return [];
  }

  return copilotUsage
    .slice(-30) // last 30 days
    .map((d) => ({
      date: formatShortDate(d.day),
      suggestions: d.total_suggestions_count ?? 0,
      accepted: d.total_acceptances_count ?? 0,
      activeUsers: d.total_active_users ?? 0,
    }));
}

/**
 * Aggregate usage by language across all days.
 */
export function deriveLanguageRows(copilotUsage) {
  if (!copilotUsage || copilotUsage._error || !Array.isArray(copilotUsage)) {
    return [];
  }

  const map = new Map();

  for (const day of copilotUsage) {
    if (!Array.isArray(day.breakdown)) continue;
    for (const entry of day.breakdown) {
      const lang = entry.language || 'unknown';
      const existing = map.get(lang) || {
        language: lang,
        suggestions: 0,
        accepted: 0,
        linesSuggested: 0,
        linesAccepted: 0,
      };
      existing.suggestions += entry.suggestions_count ?? 0;
      existing.accepted += entry.acceptances_count ?? 0;
      existing.linesSuggested += entry.lines_suggested ?? 0;
      existing.linesAccepted += entry.lines_accepted ?? 0;
      map.set(lang, existing);
    }
  }

  return Array.from(map.values())
    .map((r) => ({
      ...r,
      rate:
        r.suggestions > 0 ? Math.round((r.accepted / r.suggestions) * 100) : 0,
    }))
    .sort((a, b) => b.suggestions - a.suggestions);
}

/**
 * Aggregate usage by editor across all days.
 */
export function deriveEditorRows(copilotUsage) {
  if (!copilotUsage || copilotUsage._error || !Array.isArray(copilotUsage)) {
    return [];
  }

  const map = new Map();

  for (const day of copilotUsage) {
    if (!Array.isArray(day.breakdown)) continue;
    for (const entry of day.breakdown) {
      const editor = entry.editor || 'unknown';
      const existing = map.get(editor) || {
        editor,
        suggestions: 0,
        accepted: 0,
        activeUsers: 0,
      };
      existing.suggestions += entry.suggestions_count ?? 0;
      existing.accepted += entry.acceptances_count ?? 0;
      // active_users per editor is not always present; use max seen
      if ((entry.active_users ?? 0) > existing.activeUsers) {
        existing.activeUsers = entry.active_users ?? 0;
      }
      map.set(editor, existing);
    }
  }

  return Array.from(map.values())
    .map((r) => ({
      ...r,
      rate:
        r.suggestions > 0 ? Math.round((r.accepted / r.suggestions) * 100) : 0,
    }))
    .sort((a, b) => b.suggestions - a.suggestions);
}

/**
 * Build per-user rows by merging seats data with org members.
 */
export function buildUserRows(data) {
  const { copilotSeats, orgMembers } = data;

  // Build a map of login -> seat info
  const seatMap = new Map();
  if (copilotSeats && !copilotSeats._error && Array.isArray(copilotSeats.seats)) {
    for (const seat of copilotSeats.seats) {
      const login = seat.assignee?.login;
      if (login) {
        seatMap.set(login, seat);
      }
    }
  }

  // Build rows from org members, enriched with seat data
  const members = Array.isArray(orgMembers) && !orgMembers._error ? orgMembers : [];

  // Also include seat holders not in the members list (e.g. outside collaborators)
  const memberLogins = new Set(members.map((m) => m.login));
  const extraSeats = [];
  for (const [login, seat] of seatMap.entries()) {
    if (!memberLogins.has(login)) {
      extraSeats.push({ login, avatar_url: seat.assignee?.avatar_url });
    }
  }

  return [...members, ...extraSeats].map((member) => {
    const seat = seatMap.get(member.login);
    const isActive = Boolean(seat);

    return {
      login: member.login,
      name: seat?.assignee?.name || member.name || null,
      avatarUrl: seat?.assignee?.avatar_url || member.avatar_url || null,
      isActive,
      lastActivityAt: seat?.last_activity_at || null,
      planType: seat?.plan_type || null,
      // Per-user suggestion counts are not in the seats API; show null
      suggestions: null,
      accepted: null,
      acceptanceRate: null,
    };
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getRecentDays(copilotUsage, n) {
  if (!copilotUsage || copilotUsage._error || !Array.isArray(copilotUsage)) {
    return [];
  }
  return copilotUsage.slice(-n);
}

function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
