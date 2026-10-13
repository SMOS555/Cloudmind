const fs = require('fs');
const { PNG } = require('pngjs');

// Moore-Neighbor Tracing algorithm
function traceBoundary(grid, W, H, startX, startY, compId) {
  // Directions: 0: E, 1: SE, 2: S, 3: SW, 4: W, 5: NW, 6: N, 7: NE
  const dx = [1, 1, 0, -1, -1, -1, 0, 1];
  const dy = [0, 1, 1, 1, 0, -1, -1, -1];

  let currentX = startX;
  let currentY = startY;
  let backtrackDir = 4; // came from west

  const path = [[startX, startY]];
  let steps = 0;
  const maxSteps = 10000;

  while (steps++ < maxSteps) {
    let found = false;
    // scan clockwise starting from (backtrackDir + 1) % 8
    const startScan = (backtrackDir + 1) % 8;
    for (let i = 0; i < 8; i++) {
      const dir = (startScan + i) % 8;
      const nx = currentX + dx[dir];
      const ny = currentY + dy[dir];
      if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
        if (grid[ny * W + nx] === compId) {
          currentX = nx;
          currentY = ny;
          backtrackDir = (dir + 4) % 8;
          found = true;
          break;
        }
      }
    }

    if (!found) break;
    if (currentX === startX && currentY === startY) break;
    path.push([currentX, currentY]);
  }

  return path;
}

// Ramer-Douglas-Peucker simplification
function rdp(points, epsilon) {
  if (points.length <= 2) return points;
  let dmax = 0;
  let index = 0;
  const a = points[0];
  const b = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    // distance from p to line a-b
    const d = perpendicularDistance(p, a, b);
    if (d > dmax) {
      index = i;
      dmax = d;
    }
  }

  if (dmax > epsilon) {
    const rec1 = rdp(points.slice(0, index + 1), epsilon);
    const rec2 = rdp(points.slice(index), epsilon);
    return rec1.slice(0, rec1.length - 1).concat(rec2);
  } else {
    return [a, b];
  }
}

function perpendicularDistance(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (dx === 0 && dy === 0) {
    return Math.hypot(p[0] - a[0], p[1] - a[1]);
  }
  const num = Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]);
  const den = Math.hypot(dx, dy);
  return num / den;
}

function pathToSvg(points) {
  if (!points || points.length === 0) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ') + ' Z';
}

module.exports = { traceBoundary, rdp, pathToSvg };
