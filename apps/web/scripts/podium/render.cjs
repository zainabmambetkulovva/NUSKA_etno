/* global window, document */
/**
 * Renders the wooden podium of the «Our prices» section (public/images/home/podium-wood.webp)
 * from scripts/podium/podium.html: a three.js scene with procedural wood (no downloads).
 * Prints where each block is (in units of the 726 × 282 stage) for PODIUM in
 * src/components/home/sections.tsx.
 *
 *   node scripts/podium/render.cjs          podium  → public/images/home/podium-wood.webp
 *   node scripts/podium/render.cjs stump    hero stump → public/images/home/stump-wood.webp
 * (from apps/web; needs Playwright's Chromium). The stump prints the product
 * stand points in units of the 360 × 300 hero composition box.
 */
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const { chromium } = require('playwright');

const root = path.resolve(__dirname, '../..');
const server = http
  .createServer((req, res) => {
    const file = req.url.startsWith('/node_modules/')
      ? path.join(root, req.url)
      : path.join(__dirname, req.url === '/' ? 'podium.html' : req.url);
    if (!file.startsWith(root) || !fs.existsSync(file)) return res.writeHead(404).end();
    res.writeHead(200, { 'content-type': file.endsWith('.js') ? 'text/javascript' : 'text/html' });
    fs.createReadStream(file).pipe(res);
  })
  .listen(0, async () => {
    const browser = await chromium.launch({
      args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    });
    const page = await browser.newPage();
    const scene = process.argv[2] === 'stump' ? 'stump' : '';
    await page.addInitScript(`window.RW = ${scene ? 1600 : 3200}; window.SCENE = '${scene}'`);
    await page.goto(`http://localhost:${server.address().port}/podium.html`);
    await page.waitForFunction(() => window.done === true, null, { timeout: 300000 });
    const { url, layout } = await page.evaluate(() => ({
      url: document.getElementById('c').toDataURL('image/png'),
      layout: window.layout,
    }));
    fs.writeFileSync(path.join(__dirname, 'podium.png'), Buffer.from(url.split(',')[1], 'base64'));
    console.log('podium.png written; convert it to the .webp named above');
    console.log(JSON.stringify(layout, null, 1));
    await browser.close();
    server.close();
  });
