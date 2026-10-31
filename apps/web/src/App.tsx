import { useCallback, useEffect, useState } from 'react';

import {
  type GoodnessEntryResponse,
  type HistoryResponse,
  type TodayResponse,
} from '@daily-forge/contracts';
import { challengeCategories, type ChallengeCategory } from '@daily-forge/domain';

import {
  acceptToday,
  addCountProgress,
  completeToday,
  loadHistory,
  loadToday,
  loadWall,
  resetDevelopmentData,
} from './api';

type View = 'today' | 'wall' | 'history' | 'settings';

const navigation: { id: View; label: string; marker: string }[] = [
  { id: 'today', label: 'Today', marker: '01' },
  { id: 'wall', label: 'Wall', marker: '02' },
  { id: 'history', label: 'History', marker: '03' },
  { id: 'settings', label: 'Settings', marker: '04' },
];

const categoryCopy: Record<ChallengeCategory, string> = {
  body: 'Mobility and strength that support the life you already lead.',
  character: 'Small opportunities to practice deliberate character.',
  community: 'Concrete, consent-aware ways to be useful to others.',
  creativity: 'Brief constraints and experiments for an artistic practice.',
};

function formatLocalDate(localDate: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(localDate + 'T00:00:00.000Z'));
}

interface TodayViewProps {
  today: TodayResponse;
  pending: boolean;
  onAccept: () => Promise<void>;
  onAdd: (amount: number) => Promise<void>;
  onComplete: () => Promise<void>;
  onViewWall: () => void;
}

function TodayView({ today, pending, onAccept, onAdd, onComplete, onViewWall }: TodayViewProps) {
  const { assignment, progress, streak } = today;
  const challenge = assignment.challenge;
  const percent = Math.min(100, Math.round((progress.current / progress.target) * 100));

  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">{formatLocalDate(assignment.localDate)}</p>
        <h1>
          {assignment.status === 'completed' ? 'Action, recorded.' : 'One deliberate action.'}
        </h1>
        <p className="lede">
          {assignment.status === 'completed'
            ? 'This challenge is now part of your private Wall of Goodness.'
            : 'A small, concrete challenge that supports the person you are working to become.'}
        </p>
      </header>

      <article className="challenge-card">
        <div className="challenge-card__topline">
          <span className={'category-pill category-pill--' + challenge.category}>
            {challenge.category}
          </span>
          <span className="effort-label">About {challenge.expectedMinutes} minutes</span>
        </div>

        <div>
          <p className="challenge-number">
            {assignment.status === 'proposed' && 'Today’s challenge'}
            {assignment.status === 'accepted' && 'Challenge in progress'}
            {assignment.status === 'completed' && 'Challenge complete'}
          </p>
          <h2>{challenge.title}</h2>
          <p>{challenge.instructions}</p>
          {challenge.safetyNote && <p className="safety-note">{challenge.safetyNote}</p>}
        </div>

        <div className="progress-block">
          <div className="progress-copy" aria-live="polite">
            <strong>{progress.current}</strong>
            <span>of {progress.target}</span>
          </div>
          <div
            aria-label={progress.current + ' of ' + progress.target + ' ' + challenge.tracking.unit}
            aria-valuemax={progress.target}
            aria-valuemin={0}
            aria-valuenow={progress.current}
            className="progress-track"
            role="progressbar"
          >
            <div className="progress-fill" style={{ width: percent + '%' }} />
          </div>
        </div>

        {assignment.status === 'proposed' && (
          <button
            className="primary-button"
            disabled={pending}
            onClick={() => void onAccept()}
            type="button"
          >
            {pending ? 'Accepting…' : 'Accept today’s challenge'}
          </button>
        )}

        {assignment.status === 'accepted' && (
          <div className="action-stack">
            <div className="increment-row" aria-label="Add push-up progress">
              <button disabled={pending} onClick={() => void onAdd(1)} type="button">
                +1
              </button>
              <button disabled={pending} onClick={() => void onAdd(5)} type="button">
                +5
              </button>
            </div>
            <button
              className="primary-button"
              disabled={pending || progress.current < progress.target}
              onClick={() => void onComplete()}
              type="button"
            >
              {progress.current < progress.target
                ? progress.target - progress.current + ' remaining'
                : pending
                  ? 'Completing…'
                  : 'Complete challenge'}
            </button>
          </div>
        )}

        {assignment.status === 'completed' && (
          <div className="completion-panel">
            <div>
              <span className="completion-check" aria-hidden="true">
                ✓
              </span>
              <p>
                <strong>{streak.current} day of deliberate action</strong>
                <small>{streak.lifetimeCompletions} challenge completed in total</small>
              </p>
            </div>
            <button className="secondary-button" onClick={onViewWall} type="button">
              View your wall
            </button>
          </div>
        )}
      </article>
    </>
  );
}

function WallView({ entries }: { entries: GoodnessEntryResponse[] }) {
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">Private by design</p>
        <h1>Your Wall of Goodness</h1>
        <p className="lede">
          A private record of the constructive actions you have completed—not a social feed.
        </p>
      </header>

      {entries.length === 0 ? (
        <div className="empty-state" role="status">
          Complete a challenge and it will appear here.
        </div>
      ) : (
        <div className="wall-list">
          {entries.map((entry) => (
            <article className="wall-card" key={entry.id}>
              <div className="wall-card__meta">
                <span className={'category-dot category-dot--' + entry.category} />
                <span>{entry.category}</span>
                <span aria-hidden="true">·</span>
                <time dateTime={entry.localDate}>{formatLocalDate(entry.localDate)}</time>
              </div>
              <h2>{entry.challengeTitle}</h2>
              <p className="wall-result">{entry.result}</p>
              {entry.reflection && <blockquote>{entry.reflection}</blockquote>}
              <p className="quality-line">Practiced: {entry.practicedQualities.join(', ')}</p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function HistoryView({ history }: { history: HistoryResponse | null }) {
  const streak = history?.streak ?? {
    current: 0,
    longest: 0,
    lifetimeCompletions: 0,
  };
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">Patterns, not pressure</p>
        <h1>Your practice over time</h1>
        <p className="lede">Consistency is useful evidence, never a measure of your worth.</p>
      </header>
      <div className="stat-grid">
        <article>
          <strong>{streak.current}</strong>
          <span>Current streak</span>
        </article>
        <article>
          <strong>{streak.longest}</strong>
          <span>Longest streak</span>
        </article>
        <article>
          <strong>{streak.lifetimeCompletions}</strong>
          <span>Lifetime actions</span>
        </article>
      </div>
    </>
  );
}

function SettingsView({ pending, onReset }: { pending: boolean; onReset: () => Promise<void> }) {
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">Development workspace</p>
        <h1>Preferences and safety</h1>
        <p className="lede">
          Production preferences will arrive in a later stage. Current data is fictional, in-memory,
          and resettable.
        </p>
      </header>
      <div className="settings-card">
        <div>
          <strong>Reset development data</strong>
          <p>Return today’s challenge, streak, and wall to their initial state.</p>
        </div>
        <button
          className="secondary-button"
          disabled={pending}
          onClick={() => void onReset()}
          type="button"
        >
          {pending ? 'Resetting…' : 'Reset'}
        </button>
      </div>
    </>
  );
}

export function App() {
  const [view, setView] = useState<View>('today');
  const [today, setToday] = useState<TodayResponse | null>(null);
  const [wallEntries, setWallEntries] = useState<GoodnessEntryResponse[]>([]);
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSecondaryData = useCallback(async () => {
    const [wall, nextHistory] = await Promise.all([loadWall(), loadHistory()]);
    setWallEntries(wall.entries);
    setHistory(nextHistory);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.all([
      loadToday(controller.signal),
      loadWall(controller.signal),
      loadHistory(controller.signal),
    ])
      .then(([nextToday, wall, nextHistory]) => {
        setToday(nextToday);
        setWallEntries(wall.entries);
        setHistory(nextHistory);
      })
      .catch((caught: unknown) => {
        if (!(caught instanceof DOMException && caught.name === 'AbortError')) {
          setError(caught instanceof Error ? caught.message : 'Daily Forge could not load.');
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  async function runAction(action: () => Promise<TodayResponse>, refresh = false) {
    setPending(true);
    setError(null);
    try {
      setToday(await action());
      if (refresh) {
        await refreshSecondaryData();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Daily Forge could not save progress.');
    } finally {
      setPending(false);
    }
  }

  async function reset() {
    await runAction(resetDevelopmentData, true);
    setView('today');
  }

  return (
    <div className="app-shell">
      <aside className="side-panel">
        <a
          className="brand"
          href="#today"
          onClick={() => {
            setView('today');
          }}
        >
          <span className="brand-mark" aria-hidden="true">
            DF
          </span>
          <span>
            <strong>Daily Forge</strong>
            <small>Practice, recorded.</small>
          </span>
        </a>

        <nav aria-label="Primary navigation">
          {navigation.map((item) => (
            <button
              className={view === item.id ? 'nav-item nav-item--active' : 'nav-item'}
              key={item.id}
              onClick={() => {
                setView(item.id);
              }}
              type="button"
            >
              <span aria-hidden="true">{item.marker}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="category-list">
          <p className="category-list__heading">Areas of practice</p>
          {challengeCategories.map((category) => (
            <div className="category-note" key={category}>
              <span className={'category-dot category-dot--' + category} aria-hidden="true" />
              <span>
                <strong>{category}</strong>
                <small>{categoryCopy[category]}</small>
              </span>
            </div>
          ))}
        </div>

        <div className="health health--ready" role="status">
          <span aria-hidden="true" />
          Development data · in memory
        </div>
      </aside>

      <main id="main-content">
        <div className="content-frame">
          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}
          {loading && <div className="loading-state">Preparing today’s challenge…</div>}
          {!loading && today && view === 'today' && (
            <TodayView
              onAccept={() => runAction(acceptToday)}
              onAdd={(amount) => runAction(() => addCountProgress(today.assignment.id, amount))}
              onComplete={() => runAction(() => completeToday(today.assignment.id), true)}
              onViewWall={() => {
                setView('wall');
              }}
              pending={pending}
              today={today}
            />
          )}
          {!loading && view === 'wall' && <WallView entries={wallEntries} />}
          {!loading && view === 'history' && <HistoryView history={history} />}
          {!loading && view === 'settings' && <SettingsView onReset={reset} pending={pending} />}
        </div>
      </main>

      <nav className="mobile-nav" aria-label="Primary mobile navigation">
        {navigation.map((item) => (
          <button
            aria-current={view === item.id ? 'page' : undefined}
            className={
              view === item.id ? 'mobile-nav__item mobile-nav__item--active' : 'mobile-nav__item'
            }
            key={item.id}
            onClick={() => {
              setView(item.id);
            }}
            type="button"
          >
            <span aria-hidden="true">{item.marker}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
