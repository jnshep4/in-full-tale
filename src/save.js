// Progress lives in localStorage under one versioned key.
const KEY = 'inFullTale.save.v1';

export function freshSave() {
  return {
    v: 1,
    tally: 0,
    soldiers: {},      // marked soldier id -> [x, y] (fallen, trophy waiting there) or 'c' (trophy collected)
    powers: [],        // ids of powers earned
    flags: {},
    gates: {},         // 'region/room/x,y' -> 1 for every gate tile opened         // story flags (bosses beaten, scenes seen)
    at: { region: 0, room: null, link: null },
    played: 0,         // seconds
  };
}

export function loadSave(storage) {
  try {
    const raw = storage && storage.getItem(KEY);
    if (!raw) return freshSave();
    const s = JSON.parse(raw);
    if (!s || s.v !== 1) return freshSave();
    return Object.assign(freshSave(), s);
  } catch (e) { return freshSave(); }
}

export function writeSave(storage, save) {
  try { storage && storage.setItem(KEY, JSON.stringify(save)); return true; } catch (e) { return false; }
}

export function clearSave(storage) { try { storage && storage.removeItem(KEY); } catch (e) { /* storage unavailable */ } }

// Settings live under their own key, so erasing a save keeps them.
const SKEY = 'inFullTale.settings.v1';
export const defaultSettings = () => ({ sound: 0.6, music: 0.5, shake: true });
export function loadSettings(storage) {
  try { return Object.assign(defaultSettings(), JSON.parse((storage && storage.getItem(SKEY)) || '{}')); } catch (e) { return defaultSettings(); }
}
export function writeSettings(storage, st) { try { storage && storage.setItem(SKEY, JSON.stringify(st)); } catch (e) { /* storage unavailable */ } }
export const hasSave = (storage) => { try { return !!(storage && storage.getItem(KEY)); } catch (e) { return false; } };
