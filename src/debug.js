// Hidden debug menu (backquote key). Warp to any region or room, grant powers, set the tally.
import { REGIONS } from './data/regions.js';
import { POWERS } from './data/powers.js';
import { TALLY_GOAL, clamp } from './core.js';

export function mountDebug(game, root) {
  const el = document.createElement('div');
  el.id = 'debug'; el.hidden = true;
  root.appendChild(el);
  const build = () => {
    const rooms = REGIONS.flatMap((r) => r.rooms.map((m) => `<option value="${r.id}|${m.id}" ${game.region.id === r.id && game.room.id === m.id ? 'selected' : ''}>Region ${r.id}: ${r.name} / ${m.id}</option>`)).join('');
    const powers = POWERS.map((p) => `<label><input type="checkbox" data-power="${p.id}" ${game.save.powers.includes(p.id) ? 'checked' : ''}> ${p.region}. ${p.name}</label>`).join('');
    el.innerHTML = `<h2>Debug</h2>
      <div class="row"><label>Warp <select id="dbg-warp">${rooms}</select></label><button id="dbg-go">Go</button></div>
      <div class="row"><label>Tally <input id="dbg-tally" type="number" min="0" max="${TALLY_GOAL}" value="${game.save.tally}"></label><button id="dbg-set">Set</button></div>
      <div class="powers">${powers}</div>
      <div class="row"><label><input type="checkbox" id="dbg-god" ${game.godmode ? 'checked' : ''}> No damage</label><button id="dbg-all">All powers</button><button id="dbg-heal">Heal</button><button id="dbg-reset">Erase save</button><button id="dbg-close">Close (\`)</button></div>`;
    el.querySelector('#dbg-go').onclick = () => { const [r, m] = el.querySelector('#dbg-warp').value.split('|'); game.loadRoom(+r, m); toggle(false); };
    el.querySelector('#dbg-set').onclick = () => { game.save.tally = clamp(Math.round(+el.querySelector('#dbg-tally').value || 0), 0, TALLY_GOAL); game.tallyPulse = 0.6; game.persist(); };
    el.querySelector('#dbg-god').onchange = (e) => { game.godmode = e.target.checked; };
    el.querySelector('#dbg-all').onclick = () => { game.save.powers = POWERS.map((p) => p.id); game.room.shield = true; game.persist(); build(); };
    el.querySelector('#dbg-heal').onclick = () => { game.player.hp = game.player.maxHp; };
    el.querySelector('#dbg-reset').onclick = () => { game.resetSave(); toggle(false); };
    el.querySelector('#dbg-close').onclick = () => toggle(false);
    el.querySelectorAll('[data-power]').forEach((c) => { c.onchange = () => {
      const id = c.dataset.power, has = game.save.powers.includes(id);
      if (c.checked && !has) game.save.powers.push(id);
      if (!c.checked && has) game.save.powers = game.save.powers.filter((x) => x !== id);
      game.room.shield = game.has('shield'); game.persist();
    }; });
  };
  const toggle = (open = el.hidden) => { el.hidden = !open; game.modal = open; if (open) build(); else if (document.activeElement) document.activeElement.blur(); };
  game.onDebug = () => toggle();
  return { toggle };
}
