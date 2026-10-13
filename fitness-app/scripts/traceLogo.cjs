const fs = require('fs');
const zlib = require('zlib');

function decodePNG(buffer) {
  let offset = 8;
  let width, height;
  let idatBuffers = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.slice(offset + 8, offset + 8 + length);
    offset += 12 + length;
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
    } else if (type === 'IDAT') {
      idatBuffers.push(data);
    }
  }
  const decompressed = zlib.inflateSync(Buffer.concat(idatBuffers));
  const stride = 1 + width * 4;
  const pixels = Buffer.alloc(width * height * 4);
  let prevScanline = Buffer.alloc(width * 4);

  for (let y = 0; y < height; y++) {
    const filter = decompressed[y * stride];
    const scanline = decompressed.slice(y * stride + 1, (y + 1) * stride);
    const currScanline = Buffer.alloc(width * 4);
    for (let x = 0; x < width * 4; x++) {
      let byte = scanline[x];
      const a = x >= 4 ? currScanline[x - 4] : 0;
      const b = prevScanline[x];
      const c = x >= 4 ? prevScanline[x - 4] : 0;
      if (filter === 0) currScanline[x] = byte;
      else if (filter === 1) currScanline[x] = (byte + a) & 0xff;
      else if (filter === 2) currScanline[x] = (byte + b) & 0xff;
      else if (filter === 3) currScanline[x] = (byte + Math.floor((a + b) / 2)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        let pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
        currScanline[x] = (byte + pr) & 0xff;
      }
    }
    currScanline.copy(pixels, y * width * 4);
    prevScanline = currScanline;
  }
  return { width, height, pixels };
}

const inputPath = 'C:/Users/hp/.gemini/antigravity/brain/17a5f18f-8600-45de-9bb8-965aaeb51400/.user_uploaded/media_1791739852234_72df6703.png';
const { width, height, pixels } = decodePNG(fs.readFileSync(inputPath));

// Find bounding box of dark pixels
let minX = width, maxX = 0, minY = height, maxY = 0;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4;
    const lum = (pixels[idx] + pixels[idx+1] + pixels[idx+2]) / 3;
    if (lum < 110) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

console.log('Bounding box:', { minX, maxX, minY, maxY });
const w = maxX - minX;
const h = maxY - minY;

// March top points
const topPts = [];
for (let x = minX; x <= maxX; x++) {
  for (let y = minY; y <= maxY; y++) {
    const idx = (y * width + x) * 4;
    const lum = (pixels[idx] + pixels[idx+1] + pixels[idx+2]) / 3;
    if (lum < 110) {
      topPts.push({ x: (x - minX) / w * 1000, y: (y - minY) / h * 333 });
      break;
    }
  }
}

// March bottom points
const botPts = [];
for (let x = maxX; x >= minX; x--) {
  for (let y = maxY; y >= minY; y--) {
    const idx = (y * width + x) * 4;
    const lum = (pixels[idx] + pixels[idx+1] + pixels[idx+2]) / 3;
    if (lum < 110) {
      botPts.push({ x: (x - minX) / w * 1000, y: (y - minY) / h * 333 });
      break;
    }
  }
}

function simplify(points, tolerance) {
  if (points.length <= 2) return points;
  let maxDist = 0;
  let index = 0;
  const p1 = points[0];
  const p2 = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    const num = Math.abs((p2.y - p1.y) * p.x - (p2.x - p1.x) * p.y + p2.x * p1.y - p2.y * p1.x);
    const den = Math.hypot(p2.y - p1.y, p2.x - p1.x);
    const dist = den === 0 ? 0 : num / den;
    if (dist > maxDist) {
      maxDist = dist;
      index = i;
    }
  }

  if (maxDist > tolerance) {
    const r1 = simplify(points.slice(0, index + 1), tolerance);
    const r2 = simplify(points.slice(index), tolerance);
    return r1.slice(0, r1.length - 1).concat(r2);
  } else {
    return [p1, p2];
  }
}

const simpTop = simplify(topPts, 1.2);
const simpBot = simplify(botPts, 1.2);
const fullPts = [...simpTop, ...simpBot];

console.log('Simplified points count:', fullPts.length);

let d = 'M ' + fullPts[0].x.toFixed(1) + ' ' + fullPts[0].y.toFixed(1);
for (let i = 1; i < fullPts.length; i++) {
  d += ' L ' + fullPts[i].x.toFixed(1) + ' ' + fullPts[i].y.toFixed(1);
}
d += ' Z';

const svg = `<svg viewBox="0 0 1000 333" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path d="${d}" />
</svg>`;

fs.writeFileSync('public/bat-logo.svg', svg);
fs.writeFileSync('src/components/batLogoPath.js', `export const BAT_LOGO_PATH = "${d}";\n`);
console.log('Wrote public/bat-logo.svg and src/components/batLogoPath.js!');
