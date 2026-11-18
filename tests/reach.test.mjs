// Reachability test over the level data. Run before every commit: node tests/reach.test.mjs
//
// Always enforced, for every region present:
//   - maps parse cleanly; every link leads somewhere that exists
//   - a region flagged complete has exactly 20 marked soldiers
//   - every marked soldier is reachable with every power (conservative model)
//   - every gate tile belongs to a power that exists, and can be reached to be opened
//   - every declared geometry gate holds without its power (optimistic model) and opens with it
//   - every hub gateway needs a power that exists, and each region's captain can be reached with
//     only the powers of the regions before it
//   - not every trophy placed so far can be had with the powers of regions 1-5 once region 6+ exist
// Enforced once all ten regions are flagged complete (reported as PENDING until then):
//   - exactly 200 trophies exist
//   - at least 100 are reachable with the powers earned through region 5
//   - fewer than 200 are reachable with those powers even in the optimistic model
import { REGIONS, REGIONS_PLANNED, MARKED_PER_REGION } from '../src/data/regions.js';
import { POWERS } from '../src/data/powers.js';
import { GATE_POWER, GATE_NAME } from '../src/world/room.js';
import { floodWorld, roomOf } from '../src/world/reach.js';
import { parseTo } from '../src/world/build.js';

let failures = 0;
const fail = (msg) => { failures++; console.error('FAIL ' + msg); };
const ALL = POWERS.map((p) => p.id), ids = new Set(ALL);
const upTo = (n) => POWERS.filter((p) => p.region <= n).map((p) => p.id);
const quiet = process.argv.includes('--quiet');

const all = floodWorld(REGIONS, ALL), p5 = floodWorld(REGIONS, upTo(5)), p5opt = floodWorld(REGIONS, upTo(5), true);
const before = {};       // power id -> optimistic flood with only the powers earned before it
for (const p of POWERS) before[p.id] = floodWorld(REGIONS, upTo(p.region - 1), true);

let total = 0, reach5 = 0, reach5opt = 0;
const gateCount = {};
for (const region of REGIONS) {
  let marked = 0, got = 0, got5 = 0;
  const need = {};
  for (const def of region.rooms) {
    const room = roomOf(def, region.id), where = `region ${region.id} room ${def.id}`;
    for (const p of room.problems) fail(`${where}: ${p}`);
    if (!all.entered(region.id, def.id)) fail(`${where}: cannot be entered from the hub with every power`);
    for (const l of room.links) {
      if (l.needs && !ids.has(l.needs)) fail(`${where}: link ${l.id} needs unknown power '${l.needs}'`);
      if (!all.hasNear(region.id, def.id, l.cx, l.cy)) fail(`${where}: link ${l.id} at ${l.cx},${l.cy} cannot be reached`);
      const to = parseTo(l.to, region.id);
      if (!to) continue;
      const dreg = REGIONS.find((r) => r.id === to.region), ddef = dreg && dreg.rooms.find((d) => d.id === to.room);
      if (!ddef || !roomOf(ddef, to.region).link(to.link)) fail(`${where}: link ${l.id} leads to '${l.to}', which does not exist`);
    }
    // Gate tiles: each must map to a real power and have a reachable cell beside it.
    for (let y = 0; y < room.h; y++) for (let x = 0; x < room.w; x++) {
      const t = room.tile(x, y), power = GATE_POWER[t];
      if (!power) continue;
      gateCount[power] = (gateCount[power] || 0) + 1;
      if (!ids.has(power)) fail(`${where}: ${GATE_NAME[t]} at ${x},${y} has no power that opens it`);
      let near = false;
      for (let dy = -3; dy <= 3 && !near; dy++) for (let dx = -3; dx <= 3 && !near; dx++) near = all.has(region.id, def.id, x + dx, y + dy);
      if (!near) fail(`${where}: ${GATE_NAME[t]} at ${x},${y} cannot be reached to be opened`);
    }
    for (const g of room.gates) {
      gateCount[g.power] = (gateCount[g.power] || 0) + 1;
      if (!ids.has(g.power)) { fail(`${where}: declared gate at ${g.cx},${g.cy} names unknown power '${g.power}'`); continue; }
      if (before[g.power].hasNear(region.id, def.id, g.cx, g.cy)) fail(`${where}: ${g.power} gate at ${g.cx},${g.cy} can be passed without ${g.power}`);
      if (!all.hasNear(region.id, def.id, g.cx, g.cy)) fail(`${where}: ${g.power} gate at ${g.cx},${g.cy} cannot be passed at all`);
    }
    for (const sp of room.spawns.filter((s) => s.type === 'marked')) {
      marked++;
      if (all.hasNear(region.id, def.id, sp.cx, sp.cy)) got++;
      else fail(`${where}: marked soldier ${sp.id} at ${sp.cx},${sp.cy} is unreachable even with every power`);
      if (p5.hasNear(region.id, def.id, sp.cx, sp.cy)) got5++;
      if (p5opt.hasNear(region.id, def.id, sp.cx, sp.cy)) reach5opt++;
      // The first power (in the order earned) with which he becomes reachable.
      let first = 'none';
      for (let n = 0; n <= 10; n++) { if (floodCache(n).hasNear(region.id, def.id, sp.cx, sp.cy)) { first = n === 0 ? 'none' : POWERS[n - 1].id; break; } first = '?'; }
      need[first] = (need[first] || 0) + 1;
    }
    if (def.boss) {
      const prior = floodCache(region.id - 1);
      if (!prior.entered(region.id, def.id)) fail(`${where}: the captain cannot be reached with the powers of regions 1-${region.id - 1}`);
    }
  }
  if (region.id === 0) { if (marked) fail('the hub must hold no marked soldiers'); continue; }
  total += marked; reach5 += got5;
  if (!quiet) console.log(`region ${region.id} "${region.name}": ${marked} marked, ${got} reachable; first reachable with: ${Object.entries(need).map(([k, v]) => `${k} ${v}`).join(', ')}${region.complete ? '' : ' (region in progress)'}`);
  if (region.complete && marked !== MARKED_PER_REGION) fail(`region ${region.id}: ${marked} marked soldiers, need exactly ${MARKED_PER_REGION}`);
}
function floodCache(n) { floodCache.c = floodCache.c || {}; return floodCache.c[n] || (floodCache.c[n] = floodWorld(REGIONS, upTo(n))); }

if (!quiet) console.log('gates: ' + (Object.entries(gateCount).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'));
const built = REGIONS.filter((r) => r.id > 0);
const allDone = built.length === REGIONS_PLANNED && built.every((r) => r.complete);
console.log(`trophies placed: ${total}/200; reachable with the powers of regions 1-5: ${reach5} proven, ${reach5opt} at most`);
if (allDone) {
  if (total !== REGIONS_PLANNED * MARKED_PER_REGION) fail(`${total} trophies exist, need exactly 200`);
  if (reach5 < 100) fail(`only ${reach5} trophies are reachable with the powers of regions 1-5, need at least 100`);
  if (reach5opt >= total) fail('every trophy can be had with the powers of regions 1-5: nothing requires backtracking with later powers');
} else {
  console.log(`PENDING final checks: ${built.filter((r) => r.complete).length}/${REGIONS_PLANNED} regions complete`);
}

if (failures) { console.error(`reach: ${failures} failure(s)`); process.exit(1); }
console.log('reach: OK');
