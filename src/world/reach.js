// Reachability over level data, using a deliberately conservative model of David's movement.
// The model under-estimates what the real physics allow (jump 3 tiles up and 4 across, where the
// game manages about 3.7 and 5.4), so anything this proves reachable is reachable in play.
// Powers and gates extend the model from milestone 2 on (see NOTES.md, "Reachability model").
import { SOLID, ONEWAY, SPIKE } from './room.js';

export const BASE = { jumpH: 3, maxDx: 4 };

export function reachable(room, startCx, startCy, model = BASE) {
  const pass = (x, y) => { const t = room.tile(x, y); return t !== SOLID && t !== SPIKE; };
  const free = (x, y) => pass(x, y) && pass(x, y - 1);            // David is two tiles tall
  const floor = (x, y) => { const t = room.tile(x, y + 1); return t === SOLID || t === ONEWAY; };
  const stand = (x, y) => y < room.h && free(x, y) && floor(x, y);
  const key = (x, y) => y * room.w + x;

  // Settle the start onto the ground below it.
  let sy = startCy;
  while (sy < room.h && !stand(startCx, sy) && free(startCx, sy + 1)) sy++;
  const seen = new Set();
  if (!stand(startCx, sy)) return { seen, stand };
  const queue = [[startCx, sy]];
  seen.add(key(startCx, sy));
  const visit = (x, y) => { const k = key(x, y); if (!seen.has(k)) { seen.add(k); queue.push([x, y]); } };

  while (queue.length) {
    const [x, y] = queue.pop();
    for (let h = 0; h <= model.jumpH; h++) {
      if (!free(x, y - h)) break;                                   // rise straight up
      const maxDx = h >= model.jumpH ? model.maxDx - 1 : model.maxDx;
      for (const dir of [-1, 1]) {
        for (let d = 1; d <= maxDx; d++) {
          const cx = x + dir * d;
          if (!free(cx, y - h)) break;                              // travel across at apex height
          for (let cy = y - h; cy < room.h; cy++) {                 // then fall
            if (stand(cx, cy)) {
              visit(cx, cy);
              if (room.tile(cx, cy + 1) !== ONEWAY) break;          // one-way floors can be dropped through
            }
            if (!free(cx, cy + 1)) break;
          }
        }
      }
    }
    // Drop through a one-way floor straight down.
    if (room.tile(x, y + 1) === ONEWAY) {
      for (let cy = y + 1; cy < room.h; cy++) {
        if (!free(x, cy)) break;
        if (stand(x, cy)) { visit(x, cy); if (room.tile(x, cy + 1) !== ONEWAY) break; }
      }
    }
  }
  return { seen, stand, has: (x, y) => seen.has(key(x, y)) };
}
