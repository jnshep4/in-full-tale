// Pre-renders a room's tile layer into one canvas: lit soil on top, strata of dark rock beneath.
import { T, hash2, fbm, hex, mix3, clamp } from '../core.js';
import { SOLID, ONEWAY, SPIKE } from '../world/room.js';

const PAL = {
  hills: {
    lip: '#ffd98a', grass: ['#b9a04e', '#8f8442', '#6a6a3a'], soil: ['#6a5140', '#55423a', '#443537'],
    rock: ['#2c2437', '#3a3048', '#4a3e59', '#5e506b'], edge: '#120d18', blade: ['#d9b85e', '#a3954a', '#77793f'], bloom: '#d9483b',
    wood: ['#c08a4a', '#8c5a30', '#5a3a24'],
  },
  camp: {
    lip: '#e8d08a', grass: ['#9a9450', '#787a44', '#5a6238'], soil: ['#5e4a40', '#4c3c3a', '#3c3036'],
    rock: ['#262238', '#322e48', '#403a58', '#524a6a'], edge: '#100d18', blade: ['#c0b060', '#8f8c4a', '#6a703c'], bloom: '#d9483b',
    wood: ['#c08a4a', '#8c5a30', '#5a3a24'],
  },
  terraces: {
    lip: '#ffe9a0', grass: ['#a8b04a', '#7f9440', '#5a7436'], soil: ['#9a7448', '#7c5a3c', '#5e4434'],
    rock: ['#4a3830', '#5e4a3a', '#74604a', '#8c7858'], edge: '#1a1210', blade: ['#c8d060', '#8faa48', '#5f8a3c'], bloom: '#8a3aa0',
    wood: ['#c89a58', '#946838', '#603f26'],
  },
  gorge: {
    lip: '#b8d0e8', grass: ['#5a8a80', '#44706c', '#34585a'], soil: ['#3c4a5a', '#30404e', '#283444'],
    rock: ['#182234', '#223048', '#2e405c', '#3e5270'], edge: '#080c16', blade: ['#7ab0a0', '#56887c', '#3e6a64'], bloom: '#e8e0b0',
    wood: ['#9a8a70', '#6a5c4a', '#443a30'],
  },
  thicket: {
    lip: '#d8e890', grass: ['#6a9a3c', '#4f7c34', '#3a602e'], soil: ['#4e4430', '#3e3628', '#302a22'],
    rock: ['#1c2a24', '#263830', '#32483c', '#42604a'], edge: '#0a120e', blade: ['#8ac048', '#5f9a3a', '#447a30'], bloom: '#f0d040',
    wood: ['#a8824a', '#785830', '#4c3820'],
  },
  ekron: {
    lip: '#f0dca0', grass: ['#a89a5a', '#8a7c4c', '#6c6040'], soil: ['#7a6048', '#644e40', '#4e3e38'],
    rock: ['#3a2e3e', '#4a3c4e', '#5c4c5e', '#72607a'], edge: '#140e18', blade: ['#b8b06a', '#8f8a52', '#6e6c44'], bloom: '#e8e0c8',
    wood: ['#b88a50', '#845c34', '#553a24'],
  },
  ashdod: {
    lip: '#e8d0f0', grass: ['#8a78a8', '#6e5e8c', '#564a70'], soil: ['#5a4668', '#483856', '#382c46'],
    rock: ['#241a3a', '#30244a', '#3e305c', '#504072'], edge: '#0e0a1a', blade: ['#a890c8', '#7e6aa0', '#5e5080'], bloom: '#ffd680',
    wood: ['#b08860', '#7c5c40', '#4e3a2a'],
  },
  ashkelon: {
    lip: '#d8f0e8', grass: ['#6a9a90', '#527e78', '#3e6460'], soil: ['#4a5a5e', '#3c4a50', '#303c44'],
    rock: ['#16242e', '#20323e', '#2c4250', '#3c5666'], edge: '#081016', blade: ['#8ac0b0', '#629a8c', '#487a70'], bloom: '#ffe0a0',
    wood: ['#a89068', '#74603f', '#4a3c28'],
  },
  gaza: {
    lip: '#fff0b0', grass: ['#e0b060', '#c8944c', '#a8763e'], soil: ['#b07840', '#946034', '#784c2c'],
    rock: ['#4a2a20', '#5e382a', '#744834', '#8e5c40'], edge: '#1c0e0a', blade: ['#f0c870', '#c89a50', '#9a7438'], bloom: '#d8362e',
    wood: ['#c89050', '#946030', '#603c20'],
  },
  gath: {
    lip: '#e8a890', grass: ['#7a5458', '#62444a', '#4e363e'], soil: ['#4e3038', '#402830', '#32202a'],
    rock: ['#1e1018', '#2a1822', '#38202c', '#4a2c3a'], edge: '#0c060a', blade: ['#9a6a60', '#74504c', '#583c3e'], bloom: '#ff8040',
    wood: ['#a87048', '#74482c', '#4a2c1e'],
  },
  battle: {
    lip: '#e8b888', grass: ['#8a7048', '#6e583e', '#564436'], soil: ['#5a3c34', '#48302e', '#382628'],
    rock: ['#2c1c22', '#3c262c', '#4e3238', '#644048'], edge: '#140a0e', blade: ['#a88850', '#7c6440', '#5a4834'], bloom: '#d8362e',
    wood: ['#b07a44', '#7c4e2c', '#4e3020'],
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
  // Backing for hollow interiors: dark dressed rock, so caves and huts are not open to the sky.
  for (const [bx0, by0, bx1, by1] of room.backs || []) {
    for (let cy = by0; cy <= by1; cy++) for (let cx = bx0; cx <= bx1; cx++) {
      if (room.tile(cx, cy) === SOLID) continue;
      for (let py = 0; py < T; py++) for (let px = 0; px < T; px++) {
        const X = cx * T + px, Y = cy * T + py, n = hash2(X, Y, 71);
        const v = fbm(X * 0.05, Y * 0.12, 72, 2);
        let col = mix3(edge, rock[0], 0.35 + v * 0.5);
        if ((Y + ((X >> 4) & 1) * 5) % 9 === 0 && n > 0.3) col = mix3(col, edge, 0.5);
        if (n > 0.985) col = rock[1];
        const i = (Y * c.width + X) * 4;
        d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
      }
    }
  }
  g.putImageData(img, 0, 0);

  for (let cy = 0; cy < room.h; cy++) for (let cx = 0; cx < room.w; cx++) {
    const t = room.tile(cx, cy), X = cx * T, Y = cy * T;
    if (t === SOLID && cy > 0 && room.tile(cx, cy - 1) !== SOLID && !(room.backs || []).some(([bx0, by0, bx1, by1]) => cx >= bx0 && cx <= bx1 && cy - 1 >= by0 && cy - 1 <= by1)) {
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
