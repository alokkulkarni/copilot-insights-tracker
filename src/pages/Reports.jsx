import { useGitHub } from '../context/GitHubContext.jsx';
import { Link } from 'react-router-dom';
import { deriveStats, deriveLanguageRows, buildUserRows } from '../utils/dataHelpers.js';

function Reports() {
  const { data, isConfigured } = useGitHub();

  if (!isConfigured) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">🔌</div>
        <h2 className="empty-state__title">Not connected</h2>
        <p>Configure your GitHub token and organisation to generate reports.</p>
        <br />
        <Link to="/setup" className="btn btn--primary">Go to Settings</Link>
      </div>
    );
  }

  if (data.loading) {
    return (
      <div className="loading-state" aria-live="polite" aria-busy="true">
        <div className="spinner" role="status" aria-label="Loading reports" />
        <p>Preparing report data…</p>
      </div>
    );
  }

  const stats = deriveStats(data);
  const langRows = deriveLanguageRows(data.copilotUsage);
  const userRows = buildUserRows(data).filter((u) => u.isActive);

  const exportCsv = () => {
    const headers = ['Login', 'Name', 'Suggestions', 'Accepted', 'Acceptance Rate (%)', 'Last Active', 'Plan'];
    const rows = userRows.map((u) => [
      u.login,
      u.name || '',
      u.suggestions ?? '',
      u.accepted ?? '',
      u.acceptanceRate ?? '',
      u.lastActivityAt ? new Date(u.lastActivityAt).toLocaleDateString() : '',
      u.planType || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `copilot-active-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportLangCsv = () => {
    const headers = ['Language', 'Suggestions', 'Accepted', 'Acceptance Rate (%)', 'Lines Suggested', 'Lines Accepted'];
    const rows = langRows.map((r) => [r.language, r.suggestions, r.accepted, r.rate, r.linesSuggested, r.linesAccepted]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `copilot-language-breakdown-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Export Copilot usage data for your organisation.</p>
      </div>

      {/* Summary */}
      <div className="chart-card" style={{ marginBottom: '2rem' }}>
        <h2 className="chart-card__title">Summary Snapshot</h2>
        <div className="stats-grid" style={{ marginBottom: 0 }}>
          <div className="stat-card">
            <div className="stat-card__icon" aria-hidden="true">👥</div>
            <div className="stat-card__value">{stats.totalSeats}</div>
            <div className="stat-card__label">Total Seats</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon" aria-hidden="true">✅</div>
            <div className="stat-card__value">{stats.activeUsers}</div>
            <div className="stat-card__label">Active Users (30d)</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon" aria-hidden="true">💡</div>
            <div className="stat-card__value">{stats.totalSuggestions.toLocaleString()}</div>
            <div className="stat-card__label">Suggestions (7d)</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon" aria-hidden="true">📈</div>
            <div className="stat-card__value">{stats.acceptanceRate}%</div>
            <div className="stat-card__label">Acceptance Rate</div>
          </div>
        </div>
      </div>

      {/* Export cards */}
      <div className="charts-grid">
        <div className="chart-card">
          <h2 className="chart-card__title">Active Users Export</h2>
          <p style={{ color: 'var(--colour-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: '1rem' }}>
            Export a CSV of all {userRows.length} active Copilot users with their usage metrics.
          </p>
          <button className="btn btn--primary" onClick={exportCsv}>
            ⬇ Download Users CSV
          </button>
        </div>

        <div className="chart-card">
          <h2 className="chart-card__title">Language Breakdown Export</h2>
          <p style={{ color: 'var(--colour-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: '1rem' }}>
            Export a CSV of Copilot usage broken down by {langRows.length} programming languages.
          </p>
          <button className="btn btn--primary" onClick={exportLangCsv}>
            ⬇ Download Languages CSV
          </button>
        </div>
      </div>

      {data.lastFetched && (
        <p style={{ color: 'var(--colour-text-muted)', fontSize: 'var(--font-size-xs)', marginTop: '1rem' }}>
          Data last fetched: {data.lastFetched.toLocaleString()}
        </p>
      )}
    </div>
  );
}

export default Reports;
