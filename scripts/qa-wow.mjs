import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'text/xml', '.txt': 'text/plain' };
const root = join(process.cwd(), 'out');
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let f = join(root, p);
    try { if ((await stat(f)).isDirectory()) f = join(f, 'index.html'); } catch { f = f + '.html'; }
    const data = await readFile(f);
    res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404); res.end('nf'); }
});
await new Promise((r) => server.listen(4175, r));
await mkdir('/tmp/qa3', { recursive: true });

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const errors = [];
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  permissions: ['clipboard-read', 'clipboard-write'],
});
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
await page.goto('http://localhost:4175/', { waitUntil: 'networkidle' });

// —— 5. clock line in hero ——
await page.waitForTimeout(800);
const clock = await page.textContent('#top .mono-label:has-text("IN DUBAI")').catch(() => null);
if (!clock) errors.push('clock line missing');
await page.screenshot({ path: '/tmp/qa3/1-hero-clock.png' });

// —— 3. hero grip test: scroll to held, drag the core ——
const heroH = await page.evaluate(() => document.querySelector('#top > div').offsetHeight - innerHeight);
await page.evaluate((y) => scrollTo(0, y * 0.965), heroH);
await page.waitForTimeout(1200);
await page.mouse.move(720, 450);
await page.mouse.down();
await page.mouse.move(850, 380, { steps: 8 });
await page.waitForTimeout(250);
await page.screenshot({ path: '/tmp/qa3/2-hero-grip-pull.png' });
await page.mouse.up();
await page.waitForTimeout(700);
await page.screenshot({ path: '/tmp/qa3/3-hero-grip-back.png' });

// —— 2. system thread: check nodes activate down the page ——
await page.evaluate(() => document.getElementById('method').scrollIntoView());
await page.waitForTimeout(1200);
const threadOn = await page.$$eval('.thread-node.thread-on', (els) => els.length);
if (threadOn < 3) errors.push(`thread nodes on=${threadOn}, expected ≥3`);
await page.screenshot({ path: '/tmp/qa3/4-thread-method.png' });

// —— 1. kill switch ——
await page.evaluate(() => document.getElementById('kill-heading').scrollIntoView({ block: 'center' }));
await page.waitForTimeout(900);
await page.screenshot({ path: '/tmp/qa3/5-kill-section.png' });
await page.click('button[aria-label="Cut the power to this website"]');
await page.waitForTimeout(2600);
await page.screenshot({ path: '/tmp/qa3/6-site-dead.png' });
const stamps = await page.evaluate(() => document.body.classList.contains('sys-dead'));
if (!stamps) errors.push('sys-dead class missing');
await page.click('button[aria-label="Activate the core to restore the website"]');
await page.waitForTimeout(1200);
const revived = await page.evaluate(() => !document.body.classList.contains('sys-dead'));
if (!revived) errors.push('site did not revive');
await page.screenshot({ path: '/tmp/qa3/7-site-revived.png' });

// —— 7. hold anything: select a sentence ——
await page.evaluate(() => document.getElementById('trade-heading').scrollIntoView({ block: 'center' }));
await page.waitForTimeout(700);
await page.evaluate(() => {
  const el = document.getElementById('trade-heading');
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
});
await page.waitForTimeout(500);
const tagVisible = await page.$eval('.hold-tag', (el) => el.style.display !== 'none').catch(() => false);
if (!tagVisible) errors.push('hold tag did not appear');
await page.screenshot({ path: '/tmp/qa3/8-hold-selection.png' });
await page.click('.hold-tag');
await page.waitForTimeout(400);
const clip = await page.evaluate(() => navigator.clipboard.readText()).catch(() => '');
if (!clip.includes('#held=')) errors.push(`clipboard link wrong: ${clip.slice(0, 60)}`);

// —— 7b. arriving via held link ——
const heldUrl = 'http://localhost:4175/#held=' + encodeURIComponent('A system you own is a position');
const page2 = await ctx.newPage();
page2.on('pageerror', (e) => errors.push('P2 ' + e.message));
await page2.goto(heldUrl, { waitUntil: 'networkidle' });
await page2.waitForTimeout(1800);
await page2.screenshot({ path: '/tmp/qa3/9-held-link-arrival.png' });
await page2.close();

// —— 6. the video: run demo to completion, record ——
await page.evaluate(() => document.getElementById('demo').scrollIntoView());
await page.waitForTimeout(900);
await page.click('button:has-text("See what this costs")');
await page.waitForTimeout(600);
await page.click('button:has-text("Build my system")');
await page.waitForTimeout(4600 + 850 * 6 + 1500);
const videoBtn = await page.$('button:has-text("Get it as a video")');
if (!videoBtn) { errors.push('video button missing'); }
else {
  await videoBtn.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/qa3/10-video-recording.png' });
  await page.waitForTimeout(7500);
  const dl = await page.$('a:has-text("Download your system film")');
  if (!dl) errors.push('video download link missing');
  else {
    const size = await page.evaluate(async () => {
      const a = document.querySelector('a[download^="corehold-system-"]');
      const blob = await fetch(a.href).then((r) => r.blob());
      return blob.size;
    });
    if (size < 50_000) errors.push(`video too small: ${size} bytes`);
    else console.log(`video blob: ${Math.round(size / 1024)} KB`);
  }
  await page.screenshot({ path: '/tmp/qa3/11-video-done.png' });
}

// —— 4. living tab ——
const titleBefore = await page.title();
await page.evaluate(() => {
  Object.defineProperty(document, 'hidden', { value: true, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
});
await page.waitForTimeout(400);
const hiddenTitle = await page.title();
if (!hiddenTitle.includes('still held')) errors.push(`tab title wrong when hidden: ${hiddenTitle}`);
await page.evaluate(() => {
  Object.defineProperty(document, 'hidden', { value: false, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
});
await page.waitForTimeout(400);
const restoredTitle = await page.title();
if (restoredTitle !== titleBefore) errors.push(`tab title not restored: ${restoredTitle}`);

await ctx.close();
await browser.close();
server.close();
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'WOW QA CLEAN');
