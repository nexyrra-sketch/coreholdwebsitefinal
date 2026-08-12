/** Full mobile parity sweep: screenshot every section at 390×780. */
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
await new Promise((r) => server.listen(4177, r));
await mkdir('/tmp/qam', { recursive: true });

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const errors = [];
const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
await page.goto('http://localhost:4177/', { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
await page.screenshot({ path: '/tmp/qam/01-hero.png' });

// hero held state (readout must be visible now)
const heroH = await page.evaluate(() => document.querySelector('#top > div').offsetHeight - innerHeight);
await page.evaluate((y) => scrollTo(0, y * 0.97), heroH);
await page.waitForTimeout(1300);
await page.screenshot({ path: '/tmp/qam/02-hero-held.png' });

for (const [name, id] of [['03-trade', 'trade'], ['05-position', 'position'], ['06-demo', 'demo'], ['08-systems', 'capabilities'], ['10-method', 'method'], ['12-audit', 'audit']]) {
  await page.evaluate((i) => document.getElementById(i).scrollIntoView({ block: 'start' }), id);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `/tmp/qam/${name}.png` });
  await page.evaluate(() => scrollBy(0, innerHeight * 0.85));
  await page.waitForTimeout(1300);
  await page.screenshot({ path: `/tmp/qam/${name}b.png` });
}

// kill switch on mobile
await page.evaluate(() => document.getElementById('kill-heading').scrollIntoView({ block: 'center' }));
await page.waitForTimeout(800);
await page.click('button[aria-label="Cut the power to this website"]');
await page.waitForTimeout(2400);
await page.screenshot({ path: '/tmp/qam/04-kill-dead.png' });
await page.click('button[aria-label="Activate the core to restore the website"]');
await page.waitForTimeout(900);

// method scroll: verify sticky mini-diagram follows stages
await page.evaluate(() => document.getElementById('method').scrollIntoView());
await page.waitForTimeout(600);
await page.evaluate(() => scrollBy(0, innerHeight * 2.2));
await page.waitForTimeout(1400);
await page.screenshot({ path: '/tmp/qam/11-method-mid.png' });

// footer
await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1000);
await page.screenshot({ path: '/tmp/qam/13-footer.png' });

// horizontal overflow check
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
if (overflow > 2) errors.push(`horizontal overflow: ${overflow}px`);

await ctx.close();
await browser.close();
server.close();
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'MOBILE QA CLEAN');
