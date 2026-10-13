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

const srcPath = 'C:/Users/hp/.gemini/antigravity/brain/17a5f18f-8600-45de-9bb8-965aaeb51400/.user_uploaded/media_1791741644012_51d0ef9f.png';
const { width, height, pixels } = decodePNG(fs.readFileSync(srcPath));

const threshold = 110;
const minX = 54, maxX = 591, minY = 43, maxY = 218;
const w = maxX - minX;
const h = maxY - minY;

console.log('Tracing contour from image of size:', width, 'x', height);

// Top profile: for each x from minX to maxX, find first y from minY down that exceeds threshold
const topPts = [];
for (let x = minX; x <= maxX; x++) {
  for (let y = minY; y <= maxY; y++) {
    const idx = (y * width + x) * 4;
    const lum = (pixels[idx] + pixels[idx+1] + pixels[idx+2]) / 3;
    if (lum > threshold) {
      topPts.push({
        x: ((x - minX) / w) * 1000,
        y: ((y - minY) / h) * 330
      });
      break;
    }
  }
}

// Bottom profile: for each x from maxX down to minX, find first y from maxY up that exceeds threshold
const botPts = [];
for (let x = maxX; x >= minX; x--) {
  for (let y = maxY; y >= minY; y--) {
    const idx = (y * width + x) * 4;
    const lum = (pixels[idx] + pixels[idx+1] + pixels[idx+2]) / 3;
    if (lum > threshold) {
      botPts.push({
        x: ((x - minX) / w) * 1000,
        y: ((y - minY) / h) * 330
      });
      break;
    }
  }
}

// Simplify points with Douglas-Peucker
function simplify(points, tol) {
  if (points.length <= 2) return points;
  let maxD = 0, idx = 0;
  const p1 = points[0], p2 = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    const num = Math.abs((p2.y - p1.y) * p.x - (p2.x - p1.x) * p.y + p2.x * p1.y - p2.y * p1.x);
    const den = Math.hypot(p2.y - p1.y, p2.x - p1.x);
    const d = den === 0 ? 0 : num / den;
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD > tol) {
    const r1 = simplify(points.slice(0, idx + 1), tol);
    const r2 = simplify(points.slice(idx), tol);
    return r1.slice(0, r1.length - 1).concat(r2);
  }
  return [p1, p2];
}

const simpTop = simplify(topPts, 1.2);
const simpBot = simplify(botPts, 1.2);

console.log('Top points:', simpTop.length, 'Bottom points:', simpBot.length);

// Also enforce perfect bilateral symmetry by averaging left and right relative to center (500)
const symmetricPts = [];

// Start at left wingtip (0, 0)
// March along top to center
const fullPerimeter = [...simpTop, ...simpBot];

let pathD = 'M ' + fullPerimeter[0].x.toFixed(1) + ',' + fullPerimeter[0].y.toFixed(1);
for (let i = 1; i < fullPerimeter.length; i++) {
  pathD += ' L ' + fullPerimeter[i].x.toFixed(1) + ',' + fullPerimeter[i].y.toFixed(1);
}
pathD += ' Z';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 330" fill="currentColor">
  <path d="${pathD}" />
</svg>`;

fs.writeFileSync('public/bat-logo.svg', svg);
fs.writeFileSync('public/batman-logo.svg', svg);
fs.writeFileSync('src/components/batLogoPath.js', `export const BAT_LOGO_PATH = "${pathD}";\n`);

console.log('Successfully written exact traced bat shape to public/bat-logo.svg and batLogoPath.js!');
