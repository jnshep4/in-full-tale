// Region 7: Ashdod, the temple quarter. Captain: Zeruk. Power: Shepherd's Cord (grapple).
// Entered with the Bronze Buckler, so spear hedges stand on the main path and archers are everywhere.
// Hand-built (2026-11-18): the house of Dagon with its roof, terraces of the upper city. 20 marked:
// 17 open; one each behind deep water (swim), a ring perch (cord), a bound door (heavy).
import { RB } from '../world/build.js';
import { hut, sunk, perch, wall, arena } from './pieces.js';

function quarter() {
  const r = new RB('quarter', 'The Temple Quarter', 130, 44);
  r.land(0, 129, 32).land(30, 56, 30).land(110, 129, 27).walls();
  r.door('camp', 4, 31, '0/camp/d7', { look: 'path', label: "TO SAUL'S CAMP" });
  r.puts('t', [8, 31]).puts('a', [13, 31]);
  wall(r, 23, 32, '6');
  r.back(34, 25, 52, 29).fill(34, 24, 52, 24).plank(31, 32, 27);   // the house of Dagon: a hall on a platform, and its roof
  r.puts('A', [38, 29]).puts('M', [46, 29]).puts('t', [42, 29]).puts('A', [42, 23]).puts('M', [49, 23]);
  hut(r, 64, 32, '6');
  sunk(r, 80, 32);
  r.puts('M', [98, 31]).puts('H', [104, 31]).puts('t', [101, 31]);
  r.puts('M', [115, 26]).puts('A', [121, 26]).puts('t', [118, 26]);
  r.exit('R', 'east', 26, 'temple/west');
  return r.done();
}

function temple() {
  const r = new RB('temple', 'The Upper City', 130, 44);
  r.land(0, 129, 32).land(84, 107, 27).walls();
  r.exit('L', 'west', 31, 'quarter/east');
  r.puts('t', [8, 31]).puts('s', [12, 31]).puts('A', [16, 31]).puts('M', [28, 31]);
  perch(r, 38, 32);
  r.puts('H', [50, 31]).puts('t', [54, 31]);
  hut(r, 68, 32, '9');
  r.puts('M', [89, 26]).puts('A', [96, 26]).puts('H', [102, 26]).puts('t', [93, 26]);
  r.puts('s', [112, 31]).puts('t', [116, 31]);
  wall(r, 122, 32, '6');
  r.exit('R', 'east', 31, 'court/west');
  return r.done();
}

function court() {
  const r = new RB('court', 'The Outer Court', 80, 44);
  r.land(0, 79, 32).walls();
  r.exit('L', 'west', 31, 'temple/east');
  r.puts('t', [8, 31], [58, 31], [72, 31]).puts('A', [20, 31]).puts('M', [30, 31]).puts('a', [46, 31]);
  r.door('arena', 66, 31, 'arena/in', { look: 'arena', label: "ZERUK'S GROUND" });
  return r.done();
}

export const region7 = {
  id: 7, name: 'Ashdod', theme: 'ashdod', complete: true, start: 'quarter',
  rooms: [quarter(), temple(), court(), arena(7, "Zeruk's Ground", 'court/arena', { w: 40 })],
};
