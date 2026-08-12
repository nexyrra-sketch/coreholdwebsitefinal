import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const root = join(process.cwd(), 'out');
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let f = join(root, p);
    try { if ((await stat(f)).isDirectory()) f = join(f, 'index.html'); } catch { f = f + '.html'; }
    res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' });
    res.end(await readFile(f));
  } catch { res.writeHead(404); res.end('nf'); }
});
await new Promise((r) => server.listen(4176, r));
await mkdir('/tmp/qa4', { recursive: true });

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const errors = [];

for (const [name, vp] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 780 }]]) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[${name}] ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`[${name}] PAGEERROR ${e.message}`));
  await page.goto('http://localhost:4176/', { waitUntil: 'networkidle' });

  await page.evaluate(() => document.getElementById('position').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `/tmp/qa4/${name}-position.png` });
  await page.evaluate(() => scrollBy(0, innerHeight * 0.8));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `/tmp/qa4/${name}-position-2.png` });

  await page.evaluate(() => document.getElementById('capabilities').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `/tmp/qa4/${name}-systems.png` });
  await page.evaluate(() => scrollBy(0, innerHeight * 0.8));
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `/tmp/qa4/${name}-systems-2.png` });
  await ctx.close();
}

await browser.close();
server.close();
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'SECTIONS QA CLEAN');
