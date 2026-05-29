import { Link } from 'react-router-dom';
import { useGitHub } from '../context/GitHubContext.jsx';
import UsageTrendChart from '../components/UsageTrendChart.jsx';
import LanguageBreakdownChart from '../components/LanguageBreakdownChart.jsx';
import EditorBreakdownChart from '../components/EditorBreakdownChart.jsx';
import { deriveStats, deriveLanguageRows, deriveEditorRows } from '../utils/dataHelpers.js';

function CopilotInsights() {
  const { data, isConfigured, fetchData } = useGitHub();

  if (!isConfigured) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">🔌</div>
        <h2 className="empty-state__title">Not connected</h2>
        <p>Configure your GitHub token and organisation to view Copilot insights.</p>
        <br />
        <Link to="/setup" className="btn btn--primary">Go to Settings</Link>
      </div>
    );
  }

  if (data.loading) {
    return (
      <div className="loading-state" aria-live="polite" aria-busy="true">
        <div className="spinner" role="status" aria-label="Loading insights" />
        <p>Loading Copilot insights…</p>
      </div>
    );
  }

  if (data.error) {
    return (
      <div>
        <div className="error-banner" role="alert">
          <span aria-hidden="true">⚠️</span>
          <div><strong>Error:</strong> {data.error}</div>
        </div>
        <button className="btn btn--outline" onClick={fetchData}>Retry</button>
      </div>
    );
  }

  const stats = deriveStats(data);
  const langRows = deriveLanguageRows(data.copilotUsage);
  const editorRows = deriveEditorRows(data.copilotUsage);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Copilot Insights</h1>
          <p className="page-subtitle">Detailed breakdown of Copilot usage across languages and editors.</p>
        </div>
        <button className="btn btn--ghost" onClick={fetchData} aria-label="Refresh data">
          ↻ Refresh
        </button>
      </div>

      {/* Summary stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__icon" aria-hidden="true">💡</div>
          <div className="stat-card__value">{stats.totalSuggestions.toLocaleString()}</div>
          <div className="stat-card__label">Total Suggestions (7d)</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon" aria-hidden="true">✅</div>
          <div className="stat-card__value">{stats.totalAccepted.toLocaleString()}</div>
          <div className="stat-card__label">Accepted Suggestions (7d)</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon" aria-hidden="true">📈</div>
          <div className="stat-card__value">{stats.acceptanceRate}%</div>
          <div className="stat-card__label">Acceptance Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon" aria-hidden="true">👥</div>
          <div className="stat-card__value">{stats.activeUsers}</div>
          <div className="stat-card__label">Active Copilot Users</div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h2 className="chart-card__title">Daily Suggestions vs Accepted</h2>
          <UsageTrendChart usageData={data.copilotUsage} showAccepted />
        </div>
        <div className="chart-card">
          <h2 className="chart-card__title">Language Breakdown</h2>
          <LanguageBreakdownChart usageData={data.copilotUsage} />
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h2 className="chart-card__title">Editor Breakdown</h2>
          <EditorBreakdownChart usageData={data.copilotUsage} />
        </div>
      </div>

      {/* Language table */}
      <div className="table-card">
        <div className="table-card__header">
          <h2 className="table-card__title">By Language</h2>
        </div>
        <div className="table-wrapper">
          <table className="data-table" aria-label="Copilot usage by language">
            <thead>
              <tr>
                <th scope="col">Language</th>
                <th scope="col">Suggestions</th>
                <th scope="col">Accepted</th>
                <th scope="col">Acceptance Rate</th>
                <th scope="col">Lines Suggested</th>
                <th scope="col">Lines Accepted</th>
              </tr>
            </thead>
            <tbody>
              {langRows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--colour-text-muted)', padding: '2rem' }}>
                    No language data available.
                  </td>
                </tr>
              ) : (
                langRows.map((row) => (
                  <tr key={row.language}>
                    <td><strong>{row.language}</strong></td>
                    <td>{row.suggestions.toLocaleString()}</td>
                    <td>{row.accepted.toLocaleString()}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: row.rate >= 30 ? 'var(--colour-success)' : 'var(--colour-text-secondary)' }}>
                        {row.rate}%
                      </span>
                    </td>
                    <td>{row.linesSuggested.toLocaleString()}</td>
                    <td>{row.linesAccepted.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor table */}
      <div className="table-card">
        <div className="table-card__header">
          <h2 className="table-card__title">By Editor</h2>
        </div>
        <div className="table-wrapper">
          <table className="data-table" aria-label="Copilot usage by editor">
            <thead>
              <tr>
                <th scope="col">Editor</th>
                <th scope="col">Suggestions</th>
                <th scope="col">Accepted</th>
                <th scope="col">Acceptance Rate</th>
                <th scope="col">Active Users</th>
              </tr>
            </thead>
            <tbody>
              {editorRows.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--colour-text-muted)', padding: '2rem' }}>
                    No editor data available.
                  </td>
                </tr>
              ) : (
                editorRows.map((row) => (
                  <tr key={row.editor}>
                    <td><strong>{row.editor}</strong></td>
                    <td>{row.suggestions.toLocaleString()}</td>
                    <td>{row.accepted.toLocaleString()}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: row.rate >= 30 ? 'var(--colour-success)' : 'var(--colour-text-secondary)' }}>
                        {row.rate}%
                      </span>
                    </td>
                    <td>{row.activeUsers}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CopilotInsights;
