// Region 9: Gaza, the gates and the desert edge. Captain: Yishvar. Power: Smooth Stone (heavy shot).
// Entered with Deep Breath.
// Hand-built (2026-11-18): the twin gate towers and the walk between them, a great cistern to swim,
// dunes. 20 marked: 17 open, three behind bound doors.
import { RB } from '../world/build.js';
import { hut, sunk, moat, arena } from './pieces.js';

function gates() {
  const r = new RB('gates', 'The Gates of Gaza', 130, 46);
  r.land(0, 129, 32).walls();
  r.door('camp', 4, 31, '0/camp/d9', { look: 'path', label: "TO SAUL'S CAMP" });
  r.puts('t', [8, 31]).puts('s', [14, 31]);
  moat(r, 24, 32);
  r.land(40, 49, 22).land(64, 73, 22).cave(40, 29, 49, 31).cave(64, 29, 73, 31);   // the gate towers, each on an arch
  r.plank(50, 63, 22);                                         // the walk between them
  r.puts('A', [44, 21]).puts('M', [47, 21]).puts('M', [56, 21]).puts('H', [68, 21]).puts('t', [42, 21], [71, 21]);
  r.puts('M', [53, 31]).puts('s', [60, 31]).puts('t', [57, 31]);
  hut(r, 84, 32, '9');
  sunk(r, 102, 32);
  r.puts('M', [120, 31]).puts('t', [117, 31]);
  r.exit('R', 'east', 31, 'cisterns/west');
  return r.done();
}

function cisterns() {
  const r = new RB('cisterns', 'The Cisterns', 130, 46);
  r.land(0, 129, 32).walls();
  r.exit('L', 'west', 31, 'gates/east');
  r.puts('t', [8, 31]).puts('s', [13, 31]);
  r.fill(20, 32, 80, 38, '~').back(20, 32, 80, 38);            // the great cistern, seven deep
  r.land(34, 39, 32).land(56, 61, 32);                         // two pillars standing in it
  r.puts('M', [36, 31]).puts('t', [38, 31]).puts('A', [58, 31]).puts('t', [60, 31]);
  r.fill(81, 37, 86, 38, '~').back(81, 37, 86, 38);            // a drain at the bottom leads to a dry chamber
  r.cave(87, 34, 96, 36).fill(87, 37, 89, 38, '~').back(87, 37, 89, 38);
  r.puts('M', [94, 36]).puts('t', [92, 36]);
  r.puts('M', [100, 31]).puts('H', [106, 31]).puts('t', [103, 31]);
  hut(r, 112, 32, '9');
  r.exit('R', 'east', 31, 'sands/west');
  return r.done();
}

function sands() {
  const r = new RB('sands', 'The Desert Edge', 120, 46);
  r.land(0, 119, 32).walls();
  r.exit('L', 'west', 31, 'cisterns/east');
  r.land(14, 25, 31).land(17, 22, 30);                         // dunes
  r.land(34, 49, 30).land(38, 45, 28);
  r.land(60, 75, 31);
  r.puts('t', [8, 31]).puts('M', [20, 29]).puts('A', [41, 27]).puts('M', [47, 29]).puts('t', [36, 29]);
  r.puts('H', [66, 30]).puts('M', [72, 30]).puts('t', [69, 30]);
  hut(r, 84, 32, '9');
  r.puts('t', [100, 31], [112, 31]);
  r.door('arena', 106, 31, 'arena/in', { look: 'arena', label: "YISHVAR'S GROUND" });
  return r.done();
}

export const region9 = {
  id: 9, name: 'Gaza', theme: 'gaza', complete: true, start: 'gates',
  rooms: [gates(), cisterns(), sands(), arena(9, "Yishvar's Ground", 'sands/arena', { w: 40, planks: [[5, 8, 3], [31, 34, 3]], pool: [16, 23, 3] })],
};
