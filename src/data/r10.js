// Region 10: the citadel of Gath. Captain: Seren Orphaz. Power: Mighty Man.
// Entered with every other power; bound doors stand on the main path. All 20 soldiers are open.
// Hand-built (2026-11-18): a stair of terraces up the hill, then the fortress wall to scale and its ward.
import { RB } from '../world/build.js';
import { hut, perch, cellar, wall, moat, arena } from './pieces.js';

function approach() {
  const r = new RB('approach', 'The Road to Gath', 120, 46);
  r.land(0, 119, 32).land(30, 119, 30).land(44, 119, 28).land(58, 119, 26).land(72, 119, 24).walls();
  r.door('camp', 4, 31, '0/camp/d10', { look: 'path', label: "TO SAUL'S CAMP" });
  r.puts('t', [8, 31]).puts('h', [13, 31]);
  wall(r, 18, 32, '9');
  r.puts('M', [36, 29]).puts('H', [40, 29]).puts('A', [50, 27]).puts('M', [54, 27]).puts('t', [47, 27]);
  r.puts('M', [64, 25]).puts('H', [68, 25]).puts('t', [61, 25]);
  hut(r, 80, 24, '9');
  perch(r, 104, 24);
  r.puts('A', [112, 23]).puts('t', [115, 23]);
  r.exit('R', 'east', 23, 'citadel/west');
  return r.done();
}

function citadel() {
  const r = new RB('citadel', 'The Citadel', 130, 46);
  r.land(0, 129, 32).walls();
  r.exit('L', 'west', 31, 'approach/east');
  r.puts('t', [8, 31]).puts('h', [14, 31]);
  r.land(24, 40, 18).cave(24, 29, 40, 31);                     // the fortress wall, fourteen high, on its gate arch
  r.puts('M', [28, 17]).puts('A', [34, 17]).puts('H', [38, 17]).puts('t', [31, 17]);
  moat(r, 48, 32);
  r.back(60, 28, 80, 31).fill(60, 27, 80, 27).plank(57, 58, 29).plank(82, 83, 29);   // the ward: a guardhouse with its roof walk
  r.puts('M', [64, 26]).puts('H', [72, 26]).puts('A', [78, 26]).puts('M', [66, 31]).puts('h', [74, 31]).puts('t', [70, 31]);
  hut(r, 90, 32, '6');
  cellar(r, 106, 32);
  wall(r, 120, 32, '9');
  r.exit('R', 'east', 31, 'keep/west');
  return r.done();
}

function keep() {
  const r = new RB('keep', 'The Keep', 80, 46);
  r.land(0, 79, 32).walls();
  r.exit('L', 'west', 31, 'citadel/east');
  r.puts('t', [8, 31], [58, 31], [72, 31]).puts('M', [20, 31]).puts('H', [30, 31]).puts('h', [42, 31]).puts('a', [50, 31]);
  r.door('arena', 66, 31, 'arena/in', { look: 'arena', label: 'THE SEREN OF GATH' });
  return r.done();
}

export const region10 = {
  id: 10, name: 'Gath', theme: 'gath', complete: true, start: 'approach',
  rooms: [approach(), citadel(), keep(), arena(10, 'The Seren of Gath', 'keep/arena', { w: 44, planks: [[5, 9, 3], [34, 38, 3]], rings: [[22, 6]] })],
};
