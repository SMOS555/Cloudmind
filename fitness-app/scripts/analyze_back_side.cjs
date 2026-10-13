const fs = require('fs');
const { PNG } = require('pngjs');
const { traceBoundary, rdp, pathToSvg } = require('./contour_trace.cjs');

function processFile(filePath, threshold, minPixels) {
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
      if (maxVal > threshold) {
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

        if (count >= minPixels) {
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

  console.log(`=== ${filePath} (count >= ${minPixels}) === Total: ${compInfo.length}`);
  compInfo.sort((a,b) => a.minY - b.minY);
  compInfo.forEach((c, i) => {
    console.log(`${i}: cnt=${c.count} x=[${c.minX}..${c.maxX}] y=[${c.minY}..${c.maxY}] center=(${c.centerX},${c.centerY})`);
  });

  return { W, H, compInfo, grid };
}

processFile('public/anatomy-back.png', 110, 25);
processFile('public/anatomy-side.png', 110, 25);
