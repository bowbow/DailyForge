import { useCallback, useEffect, useState } from 'react';

import {
  type GoodnessEntryResponse,
  type HistoryResponse,
  type TodayChallengeResponse,
  type TodayResponse,
} from '@daily-forge/contracts';
import { challengeCategories, type ChallengeCategory } from '@daily-forge/domain';

import {
  acceptToday,
  addCountProgress,
  addTimeProgress,
  completeChecklistItem,
  completeToday,
  confirmProgress,
  loadHistory,
  loadToday,
  loadWall,
  replaceToday,
  resetDevelopmentData,
  skipToday,
} from './api';

type View = 'today' | 'areas' | 'wall' | 'history' | 'settings';

const navigation: { id: View; label: string; marker: string }[] = [
  { id: 'today', label: 'Today', marker: '01' },
  { id: 'areas', label: 'Areas', marker: '02' },
  { id: 'wall', label: 'Wall', marker: '03' },
  { id: 'history', label: 'History', marker: '04' },
  { id: 'settings', label: 'Settings', marker: '05' },
];

interface AreaGuide {
  short: string;
  goal: string;
  focuses: string[];
  examples: string[];
  boundaries: string[];
}

const areaGuides: Record<ChallengeCategory, AreaGuide> = {
  body: {
    short: 'Mobility, strength, balance, and muscle retention for an active life.',
    goal: 'Build and preserve the practical strength, mobility, balance, and physical reserve needed to keep participating in a personally meaningful life well into older age.',
    focuses: [
      'Short strength actions using safe, adaptable variations',
      'Comfortable ankle, hip, shoulder, and upper-back mobility',
      'Balance, posture, and movement breaks',
      'Recovery habits that complement an existing running plan',
    ],
    examples: [
      'Accumulate a manageable number of push-ups',
      'Complete controlled calf raises or sit-to-stands',
      'Take a five-minute mobility reset',
      'Practice a brief balance exercise near stable support',
    ],
    boundaries: [
      'No aerobic challenges, mileage, pace targets, or intervals',
      'No changes to the user’s disciplined running plan',
      'No medical or rehabilitation claims',
      'Pain-free variations and replacement always remain available',
    ],
  },
  character: {
    short: 'Small, observable opportunities to practice deliberate character.',
    goal: 'Strengthen habits such as prudence, temperance, courage, patience, honesty, generosity, and humility through concrete choices.',
    focuses: [
      'Pausing before a meaningful decision',
      'Listening without preparing a response',
      'Delaying a nonessential impulse and choosing deliberately',
      'Correcting a small mistake or misleading impression',
    ],
    examples: [
      'Consider the likely effects of one decision',
      'Ask for feedback without immediately defending yourself',
      'Let another person finish speaking',
      'Practice one honest, proportionate correction',
    ],
    boundaries: [
      'The app records practice; it does not assign moral scores',
      'Challenges ask for actions, not declarations of virtue',
      'Reflections remain private and optional',
    ],
  },
  community: {
    short: 'Concrete, consent-aware ways to be useful to other people.',
    goal: 'Encourage attentive, respectful service—starting with small acts of help and later including approved volunteer opportunities.',
    focuses: [
      'Offering help instead of assuming it is wanted',
      'Checking in thoughtfully with someone you know',
      'Improving a shared place through a modest action',
      'Finding suitable volunteer work from approved sources in a later phase',
    ],
    examples: [
      'Offer directions or practical help and respect the answer',
      'Make one thoughtful check-in',
      'Pick up litter during an ordinary walk',
      'Sign up for a suitable community activity when integrations arrive',
    ],
    boundaries: [
      'People are never treated as props for completing a challenge',
      'A respectful offer can count even when it is declined',
      'Do not record names, vulnerabilities, or identifying details',
    ],
  },
  creativity: {
    short: 'Brief digital-art experiments, constraints, and tool discovery.',
    goal: 'Develop an artistic practice through low-pressure experiments that build observation, fluency with digital tools, and creative courage.',
    focuses: [
      'Short sketches with deliberate constraints',
      'Learning one unfamiliar digital-art feature',
      'Color, value, light, composition, and brush experiments',
      'Reworking existing art to explore a different decision',
    ],
    examples: [
      'Make a ten-minute sketch with one brush and two colors',
      'Build and save a three-color palette',
      'Try one unfamiliar tool in an art application',
      'Re-light an older drawing or reduce it to three values',
    ],
    boundaries: [
      'Experiments are practice, not tests of artistic worth',
      'Sharing artwork is never required as proof',
      'Optional artifacts will remain private when added later',
    ],
  },
};

interface BodyAge80Goal {
  id: string;
  title: string;
  description: string;
  optional?: boolean;
}

const bodyAge80Goals: BodyAge80Goal[] = [
  {
    id: 'B80-01',
    title: 'Rise from the floor',
    description:
      'Move from floor sitting to standing using no more than one hand on stable support, then return under control.',
  },
  {
    id: 'B80-02',
    title: 'Rise repeatedly from a chair',
    description:
      'Complete five controlled stands from a typical firm dining chair without using the arms.',
  },
  {
    id: 'B80-03',
    title: 'Lift a backpack to shoulder height',
    description:
      'Lift a 20-pound backpack from the floor, stand securely, place it on a shoulder-height surface, and lower it under control.',
  },
  {
    id: 'B80-04',
    title: 'Stow and retrieve travel luggage',
    description:
      'Place a 20-pound suitcase from waist height onto an overhead shelf and retrieve it under control.',
  },
  {
    id: 'B80-05',
    title: 'Carry necessities upstairs',
    description:
      'Carry 20 pounds in a rail-accessible arrangement up three ordinary flights, with pauses allowed.',
  },
  {
    id: 'B80-06',
    title: 'Lift a low object',
    description:
      'Use a comfortable squat or hinge to lift a stable 20-pound object from a low position to waist height.',
  },
  {
    id: 'B80-07',
    title: 'Navigate curbs and obstacles',
    description:
      'Step up and down a standard curb and cross a low household obstacle in either direction without losing balance.',
  },
  {
    id: 'B80-08',
    title: 'Dress and reach independently',
    description:
      'Put on shoes or socks using a chosen safe strategy and reach commonly used shoulder-height and overhead shelves.',
  },
  {
    id: 'B80-09',
    title: 'Exit a pool without a ladder',
    description:
      'When personally relevant, move from the water onto the deck without another person’s assistance.',
    optional: true,
  },
  {
    id: 'B80-10',
    title: 'Keep participating in your life',
    description:
      'Define personal events such as lifting and playing with grandchildren, handling air travel, or hiking with a backpack.',
  },
];

const bodyResources = [
  {
    type: 'Video + podcast',
    title: 'Training for the Centenarian Decathlon',
    description:
      'Peter Attia explains choosing personal later-life capabilities and working backward through strength, stability, and other training pillars.',
    href: 'https://peterattiamd.com/training-for-the-centenarian-decathlon/',
  },
  {
    type: 'Podcast',
    title: 'Exercising for longevity',
    description:
      'A chaptered overview of strength, stability, aerobic fitness, and the reasoning behind preparing now for useful movement later in life.',
    href: 'https://peterattiamd.com/exercising-for-longevity/',
  },
  {
    type: 'Podcast + notes',
    title: 'Building strength and muscle mass',
    description:
      'A focused discussion of age-related changes in muscle and strength, progressive overload, power, and practical training considerations.',
    href: 'https://peterattiamd.com/strengthandmuscle/',
  },
] as const;

function BodyProgramApproach() {
  return (
    <section className="body-program" aria-labelledby="body-program-heading">
      <div className="body-program__intro">
        <p className="eyebrow">A capability-first program</p>
        <h3 id="body-program-heading">Start with the life you want at 80.</h3>
        <p>
          Body challenges are not random exercises. We begin with concrete future capabilities, work
          backward to the reserve worth building now, safely discover the user’s current baseline,
          and then progress one small step at a time.
        </p>
      </div>

      <ol className="backcast-flow" aria-label="How Body goals become daily challenges">
        <li>
          <span>B80</span>
          <strong>Define age-80 life</strong>
          <p>Choose specific tasks that preserve independence and participation.</p>
        </li>
        <li>
          <span>B60</span>
          <strong>Build present reserve</strong>
          <p>Backcast stronger age-60 targets so future decline does not erase the capability.</p>
        </li>
        <li>
          <span>P60</span>
          <strong>Find the baseline</strong>
          <p>Use conservative probes to learn difficulty, stability, asymmetry, and response.</p>
        </li>
        <li>
          <span>Daily</span>
          <strong>Progress patiently</strong>
          <p>Advance one variable only after comfortable, repeatable performance.</p>
        </li>
      </ol>

      <div className="body-program__copy">
        <h3>Draft age-80 capability portfolio</h3>
        <p>
          These are starting definitions, not universal standards. Loads, support, environment, and
          personally meaningful events are adjusted to the user before they become program targets.
        </p>
      </div>

      <ol className="body-goals">
        {bodyAge80Goals.map((goal) => (
          <li key={goal.id}>
            <div className="body-goal__meta">
              <span>{goal.id}</span>
              {goal.optional && <small>Optional</small>}
            </div>
            <strong>{goal.title}</strong>
            <p>{goal.description}</p>
          </li>
        ))}
      </ol>

      <div className="body-program__principles">
        <section>
          <h3>Backwards projection</h3>
          <p>
            B60 targets add practical reserve to B80 goals. Initial planning may use approximately
            1.5 times a future load or twice its repetitions, but those are transparent starting
            assumptions—not predictions of how one person will age.
          </p>
        </section>
        <section>
          <h3>Probes, not tests to fail</h3>
          <p>
            Early P60 challenges begin conservatively. Unable, modified, painful, or unsteady are
            useful observations. They never break a streak and immediately favor an easier or safer
            variation.
          </p>
        </section>
        <section>
          <h3>Safe progress over speed</h3>
          <p>
            Difficulty, pain, balance, side-to-side differences, confidence, and next-day response
            inform progression. Daily participation includes recovery and mobility; it does not mean
            hard loading every day.
          </p>
        </section>
      </div>
    </section>
  );
}

function BodyResources() {
  return (
    <section className="body-resources" aria-labelledby="body-resources-heading">
      <div className="body-resources__intro">
        <p className="eyebrow">Further exploration</p>
        <h3 id="body-resources-heading">Ideas behind the approach</h3>
        <p>
          These optional resources provide context for backcasting from later-life capabilities and
          preserving physical reserve. They are background material, not individualized medical or
          training advice.
        </p>
      </div>
      <div className="body-resources__list">
        {bodyResources.map((resource) => (
          <a
            className="body-resource"
            href={resource.href}
            key={resource.href}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span className="body-resource__type">{resource.type}</span>
            <strong>{resource.title}</strong>
            <p>{resource.description}</p>
            <span className="body-resource__link">
              Open resource <span aria-hidden="true">↗</span>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

function formatLocalDate(localDate: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(localDate + 'T00:00:00.000Z'));
}

function recentLocalDates(endLocalDate: string, count: number): string[] {
  const end = new Date(endLocalDate + 'T00:00:00.000Z');
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(end);
    date.setUTCDate(date.getUTCDate() - index);
    return date.toISOString().slice(0, 10);
  });
}

function formatHistoryDay(localDate: string): { weekday: string; date: string } {
  const date = new Date(localDate + 'T00:00:00.000Z');
  return {
    weekday: new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(date),
    date: new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(date),
  };
}

function progressReady(progress: TodayChallengeResponse['progress']): boolean {
  switch (progress.kind) {
    case 'counter':
      return progress.current >= progress.target;
    case 'confirmation':
      return progress.confirmed;
    case 'checklist':
      return progress.completedItemIds.length >= progress.items.length;
    case 'timer':
      return progress.currentSeconds >= progress.targetSeconds;
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return seconds + ' sec';
  const minutes = Math.floor(seconds / 60);
  return minutes + (minutes === 1 ? ' min' : ' mins');
}

interface ProgressControlsProps {
  progress: TodayChallengeResponse['progress'];
  pending: boolean;
  onAddCount: (amount: number) => Promise<void>;
  onConfirm: () => Promise<void>;
  onCompleteChecklistItem: (itemId: string) => Promise<void>;
  onAddTime: (seconds: number) => Promise<void>;
}

function ProgressControls(props: ProgressControlsProps) {
  const { progress, pending } = props;
  if (progress.kind === 'counter') {
    const percent = Math.min(100, Math.round((progress.current / progress.target) * 100));
    return (
      <div className="progress-block">
        <div className="progress-copy" aria-live="polite">
          <strong>{progress.current}</strong>
          <span>of {progress.target}</span>
        </div>
        <div
          aria-label={progress.current + ' of ' + progress.target + ' ' + progress.unit}
          aria-valuemax={progress.target}
          aria-valuemin={0}
          aria-valuenow={progress.current}
          className="progress-track"
          role="progressbar"
        >
          <div className="progress-fill" style={{ width: percent + '%' }} />
        </div>
        <div className="increment-row" aria-label={'Add ' + progress.unit + ' progress'}>
          {progress.increments.map((increment) => (
            <button
              disabled={pending}
              key={increment}
              onClick={() => void props.onAddCount(increment)}
              type="button"
            >
              +{increment}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (progress.kind === 'confirmation') {
    return (
      <button
        aria-pressed={progress.confirmed}
        className={progress.confirmed ? 'confirm-action confirm-action--done' : 'confirm-action'}
        disabled={pending || progress.confirmed}
        onClick={() => void props.onConfirm()}
        type="button"
      >
        <span aria-hidden="true">{progress.confirmed ? '✓' : '○'}</span>
        {progress.confirmed ? 'Action recorded' : progress.actionLabel}
      </button>
    );
  }

  if (progress.kind === 'checklist') {
    return (
      <div className="checklist" aria-label="Challenge steps">
        {progress.items.map((item) => {
          const completed = progress.completedItemIds.includes(item.id);
          return (
            <button
              aria-pressed={completed}
              className={completed ? 'checklist-item checklist-item--done' : 'checklist-item'}
              disabled={pending || completed}
              key={item.id}
              onClick={() => void props.onCompleteChecklistItem(item.id)}
              type="button"
            >
              <span aria-hidden="true">{completed ? '✓' : '○'}</span>
              {item.label}
            </button>
          );
        })}
      </div>
    );
  }

  const percent = Math.min(
    100,
    Math.round((progress.currentSeconds / progress.targetSeconds) * 100),
  );
  return (
    <div className="progress-block">
      <div className="progress-copy" aria-live="polite">
        <strong>{formatDuration(progress.currentSeconds)}</strong>
        <span>of {formatDuration(progress.targetSeconds)}</span>
      </div>
      <div
        aria-label={
          formatDuration(progress.currentSeconds) + ' of ' + formatDuration(progress.targetSeconds)
        }
        aria-valuemax={progress.targetSeconds}
        aria-valuemin={0}
        aria-valuenow={progress.currentSeconds}
        className="progress-track"
        role="progressbar"
      >
        <div className="progress-fill" style={{ width: percent + '%' }} />
      </div>
      <div className="increment-row" aria-label="Record practice time">
        {progress.incrementsSeconds.map((seconds) => (
          <button
            disabled={pending}
            key={seconds}
            onClick={() => void props.onAddTime(seconds)}
            type="button"
          >
            +{formatDuration(seconds)}
          </button>
        ))}
      </div>
    </div>
  );
}

interface ChallengeCardProps extends ProgressControlsProps {
  slot: TodayChallengeResponse;
  streak: TodayResponse['streak'];
  onAccept: () => Promise<void>;
  onReplace: () => Promise<void>;
  onSkip: () => Promise<void>;
  onComplete: (reflection?: string) => Promise<void>;
  onViewWall: () => void;
}

function ChallengeCard(props: ChallengeCardProps) {
  const { assignment, progress, replacementCount } = props.slot;
  const challenge = assignment.challenge;
  const [reflection, setReflection] = useState('');
  const ready = progressReady(progress);
  const categoryName = challenge.category.charAt(0).toUpperCase() + challenge.category.slice(1);

  return (
    <article className="challenge-card" data-category={challenge.category}>
      <div className="challenge-card__topline">
        <span className={'category-pill category-pill--' + challenge.category}>{categoryName}</span>
        <span className="effort-label">About {challenge.expectedMinutes} minutes</span>
      </div>

      <div>
        <p className="challenge-number">
          {assignment.status === 'proposed' && 'Available today'}
          {assignment.status === 'accepted' && 'Challenge in progress'}
          {assignment.status === 'completed' && 'Challenge complete'}
          {assignment.status === 'skipped' && 'Skipped for today'}
        </p>
        <h2>{challenge.title}</h2>
        <p>{challenge.instructions}</p>
        {challenge.safetyNote && <p className="safety-note">{challenge.safetyNote}</p>}
      </div>

      {assignment.status === 'proposed' && (
        <div className="proposal-actions">
          <button
            className="primary-button"
            disabled={props.pending}
            onClick={() => void props.onAccept()}
            type="button"
          >
            {props.pending ? 'Saving…' : 'Accept this challenge'}
          </button>
          <button
            className="text-button"
            disabled={props.pending}
            onClick={() => void props.onReplace()}
            type="button"
          >
            Try a different {challenge.category} challenge
          </button>
          <button
            className="text-button text-button--quiet"
            disabled={props.pending}
            onClick={() => void props.onSkip()}
            type="button"
          >
            Skip this area today
          </button>
          {replacementCount > 0 && (
            <small className="replacement-note">Replaced without penalty.</small>
          )}
        </div>
      )}

      {assignment.status === 'accepted' && (
        <div className="action-stack">
          <ProgressControls {...props} progress={progress} />
          <label className="reflection-field">
            <span>Optional reflection</span>
            <textarea
              maxLength={1000}
              onChange={(event) => setReflection(event.target.value)}
              placeholder="What did you do or notice? This stays private."
              rows={3}
              value={reflection}
            />
          </label>
          <button
            className="primary-button"
            disabled={props.pending || !ready}
            onClick={() => void props.onComplete(reflection.trim() || undefined)}
            type="button"
          >
            {!ready
              ? 'Finish the visible steps first'
              : props.pending
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
              <strong>
                {props.streak.current} {props.streak.current === 1 ? 'day' : 'days'} of deliberate
                action
              </strong>
              <small>
                {props.streak.lifetimeCompletions}{' '}
                {props.streak.lifetimeCompletions === 1 ? 'challenge' : 'challenges'} completed in
                total
              </small>
            </p>
          </div>
          <button className="secondary-button" onClick={props.onViewWall} type="button">
            View your wall
          </button>
        </div>
      )}

      {assignment.status === 'skipped' && (
        <div className="skip-panel" role="status">
          <span aria-hidden="true">—</span>
          <p>
            <strong>No action is required in {categoryName} today.</strong>
            <small>Your wall and completion totals are unchanged.</small>
          </p>
        </div>
      )}
    </article>
  );
}

interface TodayViewProps {
  today: TodayResponse;
  pendingAssignmentId: string | null;
  onAccept: (assignmentId: string) => Promise<void>;
  onReplace: (assignmentId: string) => Promise<void>;
  onSkip: (assignmentId: string) => Promise<void>;
  onAddCount: (assignmentId: string, amount: number) => Promise<void>;
  onConfirm: (assignmentId: string) => Promise<void>;
  onCompleteChecklistItem: (assignmentId: string, itemId: string) => Promise<void>;
  onAddTime: (assignmentId: string, seconds: number) => Promise<void>;
  onComplete: (assignmentId: string, reflection?: string) => Promise<void>;
  onViewWall: () => void;
}

function TodayView(props: TodayViewProps) {
  const localDate = props.today.challenges[0]?.assignment.localDate;
  const completedCount = props.today.challenges.filter(
    ({ assignment }) => assignment.status === 'completed',
  ).length;

  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">{localDate ? formatLocalDate(localDate) : 'Today'}</p>
        <h1>
          {completedCount > 0
            ? `${completedCount} action${completedCount === 1 ? '' : 's'}, recorded.`
            : 'Four ways to practice.'}
        </h1>
        <p className="lede">
          One challenge is available in each area. Choose any that fit today; completing one extends
          the daily streak, and every completion is remembered.
        </p>
      </header>

      <div className="daily-overview" aria-label="Today’s challenge summary">
        <strong>{completedCount} of 4 completed</strong>
        <span>There is no requirement to complete every area.</span>
      </div>

      <div className="challenge-list">
        {props.today.challenges.map((slot) => {
          const assignmentId = slot.assignment.id;
          return (
            <ChallengeCard
              key={assignmentId}
              onAccept={() => props.onAccept(assignmentId)}
              onAddCount={(amount) => props.onAddCount(assignmentId, amount)}
              onAddTime={(seconds) => props.onAddTime(assignmentId, seconds)}
              onComplete={(reflection) => props.onComplete(assignmentId, reflection)}
              onCompleteChecklistItem={(itemId) =>
                props.onCompleteChecklistItem(assignmentId, itemId)
              }
              onConfirm={() => props.onConfirm(assignmentId)}
              onReplace={() => props.onReplace(assignmentId)}
              onSkip={() => props.onSkip(assignmentId)}
              onViewWall={props.onViewWall}
              pending={props.pendingAssignmentId === assignmentId}
              progress={slot.progress}
              slot={slot}
              streak={props.today.streak}
            />
          );
        })}
      </div>
    </>
  );
}

function AreasView({
  selected,
  onSelect,
  onViewToday,
}: {
  selected: ChallengeCategory;
  onSelect: (category: ChallengeCategory) => void;
  onViewToday: () => void;
}) {
  const guide = areaGuides[selected];
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">Areas of practice</p>
        <h1>What are we building?</h1>
        <p className="lede">
          Each area has a clear purpose and boundaries. Challenges are small practices toward those
          goals, not judgments or replacements for professional guidance.
        </p>
      </header>

      <div className="area-tabs" aria-label="Choose an area of practice">
        {challengeCategories.map((category) => (
          <button
            aria-pressed={selected === category}
            className={
              selected === category
                ? `area-tab area-tab--${category} area-tab--active`
                : `area-tab area-tab--${category}`
            }
            key={category}
            onClick={() => onSelect(category)}
            type="button"
          >
            <span className={'category-dot category-dot--' + category} aria-hidden="true" />
            {category}
          </button>
        ))}
      </div>

      <article className={'area-detail area-detail--' + selected}>
        <div className="area-detail__heading">
          <span className={'category-pill category-pill--' + selected}>{selected}</span>
          <h2>{guide.short}</h2>
        </div>
        <section>
          <h3>Goal</h3>
          <p>{guide.goal}</p>
        </section>
        {selected === 'body' && <BodyProgramApproach />}
        <div className="area-detail__columns">
          <section>
            <h3>What challenges focus on</h3>
            <ul>
              {guide.focuses.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section>
            <h3>Examples you can expect</h3>
            <ul>
              {guide.examples.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
        <section className="area-boundaries">
          <h3>Boundaries</h3>
          <ul>
            {guide.boundaries.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        {selected === 'body' && <BodyResources />}
        <button className="primary-button area-detail__action" onClick={onViewToday} type="button">
          View today’s {selected} challenge
        </button>
      </article>
    </>
  );
}

function WallView({ entries }: { entries: GoodnessEntryResponse[] }) {
  const [category, setCategory] = useState<ChallengeCategory | 'all'>('all');
  const visibleEntries =
    category === 'all' ? entries : entries.filter((entry) => entry.category === category);
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">Private by design</p>
        <h1>Your Wall of Goodness</h1>
        <p className="lede">
          A private record of the constructive actions you have completed—not a social feed.
        </p>
      </header>
      <div className="filter-row" aria-label="Filter wall by area">
        {(['all', ...challengeCategories] as const).map((value) => (
          <button
            aria-pressed={category === value}
            className={
              category === value
                ? `filter-chip filter-chip--${value} filter-chip--active`
                : `filter-chip filter-chip--${value}`
            }
            key={value}
            onClick={() => setCategory(value)}
            type="button"
          >
            {value}
          </button>
        ))}
      </div>
      {visibleEntries.length === 0 ? (
        <div className="empty-state" role="status">
          {entries.length === 0
            ? 'Complete a challenge and it will appear here.'
            : 'No completed challenges in this area yet.'}
        </div>
      ) : (
        <div className="wall-list">
          {visibleEntries.map((entry) => (
            <article className="wall-card" data-category={entry.category} key={entry.id}>
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

function HistoryView({
  history,
  entries,
  todayLocalDate,
}: {
  history: HistoryResponse | null;
  entries: GoodnessEntryResponse[];
  todayLocalDate: string | undefined;
}) {
  const streak = history?.streak ?? { current: 0, longest: 0, lifetimeCompletions: 0 };
  const entriesByDate = entries.reduce<Record<string, number>>((counts, entry) => {
    counts[entry.localDate] = (counts[entry.localDate] ?? 0) + 1;
    return counts;
  }, {});
  const recentDays = todayLocalDate ? recentLocalDates(todayLocalDate, 10) : [];
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
      <div className="category-summary">
        <h2>Actions by area</h2>
        {challengeCategories.map((category) => (
          <div data-category={category} key={category}>
            <span className={'category-dot category-dot--' + category} aria-hidden="true" />
            <span>{category}</span>
            <strong>{history?.completionsByCategory[category] ?? 0}</strong>
          </div>
        ))}
      </div>
      {recentDays.length > 0 && (
        <section className="recent-practice" aria-labelledby="recent-practice-heading">
          <div className="recent-practice__heading">
            <div>
              <p className="eyebrow">Development sample</p>
              <h2 id="recent-practice-heading">The last ten days</h2>
            </div>
            <p>Quiet days remain visible without penalty.</p>
          </div>
          <div className="practice-days">
            {recentDays.map((localDate, index) => {
              const count = entriesByDate[localDate] ?? 0;
              const label = formatHistoryDay(localDate);
              return (
                <article
                  className={count > 0 ? 'practice-day practice-day--active' : 'practice-day'}
                  key={localDate}
                >
                  <div>
                    <time dateTime={localDate}>
                      <strong>{index === 0 ? 'Today' : label.weekday}</strong>
                      <span>{label.date}</span>
                    </time>
                  </div>
                  <span className="practice-day__mark" aria-hidden="true">
                    {count > 0 ? '✓' : '—'}
                  </span>
                  <p>
                    {count > 0
                      ? `${count} action${count === 1 ? '' : 's'} completed`
                      : 'No completion recorded'}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      )}
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
          <p>Restore today’s challenges and the fictional sample history.</p>
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
  const [selectedArea, setSelectedArea] = useState<ChallengeCategory>('body');
  const [today, setToday] = useState<TodayResponse | null>(null);
  const [wallEntries, setWallEntries] = useState<GoodnessEntryResponse[]>([]);
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);
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
      loadWall(undefined, controller.signal),
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

  async function runAction(target: string, action: () => Promise<TodayResponse>, refresh = false) {
    setPendingTarget(target);
    setError(null);
    try {
      setToday(await action());
      if (refresh) await refreshSecondaryData();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Daily Forge could not save progress.');
    } finally {
      setPendingTarget(null);
    }
  }

  async function reset() {
    await runAction('reset', resetDevelopmentData, true);
    setView('today');
  }

  return (
    <div className="app-shell">
      <aside className="side-panel">
        <a className="brand" href="#today" onClick={() => setView('today')}>
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
              onClick={() => setView(item.id)}
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
            <div className={'category-note category-note--' + category} key={category}>
              <span className={'category-dot category-dot--' + category} aria-hidden="true" />
              <span>
                <strong>{category}</strong>
                <small>{areaGuides[category].short}</small>
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
          {loading && <div className="loading-state">Preparing today’s challenges…</div>}
          {!loading && today && view === 'today' && (
            <TodayView
              onAccept={(id) => runAction(id, () => acceptToday(id))}
              onAddCount={(id, amount) => runAction(id, () => addCountProgress(id, amount))}
              onAddTime={(id, seconds) => runAction(id, () => addTimeProgress(id, seconds))}
              onComplete={(id, reflection) =>
                runAction(id, () => completeToday(id, reflection), true)
              }
              onCompleteChecklistItem={(id, itemId) =>
                runAction(id, () => completeChecklistItem(id, itemId))
              }
              onConfirm={(id) => runAction(id, () => confirmProgress(id))}
              onReplace={(id) => runAction(id, () => replaceToday(id))}
              onSkip={(id) => runAction(id, () => skipToday(id))}
              onViewWall={() => setView('wall')}
              pendingAssignmentId={pendingTarget}
              today={today}
            />
          )}
          {!loading && view === 'areas' && (
            <AreasView
              selected={selectedArea}
              onSelect={setSelectedArea}
              onViewToday={() => setView('today')}
            />
          )}
          {!loading && view === 'wall' && <WallView entries={wallEntries} />}
          {!loading && view === 'history' && (
            <HistoryView
              entries={wallEntries}
              history={history}
              todayLocalDate={today?.challenges[0]?.assignment.localDate}
            />
          )}
          {!loading && view === 'settings' && (
            <SettingsView onReset={reset} pending={pendingTarget === 'reset'} />
          )}
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
            onClick={() => setView(item.id)}
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
