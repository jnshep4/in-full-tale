// DOM overlays over the canvas: verse cards, power cards, scenes, endings. Real text in the page,
// so it stays crisp at any scale and the tests can read back exactly what the player sees.
import { REGION_VERSES, VERSION_TAG, SWORD_VERSE } from './data/verses.js';
import { POWERS } from './data/powers.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export class UI {
  constructor(root, game) { this.root = root; this.game = game; this.cur = null; this.queue = []; this.t = 0; this.sel = 0; }
  get open() { return !!this.cur; }

  // spec: { kind, html, buttons: [{ label, value }], onClose(value), data: {} }
  show(spec) { if (this.cur) { this.queue.push(spec); return; } this.mount(spec); }
  mount(spec) {
    this.cur = spec; this.t = spec.quick ? 0.4 : 0; this.sel = spec.sel || 0;
    const el = document.createElement('div');
    el.className = 'card ' + spec.kind; el.id = 'card'; el.dataset.kind = spec.kind;
    for (const k in spec.data || {}) el.dataset[k] = spec.data[k];
    const buttons = spec.buttons || [{ label: 'Continue', value: 'ok' }];
    el.innerHTML = `<div class="card-in">${spec.html}<div class="card-buttons">${buttons.map((b, i) => `<button data-i="${i}" data-value="${esc(b.value)}">${esc(b.label)}</button>`).join('')}</div><p class="card-hint">${this.game.touch ? 'Tap a button' : buttons.length > 1 ? 'Left / Right to choose, Enter to confirm' : 'Press Enter'}</p>${spec.foot || ''}</div>`;
    el.querySelectorAll('button').forEach((b) => { b.onclick = () => this.close(buttons[+b.dataset.i].value); });
    this.root.appendChild(el); this.el = el; this.paint();
    this.game.sfx.play(spec.sound || 'card');
  }
  paint() { if (this.el) this.el.querySelectorAll('button').forEach((b, i) => b.classList.toggle('sel', i === this.sel)); }
  close(value) {
    const spec = this.cur; if (!spec) return;
    this.el.remove(); this.el = null; this.cur = null;
    if (spec.onClose) spec.onClose(value);
    if (!this.cur && this.queue.length) this.mount(this.queue.shift());
  }
  update(input, dt) {
    if (!this.cur) return;
    this.t += dt;
    const n = (this.cur.buttons || [0]).length;
    if (n > 1) {
      if (input.pressed.left) { this.sel = (this.sel + n - 1) % n; this.paint(); this.game.sfx.play('select'); }
      if (input.pressed.right) { this.sel = (this.sel + 1) % n; this.paint(); this.game.sfx.play('select'); }
    }
    if (this.cur.esc && input.pressed.pause && this.t > 0.2) { this.close(this.cur.esc); return; }
    if (this.t > 0.5 && (input.pressed.confirm || input.pressed.jump || (n === 1 && input.pressed.fire))) {
      const b = (this.cur.buttons || [{ value: 'ok' }])[this.sel]; this.close(b.value);
    }
  }

  // The verse card shown when a region's captain falls.
  verse(regionId, onClose) {
    const v = REGION_VERSES.find((x) => x.region === regionId);
    this.show({ kind: 'verse', data: { region: regionId }, onClose,
      html: `<div class="orn"></div><p class="verse-text">${esc(v.text)}</p><p class="verse-ref"><span class="ref">${esc(v.ref)}</span> <span class="tag">${VERSION_TAG}</span></p>` });
  }
  power(id, onClose) {
    const p = POWERS.find((x) => x.id === id);
    const sword = id === 'sword' ? `<p class="verse-text small">${esc(SWORD_VERSE.text)}</p><p class="verse-ref"><span class="ref">${esc(SWORD_VERSE.ref)}</span> <span class="tag">${VERSION_TAG}</span></p>` : '';
    this.show({ kind: 'power', data: { power: id }, sound: 'power', onClose,
      html: `<p class="kicker">David has gained</p><h2>${esc(p.name)}</h2>${sword}<p class="blurb">${esc(p.blurb)}</p><p class="how">${esc(p.how)}</p>` });
  }
  // A short run of pages: [{ title, text }]. The last page may carry buttons.
  scene(kind, pages, buttons, onClose, data) {
    pages.forEach((pg, i) => {
      const last = i === pages.length - 1;
      this.show({ kind, data: { ...(data || {}), page: i }, buttons: last ? buttons : [{ label: 'Next', value: 'next' }], onClose: last ? onClose : null,
        html: `${pg.title ? `<h2>${esc(pg.title)}</h2>` : ''}${(Array.isArray(pg.text) ? pg.text : [pg.text]).map((t) => `<p class="${pg.cls || 'say'}">${esc(t)}</p>`).join('')}${pg.html || ''}` });
    });
  }
}
