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
    ],
  },
};
