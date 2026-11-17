Build a 2D action Metroidvania for the desktop browser. Working title: "In Full Tale."

THIS IS A MULTI-WEEK BUILD
- Work happens in weekly runs. Each run is a fresh session with no memory of the last. On your first commit, save this entire brief as BRIEF.md. BRIEF.md and NOTES.md are the only continuity between runs.
- All work goes on the branch claude/in-full-tale. If it exists, check it out and continue from it. Push only to it. GitHub Pages deploys from it.
- Work independently. Do not ask me design questions. When a choice is open, make it and log it under Decisions in NOTES.md. Commit and push often.

BUDGET (hard rule; it overrides the milestones)
Each run may use at most half of my weekly Fable limit. You can't see my plan meter, so use a proxy:
- In your first commit, write tools/meter.py. It reads this run's Claude Code transcripts (this session's JSONL under ~/.claude/projects/ plus any subagent transcripts), sums the usage fields, and prints meter units = input + 1.25 x cache_write + 0.1 x cache_read + 5 x output.
- Run the meter after every commit and log the reading in NOTES.md.
- RUN_BUDGET sits at the top of NOTES.md. Until it is set, stop after milestone 1 and report this run's meter total.
- Calibration: NOTES.md has a section called "Readings from James." Each reading says what percent of my weekly Fable limit one run used. Using the latest reading, set RUN_BUDGET = (50 / that percent) x that run's meter total, and log the math.
- When the meter reaches 90% of RUN_BUDGET, start nothing new. Finish or revert the change in progress, confirm the build on the branch is playable, push, and stop.
- Keep a handoff at the top of NOTES.md and update it after every commit, not just at the end, in case a usage limit cuts the run off: milestone status, next steps in priority order, known bugs, this run's meter total, estimated runs remaining.
- When all milestones are done, write a final summary in NOTES.md, make no further changes, and say in the handoff that the scheduled task can be turned off.

PREMISE
1 Samuel 18:25-27. Saul sets David's bride price for his daughter Michal at a hundred Philistine foreskins, hoping the Philistines will kill David. David brings back two hundred. The player is David.

CORE LOOP
- Ten regions, each with exactly 20 marked Philistine soldiers (200 total). Marked soldiers never respawn. Ordinary enemies respawn and drop health or nothing, never trophies, so the tally can't be farmed.
- When a marked soldier dies, his trophy bursts out and scatters with bouncy physics, like rings popping out in a classic platformer. Trophies blink but never disappear; they stay until collected. David does not lose trophies when hit.
- HUD shows the tally out of 200.
- The trophy is a small, stylized, cartoonish pickup: a pale curled ring with a soft glow and a satisfying collect sound. Nothing anatomical, no gore. Defeated enemies collapse and dissolve in light; hit effects stay at Dead Cells intensity, never bloodier.

WORLD
- The ten regions connect through a hub at Saul's camp. Each region ends in a boss fight against a Philistine captain.
- Each captain drops a power-up (your call on the set: dash, double jump, wall climb, ground pound, shield, grapple, and so on). Power-ups open gated paths, including paths in earlier regions.
- Placement rule: at least 100 trophies must be reachable with only the powers earned through region 5. All 200 require backtracking with later powers.
- Bosses use a weakness chain: each captain takes extra damage from a power earned from an earlier boss. Invent captain names that sound plausibly Philistine and list them in NOTES.md as invented.

REGION VERSES
When a region's captain falls, show a verse card before the power-up drops: the verse text, then the reference and "(KJV)." The player dismisses it. Use this text exactly; a test must check every card against this list.
1. 1 Samuel 16:12: "And he sent, and brought him in. Now he was ruddy, and withal of a beautiful countenance, and goodly to look to. And the LORD said, Arise, anoint him: for this is he."
2. 1 Samuel 16:13: "Then Samuel took the horn of oil, and anointed him in the midst of his brethren: and the Spirit of the LORD came upon David from that day forward. So Samuel rose up, and went to Ramah."
3. 1 Samuel 16:18: "Then answered one of the servants, and said, Behold, I have seen a son of Jesse the Bethlehemite, that is cunning in playing, and a mighty valiant man, and a man of war, and prudent in matters, and a comely person, and the LORD is with him."
4. 1 Samuel 17:37: "David said moreover, The LORD that delivered me out of the paw of the lion, and out of the paw of the bear, he will deliver me out of the hand of this Philistine. And Saul said unto David, Go, and the LORD be with thee."
5. 1 Samuel 17:50: "So David prevailed over the Philistine with a sling and with a stone, and smote the Philistine, and slew him; but there was no sword in the hand of David."
6. 1 Samuel 18:1: "And it came to pass, when he had made an end of speaking unto Saul, that the soul of Jonathan was knit with the soul of David, and Jonathan loved him as his own soul."
7. 1 Samuel 18:5: "And David went out whithersoever Saul sent him, and behaved himself wisely: and Saul set him over the men of war, and he was accepted in the sight of all the people, and also in the sight of Saul's servants."
8. 1 Samuel 18:7: "And the women answered one another as they played, and said, Saul hath slain his thousands, and David his ten thousands."
9. 1 Samuel 18:14: "And David behaved himself wisely in all his ways; and the LORD was with him."
10. 1 Samuel 18:30: "Then the princes of the Philistines went forth: and it came to pass, after they went forth, that David behaved himself more wisely than all the servants of Saul; so that his name was much set by."

WEAPONS
- David starts with a sling only: aimed, chargeable shots with an arc.
- Region 5's boss is Goliath of Gath, a giant in bronze armor (1 Samuel 17). He is beaten with the sling. After his verse card, he drops Goliath's sword, which David keeps for the rest of the game as a melee weapon alongside the sling, on a separate button.
- On picking up the sword, show this KJV text from 1 Samuel 21:9: "There is none like that; give it me."

THE HALFWAY CHOICE
- When the tally first reaches 100, play a short scene at the hub: a messenger from Saul announces that the king's price is met, and that David may claim Michal now or press on.
- From then on, Saul's tent in the hub offers Ending A whenever the player chooses it.
- Reaching 200 and beating region 10's boss unlocks Ending B, which closes on the KJV text of 1 Samuel 18:27: "and they gave them in full tale to the king, that he might be the king's son in law."
- Record in NOTES.md that putting Goliath mid-quest is a liberty: in the text, Goliath (ch. 17) comes before the bride price (ch. 18).

ART AND AUDIO
- Look and feel in the spirit of Dead Cells: dark painterly backgrounds with layered parallax, high-contrast warm accent light (torches, sunset, bronze glints), chunky readable silhouettes, fast fluid animation, low-res pixel characters scaled up with nearest-neighbor filtering.
- Setting: Iron Age Levant. Judean hill country, Philistine coastal cities, feathered Philistine helmets.
- All art, audio, and names must be original. Other games are references for feel only. Do not reproduce any sprite, sound, character, logo, or name from Dead Cells, Sonic, Mega Man, or any other game.
- Generate all art in code (procedural pixel art, canvas-drawn sprite sheets) and all sound with the Web Audio API. No external asset downloads.

TECH
- Static site, no backend, no runtime network calls. Vendor any library (Phaser or similar) into the repo instead of loading it from a CDN.
- Keyboard and gamepad. Target 60 fps on a mid-range laptop. Save progress to localStorage.
- Hidden debug menu to warp to any region, grant powers, and set the tally.

VERIFICATION (I won't be checking in, so this is on you)
- Use the pre-installed Chromium with Playwright to screenshot every region, boss fight, and verse card. Look at the screenshots and fix what's wrong.
- Script playthroughs covering movement, trophy pop and pickup, each boss, each verse card, the sword pickup, the 100 scene, and both endings.
- Write an automated reachability test over the level data that proves: exactly 200 trophies exist; at least 100 are reachable with region 1-5 powers; all 200 are reachable with every power; every gate has a power that opens it. Run it and the verse-text test before every commit.

MILESTONES (each one playable and pushed before you start the next; the budget can end a run mid-list)
1. Movement, sling, one marked enemy type, trophy pop and pickup, HUD, tools/meter.py, live on Pages.
2. Region 1 with its captain, verse card, and first power-up; the hub.
3. Regions 2-5, Goliath, the sword, the 100 scene, Ending A.
4. Regions 6-10, backtracking gates, Ending B.
5. Polish: title screen, music, settings, balance pass.
