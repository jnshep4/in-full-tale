// The ten captains. All names except Goliath's are invented for this game (NOTES.md).
// weak: the hit tag that deals double damage and staggers him.
//   'full'  a full-charge stone      'dash'  a dash strike          'air2' a stone loosed after a double jump
//   'wall'  a stone loosed from a wall   'sword', 'reflect', 'hang', 'swim', 'heavy'
// attacks: { id, w (weight), min/max (distance band in px), phase (2 = only below half health), tele, rest }
const bronze = { bronze: '#c98b3f', bronzeD: '#86522a', bronzeH: '#ffd680' };
export const BOSSES = {
  1: {
    name: 'Shalmek', title: 'Captain of the Picket', hp: 60, weak: 'full', weakHint: 'A FULL-CHARGE STONE STAGGERS HIM', guard: 1, gap: 1.0, keep: 70,
    look: { ...bronze, plume: ['#d8362e', '#ff8650'], cape: '#7a1f2a', kilt: '#ddd3c2', kiltD: '#a79c8e', band: '#2f5f8f', beard: '#3a2a22', weapon: 'spear', shield: true },
    attacks: [
      { id: 'thrust', w: 3, max: 150, tele: 0.55, rest: 0.9 },
      { id: 'leap', w: 2, min: 60, tele: 0.45, rest: 1.0 },
      { id: 'volley', w: 2, min: 90, phase: 2, n: 3, tele: 0.5, rest: 0.8 },
      { id: 'advance', w: 2, min: 50, max: 170, tele: 0.5, rest: 1.0 },
    ],
  },
};

Object.assign(BOSSES, {
  2: {
    name: 'Ittur', title: 'Captain of Socoh', hp: 70, weak: 'dash', weakHint: 'FLEET FOOT BREAKS HIS GUARD', guard: 2, gap: 0.9, keep: 60, speed: 1,
    look: { bronze: '#b8a070', bronzeD: '#7a6442', bronzeH: '#f0e0a8', plume: ['#2f5f8f', '#9fc2ff'], cape: '#1f3a5a', kilt: '#d8c8a8', kiltD: '#a4947a', band: '#7a1f2a', beard: '#2a2020', weapon: 'axe', shield: true },
    attacks: [
      { id: 'charge', w: 3, min: 70, tele: 0.6, v: 240 },
      { id: 'sweep', w: 3, max: 70, tele: 0.45, rest: 0.8 },
      { id: 'leap', w: 2, min: 60, phase: 2, tele: 0.4, rest: 0.9 },
      { id: 'axe', w: 3, min: 60, tele: 0.5, rest: 0.9 },
    ],
  },
  3: {
    name: 'Pashdu', title: 'Captain of Sorek', hp: 66, weak: 'air2', weakHint: "STONES LOOSED FROM A SECOND JUMP FIND HIM", guard: 1, gap: 0.8, keep: 130, speed: 1.1,
    look: { bronze: '#8fa8b8', bronzeD: '#566a7a', bronzeH: '#e0f0ff', plume: ['#e8e0c8', '#ffffff'], cape: '#3a4a6a', kilt: '#c8d0d8', kiltD: '#8c98a4', band: '#2a3a5a', beard: '#c8c8c8', weapon: 'spear', shield: false },
    attacks: [
      { id: 'volley', w: 3, min: 80, n: 3, tele: 0.45, rest: 0.7 },
      { id: 'leap', w: 2, tele: 0.35, rest: 0.8, vy: 440 },
      { id: 'thrust', w: 2, max: 140, tele: 0.45, rest: 0.8 },
      { id: 'rain', w: 2, phase: 2, n: 6, tele: 0.6, rest: 0.9 },
      { id: 'fan', w: 3, min: 70, tele: 0.5, rest: 0.8 },
    ],
  },
  4: {
    name: 'Maroz', title: 'Lion-keeper of Timnah', hp: 90, weak: 'wall', weakHint: 'STONES SLUNG FROM THE WALL STRIKE TRUE', guard: 1, gap: 0.8, keep: 60, speed: 1.05,
    look: { bronze: '#c8a04a', bronzeD: '#8a6a2a', bronzeH: '#ffe890', plume: ['#c7924a', '#ffe0a0'], cape: '#6d3f1e', kilt: '#c8b890', kiltD: '#94845e', band: '#3a602e', beard: '#6d3f1e', weapon: 'mace', shield: true },
    attacks: [
      { id: 'summon', w: 2, n: 1, kind: 'lion', tele: 0.7, rest: 0.6, limit: 2 },
      { id: 'rockfall', w: 2, n: 4, tele: 0.7, rest: 0.9 },
      { id: 'charge', w: 3, min: 80, tele: 0.55, v: 260 },
      { id: 'sweep', w: 3, max: 70, tele: 0.4, rest: 0.7 },
      { id: 'leap', w: 2, min: 60, tele: 0.4, rest: 0.9 },
    ],
  },
  5: {
    name: 'Goliath of Gath', title: 'The Champion', hp: 140, weak: 'pound', weakHint: "LION'S FALL BRINGS HIM TO HIS KNEES. ONLY THE SLING REACHES HIS BROW", giant: true, w: 26, h: 54, gap: 1.1, keep: 80, speed: 0.8,
    look: { bronze: '#c98b3f', bronzeD: '#86522a', bronzeH: '#ffd680', plume: ['#d8362e', '#ff8650'], cape: '#5a1a22', kilt: '#b8a888', kiltD: '#84765e', band: '#7a1f2a', beard: '#1a1414', weapon: 'spear', shield: false },
    attacks: [
      { id: 'sweep', w: 3, max: 110, tele: 0.7, rest: 1.0, reach: 62 },
      { id: 'stomp', w: 3, tele: 0.65, rest: 1.0 },
      { id: 'volley', w: 2, min: 110, n: 1, tele: 0.8, rest: 0.9, shot: 'beam' },
      { id: 'charge', w: 2, min: 120, phase: 2, tele: 0.8, v: 170 },
      { id: 'rockfall', w: 2, phase: 2, n: 5, tele: 0.8, rest: 1.0 },
    ],
  },
});

Object.assign(BOSSES, {
  6: {
    name: 'Akhtal', title: 'Captain of Ekron', hp: 130, weak: 'sword', weakHint: "GOLIATH'S SWORD CUTS THROUGH HIS GUARD", guard: 2, stun: 3, gap: 0.85, keep: 60, speed: 1.05,
    look: { bronze: '#8a8f6a', bronzeD: '#5a5f42', bronzeH: '#d8e0a8', plume: ['#3a602e', '#a8d070'], cape: '#2a3a22', kilt: '#c8c0a0', kiltD: '#948c70', band: '#3a602e', beard: '#3a2a22', weapon: 'axe', shield: true },
    attacks: [
      { id: 'sweep', w: 3, max: 80, tele: 0.42, rest: 0.75 },
      { id: 'charge', w: 2, min: 80, tele: 0.6, v: 250 },
      { id: 'leap', w: 2, min: 50, tele: 0.45, rest: 1.0 },
      { id: 'summon', w: 1, phase: 2, n: 1, kind: 'heavy', tele: 0.7, rest: 0.6, limit: 1 },
      { id: 'whirl', w: 3, max: 140, tele: 0.5, rest: 1.1 },
    ],
  },
  7: {
    name: 'Zeruk', title: 'Captain of the Temple Guard', hp: 150, weak: 'reflect', weakHint: 'HIS OWN MISSILES, TURNED BY THE BUCKLER, UNDO HIM', guard: 2, gap: 0.75, keep: 170, speed: 1.05,
    look: { bronze: '#c8a848', bronzeD: '#8a702a', bronzeH: '#fff0a0', plume: ['#6a2a8a', '#d090f0'], cape: '#4a1c6a', kilt: '#e0d8f0', kiltD: '#a8a0b8', band: '#6a2a8a', beard: '#d8d0c0', weapon: 'mace', shield: false },
    attacks: [
      { id: 'volley', w: 4, min: 60, n: 4, tele: 0.5, rest: 0.9, every: 0.3 },
      { id: 'rain', w: 2, n: 7, tele: 0.6, rest: 0.9 },
      { id: 'thrust', w: 2, max: 90, tele: 0.45, rest: 0.8 },
      { id: 'leap', w: 2, phase: 2, tele: 0.4, rest: 0.9 },
      { id: 'pots', w: 3, min: 50, n: 3, tele: 0.5, rest: 0.9 },
    ],
  },
  8: {
    name: 'Banith', title: 'Master of the Harbor', hp: 150, weak: 'hang', weakHint: 'STONES LOOSED FROM THE CORD STRIKE TRUE', guard: 1, gap: 0.8, keep: 70, speed: 1.1,
    look: { bronze: '#6aa8a0', bronzeD: '#3e706c', bronzeH: '#c8fff0', plume: ['#e8e0c8', '#ffffff'], cape: '#1c4458', kilt: '#d0e0e0', kiltD: '#98a8a8', band: '#1c4458', beard: '#2a2a2a', weapon: 'spear', shield: true },
    attacks: [
      { id: 'stomp', w: 3, tele: 0.5, rest: 0.8 },
      { id: 'charge', w: 2, min: 80, tele: 0.5, v: 280 },
      { id: 'volley', w: 2, min: 80, n: 3, tele: 0.45, rest: 0.7 },
      { id: 'leap', w: 2, tele: 0.4, rest: 0.9, vy: 460 },
      { id: 'tide', w: 2, tele: 0.9, rest: 0.8 },
    ],
  },
  9: {
    name: 'Yishvar', title: 'Keeper of the Gates', hp: 140, weak: 'swim', weakHint: 'STONES LOOSED FROM THE CISTERN STRIKE TRUE', guard: 1, gap: 0.75, keep: 80, speed: 1.1,
    look: { bronze: '#e0b060', bronzeD: '#a8763e', bronzeH: '#fff0b0', plume: ['#f0e8d0', '#ffffff'], cape: '#b04a20', kilt: '#f0e0c0', kiltD: '#b8a888', band: '#b04a20', beard: '#2a1a14', weapon: 'sword', shield: true },
    attacks: [
      { id: 'thrust', w: 3, max: 150, tele: 0.45, rest: 0.8 },
      { id: 'leap', w: 2, min: 60, tele: 0.4, rest: 0.9 },
      { id: 'volley', w: 2, min: 90, n: 3, tele: 0.45, rest: 0.7 },
      { id: 'charge', w: 2, min: 90, tele: 0.5, v: 280 },
      { id: 'rain', w: 2, phase: 2, n: 6, tele: 0.6, rest: 0.8 },
      { id: 'bolts', w: 3, min: 70, tele: 0.6, rest: 0.9 },
    ],
  },
  10: {
    name: 'Seren Orphaz', title: 'Lord of Gath', hp: 300, weak: 'heavy', weakHint: 'THE SMOOTH STONE BREAKS HIS GUARD', guard: 2, gap: 0.5, keep: 70, speed: 1.2, w: 18, h: 36,
    look: { bronze: '#3a3440', bronzeD: '#221e28', bronzeH: '#ffd680', plume: ['#d8362e', '#ffb060'], cape: '#7a1f2a', kilt: '#2a2630', kiltD: '#18161c', band: '#ffd680', beard: '#c8c8c8', weapon: 'sword', shield: true },
    attacks: [
      { id: 'sweep', w: 3, max: 80, tele: 0.4, rest: 0.7 },
      { id: 'thrust', w: 2, max: 160, tele: 0.42, rest: 0.75 },
      { id: 'leap', w: 2, min: 50, tele: 0.38, rest: 0.85 },
      { id: 'volley', w: 2, min: 90, n: 4, tele: 0.45, rest: 0.7 },
      { id: 'rain', w: 2, phase: 2, n: 7, tele: 0.55, rest: 0.8 },
      { id: 'summon', w: 1, phase: 2, n: 1, kind: 'heavy', tele: 0.7, rest: 0.6, limit: 1 },
      { id: 'charge', w: 2, min: 100, phase: 2, tele: 0.5, v: 290 },
      { id: 'step', w: 3, min: 60, tele: 0.35, rest: 0.8 },
    ],
  },
});
