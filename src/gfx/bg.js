// Procedural painterly backdrops with layered parallax. Generated once per theme at load.
import { W, H, clamp, fbm, hash2, ramp, rng, hex, mix3 } from '../core.js';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const dither = (x, y) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

function paintSky(seed, stops, sun) {
  const c = mk(W, H), g = c.getContext('2d'), img = g.createImageData(W, H), d = img.data;
  const plum = hex('#2a1838'), ember = hex('#f08a4c'), sunCol = hex('#fff1bd');
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // Banded gradient, warped by noise and dithered: reads as brushwork at this resolution.
      let t = y / 188 + (fbm(x * 0.011, y * 0.04, seed) - 0.5) * 0.12;
      const bands = 20, q = t * bands, fl = Math.floor(q);
      t = clamp((fl + (q - fl > dither(x, y) ? 1 : 0)) / bands, 0, 1);
      let col = ramp(stops, t);
      // Sun glow and disc.
      const dx = x - sun.x, dy = (y - sun.y) * 1.25, dist = Math.sqrt(dx * dx + dy * dy);
      const glow = Math.max(0, 1 - dist / 150);
      col = [col[0] + 110 * glow * glow, col[1] + 60 * glow * glow, col[2] + 14 * glow * glow];
      if (dist < sun.r) col = sunCol;
      // Long clouds, dark above and lit from beneath by the low sun.
      const cn = fbm(x * 0.009 + 5, y * 0.05, seed + 50, 4) - Math.abs(y - 80) / 420;
      const edge = cn - 0.53;
      if (edge > 0 && dist >= sun.r) {
        const below = fbm(x * 0.009 + 5, (y + 5) * 0.05, seed + 50, 4) - Math.abs(y + 5 - 80) / 420 - 0.53;
        const lit = clamp((below < 0.012 ? 0.85 : 0.2) + glow * 0.5 + (y / 188 - 0.4) * 0.5, 0, 1);
        const cc = mix3(plum, ember, lit);
        const a = clamp(edge * 9, 0, 1) > dither(x, y) * 0.9 ? 0.92 : 0;
        col = mix3(col, cc, a);
      }
      if (y < 120 && hash2(x, y, seed + 9) > 0.9982) { const s = 60 + 140 * hash2(x, y, seed + 3) * (1 - y / 120); col = [col[0] + s, col[1] + s, col[2] + s]; }
      const i = (y * W + x) * 4;
      d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

// One silhouette ridge layer, seamless across its width.
function paintRidge({ w = 960, base, amp, color, rim, haze, seed, trees = 0, camp = 0, treeScale = 1 }) {
  const c = mk(w, H), g = c.getContext('2d'), img = g.createImageData(w, H), d = img.data;
  const r = rng(seed), ph = [r() * 7, r() * 7, r() * 7, r() * 7];
  const k = (Math.PI * 2) / w;
  const ridge = (x) => base + amp * (0.5 * Math.sin(k * x * 2 + ph[0]) + 0.28 * Math.sin(k * x * 5 + ph[1]) + 0.14 * Math.sin(k * x * 11 + ph[2]) + 0.08 * Math.sin(k * x * 23 + ph[3]));
  const cBase = hex(color), cRim = hex(rim), cHaze = hex(haze);
  for (let x = 0; x < w; x++) {
    const top = Math.round(ridge(x)), sunward = ridge(x + 1) > ridge(x) + 0.05;
    for (let y = Math.max(0, top); y < H; y++) {
      const depth = y - top;
      let col = mix3(cBase, cHaze, clamp(depth / 110, 0, 1) * 0.55);
      if (depth < (sunward ? 2 : 1)) col = cRim;
      else if (depth < 14 && sunward && hash2(x, y, seed) > 0.45 + depth * 0.04) col = mix3(col, cRim, 0.35);
      else if (hash2(x >> 1, y >> 1, seed + 1) > 0.86) col = mix3(col, [0, 0, 0], 0.18);
      const i = (y * w + x) * 4;
      d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const dark = `rgb(${mix3(cBase, [0, 0, 0], 0.35).map(Math.round).join(',')})`;
  g.fillStyle = dark;
  for (let i = 0; i < trees; i++) {
    const x = Math.floor(r() * w), y = Math.round(ridge(x)) + 1;
    if (r() < 0.45) {                       // cypress
      const hgt = Math.round((7 + r() * 8) * treeScale);
      for (let j = 0; j < hgt; j++) { const half = j < 2 ? 0 : j > hgt - 3 ? 1 : (treeScale > 1 ? 2 : 1); g.fillRect(x - half, y - hgt + j, half * 2 + 1, 1); }
    } else {                                // olive
      const rad = Math.round((3 + r() * 2) * treeScale);
      g.fillRect(x, y - rad, 1, rad);
      for (let j = -rad; j <= rad; j++) { const half = Math.round(Math.sqrt(rad * rad - j * j) * 1.4); g.fillRect(x - half, y - rad * 1.6 + j * 0.7, half * 2 + 1, 1); }
    }
  }
  // Distant Philistine camps: dark tents with small fires.
  for (let i = 0; i < camp; i++) {
    const x0 = Math.floor((i + 0.2 + r() * 0.5) * (w / camp));
    for (let tnt = 0; tnt < 4; tnt++) {
      const x = x0 + tnt * 11 + Math.floor(r() * 4), y = Math.round(ridge(x)) + 2;
      g.fillStyle = dark;
      for (let j = 0; j < 6; j++) g.fillRect(x - j, y - 6 + j, j * 2 + 1, 1);
      if (tnt % 2 === 0) { g.fillStyle = '#ffb45a'; g.fillRect(x + 6, y - 2, 2, 2); g.fillStyle = 'rgba(255,150,70,0.35)'; g.fillRect(x + 5, y - 4, 4, 5); }
    }
  }
  return c;
}

// A city skyline: flat-roofed blocks, towers, a crenellated wall, lamps in the windows. Seamless.
function paintCity({ w = 960, base, maxH = 46, color, rim, lit = '#ffb45a', seed, wall = 0, towers = 6, palms = 0, columns = 0 }) {
  const c = mk(w, H), g = c.getContext('2d'), r = rng(seed);
  const dark = `rgb(${mix3(hex(color), [0, 0, 0], 0.3).map(Math.round).join(',')})`;
  g.fillStyle = color; g.fillRect(0, base, w, H - base);
  let x = 0;
  while (x < w) {
    const bw = 12 + Math.floor(r() * 26), bh = 8 + Math.floor(r() * maxH * (r() < 0.25 ? 1 : 0.55)), top = base - bh;
    g.fillStyle = color; g.fillRect(x, top, bw, bh);
    g.fillStyle = rim; g.fillRect(x, top, bw, 1); g.fillRect(x + bw - 1, top, 1, Math.min(bh, 10));
    g.fillStyle = dark; g.fillRect(x, top + 1, 2, bh - 1);
    if (r() < 0.4) for (let k = x + 1; k < x + bw - 2; k += 4) { g.fillStyle = color; g.fillRect(k, top - 2, 2, 2); }       // parapet
    for (let k = 0; k < bw * bh / 90; k++) { if (r() < 0.55) { g.fillStyle = r() < 0.5 ? lit : dark; g.fillRect(x + 3 + Math.floor(r() * (bw - 6)), top + 4 + Math.floor(r() * Math.max(1, bh - 8)), 1, 2); } }
    x += bw + (r() < 0.2 ? Math.floor(r() * 10) : 0);
  }
  for (let i = 0; i < towers; i++) {
    const tx = Math.floor((i + r()) * (w / towers)) % (w - 16), th = maxH + 10 + Math.floor(r() * 22), top = base - th;
    g.fillStyle = color; g.fillRect(tx, top, 12, th); g.fillRect(tx - 2, top, 16, 4);
    for (let k = tx - 2; k < tx + 14; k += 4) g.fillRect(k, top - 3, 2, 3);
    g.fillStyle = rim; g.fillRect(tx - 2, top, 16, 1); g.fillRect(tx + 11, top + 4, 1, 14);
    g.fillStyle = lit; g.fillRect(tx + 5, top + 8, 2, 3);
  }
  if (wall) { g.fillStyle = dark; g.fillRect(0, base - wall, w, wall); for (let k = 0; k < w; k += 6) g.fillRect(k, base - wall - 3, 3, 3); g.fillStyle = rim; g.fillRect(0, base - wall, w, 1); }
  for (let i = 0; i < columns; i++) {          // a pillared temple front
    const px = Math.floor((i + 0.3) * (w / columns)), pw = 60, top = base - maxH - 26;
    g.fillStyle = color; g.fillRect(px, top + 8, pw, maxH + 18);
    for (let j = 0; j < 9; j++) g.fillRect(px + 30 - (9 - j) * 4, top + j, (9 - j) * 8, 1);
    g.fillStyle = dark; for (let k = px + 5; k < px + pw - 4; k += 9) g.fillRect(k, top + 12, 4, maxH + 14);
    g.fillStyle = lit; g.fillRect(px + 27, top + 22, 6, maxH); g.fillStyle = rim; g.fillRect(px - 2, top + 8, pw + 4, 1);
  }
  for (let i = 0; i < palms; i++) {
    const px = Math.floor(r() * w), ph = 16 + Math.floor(r() * 14), top = base - ph - Math.floor(r() * 6);
    g.fillStyle = dark; g.fillRect(px, top, 2, ph + 8);
    for (let k = -6; k <= 6; k++) { g.fillRect(px + k, top - 1 + Math.round(Math.abs(k) * 0.7), 2, 1); g.fillRect(px + Math.round(k * 0.6), top - 4 + Math.abs(k), 1, 2); }
  }
  return c;
}
// The sea at dusk: bands to the horizon, glints, a few ships at anchor.
function paintSea({ w = 960, horizon, top, bottom, glint, seed, ships = 4 }) {
  const c = mk(w, H), g = c.getContext('2d'), img = g.createImageData(w, H), d = img.data, a = hex(top), b = hex(bottom), gl = hex(glint);
  for (let y = horizon; y < H; y++) for (let x = 0; x < w; x++) {
    const t = (y - horizon) / (H - horizon);
    let col = mix3(a, b, clamp(t + (dither(x, y) - 0.5) * 0.12, 0, 1));
    const wave = Math.sin((x * 0.5 + y * 3.1) * 0.21 + Math.sin(y * 0.7) * 2 + seed);
    if (wave > 0.86 - t * 0.2 && hash2(x >> 1, y, seed) > 0.35) col = mix3(col, gl, 0.55 * (1 - t * 0.6));
    const i = (y * w + x) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const r = rng(seed);
  for (let i = 0; i < ships; i++) {
    const sx = Math.floor((i + r()) * (w / ships)), sy = horizon + 4 + Math.floor(r() * 10);
    g.fillStyle = '#0c1018'; g.fillRect(sx - 9, sy, 18, 3); g.fillRect(sx - 7, sy + 3, 14, 1); g.fillRect(sx - 11, sy - 2, 2, 3); g.fillRect(sx + 9, sy - 3, 2, 4);
    g.fillRect(sx, sy - 14, 1, 14); g.fillStyle = '#3a2a30'; g.fillRect(sx - 6, sy - 12, 12, 7); g.fillStyle = '#ffb45a'; g.fillRect(sx + 6, sy - 1, 1, 1);
  }
  return c;
}

const THEMES = {
  hills: () => ({
    ambient: 'rgb(138,124,160)',
    sky: paintSky(11, [[0, '#0b0919'], [0.28, '#211634'], [0.5, '#4a2145'], [0.66, '#943844'], [0.78, '#d5653a'], [0.89, '#f2a44a'], [1, '#ffd88c']], { x: 342, y: 148, r: 13 }),
    layers: [
      { c: paintRidge({ base: 120, amp: 30, color: '#5a3558', rim: '#b4595a', haze: '#c4664f', seed: 21 }), fx: 0.06, fy: 0.02 },
      { c: paintRidge({ base: 143, amp: 22, color: '#33223f', rim: '#7a3f55', haze: '#7d3d4a', seed: 22, trees: 46 }), fx: 0.16, fy: 0.05 },
      { c: paintRidge({ base: 163, amp: 15, color: '#19131f', rim: '#3c2638', haze: '#2a1a2b', seed: 23, trees: 30, camp: 2, treeScale: 1.7 }), fx: 0.34, fy: 0.1 },
    ],
  }),
  // Saul's camp: later in the evening, the valley in blue shadow, Israelite fires on the near ridge.
  camp: () => ({
    ambient: 'rgb(128,128,170)',
    sky: paintSky(31, [[0, '#070818'], [0.3, '#141a3a'], [0.55, '#2a2a55'], [0.72, '#5a3660'], [0.85, '#a8504f'], [0.94, '#e08a4a'], [1, '#f6c27a']], { x: 110, y: 170, r: 11 }),
    layers: [
      { c: paintRidge({ base: 126, amp: 26, color: '#3a3460', rim: '#7a5a80', haze: '#8a5a6a', seed: 41 }), fx: 0.06, fy: 0.02 },
      { c: paintRidge({ base: 146, amp: 20, color: '#232444', rim: '#4a4470', haze: '#4a3a5a', seed: 42, trees: 40 }), fx: 0.16, fy: 0.05 },
      { c: paintRidge({ base: 166, amp: 12, color: '#12121f', rim: '#2c2c48', haze: '#1e1a2c', seed: 43, trees: 26, camp: 4, treeScale: 1.7 }), fx: 0.34, fy: 0.1 },
    ],
  }),
  // Socoh: terraced vineyards in the last gold of the afternoon.
  terraces: () => ({
    ambient: 'rgb(168,140,138)',
    sky: paintSky(51, [[0, '#1a1430'], [0.25, '#3a2448'], [0.45, '#7a3a52'], [0.62, '#c8603e'], [0.76, '#f0a040'], [0.9, '#ffd070'], [1, '#fff0a8']], { x: 120, y: 128, r: 15 }),
    layers: [
      { c: paintRidge({ base: 118, amp: 22, color: '#7a4a5a', rim: '#e08a5a', haze: '#d8784a', seed: 61 }), fx: 0.06, fy: 0.02 },
      { c: paintRidge({ base: 140, amp: 26, color: '#4a2f44', rim: '#b8604a', haze: '#8a4a44', seed: 62, trees: 70, treeScale: 0.8 }), fx: 0.16, fy: 0.05 },
      { c: paintRidge({ base: 164, amp: 14, color: '#22182a', rim: '#5a3038', haze: '#3a2230', seed: 63, trees: 44, camp: 1, treeScale: 1.5 }), fx: 0.34, fy: 0.1 },
    ],
  }),
  // Sorek: a deep gorge under a cold early night, cliffs close on both sides.
  gorge: () => ({
    ambient: 'rgb(112,128,168)',
    sky: paintSky(71, [[0, '#050814'], [0.3, '#0c1630'], [0.55, '#1a2c50'], [0.75, '#34486a'], [0.9, '#6a6a80'], [1, '#b08a78']], { x: 250, y: 60, r: 9 }),
    layers: [
      { c: paintRidge({ base: 70, amp: 60, color: '#22304e', rim: '#5a78a0', haze: '#2a3a5a', seed: 81 }), fx: 0.05, fy: 0.02 },
      { c: paintRidge({ base: 110, amp: 70, color: '#16203a', rim: '#3a5278', haze: '#1c2844', seed: 82, trees: 14 }), fx: 0.14, fy: 0.05 },
      { c: paintRidge({ base: 150, amp: 46, color: '#0c1222', rim: '#243652', haze: '#121a2e', seed: 83, trees: 18, treeScale: 1.6 }), fx: 0.32, fy: 0.1 },
    ],
  }),
  // Timnah: thickets and vineyards, green dusk, the sun already under the hills.
  thicket: () => ({
    ambient: 'rgb(126,150,132)',
    sky: paintSky(91, [[0, '#07101a'], [0.3, '#10262e'], [0.55, '#1e4440'], [0.72, '#4a6a48'], [0.86, '#a8904a'], [1, '#f0c868']], { x: 380, y: 176, r: 12 }),
    layers: [
      { c: paintRidge({ base: 124, amp: 22, color: '#2a4a48', rim: '#7a9a5a', haze: '#5a7a50', seed: 101 }), fx: 0.06, fy: 0.02 },
      { c: paintRidge({ base: 138, amp: 18, color: '#18302e', rim: '#4a6a40', haze: '#2a4a38', seed: 102, trees: 110, treeScale: 1.2 }), fx: 0.16, fy: 0.05 },
      { c: paintRidge({ base: 156, amp: 12, color: '#0c1a18', rim: '#243a28', haze: '#14261e', seed: 103, trees: 90, treeScale: 2.2 }), fx: 0.34, fy: 0.1 },
    ],
  }),
  // Ephes-dammim: two armies on two hills, smoke and watch fires, a red sky.
  battle: () => ({
    ambient: 'rgb(170,124,120)',
    sky: paintSky(111, [[0, '#120810'], [0.25, '#2a0f1c'], [0.45, '#5a1a22'], [0.62, '#9a2c24'], [0.78, '#d85a2a'], [0.9, '#f09a40'], [1, '#ffd080']], { x: 240, y: 150, r: 18 }),
    layers: [
      { c: paintRidge({ base: 122, amp: 34, color: '#5a2a30', rim: '#c8603a', haze: '#b04a30', seed: 121, camp: 3 }), fx: 0.06, fy: 0.02 },
      { c: paintRidge({ base: 146, amp: 20, color: '#33181f', rim: '#7a3a30', haze: '#5a2a28', seed: 122, trees: 16, camp: 5 }), fx: 0.16, fy: 0.05 },
      { c: paintRidge({ base: 166, amp: 12, color: '#190c12', rim: '#3c1c1e', haze: '#2a1418', seed: 123, trees: 8, camp: 6, treeScale: 1.6 }), fx: 0.34, fy: 0.1 },
    ],
  }),
  // Ekron: a walled city among olive groves, lamps lit, the first stars out.
  ekron: () => ({
    ambient: 'rgb(150,132,150)',
    sky: paintSky(131, [[0, '#0a0a1c'], [0.3, '#1c1a3a'], [0.5, '#3a2a52'], [0.68, '#7a3f58'], [0.82, '#c0683e'], [0.93, '#e8a848'], [1, '#ffd88c']], { x: 80, y: 162, r: 12 }),
    layers: [
      { c: paintRidge({ base: 128, amp: 22, color: '#4a3558', rim: '#9a5a60', haze: '#9a5a50', seed: 141 }), fx: 0.05, fy: 0.02 },
      { c: paintCity({ base: 168, maxH: 40, color: '#2a2038', rim: '#6a4a5a', seed: 142, wall: 12, towers: 7 }), fx: 0.14, fy: 0.05 },
      { c: paintRidge({ base: 172, amp: 8, color: '#15101c', rim: '#34243a', haze: '#221828', seed: 143, trees: 60, treeScale: 1.6 }), fx: 0.32, fy: 0.1 },
    ],
  }),
  // Ashdod: the temple quarter, violet night, the house of Dagon lit from within.
  ashdod: () => ({
    ambient: 'rgb(146,126,170)',
    sky: paintSky(151, [[0, '#0a0618'], [0.3, '#1e1038'], [0.52, '#3c1c58'], [0.7, '#6a2a6a'], [0.84, '#a8486a'], [0.94, '#e08a6a'], [1, '#ffc890']], { x: 400, y: 168, r: 10 }),
    layers: [
      { c: paintCity({ base: 150, maxH: 34, color: '#3a2a5a', rim: '#7a5a90', seed: 161, towers: 5, lit: '#ffd680' }), fx: 0.05, fy: 0.02 },
      { c: paintCity({ base: 166, maxH: 44, color: '#261a40', rim: '#5a4078', seed: 162, towers: 4, columns: 3, lit: '#ffb45a' }), fx: 0.14, fy: 0.05 },
      { c: paintCity({ base: 178, maxH: 26, color: '#140e24', rim: '#342450', seed: 163, towers: 3, wall: 8 }), fx: 0.32, fy: 0.1 },
    ],
  }),
  // Ashkelon: the harbor, ships at anchor on a teal sea.
  ashkelon: () => ({
    ambient: 'rgb(126,150,160)',
    sky: paintSky(171, [[0, '#06101c'], [0.3, '#0e2438'], [0.55, '#1c4458'], [0.72, '#3a7078'], [0.86, '#a89a70'], [0.95, '#f0b860'], [1, '#ffe0a0']], { x: 300, y: 150, r: 14 }),
    layers: [
      { c: paintSea({ horizon: 152, top: '#e8a858', bottom: '#12283a', glint: '#ffe0a0', seed: 181 }), fx: 0.03, fy: 0.02 },
      { c: paintCity({ base: 170, maxH: 30, color: '#1a2a3a', rim: '#4a6a78', seed: 182, towers: 4, wall: 6, lit: '#ffb45a' }), fx: 0.15, fy: 0.05 },
      { c: paintCity({ base: 184, maxH: 22, color: '#0c1622', rim: '#2a4050', seed: 183, towers: 2, palms: 10 }), fx: 0.32, fy: 0.1 },
    ],
  }),
  // Gaza: great gates at the desert's edge, sand still warm, a brass sky.
  gaza: () => ({
    ambient: 'rgb(176,140,120)',
    sky: paintSky(191, [[0, '#1a0e1c'], [0.25, '#3a1a2a'], [0.45, '#7a3020'], [0.62, '#c05a20'], [0.78, '#e89030'], [0.9, '#f8c050'], [1, '#ffe890']], { x: 200, y: 140, r: 20 }),
    layers: [
      { c: paintRidge({ base: 134, amp: 14, color: '#8a4a30', rim: '#f0a050', haze: '#d07838', seed: 201 }), fx: 0.05, fy: 0.02 },
      { c: paintCity({ base: 164, maxH: 36, color: '#4a2620', rim: '#b06a38', seed: 202, towers: 6, wall: 16, palms: 14, lit: '#ffe090' }), fx: 0.14, fy: 0.05 },
      { c: paintRidge({ base: 172, amp: 9, color: '#22100e', rim: '#5a2c1c', haze: '#34180f', seed: 203, trees: 0 }), fx: 0.32, fy: 0.1 },
    ],
  }),
  // Gath: the citadel, black against a storm-red sky.
  gath: () => ({
    ambient: 'rgb(150,116,128)',
    sky: paintSky(211, [[0, '#08040a'], [0.3, '#1c0a14'], [0.5, '#3a0f1c'], [0.66, '#6a1620'], [0.8, '#a82a22'], [0.92, '#e06a30'], [1, '#ffb060']], { x: 240, y: 170, r: 16 }),
    layers: [
      { c: paintCity({ base: 140, maxH: 60, color: '#3a1a26', rim: '#8a3a3a', seed: 221, towers: 9, wall: 22, lit: '#ff8040' }), fx: 0.05, fy: 0.02 },
      { c: paintCity({ base: 164, maxH: 50, color: '#22101a', rim: '#5a2228', seed: 222, towers: 7, wall: 14, lit: '#ffb45a' }), fx: 0.14, fy: 0.05 },
      { c: paintCity({ base: 182, maxH: 30, color: '#10080e', rim: '#30141a', seed: 223, towers: 4, wall: 10, lit: '#ff8040' }), fx: 0.32, fy: 0.1 },
    ],
  }),
};

export function makeBackdrop(theme) { return (THEMES[theme] || THEMES.hills)(); }

export function drawBackdrop(ctx, bd, camX, camY, maxCamY) {
  ctx.drawImage(bd.sky, 0, 0);
  for (const L of bd.layers) {
    const w = L.c.width;
    const ox = -Math.floor((camX * L.fx) % w);
    const oy = Math.round((maxCamY - camY) * L.fy);
    ctx.drawImage(L.c, ox, oy);
    if (ox + w < W) ctx.drawImage(L.c, ox + w, oy);
  }
}
