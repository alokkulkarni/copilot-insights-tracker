import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const GitHubContext = createContext(null);

const STORAGE_KEY = 'copilot_tracker_config';

export function GitHubProvider({ children }) {
  const [config, setConfig] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : { token: '', org: '', apiBase: 'https://api.github.com' };
    } catch {
      return { token: '', org: '', apiBase: 'https://api.github.com' };
    }
  });

  const [data, setData] = useState({
    copilotUsage: null,
    copilotSeats: null,
    orgMembers: null,
    loading: false,
    error: null,
    lastFetched: null,
  });

  const isConfigured = Boolean(config.token && config.org);

  const saveConfig = useCallback((newConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch {
      // storage unavailable
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!isConfigured) return;

    setData((prev) => ({ ...prev, loading: true, error: null }));

    const headers = {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    const base = config.apiBase || 'https://api.github.com';

    try {
      const [usageRes, seatsRes, membersRes] = await Promise.allSettled([
        fetch(`${base}/orgs/${config.org}/copilot/usage`, { headers }),
        fetch(`${base}/orgs/${config.org}/copilot/billing/seats`, { headers }),
        fetch(`${base}/orgs/${config.org}/members?per_page=100`, { headers }),
      ]);

      const parseJson = async (result) => {
        if (result.status === 'fulfilled' && result.value.ok) {
          return result.value.json();
        }
        if (result.status === 'fulfilled') {
          const err = await result.value.json().catch(() => ({}));
          throw new Error(err.message || `HTTP ${result.value.status}`);
        }
        throw result.reason;
      };

      const [copilotUsage, copilotSeats, orgMembers] = await Promise.all([
        parseJson(usageRes).catch((e) => ({ _error: e.message })),
        parseJson(seatsRes).catch((e) => ({ _error: e.message })),
        parseJson(membersRes).catch((e) => ({ _error: e.message })),
      ]);

      setData({
        copilotUsage,
        copilotSeats,
        orgMembers,
        loading: false,
        error: null,
        lastFetched: new Date(),
      });
    } catch (err) {
      setData((prev) => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to fetch data from GitHub API.',
      }));
    }
  }, [config, isConfigured]);

  // Auto-fetch on config change
  useEffect(() => {
    if (isConfigured) {
      fetchData();
    }
  }, [isConfigured, fetchData]);

  // Auto-refresh interval
  useEffect(() => {
    if (!isConfigured) return;
    const interval = parseInt(import.meta.env.VITE_REFRESH_INTERVAL || '300000', 10);
    const timer = setInterval(fetchData, interval);
    return () => clearInterval(timer);
  }, [isConfigured, fetchData]);

  return (
    <GitHubContext.Provider value={{ config, saveConfig, data, fetchData, isConfigured }}>
      {children}
    </GitHubContext.Provider>
  );
}

export function useGitHub() {
  const ctx = useContext(GitHubContext);
  if (!ctx) throw new Error('useGitHub must be used within GitHubProvider');
  return ctx;
}
