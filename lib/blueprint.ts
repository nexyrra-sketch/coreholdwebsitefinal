/**
 * COREHOLD — Blueprint generator.
 *
 * Renders the visitor's stack as a personalized engineering drawing,
 * entirely in the browser: their tools, connected into one held core,
 * title block, reference code. Returns a PNG data URL.
 */

import type { DemoTool } from './demoEngine';

const INK = '#0c0c0a';
const EMBER = '#d9632b';
const EMBER_SOFT = '#f2a06b';
const BONE = '#ede7dc';
const BONE_DIM = '#a9a294';
const MUTE = '#776f61';
const LINE = '#2c2a24';

const W = 1600, H = 1000;

export interface BlueprintInput {
  company: string;
  industry: string;
  tools: DemoTool[];
  monthly: number;
  ref: string;
}

export async function generateBlueprint(input: BlueprintInput): Promise<string> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try { await document.fonts.ready; } catch { /* fonts optional */ }
  }
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const mono = (size: number, weight = 400) => `${weight} ${size}px "IBM Plex Mono", monospace`;
  const disp = (size: number, weight = 500) => `${weight} ${size}px "Space Grotesk Variable", "Space Grotesk", sans-serif`;

  // ——— ground ———
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(237,231,220,0.045)';
  for (let y = 20; y < H; y += 36) {
    for (let x = 20; x < W; x += 36) {
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  }

  // frame + the diagonal grip
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(28.5, 28.5, W - 57, H - 57);
  ctx.strokeStyle = EMBER;
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(140, 31); ctx.lineTo(31, 31); ctx.lineTo(31, 140); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W - 140, H - 31); ctx.lineTo(W - 31, H - 31); ctx.lineTo(W - 31, H - 140); ctx.stroke();

  // ——— header ———
  ctx.fillStyle = EMBER;
  ctx.font = mono(15);
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('C O R E H O L D   —   S Y S T E M   B L U E P R I N T', 72, 92);
  ctx.fillStyle = BONE;
  ctx.font = disp(46, 600);
  const company = (input.company || 'YOUR BUSINESS').toUpperCase().slice(0, 34);
  ctx.fillText(company, 70, 148);
  ctx.fillStyle = MUTE;
  ctx.font = mono(13);
  ctx.fillText(
    `${(input.industry || 'BUSINESS').toUpperCase()} · SCATTERED STACK → ONE OWNED SYSTEM · PROPOSED`,
    72, 180
  );

  // ——— the core (right side) ———
  const mcx = 1170, mcy = 520, M = 330;
  const k = M / 674;
  const ox = mcx - 337 * k, oy = mcy - 337 * k;
  ctx.fillStyle = EMBER;
  ctx.shadowColor = 'rgba(217,99,43,0.5)';
  ctx.shadowBlur = 40;
  ctx.fillRect(mcx - (232 * k) / 2, mcy - (232 * k) / 2, 232 * k, 232 * k);
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.strokeStyle = EMBER;
  ctx.lineWidth = 70 * k;
  ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
  ctx.moveTo(ox + 313 * k, oy + 35 * k); ctx.lineTo(ox + 35 * k, oy + 35 * k); ctx.lineTo(ox + 35 * k, oy + 315 * k);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ox + 361 * k, oy + 639 * k); ctx.lineTo(ox + 639 * k, oy + 639 * k); ctx.lineTo(ox + 639 * k, oy + 361 * k);
  ctx.stroke();

  ctx.fillStyle = BONE;
  ctx.font = mono(14, 500);
  ctx.textAlign = 'center';
  ctx.fillText('ONE CONNECTED SYSTEM', mcx, mcy + M / 2 + 54);
  ctx.fillStyle = MUTE;
  ctx.font = mono(12);
  ctx.fillText('AUTOMATION · AI · PLATFORM · ASSISTANT', mcx, mcy + M / 2 + 80);
  ctx.textAlign = 'left';

  // ——— the tools (left columns) + bus into the core ———
  const tools = input.tools.slice(0, 14);
  const cols = tools.length > 7 ? 2 : 1;
  const rows = Math.ceil(tools.length / cols) || 1;
  const boxW = 280, boxH = 52, gapY = 18;
  const startY = Math.max(250, 520 - (rows * (boxH + gapY)) / 2);
  const busX = 850;

  ctx.font = mono(12);
  tools.forEach((tool, i) => {
    const col = cols === 2 ? Math.floor(i / rows) : 0;
    const row = cols === 2 ? i % rows : i;
    const bx = 72 + col * (boxW + 44);
    const by = startY + row * (boxH + gapY);

    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(18,18,16,0.9)';
    ctx.fillRect(bx, by, boxW, boxH);
    ctx.strokeRect(bx + 0.5, by + 0.5, boxW - 1, boxH - 1);

    ctx.fillStyle = EMBER;
    ctx.fillRect(bx + 14, by + boxH / 2 - 9, 4, 4);
    ctx.fillStyle = BONE;
    ctx.font = mono(13, 500);
    ctx.fillText(tool.label.toUpperCase().slice(0, 24), bx + 28, by + 24);
    ctx.fillStyle = MUTE;
    ctx.font = mono(10);
    ctx.fillText(`WAS: AED ${tool.price}/MO RENTED`, bx + 28, by + 41);
    ctx.fillStyle = EMBER_SOFT;
    ctx.textAlign = 'right';
    ctx.fillText('CONNECTED ✓', bx + boxW - 12, by + 24);
    ctx.textAlign = 'left';

    // connector: box → bus
    const cyy = by + boxH / 2;
    ctx.strokeStyle = 'rgba(217,99,43,0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(bx + boxW, cyy);
    ctx.lineTo(busX, cyy);
    ctx.stroke();
    ctx.fillStyle = EMBER;
    ctx.fillRect(busX - 2.5, cyy - 2.5, 5, 5);
  });

  // bus trunk → core
  const busTop = startY + boxH / 2;
  const busBot = startY + (rows - 1) * (boxH + gapY) + boxH / 2;
  ctx.strokeStyle = 'rgba(217,99,43,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(busX, Math.min(busTop, 520));
  ctx.lineTo(busX, Math.max(busBot, 520));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(busX, 520);
  ctx.lineTo(mcx - M / 2 - 26, 520);
  ctx.stroke();
  ctx.fillStyle = EMBER;
  ctx.beginPath();
  ctx.moveTo(mcx - M / 2 - 12, 520);
  ctx.lineTo(mcx - M / 2 - 26, 513);
  ctx.lineTo(mcx - M / 2 - 26, 527);
  ctx.closePath();
  ctx.fill();

  // ——— title block ———
  const tbY = H - 150;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(29, tbY); ctx.lineTo(W - 29, tbY); ctx.stroke();
  const colXs = [72, 420, 780, 1180];
  ctx.fillStyle = MUTE;
  ctx.font = mono(10);
  ctx.fillText('REFERENCE', colXs[0], tbY + 34);
  ctx.fillText('RENTED TODAY (YOUR ESTIMATES)', colXs[1], tbY + 34);
  ctx.fillText('OWNED INSTEAD', colXs[2], tbY + 34);
  ctx.fillText('STUDIO', colXs[3], tbY + 34);
  ctx.fillStyle = BONE;
  ctx.font = mono(15, 500);
  ctx.fillText(input.ref, colXs[0], tbY + 62);
  ctx.fillText(
    `AED ${fmt(input.monthly)}/MO · AED ${fmt(input.monthly * 12)}/YR · AED ${fmt(input.monthly * 60)}/5YR`,
    colXs[1], tbY + 62
  );
  ctx.fillStyle = EMBER;
  ctx.fillText('ONE BUILD — NO RENEWALS', colXs[2], tbY + 62);
  ctx.fillStyle = BONE;
  ctx.fillText('COREHOLD · DUBAI', colXs[3], tbY + 62);
  ctx.fillStyle = MUTE;
  ctx.font = mono(10);
  ctx.fillText('DRAWN FROM YOUR INPUTS · NOT A QUOTE · THE AUDIT MAKES IT REAL', colXs[0], tbY + 92);
  ctx.fillText('25.2048° N · 55.2708° E', colXs[3], tbY + 92);

  return canvas.toDataURL('image/png');
}

function fmt(n: number) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
