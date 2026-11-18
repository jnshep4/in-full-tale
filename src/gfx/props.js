// Things drawn over the tile layer each frame: gate tiles, doorways, camp props, the power relic.
import { T, hash2 } from '../core.js';
import { REED, CRACK, THORN, HEDGE, BOUND, WATER, RING } from '../world/room.js';
import { drawText, textWidth } from '../font.js';
import { drawDecor } from './decor.js';

const px = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

// One gate tile at screen position (x, y). (cx, cy) are its cell coordinates, for stable variation.
export function drawGate(g, kind, x, y, cx, cy, t, room) {
  switch (kind) {
    case REED:
      px(g, '#3a2a20', x + 3, y, 10, T);
      for (let i = 0; i < 5; i++) { px(g, i % 2 ? '#c9a75a' : '#a8873f', x + 3 + i * 2, y, 2, T); px(g, '#6a5a2e', x + 4 + i * 2, y, 1, T); }
      px(g, '#6d4628', x + 2, y + 3, 12, 2); px(g, '#6d4628', x + 2, y + 11, 12, 2); px(g, '#a07a4e', x + 2, y + 3, 12, 1); px(g, '#a07a4e', x + 2, y + 11, 12, 1);
      break;
    case CRACK:
      px(g, '#4a3e59', x, y, T, T); px(g, '#5e506b', x, y, T, 2); px(g, '#2c2437', x, y + T - 2, T, 2); px(g, '#120d18', x, y, 1, T); px(g, '#120d18', x + T - 1, y, 1, T);
      for (let i = 0; i < 7; i++) { const a = hash2(cx, cy, i), b = hash2(cx, cy, i + 9); px(g, '#120d18', x + 2 + Math.floor(a * 12), y + 2 + i * 2, 1 + Math.floor(b * 3), 1); }
      px(g, '#8a7f96', x + 4 + Math.floor(hash2(cx, cy, 3) * 6), y + 3, 2, 1);
      break;
    case THORN:
      for (let i = 0; i < 9; i++) {
        const a = hash2(cx, cy, i), b = hash2(cx, cy, i + 20), bx = x + Math.floor(a * 13), by = y + Math.floor(b * 13);
        px(g, '#2e2a1c', bx, by, 4, 2); px(g, '#4a4426', bx + 1, by, 2, 1); px(g, '#c9b98a', bx + (i % 2 ? 4 : -1), by - 1, 1, 1);
        if (i % 4 === 0) px(g, '#b02a26', bx + 1, by + 2, 2, 2);
      }
      px(g, '#2e2a1c', x + 7, y, 2, T);
      break;
    case HEDGE: {
      // Crossed spears, points outward.
      const w = Math.round(Math.sin(t * 3 + cy) * 1);
      for (let i = 0; i < T; i++) { px(g, '#6a4a34', x + i, y + i, 2, 1); px(g, '#5a3a26', x + T - 1 - i, y + i, 2, 1); }
      px(g, '#ffd680', x + w, y, 3, 3); px(g, '#ffd680', x + T - 3 - w, y, 3, 3); px(g, '#c98b3f', x + 1, y + 3, 2, 1); px(g, '#c98b3f', x + T - 3, y + 3, 2, 1);
      if (room && room.shield) { g.globalAlpha = 0.35; px(g, '#ffd680', x, y, T, T); g.globalAlpha = 1; }
      break;
    }
    case BOUND:
      px(g, '#5a3a24', x + 2, y, 12, T); px(g, '#8c5a30', x + 3, y, 3, T); px(g, '#8c5a30', x + 8, y, 3, T); px(g, '#3a2418', x + 7, y, 1, T);
      px(g, '#c98b3f', x + 1, y + 2, 14, 3); px(g, '#ffd680', x + 1, y + 2, 14, 1); px(g, '#86522a', x + 1, y + 4, 14, 1);
      px(g, '#c98b3f', x + 1, y + 11, 14, 3); px(g, '#ffd680', x + 1, y + 11, 14, 1); px(g, '#86522a', x + 1, y + 13, 14, 1);
      px(g, '#ffd680', x + 4, y + 3, 1, 1); px(g, '#ffd680', x + 11, y + 12, 1, 1);
      break;
    case RING:
      px(g, '#3a2a20', x + 7, y, 2, 5);
      px(g, '#86522a', x + 4, y + 4, 8, 9); px(g, '#c98b3f', x + 5, y + 4, 6, 9); g.clearRect(x + 6, y + 6, 4, 5);
      px(g, '#ffd680', x + 5, y + 5, 1, 3); if (Math.sin(t * 4 + cx) > 0.7) px(g, '#ffffff', x + 5, y + 4, 2, 2);
      break;
  }
}
// Water is drawn after the bodies, as a tinted veil with a moving surface line.
export function drawWater(g, x, y, cx, cy, t, surface) {
  g.fillStyle = 'rgba(40, 92, 140, 0.5)'; g.fillRect(x, y + (surface ? 3 : 0), T, T - (surface ? 3 : 0));
  if (surface) for (let i = 0; i < T; i += 2) { const h = Math.round(Math.sin(t * 2.5 + (cx * T + i) * 0.35) * 1.2); g.fillStyle = 'rgba(170, 215, 255, 0.75)'; g.fillRect(x + i, y + 2 + h, 2, 1); }
  else if (hash2(cx, cy, Math.floor(t * 2)) > 0.93) { g.fillStyle = 'rgba(170, 215, 255, 0.35)'; g.fillRect(x + 5, y + 6, 4, 1); }
}

// Doorways. state: 'open' | 'locked' | 'sealed' (leads nowhere yet) | 'done' (region's captain has fallen)
export function drawDoor(g, l, x, y, state, t) {
  // (x, y): centre of the door's cell at ground level
  if (l.look === 'gateway') {
    px(g, '#120d18', x - 12, y - 35, 24, 35); px(g, '#3a3048', x - 12, y - 34, 5, 34); px(g, '#3a3048', x + 7, y - 34, 5, 34);
    px(g, '#5e506b', x - 12, y - 34, 2, 34); px(g, '#5e506b', x + 7, y - 34, 2, 34); px(g, '#4a3e59', x - 14, y - 38, 28, 5); px(g, '#8a7f96', x - 14, y - 38, 28, 1);
    px(g, state === 'open' || state === 'done' ? '#2a1838' : '#0e0a12', x - 7, y - 33, 14, 33);
    if (state === 'open' || state === 'done') { g.globalAlpha = 0.25 + 0.1 * Math.sin(t * 3 + l.n); px(g, state === 'done' ? '#9fc2ff' : '#ffb45a', x - 7, y - 33, 14, 33); g.globalAlpha = 1; }
    else { for (let i = 0; i < 3; i++) px(g, '#86522a', x - 5 + i * 4, y - 33, 2, 33); px(g, '#c98b3f', x - 7, y - 20, 14, 2); px(g, '#c98b3f', x - 7, y - 8, 14, 2); }
    const s = String(l.n);
    drawText(g, s, x - Math.floor(textWidth(s) / 2), y - 46, state === 'sealed' ? '#6f6a7c' : state === 'locked' ? '#c98b3f' : '#ffd680', 1);
    if (state === 'done') { px(g, '#ffd680', x - 3, y - 51, 7, 1); }
  } else if (l.look === 'saul') {
    // The king's tent: broad, crimson-trimmed, a lamp inside.
    for (let i = 0; i < 30; i++) { const half = 6 + i; px(g, i < 3 ? '#7a1f2a' : i % 6 === 0 ? '#3a2a30' : '#4a3640', x - half, y - 38 + i, half * 2, 1); }
    px(g, '#4a3640', x - 36, y - 8, 72, 8); px(g, '#7a1f2a', x - 36, y - 9, 72, 2); px(g, '#ffd680', x - 36, y - 10, 72, 1);
    px(g, '#1a1016', x - 6, y - 24, 12, 24); g.globalAlpha = 0.35 + 0.08 * Math.sin(t * 5); px(g, '#ffb45a', x - 6, y - 24, 12, 24); g.globalAlpha = 1;
    px(g, '#7a1f2a', x - 7, y - 25, 2, 25); px(g, '#7a1f2a', x + 5, y - 25, 2, 25);
    px(g, '#5a3a26', x - 1, y - 48, 2, 12); px(g, '#d8362e', x + 1, y - 48, 7, 4); px(g, '#ffd680', x + 1, y - 48, 7, 1);
  } else if (l.look === 'arena') {
    px(g, '#120d18', x - 13, y - 37, 26, 37); px(g, '#86522a', x - 13, y - 36, 5, 36); px(g, '#86522a', x + 8, y - 36, 5, 36); px(g, '#c98b3f', x - 13, y - 36, 2, 36); px(g, '#c98b3f', x + 8, y - 36, 2, 36);
    px(g, '#c98b3f', x - 15, y - 40, 30, 5); px(g, '#ffd680', x - 15, y - 40, 30, 1); px(g, '#1a1016', x - 8, y - 35, 16, 35);
    g.globalAlpha = 0.3 + 0.1 * Math.sin(t * 4); px(g, state === 'done' ? '#9fc2ff' : '#d8362e', x - 8, y - 35, 16, 35); g.globalAlpha = 1;
    for (let i = 0; i < 5; i++) px(g, i % 2 ? '#d8362e' : '#ff8650', x - 4 + i * 2, y - 47 + Math.abs(i - 2), 1, 7 - Math.abs(i - 2));
  } else {
    // 'path': a plain stone doorway
    px(g, '#120d18', x - 10, y - 29, 20, 29); px(g, '#3a3048', x - 10, y - 28, 4, 28); px(g, '#3a3048', x + 6, y - 28, 4, 28); px(g, '#5e506b', x - 10, y - 28, 1, 28); px(g, '#5e506b', x + 6, y - 28, 1, 28);
    px(g, '#4a3e59', x - 11, y - 31, 22, 4); px(g, '#8a7f96', x - 11, y - 31, 22, 1); px(g, '#1a1220', x - 6, y - 27, 12, 27);
    g.globalAlpha = 0.18 + 0.06 * Math.sin(t * 3); px(g, '#ffb45a', x - 6, y - 27, 12, 27); g.globalAlpha = 1;
  }
}

export function drawProp(g, p, x, y, t) {
  switch (p.type) {
    case 'tent': {
      const hgt = 20 + (p.v || 0) * 3, col = ['#3d3340', '#44363a', '#35303f'][p.v || 0];
      for (let i = 0; i < hgt; i++) { const half = 2 + Math.round(i * 1.05); px(g, i % 5 === 4 ? '#241c28' : col, x - half, y - hgt + i, half * 2, 1); px(g, '#5a4a52', x - half, y - hgt + i, 2, 1); }
      px(g, '#120d18', x - 3, y - 12, 6, 12); px(g, '#5a3a26', x - 1, y - hgt - 4, 2, 5);
      break;
    }
    case 'banner':
      px(g, '#5a3a26', x, y - 34, 2, 34); px(g, '#8c5a30', x, y - 34, 1, 34);
      for (let i = 0; i < 12; i++) { const w = Math.round(Math.sin(t * 3 + i * 0.5 + x) * 1.2); px(g, i < 2 ? '#ffd680' : '#2f5f8f', x + 2, y - 33 + i, 10 + w - (i > 9 ? (i - 9) * 3 : 0), 1); }
      px(g, '#f1e2c0', x + 5, y - 29, 3, 3);
      break;
    case 'fire':
      px(g, '#3a2a20', x - 6, y - 2, 12, 2); px(g, '#5a3f2a', x - 5, y - 3, 4, 1); px(g, '#5a3f2a', x + 1, y - 3, 4, 1);
      px(g, '#6f6a7c', x - 8, y - 1, 2, 1); px(g, '#6f6a7c', x + 6, y - 1, 2, 1);
      break;
    default: drawDecor(g, p.type, x, y, p.v || 0, t);
  }
}

// The relic a fallen captain leaves: a turning bronze token with the power's sign.
export function drawRelic(g, x, y, t, sword) {
  const bob = Math.round(Math.sin(t * 3) * 2);
  y += bob;
  if (sword) {
    for (let i = 0; i < 20; i++) px(g, i < 15 ? '#d9dbe6' : '#6d4628', x - 1, y - 14 + i, i < 15 ? 3 : 2, 1);
    px(g, '#ffffff', x - 1, y - 14, 1, 14); px(g, '#ffd680', x - 4, y + 1, 9, 2); px(g, '#0e0a12', x - 2, y - 15, 5, 1);
    return;
  }
  const w = Math.max(1, Math.round(Math.abs(Math.cos(t * 2.4)) * 5));
  px(g, '#0e0a12', x - w - 1, y - 6, w * 2 + 2, 12); px(g, '#c98b3f', x - w, y - 5, w * 2, 10); px(g, '#ffd680', x - w, y - 5, Math.max(1, w - 1), 10);
  px(g, '#fff3c8', x - 1, y - 2, 2, 4);
}
