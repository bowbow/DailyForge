# Experience and interaction design

## Experience goal

Daily Forge should feel calm, concrete, private, and encouraging. It should help
the user take action without turning personal growth into a competitive game.

## Information architecture

The primary destinations are:

1. **Today** — today's challenges and progress.
2. **Areas** — the goals, expected practices, and boundaries for each category.
3. **Wall** — completed actions and reflections.
4. **History** — calendar, streaks, and completion summaries.
5. **Settings** — challenge preferences, safety constraints, reminders, privacy,
   export, and account management.

On a phone these may use bottom navigation. On desktop they may use a side rail
or top navigation. The information hierarchy should remain the same.

## Today screen

Today should normally show one independent challenge card for each category.
The user may complete any number of them; completing every area is not a daily
requirement. Each challenge card should show:

- Category and optional practiced quality.
- Clear action-oriented title.
- Short instructions.
- Completion target.
- Expected time or effort.
- Safety or consent note when relevant.
- Accept, replace, or skip before work begins.

After acceptance, the card exposes the appropriate tracker.

The desktop rail may show short, static category summaries. The dedicated Areas
destination is the single route to the full guides and must also be directly
reachable on mobile. Each guide explains the area's purpose, the kinds of
challenges to expect, examples, and important boundaries. In particular, Body
focuses on mobility, useful strength, balance, and muscle retention for healthy
ageing; it does not add aerobic work or modify the user's running plan.

The Body guide also presents the draft B80 capability portfolio and explains
the `B80 future goal → B60 reserve target → P60 baseline probe → daily
progression` model. It must make clear that goals are personalized, probes are
information rather than tests to fail, reserve assumptions are provisional,
and safe repeatable progress takes priority over speed.

The Creativity guide presents the atmospheric-landscape major quest, six
program goals, the recursive Studio Thinking cycle, the 15-minute episode
model, and the distinct roles of Rebelle, Gaea, and Unreal. It also shows the
current active creative work and lets the user mark it active, paused, or
finished without affecting streaks.

Creativity challenge cards identify their lane, primary Studio Habit, Studio
Structure, goal IDs, and related active work. These labels explain why the
challenge was selected without turning the habits into levels or scores. A
contextual private-reflection prompt may replace the generic reflection
placeholder. Completed Creativity wall entries retain the program context that
was presented with the challenge.

### Counter example

```text
Accumulate 20 push-ups today

12 / 20
[ +1 ] [ +5 ] [ Enter amount ]

8:20 AM   +5
1:10 PM   +7
```

Suitable variations should be visible without framing them as failure.

### Written-account example

```text
Offer useful help to one person today

What did you do?
[                                               ]

What did you notice? (optional)
[                                               ]

[ Complete challenge ]
```

The app should remind the user not to include names or sensitive details about
another person.

## Challenge states

Each daily challenge can be:

- Proposed.
- Accepted.
- In progress.
- Completed.
- Replaced.
- Skipped.
- Expired.

The UI must distinguish local progress waiting to synchronize from progress the
server has confirmed.

## Completion experience

Completion should be warm but restrained:

- Confirm the concrete action completed.
- Update the day-based streak only when this is the first completion for that
  local date, while always updating lifetime and category totals.
- Add the entry to the wall.
- Offer an optional reflection.
- Avoid confetti overload, moral praise, or language implying superiority.

Example:

> Challenge complete. You have taken deliberate action for four consecutive
> days.

## Wall of Goodness

The wall is a private evidence bank. It is not styled as a public feed and does
not contain social metrics.

A card may show:

```text
Community · November 3

Offered practical help

I noticed a visitor looking confused and walked with them to the correct
building.

Practiced: attentiveness and generosity
```

Views:

- Timeline, newest first.
- Calendar of completed days.
- Category filters.
- Saved highlights.
- Optional monthly reflection.

Future visual treatments may let the wall become a mosaic, constellation, or
artwork as entries accumulate. The timeline must remain accessible and usable
without the visualization.

## Streak presentation

Prefer:

> 4 days of deliberate action

Avoid:

> Do not break your streak!

Show current streak, longest streak, lifetime completions, and category totals.
A reset should be factual and should immediately invite a fresh start.

## Replacements and skips

Replacement is necessary when a challenge is unsafe, unsuitable, infeasible, or
poorly timed. The replacement flow should ask for an optional reason that helps
future selection without making the user justify themselves.

Skipping should remain available. It does not create a wall entry or count as a
completion.

## Responsive behavior

### Pixel 6 and similar phones

- One primary column.
- Thumb-reachable tracking controls.
- Minimum 44 by 44 CSS-pixel interactive targets.
- No horizontal scrolling for normal content.
- Tracker remains usable with the on-screen keyboard visible.

### Desktop

- Constrain reading width.
- Allow Today and recent wall context to coexist when space permits.
- Support keyboard navigation and shortcuts only as enhancements.
- Do not make hover the only way to discover an action.

## Offline behavior

- Previously loaded Today and Wall content remains readable.
- Progress events can be queued while offline.
- Pending items are visibly marked.
- The app retries idempotently after connectivity returns.
- Completion and streak changes are provisional until acknowledged by the
  server.
- Conflicts are explained in plain language and never silently discard a user's
  reflection.

## Tone

- Use direct verbs and specific actions.
- Be encouraging without flattery.
- Avoid shame, moral certainty, diagnosis, or therapy-like claims.
- Use "practice" and "deliberate action" more often than "success" and "failure."
- For service prompts, emphasize consent, usefulness, and respect.

## Accessibility

- Target WCAG 2.2 AA.
- Use semantic HTML and native controls where practical.
- Maintain visible keyboard focus.
- Announce counter updates without overwhelming screen-reader users.
- Do not encode categories by color alone.
- Support zoom, text enlargement, reduced motion, and high contrast.
- Make timers operable without precise pointer movement.

## Area color language

Each area has a consistent visual palette so it is recognizable across Today,
Areas, the private Wall, and History:

- Body: red-orange, suggesting grounded physical practice and energy.
- Character: violet, suggesting reflection and judgment.
- Community: green, suggesting connection, care, and mutual flourishing.
- Creativity: blue, suggesting imagination, exploration, and open possibility.

The canonical palette values live in `apps/web/src/area-theme.css`. Components
must consume the shared `--area-*` custom properties rather than introducing
new hard-coded category colors. Palette changes should therefore be possible in
one file. Continue to show category names, meaningful text, and status symbols;
color reinforces area identity but is never the only cue.
