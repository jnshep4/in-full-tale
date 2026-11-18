// Reachability over the level data: which cells can David stand in, given a set of powers?
//
// Two models, both simpler than the real physics:
//   - conservative: weaker than the game in every respect (jump 3 tiles up and 4 across, where the
//     game allows about 3.7 and 5.4, and so on for each power). Anything it reaches, play can reach.
//     Used to prove trophies are reachable.
//   - optimistic: stronger than the game in every respect (walks through stakes, jumps further and
//     higher than David ever can). Anything it cannot reach, play cannot reach. Used to prove that
//     gates hold.
// The flood crosses rooms through their links, starting from the hub.
import { AIR, SOLID, ONEWAY, SPIKE, REED, BOUND, HEDGE, WATER, RING, GATE_POWER, parseRoom } from './room.js';
import { parseTo } from './build.js';

export function modelFor(powers, optimistic = false) {
  const has = (p) => powers.includes(p);
  const m = { optimistic, has, jumpH: optimistic ? 4 : 3, maxDx: optimistic ? 9 : 4, climb: has('climb'), swim: has('swim'), cord: has('grapple') ? (optimistic ? 9 : 5) : 0 };
  if (has('double')) { m.jumpH = optimistic ? 8 : 6; m.maxDx = optimistic ? 16 : 6; }
  if (has('dash')) m.maxDx += optimistic ? 6 : 1;
  return m;
}

const parsed = new Map();
export function roomOf(def, regionId) {
  let r = parsed.get(def);
  if (!r) { r = parseRoom(def, regionId); parsed.set(def, r); }
  return r;
}

// Flood one room from seed cells. `seen` is shared between calls so the world flood can add seeds.
function floodRoom(room, m, seeds, seen) {
  const blocks = (t) => t === SOLID || (t >= REED && t <= BOUND && !m.has(GATE_POWER[t]));
  const passT = (t) => !blocks(t) && !(t === SPIKE && !m.optimistic) && !(t === WATER && !m.swim);
  const pass = (x, y) => passT(room.tile(x, y));
  const free = (x, y) => pass(x, y) && pass(x, y - 1);                 // David is two tiles tall
  const floor = (x, y) => { const t = room.tile(x, y + 1); return blocks(t) || t === ONEWAY; };
  const stand = (x, y) => y < room.h && y >= 0 && free(x, y) && floor(x, y);
  const wet = (x, y) => m.swim && room.tile(x, y) === WATER;
  const key = (x, y) => y * room.w + x;
  const inX = (x) => x >= 0 && x < room.w;
  if (!room.rings) { room.rings = []; for (let y = 0; y < room.h; y++) for (let x = 0; x < room.w; x++) if (room.tile(x, y) === RING) room.rings.push([x, y]); }
  const queue = [], fresh = [];
  const visit = (x, y) => { if (!inX(x) || y < 0 || y >= room.h) return; const k = key(x, y); if (!seen.has(k)) { seen.add(k); queue.push([x, y]); fresh.push([x, y]); } };
  for (const [sx, sy0] of seeds) {
    let sy = sy0;
    while (sy < room.h - 1 && !stand(sx, sy) && !wet(sx, sy) && free(sx, sy + 1)) sy++;   // settle onto the ground
    if (stand(sx, sy) || wet(sx, sy)) visit(sx, sy);
  }
  const los = (x0, y0, x1, y1) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 1; i < n; i++) if (!pass(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n))) return false;
    return true;
  };
  const fall = (cx, y0) => {
    for (let cy = y0; cy < room.h; cy++) {
      if (wet(cx, cy)) { visit(cx, cy); return; }
      if (stand(cx, cy)) { visit(cx, cy); if (room.tile(cx, cy + 1) !== ONEWAY) return; }   // planks can be dropped through
      if (!free(cx, cy + 1)) return;
    }
  };
  while (queue.length) {
    const [x, y] = queue.pop();
    const inWater = wet(x, y);
    if (inWater) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (wet(x + dx, y + dy) && pass(x + dx, y + dy)) visit(x + dx, y + dy);
    // Jump: rise up to jumpH (further along a wall with the climbing power), cross at that height, fall.
    const jumpH = inWater && !stand(x, y) ? (m.optimistic ? m.jumpH : Math.min(2, m.jumpH)) : m.jumpH;
    for (let h = 0; h <= 80; h++) {
      if (!free(x, y - h)) break;
      const climbing = h > jumpH;
      if (climbing && !(m.climb && (blocks(room.tile(x - 1, y - h + 1)) || blocks(room.tile(x + 1, y - h + 1))))) break;
      const maxDx = climbing ? (m.optimistic ? m.maxDx : 3) : h >= jumpH ? m.maxDx - 1 : m.maxDx;
      for (const dir of [-1, 1]) {
        for (let d = 1; d <= maxDx; d++) {
          const cx = x + dir * d;
          if (!inX(cx) || !free(cx, y - h)) break;
          fall(cx, y - h);
        }
      }
    }
    if (room.tile(x, y + 1) === ONEWAY && free(x, y + 1)) fall(x, y + 1);
    // The cord: swing up to a bronze ring in range and hang beneath it; jump on from there.
    if (m.cord) for (const [rx, ry] of room.rings) {
      if (Math.max(Math.abs(rx - x), Math.abs(ry - (y - 1))) > m.cord) continue;
      if (!pass(rx, ry + 1) || !pass(rx, ry + 2)) continue;
      if (m.optimistic || los(x, y - 1, rx, ry)) visit(rx, ry + 2);
    }
  }
  return { fresh, stand };
}

// Flood the whole world from the hub with a power set. regions: the REGIONS list (hub included).
export function floodWorld(regions, powers, optimistic = false) {
  const m = modelFor(powers, optimistic);
  const state = new Map();     // 'region/room' -> { room, seen }
  const get = (rid, roomId) => {
    const k = rid + '/' + roomId;
    if (!state.has(k)) {
      const region = regions.find((r) => r.id === rid), def = region && region.rooms.find((d) => d.id === roomId);
      if (!def) return null;
      state.set(k, { room: roomOf(def, rid), seen: new Set(), rid });
    }
    return state.get(k);
  };
  const hub = regions.find((r) => r.id === 0) || regions[0];
  const first = get(hub.id, hub.start);
  const pending = [[first, [[first.room.start.cx, first.room.start.cy]]]];
  while (pending.length) {
    const [st, seeds] = pending.pop();
    const { fresh } = floodRoom(st.room, m, seeds, st.seen);
    if (!fresh.length) continue;
    const got = new Set(fresh.map(([x, y]) => y * st.room.w + x));
    for (const l of st.room.links) {
      if (!got.has(l.cy * st.room.w + l.cx)) continue;
      if (l.needs && !m.has(l.needs)) continue;
      const to = parseTo(l.to, st.rid); if (!to) continue;
      const dst = get(to.region, to.room); if (!dst) continue;
      const tl = dst.room.link(to.link); if (!tl) continue;
      pending.push([dst, [[tl.kind === 'edge' ? (tl.side === 'L' ? 1 : dst.room.w - 2) : tl.cx, tl.cy]]]);
    }
  }
  return {
    model: m, state,
    has(rid, roomId, cx, cy) { const st = state.get(rid + '/' + roomId); return !!st && st.seen.has(cy * st.room.w + cx); },
    // A soldier or prop placed at a standing cell: reached if that cell, or the floor just below it, is.
    hasNear(rid, roomId, cx, cy) { for (let d = 0; d <= 2; d++) if (this.has(rid, roomId, cx, cy + d)) return true; return false; },
    entered(rid, roomId) { const st = state.get(rid + '/' + roomId); return !!st && st.seen.size > 0; },
  };
}
