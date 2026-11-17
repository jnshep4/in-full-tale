// Verse-text test: every card's text and reference must match BRIEF.md exactly.
// Run before every commit: node tests/verses.test.mjs
import { readFileSync } from 'node:fs';
import { REGION_VERSES, VERSION_TAG, SWORD_VERSE, ENDING_B_VERSE } from '../src/data/verses.js';

const brief = readFileSync(new URL('../BRIEF.md', import.meta.url), 'utf8');
let failures = 0;
const check = (ok, msg) => { if (!ok) { failures++; console.error('FAIL ' + msg); } };

// The ten region verses: lines of the form  N. <reference>: "<text>"
const section = brief.split('REGION VERSES')[1].split('WEAPONS')[0];
const expected = [...section.matchAll(/^(\d+)\. (.+?): "(.+)"$/gm)].map((m) => ({ region: +m[1], ref: m[2], text: m[3] }));
check(expected.length === 10, `BRIEF.md should list 10 region verses, found ${expected.length}`);
check(REGION_VERSES.length === 10, `verses.js should hold 10 region verses, found ${REGION_VERSES.length}`);
for (const e of expected) {
  const got = REGION_VERSES.find((v) => v.region === e.region);
  check(!!got, `region ${e.region}: no card`);
  if (!got) continue;
  check(got.ref === e.ref, `region ${e.region}: reference "${got.ref}" should be "${e.ref}"`);
  check(got.text === e.text, `region ${e.region}: text differs from BRIEF.md\n  have: ${got.text}\n  want: ${e.text}`);
}
check(VERSION_TAG === '(KJV)', 'version tag must be "(KJV)"');

// The two other quoted KJV lines.
const quoted = (after) => { const m = brief.split(after)[1].match(/"([^"]+)"/); return m && m[1]; };
check(SWORD_VERSE.text === quoted('1 Samuel 21:9:'), 'sword verse differs from BRIEF.md');
check(SWORD_VERSE.ref === '1 Samuel 21:9', 'sword verse reference');
check(ENDING_B_VERSE.text === quoted('1 Samuel 18:27:'), 'Ending B verse differs from BRIEF.md');
check(ENDING_B_VERSE.ref === '1 Samuel 18:27', 'Ending B verse reference');

if (failures) { console.error(`verses: ${failures} failure(s)`); process.exit(1); }
console.log(`verses: OK (10 region cards, sword verse, Ending B verse match BRIEF.md)`);
