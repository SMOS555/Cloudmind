const fs = require('fs');
const { PNG } = require('pngjs');
const { traceBoundary, rdp, pathToSvg } = require('./contour_trace.cjs');

function processImage(filePath) {
  const data = fs.readFileSync(filePath);
  const png = PNG.sync.read(data);
  const W = png.width, H = png.height;

  const isMuscle = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (W * y + x) << 2;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      const maxVal = Math.max(r, g, b);
      if (maxVal > 115) {
        isMuscle[W * y + x] = 1;
      }
    }
  }

  const grid = new Int32Array(W * H).fill(-1);
  let compCount = 0;
  const compInfo = [];

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = W * y + x;
      if (isMuscle[idx] && grid[idx] === -1) {
        const compId = compCount++;
        const q = [idx];
        grid[idx] = compId;
        let minX = x, maxX = x, minY = y, maxY = y;
        let count = 0;
        let firstX = x, firstY = y;

        let head = 0;
        while (head < q.length) {
          const cur = q[head++];
          count++;
          const cx = cur % W;
          const cy = Math.floor(cur / W);
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;

          const neighbors = [
            cx > 0 ? cur - 1 : -1,
            cx < W - 1 ? cur + 1 : -1,
            cy > 0 ? cur - W : -1,
            cy < H - 1 ? cur + W : -1,
          ];
          for (const n of neighbors) {
            if (n >= 0 && isMuscle[n] && grid[n] === -1) {
              grid[n] = compId;
              q.push(n);
            }
          }
        }

        if (count > 50) {
          compInfo.push({
            id: compId,
            count,
            minX, maxX, minY, maxY,
            centerX: Math.round((minX + maxX) / 2),
            centerY: Math.round((minY + maxY) / 2),
            startX: firstX,
            startY: firstY,
          });
        }
      }
    }
  }

  console.log('Total valid components:', compInfo.length);

  // For each component, trace boundary
  const traces = [];
  for (const c of compInfo) {
    const rawBoundary = traceBoundary(grid, W, H, c.startX, c.startY, c.id);
    const simplified = rdp(rawBoundary, 1.2); // smooth out minor pixel stepping
    const svgPath = pathToSvg(simplified);
    traces.push({
      ...c,
      path: svgPath,
      pointCount: simplified.length,
    });
  }

  return { W, H, traces };
}

const res = processImage('public/anatomy-front.png');
console.log('Processed front. Example trace 0:', res.traces[0].path.slice(0, 100));

// Output a preview SVG to inspect visually
let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${res.W} ${res.H}" width="${res.W}" height="${res.H}" style="background:#0F0F1E">`;
for (const t of res.traces) {
  svgContent += `\n  <path d="${t.path}" fill="#E2E8F0" stroke="#000000" stroke-width="2" />`;
}
svgContent += '\n</svg>';
fs.writeFileSync('public/test-preview.svg', svgContent);
console.log('Saved test-preview.svg successfully');
