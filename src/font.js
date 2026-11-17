// 3x5 pixel font. Each glyph is five rows, one octal digit per row (bit 4 = left pixel).
const G = {
  A: '25755', B: '65656', C: '34443', D: '65556', E: '74647', F: '74644', G: '34553', H: '55755', I: '72227',
  J: '11152', K: '55655', L: '44447', M: '57755', N: '65555', O: '75557', P: '65644', Q: '25563', R: '65655',
  S: '34216', T: '72222', U: '55557', V: '55552', W: '55775', X: '55255', Y: '55222', Z: '71247',
  0: '75557', 1: '26227', 2: '61247', 3: '61216', 4: '55711', 5: '74616', 6: '34757', 7: '71222', 8: '75757', 9: '75716',
  '/': '11244', ':': '02020', '.': '00002', ',': '00024', '!': '22202', '?': '61202', '-': '00700', '+': '02720',
  "'": '22000', '(': '12221', ')': '42224',
};
export function textWidth(s, scale = 1) { return s.length * 4 * scale - scale; }
export function drawText(ctx, s, x, y, color = '#fff', scale = 1, shadow = '#0b0812') {
  s = String(s).toUpperCase();
  for (let pass = shadow ? 0 : 1; pass < 2; pass++) {
    ctx.fillStyle = pass ? color : shadow;
    const ox = pass ? 0 : scale, oy = pass ? 0 : scale;
    for (let i = 0; i < s.length; i++) {
      const g = G[s[i]]; if (!g) continue;
      for (let r = 0; r < 5; r++) {
        const bits = +g[r];
        for (let c = 0; c < 3; c++) if (bits & (4 >> c)) ctx.fillRect(x + ox + (i * 4 + c) * scale, y + oy + r * scale, scale, scale);
      }
    }
  }
}
