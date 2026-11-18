// Region 6: Ekron, city of olive presses. Captain: Akhtal. Power: Bronze Buckler (shield).
// Entered with Goliath's sword. All 20 marked soldiers here need only the powers of regions 1-5,
// which is what puts the 100th trophy within reach before any later power (NOTES.md, placement rule).
// Hand-built (2026-11-18): two-storey houses to clear floor by floor, and a sunken press yard.
import { RB } from '../world/build.js';
import { hut, cellar, tower, wall, arena } from './pieces.js';

function gate() {
  const r = new RB('gate', 'The Gate of Ekron', 130, 46);
  r.land(0, 129, 32).walls();
  r.door('camp', 4, 31, '0/camp/d6', { look: 'path', label: "TO SAUL'S CAMP" });
  r.puts('t', [8, 31]).puts('s', [14, 31]);
  wall(r, 22, 32, '5');                                        // the city gate, choked with thorn
  r.back(30, 23, 50, 31).fill(30, 27, 50, 27).fill(34, 22, 50, 22);   // a house: two floors over the street
  r.plank(27, 28, 29).plank(31, 32, 24);
  r.puts('M', [36, 31]).puts('H', [44, 31]).puts('t', [40, 31]);
  r.puts('M', [40, 26]).puts('A', [47, 26]).puts('t', [44, 26]);
  r.puts('A', [42, 21]).puts('M', [48, 21]);
  cellar(r, 58, 32);
  r.puts('s', [70, 31]).fill(74, 32, 75, 32, '^').puts('M', [80, 31]).puts('t', [78, 31]);
  r.back(88, 28, 104, 31).fill(88, 27, 104, 27).plank(85, 86, 29).plank(106, 107, 29);   // a second house
  r.puts('M', [92, 31]).puts('t', [98, 31]).puts('H', [94, 26]).puts('M', [100, 26]);
  r.puts('M', [114, 31]).puts('s', [120, 31]).puts('t', [117, 31]);
  r.exit('R', 'east', 31, 'presses/west');
  return r.done();
}

function presses() {
  const r = new RB('presses', 'The Olive Presses', 120, 46);
  r.land(0, 119, 32).walls();
  r.exit('L', 'west', 31, 'gate/east');
  r.puts('t', [8, 31]).puts('s', [13, 31]);
  for (const [x0, x1] of [[20, 29], [34, 45], [50, 60]]) r.clear(x0, 32, x1, 34).back(x0, 32, x1, 34);   // the press yard, sunk three deep around two great press stones
  r.plank(23, 26, 32).plank(38, 42, 32).plank(53, 57, 32);
  r.puts('M', [25, 34]).puts('H', [40, 34]).puts('M', [55, 34]).puts('t', [21, 34], [44, 34], [59, 34]);
  r.puts('A', [31, 31]).puts('s', [47, 31]);
  hut(r, 68, 32, '1');
  tower(r, 98, 5, 32, 5, 'double');
  r.puts('M', [108, 31]).puts('a', [113, 31]).puts('t', [110, 31]);
  r.exit('R', 'east', 31, 'wall/west');
  return r.done();
}

function under() {
  const r = new RB('wall', 'Under the Wall', 80, 46);
  r.land(0, 79, 32).walls();
  r.exit('L', 'west', 31, 'presses/east');
  r.puts('t', [8, 31], [58, 31], [72, 31]).puts('H', [24, 31]).puts('h', [40, 31]).puts('a', [50, 31]);
  r.door('arena', 66, 31, 'arena/in', { look: 'arena', label: "AKHTAL'S GROUND" });
  return r.done();
}

export const region6 = {
  id: 6, name: 'Ekron', theme: 'ekron', complete: true, start: 'gate',
  rooms: [gate(), presses(), under(), arena(6, "Akhtal's Ground", 'wall/arena', { w: 36 })],
};
