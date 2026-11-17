# In Full Tale: build notes

RUN_BUDGET: (not set. Per BRIEF.md: until James adds a reading below, a run stops after milestone 1 and reports its meter total. Milestone 1 is done, so a run with no reading does nothing but confirm the build and report.)

## Handoff (update after every commit)

- **Last run:** run 1, 2026-11-17. Stopped after milestone 1, as the brief requires while RUN_BUDGET is unset.
- **Milestone status:** 1 done and pushed. 2, 3, 4, 5 not started.
- **Blocked on James (one-time, about 30 seconds):** GitHub Pages is not switched on. The session cannot do it (the Pages API is closed to it). In the repo: Settings > Pages > Source "Deploy from a branch" > branch `claude/in-full-tale`, folder `/ (root)` > Save. The game will then be at https://jnshep4.github.io/in-full-tale/. The branch already carries `.nojekyll` and needs no build step.
- **Blocked on James (calibration):** add a line under "Readings from James" saying what percent of the weekly Fable limit run 1 used. The next run computes RUN_BUDGET from it.
- **Next steps, in priority order:**
  1. Read "Readings from James"; set RUN_BUDGET at the top of this file and log the math under Meter log.
  2. Milestone 2: finish region 1 (20 marked soldiers across several rooms, room-to-room exits, the captain Shalmek, the verse card as a DOM overlay in `#ui`, the dash power-up) and build the hub at Saul's camp.
  3. Extend `src/world/reach.js` and `tests/reach.test.mjs` with gates and power sets as soon as the first gate tile exists (see "Reachability model").
  4. Add `tests/play/m2.cjs`: boss fight, verse card text read from the DOM and compared with `src/data/verses.js`, power pickup.
- **Known bugs and rough edges:**
  - A trophy that bounces onto a ledge David cannot reach from where the soldier fell would be stuck there. No such ledge exists in the current room, and stakes and pits already send a trophy back to its soldier's post. Keep this in mind when placing soldiers near gated ledges; the simple fix is to send any trophy still unreachable after a few seconds back to its post.
  - The control hint bar shows for the first 30 seconds of play time on a save and has no "seen" flag.
  - No title screen, music, or settings yet (milestone 5). Audio starts on the first key press.
- **This run's meter total:** about 1,853,196 units at the last commit (run 1). Of that, about 560,000 went to getting the repository created and attached before any code was written.
- **Estimated runs remaining:** unknown until the first reading. As a rough guide, milestones 2-5 look like 8 to 10 times the work of milestone 1's game code.

## Readings from James

(James: add one line per run, newest last, in this form.)

    Run N (date): used X% of weekly Fable limit.

No readings yet.

## Meter log

Formula: units = input + 1.25 x cache_write + 0.1 x cache_read + 5 x output (`python3 tools/meter.py`).
Run 1's total includes about 560,000 units spent before any code was written, getting the repository created and attached.
When calibrating from run 1's reading, use run 1's final total as logged here; the setup overhead will not recur, so later runs get slightly more game work per unit than run 1 did.

| Run | After commit | Meter units |
|-----|--------------|-------------|
| 1 | (baseline before first commit) | 424,026 |
| 1 | 92e6110 brief, meter, notes skeleton | 560,000 (approx.) |
| 1 | 7a5c276 milestone 1 | 1,774,104 |
| 1 | notes update (this commit; read just before committing) | 1,853,196 |

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
