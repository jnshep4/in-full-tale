# In Full Tale: build notes

RUN_BUDGET: 18,900,000 meter units per run. Stop line (90%): 17,010,000.
Provisional: Claude estimated it on 2026-11-18 from the session's own rate-limit telemetry, at James's request, because James had not yet taken a reading. Math and caveats are under "Calibration". A reading written by James under "Readings from James" replaces it.

## Handoff (update after every commit)

- **Status: all five milestones are done and pushed. The scheduled weekly task can be turned off.** After the final summary James played the game and sent feedback in the same session (2026-11-18); the changes made in answer are under "After the summary" below and in Decisions. Further work happens only when James asks.
- **Last run:** run 2, 2026-11-18, 10:14 UTC to 11:52 UTC. It did milestones 2, 3, 4 and 5.
- **GitHub Pages:** on. `gh api repos/jnshep4/in-full-tale --jq .has_pages` returned `true` at 11:51 UTC on 2026-11-18 (checked by run 2). The run 1 session reported, by message, that James switched Pages on, that the first deployment succeeded at 10:23 UTC serving commit 4f9707f, and that it loaded https://jnshep4.github.io/in-full-tale/ in Chromium with every response 200, nothing off-site, no page errors, and working input at 60 fps. That report covers milestone 1's build, not the final one: run 2 could not reach `jnshep4.github.io` from its environment, so the finished game has not been loaded from the live site by any session. Pages redeploys on each push to `claude/in-full-tale`. **For James, one check:** open the URL and see that the title card appears.
- **Optional, from James:** a line under "Readings from James" with the Fable weekly percentage after this run, if a later run is ever wanted. See "Calibration" for what the telemetry said.
- **Known bugs and rough edges** (none blocks play):
  - Gamepad support is written to the standard mapping but has never been tried with a physical pad: this environment has none.
  - Tips show only in the first field, until the first captain falls; each power's card and the pause sheet give the rest.
  - Captains can be fought from high planks, walls, rings, or the cistern, out of reach of thrusts and ground waves. They stand off, leap up to 8 tiles, throw, and shake a clinging David off the wall (at most every 7 seconds). Maroz from the wall and Yishvar from the cistern remain the safest fights; that is where their weaknesses point.
  - The music is generated and simple: one plucked line, a drone; a faster, darker arrangement under captains (see the 2026-11-19 section). Nobody has listened to it.
  - No human has played it. Every check was made by script and by looking at screenshots.
- **This run's meter total:** 7,734,097 units of the 18,900,000 budget (stop line 17,010,000). Telemetry: `seven_day` 8% at start, 12% at the end; `seven_day_overage_included` 9% at start, 16% at the end.
- **Estimated runs remaining:** none.

## After the summary: James's first playtest (2026-11-18)

James's two points, and what was done:

1. *The sling made it too easy to hang back and pick off melee soldiers.* On his feet or in the air David now slings level only: no aiming, and the stone flies flat for 84 px (a tap) to 132 px (full charge, about eight tiles), then drops. To hit anyone above or below he must jump into line. Spearmen chase at 82 px/s instead of 64. The aimed arc survives only from a perch (clinging to a wall, hanging from the cord, afloat), because Maroz, Banith and Yishvar are built around it. This replaces the brief's "aimed, chargeable shots with an arc" at James's direction. His other suggestion, giving the arc to a bow later, is open: it would be an eleventh power or a change to one of the ten.
2. *A soldier up high could be killed from below; his ring fell, then jumped back up out of reach.* The ring no longer returns to the post for having dropped: it stays on lower ground until taken. It still returns from stakes, pits, deep water, and from a perch more than 40 px above the post. With the level sling, the soldiers behind height gates cannot be hit from below at all (a new check in `tests/play/m2.cjs` tries every height of a jump at the Picket Line's watch rock).

James then asked to move to the next stage. All five milestones being done, the next stage was taken to be the first items of "If more work is ever wanted": balance for the closer fighting, and less plain levels.
- Captains' lunge slowed from 320 to 270 px/s. Every scripted fight was rerun at the new range; all ten are won unassisted (Akhtal on the second attempt, the rest on the first, several with 1 or 2 health left).
- 26 stone decks were added across regions 2-10 (`deck` in `src/data/pieces.js`): an upper level five rows up with a plank step at each end, and one soldier moved up onto each. The reach test rejected one deck beside a climb gate, which was removed.

Meter at this point: 9,814,982 units. The whole suite passes: 212 playthrough checks, the verse test, the reach test.

## After the summary, continued: the "remaining ideas" (2026-11-18)

James asked to start on the remaining ideas from the final summary. Done so far, all pushed:
- **Map screen.** The pause sheet has a Map button. It shows one region at a time, rooms side by side in walking order; rooms not yet entered are blank (`save.seen`). Red marks are soldiers still carrying a ring, coloured blocks are gates (dim until the power is held), green is a door, white is David. "Earlier" and "Later" step through the regions visited.
- **Music.** A four-bar bass progression, an answering second voice on the repeat, a held reed under the tune, and a lead that is a lyre, a reed pipe or a flute depending on the region. Still generated in `src/audio.js`.
- **Hand-built rooms.** Regions 5, 6, 8, 9 and 10 are now built by hand with `RB`, like region 1, using the set pieces only for their gated secrets: trenches and a plank watchtower (5), two-storey houses and a sunken press yard (6), piers over deep water and a ship with a ring in her rigging (8), twin gate towers with a walk between and a seven-deep cistern (9), a stair of terraces and a fourteen-high fortress wall (10). Each kept its 20 soldiers and its gate plan, and the reach test passed unchanged.

**Regions 2, 3, 4 and 7** were then rebuilt by hand as well, so all ten regions are hand-built with `RB` and `src/data/pieces.js` now supplies only the gated set pieces and the arenas (its `room()`/`seg()`/`vary()`/`deck()` maker is unused but kept). The set pieces the tests stand David beside were kept at the same cells (region 2: vineyard tower 73-77 on ground row 24, cellar at 84, watchtower at 43-49, presses perch at 35; region 3: thorn hut at 45), so no test coordinates moved. New shapes: a trellis walk, a treading vat and a loft (2); a climb down the gorge wall by ledges and hanging rock in the caves (3); a ten-high cliff, boughs, and a lions' den tunnelled under a rise (4); the house of Dagon with its roof and the terraces of the upper city (7).

Meter at this point: 11,289,440 units of the 17,010,000 stop line. Whole suite green: 215 playthrough checks, verse test, reach test (200 trophies; 105 with the powers of regions 1-5; all 200 with every power).

**For play testers:** https://jnshep4.github.io/in-full-tale/ (desktop browser, keyboard or gamepad; progress saves in that browser only). No session has been able to load the live site since milestone 1, so James should open it once before sharing.

## Phone demo (2026-11-18)

James asked for an iOS demo for play testers. It is the same web page, made to work on a phone; nothing was built for the App Store (that needs a Mac, Xcode and an Apple developer account, none of which a session has).

- `src/touch.js`: on a touch device (or with `?touch=1`) a floating stick on the left half of the screen and JUMP, SLING and II (pause) buttons on the right; DASH, SWORD and CORD appear when earned. They feed `Input.touch`, the same named actions as the keyboard. Controls hide while a card is open; cards are tapped.
- Screen fit: whole multiples where two or more fit, otherwise the picture is scaled to fill the phone exactly (`fit()` in `src/main.js`). Held upright, a "turn your phone sideways" panel covers the page.
- Sound starts on the first touch. Leaving the tab pauses and silences the game. Scrolling, pinch-zoom and long-press menus are blocked on touch devices.
- Settings gained "Lighting: full or simple". Simple drops the pools of light, the costliest part of a frame. On a touch device it switches itself once if the frame rate stays under 42 for four seconds, and says so.
- Demo mode: `?demo=N` opens only the first N gateways and shows an end-of-demo card when captain N's power is taken; play can continue. The choice is stored on the device (`inFullTale.demo`), so a home-screen icon made from a demo link stays a demo; `?demo=0` clears it.
- Home screen: `manifest.webmanifest`, `icon-180.png`, `icon-512.png` (drawn by `tools/icon.cjs`) and the Apple meta tags, so "Add to Home Screen" in Safari gives a full-screen, landscape icon. There is no service worker: the game needs a connection to load, and testers always get the latest push.
- `tests/play/m6.cjs`: 20 checks on an emulated iPhone 13 in landscape. This is Chromium with touch and a phone-sized screen, not Safari. **Nothing has been run on a real iPhone.** Speed, sound and the feel of the controls on real devices are unknown until a person tries them.

Links: full game https://jnshep4.github.io/in-full-tale/ ; demo of regions 1-2 https://jnshep4.github.io/in-full-tale/?demo=2 ; region 1 only `?demo=1`.

Meter at this point: 12,965,939 units of the 17,010,000 stop line.

## Opening cards and the first-gateway arrow (2026-11-19, at James's request)

- A fresh game (Begin on the title, or Erase and begin) now opens on three verse cards before play: 1 Samuel 18:20, 18:22-23, and 18:25, each with its reference and "(KJV)". They are `INTRO_VERSES` in `src/data/verses.js`. A game already under way does not see them.
- **Provenance of that text:** these verses are not in BRIEF.md, so `tests/verses.test.mjs` cannot check them. They were copied by script, not typed, from one public KJV file (github.com/aruljohn/Bible-kjv, `1Samuel.json`); a second source could not be reached from the build environment. That file's verse 27 agrees with BRIEF.md's quotation of it. James should proofread the three cards once. If he adds the verses to BRIEF.md, extend the verse test to cover them.
- James described the card as "David asking for Saul's daughter". In the text David does not ask: Michal loves him, Saul's servants put it to him, he answers that he is a poor man, and Saul names the price. The cards follow the text.
- Until the Valley of Elah has been entered once, a bobbing arrow marks gateway 1 in the camp ("THIS WAY" at the screen's right edge while the gateway is off screen, then an arrow over the gateway itself), and a line of advice shows after the cards. `drawGuide` in `src/game.js`.

## Tips, dowry card, captain's music, barred doors (2026-11-19, at James's request)

- **Tips in the first field.** `TIPS` in `src/game.js` lists column ranges of `1/outskirts` with keyboard and touch text; `tip()` picks one by David's column and `drawHud` draws it in a dark box at the bottom. Four tips: moving and the sling (columns 0-9), Down + Jump to drop through a platform (9-20, around the practice plank), hold for more power and what a shield does (20-36), the stone flies level and short (36-58). They show until the first captain falls (`boss1`). This replaces the old 30-second hint bar.
- **Fourth opening card.** After the three verse cards: "Go, and collect your dowry: a hundred trophies of the Philistines." (`DOWRY_LINE`). It is narration, not scripture, so it carries no reference and is worded in modern English on purpose.
- **Captain's music.** In `music()`, boss mode now steps every 0.15 s (was 0.2), plays the tune on a low reed with a quiet string above, drives a bass on every other step that leans on the flat second, tolls a low string each bar, holds a reed on the flat second, and drums every step. Checked only by the mode switch in m5; nobody has listened to it.
- **No leaving a captain's ground.** Doors were already refused while a captain stands (`useDoor`). Now crossed spears are drawn over every door in the room (`drawBars`), and `checkLinks` refuses edge exits too (no captain's room has one today). Quitting to the title from the pause sheet is still allowed.
- Tests: m5 33, m6 20, m1 39, m2 42, `npm test` all pass. m3 and m4 were not rerun (budget); nothing they cover was changed except the captain's music and the edge-exit guard.

## Final summary (2026-11-18)

**What exists.** "In Full Tale" is a complete 2D action Metroidvania for the desktop browser: a static site with no build step, no dependencies, no network calls, all art drawn in code and all sound synthesised. David starts in Saul's camp with a sling. Ten regions open off the camp, each with exactly 20 marked Philistine soldiers (200 trophies), ordinary soldiers that respawn and never drop trophies, and a captain who drops a power: dash, double jump, wall climb, ground pound, Goliath's sword, a buckler, a grappling cord, swimming, a heavy stone, a faster sling. Each captain is weak to a power won earlier. Each fall shows the brief's verse card, then the reference and "(KJV)". Goliath is region 5's captain, wounded only by the sling, and his sword card shows 1 Samuel 21:9. At 100 a messenger scene plays at the camp and Saul's tent offers Ending A from then on; with all 200 and the tenth captain fallen it offers Ending B, which closes on 1 Samuel 18:27. There is a title screen, a pause sheet with per-region counts, settings, music, keyboard and gamepad input, saving to localStorage, and a hidden debug menu (backquote) that warps, grants powers, sets the tally, and switches off damage.

**How it was verified.** Run `npm test` and `npm run test:play`.
- `tests/verses.test.mjs`: all ten region verses, the sword verse, and the Ending B verse match BRIEF.md character for character.
- `tests/reach.test.mjs`: exactly 200 trophies; 105 proven reachable with the powers of regions 1-5 (the brief asks for at least 100) and no more than 105 even in a model stronger than the game, so the rest need later powers; all 200 reachable with every power; every gate tile maps to a real power and can be reached; every declared geometry gate holds without its power; every captain can be reached with only the powers of earlier regions.
- Five scripted playthroughs in headless Chromium, 209 checks in all: movement, the sling, trophy pop, bounce, blink, persistence and pickup, the hub, room exits, every power at a real gate with and without the power, the soldier kinds, all ten captains fought and beaten by a bot with no assistance, all ten verse cards read back from the page and compared with the data, the sword pickup card, the scene at 100, Ending A, Ending B, the title, pause, settings and save flows, live keyboard input, audio running, and frame rate near 60 in the first and last regions.
- Screenshots of every room of every region, every captain's fight, every verse card and power card were written to `tests/shots/` and looked at; faults found that way (a soldier striking through a gate, a captain stuck on a plank, David climbing out of a room, a black title screen, a torch standing in a cistern) were fixed.

**What was not verified.** No person has played it, so feel, difficulty and pacing rest on bots and judgment. No physical gamepad was tried. Only Chromium was used. The finished game has not been loaded from the live GitHub Pages site (see the handoff).

**If more work is ever wanted,** the most valuable things would be: a human playtest and a balance pass from its findings; hand-built rooms for regions 2-10 in the manner of region 1; richer music; a map screen.

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
| 2 | milestone 3 (read just before committing) | 4,247,808 |
| 2 | milestone 4 (read just before committing) | 6,727,700 |
| 2 | milestone 5 and final summary (read just before committing) | 7,734,097 |
| 2 | after James's playtest: level sling, rings, decks (read just before committing) | 9,814,982 |
| 2 | map, music, hand-built regions 5, 6, 8, 9, 10 (read just before committing) | 10,761,823 |
| 2 | hand-built regions 2, 3, 4, 7 (read just before committing) | 11,289,440 |
| 2 | phone demo: touch controls, fit, demo mode (read just before committing) | 12,965,939 |
| 2 | opening verse cards and first-gateway arrow | 14,218,873 |
| 2 | tips, dowry card, captain's music, barred doors (read just before committing) | 15,493,763 |

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

**What run 2 showed.** Run 2 used only Fable. Its meter and the telemetry, read together:

| Time (UTC) | Meter units so far | `seven_day` | `seven_day_overage_included` |
|------------|--------------------|-------------|------------------------------|
| 11-18 10:14 (run start) | 119,000 | 8% | 9% |
| 11-18 11:04 | about 3,900,000 | 10% | 14% |
| 11-18 11:25 | about 5,300,000 | 11% | 15% |
| 11-18 11:52 (run end) | 7,734,097 | 12% | 16% |

On the faster-moving window that is roughly 0.9 million meter units per percentage point, against the 0.38 to 0.63 million assumed from run 1. Long sessions lean on cached context, which the meter weights at 0.1 but the plan may weight lower still, so the meter over-counts late in a run. By this reading half the weekly limit is nearer 40 million units than 19 million. RUN_BUDGET was left at 18,900,000: the two gauges disagree in the safe direction, the build is finished, and a reading from James would be better evidence than either.

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

Environment note from the run 1 session (2026-11-18, not verified by run 2): the Default environment blocks `jnshep4.github.io`; a personal environment named "in-full-tale" allows that host. Any future run should be started in it so it can smoke-test the live site after pushing (curl the URL, or Playwright launched with `proxy: { server: process.env.HTTPS_PROXY }`).

Environment facts learned in run 1: the session started with no repository attached, and James had to create `jnshep4/in-full-tale` and add it to the Claude GitHub App before work could start. `git push -u origin claude/in-full-tale` works. The GitHub Pages API and GraphQL are closed to the session, so Pages has to be switched on by hand once. `require('playwright')` works only from CommonJS files, which is why the playthrough scripts are `.cjs`.

## Code map

- `index.html`: one 480x270 canvas scaled by whole multiples with nearest-neighbor, plus `#ui` for DOM overlays (cards, debug menu). Card styles live here; `--s` is the integer scale.
- `src/main.js`: boot, fixed 60 Hz step, `window.__ift` hook. `?test=1` stops the live loop so scripts step it (`__ift.step(n, ['right','jump'])`); `?nosave=1` disables localStorage; `?at=1/outskirts` starts in that room.
- `src/game.js`: play state. `loadRoom(region, room, link)`, entity lists, links (`checkLinks`, `useDoor`, `go`), gates (`breakGate`), the captain flow (`onBossFell` -> verse card -> `spawnRelic` -> `grantPower` -> power card), camera, light map, HUD, `snapshot()` for tests. `game.godmode` stops all damage (debug menu and tests that say so).
- `src/ui.js`: DOM cards. `ui.verse(region)`, `ui.power(id)`, `ui.scene(kind, pages, buttons, onClose)`. While a card is open the simulation is paused and Enter, jump, or a click dismisses it. The card element is `#card` with `data-kind`.
- `src/ent/`: `player.js` (David; `PHYS`, `DASH`, `SLING`), `stone.js` (carries `tags` such as `full`, read by captains for the weakness chain), `soldier.js`, `trophy.js`, `boss.js` (`Boss`, driven by a config; `Shot`, every hostile missile and ground wave).
- `src/gfx/`: `bg.js` (one entry per theme in `THEMES`; ridge, city and sea painters), `tiles.js` (pre-rendered tile layer and cave backing; one palette per theme in `PAL`), `chars.js` (rig-drawn David, soldier kinds, lion, captain, Goliath, Israelite; the ring), `props.js` (gate tiles, water, doorways, camp props, the relic), `decor.js` (scenery and its scattering).
- `src/world/`: `room.js` (tile kinds, map parsing, collision), `build.js` (`RB`, the room builder; `parseTo`), `reach.js` (the two reachability models and the world flood).
- `src/data/`: `verses.js`, `powers.js`, `bosses.js` (captain configs), `regions.js` (index; region 0 is the hub), `hub.js`, `r1.js` to `r10.js` (all hand-built with `RB`), `pieces.js` (set pieces, the segment-based `room()` maker, `arena()`).
- `src/audio.js` (Web Audio synth: effects and the generated music), `src/input.js` (keyboard and gamepad), `src/font.js` (3x5 pixel font, capitals only), `src/save.js`, `src/debug.js`.
- `tests/`: `verses.test.mjs`, `reach.test.mjs`, `serve.mjs`, `play/helpers.cjs` (harness, `window.bot` with `walkTo`, `fight`, `fightBoss`, and `overview`), `play/m1.cjs`, `play/m2.cjs`, `play/m3.cjs` (takes an optional section: `powers`, `soldiers`, `bosses`, `story`; the whole file runs about four minutes), `play/m4.cjs` (sections `powers`, `bosses`, `story`), `play/m5.cjs`, `play/look.cjs`. `m3.cjs bosses 4` or `m4.cjs bosses 6` runs a single captain. The whole suite takes about 15 minutes.
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

How each gate opens in play: reed screens break when dashed into; cracked slabs break under a ground pound (down + jump in the air); thorns fall to a sword stroke; spear hedges stop being solid once the buckler is carried; bound doors shatter when a full-charge stone hits them after Smooth Stone is earned; deep water stops sweeping David back once he has Deep Breath; rings answer the cord key (V or I, gamepad LB). Powers 2-5 are exercised at real gates by `tests/play/m3.cjs` and powers 6-10 by `tests/play/m4.cjs`.

Rooms from region 2 on are a row of segments: `seg(width, groundTopRow, items)`, with items placed by column offset: `M A H s a h l t` (lists of columns), `hut: [col, gateChar, kind, flip]`, `tower: [col, width, height, power, kind]`, `cellar: [col, kind]`, `sunk: [col, kind]`, `perch: [col, kind]`, `wall: [col, gateChar]`, `moat: [col]`, `pit: [col, width]`, `pool`, `plank: [col0, col1, rowsUp]`, `at: [char, col, rowsUp]`, `door: [id, col, to, opts]`. Placement rules that keep the gates honest are at the top of `pieces.js`; the reach test enforces them, so a failed "can be passed without" message means a set piece stands too close to higher footing or a tall wall.

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
- 2026-11-18: Controls for the powers: dash Shift or L (pad RB); second jump on the jump key; cling by pressing toward a wall in the air, up and down to climb, jump to spring off; ground pound is down + jump in the air; sword C or K (pad B or Y); cord V or I (pad LB). While the sling is charging on a wall, up and down aim instead of climbing.
- 2026-11-18: Soldier kinds: spearman (shield turns stones under half charge), archer (2-3 health, arrows from up to 14 tiles), heavy (7-8 health, tower shield turns everything under a full charge), lion (Timnah only, never marked, pounces). Soldiers gain one health in regions 5-8 and two in 9-10. The sword and the ground pound ignore shields.
- 2026-11-18: Weakness tags carried by a hit: `full` (full-charge stone), `dash`, `air2` (stone loosed after a second jump, before landing), `wall` (loosed while clinging), `pound`, `sword`, `reflect`, `hang`, `swim`, `heavy`. A captain's weak tag doubles the damage and staggers him, at most once every 4 seconds. A dash strike hurts only Ittur.
- 2026-11-18: Goliath: 140 health, 54 px tall. Bronze turns every stone below the brow (the top 15 px). Lion's Fall landing near him drops him to one knee for 2.4 seconds (at most every 7), and while he kneels any stone counts as a brow shot at double damage. He sweeps, stomps (ground waves both ways), hurls his spear flat and fast (2 damage), and below half health charges. Only the sling wounds him, as the brief requires.
- 2026-11-18: The 100 scene: reaching 100 sets a flag and shows a banner; the next time David is in the camp (or at once if he is there) a three-page messenger scene plays. After it, Saul's tent offers "Claim Michal now" (Ending A, three pages, then play continues) or "Press on". Ending A can be chosen any number of times.
- 2026-11-18: Scripted captain fights (tests/play/m3.cjs), all unassisted, in the last full run: Ittur on the third attempt, Pashdu on the second, Maroz on the fourth (from the wall, his weakness), Goliath on the first with 1 health left (pound, then sling). Attempts vary from run to run with the order of the test sections. The bot does not use Ittur's or Pashdu's weakness, so those fights run long; a player who does has an easier time.
- 2026-11-18: Sling aim changed (revises the 2026-11-17 decision). A held direction still picks the starting angle before the charge, but while the sling whirls, up and down now turn the aim steadily (2.2 radians a second, from steeply down to nearly straight up). Reason: with four fixed angles there were distances nothing could hit from a wall, a ring, or against Goliath's brow.
- 2026-11-18: David catches a wall only once he has stopped rising, so jumping up a low step with Rock Hold is not interrupted.
- 2026-11-18: A captain whose target is overhead and out of reach stands off about seven tiles and picks from his leaps, volleys, and summons; his leap rises as high as it must to reach.
- 2026-11-18: Regions 2-5 each follow the plan: 14 soldiers open on entry, 3 behind powers earned later in regions 1-5, 3 behind powers 6-9.

- 2026-11-18: Regions 6-10: Ekron (all 20 soldiers need only powers 1-5, which is what makes 105 trophies reachable before any later power), Ashdod (17 open, then swim, grapple, heavy), Ashkelon (17 open, swim, heavy, heavy), Gaza (17 open, heavy x3), Gath (all 20 open). The main path of each uses the power it is entered with: thorn walls, spear-hedge walls, rings, moats to dive under, bound doors.
- 2026-11-18: Final placement, proven by `tests/reach.test.mjs`: 200 trophies; 105 reachable with the powers of regions 1-5 in the conservative model and no more than 105 in the optimistic one; all 200 with every power.
- 2026-11-18: Captains 6-10 (all names invented): Akhtal (weak to the sword; a sword stroke staggers him every 3 seconds), Zeruk (weak to his own missiles turned by the buckler, 3 damage doubled), Banith (weak to stones loosed from the cord; rings hang in his arena), Yishvar (weak to stones loosed from the cistern in the middle of his arena, which captains will not enter), Seren Orphaz (300 health, seven attacks; weak to the Smooth Stone, which by then is every full-charge shot).
- 2026-11-18: Ending B: with 200 and Seren Orphaz fallen, Saul's tent offers "Give them in full tale". Two cards; the last shows only the title "Ending B" and 1 Samuel 18:27 with its reference and "(KJV)". Play can continue afterward.
- 2026-11-18: The relic drops where the captain first stood (solid ground in every arena), not at the room's centre.
- 2026-11-18: Captains fall through planks and will not step off a ledge or into water. A leap that would land in water is shortened.
- 2026-11-18: David cannot cling above the top of a room. (Found when the wall bot climbed out of Maroz's arena.)
- 2026-11-18: Each scripted fight attempt runs on its own fixed random seed. Final run, all unassisted: Shalmek 1st attempt, Ittur 1st, Pashdu 4th (1st in the run before; the bot's start differs with what ran earlier in the file), Maroz 1st (wall), Goliath 1st, Akhtal 1st (sword), Zeruk 1st (reflect), Banith 1st, Yishvar 1st (cistern), Seren Orphaz 1st with 6 of 14 health left. Up to six unassisted attempts are allowed before a test fails.
- 2026-11-18: After David falls to a captain, the captain's weakness is shown as a line of advice when the fight restarts.
- 2026-11-18: Title screen, pause sheet (Esc: per-region trophy counts, captains fallen, the controls of each power held), settings (sound, music, screen shake; saved under their own key so erasing a save keeps them), generated music (camp, field, captain; root and tune shift by region). Gateways in camp show each region's count.
- 2026-11-18: Between set pieces, `vary()` in `src/data/pieces.js` cuts shallow ditches, raises low mounds, sets two-wide stake pits and hangs planks, chosen by a fixed hash. Mounds and planks are kept 28 columns from any declared gate. Pass `{ plain: true }` to `room()` to switch it off for a room.
- 2026-11-18: Scenery (`src/gfx/decor.js`): trees, vines, jars, columns, braziers, pennons and the like are scattered over open ground by a fixed hash, per theme. Nothing in it collides.

- 2026-11-18 (James's feedback): the sling is level and short-ranged on foot; aimable only from a wall, the cord, or afloat. Rings that drop stay where they land. See "After the summary".
- 2026-11-18: `deck: [col0, col1, rowsUp]` in a segment builds an upper stone level with plank steps; soldiers go on it with `at: [char, col, rowsUp]`.

## Liberties taken with the text

- Goliath is placed mid-quest as region 5's boss. In the text, Goliath (1 Samuel 17) comes before the bride price (1 Samuel 18).
- The captains other than Goliath, and their names, are invented.
