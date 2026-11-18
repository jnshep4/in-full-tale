// Scenery: small things that stand on the ground and give each region its own look. Nothing here
// collides or matters to play. `decorate` scatters them over a finished room by a fixed hash, so a
// room always looks the same; `drawDecor` paints one at its ground point.
import { hash2 } from '../core.js';

const px = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };

// What grows or stands in each theme, most common first.
const BY_THEME = {
  hills: ['reeds', 'bush', 'boulder', 'olive', 'reeds', 'cypress'],
  terraces: ['vine', 'vine', 'cypress', 'bush', 'jar', 'olive'],
  gorge: ['boulder', 'reeds', 'stal', 'boulder', 'bush'],
  thicket: ['bush', 'tree', 'bush', 'vine', 'tree', 'reeds'],
  battle: ['spears', 'wreck', 'boulder', 'pennon', 'spears'],
  ekron: ['olive', 'jar', 'press', 'olive', 'pennon', 'bush'],
  ashdod: ['column', 'brazier', 'jar', 'column', 'stump'],
  ashkelon: ['crate', 'post', 'jar', 'palm', 'crate', 'net'],
  gaza: ['palm', 'jar', 'awning', 'palm', 'boulder'],
  gath: ['pennon', 'brazier', 'column', 'spears', 'stump'],
};

// Adds scenery props to a room definition (in place). Keeps clear of doors, gates, soldiers' posts,
// and anything hollowed out of the rock.
export function decorate(def, theme, regionId) {
  const kinds = BY_THEME[theme]; if (!kinds) return def;
  const map = def.map, h = map.length, w = map[0].length, at = (x, y) => (y < 0 || y >= h || x < 0 || x >= w ? '#' : map[y][x]);
  const inBack = (x, y) => (def.backs || []).some(([x0, y0, x1, y1]) => x >= x0 - 1 && x <= x1 + 1 && y >= y0 - 1 && y <= y1 + 1);
  const nearLink = (x, y) => (def.links || []).some((l) => Math.abs(l.cx - x) < 4 && Math.abs(l.cy - y) < 4);
  const props = def.props ? [...def.props] : [];
  let last = -9;
  for (let x = 3; x < w - 3; x++) {
    for (let y = 2; y < h - 1; y++) {
      if (at(x, y + 1) !== '#' || at(x, y) !== '.') continue;
      if (at(x, y - 1) !== '.' || at(x, y - 2) !== '.' || at(x - 1, y) !== '.' || at(x + 1, y) !== '.' || at(x - 1, y + 1) !== '#' || at(x + 1, y + 1) !== '#') break;
      if (inBack(x, y) || nearLink(x, y) || x - last < 3) break;
      const r = hash2(x, y, regionId * 31 + def.id.length);
      if (r < 0.42) { const kind = kinds[Math.floor(hash2(x, y, 77 + regionId) * kinds.length)]; props.push({ type: kind, cx: x, cy: y, v: Math.floor(hash2(x, y, 5) * 4) }); last = x; }
      break;                                    // only the topmost open ground in each column
    }
  }
  def.props = props;
  return def;
}

// (x, y): the ground point at the middle of the prop's cell. v: 0-3, a fixed variation. t: seconds.
export function drawDecor(g, kind, x, y, v, t) {
  switch (kind) {
    case 'reeds':
      for (let i = -3; i <= 3; i++) { const hgt = 4 + ((i * 7 + v * 3) & 7), sway = Math.round(Math.sin(t * 1.6 + x * 0.1 + i) * (hgt > 7 ? 1 : 0)); px(g, i % 2 ? '#8a8a4a' : '#a8a05a', x + i * 2 + sway, y - hgt, 1, hgt); }
      break;
    case 'bush': {
      const wd = 9 + v * 2;
      for (let j = 0; j < 7; j++) { const half = Math.round(Math.sqrt(1 - (j / 7) ** 2) * wd / 2 + (j & 1)); px(g, j < 2 ? '#2a3a22' : '#34482a', x - half, y - 1 - j, half * 2, 1); }
      px(g, '#5a7a3a', x - 3, y - 6, 3, 1); px(g, '#5a7a3a', x + 1, y - 4, 2, 1); if (v > 1) px(g, '#d8483b', x - 1, y - 3, 1, 1);
      break;
    }
    case 'boulder': {
      const wd = 8 + v * 3, hgt = 5 + v;
      for (let j = 0; j < hgt; j++) { const half = Math.round(wd / 2 * Math.min(1, 0.55 + j / hgt)); px(g, j === 0 ? '#8a8494' : '#5c5668', x - half, y - hgt + j, half * 2, 1); px(g, '#3e3a4a', x - half, y - hgt + j, 2, 1); }
      px(g, '#a8a2b2', x - 1, y - hgt, 3, 1);
      break;
    }
    case 'olive': case 'tree': {
      const tall = kind === 'tree', th = (tall ? 18 : 11) + v * 2, leaf = tall ? ['#1e3a22', '#2c5230', '#4a7a3c'] : ['#3a4a3a', '#56684e', '#8a9a72'];
      px(g, '#3a2a20', x - 1, y - th, 3, th); px(g, '#5a4030', x - 1, y - th, 1, th); px(g, '#3a2a20', x + 1, y - th + 4, 3, 1); px(g, '#3a2a20', x - 4, y - th + 6, 3, 1);
      const rad = (tall ? 11 : 9) + v;
      for (let j = -rad; j <= rad * 0.6; j++) { const half = Math.round(Math.sqrt(rad * rad - j * j) * 1.25 + ((j + v) & 1)); px(g, leaf[j < -rad * 0.4 ? 1 : 0], x - half, y - th - 2 + j, half * 2, 1); }
      for (let k = 0; k < 9; k++) px(g, leaf[2], x - rad + ((k * 13 + v * 5) % (rad * 2)), y - th - rad + ((k * 7) % rad), 2, 1);
      break;
    }
    case 'cypress': {
      const hgt = 24 + v * 4;
      px(g, '#3a2a20', x, y - 4, 1, 4);
      for (let j = 0; j < hgt; j++) { const half = j < 3 ? 0 : j > hgt - 4 ? 2 : j < hgt * 0.4 ? 1 : 2 + (j > hgt * 0.6 ? 1 : 0); px(g, '#1c2c22', x - half, y - 4 - hgt + j, half * 2 + 1, 1); if (half && j % 3 === 0) px(g, '#345040', x - half + 1, y - 4 - hgt + j, 1, 1); }
      break;
    }
    case 'vine':
      px(g, '#6a4a34', x - 6, y - 15, 1, 15); px(g, '#6a4a34', x + 6, y - 15, 1, 15); px(g, '#8c6a48', x - 7, y - 15, 15, 1); px(g, '#8c6a48', x - 7, y - 9, 15, 1);
      for (let k = -6; k <= 6; k += 2) { px(g, k % 4 ? '#4a7a34' : '#3a6230', x + k, y - 17 + ((k + v) & 1), 2, 3); if ((k + v) % 3 === 0) px(g, '#7b3f8c', x + k, y - 13, 2, 3); px(g, '#3a6230', x + k, y - 10, 2, 1); }
      break;
    case 'jar': {
      const big = v > 1;
      px(g, '#8a5a34', x - (big ? 3 : 2), y - (big ? 9 : 7), big ? 7 : 5, big ? 9 : 7); px(g, '#b47a48', x - (big ? 2 : 1), y - (big ? 8 : 6), 2, big ? 6 : 4);
      px(g, '#6a4226', x - 1, y - (big ? 11 : 9), 3, 2); px(g, '#3a2418', x - (big ? 3 : 2), y - 1, big ? 7 : 5, 1); if (big) { px(g, '#6a4226', x - 4, y - 7, 1, 3); px(g, '#6a4226', x + 4, y - 7, 1, 3); }
      break;
    }
    case 'press':                                  // an olive press: a stone basin and its beam
      px(g, '#5c5668', x - 8, y - 6, 16, 6); px(g, '#8a8494', x - 8, y - 6, 16, 1); px(g, '#3e3a4a', x - 6, y - 5, 12, 2);
      px(g, '#6a4a34', x - 12, y - 14, 22, 2); px(g, '#8c6a48', x - 12, y - 14, 22, 1); px(g, '#6a4a34', x + 8, y - 14, 2, 14); px(g, '#5c5668', x - 13, y - 12, 4, 5);
      break;
    case 'column': {
      const hgt = v === 0 ? 14 : 30 + v * 3, broken = v === 0;
      px(g, '#4a4058', x - 5, y - 3, 10, 3); px(g, '#6a6078', x - 5, y - 3, 10, 1);
      px(g, '#5a506a', x - 3, y - hgt, 7, hgt - 3); px(g, '#7a7090', x - 3, y - hgt, 2, hgt - 3); px(g, '#3a3248', x + 2, y - hgt, 2, hgt - 3);
      if (broken) { px(g, '#5a506a', x - 3, y - hgt - 2, 3, 2); px(g, '#5a506a', x + 7, y - 4, 6, 4); }
      else { px(g, '#6a6078', x - 5, y - hgt - 3, 11, 3); px(g, '#8a80a0', x - 5, y - hgt - 3, 11, 1); }
      break;
    }
    case 'brazier': {
      px(g, '#3a2a20', x - 1, y - 9, 2, 9); px(g, '#3a2a20', x - 4, y - 1, 8, 1); px(g, '#86522a', x - 5, y - 12, 10, 3); px(g, '#c98b3f', x - 5, y - 12, 10, 1);
      for (let i = -3; i <= 3; i++) { const n = Math.sin(t * 12 + i * 1.9 + x) * 0.5 + Math.sin(t * 7 + i * 2.7) * 0.5, hgt = Math.max(0, Math.round(5 - Math.abs(i) * 1.2 + n * 2)); if (hgt) { px(g, '#ff9a2e', x + i, y - 12 - hgt, 1, hgt); if (hgt > 3) px(g, '#ffe9a0', x + i, y - 12 - hgt + 2, 1, hgt - 3); } }
      break;
    }
    case 'stump': px(g, '#4a4058', x - 4, y - 5, 8, 5); px(g, '#6a6078', x - 4, y - 5, 8, 1); px(g, '#3a3248', x - 4, y - 4, 2, 4); px(g, '#4a4058', x + 5, y - 2, 3, 2); break;
    case 'crate':
      px(g, '#6a4a34', x - 6, y - 10, 12, 10); px(g, '#8c6a48', x - 6, y - 10, 12, 1); px(g, '#4a3424', x - 6, y - 10, 1, 10); px(g, '#4a3424', x + 5, y - 10, 1, 10); px(g, '#4a3424', x - 6, y - 5, 12, 1);
      if (v > 1) { px(g, '#6a4a34', x + 4, y - 17, 9, 7); px(g, '#8c6a48', x + 4, y - 17, 9, 1); px(g, '#4a3424', x + 4, y - 14, 9, 1); }
      break;
    case 'post':
      px(g, '#4a3424', x - 2, y - 12, 4, 12); px(g, '#6a4a34', x - 2, y - 12, 1, 12); px(g, '#8c6a48', x - 3, y - 13, 6, 2);
      for (let i = 0; i < 9; i++) px(g, '#c8b890', x + 2 + i, y - 9 + Math.round(Math.sin(i / 8 * Math.PI) * 5), 1, 1);
      break;
    case 'net':
      px(g, '#4a3424', x - 8, y - 14, 1, 14); px(g, '#4a3424', x + 8, y - 14, 1, 14);
      for (let i = -7; i <= 7; i++) for (let j = 0; j < 10; j++) if ((i + j) % 3 === 0) px(g, '#9a8a6a', x + i, y - 13 + j + Math.round(Math.sin((i + 8) / 16 * Math.PI) * 2), 1, 1);
      break;
    case 'palm': {
      const hgt = 28 + v * 4;
      for (let j = 0; j < hgt; j++) px(g, j % 4 === 0 ? '#3a2a1a' : '#5a4028', x + Math.round(Math.sin(j / hgt * 1.6) * 3), y - j - 1, 2, 1);
      const tx = x + 3, ty = y - hgt;
      for (let k = -9; k <= 9; k++) { const sw = Math.round(Math.sin(t * 1.3 + x * 0.05) * (Math.abs(k) > 6 ? 1 : 0)); px(g, '#2a4a2a', tx + k, ty + Math.round(Math.abs(k) * 0.6) + sw, 2, 1); px(g, '#3a6a34', tx + Math.round(k * 0.7), ty - 3 + Math.round(Math.abs(k) * 0.9), 1, 2); }
      px(g, '#8a5a34', tx - 1, ty + 1, 2, 2);
      break;
    }
    case 'awning':
      px(g, '#4a3424', x - 9, y - 16, 1, 16); px(g, '#4a3424', x + 9, y - 16, 1, 16);
      for (let i = -10; i <= 10; i++) px(g, Math.floor((i + 10) / 3) % 2 ? '#b04a20' : '#e8d8b0', x + i, y - 17 + Math.round(Math.abs(i) * 0.15), 1, 3);
      px(g, '#8a5a34', x - 5, y - 5, 4, 5); px(g, '#8a5a34', x + 2, y - 4, 3, 4);
      break;
    case 'spears':
      for (const [dx, lean] of [[-4, -2], [1, 1], [5, 3]]) { for (let j = 0; j < 20 - Math.abs(dx); j++) px(g, '#6a4a34', x + dx + Math.round(lean * j / 20), y - j, 1, 1); px(g, '#d9dbe6', x + dx + lean, y - 22 + Math.abs(dx), 1, 3); }
      px(g, '#86522a', x - 2, y - 6, 7, 6); px(g, '#c98b3f', x - 1, y - 5, 5, 4); px(g, '#ffd680', x + 1, y - 4, 1, 2);
      break;
    case 'wreck':
      px(g, '#4a3424', x - 10, y - 6, 16, 3); px(g, '#6a4a34', x - 10, y - 6, 16, 1); px(g, '#4a3424', x + 4, y - 12, 2, 8);
      for (let a = 0; a < 12; a++) px(g, '#5a4028', x - 5 + Math.round(Math.cos(a / 12 * 6.28) * 5), y - 6 + Math.round(Math.sin(a / 12 * 6.28) * 5), 2, 2);
      px(g, '#3a2418', x - 5, y - 6, 1, 1);
      break;
    case 'pennon': {
      px(g, '#3a2a20', x, y - 30, 2, 30); px(g, '#5a4030', x, y - 30, 1, 30); px(g, '#ffd680', x - 1, y - 32, 4, 2);
      for (let i = 0; i < 10; i++) { const wv = Math.round(Math.sin(t * 3.4 + i * 0.6 + x) * 1.3); px(g, i < 2 ? '#ffd680' : '#7a1f2a', x + 2, y - 29 + i, 9 + wv - (i > 6 ? (i - 6) * 3 : 0), 1); }
      px(g, '#d8362e', x + 4, y - 26, 3, 3);
      break;
    }
    case 'stal':
      for (let j = 0; j < 10 + v * 2; j++) { const half = Math.round((10 + v * 2 - j) / 4); px(g, '#2e405c', x - half, y - 1 - j, half * 2 + 1, 1); px(g, '#3e5270', x - half, y - 1 - j, 1, 1); }
      break;
  }
}
