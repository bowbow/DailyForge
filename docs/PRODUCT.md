# Product specification

## Product statement

Daily Forge helps a person become more deliberate through one achievable daily
challenge and a private record of the constructive actions they have completed.

It is designed for someone interested in:

- Improving running-supportive strength, mobility, balance, and recovery without
  replacing or modifying an existing training plan.
- Improving habits of character, including prudence, temperance, courage,
  patience, generosity, honesty, humility, and attentiveness.
- Finding concrete ways to help other people or participate in community work.
- Developing as an artist through small digital-art exercises and experiments.

## Core loop

1. **Receive:** The user sees one challenge for their local day.
2. **Choose:** The user accepts it, requests a suitable replacement, or skips.
3. **Act:** The user performs the activity in the real world.
4. **Track:** The user records increments, time, checklist items, or an account
   of what they did.
5. **Complete:** The app applies the challenge's completion policy.
6. **Reflect:** The user may record what happened and what they noticed.
7. **Remember:** The completed action appears on the private Wall of Goodness.
8. **Continue:** The completion streak and accumulated wall encourage another
   day of deliberate action.

## Product principles

### Action over aspiration

Challenges describe a small observable action. They should not ask the user to
feel virtuous, declare an identity, or make an indefinite promise.

### Practice, not judgment

The app records what the user practiced. It does not decide whether the user is
good, compare their character with others, or assign moral scores.

### Self-reporting and trust

The user may record what they did without providing proof. Reflection is more
valuable than surveillance.

### Privacy over performance

The Wall of Goodness is a private memory and motivation tool, not a social feed.
No likes, followers, rankings, or automatic sharing are part of the product.

### Support existing training

Body challenges supplement an existing running plan. They should be brief,
adaptable, and screened against the user's stated limitations and training-day
intensity.

### Consent and dignity

People being helped are not challenge props. Prompts should encourage an offer
of appropriate help, respect a refusal, and avoid recording identifying or
vulnerable details.

## Challenge categories

### Body

Examples:

- Accumulate 20 push-ups using an appropriate variation.
- Spend five minutes on ankle and hip mobility.
- Complete 20 controlled calf raises.
- Take three brief movement breaks.
- Practice a short balance exercise.

Body challenges are not running workouts and do not prescribe mileage, pace,
intervals, or changes to the user's training plan.

### Character

Examples:

- Before a meaningful decision, write down the likely consequences of each
  option.
- Delay one nonessential impulse for ten minutes, then choose deliberately.
- Let someone finish speaking without planning a response.
- Ask for feedback and listen without immediately defending yourself.
- Correct a small misleading impression you have allowed to stand.

### Community

Examples:

- Offer appropriate help to someone who appears to need directions.
- Check in with a person who may be lonely.
- Pick up litter during a walk.
- Sign up for a suitable volunteer opportunity.
- Contribute a small amount of time to a community project.

Volunteer discovery is a later capability. Sources must be explicitly approved
and integrated through provider adapters.

### Creativity

Examples:

- Make a five-minute digital sketch using only two brushes.
- Learn and use one unfamiliar feature in an art application.
- Build a palette from something observed today.
- Rework an older drawing with a different light source.
- Create an image using only three values.

## Tracking modes

Every challenge declares one tracking mode and a completion policy:

- **Counter:** Record repeated units toward a target.
- **Timer:** Accumulate time toward a target duration.
- **Checklist:** Complete a small set of required steps.
- **Account:** Describe the action taken in the user's own words.
- **Artifact:** Attach or link an optional creative result; this is not proof.

Artifact support may follow the first MVP. A challenge may combine a primary
mode with an optional reflection, but completion rules should stay simple and
visible.

## Completion and streaks

- A challenge is complete when its published completion policy is satisfied.
- A completion belongs to the user's local calendar day.
- Completing the day's challenge extends the current streak.
- Missing a day ends the current streak but never removes wall entries, lifetime
  totals, or the longest-streak record.
- Replacement and skip behavior must be honest and non-punitive.
- Grace days or streak freezes are an open product decision.

## Wall of Goodness

The wall contains completed challenges only. Each entry is a historical snapshot
that may include:

- Completion date and category.
- Challenge title and prompt as presented that day.
- What the user recorded or accomplished.
- Optional reflection.
- Optional creative artifact in a later release.
- The quality or area practiced, expressed descriptively rather than as a score.

The wall supports chronological, calendar, and category views over time.
Resurfacing an older entry may help restore motivation, but must not expose
private content in a notification.

## MVP capabilities

The first usable release should provide:

- Private account access.
- Preference and safety onboarding.
- One assigned daily challenge.
- Accept, replace, and skip actions.
- Counter, timer, checklist, and written-account tracking.
- Completion with an optional reflection.
- Current and longest completion streaks.
- Private Wall of Goodness timeline.
- Responsive Pixel 6 and desktop layouts.
- Basic offline reading and queued progress updates.
- Data export and account deletion before use by people beyond the owner.

## Later capabilities

- Approved volunteer-opportunity providers.
- Web Push reminders.
- Challenge difficulty adaptation.
- Calendar and category summaries.
- Optional creative artifacts and wall visualization.
- Carefully designed challenge-authoring administration.
- More sophisticated offline conflict handling.

## Explicit non-goals

- Running-plan generation or modification.
- Medical, therapeutic, or emergency advice.
- Objective measurement of moral character.
- Social networking, public profiles, likes, rankings, or leaderboards.
- Proof-based surveillance of good actions.
- Advertising based on reflections or wall contents.
- Unapproved scraping of volunteer sites.

## Success signals

Initial success should be evaluated by behavior rather than growth metrics:

- The user understands the challenge and completion condition.
- Progress can be recorded in a few seconds.
- The user returns to complete challenges across several days.
- Reviewing the wall produces a credible sense of accumulated positive action.
- The app does not interfere with the user's training plan.
- The user trusts the privacy of their reflections.
