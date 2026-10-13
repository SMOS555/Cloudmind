const fs = require('fs');

// Nolan Dark Knight Bat-Symbol
// Symmetrical, razor sharp, exact proportions (3:1 width:height)
// Standard coordinate space: 0 to 1000 X, 0 to 330 Y.
// Center line at X = 500.

const pathData = `M 0,0 
L 335,0 
C 348,28 362,56 385,73 
L 446,73 
L 462,12 
L 476,52 
L 524,52 
L 538,12 
L 554,73 
L 615,73 
C 638,56 652,28 665,0 
L 1000,0 
C 920,65 870,120 855,175 
C 830,195 805,204 778,204 
C 735,204 690,212 650,226 
C 600,245 550,280 500,330 
C 450,280 400,245 350,226 
C 310,212 265,204 222,204 
C 195,204 170,195 145,175 
C 130,120 80,65 0,0 Z`;

const cleanSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 330" fill="currentColor">
  <path d="${pathData.replace(/\s+/g, ' ').trim()}" />
</svg>`;

fs.writeFileSync('public/bat-logo.svg', cleanSvg);
fs.writeFileSync('public/batman-logo.svg', cleanSvg);

// Export JS constant
fs.writeFileSync('src/components/batLogoPath.js', `export const BAT_LOGO_PATH = "${pathData.replace(/\s+/g, ' ').trim()}";\n`);

console.log('Generated clean vector Bat-Symbol SVG!');
