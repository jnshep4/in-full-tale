// Room parsing and tile collision. Pure data and math: imported by the game and by Node tests.
import { T } from '../core.js';

export const AIR = 0, SOLID = 1, ONEWAY = 2, SPIKE = 3;
// Gate tiles. Each belongs to one power (GATE_POWER). The barrier kinds are solid until David,
// holding that power, opens them; water and rings are not solid but are useless without theirs.
export const REED = 4, CRACK = 5, THORN = 6, HEDGE = 7, BOUND = 8, WATER = 9, RING = 10;
export const GATE_POWER = { [REED]: 'dash', [CRACK]: 'pound', [THORN]: 'sword', [HEDGE]: 'shield', [BOUND]: 'heavy', [WATER]: 'swim', [RING]: 'grapple' };
export const GATE_NAME = { [REED]: 'reed screen', [CRACK]: 'cracked slab', [THORN]: 'thorn hedge', [HEDGE]: 'spear hedge', [BOUND]: 'bound door', [WATER]: 'deep water', [RING]: 'bronze ring' };
export const isBarrier = (t) => t >= REED && t <= BOUND;

// Map legend (see NOTES.md, "Level format").
const TILE_CHARS = { '#': SOLID, '=': ONEWAY, '^': SPIKE, '1': REED, '4': CRACK, '5': THORN, '6': HEDGE, '9': BOUND, '~': WATER, 'o': RING };
// kind: soldier type. Capital letters are marked soldiers, small letters ordinary ones.
const SPAWN_CHARS = {
  P: { type: 'start' }, t: { type: 'torch' }, B: { type: 'boss' },
  M: { type: 'marked', kind: 'spear' }, s: { type: 'soldier', kind: 'spear' },
  A: { type: 'marked', kind: 'archer' }, a: { type: 'soldier', kind: 'archer' },
  H: { type: 'marked', kind: 'heavy' }, h: { type: 'soldier', kind: 'heavy' },
  l: { type: 'soldier', kind: 'lion' },
};

export function parseRoom(def, regionId) {
  const h = def.map.length;
  const w = Math.max(...def.map.map((r) => r.length));
  const tiles = new Uint8Array(w * h);
  const spawns = [];
  const problems = [];
  let start = null, markedN = 0;
  for (let y = 0; y < h; y++) {
    const row = def.map[y];
    if (row.length !== w) problems.push(`row ${y} is ${row.length} wide, expected ${w}`);
    for (let x = 0; x < w; x++) {
      const ch = row[x] || '.';
      if (TILE_CHARS[ch]) { tiles[y * w + x] = TILE_CHARS[ch]; continue; }
      if (ch === '.' || ch === ' ') continue;
      const d = SPAWN_CHARS[ch];
      if (!d) { problems.push(`unknown map char '${ch}' at ${x},${y}`); continue; }
      const sp = { type: d.type, kind: d.kind, cx: x, cy: y };
      if (d.type === 'start') start = sp;
      if (d.type === 'marked') sp.id = `${regionId}.${def.id}.${markedN++}`;
      spawns.push(sp);
    }
  }
  const links = (def.links || []).map((l) => ({ ...l }));
  const room = {
    id: def.id, regionId, name: def.name || '', w, h, tiles, spawns, start, problems, links,
    props: def.props || [], gates: def.gates || [], backs: def.backs || [], boss: def.boss || null, def,
    shield: false,                 // set by the game when David carries the buckler: spear hedges part for him
    // Beyond the side edges the edge column repeats, so the floor of an edge exit carries on off-screen.
    tile(cx, cy) {
      if (cx < 0) cx = 0; else if (cx >= w) cx = w - 1;
      if (cy < 0) return tiles[cx] === SOLID ? SOLID : AIR;      // a wall that reaches the top of the room has no top
      if (cy >= h) return AIR;
      return tiles[cy * w + cx];
    },
    set(cx, cy, t) { if (cx >= 0 && cx < w && cy >= 0 && cy < h) tiles[cy * w + cx] = t; },
    solid(cx, cy) { const t = this.tile(cx, cy); return t === SOLID || (t >= REED && t <= BOUND && !(t === HEDGE && this.shield)); },
    tileAt(px, py) { return this.tile(Math.floor(px / T), Math.floor(py / T)); },
    link(id) { return links.find((l) => l.id === id); },
  };
  if (!start && links.length) start = room.start = { type: 'start', cx: links[0].kind === 'edge' ? (links[0].side === 'L' ? 1 : w - 2) : links[0].cx, cy: links[0].cy };
  return room;
}

// Move an axis-aligned body {x,y,w,h,vx,vy,drop?} through the room for one step.
// Bodies move less than one tile per step. Writes res.hx (-1/0/1) and res.hy (-1 ceiling, 1 floor).
export function moveBody(room, b, dt, res) {
  res.hx = 0; res.hy = 0;
  let nx = b.x + b.vx * dt;
  if (b.vx !== 0) {
    const y0 = Math.floor(b.y / T), y1 = Math.floor((b.y + b.h - 0.01) / T);
    if (b.vx > 0) {
      const cx = Math.floor((nx + b.w - 0.01) / T);
      for (let y = y0; y <= y1; y++) if (room.solid(cx, y)) { nx = cx * T - b.w; res.hx = 1; break; }
    } else {
      const cx = Math.floor(nx / T);
      for (let y = y0; y <= y1; y++) if (room.solid(cx, y)) { nx = (cx + 1) * T; res.hx = -1; break; }
    }
  }
  b.x = nx;
  let ny = b.y + b.vy * dt;
  const x0 = Math.floor(b.x / T), x1 = Math.floor((b.x + b.w - 0.01) / T);
  if (b.vy > 0) {
    const prevBottom = b.y + b.h;
    const cy = Math.floor((ny + b.h - 0.01) / T);
    for (let x = x0; x <= x1; x++) {
      const t = room.tile(x, cy);
      if (room.solid(x, cy) || (t === ONEWAY && !(b.drop > 0) && prevBottom <= cy * T + 0.01)) {
        ny = cy * T - b.h; res.hy = 1; break;
      }
    }
  } else if (b.vy < 0) {
    const cy = Math.floor(ny / T);
    for (let x = x0; x <= x1; x++) if (room.solid(x, cy)) { ny = (cy + 1) * T; res.hy = -1; break; }
  }
  b.y = ny;
}

// True if the body overlaps any tile of the given kind.
export function touches(room, b, kind) {
  const x0 = Math.floor((b.x + 1) / T), x1 = Math.floor((b.x + b.w - 1.01) / T);
  const y0 = Math.floor((b.y + 1) / T), y1 = Math.floor((b.y + b.h - 0.01) / T);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (room.tile(x, y) === kind) return true;
  return false;
}
