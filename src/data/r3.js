// Region 3: the gorge of Sorek. Captain: Pashdu. Power: Rock Hold (wall climb).
// Entered with dash and double jump.
// Hand-built (2026-11-18): a climb down the gorge wall by ledges, caves with hanging rock, the narrows.
// 20 marked: 14 open; one each behind thorns (sword), deep water (swim), a ring perch (cord), a
// cracked slab (pound), a tall tower (climb), a spear hedge (buckler).
import { RB } from '../world/build.js';
import { hut, tower, cellar, sunk, perch, arena } from './pieces.js';

function descent() {
  const r = new RB('descent', 'Sorek Gorge', 110, 50);
  r.land(0, 109, 32).land(0, 19, 20).land(20, 27, 24).land(28, 35, 28).walls();   // down the gorge wall, four at a time
  r.door('camp', 4, 19, '0/camp/d3', { look: 'path', label: "TO SAUL'S CAMP" });
  r.puts('t', [8, 19]).puts('s', [13, 19]).puts('M', [23, 23]).puts('A', [31, 27]).puts('t', [38, 31]);
  hut(r, 45, 32, '5');
  sunk(r, 62, 32);
  r.puts('M', [76, 31]);
  r.land(80, 95, 27);                                          // a shelf, five up
  r.puts('M', [84, 26]).puts('s', [87, 26]).puts('H', [90, 26]).puts('t', [93, 26]);
  r.puts('M', [100, 31]).puts('a', [105, 31]).puts('t', [103, 31]);
  r.exit('R', 'east', 31, 'caves/west');
  return r.done();
}

function caves() {
  const r = new RB('caves', 'The Caves of Sorek', 120, 44);
  r.land(0, 119, 32).walls().fill(0, 0, 119, 5).back(0, 6, 119, 43);
  r.exit('L', 'west', 31, 'descent/east');
  r.fill(30, 6, 31, 26).fill(84, 6, 85, 26);                   // rock hanging from the roof
  r.puts('t', [6, 31], [14, 31], [24, 31], [36, 31], [48, 31], [63, 31], [70, 31], [88, 31], [96, 31], [106, 31], [114, 31]);
  r.puts('s', [10, 31]).puts('M', [18, 31]).puts('M', [40, 31]);
  perch(r, 56, 32);
  r.puts('M', [66, 31]);
  cellar(r, 74, 32);
  r.fill(92, 32, 93, 32, '^');
  r.puts('A', [90, 31]).puts('M', [100, 31]).puts('s', [104, 31]).puts('H', [110, 31]);
  r.exit('R', 'east', 31, 'falls/west');
  return r.done();
}

function falls() {
  const r = new RB('falls', 'The Narrows', 110, 44);
  r.land(0, 109, 32).land(20, 39, 27).land(64, 85, 27).walls();
  r.exit('L', 'west', 31, 'caves/east');
  r.puts('t', [6, 31]).puts('s', [12, 31]);
  hut(r, 25, 27, '6');
  tower(r, 48, 7, 32, 18, 'climb');
  r.puts('s', [58, 31]).puts('M', [70, 26]).puts('A', [78, 26]).puts('t', [74, 26]);
  r.puts('t', [94, 31], [106, 31]);
  r.door('arena', 100, 31, 'arena/in', { look: 'arena', label: "PASHDU'S GROUND" });
  return r.done();
}

export const region3 = {
  id: 3, name: 'Sorek Gorge', theme: 'gorge', complete: true, start: 'descent',
  rooms: [descent(), caves(), falls(), arena(3, "Pashdu's Ground", 'falls/arena', { w: 38, planks: [[5, 8, 3], [12, 15, 6], [22, 25, 6], [29, 32, 3]] })],
};
