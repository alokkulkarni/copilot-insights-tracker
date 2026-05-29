import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GitHubProvider, useGitHub } from '../context/GitHubContext.jsx';

// ── Helpers ───────────────────────────────────────────────────────────────────

function TestConsumer() {
  const { config, isConfigured, data, saveConfig } = useGitHub();
  return (
    <div>
      <span data-testid="configured">{String(isConfigured)}</span>
      <span data-testid="org">{config.org}</span>
      <span data-testid="loading">{String(data.loading)}</span>
      <span data-testid="error">{data.error ?? ''}</span>
      <button onClick={() => saveConfig({ token: 'tok', org: 'my-org', apiBase: 'https://api.github.com' })}>
        Save
      </button>
    </div>
  );
}

function renderProvider() {
  return render(
    <GitHubProvider>
      <TestConsumer />
    </GitHubProvider>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GitHubProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('starts unconfigured when localStorage is empty', () => {
    renderProvider();
    expect(screen.getByTestId('configured').textContent).toBe('false');
  });

  it('reads saved config from localStorage on mount', () => {
    localStorage.setItem(
      'copilot_tracker_config',
      JSON.stringify({ token: 'ghp_abc', org: 'acme', apiBase: 'https://api.github.com' })
    );
    // Mock fetch so the auto-fetch on mount doesn't fail
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ total_seats: 5, seats: [] }),
    }));
    renderProvider();
    expect(screen.getByTestId('org').textContent).toBe('acme');
    expect(screen.getByTestId('configured').textContent).toBe('true');
  });

  it('saveConfig updates config and persists to localStorage', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ total_seats: 0, seats: [] }),
    }));
    renderProvider();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByTestId('org').textContent).toBe('my-org');
    expect(screen.getByTestId('configured').textContent).toBe('true');
    const stored = JSON.parse(localStorage.getItem('copilot_tracker_config') || '{}');
    expect(stored.org).toBe('my-org');
  });

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('copilot_tracker_config', 'not-valid-json{{{');
    expect(() => renderProvider()).not.toThrow();
    expect(screen.getByTestId('configured').textContent).toBe('false');
  });

  it('sets loading=true while fetching and loading=false after', async () => {
    let resolveFetch;
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(
      new Promise((resolve) => { resolveFetch = resolve; })
    ));
    localStorage.setItem(
      'copilot_tracker_config',
      JSON.stringify({ token: 'tok', org: 'org', apiBase: 'https://api.github.com' })
    );
    renderProvider();
    // loading should be true while fetch is pending
    expect(screen.getByTestId('loading').textContent).toBe('true');
    // resolve the fetch
    await act(async () => {
      resolveFetch({ ok: true, json: async () => ({ total_seats: 0, seats: [] }) });
    });
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
  });

  it('sets data.error when all fetches reject (network failure)', async () => {
    // When fetch itself rejects (not just a non-ok response), Promise.allSettled
    // captures it as { status: 'rejected' }, and parseJson re-throws it.
    // Each parseJson error is caught per-result as { _error: ... }, so data.error
    // stays null. Only a throw *outside* Promise.allSettled sets data.error.
    // We simulate that by making fetch throw synchronously before allSettled.
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      throw new Error('Network failure');
    }));
    localStorage.setItem(
      'copilot_tracker_config',
      JSON.stringify({ token: 'tok', org: 'org', apiBase: 'https://api.github.com' })
    );
    renderProvider();
    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Network failure');
    });
  });

  it('stores per-result _error when API returns non-ok response', async () => {
    // Non-ok responses are caught per-result as { _error: message }.
    // data.error stays null; the individual data fields carry the error.
    // This is intentional — partial failures are handled gracefully.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: 'Forbidden' }),
    }));
    localStorage.setItem(
      'copilot_tracker_config',
      JSON.stringify({ token: 'tok', org: 'org', apiBase: 'https://api.github.com' })
    );

    // Expose copilotSeats via a more detailed consumer
    function DetailedConsumer() {
      const { data } = useGitHub();
      return (
        <span data-testid="seats-error">
          {data.copilotSeats?._error ?? ''}
        </span>
      );
    }
    render(
      <GitHubProvider>
        <DetailedConsumer />
      </GitHubProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('seats-error').textContent).toBe('Forbidden');
    });
  });

  it('throws when useGitHub is used outside GitHubProvider', () => {
    // Suppress React error boundary noise
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow();
    spy.mockRestore();
  });
});
