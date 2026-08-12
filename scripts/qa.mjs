import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'text/xml', '.txt': 'text/plain', '.ico': 'image/x-icon' };
const root = join(process.cwd(), 'out');

const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let f = join(root, p);
    try { if ((await stat(f)).isDirectory()) f = join(f, 'index.html'); }
    catch { f = f + '.html'; }
    const data = await readFile(f);
    res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('not found');
  }
});
await new Promise((r) => server.listen(4173, r));

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const errors = [];

async function shoot(name, viewport, opts = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: opts.reduced ? 'reduce' : 'no-preference', hasTouch: !!opts.touch });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[${name}] ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`[${name}] PAGEERROR ${e.message}`));
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  for (const [label, y] of opts.stops || [['top', 0]]) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(opts.settle ?? 900);
    await page.mouse.move(viewport.width * 0.7, viewport.height * 0.4);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `/tmp/qa/${name}-${label}.png` });
  }
  await ctx.close();
}

import { mkdir } from 'node:fs/promises';
await mkdir('/tmp/qa', { recursive: true });

const vh = 900;
const desktopStops = [
  ['00-top', 0],
  ['01-scatter', Math.round(vh * 0.6)],
  ['02-linking', Math.round(vh * 2.2 * 0.55)],
  ['03-resolve', Math.round(vh * 2.2 * 0.78)],
  ['04-held', Math.round(vh * 2.2 * 0.99)],
  ['05-trade', 99999],
];
await shoot('desktop', { width: 1440, height: vh }, { stops: desktopStops });

// find section offsets precisely for the rest
const ctx2 = await browser.newContext({ viewport: { width: 1440, height: vh } });
const page2 = await ctx2.newPage();
page2.on('console', (m) => { if (m.type() === 'error') errors.push(`[d2] ${m.text()}`); });
page2.on('pageerror', (e) => errors.push(`[d2] PAGEERROR ${e.message}`));
await page2.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
const offs = await page2.evaluate(() => {
  const o = {};
  for (const id of ['trade', 'capabilities', 'method', 'audit']) {
    o[id] = document.getElementById(id).offsetTop;
  }
  o.doc = document.documentElement.scrollHeight;
  return o;
});
for (const [id, y] of Object.entries(offs)) {
  if (id === 'doc') continue;
  await page2.evaluate((yy) => window.scrollTo(0, yy - 80), y);
  await page2.waitForTimeout(1100);
  await page2.screenshot({ path: `/tmp/qa/desktop-sec-${id}.png` });
}
// switch interaction
await page2.evaluate((yy) => window.scrollTo(0, yy - 80), offs.trade);
await page2.waitForTimeout(800);
await page2.click('[role="switch"]');
await page2.waitForTimeout(1200);
await page2.screenshot({ path: `/tmp/qa/desktop-switch-off.png` });
// form submit
await page2.evaluate((yy) => window.scrollTo(0, yy - 80), offs.audit);
await page2.fill('input[name="name"]', 'Test Person');
await page2.fill('input[name="email"]', 'test@example.com');
await page2.fill('textarea[name="stack"]', 'CRM, sheets, five subscriptions');
await page2.click('button[type="submit"]');
await page2.waitForTimeout(1600);
await page2.screenshot({ path: `/tmp/qa/desktop-form-done.png` });
console.log('offsets', JSON.stringify(offs));
await ctx2.close();

// mobile
const mvh = 780;
await shoot('mobile', { width: 390, height: mvh }, {
  touch: true,
  stops: [
    ['00-top', 0],
    ['02-linking', Math.round(mvh * 1.6 * 0.55)],
    ['04-held', Math.round(mvh * 1.6 * 0.99)],
    ['06-mid', 99999],
  ],
});

// reduced motion
await shoot('reduced', { width: 1440, height: vh }, { reduced: true, stops: [['top', 0], ['bottom', 99999]] });

await browser.close();
server.close();
console.log(errors.length ? 'CONSOLE ERRORS:\n' + errors.join('\n') : 'NO CONSOLE ERRORS');
