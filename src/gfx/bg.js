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
