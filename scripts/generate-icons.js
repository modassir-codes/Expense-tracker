import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

// Function to render a rounded rectangle with stylized icon
function createIconPNG(size, isMaskable = false) {
  const png = new PNG({ width: size, height: size });
  const scale = size / 512;
  const padding = isMaskable ? 0.18 : 0.08; // Safe zone for maskable

  // Colors
  const bgDark = [12, 12, 12, 255]; // #0c0c0c
  const bgGrad = [20, 20, 20, 255]; // #141414
  const emeraldBright = [52, 211, 153, 255]; // #34d399
  const emeraldMid = [16, 185, 129, 255]; // #10b981
  const emeraldDark = [5, 150, 105, 255]; // #059669
  const borderGrey = [40, 40, 40, 255];
  const cardBg = [23, 23, 23, 255];

  const cornerRadius = isMaskable ? 0 : size * 0.22;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;

      // Check rounded corner distance
      if (!isMaskable) {
        let inside = true;
        const r = cornerRadius;
        if (x < r && y < r) {
          inside = (x - r) * (x - r) + (y - r) * (y - r) <= r * r;
        } else if (x > size - r && y < r) {
          inside = (x - (size - r)) * (x - (size - r)) + (y - r) * (y - r) <= r * r;
        } else if (x < r && y > size - r) {
          inside = (x - r) * (x - r) + (y - (size - r)) * (y - (size - r)) <= r * r;
        } else if (x > size - r && y > size - r) {
          inside = (x - (size - r)) * (x - (size - r)) + (y - (size - r)) * (y - (size - r)) <= r * r;
        }

        if (!inside) {
          png.data[idx] = 0;
          png.data[idx + 1] = 0;
          png.data[idx + 2] = 0;
          png.data[idx + 3] = 0;
          continue;
        }
      }

      // Background gradient (top-left to bottom-right)
      const gradFactor = (x + y) / (size * 2);
      png.data[idx] = Math.round(bgGrad[0] * (1 - gradFactor) + bgDark[0] * gradFactor);
      png.data[idx + 1] = Math.round(bgGrad[1] * (1 - gradFactor) + bgDark[1] * gradFactor);
      png.data[idx + 2] = Math.round(bgGrad[2] * (1 - gradFactor) + bgDark[2] * gradFactor);
      png.data[idx + 3] = 255;

      // Coordinate mapping into 512x512 space with safe padding
      const effectiveSize = size * (1 - padding * 2);
      const offsetX = size * padding;
      const offsetY = size * padding;

      const normX = ((x - offsetX) / effectiveSize) * 512;
      const normY = ((y - offsetY) / effectiveSize) * 512;

      if (normX >= 0 && normX <= 512 && normY >= 0 && normY <= 512) {
        // Draw Wallet Card: (96, 120) to (416, 390)
        const cardX1 = 100, cardY1 = 125, cardX2 = 412, cardY2 = 385;
        const cardR = 36;
        
        const inCardBox = (normX >= cardX1 && normX <= cardX2 && normY >= cardY1 && normY <= cardY2);
        if (inCardBox) {
          let inCard = true;
          if (normX < cardX1 + cardR && normY < cardY1 + cardR) {
            inCard = Math.hypot(normX - (cardX1 + cardR), normY - (cardY1 + cardR)) <= cardR;
          } else if (normX > cardX2 - cardR && normY < cardY1 + cardR) {
            inCard = Math.hypot(normX - (cardX2 - cardR), normY - (cardY1 + cardR)) <= cardR;
          } else if (normX < cardX1 + cardR && normY > cardY2 - cardR) {
            inCard = Math.hypot(normX - (cardX1 + cardR), normY - (cardY2 - cardR)) <= cardR;
          } else if (normX > cardX2 - cardR && normY > cardY2 - cardR) {
            inCard = Math.hypot(normX - (cardX2 - cardR), normY - (cardY2 - cardR)) <= cardR;
          }

          if (inCard) {
            // Card Border vs Card Body
            const distToBorder = Math.min(
              normX - cardX1,
              cardX2 - normX,
              normY - cardY1,
              cardY2 - normY
            );

            if (distToBorder <= 10) {
              // Emerald border
              png.data[idx] = emeraldMid[0];
              png.data[idx + 1] = emeraldMid[1];
              png.data[idx + 2] = emeraldMid[2];
            } else {
              // Card inner body
              png.data[idx] = cardBg[0];
              png.data[idx + 1] = cardBg[1];
              png.data[idx + 2] = cardBg[2];
            }

            // Wallet button/clasp at (360, 255)
            const claspDist = Math.hypot(normX - 360, normY - 255);
            if (claspDist <= 20) {
              png.data[idx] = emeraldBright[0];
              png.data[idx + 1] = emeraldBright[1];
              png.data[idx + 2] = emeraldBright[2];
            } else if (claspDist <= 24) {
              png.data[idx] = 10;
              png.data[idx + 1] = 10;
              png.data[idx + 2] = 10;
            }

            // Wallet top slot line
            if (Math.abs(normY - 185) <= 3 && normX >= cardX1 + 15 && normX <= cardX2 - 15) {
              png.data[idx] = borderGrey[0];
              png.data[idx + 1] = borderGrey[1];
              png.data[idx + 2] = borderGrey[2];
            }

            // Stylized Rupee symbol:
            // Top bar: (170, 215) to (290, 230)
            if (normX >= 170 && normX <= 290 && normY >= 215 && normY <= 231) {
              png.data[idx] = emeraldBright[0];
              png.data[idx + 1] = emeraldBright[1];
              png.data[idx + 2] = emeraldBright[2];
            }
            // Second bar: (170, 250) to (270, 265)
            if (normX >= 170 && normX <= 270 && normY >= 250 && normY <= 266) {
              png.data[idx] = emeraldBright[0];
              png.data[idx + 1] = emeraldBright[1];
              png.data[idx + 2] = emeraldBright[2];
            }
            // Vertical stem: (185, 215) to (203, 335)
            if (normX >= 185 && normX <= 203 && normY >= 215 && normY <= 335) {
              png.data[idx] = emeraldBright[0];
              png.data[idx + 1] = emeraldBright[1];
              png.data[idx + 2] = emeraldBright[2];
            }
            // Upper curve of R / Rupee: circle arc centered around (200, 258), radius ~45
            const arcDist = Math.hypot(normX - 200, normY - 258);
            if (normX >= 200 && arcDist >= 36 && arcDist <= 54) {
              png.data[idx] = emeraldBright[0];
              png.data[idx + 1] = emeraldBright[1];
              png.data[idx + 2] = emeraldBright[2];
            }
            // Diagonal leg: line from (220, 295) to (280, 360)
            const legDist = Math.abs((360 - 295) * normX - (280 - 220) * normY + 280 * 295 - 360 * 220) / Math.hypot(360 - 295, 280 - 220);
            if (legDist <= 9 && normX >= 218 && normX <= 282 && normY >= 295 && normY <= 362) {
              png.data[idx] = emeraldBright[0];
              png.data[idx + 1] = emeraldBright[1];
              png.data[idx + 2] = emeraldBright[2];
            }
          }
        }
      }
    }
  }

  return PNG.sync.write(png);
}

// Generate the icons
const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating PWA icons in /public...');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createIconPNG(192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createIconPNG(512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createIconPNG(512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createIconPNG(180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createIconPNG(64, false));
console.log('Icons successfully generated!');
