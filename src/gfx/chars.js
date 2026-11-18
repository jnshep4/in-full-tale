// Procedural pixel-art characters. Each figure is posed and drawn live from a small rig into a
// 64x64 scratch canvas (origin at the feet), then stamped into the world with a dark outline so
// silhouettes stay readable against the painted backdrop.
const SZ = 96, OX = 48, OY = 78;
const OUTLINE = '#0e0a12';
let SC, sc, SIL, sil;

function ensure() {
  if (SC) return;
  SC = document.createElement('canvas'); SC.width = SC.height = SZ; sc = SC.getContext('2d');
  SIL = document.createElement('canvas'); SIL.width = SIL.height = SZ; sil = SIL.getContext('2d');
}
function begin(face) {
  ensure();
  sc.setTransform(1, 0, 0, 1, 0, 0); sc.clearRect(0, 0, SZ, SZ);
  sc.setTransform(face < 0 ? -1 : 1, 0, 0, 1, OX, OY);
}
function R(x, y, w, h, col) { sc.fillStyle = col; sc.fillRect(Math.round(x), Math.round(y), w, h); }
function Ln(x0, y0, x1, y1, col, th = 1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  sc.fillStyle = col;
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (let n = 0; n < 200; n++) {
    sc.fillRect(x0, y0, th, th);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
function silhouette(col) {
  sil.globalCompositeOperation = 'source-over'; sil.clearRect(0, 0, SZ, SZ); sil.drawImage(SC, 0, 0);
  sil.globalCompositeOperation = 'source-in'; sil.fillStyle = col; sil.fillRect(0, 0, SZ, SZ);
}
// Stamp the scratch canvas at feet position (x, y). flash = solid white hit frame.
function stamp(ctx, x, y, flash) {
  const dx = Math.round(x) - OX, dy = Math.round(y) - OY;
  if (flash) { silhouette('#ffffff'); ctx.drawImage(SIL, dx, dy); return; }
  silhouette(OUTLINE);
  ctx.drawImage(SIL, dx - 1, dy); ctx.drawImage(SIL, dx + 1, dy); ctx.drawImage(SIL, dx, dy - 1); ctx.drawImage(SIL, dx, dy + 1);
  ctx.drawImage(SC, dx, dy);
}
// Stamp as a pale silhouette squashed toward the feet: a body dissolving into light (additive pass).
function stampLight(ctx, x, y, squash, alpha) {
  silhouette('#ffe9b8');
  const dx = Math.round(x) - OX, hgt = Math.max(1, Math.round(SZ * squash));
  ctx.globalAlpha = alpha;
  ctx.drawImage(SIL, 0, 0, SZ, SZ, dx, Math.round(y) - Math.round(OY * squash), SZ, hgt);
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- David
const D = {
  skin: '#e6a877', skinD: '#b9764f', hair: '#a5432a', hairH: '#d96a3c', tunic: '#efe3c6', tunicD: '#b9a685',
  belt: '#6d4628', blue: '#3f74d6', blueD: '#2a4f9c', sandal: '#5a3a26', cord: '#9a6c3e', stone: '#e4e4ee', eye: '#2a1818',
};

// p: { face, onGround, moving, run, vy, landT, t, charging, charge, slingA, aim, throwT, vx }
export function drawDavid(ctx, x, y, p, flash) {
  begin(p.face);
  const moving = p.moving && p.onGround;
  const s = Math.sin(p.run), c = Math.cos(p.run);
  const by = (p.landT > 0 ? 2 : 0) + (moving ? (Math.abs(c) > 0.55 ? 1 : 0) : (Math.sin(p.t * 2.6) > 0.5 ? 1 : 0));
  // Feet: [x, lift]
  let a, b;
  if (!p.onGround) { a = p.vy < -40 ? [3, 5] : p.vy > 60 ? [1, 1] : [2, 3]; b = p.vy < -40 ? [-2, 1] : p.vy > 60 ? [-3, 4] : [-2, 2]; }
  else if (moving) { a = [Math.round(s * 4), Math.round(Math.max(0, c) * 3)]; b = [Math.round(-s * 4), Math.round(Math.max(0, -c) * 3)]; }
  else { a = [1, 0]; b = [-2, 0]; }
  const hip = -9 + by, ty = -18 + by, hy = ty - 6;
  // Back arm
  const swing = moving ? s * 3 : 0;
  Ln(-2, ty + 1, -3 + swing, ty + 6, D.skinD, 2);
  // Legs and sandals
  Ln(-1, hip, b[0], -2 - b[1], D.skinD, 2); R(b[0], -1 - b[1], 3, 1, D.sandal);
  Ln(0, hip, a[0], -2 - a[1], D.skin, 2); R(a[0], -1 - a[1], 3, 1, D.sandal);
  // Shepherd's scrip on the hip
  R(-6, ty + 5, 3, 4, D.belt); R(-6, ty + 5, 3, 1, D.cord);
  // Tunic
  R(-3, ty, 6, 7, D.tunic); R(-4, ty + 6, 8, 4, D.tunic);
  R(-3, ty, 2, 7, D.tunicD); R(-4, ty + 6, 2, 4, D.tunicD); R(-4, ty + 9, 8, 1, D.tunicD);
  Ln(-3, ty, 2, ty + 4, D.belt);                          // scrip strap
  R(-3, ty + 5, 6, 1, D.belt);
  R(1, ty + 6, 2, 3, D.blue); R(1, ty + 8, 2, 1, D.blueD);  // sash end
  // Head: ruddy hair, blue headband with a trailing tail
  R(-3, hy, 6, 6, D.skin); R(-3, hy + 5, 5, 1, D.skinD);
  R(-3, hy, 6, 2, D.hair); R(-3, hy, 2, 5, D.hair); R(-2, hy - 1, 4, 1, D.hair); R(0, hy - 1, 2, 1, D.hairH); R(1, hy, 1, 1, D.hairH);
  R(1, hy + 3, 1, 1, D.eye);
  R(-3, hy + 2, 6, 1, D.blue);
  const drift = Math.min(3, Math.abs(p.vx) / 45), flap = Math.sin(p.t * 9) > 0 ? 1 : 0;
  R(-4, hy + 2, 1, 1, D.blue); R(-5, hy + 2 + (drift > 1 ? 0 : 1), 1, 1, D.blue);
  R(-6, hy + 3 - (drift > 2 ? 1 : 0) + flap, 1, 1, D.blueD); if (drift > 1) R(-7, hy + 2 + flap, 1, 1, D.blueD);
  // Front arm and sling
  const shx = 1, shy = ty + 1;
  if (p.charging) {
    const hx = 3, hyd = hy - 3;                             // hand raised overhead, sling whirling
    Ln(shx, shy, hx, hyd, D.skin, 2);
    for (let k = 2; k >= 0; k--) {
      const ang = p.slingA - k * 0.55, ex = hx + Math.cos(ang) * 8, ey = hyd + Math.sin(ang) * 4;
      if (k === 0) { Ln(hx, hyd, ex, ey, D.cord); R(ex - 1, ey - 1, 2, 2, p.charge >= 1 ? '#ffffff' : D.stone); }
      else R(ex, ey, 1, 1, k === 1 ? '#c9c9d6' : '#77778a');
    }
  } else if (p.throwT > 0) {
    const ex = shx + Math.cos(p.aim) * 6, ey = shy - Math.sin(p.aim) * 6;   // follow-through along the aim
    Ln(shx, shy, ex, ey, D.skin, 2);
    Ln(ex, ey, ex + Math.cos(p.aim) * 5, ey - Math.sin(p.aim) * 5, D.cord);
  } else {
    const hx = 2 - swing, hyd = ty + 6;
    Ln(shx, shy, hx, hyd, D.skin, 2);
    Ln(hx + 1, hyd + 1, hx + 1 - (moving ? Math.round(s) : 0), hyd + 5, D.cord); R(hx - (moving ? Math.round(s) : 0), hyd + 5, 2, 2, D.stone);
  }
  stamp(ctx, x, y, flash);
}

// ---------------------------------------------------------------- Philistine soldier
const S = {
  skin: '#c98c60', skinD: '#9a6444', bronze: '#c98b3f', bronzeD: '#86522a', bronzeH: '#ffd680', kilt: '#ddd3c2', kiltD: '#a79c8e',
  band: '#2f5f8f', boot: '#3a2a22', shaft: '#6a4a34', eye: '#2a1818',
  plume: { marked: ['#d8362e', '#ff8650'], plain: ['#cdbf9d', '#fff3d4'] },
};

function poseSoldier(p) {
  begin(p.face);
  const moving = p.moving, s = Math.sin(p.walk), c = Math.cos(p.walk);
  const st = p.state;
  const lean = st === 'windup' ? -2 : st === 'thrust' ? 3 : st === 'stagger' ? -2 : st === 'recover' ? 1 : 0;
  const by = moving ? (Math.abs(c) > 0.6 ? 1 : 0) : 0;
  const a = moving ? [Math.round(s * 3), Math.round(Math.max(0, c) * 2)] : st === 'thrust' ? [4, 0] : [2, 0];
  const b = moving ? [Math.round(-s * 3), Math.round(Math.max(0, -c) * 2)] : st === 'thrust' ? [-4, 0] : [-2, 0];
  const hip = -10 + by;
  // Spear (behind the body in patrol, in front otherwise)
  const spear = () => {
    let x0, y0, x1, y1;
    if (st === 'patrol') { x0 = -4; y0 = -3; x1 = -2; y1 = -35; }
    else if (st === 'windup') { x0 = -15; y0 = -14 + by; x1 = 4; y1 = -17 + by; }
    else if (st === 'thrust') { x0 = -1; y0 = -16; x1 = 22; y1 = -16; }
    else if (st === 'recover') { x0 = -4; y0 = -15; x1 = 15; y1 = -12; }
    else if (st === 'stagger') { x0 = -6; y0 = -5; x1 = -9; y1 = -34; }
    else { x0 = -7; y0 = -12 + by; x1 = 13; y1 = -18 + by; }
    Ln(x0, y0, x1, y1, S.shaft);
    const tx = x0 + (x1 - x0) * 0.84, tyy = y0 + (y1 - y0) * 0.84;
    Ln(tx, tyy, x1, y1, st === 'windup' && Math.sin(p.t * 40) > 0 ? '#ffffff' : S.bronzeH, 1);
    Ln(tx, tyy + 1, x1 - (x1 > x0 ? 1 : 0), y1 + 1, S.bronze, 1);
  };
  if (st === 'patrol' || st === 'stagger') spear();
  // Legs with greaves
  Ln(-1, hip, b[0], -2 - b[1], S.skinD, 2); R(b[0], -4 - b[1], 2, 3, S.bronzeD); R(b[0], -1 - b[1], 3, 1, S.boot);
  Ln(1, hip, a[0], -2 - a[1], S.skin, 2); R(a[0], -4 - a[1], 2, 3, S.bronze); R(a[0], -1 - a[1], 3, 1, S.boot);
  // Kilt with a pointed, tasselled front
  const ky = -14 + by;
  R(-4, ky, 8, 4, S.kilt); R(-3, ky + 4, 6, 1, S.kilt); R(-1, ky + 5, 3, 1, S.kilt); R(0, ky + 6, 1, 1, S.band);
  R(-4, ky, 2, 4, S.kiltD); R(-4, ky + 2, 8, 1, S.band);
  // Banded bronze corselet
  const tx = -4 + lean, ty = -22 + by;
  R(tx, ty, 8, 8, S.bronze);
  for (let r = 1; r < 8; r += 2) R(tx, ty + r, 8, 1, S.bronzeD);
  R(tx, ty, 2, 8, S.bronzeD);
  for (let r = 0; r < 8; r += 2) R(tx + 6, ty + r, 1, 1, S.bronzeH);
  // Head, helmet band, feathered crest
  const hx = -3 + lean, hy = ty - 5;
  R(hx, hy, 6, 5, S.skin); R(hx, hy, 2, 5, S.skinD); R(hx + 4, hy + 2, 1, 1, S.eye); R(hx + 2, hy + 4, 3, 1, S.skinD);
  R(hx - 1, hy - 1, 8, 2, S.bronze); R(hx + 4, hy - 1, 2, 1, S.bronzeH); R(hx - 1, hy + 1, 1, 3, S.bronzeD);
  const pl = S.plume[p.marked ? 'marked' : 'plain'], hts = [3, 5, 6, 6, 6, 5, 4];
  for (let i = 0; i < 7; i++) {
    const fx = hx - 1 + i + (i === 0 ? -1 : i === 6 ? 1 : 0), sway = (moving && i > 2 ? Math.round(-s * 0.6) : 0);
    R(fx, hy - 1 - hts[i], 1, hts[i], i % 2 ? pl[0] : (p.marked ? '#b02a26' : '#b3a583'));
    R(fx + sway, hy - 1 - hts[i], 1, 2, pl[1]);
  }
  if (st !== 'patrol' && st !== 'stagger') spear();
  // Round shield on the leading arm
  const sx = (st === 'windup' ? 1 : st === 'thrust' ? -1 : 3) + lean, sy = ty + 1;
  R(sx + 1, sy, 5, 8, S.bronze); R(sx, sy + 1, 7, 6, S.bronze);
  R(sx + 1, sy, 5, 1, S.bronzeD); R(sx, sy + 1, 1, 6, S.bronzeD); R(sx + 1, sy + 7, 5, 1, S.bronzeD); R(sx + 6, sy + 1, 1, 6, S.bronzeD);
  R(sx + 3, sy + 3, 2, 2, S.bronzeH); R(sx + 2, sy + 2, 1, 1, S.bronzeH);
}

// p: { face, moving, walk, state, t, marked }
export function drawSoldier(ctx, x, y, p, flash) { poseSoldier(p); stamp(ctx, x, y, flash); }
export function drawSoldierLight(ctx, x, y, p, squash, alpha) { poseSoldier(p); stampLight(ctx, x, y, squash, alpha); }

// ---------------------------------------------------------------- Philistine captain
// A taller, heavier figure than the rank and file: cape, broad corselet, a great feathered crest.
// p: { face, look, state, attack: { id }, t, walk, moving, onGround, weakT }
function weaponLine(st, atk, kind, by) {
  const long = kind === 'spear';
  if (st === 'stagger') return [-7, -8, -12, long ? -44 : -30];
  if (st === 'recover') return long ? [0, -22 + by, 22, -5] : [4, -16 + by, 16, -4];
  if (st === 'intro') return long ? [8, -6, 8, -52] : [7, -24, 9, -46];
  if (st === 'tele') {
    if (atk === 'thrust' || atk === 'charge') return long ? [-20, -24 + by, 8, -27 + by] : [-12, -22 + by, 2, -26 + by];
    if (atk === 'volley' || atk === 'rain' || atk === 'summon') return long ? [-12, -46, 12, -38] : [2, -30, 4, -50];
    if (atk === 'leap') return long ? [-6, -12, 14, -30] : [2, -16, 14, -22];
    return long ? [-10, -40, 4, -48] : [-6, -34, -14, -48];            // sweep: drawn back overhead
  }
  if (st === 'act') {
    if (atk === 'thrust' || atk === 'charge') return long ? [-2, -24, 32, -24] : [4, -24, 24, -24];
    if (atk === 'leap') return long ? [2, -40, 12, -8] : [4, -34, 10, -14];
    if (atk === 'sweep') return long ? [4, -22, 30, -10] : [6, -22, 24, -12];
    return long ? [6, -24, 16, -44] : [6, -24, 12, -40];
  }
  return long ? [-9, -16 + by, 15, -26 + by] : [6, -18 + by, 13, -34 + by];
}
function poseCaptain(p) {
  begin(p.face);
  const L = p.look, st = p.state, atk = p.attack ? p.attack.id : '', moving = p.moving;
  const s = Math.sin(p.walk), c = Math.cos(p.walk), air = !p.onGround;
  const crouch = (st === 'tele' && atk === 'leap') ? 4 : st === 'recover' ? 3 : st === 'stagger' ? 2 : 0;
  const lunge = st === 'act' && (atk === 'thrust' || atk === 'charge' || atk === 'sweep');
  const lean = st === 'tele' && (atk === 'thrust' || atk === 'charge') ? -3 : lunge ? 4 : st === 'stagger' ? -3 : st === 'recover' ? 2 : 0;
  const by = crouch + (moving && Math.abs(c) > 0.6 ? 1 : 0);
  let a = [3, 0], b = [-3, 0];
  if (air) { a = [5, 5]; b = [-3, 2]; }
  else if (moving) { a = [Math.round(s * 4), Math.round(Math.max(0, c) * 2)]; b = [Math.round(-s * 4), Math.round(Math.max(0, -c) * 2)]; }
  else if (lunge) { a = [7, 0]; b = [-6, 0]; }
  const hip = -14 + by, ty = -30 + by, tx = -5 + lean;
  const wl = weaponLine(st, atk, L.weapon, by);
  const weapon = () => {
    const [x0, y0, x1, y1] = wl, hot = st === 'tele' && Math.sin(p.t * 40) > 0;
    if (L.weapon === 'spear') {
      Ln(x0, y0, x1, y1, S.shaft, 2);
      const mx = x0 + (x1 - x0) * 0.8, my = y0 + (y1 - y0) * 0.8;
      Ln(mx, my, x1, y1, hot ? '#ffffff' : L.bronzeH, 2); Ln(mx, my + 1, x1, y1 + 1, L.bronze, 1);
    } else if (L.weapon === 'axe' || L.weapon === 'mace') {
      Ln(x0, y0, x1, y1, S.shaft, 2);
      R(x1 - 3, y1 - 3, 7, 6, hot ? '#ffffff' : L.bronze); R(x1 - 3, y1 - 3, 7, 1, L.bronzeH); R(x1 - 3, y1 + 2, 7, 1, L.bronzeD);
      if (L.weapon === 'axe') R(x1 + 3, y1 - 5, 2, 10, L.bronzeH);
    } else {                                                             // sword
      Ln(x0, y0, x1, y1, hot ? '#ffffff' : '#d9dbe6', 2); Ln(x0, y0 + 1, x1, y1 + 1, '#8c90a6', 1);
      R(x0 - 2, y0 - 1, 5, 2, L.bronzeH);
    }
  };
  // Cape
  const flap = Math.sin(p.t * 6) > 0 ? 1 : 0;
  for (let i = 0; i < 18; i++) R(tx - 3 - (i > 9 ? 1 + flap : 0) - (moving || lunge ? Math.floor(i / 6) : 0), ty + 1 + i, 5, 1, i % 6 === 5 ? '#000000' : L.cape);
  if (st === 'stagger' || st === 'idle' || st === 'intro') weapon();
  // Legs with greaves
  Ln(-2, hip, b[0], -3 - b[1], S.skinD, 3); R(b[0] - 1, -7 - b[1], 4, 6, L.bronzeD); R(b[0] - 1, -1 - b[1], 5, 1, S.boot);
  Ln(2, hip, a[0], -3 - a[1], S.skin, 3); R(a[0] - 1, -7 - a[1], 4, 6, L.bronze); R(a[0], -7 - a[1], 1, 6, L.bronzeH); R(a[0] - 1, -1 - a[1], 5, 1, S.boot);
  // Kilt
  R(-6, hip - 5, 12, 6, L.kilt); R(-5, hip + 1, 10, 1, L.kilt); R(-2, hip + 2, 5, 1, L.kilt); R(0, hip + 3, 1, 2, L.band);
  R(-6, hip - 5, 3, 6, L.kiltD); R(-6, hip - 2, 12, 1, L.band);
  // Corselet
  R(tx, ty, 11, 12, L.bronze);
  for (let r = 2; r < 12; r += 3) R(tx, ty + r, 11, 1, L.bronzeD);
  R(tx, ty, 3, 12, L.bronzeD);
  for (let r = 0; r < 12; r += 3) R(tx + 8, ty + r, 2, 1, L.bronzeH);
  R(tx - 1, ty - 1, 4, 3, L.bronzeH); R(tx + 8, ty - 1, 4, 3, L.bronzeH); R(tx - 1, ty + 1, 4, 1, L.bronzeD); R(tx + 8, ty + 1, 4, 1, L.bronzeD);
  // Head, beard, helmet, crest
  const hx = tx + 2, hy = ty - 8;
  R(hx, hy, 7, 7, S.skin); R(hx, hy, 2, 7, S.skinD); R(hx + 5, hy + 3, 1, 1, S.eye); R(hx + 3, hy + 2, 3, 1, S.skinD);
  R(hx + 2, hy + 5, 5, 3, L.beard); R(hx + 6, hy + 4, 1, 2, L.beard);
  R(hx - 1, hy - 1, 9, 2, L.bronze); R(hx + 5, hy - 1, 2, 1, L.bronzeH); R(hx - 1, hy + 1, 2, 4, L.bronzeD);
  const hts = [4, 6, 8, 9, 10, 10, 9, 8, 6, 5];
  for (let i = 0; i < 10; i++) {
    const fx = hx - 2 + i + (i === 9 ? 1 : 0), sway = (moving || lunge) && i < 4 ? -1 : 0;
    R(fx + sway, hy - 1 - hts[i], 1, hts[i], i % 2 ? L.plume[0] : '#000000');
    R(fx + sway, hy - 1 - hts[i], 1, hts[i] - 1, i % 2 ? L.plume[0] : L.plume[1]);
    R(fx + sway, hy - 1 - hts[i], 1, 2, L.plume[1]);
  }
  if (!(st === 'stagger' || st === 'idle' || st === 'intro')) weapon();
  if (L.shield) {
    const sx = (st === 'tele' ? 0 : lunge ? -3 : 3) + lean, sy = ty + 1 + (st === 'recover' ? 4 : 0);
    R(sx + 1, sy, 8, 12, L.bronze); R(sx, sy + 1, 10, 10, L.bronze);
    R(sx + 1, sy, 8, 1, L.bronzeD); R(sx, sy + 1, 1, 10, L.bronzeD); R(sx + 1, sy + 11, 8, 1, L.bronzeD); R(sx + 9, sy + 1, 1, 10, L.bronzeD);
    R(sx + 4, sy + 4, 3, 3, L.bronzeH); R(sx + 2, sy + 2, 2, 1, L.bronzeH); R(sx + 4, sy + 1, 2, 10, L.plume[0]); R(sx + 4, sy + 4, 3, 3, L.bronzeH);
  }
}
export function drawCaptain(ctx, x, y, p, flash) { poseCaptain(p); stamp(ctx, x, y, flash); }
export function drawCaptainLight(ctx, x, y, p, squash, alpha) { poseCaptain(p); stampLight(ctx, x, y, squash, alpha); }

// ---------------------------------------------------------------- Israelite soldier (camp)
const I = { skin: '#d9a073', skinD: '#a86f4a', tunic: '#8fa3b8', tunicD: '#5d6f86', cap: '#6d4628', belt: '#3a2a22', shaft: '#6a4a34', tip: '#cfd3de' };
export function drawIsraelite(ctx, x, y, face, t, seed = 0) {
  begin(face);
  const by = Math.sin(t * 2 + seed) > 0.6 ? 1 : 0;
  Ln(-3, -3, -2, -30, I.shaft); R(-3, -33, 3, 4, I.tip);
  Ln(-1, -9, -2, -2, I.skinD, 2); R(-2, -1, 3, 1, I.belt); Ln(1, -9, 2, -2, I.skin, 2); R(2, -1, 3, 1, I.belt);
  R(-4, -19 + by, 8, 11, I.tunic); R(-4, -19 + by, 2, 11, I.tunicD); R(-4, -13 + by, 8, 1, I.belt); R(-4, -9 + by, 8, 1, I.tunicD);
  R(-3, -25 + by, 6, 6, I.skin); R(-3, -25 + by, 2, 6, I.skinD); R(1, -22 + by, 1, 1, S.eye); R(0, -20 + by, 3, 1, I.skinD);
  R(-4, -27 + by, 8, 3, I.cap); R(-4, -25 + by, 1, 3, I.cap);
  R(2, -17 + by, 5, 7, '#7a5a3a'); R(2, -17 + by, 5, 1, '#a07a4e'); R(4, -14 + by, 1, 1, '#d9b85e');
  stamp(ctx, x, y, false);
}

// ---------------------------------------------------------------- trophy: a pale curled ring
const RING = [
  '..oooo.l',
  '.ollllol',
  'olmoomlo',
  'olo..omo',
  'omo..odo',
  'ommoomdo',
  '.omdddo.',
  '..oooo..',
];
const RING_COL = { o: '#6b5a43', l: '#fffaea', m: '#f1e2c0', d: '#c8ad82' };
let ringSprites = null;
function buildRings() {
  ringSprites = [];
  for (let rot = 0; rot < 4; rot++) {
    for (const white of [false, true]) {
      const c = document.createElement('canvas'); c.width = c.height = 8;
      const g = c.getContext('2d');
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
        const ch = RING[y][x]; if (ch === '.') continue;
        let px = x, py = y;
        for (let k = 0; k < rot; k++) { const t = px; px = 7 - py; py = t; }
        g.fillStyle = white && ch !== 'o' ? '#ffffff' : RING_COL[ch]; g.fillRect(px, py, 1, 1);
      }
      ringSprites.push(c);
    }
  }
}
// rot 0..3 quarter turns; bright = blink frame
export function drawRing(ctx, x, y, rot = 0, bright = false) {
  if (!ringSprites) buildRings();
  ctx.drawImage(ringSprites[(rot & 3) * 2 + (bright ? 1 : 0)], Math.round(x) - 4, Math.round(y) - 4);
}

// ---------------------------------------------------------------- props
export function drawTorchPost(ctx, x, y) {
  ctx.fillStyle = '#3a2a20'; ctx.fillRect(x - 1, y - 14, 2, 14);
  ctx.fillStyle = '#5a3f2a'; ctx.fillRect(x - 1, y - 14, 1, 14);
  ctx.fillStyle = '#86522a'; ctx.fillRect(x - 3, y - 16, 6, 2);
  ctx.fillStyle = '#c98b3f'; ctx.fillRect(x - 3, y - 16, 6, 1);
}
// Flame drawn in the additive pass, so it glows through the dusk.
export function drawFlame(ctx, x, y, t, seed) {
  for (let i = -2; i <= 2; i++) {
    const n = Math.sin(t * 13 + i * 1.7 + seed) * 0.5 + Math.sin(t * 7.3 + i * 2.9 + seed * 2) * 0.5;
    const hgt = Math.round((5 - Math.abs(i) * 1.6) + n * 2.2);
    if (hgt <= 0) continue;
    ctx.fillStyle = '#c8421c'; ctx.fillRect(x + i, y - 16 - hgt, 1, hgt);
    if (hgt > 2) { ctx.fillStyle = '#ff9a2e'; ctx.fillRect(x + i, y - 16 - hgt + 2, 1, hgt - 2); }
    if (hgt > 4 && Math.abs(i) < 2) { ctx.fillStyle = '#ffe9a0'; ctx.fillRect(x + i, y - 16 - hgt + 4, 1, hgt - 4); }
  }
}
export function drawFig(ctx, x, y) {
  ctx.fillStyle = '#0e0a12'; ctx.fillRect(x - 3, y - 6, 6, 7);
  ctx.fillStyle = '#7b3f8c'; ctx.fillRect(x - 2, y - 5, 4, 5);
  ctx.fillStyle = '#b06ac0'; ctx.fillRect(x - 1, y - 4, 1, 2);
  ctx.fillStyle = '#7fae4a'; ctx.fillRect(x, y - 7, 1, 2);
}
// HUD health pip: a small bronze-rimmed gem.
export function drawPip(ctx, x, y, full) {
  ctx.fillStyle = '#0e0a12'; ctx.fillRect(x + 1, y, 5, 7); ctx.fillRect(x, y + 1, 7, 5);
  ctx.fillStyle = '#86522a'; ctx.fillRect(x + 1, y + 1, 5, 5);
  ctx.fillStyle = full ? '#d8362e' : '#2a1c24'; ctx.fillRect(x + 2, y + 2, 3, 3);
  if (full) { ctx.fillStyle = '#ff9a7a'; ctx.fillRect(x + 2, y + 2, 1, 1); }
  ctx.fillStyle = '#ffd680'; ctx.fillRect(x + 1, y + 1, 2, 1);
}
