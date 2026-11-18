// Set pieces and a segment-based room maker, shared by the region files from region 2 on.
// A room is a row of segments, each a stretch of ground at one height with things placed on it by
// column offset from the segment's left edge. gT below is a segment's ground-top row.
//
// Placement rules these pieces rely on (tests/reach.test.mjs enforces them):
//   - a double-jump tower (h 5) must stand 16+ columns from any footing higher than its ground;
//   - a climb tower must top out 9+ rows above every footing within 22 columns;
//   - a ring perch must be 23+ columns from any tall wall, tower or hut.
import { RB } from '../world/build.js';

// A sealed hut, 9 wide, entered through a 3-high gate of tile `ch`. Planks either side reach its roof.
export function hut(b, x, gT, ch, kind = 'M', flip = false) {
  b.fill(x, gT - 4, x + 8, gT - 4).back(x, gT - 3, x + 8, gT - 1);
  const dx = flip ? x + 8 : x, wx = flip ? x : x + 8;
  b.fill(wx, gT - 3, wx, gT - 1).fill(dx, gT - 3, dx, gT - 1, ch);
  b.put(flip ? x + 3 : x + 5, gT - 1, kind).put(flip ? x + 5 : x + 3, gT - 1, 't');
  b.plank(x - 3, x - 2, gT - 3).plank(x + 10, x + 11, gT - 3);
}
// A block of rock on an arch, its top h rows above the ground: 5 for a double-jump gate, 9+ for climb.
export function tower(b, x, w, gT, h, power, kind = 'M') {
  b.fill(x, gT - h, x + w - 1, gT - 4).back(x, gT - 3, x + w - 1, gT - 1);
  const mx = x + (w >> 1);
  b.put(mx, gT - h - 1, kind).put(mx + 1, gT - h - 1, 't').gate(power, mx, gT - h - 1);
}
// A cellar under a cracked slab (Lion's Fall). A plank under the hole is the way back out.
export function cellar(b, x, gT, kind = 'M') {
  b.cave(x, gT + 1, x + 7, gT + 4).fill(x, gT, x + 1, gT, '4').plank(x, x + 1, gT + 3);
  b.put(x + 5, gT + 4, kind).put(x + 3, gT + 4, 't');
}
// A flooded shaft that bends under the ground into an air pocket (Deep Breath).
export function sunk(b, x, gT, kind = 'M') {
  b.fill(x, gT, x + 1, gT + 5, '~').back(x, gT, x + 1, gT + 5);
  b.fill(x + 2, gT + 4, x + 4, gT + 5, '~').back(x + 2, gT + 4, x + 4, gT + 5);
  b.cave(x + 5, gT + 1, x + 11, gT + 3);
  b.fill(x + 5, gT + 4, x + 7, gT + 5, '~').back(x + 5, gT + 4, x + 7, gT + 5);
  b.put(x + 10, gT + 3, kind).put(x + 9, gT + 3, 't');
}
// A floating ledge reached by two bronze rings (Shepherd's Cord).
export function perch(b, x, gT, kind = 'M') {
  b.put(x - 4, gT - 7, 'o').put(x - 2, gT - 11, 'o');
  b.fill(x, gT - 11, x + 4, gT - 10);
  b.put(x + 2, gT - 12, kind).put(x + 3, gT - 12, 't').gate('grapple', x + 2, gT - 12);
}
// A wall to the top of the room with a gate at its foot: a gate on the main path.
export function wall(b, x, gT, ch) { b.fill(x, 0, x + 1, gT - 4).fill(x, gT - 3, x + 1, gT - 1, ch); }

// A pool six wide with a wall standing in it from the top of the room: the way on is under the wall (Deep Breath).
export function moat(b, x, gT) { b.fill(x, gT, x + 5, gT + 2, '~').fill(x + 2, 0, x + 3, gT); }

export const seg = (w, top, items = {}) => ({ w, top, items });

// o: { L: [linkId, to], R: [linkId, to], roof: rows of solid ceiling (a cave), opts: extra room fields }
export function room(id, name, h, segs, o = {}) {
  const w = segs.reduce((a, s) => a + s.w, 0);
  const b = new RB(id, name, w, h, o.opts || {});
  let x = 0;
  for (const s of segs) { b.land(x, x + s.w - 1, s.top); s.x0 = x; x += s.w; }
  b.walls();
  if (o.roof) b.fill(0, 0, w - 1, o.roof - 1).back(0, o.roof, w - 1, h - 1);
  for (const s of segs) {
    const X = s.x0, g = s.top, it = s.items;
    for (const ch of ['M', 'A', 'H', 's', 'a', 'h', 'l', 't']) for (const dx of it[ch] || []) b.put(X + dx, g - 1, ch);
    for (const k in it) {
      const v = it[k], each = (fn) => (Array.isArray(v[0]) ? v : [v]).forEach(fn);
      if (k === 'hut') each((a) => hut(b, X + a[0], g, a[1], a[2], a[3]));
      else if (k === 'tower') each((a) => tower(b, X + a[0], a[1], g, a[2], a[3], a[4]));
      else if (k === 'cellar') each((a) => cellar(b, X + a[0], g, a[1]));
      else if (k === 'sunk') each((a) => sunk(b, X + a[0], g, a[1]));
      else if (k === 'perch') each((a) => perch(b, X + a[0], g, a[1]));
      else if (k === 'wall') each((a) => wall(b, X + a[0], g, a[1]));
      else if (k === 'moat') each((a) => moat(b, X + (Array.isArray(a) ? a[0] : a), g));
      else if (k === 'pit') each((a) => b.fill(X + a[0], g, X + a[0] + a[1] - 1, g, '^'));
      else if (k === 'pool') each((a) => b.fill(X + a[0], g, X + a[0] + a[1] - 1, g + 1, '~'));
      else if (k === 'plank') each((a) => b.plank(X + a[0], X + a[1], g - a[2]));
      else if (k === 'at') each((a) => b.put(X + a[1], g - 1 - a[2], a[0]));          // [char, column, rows above the ground]
      else if (k === 'door') each((a) => b.door(a[0], X + a[1], g - 1, a[2], a[3] || { look: 'path' }));
      else if (k === 'prop') each((a) => b.prop(a[0], X + a[1], g - 1, a[2] || {}));
    }
  }
  if (o.L) b.exit('L', o.L[0], segs[0].top - 1, o.L[1]);
  if (o.R) b.exit('R', o.R[0], segs[segs.length - 1].top - 1, o.R[1]);
  return b.done();
}

// A captain's ground: one walled screen-and-a-bit, a door in from the region and a door out to camp.
// o: { w, planks: [[x0, x1, rowsUp]], from: 'room/link' }
export function arena(n, name, from, o = {}) {
  const w = o.w || 34, b = new RB('arena', name, w, 17, { boss: n });
  b.land(0, w - 1, 14).walls();
  for (const [x0, x1, up] of o.planks || [[6, 9, 3], [w - 10, w - 7, 3]]) b.plank(x0, x1, 14 - up);
  for (const [x, up] of o.rings || []) b.put(x, 13 - up, 'o');
  if (o.pool) b.fill(o.pool[0], 14, o.pool[1], 14 + Math.min(2, o.pool[2]) - 1, '~');
  b.door('in', 4, 13, from, { look: 'path' });
  b.door('out', w - 5, 13, `0/camp/d${n}`, { look: 'path', after: n, label: "TO SAUL'S CAMP" });
  b.puts('t', [2, 13], [w >> 1, 13], [w - 3, 13]);
  b.put(w - 10, 13, 'B');
  return b.done();
}
