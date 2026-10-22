// Generates PWA icons (PNG) without external dependencies.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encodePng(size, pixels) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function distSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
const smooth = (e0, e1, x) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;

function render(size, maskable) {
  const px = Buffer.alloc(size * size * 4);
  const radius = maskable ? 0 : size * 0.22;
  const pad = maskable ? size * 0.2 : size * 0.26;
  const left = pad, right = size - pad, top = pad, bottom = size - pad;
  const stroke = size * 0.075;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      // rounded square mask
      let alpha = 1;
      if (radius > 0) {
        const cx = Math.min(Math.max(x, radius), size - radius);
        const cy = Math.min(Math.max(y, radius), size - radius);
        const d = Math.hypot(x - cx, y - cy);
        alpha = 1 - smooth(radius - 1, radius + 1, d);
      }
      // diagonal gradient navy -> cyan
      const g = (x + y) / (2 * size);
      let r = mix(10, 14, g), gr = mix(20, 165, g * g * 1.3), b = mix(40, 233, g);
      // soft glow top-right
      const glow = Math.max(0, 1 - Math.hypot(x - size * 0.82, y - size * 0.18) / (size * 0.6));
      r = mix(r, 52, glow * 0.35); gr = mix(gr, 211, glow * 0.35); b = mix(b, 153, glow * 0.35);
      // letter N
      const d1 = distSeg(x, y, left, top, left, bottom);
      const d2 = distSeg(x, y, right, top, right, bottom);
      const d3 = distSeg(x, y, left, top, right, bottom);
      const d = Math.min(d1, d2, d3);
      const ink = 1 - smooth(stroke / 2 - 1, stroke / 2 + 1, d);
      r = mix(r, 255, ink); gr = mix(gr, 255, ink); b = mix(b, 255, ink);
      px[i] = Math.round(r); px[i + 1] = Math.round(gr); px[i + 2] = Math.round(b);
      px[i + 3] = Math.round(alpha * 255);
    }
  }
  return encodePng(size, px);
}

const out = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'icon-192.png'), render(192, false));
fs.writeFileSync(path.join(out, 'icon-512.png'), render(512, false));
fs.writeFileSync(path.join(out, 'icon-maskable-512.png'), render(512, true));
fs.writeFileSync(path.join(out, 'apple-touch-icon.png'), render(180, true));
console.log('Icons generated in', out);
