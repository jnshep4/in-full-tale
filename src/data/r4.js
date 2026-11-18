// Region 4: the thickets of Timnah, lion country. Captain: Maroz. Power: Lion's Fall (ground pound).
// Entered with dash, double jump and wall climb.
// Hand-built (2026-11-18): a cliff to scale, a lions' den under a rise, a grove. 20 marked: 14 open;
// two behind thorns (sword), one each behind a cracked slab (pound), a bound door (heavy), deep
// water (swim), a ring perch (cord).
import { RB } from '../world/build.js';
import { hut, cellar, sunk, perch, arena } from './pieces.js';

function thicket() {
  const r = new RB('thicket', 'Timnah Thickets', 110, 44);
  r.land(0, 109, 32).land(42, 65, 22).walls();                 // the cliff, ten up
  r.door('camp', 4, 31, '0/camp/d4', { look: 'path', label: "TO SAUL'S CAMP" });
  r.puts('t', [8, 31]).puts('l', [14, 31]);
  hut(r, 22, 32, '5');
  r.puts('M', [36, 31]).puts('t', [39, 31]);
  r.puts('A', [46, 21]).puts('M', [51, 21]).puts('t', [54, 21]);
  cellar(r, 57, 22);
  r.plank(72, 76, 29).plank(78, 82, 26);                       // boughs
  r.puts('l', [70, 31]).puts('a', [80, 25]).puts('M', [88, 31]).puts('s', [95, 31]).puts('t', [92, 31]);
  r.exit('R', 'east', 31, 'lair/west');
  return r.done();
}

function lair() {
  const r = new RB('lair', "The Lions' Lair", 130, 44);
  r.land(0, 129, 32).land(56, 75, 26).walls();
  r.exit('L', 'west', 31, 'thicket/east');
  r.puts('t', [6, 31]).puts('l', [10, 31]).puts('M', [17, 31]);
  sunk(r, 26, 32);
  r.puts('M', [46, 31]).puts('H', [51, 31]).puts('t', [43, 31]);
  r.cave(56, 29, 75, 31);                                      // the den, a tunnel under the rise
  r.puts('l', [62, 31], [69, 31]).puts('t', [66, 31]);
  r.puts('M', [61, 25]).puts('l', [66, 25]).puts('A', [72, 25]).puts('t', [69, 25]);
  hut(r, 84, 32, '9');
  r.puts('A', [104, 31]).puts('l', [110, 31]).puts('M', [121, 31]).puts('t', [116, 31]);
  r.exit('R', 'east', 31, 'grove/west');
  return r.done();
}

function grove() {
  const r = new RB('grove', 'The Vineyard Road', 110, 44);
  r.land(0, 109, 32).walls();
  r.exit('L', 'west', 31, 'lair/east');
  r.puts('t', [6, 31]).puts('l', [12, 31]).puts('M', [20, 31]).puts('s', [25, 31]).puts('M', [34, 31]);
  perch(r, 44, 32);
  r.puts('M', [56, 31]).puts('t', [60, 31]).puts('l', [64, 31]);
  hut(r, 76, 32, '5');
  r.puts('t', [94, 31], [106, 31]);
  r.door('arena', 100, 31, 'arena/in', { look: 'arena', label: "MAROZ'S GROUND" });
  return r.done();
}

export const region4 = {
  id: 4, name: 'Timnah Thickets', theme: 'thicket', complete: true, start: 'thicket',
  rooms: [thicket(), lair(), grove(), arena(4, "Maroz's Ground", 'grove/arena', { w: 36, planks: [[14, 21, 4]] })],
};
