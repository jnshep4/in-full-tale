# In Full Tale: build notes

RUN_BUDGET: 18,900,000 meter units per run. Stop line (90%): 17,010,000.
Provisional: Claude estimated it on 2026-11-18 from the session's own rate-limit telemetry, at James's request, because James had not yet taken a reading. Math and caveats are under "Calibration". A reading written by James under "Readings from James" replaces it.

## Handoff (update after every commit)

- **Current run:** run 2, started 2026-11-18 10:14 UTC. Telemetry at start: `seven_day` 8%, `seven_day_overage_included` 9%. Second-guard stop values: 53% and 54%.
- **Milestone status:** 1 and 2 done and pushed. 3 in progress (see "Next steps"). 4, 5 not started.
- **Blocked on James (one-time, about 30 seconds):** GitHub Pages is not switched on. The session cannot do it (the Pages API is closed to it). In the repo: Settings > Pages > Source "Deploy from a branch" > branch `claude/in-full-tale`, folder `/ (root)` > Save. The game will then be at https://jnshep4.github.io/in-full-tale/. The branch already carries `.nojekyll` and needs no build step. Check with `gh api repos/jnshep4/in-full-tale --jq .has_pages`.
- **Optional, from James (better calibration):** after any run, read the Fable weekly meter on the usage page and add a line under "Readings from James". Until then the provisional RUN_BUDGET stands.
- **Next steps, in priority order:**
  1. Milestone 3: powers 2-5 in `src/ent/player.js` (double jump, climb, pound, sword), soldier kinds (archer, heavy, lion), regions 2-5 with their captains in `src/data/bosses.js`, Goliath and the sword pickup card, the 100 scene at the hub, Ending A in Saul's tent.
  2. Milestone 4: powers 6-10, regions 6-10, Ending B.
  3. Milestone 5: title screen, music, settings, balance.
- **Known bugs and rough edges:**
  - The control hint bar shows for the first 30 seconds of play time on a save and has no "seen" flag.
  - No title screen, music, or settings yet (milestone 5). Audio starts on the first key press.
  - Grass is drawn on floors inside caves and huts.
  - Shalmek can be fought from the planks, where his thrust and ground waves cannot reach. Left in: he still leaps and throws.
- **This run's meter total:** see the Meter log; last reading is the newest row.
- **Estimated runs remaining:** revise at the end of run 2.

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
| 2 | run start, 2026-11-18 10:14 UTC (telemetry: seven_day 8%, overage_included 9%) | 119,194 |
| 2 | milestone 2 (read just before committing) | 1,624,926 |

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
3. `node tests/play/m1.cjs` and `node tests/play/m2.cjs` (one per milestone; `npm run test:play` runs all) play the game in headless Chromium and write screenshots to `tests/shots/` (git-ignored). Look at them. `node tests/play/look.cjs [region]` is not a test: it writes an overview map and in-game frames of every room, for checking layouts by eye.
4. `node tests/serve.mjs` serves the game at http://127.0.0.1:8080/ for manual checks. ES modules need http, not file://.
5. After every commit: `python3 tools/meter.py`, log the number above, update the Handoff, push.

Environment facts learned in run 1: the session started with no repository attached, and James had to create `jnshep4/in-full-tale` and add it to the Claude GitHub App before work could start. `git push -u origin claude/in-full-tale` works. The GitHub Pages API and GraphQL are closed to the session, so Pages has to be switched on by hand once. `require('playwright')` works only from CommonJS files, which is why the playthrough scripts are `.cjs`.

## Code map

- `index.html`: one 480x270 canvas scaled by whole multiples with nearest-neighbor, plus `#ui` for DOM overlays (cards, debug menu). Card styles live here; `--s` is the integer scale.
- `src/main.js`: boot, fixed 60 Hz step, `window.__ift` hook. `?test=1` stops the live loop so scripts step it (`__ift.step(n, ['right','jump'])`); `?nosave=1` disables localStorage; `?at=1/outskirts` starts in that room.
- `src/game.js`: play state. `loadRoom(region, room, link)`, entity lists, links (`checkLinks`, `useDoor`, `go`), gates (`breakGate`), the captain flow (`onBossFell` -> verse card -> `spawnRelic` -> `grantPower` -> power card), camera, light map, HUD, `snapshot()` for tests. `game.godmode` stops all damage (debug menu and tests that say so).
- `src/ui.js`: DOM cards. `ui.verse(region)`, `ui.power(id)`, `ui.scene(kind, pages, buttons, onClose)`. While a card is open the simulation is paused and Enter, jump, or a click dismisses it. The card element is `#card` with `data-kind`.
- `src/ent/`: `player.js` (David; `PHYS`, `DASH`, `SLING`), `stone.js` (carries `tags` such as `full`, read by captains for the weakness chain), `soldier.js`, `trophy.js`, `boss.js` (`Boss`, driven by a config; `Shot`, every hostile missile and ground wave).
- `src/gfx/`: `bg.js` (one entry per theme in `THEMES`), `tiles.js` (pre-rendered tile layer and cave backing; one palette per theme in `PAL`), `chars.js` (rig-drawn David, soldier, captain, Israelite; the ring; props), `props.js` (gate tiles, water, doorways, camp props, the relic).
- `src/world/`: `room.js` (tile kinds, map parsing, collision), `build.js` (`RB`, the room builder; `parseTo`), `reach.js` (the two reachability models and the world flood).
- `src/data/`: `verses.js`, `powers.js`, `bosses.js` (captain configs), `regions.js` (index; region 0 is the hub), `hub.js`, `r1.js`.
- `src/audio.js` (Web Audio synth), `src/input.js` (keyboard and gamepad), `src/font.js` (3x5 pixel font, capitals only), `src/save.js`, `src/debug.js`.
- `tests/`: `verses.test.mjs`, `reach.test.mjs`, `serve.mjs`, `play/helpers.cjs` (harness, `window.bot` with `walkTo`, `fight`, `fightBoss`, and `overview`), `play/m1.cjs`, `play/m2.cjs`, `play/look.cjs`.
- `tools/meter.py`. (`tools/roomgen.py` is superseded by `src/world/build.js` and kept only as the record of how the first room was made.)

## Level format

A region is `{ id, name, theme, complete, start, rooms }` in `src/data/rN.js`, listed in `src/data/regions.js`. Rooms are built in code with `RB` (`src/world/build.js`): rectangle fills, `land(x0, x1, top)` for ground down to the room's bottom, `plank`, `cave` (hollow with dark backing), `put`/`puts` for spawns, `exit(side, id, standingRow, to)` for edge exits, `door(id, cx, standingRow, to, opts)` for doorways entered with Up, `prop`, and `gate(power, cx, cy)` to declare a geometry gate. `done()` yields the ASCII map plus links, props, gates, and backing rectangles. Tiles are 16 px; the screen shows 30 x 17. A "standing row" is the row of the cell a body stands in.

| Char | Meaning |
|------|---------|
| `#` | solid ground |
| `=` | one-way plank (jump up through, down + jump drops through) |
| `^` | stakes (hurt David, kill soldiers, bounce trophies home) |
| `1` | reed screen: solid until dashed through (Fleet Foot) |
| `4` | cracked slab: solid until pounded (Lion's Fall) |
| `5` | thorn hedge: solid until cut (Goliath's Sword) |
| `6` | spear hedge: solid unless David carries the Bronze Buckler |
| `9` | bound door: solid until struck by a full-charge Smooth Stone |
| `~` | deep water: sweeps David back to the bank without Deep Breath |
| `o` | bronze ring for the Shepherd's Cord |
| `P` | default start; `t` torch; `B` captain |
| `M` `A` `H` | marked spearman, archer, heavy (ids are `region.room.index` in scan order) |
| `s` `a` `h` `l` | ordinary spearman, archer, heavy, lion (archer, heavy, lion arrive in milestone 3) |

Links: `to` is `'region/room/link'` or `'room/link'` inside the region. Options: `needs` (power id), `after` (hidden until that region's captain has fallen), `look` (`gateway`, `saul`, `arena`, `path`), `label`, `act`. A room with `boss: N` holds captain N at its `B` cell. Opened gate tiles are saved in `save.gates` and stay open.

How gating works in play, so far: reed screens (dash) and deep water (swim hazard) behave fully; cracked slabs, thorns, bound doors, and spear hedges are solid and wait for their powers in milestones 3 and 4; rings are inert until the cord exists.

## Reachability model

`src/world/reach.js` floods standable cells across the whole world from the hub, room to room through links, for a given power set. Two models:

- **Conservative** (proves trophies reachable): weaker than play in every respect. Base jump 3 tiles up and 4 across (play: about 3.7 and 5.4, more with coyote time and ledge overhang). Double jump: 6 up, 6 across (play: about 6.9 up). Dash: +1 across (play: +3). Climb: unlimited rise along a wall. Swim: free movement in water, jump 2 out. Cord: rings within 5 cells with a clear line (play: about 6.9). Stakes are impassable. David is two tiles tall.
- **Optimistic** (proves gates hold): stronger than play in every respect. Base 4 up and 9 across; double 8 up and 16 across; dash +6; walks through stakes; cord 9 cells with no line-of-sight test.

Gate tiles are impassable in both models without their power. Because the optimistic model is so generous sideways, **never gate anything by horizontal distance**. Geometry gates are vertical only: a double-jump ledge is exactly 5 or 6 tiles above the nearest footing, and a climb wall at least 9. Declare each with `gate(power, cx, cy)`.

`tests/reach.test.mjs` checks, on every run: maps parse; every link leads somewhere real and can be reached; complete regions hold exactly 20 marked soldiers; every marked soldier is reachable with all powers (conservative); every gate tile maps to a real power and can be reached to be opened; every declared gate is unreachable with only the powers earned before its own (optimistic) and reachable with all; every captain's room can be entered with only the powers of earlier regions. It prints, per region, the first power with which each soldier becomes reachable. Once all ten regions are complete it also requires exactly 200 trophies, at least 100 proven reachable with the powers of regions 1-5, and fewer than 200 reachable with those powers even optimistically.

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

- 2026-11-18: The world is the hub (region 0) plus ten regions. Rooms join by edge exits (walk off the side) and doorways (press Up). A new game starts in the camp.
- 2026-11-18: Rooms are built in code by `RB` rather than stored as typed ASCII; the map string is still what the parser and tests read.
- 2026-11-18: Region 1 is four rooms: Valley of Elah (6 marked), The Brook (7), The Picket Line (7), Shalmek's Ground (captain). 14 need no power; one each needs dash, double jump, climb, swim, heavy stone, shield.
- 2026-11-18: Gateway N in the camp needs the power from region N-1. A gateway whose region is not built yet reads "sealed".
- 2026-11-18: Each fallen captain adds one health pip (5 at the start, 15 at the end).
- 2026-11-18: Captain flow: he dissolves, the verse card shows, the player dismisses it, the relic drops in the middle of the arena, taking it grants the power and shows a card with the controls, and a door back to camp appears. If the game is closed between the card and the pickup, the relic waits in the arena.
- 2026-11-18: David dying, or re-entering a room, puts unmarked soldiers back and restarts a captain's fight. He returns to the link he entered by, at full health.
- 2026-11-18: A trophy that comes to rest more than 200 px along or 40 px above or below its soldier's post, or touches water David cannot swim, hops back to the post. This closes the "trophy stuck on a ledge" bug from run 1.
- 2026-11-18: Soldiers need a clear line to see or strike David, so nothing attacks through a gate, and they do not walk out through edge exits.
- 2026-11-18: Shalmek has 60 health, a frontal shield against light stones, and three attacks (spear lunge, leap with ground waves, a three-javelin volley below half health). Full-charge stones count as his weakness (double damage, a stagger at most every 4 seconds). The scripted bot beats him on foot without help, ending on 1 health of 5.
- 2026-11-18: Text in Saul's tent is plain narration, not scripture, so nothing outside BRIEF.md's verses is quoted.

## Liberties taken with the text

- Goliath is placed mid-quest as region 5's boss. In the text, Goliath (1 Samuel 17) comes before the bride price (1 Samuel 18).
- The captains other than Goliath, and their names, are invented.
