# In Full Tale: build notes

RUN_BUDGET: (not set. Per BRIEF.md: until James adds a reading below, a run stops after milestone 1 and reports its meter total.)

## Handoff (update after every commit)

- **Run 1, 2026-11-17.** In progress.
- Milestone status: 1 in progress; 2-5 not started.
- Next steps, in priority order:
  1. Finish milestone 1 (movement, sling, marked soldier, trophy pop and pickup, HUD, Pages live).
- Known bugs: none logged yet.
- This run's meter total: see Meter log.
- Estimated runs remaining: unknown until RUN_BUDGET is calibrated.

## Readings from James

(James: add one line per run, newest last, in this form.)

    Run N (date): used X% of weekly Fable limit.

No readings yet.

## Meter log

Formula: units = input + 1.25 x cache_write + 0.1 x cache_read + 5 x output (tools/meter.py).

| Run | After commit | Meter units |
|-----|--------------|-------------|
| 1 | (pre-commit baseline, includes repo-access troubleshooting) | 424,026 |

## Decisions

(See "Design plan" for the standing design. One line per choice, newest last.)

- 2026-11-17: Repo is jnshep4/in-full-tale (public). Branch claude/in-full-tale is the only branch; Pages serves it from the repo root.
- 2026-11-17: tools/meter.py sums every transcript under ~/.claude/projects/ (each run is a fresh container, so that directory is one run) and de-duplicates usage by message id.

## Liberties taken with the text

- Goliath is placed mid-quest as region 5's boss. In the text, Goliath (1 Samuel 17) comes before the bride price (1 Samuel 18).
