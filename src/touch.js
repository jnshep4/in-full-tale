// Touch controls for phones and tablets: a floating stick on the left half of the screen, action
// buttons on the right. They feed the same named actions as the keyboard (Input.touch), so nothing
// else in the game knows the difference. Shown only on touch devices, or with ?touch=1.
const BUTTONS = [
  { act: 'jump', label: 'JUMP', cls: 'big', pos: 'right: 3vmin; bottom: 5vmin;' },
  { act: 'fire', label: 'SLING', cls: 'big', pos: 'right: 25vmin; bottom: 5vmin;' },
  { act: 'dash', label: 'DASH', power: 'dash', pos: 'right: 3vmin; bottom: 28vmin;' },
  { act: 'melee', label: 'SWORD', power: 'sword', pos: 'right: 20vmin; bottom: 28vmin;' },
  { act: 'cord', label: 'CORD', power: 'grapple', pos: 'right: 37vmin; bottom: 28vmin;' },
  { act: 'item', label: 'USE', power: 'item', tap: true, pos: 'right: 48vmin; bottom: 5vmin;' },
  { act: 'swap', label: 'NEXT', power: 'swap', tap: true, cls: 'small', pos: 'right: 66vmin; bottom: 5vmin;' },
  { act: 'pause', label: 'II', tap: true, cls: 'small', pos: 'right: 3vmin; top: 12vmin;' },
];

export function wantsTouch(params) {
  if (params.has('touch')) return params.get('touch') !== '0';
  return typeof window !== 'undefined' && ('ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0);
}

export function mountTouch(game, root) {
  const input = game.input, el = document.createElement('div');
  el.id = 'touch';
  el.innerHTML = '<div id="t-stick"><div id="t-base"><div id="t-knob"></div></div></div>' + BUTTONS.map((b) => `<div class="tbtn ${b.cls || ''}" data-act="${b.act}" ${b.power ? `data-power="${b.power}"` : ''} style="${b.pos}">${b.label}</div>`).join('');
  root.appendChild(el);
  document.documentElement.classList.add('touch');
  const press = (a) => { input.touch.add(a); input.latched.add(a); if (input.onAny) input.onAny(); };
  // One thumb, several buttons. Every finger on the right presses each button whose circle (a fifth
  // wider than drawn) it lies in, and keeps doing so as it slides: a thumb holding SLING can roll onto
  // JUMP and both are held, and a thumb set down between the two presses both. USE, NEXT and pause
  // answer only to a finger that came down on them, never to one sliding past.
  const btns = [...el.querySelectorAll('.tbtn')].map((b) => ({ b, a: b.dataset.act, tap: !!BUTTONS.find((q) => q.act === b.dataset.act).tap }));
  const fingers = new Map();                 // pointer id -> Set of actions it holds
  const under = (x, y, down, held) => {
    const out = new Set();
    for (const q of btns) {
      if (q.b.hidden) continue;
      const r = q.b.getBoundingClientRect(), d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
      if (d <= r.width / 2 * 1.2 && (!q.tap || down || held.has(q.a))) out.add(q.a);
    }
    return out;
  };
  const sync = () => {
    const all = new Set(); for (const set of fingers.values()) for (const a of set) all.add(a);
    for (const q of btns) {
      const on = all.has(q.a);
      if (on && !input.touch.has(q.a)) press(q.a); else if (!on) input.touch.delete(q.a);
      q.b.classList.toggle('on', on);
    }
  };
  const onStick = (e) => e.target && e.target.closest && e.target.closest('#t-stick');
  el.addEventListener('pointerdown', (e) => { if (onStick(e)) return; e.preventDefault(); fingers.set(e.pointerId, under(e.clientX, e.clientY, true, new Set())); sync(); });
  el.addEventListener('pointermove', (e) => { if (!fingers.has(e.pointerId)) return; e.preventDefault(); fingers.set(e.pointerId, under(e.clientX, e.clientY, false, fingers.get(e.pointerId))); sync(); });
  const lift = (e) => { if (!fingers.has(e.pointerId)) return; e.preventDefault(); fingers.delete(e.pointerId); sync(); };
  el.addEventListener('pointerup', lift); el.addEventListener('pointercancel', lift);
  // The stick appears wherever the left thumb lands and reads direction from how far it has moved.
  const stick = el.querySelector('#t-stick'), base = el.querySelector('#t-base'), knob = el.querySelector('#t-knob');
  let id = null, ox = 0, oy = 0;
  const set = (dx, dy) => {
    const dead = 14, max = 46, d = Math.hypot(dx, dy), k = d > max ? max / d : 1;
    knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    for (const [a, on] of [['left', dx < -dead], ['right', dx > dead], ['up', dy < -dead * 1.6], ['down', dy > dead * 1.6]]) { if (on) { if (!input.touch.has(a)) input.latched.add(a); input.touch.add(a); } else input.touch.delete(a); }
  };
  stick.addEventListener('pointerdown', (e) => {
    e.preventDefault(); if (id !== null) return;
    id = e.pointerId; ox = e.clientX; oy = e.clientY; try { stick.setPointerCapture(id); } catch (err) { /* synthetic pointer */ }
    base.style.left = ox + 'px'; base.style.top = oy + 'px'; base.classList.add('on'); set(0, 0); if (input.onAny) input.onAny();
  });
  stick.addEventListener('pointermove', (e) => { if (e.pointerId === id) { e.preventDefault(); set(e.clientX - ox, e.clientY - oy); } });
  const end = (e) => { if (e.pointerId !== id) return; id = null; base.classList.remove('on'); set(0, 0); };
  stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end);
  // No page scrolling, pinch-zoom or long-press menus while playing.
  for (const ev of ['touchmove', 'gesturestart', 'contextmenu']) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
  // Called every frame: hide the controls behind cards, show a power's button once it is earned.
  return () => {
    const hide = game.ui.open || game.modal;
    if (el.hidden !== hide) { el.hidden = hide; if (hide) { input.touch.clear(); fingers.clear(); for (const q of btns) q.b.classList.remove('on'); id = null; base.classList.remove('on'); } }
    for (const b of el.querySelectorAll('[data-power]')) { const show = game.has(b.dataset.power); if (b.hidden === show) b.hidden = !show; }
  };
}
