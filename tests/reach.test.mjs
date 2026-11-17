// Reachability test over the level data. Run before every commit: node tests/reach.test.mjs
//
// Always enforced, for every region present:
//   - maps parse cleanly, every room has a reachable layout from its start
//   - every marked soldier stands somewhere David can reach
//   - a region flagged complete has exactly 20 marked soldiers
// Enforced once all ten regions are flagged complete (reported as PENDING until then):
//   - exactly 200 trophies exist
//   - at least 100 are reachable with the powers earned through region 5
//   - all 200 are reachable with every power
//   - every gate has a power that opens it
// Gates and powers arrive in milestone 2; this file grows with the reach model.
import { REGIONS, REGIONS_PLANNED, MARKED_PER_REGION } from '../src/data/regions.js';
import { parseRoom } from '../src/world/room.js';
import { reachable } from '../src/world/reach.js';

let failures = 0, total = 0, totalReach = 0;
const fail = (msg) => { failures++; console.error('FAIL ' + msg); };

for (const region of REGIONS) {
  let marked = 0, reached = 0;
  for (const def of region.rooms) {
    const room = parseRoom(def, region.id);
    for (const p of room.problems) fail(`region ${region.id} room ${def.id}: ${p}`);
    if (!room.start) { fail(`region ${region.id} room ${def.id}: no start (P)`); continue; }
    const r = reachable(room, room.start.cx, room.start.cy);
    if (!r.seen.size) { fail(`region ${region.id} room ${def.id}: start is not on standable ground`); continue; }
    for (const sp of room.spawns.filter((s) => s.type === 'marked')) {
      marked++;
      // The soldier's cell, settled onto the floor beneath it.
      let cy = sp.cy;
      while (cy < room.h && !r.stand(sp.cx, cy)) cy++;
      if (r.has(sp.cx, cy)) reached++;
      else fail(`region ${region.id} room ${def.id}: marked soldier ${sp.id} at ${sp.cx},${sp.cy} is unreachable`);
    }
  }
  total += marked; totalReach += reached;
  const want = region.complete ? ` (must be ${MARKED_PER_REGION})` : ' (region in progress)';
  console.log(`region ${region.id} "${region.name}": ${marked} marked, ${reached} reachable${want}`);
  if (region.complete && marked !== MARKED_PER_REGION) fail(`region ${region.id}: ${marked} marked soldiers, need exactly ${MARKED_PER_REGION}`);
}

const allDone = REGIONS.length === REGIONS_PLANNED && REGIONS.every((r) => r.complete);
if (allDone) {
  if (total !== REGIONS_PLANNED * MARKED_PER_REGION) fail(`${total} trophies exist, need exactly 200`);
  // Power-set checks (>=100 with region 1-5 powers, all 200 with every power, every gate openable)
  // must be implemented here before the last region is flagged complete.
  fail('final power-set checks are not implemented yet');
} else {
  console.log(`PENDING final checks: ${REGIONS.filter((r) => r.complete).length}/${REGIONS_PLANNED} regions complete, ${total}/200 trophies placed`);
}

if (failures) { console.error(`reach: ${failures} failure(s)`); process.exit(1); }
console.log('reach: OK');
