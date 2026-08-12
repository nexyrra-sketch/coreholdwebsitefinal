/**
 * Print business card — front + back + standalone QR.
 * 85 × 55 mm at 300 dpi (1004 × 650 px), print-ready PNGs in print/.
 * The QR opens https://corehold.systems/card (error-correction H,
 * with the mark embedded dead-centre — the core, held by the code).
 */
import sharp from 'sharp';
import QRCode from 'qrcode';
import { mkdir } from 'node:fs/promises';

const INK = '#0C0C0A';
const BONE = '#EDE7DC';
const EMBER = '#D9632B';
const MUTE = '#8A8375';
const W = 1004, H = 650;
const CARD_URL = 'https://corehold.systems/card';

const mono = 'IBM Plex Mono, monospace';
const disp = 'Corehold Grotesk, DejaVu Sans, sans-serif';

const mark = (x, y, k, color = EMBER) => `
  <g transform="translate(${x} ${y}) scale(${k})">
    <path fill="${color}" d="M0 0h313v70H70v245H0z"/>
    <rect fill="${color}" x="221" y="221" width="232" height="232"/>
    <path fill="${color}" d="M674 674H361v-70h243V361h70z"/>
  </g>`;

const dots = (color, alpha) => {
  let s = `<g opacity="${alpha}">`;
  for (let y = 26; y < H; y += 40)
    for (let x = 26; x < W; x += 40) s += `<circle cx="${x}" cy="${y}" r="1.6" fill="${color}"/>`;
  return s + '</g>';
};

await mkdir('print', { recursive: true });

/* ————— FRONT ————— */
const front = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${INK}"/>
  ${dots(BONE, 0.05)}
  <path d="M120 42 H42 V120" stroke="${EMBER}" stroke-width="10" fill="none"/>
  <path d="M${W - 120} ${H - 42} H${W - 42} V${H - 120}" stroke="${EMBER}" stroke-width="10" fill="none"/>
  ${mark(72, 96, 0.135)}
  <text x="200" y="128" fill="${BONE}" font-family="${disp}" font-size="30" font-weight="600" letter-spacing="7">COREHOLD</text>
  <text x="200" y="162" fill="${MUTE}" font-family="${mono}" font-size="15" letter-spacing="3">INTELLIGENT SYSTEMS STUDIO — DUBAI</text>

  <text x="72" y="356" fill="${BONE}" font-family="${disp}" font-size="64" font-weight="600" letter-spacing="0">Ghassan Adil</text>
  <text x="74" y="400" fill="${EMBER}" font-family="${mono}" font-size="19" letter-spacing="4">FOUNDER</text>

  <text x="72" y="500" fill="${MUTE}" font-family="${mono}" font-size="15" letter-spacing="2">MOBILE / WHATSAPP</text>
  <text x="72" y="530" fill="${BONE}" font-family="${mono}" font-size="21" letter-spacing="1">+971 50 395 3988</text>
  <text x="72" y="576" fill="${MUTE}" font-family="${mono}" font-size="15" letter-spacing="2">EMAIL</text>
  <text x="72" y="606" fill="${BONE}" font-family="${mono}" font-size="21" letter-spacing="1">audit@corehold.systems</text>

  <text x="${W - 72}" y="606" text-anchor="end" fill="${EMBER}" font-family="${mono}" font-size="18" letter-spacing="2">corehold.systems</text>
  <text x="${W - 72}" y="576" text-anchor="end" fill="${MUTE}" font-family="${mono}" font-size="14" letter-spacing="2">OWN IT. DON'T RENT IT.</text>
</svg>`;
await sharp(Buffer.from(front)).png().toFile('print/card-front.png');

/* ————— QR (ink modules on bone, mark held in the centre) ————— */
const qrBuf = await QRCode.toBuffer(CARD_URL, {
  errorCorrectionLevel: 'H',
  margin: 0,
  width: 400,
  color: { dark: INK, light: BONE },
});
const tile = 96;
const qrTile = `
<svg xmlns="http://www.w3.org/2000/svg" width="${tile}" height="${tile}">
  <rect width="${tile}" height="${tile}" fill="${BONE}"/>
  ${mark(14, 14, (tile - 28) / 674)}
</svg>`;
const qrWithMark = await sharp(qrBuf)
  .composite([{ input: Buffer.from(qrTile), left: Math.round((400 - tile) / 2), top: Math.round((400 - tile) / 2) }])
  .png()
  .toBuffer();

/* ————— BACK (light face, built to scan) ————— */
const backBase = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${BONE}"/>
  ${dots(INK, 0.06)}
  <path d="M118 40 H40 V118" stroke="${INK}" stroke-width="10" fill="none"/>
  <path d="M${W - 118} ${H - 40} H${W - 40} V${H - 118}" stroke="${INK}" stroke-width="10" fill="none"/>
  <text x="${W / 2}" y="112" text-anchor="middle" fill="${INK}" font-family="${mono}" font-size="17" letter-spacing="5">SCAN — THE SYSTEM IS LIVE</text>
  <text x="${W / 2}" y="${H - 84}" text-anchor="middle" fill="${INK}" font-family="${mono}" font-size="17" letter-spacing="4">corehold.systems/card</text>
</svg>`;
await sharp(Buffer.from(backBase))
  .composite([{ input: qrWithMark, left: Math.round((W - 400) / 2), top: Math.round((H - 400) / 2) + 10 }])
  .png()
  .toFile('print/card-back.png');

/* standalone QR for anything else (stickers, decks, email signature) */
await sharp(qrWithMark).png().toFile('print/card-qr.png');

console.log('print/card-front.png, print/card-back.png, print/card-qr.png written');
