// Region 5: Ephes-dammim, the battle lines. Captain: Goliath of Gath (1 Samuel 17). He drops his sword.
// Entered with dash, double jump, wall climb and ground pound.
// Hand-built (2026-11-18): trenches to drop into, ramparts, a watchtower of planks. 20 marked soldiers:
// 14 open, three behind thorn hedges (the sword), one each behind a bound door, a spear hedge, a ring perch.
import { RB } from '../world/build.js';
import { hut, perch, arena } from './pieces.js';

function lines() {
  const r = new RB('lines', 'Ephes-dammim', 130, 46);
  r.land(0, 129, 32).walls();
  r.door('camp', 4, 31, '0/camp/d5', { look: 'path', label: "TO SAUL'S CAMP" });
  r.puts('t', [8, 31]);
  r.land(14, 21, 31).land(16, 19, 30);                         // first rampart
  r.puts('s', [17, 29]);
  r.clear(26, 32, 37, 34).back(26, 32, 37, 34);                // trench A, three deep
  r.plank(29, 31, 32).plank(34, 35, 32);
  r.puts('M', [28, 34]).puts('H', [35, 34]).puts('t', [32, 34]);
  r.plank(44, 50, 29).plank(44, 50, 26).plank(44, 50, 23);     // the watchtower: three floors of planks
  r.puts('M', [46, 25]).puts('A', [47, 22]).puts('t', [49, 31]);
  hut(r, 58, 32, '5');                                         // thorn hedge (sword)
  r.fill(74, 32, 76, 32, '^');
  r.land(78, 97, 31).land(80, 95, 29);                         // the great rampart
  r.puts('M', [84, 28]).puts('A', [90, 28]).puts('t', [87, 28]);
  r.clear(102, 32, 112, 33).back(102, 32, 112, 33);            // trench B, two deep
  r.plank(105, 109, 32);
  r.puts('M', [104, 33]).puts('s', [110, 33]);
  r.puts('M', [118, 31]).puts('H', [123, 31]).puts('t', [115, 31]);
  r.exit('R', 'east', 31, 'trench/west');
  return r.done();
}

function trench() {
  const r = new RB('trench', 'The Sunken Road', 140, 46);
  r.land(0, 139, 32).walls();
  r.exit('L', 'west', 31, 'lines/east');
  r.puts('t', [6, 31]).puts('s', [10, 31]);
  for (const [x0, x1] of [[16, 27], [32, 43], [48, 60]]) r.clear(x0, 32, x1, 34).back(x0, 32, x1, 34);   // the road, cut three deep, with two causeways left standing
  r.plank(20, 23, 32).plank(36, 39, 32).plank(52, 56, 32);
  r.puts('M', [22, 34]).puts('A', [38, 34]).puts('H', [54, 34]).puts('t', [18, 34], [41, 34], [58, 34]);
  r.puts('s', [29, 31]).puts('t', [45, 31]);
  perch(r, 76, 32);                                            // ring perch (cord)
  r.puts('M', [88, 31]).puts('A', [94, 31]).puts('t', [91, 31]);
  hut(r, 106, 32, '9');                                        // bound door (heavy stone)
  hut(r, 122, 32, '6');                                        // spear hedge (buckler)
  r.exit('R', 'east', 31, 'valley/west');
  return r.done();
}

function valley() {
  const r = new RB('valley', 'The Valley Floor', 110, 46);
  r.land(0, 109, 32).land(20, 109, 30).land(40, 109, 28).land(60, 109, 26).walls();   // the ground climbs toward the champion
  r.exit('L', 'west', 31, 'trench/east');
  r.puts('t', [6, 31]).puts('h', [12, 31]);
  hut(r, 24, 30, '5');                                         // thorn hedges (sword)
  r.puts('a', [46, 27]).puts('h', [52, 27]).puts('t', [49, 27]);
  hut(r, 66, 26, '5', 'H');
  r.puts('s', [84, 25]).puts('a', [90, 25]).puts('t', [96, 25], [104, 25]);
  r.door('arena', 100, 25, 'arena/in', { look: 'arena', label: 'THE CHAMPION' });
  return r.done();
}

export const region5 = {
  id: 5, name: 'Ephes-dammim', theme: 'battle', complete: true, start: 'lines',
  rooms: [lines(), trench(), valley(), arena(5, 'The Champion of Gath', 'valley/arena', { w: 44, planks: [[5, 9, 3], [13, 17, 6], [26, 30, 6], [34, 38, 3]] })],
};
