const fs = require('fs');
const { PNG } = require('pngjs');
const { traceBoundary, rdp, pathToSvg } = require('./contour_trace.cjs');

function extractComponents(filePath, threshold, minPixels) {
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
          const rawBoundary = traceBoundary(grid, W, H, firstX, firstY, compId);
          const simplified = rdp(rawBoundary, 1.1); // high fidelity tracing
          const path = pathToSvg(simplified);
          compInfo.push({
            id: compId,
            count,
            minX, maxX, minY, maxY,
            centerX: Math.round((minX + maxX) / 2),
            centerY: Math.round((minY + maxY) / 2),
            path
          });
        }
      }
    }
  }

  compInfo.sort((a,b) => a.minY - b.minY);
  return { W, H, compInfo };
}

// 1. FRONT CLASSIFIER
function classifyFront(comp) {
  const { centerY, centerX, minX, maxX, minY, maxY } = comp;
  const isLeft = centerX < 283; // anatomic left/right

  // Trapezius / Neck
  if (centerY < 190 && centerX > 240 && centerX < 325) {
    return { key: 'traps', label: 'Trapezius' };
  }

  // Chest (Pecs): centerY between 190 and 255, central region
  if (centerY >= 190 && centerY <= 255 && centerX >= 225 && centerX <= 340) {
    if (centerY < 215) return { key: 'chest', label: isLeft ? 'Left Upper Pec' : 'Right Upper Pec' };
    if (centerY < 235) return { key: 'chest', label: isLeft ? 'Left Mid Pec' : 'Right Mid Pec' };
    return { key: 'chest', label: isLeft ? 'Left Lower Pec' : 'Right Lower Pec' };
  }

  // Shoulders (Front / Lateral Deltoids)
  if (centerY >= 185 && centerY <= 255 && (centerX < 230 || centerX > 335)) {
    return { key: 'deltoids_front', label: isLeft ? 'Left Front Deltoid' : 'Right Front Deltoid' };
  }

  // Biceps / Arms upper
  if (centerY >= 230 && centerY <= 315 && (centerX < 232 || centerX > 335)) {
    return { key: 'biceps', label: isLeft ? 'Left Bicep' : 'Right Bicep' };
  }

  // Abs (Rectus Abdominis): center columns 255..310, centerY 250..385
  if (centerY >= 250 && centerY <= 385 && centerX >= 255 && centerX <= 310) {
    if (centerY < 275) return { key: 'abs', label: 'Upper Abs (Top Pack)' };
    if (centerY < 300) return { key: 'abs', label: 'Upper Abs (2nd Pack)' };
    if (centerY < 330) return { key: 'abs', label: 'Mid Abs (3rd Pack)' };
    return { key: 'abs', label: 'Lower Abs' };
  }

  // Obliques / Serratus: flanks of torso
  if (centerY >= 255 && centerY <= 385 && (centerX < 256 || centerX > 309)) {
    return { key: 'obliques', label: isLeft ? 'Left Oblique' : 'Right Oblique' };
  }

  // Forearms
  if (centerY >= 312 && centerY <= 430 && (centerX < 230 || centerX > 335)) {
    return { key: 'forearms', label: isLeft ? 'Left Forearm' : 'Right Forearm' };
  }

  // Quads (Thighs)
  if (centerY >= 360 && centerY <= 545) {
    return { key: 'quads', label: isLeft ? 'Left Quad' : 'Right Quad' };
  }

  // Calves / Shins
  if (centerY >= 545 && centerY <= 720) {
    return { key: 'calves_front', label: isLeft ? 'Left Calf/Shin' : 'Right Calf/Shin' };
  }

  return { key: 'core', label: 'Core' };
}

// 2. BACK CLASSIFIER
function classifyBack(comp) {
  const { centerY, centerX } = comp;
  const isLeft = centerX < 155;

  // Traps: upper back center
  if (centerY < 145 && centerX >= 120 && centerX <= 190) {
    return { key: 'traps', label: 'Trapezius' };
  }

  // Rear Delts
  if (centerY >= 85 && centerY <= 125 && (centerX < 125 || centerX > 185)) {
    return { key: 'deltoids_rear', label: isLeft ? 'Left Rear Delt' : 'Right Rear Delt' };
  }

  // Lats
  if (centerY >= 115 && centerY <= 180 && centerX >= 112 && centerX <= 198) {
    return { key: 'lats', label: isLeft ? 'Left Lat' : 'Right Lat' };
  }

  // Triceps
  if (centerY >= 115 && centerY <= 165 && (centerX < 112 || centerX > 198)) {
    return { key: 'triceps', label: isLeft ? 'Left Tricep' : 'Right Tricep' };
  }

  // Forearms rear
  if (centerY >= 163 && centerY <= 220 && (centerX < 115 || centerX > 195)) {
    return { key: 'forearms', label: isLeft ? 'Left Forearm' : 'Right Forearm' };
  }

  // Glutes
  if (centerY >= 170 && centerY <= 225 && centerX >= 120 && centerX <= 190) {
    return { key: 'glutes', label: isLeft ? 'Left Glute' : 'Right Glute' };
  }

  // Hamstrings
  if (centerY >= 224 && centerY <= 290) {
    return { key: 'hamstrings', label: isLeft ? 'Left Hamstring' : 'Right Hamstring' };
  }

  // Calves rear
  if (centerY >= 295 && centerY <= 360) {
    return { key: 'calves_back', label: isLeft ? 'Left Calf' : 'Right Calf' };
  }

  return { key: 'lats', label: 'Back' };
}

// 3. SIDE CLASSIFIER
function classifySide(comp) {
  const { centerY, centerX } = comp;

  if (centerY < 80) return { key: 'deltoids_side', label: 'Neck / Upper Shoulder' };
  if (centerY >= 75 && centerY <= 115 && centerX < 155) return { key: 'deltoids_side', label: 'Lateral Deltoid' };
  if (centerY >= 85 && centerY <= 135 && centerX >= 150) return { key: 'chest', label: 'Chest Profile' };
  if (centerY >= 105 && centerY <= 155 && centerX < 152) return { key: 'triceps', label: 'Tricep Profile' };
  if (centerY >= 115 && centerY <= 170 && centerX >= 152) return { key: 'obliques', label: 'Obliques / Abs Profile' };
  if (centerY >= 140 && centerY <= 190 && centerX < 168) return { key: 'forearms', label: 'Forearm Lateral' };
  if (centerY >= 160 && centerY <= 220) return { key: 'glutes', label: 'Glute Profile' };
  if (centerY >= 200 && centerY <= 280 && centerX >= 140) return { key: 'quads', label: 'Quad Lateral' };
  if (centerY >= 200 && centerY <= 280 && centerX < 140) return { key: 'hamstrings', label: 'Hamstring Lateral' };
  if (centerY >= 285) return { key: 'calves_front', label: 'Calf Lateral' };

  return { key: 'deltoids_side', label: 'Lateral Profile' };
}

// RUN FOR ALL THREE
const front = extractComponents('public/anatomy-front.png', 115, 45);
const back = extractComponents('public/anatomy-back.png', 110, 25);
const side = extractComponents('public/anatomy-side.png', 110, 25);

const frontMuscles = front.compInfo.map(c => {
  const meta = classifyFront(c);
  return { key: meta.key, label: meta.label, path: c.path };
});

const backMuscles = back.compInfo.map(c => {
  const meta = classifyBack(c);
  return { key: meta.key, label: meta.label, path: c.path };
});

const sideMuscles = side.compInfo.map(c => {
  const meta = classifySide(c);
  return { key: meta.key, label: meta.label, path: c.path };
});

const resultData = {
  front: { width: front.W, height: front.H, muscles: frontMuscles },
  back: { width: back.W, height: back.H, muscles: backMuscles },
  side: { width: side.W, height: side.H, muscles: sideMuscles },
};

const outputContent = `// Auto-generated high-fidelity anatomical muscle vector contours
// Extracted with pixel-perfect precision directly from anatomical illustrations
export const MUSCLE_VECTOR_DATA = ${JSON.stringify(resultData, null, 2)};
`;

fs.writeFileSync('src/data/muscleVectorPaths.js', outputContent);
console.log('Successfully wrote high-fidelity muscleVectorPaths.js!');
console.log(`Front muscles: ${frontMuscles.length}, Back muscles: ${backMuscles.length}, Side muscles: ${sideMuscles.length}`);
