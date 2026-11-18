// Region 1: the Valley of Elah (Judean hill country at dusk). Captain: Shalmek. Power: Fleet Foot.
// 20 marked soldiers: 14 need no power; one each waits behind a reed screen (dash), a high ledge
// (double jump), a cliff (climb), deep water (swim), a bound door (heavy stone), a spear hedge (shield).
import { RB } from '../world/build.js';

function outskirts() {
  const r = new RB('outskirts', 'Valley of Elah', 100, 30);
  r.land(0, 99, 24).walls();
  r.plank(12, 15, 21);                   // practice platform
  r.fill(21, 22, 34, 23);                // rise A, standing row 21
  r.fill(35, 23, 37, 23, '^');           // stake pit
  r.fill(38, 22, 56, 23);                // plateau B, standing row 21
  r.plank(42, 46, 19).plank(48, 52, 16);
  r.fill(54, 13, 66, 14);                // upper ledge, standing row 12
  r.fill(69, 22, 70, 23);                // step
  r.fill(71, 20, 80, 23);                // terrace C, standing row 19
  r.plank(84, 88, 20);
  r.put(5, 23, 'P');
  r.puts('t', [10, 23], [45, 21], [61, 23], [57, 12], [78, 19], [95, 23]);
  r.puts('M', [29, 21], [62, 12], [65, 23], [75, 19], [86, 23], [93, 23]);
  r.puts('s', [51, 21], [90, 23]);
  r.door('camp', 3, 23, '0/camp/d1', { look: 'path', label: "TO SAUL'S CAMP" });
  r.exit('R', 'east', 23, 'brook/west');
  return r.done();
}

// The brook where David chose his stones. The main path crosses the pool on planks and climbs over
// a rock that hides a grotto, reached only by diving under its wall.
function brook() {
  const r = new RB('brook', 'The Brook', 110, 34);
  r.land(0, 109, 26).walls();
  r.exit('L', 'west', 25, 'outskirts/east');
  r.fill(18, 26, 27, 29, '~');                         // the pool, floor at row 30
  r.plank(19, 21, 23).plank(24, 26, 23).plank(25, 27, 20);
  r.land(28, 38, 19);                                  // the rock, standing row 18
  r.cave(30, 21, 36, 29);                              // grotto inside it
  r.fill(28, 28, 29, 29, '~').back(28, 28, 29, 29);    // the gap under its wall
  r.fill(30, 26, 32, 29, '~');
  r.fill(33, 26, 36, 29);                              // grotto bank, standing row 25
  r.puts('t', [34, 25]).puts('M', [35, 25]);
  r.puts('t', [8, 25], [33, 18], [47, 25], [67, 25]);
  r.puts('s', [12, 25], [45, 25]).puts('M', [50, 25]);
  r.fill(56, 26, 58, 26, '^');                         // stake pit
  r.puts('M', [64, 25], [71, 25]);
  r.plank(72, 74, 23);
  r.land(76, 90, 20);                                  // the cliff, standing row 19
  r.cave(76, 23, 84, 25);                              // nook in its foot
  r.fill(76, 23, 76, 25, '1');                         // reed screen
  r.puts('t', [80, 25]).puts('M', [82, 25]);
  r.puts('M', [80, 19]).puts('s', [86, 19]).puts('t', [89, 19]);
  r.land(91, 92, 22).land(93, 109, 24);
  r.puts('M', [100, 23]).puts('t', [104, 23]);
  r.exit('R', 'east', 23, 'picket/west');
  return r.done();
}

// The Philistine picket line below Shalmek's ground.
function picket() {
  const r = new RB('picket', 'The Picket Line', 110, 36);
  r.land(0, 109, 28).walls();
  r.exit('L', 'west', 27, 'brook/east');
  r.puts('t', [6, 27]).puts('s', [10, 27]);
  r.land(21, 27, 25);                                  // terrace, standing row 24
  r.puts('M', [24, 24]);
  r.fill(31, 20, 37, 24);                              // watch rock on an arch, standing row 19
  r.back(31, 25, 37, 27);
  r.puts('M', [34, 19]).puts('t', [36, 19]).gate('double', 34, 19);
  r.puts('M', [44, 27]).puts('t', [41, 27]);
  r.plank(49, 50, 25);
  r.fill(52, 24, 60, 24).fill(60, 25, 60, 27).back(52, 25, 59, 27);   // the store hut
  r.fill(52, 25, 52, 27, '9');                         // bound door
  r.puts('M', [57, 27]).puts('t', [55, 27]);
  r.plank(62, 63, 25);
  r.puts('s', [66, 27]).puts('M', [72, 27]).puts('t', [69, 27]);
  r.land(76, 88, 14);                                  // the mesa, standing row 13
  r.cave(76, 25, 88, 27);                              // tunnel through its foot
  r.cave(77, 19, 78, 24).plank(77, 78, 25);            // shaft up to the guard room
  r.cave(79, 19, 86, 22);
  r.fill(80, 19, 80, 22, '6');                         // spear hedge
  r.puts('M', [84, 22]).puts('t', [83, 22]);
  r.puts('M', [82, 13]).puts('t', [85, 13]).gate('climb', 82, 13);
  r.puts('t', [96, 27], [104, 27]);
  r.door('arena', 100, 27, 'arena/in', { look: 'arena', label: "SHALMEK'S GROUND" });
  return r.done();
}

function arena() {
  const r = new RB('arena', "Shalmek's Ground", 34, 17, { boss: 1 });
  r.land(0, 33, 14).walls();
  r.plank(6, 9, 11).plank(24, 27, 11);
  r.door('in', 4, 13, 'picket/arena', { look: 'path' });
  r.door('out', 29, 13, '0/camp/d1', { look: 'path', after: 1, label: "TO SAUL'S CAMP" });
  r.puts('t', [2, 13], [16, 13], [31, 13]);
  r.put(24, 13, 'B');
  return r.done();
}

export const region1 = {
  id: 1, name: 'Valley of Elah', theme: 'hills', complete: true, start: 'outskirts',
  rooms: [outskirts(), brook(), picket(), arena()],
};
