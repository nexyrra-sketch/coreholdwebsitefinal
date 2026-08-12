/**
 * Generates the Open Graph image, PNG favicons and apple-touch-icon
 * from the vector mark. Run: npm run og
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const EMBER = '#D9632B';
const INK = '#0C0C0A';

const mark = (x, y, k) => `
  <g transform="translate(${x} ${y}) scale(${k})">
    <path fill="${EMBER}" d="M0 0h313v70H70v245H0z"/>
    <rect fill="${EMBER}" x="221" y="221" width="232" height="232"/>
    <path fill="${EMBER}" d="M674 674H361v-70h243V361h70z"/>
  </g>`;

const og = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="${INK}"/>
  ${Array.from({ length: 40 }, (_, i) =>
    `<rect x="${(i * 30) % 1200}" y="${Math.floor(i / 40 * 630)}" width="0" height="0"/>`
  ).join('')}
  <g opacity="0.05">
    ${Array.from({ length: 24 }, (_, r) =>
      Array.from({ length: 40 }, (_, c) =>
        `<circle cx="${c * 30 + 15}" cy="${r * 27 + 12}" r="1" fill="#EDE7DC"/>`
      ).join('')
    ).join('')}
  </g>
  ${mark(96, 175, 0.415)}
  <text x="480" y="268" fill="#EDE7DC" font-family="DejaVu Sans, sans-serif" font-size="58" font-weight="600" letter-spacing="-1">Own the system your</text>
  <text x="480" y="338" fill="#EDE7DC" font-family="DejaVu Sans, sans-serif" font-size="58" font-weight="600" letter-spacing="-1">business runs on.</text>
  <text x="480" y="408" fill="${EMBER}" font-family="DejaVu Sans, sans-serif" font-size="58" font-weight="600" letter-spacing="-1">Stop renting it.</text>
  <text x="482" y="472" fill="#A9A294" font-family="DejaVu Sans Mono, monospace" font-size="19" letter-spacing="4">COREHOLD — INTELLIGENT SYSTEMS STUDIO, DUBAI</text>
</svg>`;

const icon = (size, pad) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="${INK}"/>
  ${mark(pad, pad, (size - pad * 2) / 674)}
</svg>`;

await mkdir('public', { recursive: true });
await sharp(Buffer.from(og)).png({ compressionLevel: 9 }).toFile('public/og.png');
await sharp(Buffer.from(icon(180, 22))).png().toFile('public/apple-touch-icon.png');
await sharp(Buffer.from(icon(32, 3))).png().toFile('public/favicon-32.png');
console.log('og.png, apple-touch-icon.png, favicon-32.png written');
