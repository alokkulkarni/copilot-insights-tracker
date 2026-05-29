import { Link } from 'react-router-dom';
import { useGitHub } from '../context/GitHubContext.jsx';
import StatCard from '../components/StatCard.jsx';
import UsageTrendChart from '../components/UsageTrendChart.jsx';
import LanguageBreakdownChart from '../components/LanguageBreakdownChart.jsx';
import { deriveStats } from '../utils/dataHelpers.js';

function Overview() {
  const { data, isConfigured, fetchData } = useGitHub();

  if (!isConfigured) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">🔌</div>
        <h2 className="empty-state__title">Not connected</h2>
        <p>Configure your GitHub token and organisation to start tracking Copilot insights.</p>
        <br />
        <Link to="/setup" className="btn btn--primary">Go to Settings</Link>
      </div>
    );
  }

  if (data.loading) {
    return (
      <div className="loading-state" aria-live="polite" aria-busy="true">
        <div className="spinner" role="status" aria-label="Loading data" />
        <p>Fetching data from GitHub…</p>
      </div>
    );
  }

  if (data.error) {
    return (
      <div>
        <div className="error-banner" role="alert">
          <span aria-hidden="true">⚠️</span>
          <div>
            <strong>Error fetching data:</strong> {data.error}
          </div>
        </div>
        <button className="btn btn--outline" onClick={fetchData}>Retry</button>
      </div>
    );
  }

  const stats = deriveStats(data);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-subtitle">GitHub Copilot usage summary for your organisation.</p>
        </div>
        <button className="btn btn--ghost" onClick={fetchData} aria-label="Refresh data">
          ↻ Refresh
        </button>
      </div>

      <div className="stats-grid">
        <StatCard icon="👥" value={stats.totalSeats} label="Total Seats" change={null} />
        <StatCard icon="✅" value={stats.activeUsers} label="Active Users (30d)" change={stats.activeUsersChange} />
        <StatCard icon="💡" value={stats.totalSuggestions} label="Suggestions (7d)" change={null} />
        <StatCard icon="📈" value={`${stats.acceptanceRate}%`} label="Acceptance Rate" change={stats.acceptanceRateChange} />
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h2 className="chart-card__title">Daily Usage Trend</h2>
          <UsageTrendChart usageData={data.copilotUsage} />
        </div>
        <div className="chart-card">
          <h2 className="chart-card__title">Top Languages</h2>
          <LanguageBreakdownChart usageData={data.copilotUsage} />
        </div>
      </div>
    </div>
  );
}

export default Overview;
