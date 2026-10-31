import { useEffect, useState } from 'react';

import { healthResponseSchema, type HealthResponse } from '@daily-forge/contracts';
import { challengeCategories, type ChallengeCategory } from '@daily-forge/domain';

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

async function fetchHealth(signal: AbortSignal): Promise<HealthResponse> {
  const response = await fetch('/api/v1/health', { signal });
  if (!response.ok) {
    throw new Error('Health request failed with ' + response.status);
  }
  return healthResponseSchema.parse(await response.json());
}

function TodayView() {
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">Your daily practice</p>
        <h1>One deliberate action.</h1>
        <p className="lede">
          Your first challenge will appear here. It will be clear, achievable, and yours to accept
          or replace.
        </p>
      </header>

      <article className="challenge-card challenge-card--preview">
        <div className="challenge-card__topline">
          <span className="category-pill">Body</span>
          <span className="effort-label">About 3 minutes</span>
        </div>
        <div>
          <p className="challenge-number">Challenge preview</p>
          <h2>Accumulate 20 push-ups today</h2>
          <p>
            Use any safe variation that suits you. Break the total into as many small sets as you
            like.
          </p>
        </div>
        <div className="preview-progress" aria-label="Preview progress: zero of twenty">
          <span>0</span>
          <div className="progress-track" aria-hidden="true">
            <div className="progress-fill" />
          </div>
          <span>20</span>
        </div>
        <button className="primary-button" type="button" disabled>
          Available in the next checkpoint
        </button>
      </article>
    </>
  );
}

function PlaceholderView({ view }: { view: Exclude<View, 'today'> }) {
  const content = {
    wall: {
      eyebrow: 'Private by design',
      title: 'Your Wall of Goodness',
      body: 'Completed challenges and reflections will collect here as evidence of deliberate action.',
    },
    history: {
      eyebrow: 'Patterns, not pressure',
      title: 'Your practice over time',
      body: 'See completed days, category balance, and streaks without comparison or ranking.',
    },
    settings: {
      eyebrow: 'Make it suitable',
      title: 'Preferences and safety',
      body: 'Choose challenge categories, physical constraints, reminders, and privacy controls.',
    },
  }[view];

  return (
    <header className="page-heading">
      <p className="eyebrow">{content.eyebrow}</p>
      <h1>{content.title}</h1>
      <p className="lede">{content.body}</p>
      <div className="empty-state" role="status">
        This space is ready for the next vertical slice.
      </div>
    </header>
  );
}

export function App() {
  const [view, setView] = useState<View>('today');
  const [health, setHealth] = useState<'checking' | 'ready' | 'unavailable'>('checking');

  useEffect(() => {
    const controller = new AbortController();
    void fetchHealth(controller.signal)
      .then(() => setHealth('ready'))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setHealth('unavailable');
        }
      });
    return () => controller.abort();
  }, []);

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

        <div className={'health health--' + health} role="status">
          <span aria-hidden="true" />
          {health === 'checking' && 'Checking local API'}
          {health === 'ready' && 'Local API ready'}
          {health === 'unavailable' && 'Local API unavailable'}
        </div>
      </aside>

      <main id="main-content">
        <div className="content-frame">
          {view === 'today' ? <TodayView /> : <PlaceholderView view={view} />}
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
