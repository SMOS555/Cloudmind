const fs = require('fs');
const { PNG } = require('pngjs');

function analyze(filePath) {
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
      if (maxVal > 110) {
        isMuscle[W * y + x] = 1;
      }
    }
  }

  const visited = new Uint8Array(W * H);
  const components = [];

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = W * y + x;
      if (isMuscle[idx] && !visited[idx]) {
        const q = [idx];
        visited[idx] = 1;
        let minX = x, maxX = x, minY = y, maxY = y;
        let count = 0;

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
            if (n >= 0 && isMuscle[n] && !visited[n]) {
              visited[n] = 1;
              q.push(n);
            }
          }
        }

        if (count > 50) {
          components.push({
            count,
            minX, maxX, minY, maxY,
            centerX: Math.round((minX + maxX) / 2),
            centerY: Math.round((minY + maxY) / 2),
          });
        }
      }
    }
  }

  console.log(filePath, 'Total components > 50px:', components.length);
  components.sort((a,b) => a.minY - b.minY);
  components.forEach((c, i) => {
    console.log(`${i}: count=${c.count} x=[${c.minX}..${c.maxX}] y=[${c.minY}..${c.maxY}] center=(${c.centerX}, ${c.centerY})`);
  });
}

analyze('public/anatomy-front.png');
