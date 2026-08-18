// Minimal PNG writer — no image deps. Draws the Games Paglu mark:
// paper ground, thick ink border, hot circle with an offset ink square,
// echoing the neo-brutalism offset shadow.
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

const PAPER = [250, 247, 240];
const INK = [17, 17, 17];
const HOT = [255, 59, 31];

function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, pixel) {
  const raw = Buffer.alloc(size * (size * 3 + 1));
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x, y, size);
      raw[o++] = r;
      raw[o++] = g;
      raw[o++] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolour
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const mark = (x, y, s) => {
  const border = Math.round(s * 0.07);
  if (x < border || y < border || x >= s - border || y >= s - border) return INK;

  // offset ink square (the shadow)
  const sq = { x0: s * 0.34, y0: s * 0.34, x1: s * 0.78, y1: s * 0.78 };
  const inSquare = x >= sq.x0 && x < sq.x1 && y >= sq.y0 && y < sq.y1;

  // hot circle sitting on top of it
  const cx = s * 0.44;
  const cy = s * 0.44;
  const r = s * 0.22;
  const inCircle = (x - cx) ** 2 + (y - cy) ** 2 <= r * r;

  if (inCircle) return HOT;
  if (inSquare) return INK;
  return PAPER;
};

for (const size of [192, 512, 180]) {
  const name = size === 180 ? "apple-touch-icon.png" : `icon-${size}.png`;
  writeFileSync(`public/${name}`, png(size, mark));
  console.log("wrote public/" + name);
}
