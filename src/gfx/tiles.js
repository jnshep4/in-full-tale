// Pre-renders a room's tile layer into one canvas: lit soil on top, strata of dark rock beneath.
import { T, hash2, fbm, hex, mix3, clamp } from '../core.js';
import { SOLID, ONEWAY, SPIKE } from '../world/room.js';

const PAL = {
  hills: {
    lip: '#ffd98a', grass: ['#b9a04e', '#8f8442', '#6a6a3a'], soil: ['#6a5140', '#55423a', '#443537'],
    rock: ['#2c2437', '#3a3048', '#4a3e59', '#5e506b'], edge: '#120d18', blade: ['#d9b85e', '#a3954a', '#77793f'], bloom: '#d9483b',
    wood: ['#c08a4a', '#8c5a30', '#5a3a24'],
  },
};

export function renderRoom(room, theme) {
  const P = PAL[theme] || PAL.hills;
  const c = document.createElement('canvas');
  c.width = room.w * T; c.height = room.h * T;
  const g = c.getContext('2d'), img = g.createImageData(c.width, c.height), d = img.data;
  const lip = hex(P.lip), grass = P.grass.map(hex), soil = P.soil.map(hex), rock = P.rock.map(hex), edge = hex(P.edge);
  // depth[cell] = number of solid cells stacked directly above it
  const depth = new Uint16Array(room.w * room.h);
  for (let x = 0; x < room.w; x++) for (let y = 0; y < room.h; y++) {
    if (room.tile(x, y) === SOLID) depth[y * room.w + x] = (y > 0 && room.tile(x, y - 1) === SOLID) ? depth[(y - 1) * room.w + x] + 1 : (y === 0 ? 9 : 0);
  }
  for (let cy = 0; cy < room.h; cy++) for (let cx = 0; cx < room.w; cx++) {
    if (room.tile(cx, cy) !== SOLID) continue;
    const dep = depth[cy * room.w + cx];
    const airL = cx > 0 && room.tile(cx - 1, cy) !== SOLID, airR = cx < room.w - 1 && room.tile(cx + 1, cy) !== SOLID;
    const airD = cy < room.h - 1 && room.tile(cx, cy + 1) !== SOLID;
    for (let py = 0; py < T; py++) for (let px = 0; px < T; px++) {
      const X = cx * T + px, Y = cy * T + py;
      const n = hash2(X, Y, 3);
      const up = dep * T + py + (hash2(X, 0, 5) - 0.5) * 3 + (fbm(X * 0.08, Y * 0.08, 6, 2) - 0.5) * 6;   // ragged soil line
      let col;
      if (dep === 0 && py === 0) col = n > 0.12 ? lip : grass[0];
      else if (up < 3) col = grass[n > 0.55 ? 0 : 1];
      else if (up < 6) col = grass[n > 0.6 ? 1 : 2];
      else if (up < 12) col = soil[n > 0.7 ? 0 : 1];
      else if (up < 20) col = soil[n > 0.75 ? 1 : 2];
      else {
        // Strata: wide flat bands, dithered at their borders, with scattered pebbles.
        const v = fbm(X * 0.035, Y * 0.16, 9, 3) * 3.4 + (n - 0.5) * 0.5 - clamp((up - 20) / 220, 0, 1) * 0.9;
        col = rock[clamp(Math.floor(v), 0, 3)];
        if (n > 0.988) col = rock[3];
        const blockY = (Y + ((X >> 5) & 1) * 6) % 13, crack = fbm(X * 0.2, Y * 0.2, 12, 2);
        if (blockY === 0 && crack > 0.5) col = mix3(col, edge, 0.55);
      }
      const sideL = airL && px < 2, sideR = airR && px > T - 3, under = airD && py > T - 3;
      if ((airL && px === 0) || (airR && px === T - 1) || (airD && py === T - 1)) col = edge;
      else if ((sideL || sideR || under) && !(dep === 0 && py < 2)) col = mix3(col, edge, 0.4);
      const i = (Y * c.width + X) * 4;
      d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);

  for (let cy = 0; cy < room.h; cy++) for (let cx = 0; cx < room.w; cx++) {
    const t = room.tile(cx, cy), X = cx * T, Y = cy * T;
    if (t === SOLID && cy > 0 && room.tile(cx, cy - 1) !== SOLID) {
      // Dry grass, and the odd red anemone, along every walkable top.
      for (let px = 0; px < T; px++) {
        const n = hash2(X + px, Y, 31);
        if (n < 0.34) { const hgt = 1 + Math.floor(hash2(X + px, Y, 32) * 3); g.fillStyle = P.blade[Math.floor(n * 9) % 3]; g.fillRect(X + px, Y - hgt, 1, hgt); }
        else if (n > 0.985 && room.tile(cx, cy - 1) === 0) { g.fillStyle = P.blade[2]; g.fillRect(X + px, Y - 3, 1, 3); g.fillStyle = P.bloom; g.fillRect(X + px - 1, Y - 5, 3, 2); }
      }
    } else if (t === ONEWAY) {
      const endL = room.tile(cx - 1, cy) !== ONEWAY, endR = room.tile(cx + 1, cy) !== ONEWAY;
      g.fillStyle = P.wood[2]; g.fillRect(X, Y, T, 5);
      g.fillStyle = P.wood[1]; g.fillRect(X, Y, T, 3);
      g.fillStyle = P.wood[0]; g.fillRect(X, Y, T, 1);
      g.fillStyle = P.wood[2]; g.fillRect(X + 7, Y + 1, 1, 2);
      g.fillStyle = PAL.hills.edge; g.fillRect(X, Y + 5, T, 1);
      if (endL) { g.fillStyle = P.wood[2]; g.fillRect(X + 1, Y + 5, 2, 5); g.fillRect(X + 3, Y + 5, 1, 2); }
      if (endR) { g.fillStyle = P.wood[2]; g.fillRect(X + T - 3, Y + 5, 2, 5); g.fillRect(X + T - 4, Y + 5, 1, 2); }
    } else if (t === SPIKE) {
      // Sharpened stakes.
      for (let s = 0; s < 3; s++) {
        const bx = X + 1 + s * 5, hgt = 11 + Math.floor(hash2(cx, s, 40) * 4);
        for (let j = 0; j < hgt; j++) {
          const half = j < 4 ? 0 : j < 9 ? 1 : 2;
          g.fillStyle = j < 3 ? '#e9d9b0' : P.wood[1]; g.fillRect(bx + 2 - half, Y + T - hgt + j, half * 2 + 1, 1);
          if (half) { g.fillStyle = P.wood[2]; g.fillRect(bx + 2 - half, Y + T - hgt + j, 1, 1); }
        }
      }
    }
  }
  return c;
}
