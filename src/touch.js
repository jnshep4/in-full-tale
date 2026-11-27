// Touch controls for phones and tablets: a floating stick on the left half of the screen, action
// buttons on the right. They feed the same named actions as the keyboard (Input.touch), so nothing
// else in the game knows the difference. Shown only on touch devices, or with ?touch=1.
const BUTTONS = [
  { act: 'jump', label: 'JUMP', cls: 'big', pos: 'right: 3vmin; bottom: 5vmin;' },
  { act: 'fire', label: 'SLING', cls: 'big', pos: 'right: 25vmin; bottom: 5vmin;' },
  { act: 'dash', label: 'DASH', power: 'dash', pos: 'right: 3vmin; bottom: 28vmin;' },
  { act: 'melee', label: 'SWORD', power: 'sword', pos: 'right: 20vmin; bottom: 28vmin;' },
  { act: 'cord', label: 'CORD', power: 'grapple', pos: 'right: 37vmin; bottom: 28vmin;' },
  { act: 'item', label: 'USE', power: 'item', pos: 'right: 37vmin; bottom: 5vmin;' },
  { act: 'swap', label: 'NEXT', power: 'swap', cls: 'small', pos: 'right: 51vmin; bottom: 5vmin;' },
  { act: 'pause', label: 'II', cls: 'small', pos: 'right: 3vmin; top: 12vmin;' },
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
  for (const b of el.querySelectorAll('.tbtn')) {
    const a = b.dataset.act;
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ } b.classList.add('on'); press(a); });
    const up = (e) => { e.preventDefault(); b.classList.remove('on'); input.touch.delete(a); };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
  }
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
    if (el.hidden !== hide) { el.hidden = hide; if (hide) { input.touch.clear(); id = null; base.classList.remove('on'); } }
    for (const b of el.querySelectorAll('[data-power]')) { const show = game.has(b.dataset.power); if (b.hidden === show) b.hidden = !show; }
  };
}
