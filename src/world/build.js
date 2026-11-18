// Room builder. Region files describe each room as rectangle fills and placed things; the builder
// turns that into the ASCII map the parser reads (legend in NOTES.md, "Level format").
// Convention: a "standing row" is the row of the cell a body stands in, one above its floor.
export class RB {
  constructor(id, name, w, h, o = {}) {
    this.id = id; this.name = name; this.w = w; this.h = h; this.o = o;
    this.g = Array.from({ length: h }, () => Array(w).fill('.'));
    this.links = []; this.props = []; this.gates = []; this.backs = [];
  }
  fill(x0, y0, x1, y1, ch = '#') {
    for (let y = Math.max(0, y0); y <= Math.min(this.h - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(this.w - 1, x1); x++) this.g[y][x] = ch;
    return this;
  }
  clear(x0, y0, x1, y1) { return this.fill(x0, y0, x1, y1, '.'); }
  // Ground from `top` down to the bottom of the room.
  land(x0, x1, top) { return this.fill(x0, top, x1, this.h - 1); }
  walls(t = 2) { return this.fill(0, 0, t - 1, this.h - 1).fill(this.w - t, 0, this.w - 1, this.h - 1); }
  plank(x0, x1, y) { return this.fill(x0, y, x1, y, '='); }
  put(x, y, ch) {
    if (this.g[y][x] !== '.') throw new Error(`room ${this.id}: cell ${x},${y} already holds '${this.g[y][x]}' (placing '${ch}')`);
    this.g[y][x] = ch; return this;
  }
  // puts('M', [x, y], [x, y], ...)
  puts(ch, ...cells) { for (const [x, y] of cells) this.put(x, y, ch); return this; }
  // Dark rock or wall backing behind hollow interiors (caves, huts), so the sky does not show through.
  back(x0, y0, x1, y1) { this.backs.push([x0, y0, x1, y1]); return this; }
  // A hollow: clears the rectangle and backs it.
  cave(x0, y0, x1, y1) { return this.clear(x0, y0, x1, y1).back(x0, y0, x1, y1); }
  // Edge exit: opens the side wall three cells high above standing row cy.
  // to: 'region/room/link' or, inside the same region, 'room/link'.
  exit(side, id, cy, to, o = {}) {
    const xs = side === 'L' ? [0, 1] : [this.w - 2, this.w - 1];
    this.clear(xs[0], cy - 2, xs[1], cy);
    this.links.push({ id, kind: 'edge', side, cx: side === 'L' ? 0 : this.w - 1, cy, to, ...o });
    return this;
  }
  // A doorway entered with Up. o: needs (power id), look, label, after (boss flag that must be set).
  door(id, cx, cy, to, o = {}) { this.links.push({ id, kind: 'door', cx, cy, to, ...o }); return this; }
  prop(type, cx, cy, o = {}) { this.props.push({ type, cx, cy, ...o }); return this; }
  // Declares a geometry gate: a cell that must be out of reach without `power` (tests/reach.test.mjs).
  gate(power, cx, cy) { this.gates.push({ power, cx, cy }); return this; }
  done() {
    return { id: this.id, name: this.name, map: this.g.map((r) => r.join('')), links: this.links, props: this.props, gates: this.gates, backs: this.backs, ...this.o };
  }
}

// 'region/room/link' or 'room/link' (same region) -> { region, room, link }
export function parseTo(to, regionId) {
  if (!to) return null;
  const p = to.split('/');
  return p.length === 3 ? { region: +p[0], room: p[1], link: p[2] } : { region: regionId, room: p[0], link: p[1] };
}
