import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGitHub } from '../context/GitHubContext.jsx';

function Setup() {
  const { config, saveConfig } = useGitHub();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    token: config.token || '',
    org: config.org || '',
    apiBase: config.apiBase || 'https://api.github.com',
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveConfig(form);
    setSaved(true);
    setTimeout(() => navigate('/'), 1200);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Connect your GitHub organisation to start tracking Copilot insights.</p>
      </div>

      <div className="config-panel">
        <h2 className="config-panel__title">GitHub Configuration</h2>
        <p className="config-panel__subtitle">
          Your token is stored only in your browser&apos;s local storage and never sent anywhere except the GitHub API.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="org">
              Organisation name <span aria-hidden="true">*</span>
            </label>
            <input
              id="org"
              name="org"
              type="text"
              className="form-input"
              value={form.org}
              onChange={handleChange}
              placeholder="my-github-org"
              required
              autoComplete="off"
              spellCheck="false"
            />
            <p className="form-hint">The GitHub organisation slug (e.g. <code>virgin-money</code>).</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="token">
              Personal Access Token <span aria-hidden="true">*</span>
            </label>
            <input
              id="token"
              name="token"
              type="password"
              className="form-input"
              value={form.token}
              onChange={handleChange}
              placeholder="github_pat_..."
              required
              autoComplete="off"
              spellCheck="false"
            />
            <p className="form-hint">
              Requires scopes: <code>read:org</code>, <code>manage_billing:copilot</code>.{' '}
              <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer">
                Create a token ↗
              </a>
            </p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="apiBase">
              API Base URL
            </label>
            <input
              id="apiBase"
              name="apiBase"
              type="url"
              className="form-input"
              value={form.apiBase}
              onChange={handleChange}
              placeholder="https://api.github.com"
            />
            <p className="form-hint">Leave as default unless using GitHub Enterprise Server.</p>
          </div>

          <button type="submit" className="btn btn--primary" style={{ width: '100%' }}>
            {saved ? '✓ Saved — redirecting…' : 'Save & Connect'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Setup;
