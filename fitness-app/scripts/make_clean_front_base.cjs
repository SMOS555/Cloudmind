const fs = require('fs');
const { PNG } = require('pngjs');

const data = fs.readFileSync('public/anatomy-front.png');
const png = PNG.sync.read(data);
const W = png.width, H = png.height;

// For each pixel, if it's part of a muscle (max(r,g,b) > 110), convert it to clean athletic white/light grey
// In anatomy-front.png, calves/forearms have r~220-240, g~220-240, b~220-240.
// Let's preserve shading (brightness) but make it neutral grey/white.
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const idx = (W * y + x) << 2;
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    const a = png.data[idx + 3];

    const maxVal = Math.max(r, g, b);
    if (maxVal > 105) {
      // Calculate luminance
      const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      // Map to athletic white range [215..245]
      const targetVal = Math.min(245, Math.max(215, Math.round(180 + lum * 0.28)));
      png.data[idx] = targetVal;
      png.data[idx + 1] = targetVal;
      png.data[idx + 2] = Math.min(255, targetVal + 5); // subtle cool white
    }
  }
}

fs.writeFileSync('public/anatomy-front-clean.png', PNG.sync.write(png));
console.log('Created public/anatomy-front-clean.png');
