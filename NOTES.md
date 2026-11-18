# In Full Tale: build notes

RUN_BUDGET: 18,900,000 meter units per run. Stop line (90%): 17,010,000.
Provisional: Claude estimated it on 2026-11-18 from the session's own rate-limit telemetry, at James's request, because James had not yet taken a reading. Math and caveats are under "Calibration". A reading written by James under "Readings from James" replaces it.

## Handoff (update after every commit)

- **Last run:** run 1, 2026-11-17. Stopped after milestone 1, as the brief required while RUN_BUDGET was unset. On 2026-11-18 James asked for a ballpark of half his weekly Fable limit; RUN_BUDGET is now set (provisional), so the next run starts milestone 2.
- **Milestone status:** 1 done and pushed. 2, 3, 4, 5 not started.
- **Blocked on James (one-time, about 30 seconds):** GitHub Pages is not switched on. The session cannot do it (the Pages API is closed to it). In the repo: Settings > Pages > Source "Deploy from a branch" > branch `claude/in-full-tale`, folder `/ (root)` > Save. The game will then be at https://jnshep4.github.io/in-full-tale/. The branch already carries `.nojekyll` and needs no build step.
- **Optional, from James (better calibration):** after any run, read the Fable weekly meter on the usage page and add a line under "Readings from James". Until then the provisional RUN_BUDGET stands.
- **Next steps, in priority order:**
  1. At the start of the run, follow "Calibration > Start of every run": check for a newer reading from James, and record the starting utilization from the rate-limit telemetry.
  2. Milestone 2: finish region 1 (20 marked soldiers across several rooms, room-to-room exits, the captain Shalmek, the verse card as a DOM overlay in `#ui`, the dash power-up) and build the hub at Saul's camp.
  3. Extend `src/world/reach.js` and `tests/reach.test.mjs` with gates and power sets as soon as the first gate tile exists (see "Reachability model").
  4. Add `tests/play/m2.cjs`: boss fight, verse card text read from the DOM and compared with `src/data/verses.js`, power pickup.
- **Known bugs and rough edges:**
  - A trophy that bounces onto a ledge David cannot reach from where the soldier fell would be stuck there. No such ledge exists in the current room, and stakes and pits already send a trophy back to its soldier's post. Keep this in mind when placing soldiers near gated ledges; the simple fix is to send any trophy still unreachable after a few seconds back to its post.
  - The control hint bar shows for the first 30 seconds of play time on a save and has no "seen" flag.
  - No title screen, music, or settings yet (milestone 5). Audio starts on the first key press.
- **This run's meter total:** run 1 ended its build at 1,890,973 units on 2026-11-17. Follow-up questions on 2026-11-18 brought the session to about 2,388,876. About 300,000 of run 1 went to getting the repository created and attached before any code was written.
- **Estimated runs remaining:** 2, possibly 3, at the provisional budget. Basis: milestone 1's game code cost about 1.6 million units; milestones 2-5 look like 10 to 12 times that work, and long sessions cost more per step as the context grows. Revise after run 2.

## Readings from James

(James: add one line per run, newest last, in this form.)

    Run N (date): used X% of weekly Fable limit.

No readings from James yet.

Inferred by Claude, not read from the usage page (see "Calibration"):

    Run 1 (2026-11-17): used about 4% of the weekly Fable limit (range 3 to 5%). Budget set on the cautious 5%.

## Meter log

Formula: units = input + 1.25 x cache_write + 0.1 x cache_read + 5 x output (`python3 tools/meter.py`).
Run 1's total includes about 300,000 units spent before any code was written, getting the repository created and attached (an earlier note here said 560,000; that figure also counted the first commit's work).
The meter is a proxy. It reads about 14% fewer output tokens than Claude Code's own session cost record (interrupted and still-streaming messages are logged short). The bias is steady, so it cancels in calibration.

| Run | After commit | Meter units |
|-----|--------------|-------------|
| 1 | (baseline before first commit) | 424,026 |
| 1 | 92e6110 brief, meter, notes skeleton | 560,000 (approx.) |
| 1 | 7a5c276 milestone 1 | 1,774,104 |
| 1 | 0feb40c notes update (read just before committing) | 1,853,196 |
| 1 | end of the 2026-11-17 build session, final report included | 1,890,973 |
| 1 | 2026-11-18 follow-up: calibration and RUN_BUDGET (read just before committing) | 2,388,876 |

## Calibration

**Result.** Half of James's weekly Fable limit is roughly 19 to 31 million meter units, most likely about 24 million. RUN_BUDGET is set at the bottom of that range, 18,900,000, because James wants room left for his other Fable work.

**Method.** Claude cannot see the plan's usage page. The session's event stream does carry rate-limit records (read with the `list_events` tool of the claude-code-remote server, kind `rate_limit_event`, field `rate_limit_info.unifiedWindows`). Each record gives the fraction used of two seven-day windows, rounded to a whole percent. During run 1, which used only Fable:

| Time (UTC) | Meter units so far | `seven_day` | `seven_day_overage_included` |
|------------|--------------------|-------------|------------------------------|
| 11-17 12:44 (run start) | 0 | 3% | 1% |
| 11-17 12:48 | 154,000 | 4% | 2% |
| 11-17 16:28 (build starts) | 300,000 | 4% | 3% |
| 11-17 16:45 | 1,118,000 | 5% | 4% |
| 11-17 16:54 (build ends) | 1,891,000 | 6% | 5% |
| 11-18 10:06 (follow-up) | 2,190,000 | 7% | 8% |

**Math, using the brief's formula** RUN_BUDGET = (50 / percent) x run total, with run total 1,890,973:

- The tighter window rose 4 points (1% to 5%): (50 / 4) x 1,890,973 = 23,637,163.
- Whole-percent rounding makes the true rise anywhere from 3 to 5 points: (50 / 3) x 1,890,973 = 31,516,217 and (50 / 5) x 1,890,973 = 18,909,730.
- Chosen: the 5-point case, rounded down to 18,900,000. Stop line 0.9 x 18,900,000 = 17,010,000.
- Cross-check: the other window rose 3 points (3% to 6%), which gives 31.5 million, or 23.6 million on its cautious side. The chosen figure is below both.

**Caveats.**
- Which window is the "Fable only" meter on James's usage page is an inference: the telemetry does not label them. Claude took the one that moved faster, which gives the smaller budget.
- The windows count all of James's usage, not this project's alone. The overnight jump from 5% to 8% on about 300,000 units is other work or a re-cache charge, so only the 11-17 rows were used.
- The telemetry field is internal and may change or disappear. The meter stays the primary gauge.

**Start of every run.**
1. If "Readings from James" has a reading newer than the one RUN_BUDGET was set from, recompute RUN_BUDGET with the brief's formula and log the math here.
2. Read the rate-limit telemetry and write the starting percentages of both windows in the Meter log.
3. Second guard, on top of the meter: if either window has risen 45 points since the run started (90% of half the week), treat that as the stop line even if the meter is below 17,010,000. Other projects' usage counts toward it, which only makes the run stop sooner.
4. At the end of the run, log both windows again next to the final meter total, and tighten RUN_BUDGET if the two disagree.

## How to pick this up (fresh session)

1. `git fetch origin claude/in-full-tale && git checkout claude/in-full-tale`. Read BRIEF.md, then this file.
2. `npm test` runs the verse-text test and the reachability test. Both must pass before every commit.
3. `node tests/play/m1.cjs` runs the scripted playthrough in headless Chromium and writes screenshots to `tests/shots/` (git-ignored). Look at them.
4. `node tests/serve.mjs` serves the game at http://127.0.0.1:8080/ for manual checks. ES modules need http, not file://.
5. After every commit: `python3 tools/meter.py`, log the number above, update the Handoff, push.

Environment facts learned in run 1: the session started with no repository attached, and James had to create `jnshep4/in-full-tale` and add it to the Claude GitHub App before work could start. `git push -u origin claude/in-full-tale` works. The GitHub Pages API and GraphQL are closed to the session, so Pages has to be switched on by hand once. `require('playwright')` works only from CommonJS files, which is why the playthrough scripts are `.cjs`.

## Code map

- `index.html`: one 480x270 canvas scaled by whole multiples with nearest-neighbor, plus `#ui` for DOM overlays (debug menu now; verse cards and scenes from milestone 2).
- `src/main.js`: boot, fixed 60 Hz step, `window.__ift` hook. `?test=1` stops the live loop so scripts step it (`__ift.step(n, ['right','jump'])`); `?nosave=1` disables localStorage.
- `src/game.js`: play state. Room loading, entity lists, camera, light map (ambient multiply plus additive pass), HUD, `snapshot()` for tests.
- `src/ent/`: `player.js` (David, physics constants in `PHYS` and `SLING`), `stone.js`, `soldier.js` (marked and unmarked spearman), `trophy.js`.
- `src/gfx/`: `bg.js` (sky and parallax ridges, one entry per theme in `THEMES`), `tiles.js` (pre-rendered tile layer, one palette per theme), `chars.js` (rig-drawn pixel characters, the ring, props).
- `src/world/room.js` (map parsing, tile collision), `src/world/reach.js` (reachability model).
- `src/data/`: `verses.js`, `powers.js`, `regions.js`, `r1.js`.
- `src/audio.js` (Web Audio synth), `src/input.js` (keyboard and gamepad), `src/font.js` (3x5 pixel font, capitals only), `src/save.js`, `src/debug.js`.
- `tests/`: `verses.test.mjs`, `reach.test.mjs`, `serve.mjs`, `play/helpers.cjs` (harness and `window.bot`), `play/m1.cjs`.
- `tools/meter.py`, `tools/roomgen.py` (build a room from rectangles, print ASCII rows to paste into a region file).

## Level format

A region is `{ id, name, theme, complete, start, rooms: [{ id, name, map: [rows] }] }` in `src/data/rN.js`, listed in `src/data/regions.js`. Tiles are 16 px; the screen shows 30 x 17 tiles.

| Char | Meaning |
|------|---------|
| `#` | solid ground |
| `=` | one-way plank (jump up through, down + jump drops through) |
| `^` | stakes (hurt David, kill soldiers, bounce trophies home) |
| `.` | air |
| `P` | room start |
| `M` | marked soldier (ids are `region.room.index` in scan order; changing a map renumbers them, which only matters to old saves) |
| `s` | unmarked soldier |
| `t` | torch |

Still to define in milestone 2: exits between rooms, checkpoints, gate tiles (one character per power), the boss arena, hub doors.

## Reachability model

`src/world/reach.js` floods the standable cells of a room from its start, using a movement model weaker than the real physics: jump 3 tiles up and 4 across (3 across at full height); the game allows about 3.7 up and 5.4 across. David is treated as two tiles tall. Stakes are impassable. Planks can be dropped through. So "reachable" in the test implies reachable in play, and the playthrough scripts confirm samples of it by actually playing.

Plan for gates and powers: each gate is a tile character that is impassable unless the power set contains its power; each movement power widens the model (dash: wider gaps; double jump: 6 up; climb: unlimited rise along a wall; and so on). The test then runs the flood once per power set: powers through region 5, and all powers. Rooms connect through exits, so the flood must cross rooms and the hub. `tests/reach.test.mjs` already enforces 20 marked soldiers for any region flagged `complete`, and refuses to pass once all ten are complete until the power-set checks exist.

## Design plan (standing; later runs may revise and must log changes under Decisions)

Hub: Saul's camp. One door per region; door N opens with power N-1, so the order is fixed while the world still joins at the hub. Saul's tent holds the Ending A choice after the 100 scene.

All captain names below are invented for this game; none is taken from scripture or history. Goliath of Gath is the one captain from the text. Place names are real biblical places. "Seren" is the biblical word for a Philistine lord, used here as a title.

| # | Region | Captain (invented) | Drops | Weak to |
|---|--------|--------------------|-------|---------|
| 1 | Valley of Elah, hill country at dusk | Shalmek | `dash` Fleet Foot | full-charge stones (no earlier power exists) |
| 2 | Socoh terraces and vineyards | Ittur | `double` Hind's Feet | dash |
| 3 | Sorek gorge, cliffs and caves | Pashdu | `climb` Rock Hold | double jump (stones loosed mid-air) |
| 4 | Timnah thickets, lion country | Maroz | `pound` Lion's Fall | wall climb (shots from the wall) |
| 5 | Ephes-dammim battlefield | Goliath of Gath (from the text) | `sword` Goliath's Sword | ground pound staggers him; only the sling wounds him |
| 6 | Ekron, city of olive presses | Akhtal | `shield` Bronze Buckler | sword |
| 7 | Ashdod, temple quarter | Zeruk | `grapple` Shepherd's Cord | shield (turned-back missiles) |
| 8 | Ashkelon harbor | Banith | `swim` Deep Breath | grapple |
| 9 | Gaza, gates and desert edge | Yishvar | `heavy` Smooth Stone | swimming strikes from the cisterns |
| 10 | Gath citadel | Seren Orphaz | `valor` Mighty Man | heavy stone |

Placement rule plan: regions 1-5 each keep 3 of their 20 marked soldiers behind gates that need powers 6-9 (15 in all, forcing backtracking). Region 6 needs only powers 1-5 inside it. That gives 85 + 20 = 105 trophies reachable with the powers earned through region 5, and all 200 only with later powers.

Combat rules in place: sling damage is 1 (tap), 2 (half charge), 3 (full). A spearman's shield turns taps from the front while he patrols or chases; half charge or better breaks the guard. Marked spearmen have 4 health, unmarked 3. Touching a soldier does not hurt; the spear thrust does. David has 5 health, keeps his tally when hit, and on falling returns to the room start. Unmarked soldiers have a 35% chance to drop a fig (heals 1).

## Decisions

One line per choice, newest last.

- 2026-11-17: Repo is `jnshep4/in-full-tale` (public). `claude/in-full-tale` is the only branch; Pages should serve it from the root.
- 2026-11-17: `tools/meter.py` sums every transcript under `~/.claude/projects/` (each run is a fresh container, so that directory is one run) and counts each assistant message once by message id.
- 2026-11-17: No engine library. Plain ES modules and Canvas 2D, no build step, nothing to vendor. Reason: full control of the pixel pipeline and a simulation that tests can step deterministically.
- 2026-11-17: Internal resolution 480x270, 16 px tiles, fixed 60 Hz step.
- 2026-11-17: Characters are drawn live from small rigs rather than stored sprite sheets, so animation is continuous and the sling arm can follow the aim.
- 2026-11-17: Sling aim on keyboard is by held direction: level by default, up + forward for a high arc, up alone for a lob, down for a low shot. Gamepad right stick aims freely. A dotted arc previews the flight while charging.
- 2026-11-17: David's facing locks while fire is held, so he can back away from a spearman and keep aiming. Backing up while charging is at 75% speed.
- 2026-11-17: One trophy per marked soldier. The "scatter" is the ring plus a burst of bouncing sparks. Trophies drift toward David inside 30 px.
- 2026-11-17: A marked soldier's save state is alive (absent), fallen with trophy waiting (`[x, y]` of his post), or collected (`'c'`). An uncollected trophy reappears at the post after a reload.
- 2026-11-17: Marked soldiers wear a crimson feathered crest and carry a small glowing ring overhead; unmarked ones have a pale crest and no ring.
- 2026-11-17: David's look: cream tunic, auburn hair ("ruddy", 1 Samuel 16:12), blue headband and sash so he reads against the warm palette.
- 2026-11-17: The reachability test reports the final 200-trophy checks as PENDING until all ten regions are flagged complete, and enforces everything it can on the regions that exist. Region 1 is flagged incomplete with 6 marked soldiers.
- 2026-11-17: Verse cards and scenes will be DOM overlays in `#ui` (crisp serif text, and tests can read the exact text back).
- 2026-11-17: Power set and order as in the Design plan table. Ashkelon gets `swim` and Gaza gets `heavy`.

## Liberties taken with the text

- Goliath is placed mid-quest as region 5's boss. In the text, Goliath (1 Samuel 17) comes before the bride price (1 Samuel 18).
- The captains other than Goliath, and their names, are invented.
