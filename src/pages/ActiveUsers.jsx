import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useGitHub } from '../context/GitHubContext.jsx';
import { buildUserRows } from '../utils/dataHelpers.js';

function ActiveUsers() {
  const { data, isConfigured, fetchData } = useGitHub();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('suggestions_desc');

  // All hooks must be called unconditionally before any early returns (rules-of-hooks).
  // buildUserRows returns [] when data is not ready, so this is safe.
  const rows = buildUserRows(data);

  const filtered = useMemo(() => {
    let result = rows;

    if (filter === 'active') result = result.filter((r) => r.isActive);
    if (filter === 'inactive') result = result.filter((r) => !r.isActive);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.login.toLowerCase().includes(q) ||
          (r.name && r.name.toLowerCase().includes(q))
      );
    }

    const [field, dir] = sortBy.split('_');
    result = [...result].sort((a, b) => {
      const av = a[field] ?? 0;
      const bv = b[field] ?? 0;
      if (typeof av === 'string') return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return dir === 'asc' ? av - bv : bv - av;
    });

    return result;
  }, [rows, search, filter, sortBy]);

  // Early returns after all hooks have been called
  if (!isConfigured) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">🔌</div>
        <h2 className="empty-state__title">Not connected</h2>
        <p>Configure your GitHub token and organisation to view active users.</p>
        <br />
        <Link to="/setup" className="btn btn--primary">Go to Settings</Link>
      </div>
    );
  }

  if (data.loading) {
    return (
      <div className="loading-state" aria-live="polite" aria-busy="true">
        <div className="spinner" role="status" aria-label="Loading users" />
        <p>Loading user data…</p>
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

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Active Users</h1>
          <p className="page-subtitle">
            {filtered.length} of {rows.length} members shown
          </p>
        </div>
        <button className="btn btn--ghost" onClick={fetchData} aria-label="Refresh data">
          ↻ Refresh
        </button>
      </div>

      <div className="table-card">
        <div className="table-card__header">
          <h2 className="table-card__title">Organisation Members</h2>
          <div className="toolbar">
            <input
              type="search"
              className="search-input"
              placeholder="Search by name or login…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search users"
            />
            <select
              className="select-input"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All members</option>
              <option value="active">Active (Copilot)</option>
              <option value="inactive">No Copilot seat</option>
            </select>
            <select
              className="select-input"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort by"
            >
              <option value="suggestions_desc">Most suggestions</option>
              <option value="suggestions_asc">Fewest suggestions</option>
              <option value="acceptanceRate_desc">Highest acceptance</option>
              <option value="login_asc">Name A–Z</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table" aria-label="Organisation members with Copilot usage">
            <thead>
              <tr>
                <th scope="col">User</th>
                <th scope="col">Status</th>
                <th scope="col">Suggestions (7d)</th>
                <th scope="col">Accepted (7d)</th>
                <th scope="col">Acceptance Rate</th>
                <th scope="col">Last Active</th>
                <th scope="col">Plan</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--colour-text-muted)', padding: '2rem' }}>
                    No users match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.login}>
                    <td>
                      <div className="user-cell">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={`${user.login} avatar`}
                            className="avatar"
                            width="32"
                            height="32"
                          />
                        ) : (
                          <span className="avatar" aria-hidden="true">
                            {user.login.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <div>
                          <div className="user-cell__name">{user.name || user.login}</div>
                          <div className="user-cell__login">@{user.login}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${user.isActive ? 'badge--active' : 'badge--inactive'}`}>
                        {user.isActive ? 'Active' : 'No seat'}
                      </span>
                    </td>
                    <td>{user.suggestions?.toLocaleString() ?? '—'}</td>
                    <td>{user.accepted?.toLocaleString() ?? '—'}</td>
                    <td>
                      {user.acceptanceRate != null ? (
                        <span style={{ fontWeight: 600, color: user.acceptanceRate >= 30 ? 'var(--colour-success)' : 'var(--colour-text-secondary)' }}>
                          {user.acceptanceRate}%
                        </span>
                      ) : '—'}
                    </td>
                    <td>{user.lastActivityAt ? new Date(user.lastActivityAt).toLocaleDateString() : '—'}</td>
                    <td>{user.planType || '—'}</td>
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

export default ActiveUsers;
