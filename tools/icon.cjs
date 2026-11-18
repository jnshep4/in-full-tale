// Draws the home-screen icons (the ring on a dusk field) and writes icon-180.png and icon-512.png.
// Run once: node tools/icon.cjs
const { chromium } = require('playwright'); const fs = require('node:fs'); const path = require('node:path');
(async () => {
  const b = await chromium.launch(), p = await b.newPage();
  for (const size of [180, 512]) {
    const url = await p.evaluate((size) => {
      const RING = ['..oooo.l', '.ollllol', 'olmoomlo', 'olo..omo', 'omo..odo', 'ommoomdo', '.omdddo.', '..oooo..'], COL = { o: '#6b5a43', l: '#fffaea', m: '#f1e2c0', d: '#c8ad82' };
      const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'), u = size / 16;
      const gr = g.createLinearGradient(0, 0, 0, size); gr.addColorStop(0, '#0b0919'); gr.addColorStop(0.55, '#4a2145'); gr.addColorStop(0.8, '#d5653a'); gr.addColorStop(1, '#ffd88c'); g.fillStyle = gr; g.fillRect(0, 0, size, size);
      g.fillStyle = '#19131f'; g.fillRect(0, size * 0.8, size, size * 0.2);
      const glow = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.45); glow.addColorStop(0, 'rgba(255,238,190,0.5)'); glow.addColorStop(1, 'rgba(255,238,190,0)'); g.fillStyle = glow; g.fillRect(0, 0, size, size);
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const ch = RING[y][x]; if (ch === '.') continue; g.fillStyle = COL[ch]; g.fillRect(Math.round((4 + x) * u), Math.round((4 + y) * u), Math.ceil(u), Math.ceil(u)); }
      return c.toDataURL('image/png');
    }, size);
    fs.writeFileSync(path.join(__dirname, '..', `icon-${size}.png`), Buffer.from(url.split(',')[1], 'base64'));
  }
  await b.close();
})();
