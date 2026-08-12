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
await new Promise((r) => server.listen(4174, r));
await mkdir('/tmp/qa2', { recursive: true });

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const errors = [];

async function run(name, viewport) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[${name}] ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`[${name}] PAGEERROR ${e.message}`));
  await page.goto('http://localhost:4174/', { waitUntil: 'networkidle' });

  await page.evaluate(() => document.getElementById('demo').scrollIntoView());
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `/tmp/qa2/${name}-1-build.png` });

  // toggle a couple more tools + industry
  await page.click('button:has-text("Retail / e-com")');
  await page.click('button:has-text("INVOICING")').catch(() => {});
  await page.click('.tool-chip:has-text("Invoicing")');
  await page.click('.tool-chip:has-text("Automation tool")');
  // custom tool
  await page.fill('input[aria-label="Add another tool"]', 'Delivery app');
  await page.click('button:has-text("Add")');
  await page.waitForTimeout(700);
  await page.screenshot({ path: `/tmp/qa2/${name}-2-picked.png` });

  await page.click('button:has-text("See what this costs")');
  await page.waitForTimeout(900);
  await page.screenshot({ path: `/tmp/qa2/${name}-3-cost.png` });

  // stop paying
  await page.click('#demo [role="switch"]');
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `/tmp/qa2/${name}-4-dark.png` });

  await page.click('button:has-text("Build my system")');
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `/tmp/qa2/${name}-5-converging.png` });
  await page.waitForTimeout(3200);
  await page.screenshot({ path: `/tmp/qa2/${name}-6-held-running.png` });
  await page.waitForTimeout(5200);
  await page.screenshot({ path: `/tmp/qa2/${name}-7-done.png` });

  // blueprint present?
  const bp = await page.$('img[alt*="System blueprint"]');
  if (!bp) errors.push(`[${name}] blueprint image missing`);
  await page.fill('input[aria-label="Company name for the blueprint"]', 'Al Noor Trading');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `/tmp/qa2/${name}-8-blueprint.png` });

  // send to audit → prefill
  await page.click('button:has-text("Send it with my audit request")');
  await page.waitForTimeout(1500);
  const val = await page.$eval('textarea[name="stack"]', (el) => el.value);
  if (!val.includes('Our stack today')) errors.push(`[${name}] prefill failed: "${val.slice(0, 60)}"`);
  await page.screenshot({ path: `/tmp/qa2/${name}-9-audit-prefilled.png` });

  await ctx.close();
}

await run('demo-desktop', { width: 1440, height: 900 });
await run('demo-mobile', { width: 390, height: 780 });

await browser.close();
server.close();
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'DEMO QA CLEAN');
