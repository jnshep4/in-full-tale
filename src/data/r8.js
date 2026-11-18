// Region 8: Ashkelon harbor. Captain: Banith. Power: Deep Breath (swim).
// Entered with the Shepherd's Cord.
// Hand-built (2026-11-18): piers over deep water (a fall sweeps David back until he can swim), and a
// ship at the quay with rings in her rigging. 20 marked: 17 open, one behind deep water, two behind bound doors.
import { RB } from '../world/build.js';
import { hut, sunk, perch, arena } from './pieces.js';

function harbor() {
  const r = new RB('harbor', 'Ashkelon Harbor', 130, 46);
  r.land(0, 129, 32).walls();
  r.door('camp', 4, 31, '0/camp/d8', { look: 'path', label: "TO SAUL'S CAMP" });
  r.puts('t', [8, 31]).puts('s', [13, 31]);
  r.fill(20, 32, 70, 35, '~');                                 // the basin
  for (const [x0, x1] of [[22, 27], [31, 36], [40, 45], [49, 54], [58, 63], [66, 69]]) r.plank(x0, x1, 31);   // piers
  r.puts('M', [33, 30]).puts('A', [42, 30]).puts('M', [51, 30]).puts('H', [60, 30]).puts('t', [24, 30], [68, 30]);
  perch(r, 56, 32);
  sunk(r, 78, 32);
  r.puts('M', [96, 31]).puts('A', [102, 31]).puts('t', [99, 31]);
  hut(r, 110, 32, '9');
  r.exit('R', 'east', 31, 'quay/west');
  return r.done();
}

function quay() {
  const r = new RB('quay', 'The Long Quay', 130, 46);
  r.land(0, 129, 32).walls();
  r.exit('L', 'west', 31, 'harbor/east');
  r.puts('t', [8, 31]).puts('M', [12, 31]);
  r.fill(24, 32, 90, 35, '~');
  r.plank(26, 30, 31).plank(33, 36, 31).plank(75, 79, 31).plank(83, 87, 31);
  r.fill(40, 30, 70, 35).fill(38, 31, 39, 35).fill(71, 31, 72, 35);   // a ship at the quay: her deck, bow and stern
  r.puts('M', [45, 29]).puts('H', [60, 29]).puts('M', [66, 29]).puts('t', [52, 29]);
  r.put(48, 24, 'o').fill(51, 23, 57, 23);                     // a ring in the rigging and the fighting top
  r.puts('A', [54, 22]).puts('M', [56, 22]);
  r.puts('A', [98, 31]).puts('t', [101, 31]);
  hut(r, 106, 32, '9');
  r.puts('H', [122, 31]);
  r.exit('R', 'east', 31, 'mole/west');
  return r.done();
}

function mole() {
  const r = new RB('mole', 'The Sea Wall', 80, 46);
  r.land(0, 79, 32).walls();
  r.exit('L', 'west', 31, 'quay/east');
  r.puts('t', [8, 31], [58, 31], [72, 31]).puts('A', [20, 31]).puts('M', [30, 31]).puts('s', [44, 31]);
  r.door('arena', 66, 31, 'arena/in', { look: 'arena', label: "BANITH'S GROUND" });
  return r.done();
}

export const region8 = {
  id: 8, name: 'Ashkelon', theme: 'ashkelon', complete: true, start: 'harbor',
  rooms: [harbor(), quay(), mole(), arena(8, "Banith's Ground", 'mole/arena', { w: 40, planks: [], rings: [[10, 6], [20, 6], [30, 6]] })],
};
